#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Second Me Windows - ストリーミングAPIアップデート
リアルタイムレスポンスと拡張設定機能を追加
"""

import os
import sys
import json
import logging
import requests
import uuid
import re
import subprocess
import shutil
import time
from datetime import datetime
from flask import Flask, request, jsonify, Response, stream_with_context, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
from werkzeug.utils import secure_filename

# トレーニングデータ管理モジュールをインポート
import training_manager

# 環境変数の読み込み
load_dotenv()

# ロギングの設定
log_level = os.getenv('LOG_LEVEL', 'INFO')
logging.basicConfig(
    level=getattr(logging, log_level),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(os.path.join('logs', 'backend.log'))
    ]
)
logger = logging.getLogger(__name__)

# Flaskアプリケーションの設定
app = Flask(__name__)
CORS(app)  # クロスオリジンリソース共有を有効化

# ポート設定
PORT = int(os.getenv('LOCAL_APP_PORT', 8002))

# モデルのディレクトリパス
MODELS_DIR = os.getenv('MODELS_DIR', os.path.join(os.getcwd(), 'models'))

# プロファイルディレクトリパス
PROFILES_DIR = os.getenv('PROFILES_DIR', os.path.join(os.getcwd(), 'profiles'))

# WorkSpaceディレクトリパス
WORKSPACE_DIR = os.getenv('WORKSPACE_DIR', os.path.join(os.getcwd(), 'WorkSpace'))

# トレーニングディレクトリパス
TRAINING_DIR = os.getenv('TRAINING_DIR', os.path.join(os.getcwd(), 'training'))

# 現在選択されているモデル
SELECTED_MODEL_PATH = os.getenv('SELECTED_MODEL_PATH', '')

# 現在のアクティブプロファイル
ACTIVE_PROFILE = os.getenv('ACTIVE_PROFILE', '')

# llama.cppのパス
LLAMACPP_PATH = os.getenv('LLAMACPP_PATH', os.path.join(os.getcwd(), 'dependencies', 'llama.cpp'))

# Windows環境かどうかを確認
IS_WINDOWS = sys.platform.startswith('win')

# Windows環境では.exe拡張子を追加
# Windows環境ではllama-server.exe, それ以外ではmainを使用
if IS_WINDOWS:
    LLAMACPP_MAIN = os.path.join(LLAMACPP_PATH, 'llama-server.exe')
else:
    LLAMACPP_MAIN = os.path.join(LLAMACPP_PATH, 'main')

# llama-serverのポート設定
LLAMA_SERVER_PORT = int(os.getenv('LLAMA_SERVER_PORT', 8080))

# llama-serverのURL
LLAMA_SERVER_URL = f"http://localhost:{LLAMA_SERVER_PORT}"

# デフォルトのモデルパラメータ設定
DEFAULT_MODEL_PARAMS = {
    "temperature": 0.7,
    "top_p": 0.9,
    "top_k": 40,
    "n_predict": 1024,
    "repeat_penalty": 1.1,
    "presence_penalty": 0.0,
    "frequency_penalty": 0.0,
    "stop": ["[/INST]", "</s>"],
    "context_size": 2048,
    "gpu_layers": 1
}

# ユーザー設定のモデルパラメータ（プロファイルごと）
MODEL_PARAMS = {}

# ファイルアップロード設定
UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', os.path.join(os.getcwd(), 'uploads'))
ALLOWED_EXTENSIONS = {'pdf', 'txt', 'doc', 'docx', 'csv', 'json', 'md', 'py', 'js', 'ts', 'html', 'css'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB制限

# サーバー起動時間
START_TIME = datetime.now()

# サーバープロセス
llama_server_process = None


@app.route('/health', methods=['GET'])
@app.route('/api/health', methods=['GET'])
def health_check():
    """ヘルスチェックエンドポイント"""
    uptime = (datetime.now() - START_TIME).total_seconds()
    return jsonify({
        'status': 'ok',
        'uptime': uptime,
        'version': '1.1.0-windows'
    })


@app.route('/api/info', methods=['GET'])
def get_info():
    """システム情報エンドポイント"""
    llama_server_status = check_llama_server()
    
    return jsonify({
        'environment': {
            'python_version': sys.version,
            'os': sys.platform,
            'port': PORT,
            'log_level': log_level
        },
        'model': {
            'path': SELECTED_MODEL_PATH,
            'loaded': bool(SELECTED_MODEL_PATH and os.path.exists(SELECTED_MODEL_PATH))
        },
        'llama_server': {
            'status': 'running' if llama_server_status else 'stopped',
            'port': LLAMA_SERVER_PORT,
            'url': LLAMA_SERVER_URL
        },
        'profile': {
            'active': ACTIVE_PROFILE,
            'exists': bool(ACTIVE_PROFILE and os.path.exists(os.path.join(PROFILES_DIR, ACTIVE_PROFILE)))
        },
        'model_params': get_current_model_params(),
        'workspace': {
            'enabled': True,
            'profile_isolation': True,
            'path': get_current_workspace_path()
        },
        'training': {
            'enabled': True,
            'active_processes': len(training_manager.TRAINING_PROCESSES),
            'path': training_manager.get_current_training_path(PROFILES_DIR, ACTIVE_PROFILE)
        },
        'system': {
            'start_time': START_TIME.isoformat(),
            'uptime': (datetime.now() - START_TIME).total_seconds()
        }
    })


def get_current_workspace_path():
    """現在のワークスペースパスを取得"""
    if not ACTIVE_PROFILE:
        return None
    
    workspace_path = os.path.join(WORKSPACE_DIR, ACTIVE_PROFILE)
    if not os.path.exists(workspace_path):
        try:
            os.makedirs(workspace_path)
        except Exception as e:
            logger.error(f"Failed to create workspace directory: {str(e)}")
            return None
    
    return workspace_path


def get_current_model_params():
    """現在のモデルパラメータを取得"""
    if ACTIVE_PROFILE and ACTIVE_PROFILE in MODEL_PARAMS:
        return MODEL_PARAMS[ACTIVE_PROFILE]
    return DEFAULT_MODEL_PARAMS


def check_llama_server():
    """llama-serverが起動しているか確認"""
    try:
        response = requests.get(f"{LLAMA_SERVER_URL}/health", timeout=1)
        return response.status_code == 200
    except:
        return False


def start_llama_server():
    """llama-serverを起動"""
    global llama_server_process
    
    # すでに起動している場合は何もしない
    if check_llama_server():
        logger.info("llama-server is already running")
        return True
    
    # モデルが選択されていない場合はエラー
    if not SELECTED_MODEL_PATH or not os.path.exists(SELECTED_MODEL_PATH):
        logger.error("No model selected or model file not found")
        return False
    
    # llama-server.exeが存在しない場合はエラー
    if not os.path.exists(LLAMACPP_MAIN):
        logger.error(f"llama-server.exe not found at {LLAMACPP_MAIN}")
        return False
    
    # 現在のパラメータを取得
    params = get_current_model_params()
    
    # サーバー起動コマンド
    cmd = [
        LLAMACPP_MAIN,
        "-m", SELECTED_MODEL_PATH,
        "--host", "127.0.0.1",
        "--port", str(LLAMA_SERVER_PORT),
        "-c", str(params["context_size"]),
        "--log-level", "info",
        "-ngl", str(params["gpu_layers"])
    ]
    
    logger.info(f"Starting llama-server with command: {' '.join(cmd)}")
    
    # llama-serverをバックグラウンドで起動
    try:
        llama_server_process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding='utf-8'
        )
        
        # サーバーが起動するまで少し待機
        for _ in range(10):  # 最大10秒待機
            time.sleep(1)
            if check_llama_server():
                logger.info("llama-server started successfully")
                return True
        
        logger.error("Failed to start llama-server within timeout")
        return False
    except Exception as e:
        logger.exception(f"Error starting llama-server: {str(e)}")
        return False


@app.route('/api/model_params', methods=['GET'])
def get_model_params():
    """モデルパラメータ取得エンドポイント"""
    return jsonify({
        'params': get_current_model_params(),
        'default_params': DEFAULT_MODEL_PARAMS
    })


@app.route('/api/model_params', methods=['POST'])
def update_model_params():
    """モデルパラメータ更新エンドポイント"""
    global MODEL_PARAMS
    
    # アクティブなプロファイルが必要
    if not ACTIVE_PROFILE:
        return jsonify({'error': 'No active profile selected'}), 400
    
    # リクエストデータの取得
    data = request.json
    if not data:
        return jsonify({'error': 'No parameters provided'}), 400
    
    # 現在のパラメータを取得
    current_params = get_current_model_params().copy()
    
    # 更新可能なパラメータのリスト
    allowed_params = [
        "temperature", "top_p", "top_k", "n_predict", "repeat_penalty",
        "presence_penalty", "frequency_penalty", "context_size", "gpu_layers"
    ]
    
    # パラメータの検証と更新
    for param in allowed_params:
        if param in data:
            # パラメータの型と範囲をチェック
            if param == "temperature":
                value = float(data[param])
                if value < 0.0 or value > 2.0:
                    return jsonify({'error': f"Invalid {param} value: must be between 0.0 and 2.0"}), 400
                current_params[param] = value
            
            elif param in ["top_p", "top_k", "repeat_penalty", "presence_penalty", "frequency_penalty"]:
                value = float(data[param])
                if value < 0.0:
                    return jsonify({'error': f"Invalid {param} value: must be positive"}), 400
                current_params[param] = value
            
            elif param in ["n_predict", "context_size", "gpu_layers"]:
                value = int(data[param])
                if value <= 0:
                    return jsonify({'error': f"Invalid {param} value: must be positive"}), 400
                current_params[param] = value
    
    # stop単語リストの更新（オプション）
    if "stop" in data and isinstance(data["stop"], list):
        current_params["stop"] = data["stop"]
    
    # パラメータを保存
    MODEL_PARAMS[ACTIVE_PROFILE] = current_params
    
    # 設定ファイルにも保存（プロファイルのconfig.json）
    try:
        config_path = os.path.join(PROFILES_DIR, ACTIVE_PROFILE, 'config.json')
        if os.path.exists(config_path):
            with open(config_path, 'r', encoding='utf-8') as f:
                config = json.load(f)
            
            # model_paramsを追加または更新
            config['model_params'] = current_params
            config['updated_at'] = datetime.now().isoformat()
            
            with open(config_path, 'w', encoding='utf-8') as f:
                json.dump(config, f, ensure_ascii=False, indent=2)
    except Exception as e:
        logger.error(f"Failed to save model parameters to profile config: {str(e)}")
    
    # パラメータに基づいてllama-serverの再起動が必要か判断
    restart_required = False
    if "context_size" in data or "gpu_layers" in data:
        restart_required = True
    
    return jsonify({
        'status': 'success',
        'params': current_params,
        'restart_required': restart_required
    })


@app.route('/api/llama_server/restart', methods=['POST'])
def restart_llama_server():
    """llama-serverを再起動するエンドポイント"""
    global llama_server_process
    
    # 現在のプロセスを停止
    if llama_server_process:
        try:
            llama_server_process.terminate()
            llama_server_process.wait(timeout=5)
        except:
            # 強制終了（タイムアウトした場合）
            try:
                llama_server_process.kill()
            except:
                pass
        finally:
            llama_server_process = None
    
    # サーバーを再起動
    success = start_llama_server()
    
    return jsonify({
        'status': 'success' if success else 'error',
        'message': 'llama-server restarted successfully' if success else 'Failed to restart llama-server'
    })


@app.route('/api/chat', methods=['POST'])
def chat():
    """
    チャットエンドポイント
    llama.cppを使用してローカルモデルで応答を生成
    """
    data = request.json
    message = data.get('message', '')
    stream = data.get('stream', False)  # ストリーミングモードかどうか
    logger.info(f"Chat request received with message: {message[:50]}... (stream={stream})")
    
    # モデルが選択されているか確認
    if not SELECTED_MODEL_PATH:
        logger.warning("No model selected, returning error message")
        return jsonify({
            'message': "モデルが選択されていません。設定ページでモデルを選択してください。",
            'timestamp': datetime.now().isoformat()
        })
    
    # モデルファイルが存在するか確認
    if not os.path.exists(SELECTED_MODEL_PATH):
        logger.error(f"Selected model file not found: {SELECTED_MODEL_PATH}")
        return jsonify({
            'message': f"選択されたモデルファイルが見つかりません: {SELECTED_MODEL_PATH}",
            'timestamp': datetime.now().isoformat()
        })
    
    # llamacpp実行可能ファイルが存在するか確認
    if not os.path.exists(LLAMACPP_MAIN):
        logger.error(f"llama.cpp executable not found at {LLAMACPP_MAIN}")
        return jsonify({
            'message': "llama.cpp実行ファイルが見つかりません。セットアップを確認してください。",
            'timestamp': datetime.now().isoformat()
        })
    
    try:
        # llama-server.exeを使用する場合（Windowsの場合）
        if IS_WINDOWS and LLAMACPP_MAIN.endswith('llama-server.exe'):
            # llama-serverの起動確認と起動
            server_running = check_llama_server()
            if not server_running:
                server_running = start_llama_server()
            
            if not server_running:
                return jsonify({
                    'message': "llama-serverの起動に失敗しました。セットアップを確認してください。",
                    'timestamp': datetime.now().isoformat()
                })
            
            # 現在のプロファイル名を取得（存在する場合）
            profile_name = ""
            if ACTIVE_PROFILE:
                config_path = os.path.join(PROFILES_DIR, ACTIVE_PROFILE, 'config.json')
                if os.path.exists(config_path):
                    with open(config_path, 'r', encoding='utf-8') as f:
                        config = json.load(f)
                        profile_name = config.get('name', ACTIVE_PROFILE)
            
            # システムプロンプトの設定
            if profile_name:
                system_prompt = f"あなたは{profile_name}です。ユーザーの質問に丁寧に答えてください。"
            else:
                system_prompt = "ユーザーの質問に丁寧に答えてください。"
            
            # 現在のパラメータを取得
            params = get_current_model_params()
            
            # llama-server APIリクエスト用のデータ構築
            chat_data = {
                "stream": stream,
                "n_predict": params["n_predict"],
                "temperature": params["temperature"],
                "stop": params["stop"],
                "repeat_last_n": 256,
                "repeat_penalty": params["repeat_penalty"],
                "top_k": params["top_k"],
                "top_p": params["top_p"],
                "tfs_z": 1.0,
                "typical_p": 1.0,
                "presence_penalty": params["presence_penalty"],
                "frequency_penalty": params["frequency_penalty"],
                "mirostat": 0,
                "mirostat_tau": 5.0,
                "mirostat_eta": 0.1,
                "grammar": "",
                "n_probs": 0,
                "image_data": [],
                "cache_prompt": True,
                "slot_id": -1,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": message}
                ]
            }
            
            # ストリーミングモードの場合
            if stream:
                return stream_chat_response(chat_data)
            
            # 通常モード（一括レスポンス）
            try:
                logger.info(f"Sending chat request to llama-server: {message[:50]}...")
                response = requests.post(
                    f"{LLAMA_SERVER_URL}/v1/chat/completions",
                    json=chat_data,
                    timeout=60  # タイムアウト60秒
                )
                
                if response.status_code == 200:
                    # レスポンス解析
                    response_data = response.json()
                    if "choices" in response_data and len(response_data["choices"]) > 0:
                        chat_response = response_data["choices"][0]["message"]["content"]
                    else:
                        chat_response = "応答の解析中にエラーが発生しました。詳細: " + str(response_data)
                else:
                    chat_response = f"サーバーからエラーレスポンスが返されました。ステータスコード: {response.status_code}"
                    logger.error(f"Error response from llama-server: {response.status_code} - {response.text}")
            except Exception as e:
                chat_response = f"llama-serverとの通信中にエラーが発生しました: {str(e)}"
                logger.exception("Error communicating with llama-server")
                
            return jsonify({
                'message': chat_response,
                'timestamp': datetime.now().isoformat()
            })
        
        # 通常のmain実行ファイルを使用する場合
        else:
            # llama.cppコマンドの構築
            cmd = [
                LLAMACPP_MAIN,
                '-m', SELECTED_MODEL_PATH,
                '-p', prompt,
                '--ctx-size', '2048',
                '--temp', '0.7',
                '--top-p', '0.9',
                '--seed', '-1',
                '-n', '1024',
                '--repeat-penalty', '1.1',
                '-ngl', '1'  # GPUレイヤー数（GPUを使用する場合）
            ]
            
            logger.info(f"Running command: {' '.join(cmd)}")
            
            # サブプロセスとして実行（タイムアウト60秒）
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                encoding='utf-8'
            )
            
            try:
                stdout, stderr = process.communicate(timeout=60)
            except subprocess.TimeoutExpired:
                process.kill()
                logger.error("llama.cpp process timed out")
                return jsonify({
                    'message': "応答生成がタイムアウトしました。再度お試しください。",
                    'timestamp': datetime.now().isoformat()
                })
            
            # エラーチェック
            if process.returncode != 0:
                logger.error(f"llama.cpp process failed with code {process.returncode}: {stderr}")
                return jsonify({
                    'message': f"モデル実行中にエラーが発生しました: {stderr[:200]}...",
                    'timestamp': datetime.now().isoformat()
                })
            
            # 応答の抽出
            assistant_response = ""
            if "[/INST]" in stdout:
                # 最後の[/INST]の後の部分を取得
                assistant_response = stdout.split("[/INST]")[-1].strip()
            else:
                assistant_response = stdout.strip()
            
            # 応答が空の場合
            if not assistant_response:
                logger.warning("Empty response from llama.cpp")
                return jsonify({
                    'message': "モデルからの応答が空でした。再度お試しください。",
                    'timestamp': datetime.now().isoformat()
                })
            
            # 成功レスポンス
            return jsonify({
                'message': assistant_response,
                'timestamp': datetime.now().isoformat()
            })
    
    except Exception as e:
        logger.exception(f"Error during chat processing: {str(e)}")
        return jsonify({
            'message': f"エラーが発生しました: {str(e)}",
            'timestamp': datetime.now().isoformat()
        })


def stream_chat_response(chat_data):
    """ストリーミングレスポンスのジェネレータ"""
    def generate():
        try:
            # ストリーミングリクエストを送信
            with requests.post(
                f"{LLAMA_SERVER_URL}/v1/chat/completions",
                json=chat_data,
                stream=True,
                timeout=60
            ) as response:
                # エラーチェック
                if response.status_code != 200:
                    error_msg = f"サーバーからエラーレスポンスが返されました。ステータスコード: {response.status_code}"
                    logger.error(f"Error response from llama-server: {response.status_code}")
                    yield f"data: {json.dumps({'text': error_msg})}\n\n"
                    return
                
                # ストリーミングレスポンスを処理
                buffer = ""
                for line in response.iter_lines():
                    if line:
                        line_text = line.decode('utf-8')
                        if line_text.startswith('data: '):
                            data_str = line_text[6:]  # 'data: ' を除去
                            try:
                                data = json.loads(data_str)
                                if 'choices' in data and len(data['choices']) > 0:
                                    if 'delta' in data['choices'][0] and 'content' in data['choices'][0]['delta']:
                                        text = data['choices'][0]['delta']['content']
                                        buffer += text
                                        yield f"data: {json.dumps({'text': text, 'buffer': buffer})}\n\n"
                                    elif 'finish_reason' in data['choices'][0] and data['choices'][0]['finish_reason'] == 'stop':
                                        yield f"data: {json.dumps({'text': '', 'buffer': buffer, 'finish': True})}\n\n"
                            except json.JSONDecodeError:
                                logger.error(f"Invalid JSON in streaming response: {data_str}")
                                continue
                
                # 完了シグナルを送信
                yield f"data: {json.dumps({'text': '', 'buffer': buffer, 'finish': True})}\n\n"
        
        except Exception as e:
            logger.exception(f"Error in streaming response: {str(e)}")
            error_msg = f"ストリーミング中にエラーが発生しました: {str(e)}"
            yield f"data: {json.dumps({'text': error_msg, 'error': True})}\n\n"
    
    return Response(stream_with_context(generate()), mimetype='text/event-stream')


@app.route('/api/models', methods=['GET'])
def get_models():
    """
    /modelsディレクトリから利用可能なモデルファイルの一覧を取得
    """
    try:
        # /modelsディレクトリが存在しない場合は作成
        if not os.path.exists(MODELS_DIR):
            os.makedirs(MODELS_DIR)
            return jsonify({'models': []})
        
        # モデルファイル検索パターン
        model_patterns = [
            r'.*\.gguf$',  # llama.cpp モデル（GGUF形式）
            r'.*\.bin$',   # 一般的なバイナリモデル
            r'.*\.pt$',    # PyTorch モデル
            r'.*\.ggml$'   # 旧GGML形式モデル
        ]
        
        models = []
        
        # ディレクトリ内のファイルを検索
        for root, dirs, files in os.walk(MODELS_DIR):
            for file in files:
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, MODELS_DIR)
                
                # ファイルが指定パターンに一致するか確認
                if any(re.match(pattern, file) for pattern in model_patterns):
                    # ファイルサイズをGB単位で計算
                    size_bytes = os.path.getsize(file_path)
                    size_gb = round(size_bytes / (1024 * 1024 * 1024), 2)
                    
                    # モデル情報を追加
                    model_info = {
                        'name': file,
                        'path': file_path,
                        'rel_path': rel_path,
                        'size': size_gb,
                        'size_bytes': size_bytes,
                        'modified_at': datetime.fromtimestamp(os.path.getmtime(file_path)).isoformat(),
                        'format': 'GGUF' if file.endswith('.gguf') else (
                                  'GGML' if file.endswith('.ggml') else (
                                  'PyTorch' if file.endswith('.pt') else 'Binary'
                                  ))
                    }
                    
                    # 現在選択されているモデルかどうかを追加
                    if SELECTED_MODEL_PATH and os.path.samefile(file_path, SELECTED_MODEL_PATH):
                        model_info['selected'] = True
                    else:
                        model_info['selected'] = False
                    
                    models.append(model_info)
        
        # 修正日時でソート（新しい順）
        models = sorted(models, key=lambda x: x['modified_at'], reverse=True)
        
        return jsonify({'models': models})
    
    except Exception as e:
        logger.exception(f"Error while scanning for models: {str(e)}")
        return jsonify({'error': str(e), 'models': []}), 500


@app.route('/api/models/info', methods=['GET'])
def get_model_info():
    """特定のモデル情報を取得するエンドポイント"""
    try:
        model_path = request.args.get('path')
        
        if not model_path:
            return jsonify({'error': 'Model path is required'}), 400
        
        # モデルが存在するか確認
        if not os.path.exists(model_path):
            return jsonify({'error': f'Model file not found at {model_path}'}), 404
        
        # ファイルサイズをGB単位で計算
        size_bytes = os.path.getsize(model_path)
        size_gb = round(size_bytes / (1024 * 1024 * 1024), 2)
        
        # モデル情報を作成
        model_info = {
            'name': os.path.basename(model_path),
            'path': model_path,
            'rel_path': os.path.relpath(model_path, MODELS_DIR) if model_path.startswith(MODELS_DIR) else model_path,
            'size': size_gb,
            'size_bytes': size_bytes,
            'modified_at': datetime.fromtimestamp(os.path.getmtime(model_path)).isoformat(),
            'format': 'GGUF' if model_path.endswith('.gguf') else (
                      'GGML' if model_path.endswith('.ggml') else (
                      'PyTorch' if model_path.endswith('.pt') else 'Binary'
                      )),
            'selected': (SELECTED_MODEL_PATH and os.path.samefile(model_path, SELECTED_MODEL_PATH))
        }
        
        # モデルメタデータの取得（GGUFモデルのみ）
        if model_path.endswith('.gguf') and os.path.exists(LLAMACPP_MAIN):
            try:
                # llama-server.exeを使用してモデルメタデータを取得
                cmd = [
                    LLAMACPP_MAIN,
                    "--model-info",
                    model_path
                ]
                
                process = subprocess.Popen(
                    cmd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                    encoding='utf-8'
                )
                
                stdout, stderr = process.communicate(timeout=30)
                
                if process.returncode == 0:
                    # メタデータを解析
                    metadata = {}
                    lines = stdout.strip().split('\n')
                    for line in lines:
                        if ':' in line:
                            key, value = line.split(':', 1)
                            metadata[key.strip()] = value.strip()
                    
                    model_info['metadata'] = metadata
            except:
                logger.warning(f"Failed to get metadata for model {model_path}")
        
        return jsonify({'model': model_info})
    
    except Exception as e:
        logger.exception(f"Error getting model info: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/models/set', methods=['POST'])
def set_model():
    """モデルを選択するエンドポイント"""
    try:
        data = request.json
        model_path = data.get('model_path')
        
        if not model_path:
            return jsonify({'error': 'Model path is required'}), 400
        
        # モデルが存在するか確認
        if not os.path.exists(model_path):
            return jsonify({'error': f'Model file not found at {model_path}'}), 404
        
        # llama-serverを再起動する必要があるか確認
        restart_required = False
        if SELECTED_MODEL_PATH != model_path and check_llama_server():
            restart_required = True
        
        # グローバル変数を更新
        global SELECTED_MODEL_PATH
        SELECTED_MODEL_PATH = model_path
        
        # アクティブなプロファイルがある場合は設定を更新
        if ACTIVE_PROFILE:
            profile_config_path = os.path.join(PROFILES_DIR, ACTIVE_PROFILE, 'config.json')
            if os.path.exists(profile_config_path):
                try:
                    with open(profile_config_path, 'r', encoding='utf-8') as f:
                        config = json.load(f)
                    
                    config['model_path'] = model_path
                    
                    with open(profile_config_path, 'w', encoding='utf-8') as f:
                        json.dump(config, f, ensure_ascii=False, indent=2)
                except Exception as e:
                    logger.error(f"Failed to update profile config: {str(e)}")
        
        logger.info(f"Selected model: {model_path}")
        
        # llama-serverを再起動する必要がある場合
        if restart_required:
            # 非同期で再起動
            threading.Thread(target=restart_llama_server).start()
        
        return jsonify({
            'status': 'success',
            'model': {
                'path': model_path,
                'name': os.path.basename(model_path)
            },
            'restart_required': restart_required,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        logger.exception(f"Error while setting model: {str(e)}")
        return jsonify({'error': str(e)}), 500


# アプリケーション起動
if __name__ == '__main__':
    import threading
    
    # ディレクトリ存在確認と作成
    for directory in ['logs', MODELS_DIR, PROFILES_DIR, UPLOAD_FOLDER, WORKSPACE_DIR, 'dependencies']:
        if not os.path.exists(directory):
            os.makedirs(directory)
    
    # llama.cppディレクトリが存在しない場合は作成
    if not os.path.exists(LLAMACPP_PATH):
        os.makedirs(LLAMACPP_PATH)
    
    logger.info(f"Starting Second Me backend on port {PORT}")
    logger.info(f"Log level: {log_level}")
    logger.info(f"Models directory: {MODELS_DIR}")
    logger.info(f"Profiles directory: {PROFILES_DIR}")
    logger.info(f"WorkSpace directory: {WORKSPACE_DIR}")
    
    # llama.cppの実行ファイルの存在確認
    if not os.path.exists(LLAMACPP_MAIN):
        logger.warning(f"llama.cpp executable not found at {LLAMACPP_MAIN}")
    else:
        logger.info(f"llama.cpp executable found at {LLAMACPP_MAIN}")
        
        # llama-serverの自動起動（バックグラウンドで）
        if SELECTED_MODEL_PATH and os.path.exists(SELECTED_MODEL_PATH):
            threading.Thread(target=start_llama_server).start()
    
    # モデルディレクトリの検索
    try:
        model_files = [f for f in os.listdir(MODELS_DIR) if f.endswith(('.gguf', '.bin', '.pt', '.ggml'))]
        if model_files:
            logger.info(f"Found {len(model_files)} model files in {MODELS_DIR}")
            
            # 選択されたモデルが設定されていなければ、最初のモデルを選択
            if not SELECTED_MODEL_PATH:
                SELECTED_MODEL_PATH = os.path.join(MODELS_DIR, model_files[0])
                logger.info(f"Auto-selected model: {SELECTED_MODEL_PATH}")
        else:
            logger.warning(f"No model files found in {MODELS_DIR}")
    except Exception as e:
        logger.warning(f"Error scanning models directory: {str(e)}")
    
    # プロファイルディレクトリの検索とモデルパラメータのロード
    try:
        profiles = []
        if os.path.exists(PROFILES_DIR):
            for item in os.listdir(PROFILES_DIR):
                profile_dir = os.path.join(PROFILES_DIR, item)
                config_path = os.path.join(profile_dir, 'config.json')
                if os.path.isdir(profile_dir) and os.path.exists(config_path):
                    profiles.append(item)
                    
                    # モデルパラメータをロード
                    try:
                        with open(config_path, 'r', encoding='utf-8') as f:
                            config = json.load(f)
                            if 'model_params' in config:
                                MODEL_PARAMS[item] = config['model_params']
                    except:
                        pass
        
        if profiles:
            logger.info(f"Found {len(profiles)} profiles")
            
            # アクティブなプロファイルが設定されていなければ、最初のプロファイルを選択
            if not ACTIVE_PROFILE:
                ACTIVE_PROFILE = profiles[0]
                logger.info(f"Auto-selected profile: {ACTIVE_PROFILE}")
                
                # プロファイルのモデルも選択
                try:
                    with open(os.path.join(PROFILES_DIR, ACTIVE_PROFILE, 'config.json'), 'r', encoding='utf-8') as f:
                        config = json.load(f)
                    model_path = config.get('model_path', '')
                    if model_path and os.path.exists(model_path):
                        SELECTED_MODEL_PATH = model_path
                        logger.info(f"Using profile's model: {SELECTED_MODEL_PATH}")
                except Exception as e:
                    logger.error(f"Failed to load profile config: {str(e)}")
        else:
            logger.info("No profiles found, will create default profile if needed")
    except Exception as e:
        logger.warning(f"Error scanning profiles directory: {str(e)}")
    
    # シャットダウン時の処理
    def cleanup():
        global llama_server_process
        if llama_server_process:
            logger.info("Shutting down llama-server...")
            try:
                llama_server_process.terminate()
                llama_server_process.wait(timeout=5)
            except:
                try:
                    llama_server_process.kill()
                except:
                    pass
    
    # atexit登録
    import atexit
    atexit.register(cleanup)
    
    # Flaskアプリケーション起動
    app.run(host='0.0.0.0', port=PORT, debug=False)
