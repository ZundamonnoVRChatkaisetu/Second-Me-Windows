#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Second Me Windows バックエンドアプリケーション
基本的なAPIエンドポイントを提供するFlaskアプリケーション
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
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory
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

# ファイルアップロード設定
UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', os.path.join(os.getcwd(), 'uploads'))
ALLOWED_EXTENSIONS = {'pdf', 'txt', 'doc', 'docx', 'csv', 'json', 'md', 'py', 'js', 'ts', 'html', 'css'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB制限

# サーバー起動時間
START_TIME = datetime.now()


@app.route('/health', methods=['GET'])
@app.route('/api/health', methods=['GET'])  # フロントエンドの期待するエンドポイントを追加
def health_check():
    """ヘルスチェックエンドポイント"""
    uptime = (datetime.now() - START_TIME).total_seconds()
    return jsonify({
        'status': 'ok',
        'uptime': uptime,
        'version': '1.0.0-windows'
    })


@app.route('/api/info', methods=['GET'])
def get_info():
    """システム情報エンドポイント"""
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
        'profile': {
            'active': ACTIVE_PROFILE,
            'exists': bool(ACTIVE_PROFILE and os.path.exists(os.path.join(PROFILES_DIR, ACTIVE_PROFILE)))
        },
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


@app.route('/api/echo', methods=['POST'])
def echo():
    """エコーエンドポイント - 受け取ったデータをそのまま返す"""
    data = request.json
    logger.info(f"Echo request received: {data}")
    return jsonify({
        'received': data,
        'timestamp': datetime.now().isoformat()
    })


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
                        'modified_at': datetime.fromtimestamp(os.path.getmtime(file_path)).isoformat()
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
        
        return jsonify({
            'status': 'success',
            'model': {
                'path': model_path,
                'name': os.path.basename(model_path)
            },
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        logger.exception(f"Error while setting model: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/profiles', methods=['GET'])
def get_profiles():
    """
    プロファイル一覧を取得するエンドポイント
    """
    try:
        # プロファイルディレクトリが存在しない場合は作成
        if not os.path.exists(PROFILES_DIR):
            os.makedirs(PROFILES_DIR)
            return jsonify({'profiles': []})
        
        profiles = []
        
        # ディレクトリ内のプロファイルを検索
        for item in os.listdir(PROFILES_DIR):
            profile_dir = os.path.join(PROFILES_DIR, item)
            
            # ディレクトリかつconfig.jsonが存在する場合のみプロファイルとして扱う
            if os.path.isdir(profile_dir) and os.path.exists(os.path.join(profile_dir, 'config.json')):
                try:
                    # 設定ファイルの読み込み
                    with open(os.path.join(profile_dir, 'config.json'), 'r', encoding='utf-8') as f:
                        config = json.load(f)
                    
                    # WorkSpaceディレクトリ確認
                    workspace_dir = os.path.join(WORKSPACE_DIR, item)
                    has_workspace = os.path.exists(workspace_dir)
                    
                    # プロファイル情報を作成
                    profile_info = {
                        'id': item,
                        'name': config.get('name', item),
                        'description': config.get('description', ''),
                        'created_at': config.get('created_at', ''),
                        'updated_at': config.get('updated_at', ''),
                        'model_path': config.get('model_path', ''),
                        'training_count': config.get('training_count', 0),
                        'memories_count': config.get('memories_count', 0),
                        'has_workspace': has_workspace,
                        'active': (ACTIVE_PROFILE == item)
                    }
                    
                    profiles.append(profile_info)
                except Exception as e:
                    logger.error(f"Error reading profile {item}: {str(e)}")
        
        # 作成日時でソート（新しい順）
        profiles = sorted(profiles, key=lambda x: x.get('created_at', ''), reverse=True)
        
        return jsonify({'profiles': profiles})
    
    except Exception as e:
        logger.exception(f"Error while scanning for profiles: {str(e)}")
        return jsonify({'error': str(e), 'profiles': []}), 500


@app.route('/api/profiles/create', methods=['POST'])
def create_profile():
    """
    新しいプロファイルを作成するエンドポイント
    """
    try:
        data = request.json
        name = data.get('name', '').strip()
        description = data.get('description', '').strip()
        base_model_path = data.get('model_path', '')
        
        # 名前が必須
        if not name:
            return jsonify({'error': 'Profile name is required'}), 400
        
        # プロファイルIDの生成（名前をベースにしたスラッグ）
        profile_id = re.sub(r'[^a-z0-9_]', '_', name.lower())
        profile_id = f"{profile_id}_{uuid.uuid4().hex[:8]}"  # 一意性を確保するためにUUIDを追加
        
        # プロファイルディレクトリのパス
        profile_dir = os.path.join(PROFILES_DIR, profile_id)
        
        # ディレクトリが既に存在する場合はエラー
        if os.path.exists(profile_dir):
            return jsonify({'error': f'Profile directory already exists: {profile_id}'}), 400
        
        # プロファイルディレクトリ構造を作成
        os.makedirs(profile_dir)
        os.makedirs(os.path.join(profile_dir, 'memories'))
        os.makedirs(os.path.join(profile_dir, 'training_data'))
        
        # WorkSpaceディレクトリも作成
        workspace_dir = os.path.join(WORKSPACE_DIR, profile_id)
        os.makedirs(workspace_dir, exist_ok=True)
        
        # 現在の日時
        now = datetime.now().isoformat()
        
        # 設定ファイルの作成
        config = {
            'name': name,
            'description': description,
            'created_at': now,
            'updated_at': now,
            'model_path': base_model_path,
            'training_count': 0,
            'memories_count': 0,
            'workspace_path': workspace_dir
        }
        
        with open(os.path.join(profile_dir, 'config.json'), 'w', encoding='utf-8') as f:
            json.dump(config, f, ensure_ascii=False, indent=2)
        
        # 新しいプロファイルをアクティブにする
        global ACTIVE_PROFILE, SELECTED_MODEL_PATH
        ACTIVE_PROFILE = profile_id
        
        # モデルパスが指定されていれば選択する
        if base_model_path and os.path.exists(base_model_path):
            SELECTED_MODEL_PATH = base_model_path
        
        logger.info(f"Created new profile: {profile_id} (name: {name})")
        
        return jsonify({
            'status': 'success',
            'profile': {
                'id': profile_id,
                'name': name,
                'description': description,
                'created_at': now,
                'updated_at': now,
                'model_path': base_model_path,
                'workspace_path': workspace_dir,
                'active': True
            }
        })
    
    except Exception as e:
        logger.exception(f"Error while creating profile: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/profiles/activate', methods=['POST'])
def activate_profile():
    """
    プロファイルをアクティブにするエンドポイント
    """
    try:
        data = request.json
        profile_id = data.get('profile_id')
        
        if not profile_id:
            return jsonify({'error': 'Profile ID is required'}), 400
        
        # プロファイルが存在するか確認
        profile_dir = os.path.join(PROFILES_DIR, profile_id)
        config_path = os.path.join(profile_dir, 'config.json')
        
        if not os.path.exists(profile_dir) or not os.path.exists(config_path):
            return jsonify({'error': f'Profile not found: {profile_id}'}), 404
        
        # 設定ファイルの読み込み
        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)
        
        # グローバル変数を更新
        global ACTIVE_PROFILE, SELECTED_MODEL_PATH
        ACTIVE_PROFILE = profile_id
        
        # モデルパスも設定
        model_path = config.get('model_path', '')
        if model_path and os.path.exists(model_path):
            SELECTED_MODEL_PATH = model_path
        
        # WorkSpaceディレクトリが存在しなければ作成
        workspace_dir = os.path.join(WORKSPACE_DIR, profile_id)
        if not os.path.exists(workspace_dir):
            os.makedirs(workspace_dir)
            config['workspace_path'] = workspace_dir
            with open(config_path, 'w', encoding='utf-8') as f:
                json.dump(config, f, ensure_ascii=False, indent=2)
        
        logger.info(f"Activated profile: {profile_id}")
        
        return jsonify({
            'status': 'success',
            'profile': {
                'id': profile_id,
                'name': config.get('name', profile_id),
                'model_path': SELECTED_MODEL_PATH,
                'workspace_path': workspace_dir
            }
        })
    
    except Exception as e:
        logger.exception(f"Error while activating profile: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/profiles/update', methods=['POST'])
def update_profile():
    """
    プロファイル情報を更新するエンドポイント
    """
    try:
        data = request.json
        profile_id = data.get('profile_id')
        
        if not profile_id:
            return jsonify({'error': 'Profile ID is required'}), 400
        
        # プロファイルが存在するか確認
        profile_dir = os.path.join(PROFILES_DIR, profile_id)
        config_path = os.path.join(profile_dir, 'config.json')
        
        if not os.path.exists(profile_dir) or not os.path.exists(config_path):
            return jsonify({'error': f'Profile not found: {profile_id}'}), 404
        
        # 設定ファイルの読み込み
        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)
        
        # 更新可能なフィールド
        update_fields = ['name', 'description', 'model_path']
        updated = False
        
        for field in update_fields:
            if field in data and data[field] is not None:
                config[field] = data[field]
                updated = True
        
        if updated:
            # 更新日時を設定
            config['updated_at'] = datetime.now().isoformat()
            
            # 設定ファイルを保存
            with open(config_path, 'w', encoding='utf-8') as f:
                json.dump(config, f, ensure_ascii=False, indent=2)
            
            # 現在アクティブなプロファイルを更新した場合は、グローバル変数も更新
            if ACTIVE_PROFILE == profile_id and 'model_path' in data:
                global SELECTED_MODEL_PATH
                model_path = data['model_path']
                if model_path and os.path.exists(model_path):
                    SELECTED_MODEL_PATH = model_path
            
            logger.info(f"Updated profile: {profile_id}")
        
        return jsonify({
            'status': 'success',
            'profile': {
                'id': profile_id,
                'name': config.get('name', profile_id),
                'description': config.get('description', ''),
                'model_path': config.get('model_path', ''),
                'updated_at': config.get('updated_at', '')
            }
        })
    
    except Exception as e:
        logger.exception(f"Error while updating profile: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/profiles/delete', methods=['POST'])
def delete_profile():
    """
    プロファイルを削除するエンドポイント
    """
    try:
        data = request.json
        profile_id = data.get('profile_id')
        
        if not profile_id:
            return jsonify({'error': 'Profile ID is required'}), 400
        
        # プロファイルが存在するか確認
        profile_dir = os.path.join(PROFILES_DIR, profile_id)
        
        if not os.path.exists(profile_dir):
            return jsonify({'error': f'Profile not found: {profile_id}'}), 404
        
        # 現在アクティブなプロファイルは削除できない（前もって別のプロファイルをアクティブにする必要がある）
        if ACTIVE_PROFILE == profile_id:
            return jsonify({'error': 'Cannot delete the active profile. Please activate another profile first.'}), 400
        
        # プロファイルディレクトリを削除
        shutil.rmtree(profile_dir)
        
        # WorkSpaceディレクトリも削除
        workspace_dir = os.path.join(WORKSPACE_DIR, profile_id)
        if os.path.exists(workspace_dir):
            shutil.rmtree(workspace_dir)
        
        logger.info(f"Deleted profile: {profile_id}")
        
        return jsonify({
            'status': 'success',
            'message': f'Profile {profile_id} deleted successfully'
        })
    
    except Exception as e:
        logger.exception(f"Error while deleting profile: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/chat', methods=['POST'])
def chat():
    """
    チャットエンドポイント
    llama.cppを使用してローカルモデルで応答を生成
    """
    data = request.json
    message = data.get('message', '')
    logger.info(f"Chat request received with message: {message}")
    
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
        # 現在のプロファイル名を取得（存在する場合）
        profile_name = ""
        if ACTIVE_PROFILE:
            config_path = os.path.join(PROFILES_DIR, ACTIVE_PROFILE, 'config.json')
            if os.path.exists(config_path):
                with open(config_path, 'r', encoding='utf-8') as f:
                    config = json.load(f)
                    profile_name = config.get('name', ACTIVE_PROFILE)
        
        # llama.cppへのプロンプト作成（プロファイル情報を含める）
        if profile_name:
            system_prompt = f"あなたは{profile_name}です。ユーザーの質問に丁寧に答えてください。"
            prompt = f"<s>[INST] {system_prompt} [/INST]</s>\n\n[INST] {message} [/INST]"
        else:
            prompt = f"<s>[INST] {message} [/INST]</s>"
        
        # llama-server.exeを使用する場合（Windowsの場合）
        if IS_WINDOWS and LLAMACPP_MAIN.endswith('llama-server.exe'):
            # この実装ではllama-server.exeはすでに起動されていると仮定
            # ディレクトリ構造が変更されたので対応する
            model_name = os.path.basename(SELECTED_MODEL_PATH)
            
            # モックレスポンスを返す（本来はllama-server.exeに対して実際にリクエストを送るべき）
            chat_response = f"こんにちは！llama-server.exeを使って応答しています。あなたのメッセージ: {message}"
            
            logger.info(f"Generated mock response using llama-server.exe for message: {message}")
            
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


@app.route('/api/memory', methods=['GET'])
def list_memories():
    """メモリーリストエンドポイント"""
    try:
        # アクティブなプロファイルが必要
        if not ACTIVE_PROFILE:
            return jsonify({'error': 'No active profile selected'}), 400
        
        # プロファイルのメモリーディレクトリ
        memories_dir = os.path.join(PROFILES_DIR, ACTIVE_PROFILE, 'memories')
        
        # ディレクトリが存在しない場合は作成
        if not os.path.exists(memories_dir):
            os.makedirs(memories_dir)
            return jsonify({'memories': []})
        
        memories = []
        
        # メモリーファイル（JSON）を読み込む
        for filename in os.listdir(memories_dir):
            if filename.endswith('.json'):
                try:
                    file_path = os.path.join(memories_dir, filename)
                    with open(file_path, 'r', encoding='utf-8') as f:
                        memory = json.load(f)
                    
                    # メモリーIDとしてファイル名（拡張子なし）を使用
                    memory_id = os.path.splitext(filename)[0]
                    memory['id'] = memory_id
                    
                    memories.append(memory)
                except Exception as e:
                    logger.error(f"Error reading memory file {filename}: {str(e)}")
        
        # 作成日時でソート（新しい順）
        memories = sorted(memories, key=lambda x: x.get('created_at', ''), reverse=True)
        
        return jsonify({'memories': memories})
    
    except Exception as e:
        logger.exception(f"Error listing memories: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/memory', methods=['POST'])
def add_memory():
    """メモリー追加エンドポイント"""
    try:
        # アクティブなプロファイルが必要
        if not ACTIVE_PROFILE:
            return jsonify({'error': 'No active profile selected'}), 400
        
        data = request.json
        content = data.get('content', '').strip()
        category = data.get('category', 'general').strip()
        importance = data.get('importance', 1)  # 重要度: 1-5
        
        if not content:
            return jsonify({'error': 'Memory content is required'}), 400
        
        # プロファイルのメモリーディレクトリ
        memories_dir = os.path.join(PROFILES_DIR, ACTIVE_PROFILE, 'memories')
        
        # ディレクトリが存在しない場合は作成
        if not os.path.exists(memories_dir):
            os.makedirs(memories_dir)
        
        # 現在の日時
        now = datetime.now().isoformat()
        
        # 一意のIDを生成
        memory_id = str(uuid.uuid4())
        
        # メモリーを作成
        memory = {
            'content': content,
            'category': category,
            'importance': importance,
            'created_at': now,
            'updated_at': now,
            'profile_id': ACTIVE_PROFILE
        }
        
        # JSONファイルとして保存
        with open(os.path.join(memories_dir, f"{memory_id}.json"), 'w', encoding='utf-8') as f:
            json.dump(memory, f, ensure_ascii=False, indent=2)
        
        # プロファイル設定を更新してメモリー数をインクリメント
        config_path = os.path.join(PROFILES_DIR, ACTIVE_PROFILE, 'config.json')
        if os.path.exists(config_path):
            try:
                with open(config_path, 'r', encoding='utf-8') as f:
                    config = json.load(f)
                
                # メモリー数を更新
                config['memories_count'] = config.get('memories_count', 0) + 1
                config['updated_at'] = now
                
                with open(config_path, 'w', encoding='utf-8') as f:
                    json.dump(config, f, ensure_ascii=False, indent=2)
            except Exception as e:
                logger.error(f"Failed to update profile config: {str(e)}")
        
        # 結果を返す
        memory['id'] = memory_id
        return jsonify({'memory': memory, 'status': 'success'})
    
    except Exception as e:
        logger.exception(f"Error adding memory: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/memory/<memory_id>', methods=['GET'])
def get_memory(memory_id):
    """特定のメモリーを取得するエンドポイント"""
    try:
        # アクティブなプロファイルが必要
        if not ACTIVE_PROFILE:
            return jsonify({'error': 'No active profile selected'}), 400
        
        # メモリーファイルのパス
        memory_path = os.path.join(PROFILES_DIR, ACTIVE_PROFILE, 'memories', f"{memory_id}.json")
        
        # ファイルが存在するか確認
        if not os.path.exists(memory_path):
            return jsonify({'error': f'Memory not found: {memory_id}'}), 404
        
        # メモリーを読み込む
        with open(memory_path, 'r', encoding='utf-8') as f:
            memory = json.load(f)
        
        # IDを設定
        memory['id'] = memory_id
        
        return jsonify({'memory': memory})
    
    except Exception as e:
        logger.exception(f"Error getting memory: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/memory/<memory_id>', methods=['PUT'])
def update_memory(memory_id):
    """メモリーを更新するエンドポイント"""
    try:
        # アクティブなプロファイルが必要
        if not ACTIVE_PROFILE:
            return jsonify({'error': 'No active profile selected'}), 400
        
        # メモリーファイルのパス
        memory_path = os.path.join(PROFILES_DIR, ACTIVE_PROFILE, 'memories', f"{memory_id}.json")
        
        # ファイルが存在するか確認
        if not os.path.exists(memory_path):
            return jsonify({'error': f'Memory not found: {memory_id}'}), 404
        
        # 既存のメモリーを読み込む
        with open(memory_path, 'r', encoding='utf-8') as f:
            memory = json.load(f)
        
        # 更新データを取得
        data = request.json
        content = data.get('content')
        category = data.get('category')
        importance = data.get('importance')
        
        # 更新
        if content is not None:
            memory['content'] = content
        if category is not None:
            memory['category'] = category
        if importance is not None:
            memory['importance'] = importance
        
        # 更新日時を設定
        memory['updated_at'] = datetime.now().isoformat()
        
        # 保存
        with open(memory_path, 'w', encoding='utf-8') as f:
            json.dump(memory, f, ensure_ascii=False, indent=2)
        
        # IDを設定
        memory['id'] = memory_id
        
        return jsonify({'memory': memory, 'status': 'success'})
    
    except Exception as e:
        logger.exception(f"Error updating memory: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/memory/<memory_id>', methods=['DELETE'])
def delete_memory(memory_id):
    """メモリーを削除するエンドポイント"""
    try:
        # アクティブなプロファイルが必要
        if not ACTIVE_PROFILE:
            return jsonify({'error': 'No active profile selected'}), 400
        
        # メモリーファイルのパス
        memory_path = os.path.join(PROFILES_DIR, ACTIVE_PROFILE, 'memories', f"{memory_id}.json")
        
        # ファイルが存在するか確認
        if not os.path.exists(memory_path):
            return jsonify({'error': f'Memory not found: {memory_id}'}), 404
        
        # メモリーを削除
        os.remove(memory_path)
        
        # プロファイル設定を更新してメモリー数をデクリメント
        config_path = os.path.join(PROFILES_DIR, ACTIVE_PROFILE, 'config.json')
        if os.path.exists(config_path):
            try:
                with open(config_path, 'r', encoding='utf-8') as f:
                    config = json.load(f)
                
                # メモリー数を更新（0未満にならないようにする）
                config['memories_count'] = max(0, config.get('memories_count', 1) - 1)
                config['updated_at'] = datetime.now().isoformat()
                
                with open(config_path, 'w', encoding='utf-8') as f:
                    json.dump(config, f, ensure_ascii=False, indent=2)
            except Exception as e:
                logger.error(f"Failed to update profile config: {str(e)}")
        
        return jsonify({'status': 'success', 'message': f'Memory {memory_id} deleted successfully'})
    
    except Exception as e:
        logger.exception(f"Error deleting memory: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/memory/import', methods=['POST'])
def import_memories():
    """複数のメモリーをインポートするエンドポイント"""
    try:
        # アクティブなプロファイルが必要
        if not ACTIVE_PROFILE:
            return jsonify({'error': 'No active profile selected'}), 400
        
        # プロファイルのメモリーディレクトリ
        memories_dir = os.path.join(PROFILES_DIR, ACTIVE_PROFILE, 'memories')
        
        # ディレクトリが存在しない場合は作成
        if not os.path.exists(memories_dir):
            os.makedirs(memories_dir)
        
        # リクエストのタイプをチェック
        if 'file' in request.files:
            # ファイルからのインポート
            file = request.files['file']
            
            if file.filename == '':
                return jsonify({'error': 'No file selected'}), 400
            
            # ファイル拡張子チェック
            if not file.filename.lower().endswith(('.txt', '.csv', '.json')):
                return jsonify({'error': 'Only .txt, .csv, or .json files are allowed'}), 400
            
            # ファイルを一時的に保存
            temp_file_path = os.path.join(memories_dir, 'temp_import.txt')
            file.save(temp_file_path)
            
            # ファイル形式に応じて処理
            imported_count = 0
            
            if file.filename.lower().endswith('.txt'):
                # テキストファイル: 行ごとにメモリーとして扱う
                with open(temp_file_path, 'r', encoding='utf-8') as f:
                    lines = f.readlines()
                
                for line in lines:
                    line = line.strip()
                    if line:  # 空行をスキップ
                        # メモリーを追加
                        add_single_memory(line, 'imported', 1)
                        imported_count += 1
            
            elif file.filename.lower().endswith('.csv'):
                # CSVファイル: カンマ区切りで「内容,カテゴリ,重要度」として扱う
                with open(temp_file_path, 'r', encoding='utf-8') as f:
                    lines = f.readlines()
                
                for line in lines:
                    parts = line.strip().split(',')
                    content = parts[0].strip() if parts else ""
                    category = parts[1].strip() if len(parts) > 1 else "imported"
                    try:
                        importance = int(parts[2].strip()) if len(parts) > 2 else 1
                        importance = max(1, min(5, importance))  # 1-5の範囲に制限
                    except:
                        importance = 1
                    
                    if content:  # 空の内容をスキップ
                        # メモリーを追加
                        add_single_memory(content, category, importance)
                        imported_count += 1
            
            elif file.filename.lower().endswith('.json'):
                # JSONファイル: 配列または単一オブジェクトとして扱う
                with open(temp_file_path, 'r', encoding='utf-8') as f:
                    try:
                        data = json.load(f)
                        
                        if isinstance(data, list):
                            # 配列の場合
                            for item in data:
                                content = item.get('content', '').strip()
                                category = item.get('category', 'imported').strip()
                                importance = item.get('importance', 1)
                                
                                if content:  # 空の内容をスキップ
                                    # メモリーを追加
                                    add_single_memory(content, category, importance)
                                    imported_count += 1
                        elif isinstance(data, dict):
                            # 単一オブジェクトの場合
                            content = data.get('content', '').strip()
                            category = data.get('category', 'imported').strip()
                            importance = data.get('importance', 1)
                            
                            if content:  # 空の内容をスキップ
                                # メモリーを追加
                                add_single_memory(content, category, importance)
                                imported_count += 1
                    except json.JSONDecodeError:
                        return jsonify({'error': 'Invalid JSON format'}), 400
            
            # 一時ファイルを削除
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
            
            # プロファイル設定を更新
            update_profile_memory_count(ACTIVE_PROFILE, imported_count)
            
            return jsonify({
                'status': 'success',
                'imported_count': imported_count,
                'message': f'Successfully imported {imported_count} memories'
            })
        
        elif request.json:
            # JSON形式のデータからのインポート
            data = request.json
            memories = data.get('memories', [])
            
            if not isinstance(memories, list):
                return jsonify({'error': 'Memories should be provided as an array'}), 400
            
            imported_count = 0
            
            for memory in memories:
                content = memory.get('content', '').strip()
                category = memory.get('category', 'imported').strip()
                importance = memory.get('importance', 1)
                
                if content:  # 空の内容をスキップ
                    # メモリーを追加
                    add_single_memory(content, category, importance)
                    imported_count += 1
            
            # プロファイル設定を更新
            update_profile_memory_count(ACTIVE_PROFILE, imported_count)
            
            return jsonify({
                'status': 'success',
                'imported_count': imported_count,
                'message': f'Successfully imported {imported_count} memories'
            })
        
        else:
            return jsonify({'error': 'No memories data provided'}), 400
    
    except Exception as e:
        logger.exception(f"Error importing memories: {str(e)}")
        return jsonify({'error': str(e)}), 500


def add_single_memory(content, category, importance):
    """単一のメモリーを追加するヘルパー関数"""
    # 一意のIDを生成
    memory_id = str(uuid.uuid4())
    
    # 現在の日時
    now = datetime.now().isoformat()
    
    # メモリーを作成
    memory = {
        'content': content,
        'category': category,
        'importance': importance,
        'created_at': now,
        'updated_at': now,
        'profile_id': ACTIVE_PROFILE
    }
    
    # プロファイルのメモリーディレクトリ
    memories_dir = os.path.join(PROFILES_DIR, ACTIVE_PROFILE, 'memories')
    
    # JSONファイルとして保存
    with open(os.path.join(memories_dir, f"{memory_id}.json"), 'w', encoding='utf-8') as f:
        json.dump(memory, f, ensure_ascii=False, indent=2)
    
    return memory_id


def update_profile_memory_count(profile_id, count_change):
    """プロファイルのメモリーカウントを更新するヘルパー関数"""
    config_path = os.path.join(PROFILES_DIR, profile_id, 'config.json')
    
    if os.path.exists(config_path):
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                config = json.load(f)
            
            # メモリー数を更新
            config['memories_count'] = config.get('memories_count', 0) + count_change
            config['updated_at'] = datetime.now().isoformat()
            
            with open(config_path, 'w', encoding='utf-8') as f:
                json.dump(config, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.error(f"Failed to update profile config: {str(e)}")


@app.route('/api/workspace/list', methods=['GET'])
def list_workspace_files():
    """WorkSpaceディレクトリ内のファイル一覧を取得するエンドポイント"""
    try:
        # アクティブなプロファイルが必要
        if not ACTIVE_PROFILE:
            return jsonify({'error': 'No active profile selected'}), 400
        
        # WorkSpaceディレクトリパス
        workspace_path = os.path.join(WORKSPACE_DIR, ACTIVE_PROFILE)
        
        # ディレクトリが存在しない場合は作成
        if not os.path.exists(workspace_path):
            os.makedirs(workspace_path)
        
        # クエリパラメータからサブディレクトリを取得
        subdir = request.args.get('dir', '')
        
        # 最終的なパス
        current_path = os.path.normpath(os.path.join(workspace_path, subdir))
        
        # パスが有効かチェック（ワークスペースディレクトリ外へのアクセスを防止）
        if not current_path.startswith(workspace_path):
            return jsonify({'error': 'Invalid directory path'}), 400
        
        # ディレクトリが存在しない場合はエラー
        if not os.path.exists(current_path) or not os.path.isdir(current_path):
            return jsonify({'error': 'Directory not found'}), 404
        
        # ディレクトリ内の項目をスキャン
        files = []
        dirs = []
        
        for item in os.listdir(current_path):
            item_path = os.path.join(current_path, item)
            rel_path = os.path.relpath(item_path, workspace_path)
            
            if os.path.isdir(item_path):
                dirs.append({
                    'name': item,
                    'path': rel_path,
                    'type': 'directory',
                    'modified_at': datetime.fromtimestamp(os.path.getmtime(item_path)).isoformat()
                })
            else:
                try:
                    with open(item_path, 'r', encoding='utf-8') as f:
                        content_preview = f.read(200)  # 最初の200文字をプレビュー
                except:
                    content_preview = ""  # テキストでない場合は空
                
                files.append({
                    'name': item,
                    'path': rel_path,
                    'type': 'file',
                    'size': os.path.getsize(item_path),
                    'modified_at': datetime.fromtimestamp(os.path.getmtime(item_path)).isoformat(),
                    'preview': content_preview
                })
        
        # 現在のディレクトリ情報
        current_dir_info = {
            'path': os.path.relpath(current_path, workspace_path) if current_path != workspace_path else "",
            'parent': os.path.relpath(os.path.dirname(current_path), workspace_path) if current_path != workspace_path else None
        }
        
        return jsonify({
            'current_dir': current_dir_info,
            'directories': sorted(dirs, key=lambda x: x['name']),
            'files': sorted(files, key=lambda x: x['name'])
        })
    
    except Exception as e:
        logger.exception(f"Error listing workspace files: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/workspace/file', methods=['GET'])
def get_workspace_file():
    """WorkSpaceディレクトリ内のファイル内容を取得するエンドポイント"""
    try:
        # アクティブなプロファイルが必要
        if not ACTIVE_PROFILE:
            return jsonify({'error': 'No active profile selected'}), 400
        
        # ファイルパスを取得
        file_path = request.args.get('path', '')
        if not file_path:
            return jsonify({'error': 'File path is required'}), 400
        
        # WorkSpaceディレクトリパス
        workspace_path = os.path.join(WORKSPACE_DIR, ACTIVE_PROFILE)
        
        # 最終的なパス
        full_path = os.path.normpath(os.path.join(workspace_path, file_path))
        
        # パスが有効かチェック（ワークスペースディレクトリ外へのアクセスを防止）
        if not full_path.startswith(workspace_path):
            return jsonify({'error': 'Invalid file path'}), 400
        
        # ファイルが存在するか確認
        if not os.path.exists(full_path) or not os.path.isfile(full_path):
            return jsonify({'error': 'File not found'}), 404
        
        # ファイルサイズが大きすぎる場合はエラー
        if os.path.getsize(full_path) > 5 * 1024 * 1024:  # 5MB制限
            return jsonify({'error': 'File is too large to read'}), 400
        
        # ファイル内容を読み込む
        try:
            with open(full_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except UnicodeDecodeError:
            # テキストでない場合はバイナリとして扱う
            return jsonify({'error': 'File is not a text file'}), 400
        
        # ファイル情報
        file_info = {
            'name': os.path.basename(full_path),
            'path': file_path,
            'size': os.path.getsize(full_path),
            'modified_at': datetime.fromtimestamp(os.path.getmtime(full_path)).isoformat(),
            'content': content
        }
        
        return jsonify({'file': file_info})
    
    except Exception as e:
        logger.exception(f"Error reading workspace file: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/workspace/file', methods=['POST'])
def create_workspace_file():
    """WorkSpaceディレクトリ内にファイルを作成するエンドポイント"""
    try:
        # アクティブなプロファイルが必要
        if not ACTIVE_PROFILE:
            return jsonify({'error': 'No active profile selected'}), 400
        
        data = request.json
        file_path = data.get('path', '')
        content = data.get('content', '')
        
        if not file_path:
            return jsonify({'error': 'File path is required'}), 400
        
        # WorkSpaceディレクトリパス
        workspace_path = os.path.join(WORKSPACE_DIR, ACTIVE_PROFILE)
        
        # ディレクトリが存在しない場合は作成
        if not os.path.exists(workspace_path):
            os.makedirs(workspace_path)
        
        # 最終的なパス
        full_path = os.path.normpath(os.path.join(workspace_path, file_path))
        
        # パスが有効かチェック（ワークスペースディレクトリ外へのアクセスを防止）
        if not full_path.startswith(workspace_path):
            return jsonify({'error': 'Invalid file path'}), 400
        
        # ディレクトリが存在しない場合は作成
        dir_path = os.path.dirname(full_path)
        if not os.path.exists(dir_path):
            os.makedirs(dir_path)
        
        # ファイルが既に存在する場合はエラー
        if os.path.exists(full_path):
            return jsonify({'error': 'File already exists'}), 400
        
        # ファイルを作成
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        return jsonify({
            'status': 'success',
            'file': {
                'name': os.path.basename(full_path),
                'path': file_path,
                'size': os.path.getsize(full_path),
                'modified_at': datetime.fromtimestamp(os.path.getmtime(full_path)).isoformat()
            }
        })
    
    except Exception as e:
        logger.exception(f"Error creating workspace file: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/workspace/file', methods=['PUT'])
def update_workspace_file():
    """WorkSpaceディレクトリ内のファイルを更新するエンドポイント"""
    try:
        # アクティブなプロファイルが必要
        if not ACTIVE_PROFILE:
            return jsonify({'error': 'No active profile selected'}), 400
        
        data = request.json
        file_path = data.get('path', '')
        content = data.get('content', '')
        
        if not file_path:
            return jsonify({'error': 'File path is required'}), 400
        
        # WorkSpaceディレクトリパス
        workspace_path = os.path.join(WORKSPACE_DIR, ACTIVE_PROFILE)
        
        # 最終的なパス
        full_path = os.path.normpath(os.path.join(workspace_path, file_path))
        
        # パスが有効かチェック（ワークスペースディレクトリ外へのアクセスを防止）
        if not full_path.startswith(workspace_path):
            return jsonify({'error': 'Invalid file path'}), 400
        
        # ファイルが存在するか確認
        if not os.path.exists(full_path) or not os.path.isfile(full_path):
            return jsonify({'error': 'File not found'}), 404
        
        # ファイルを更新
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        return jsonify({
            'status': 'success',
            'file': {
                'name': os.path.basename(full_path),
                'path': file_path,
                'size': os.path.getsize(full_path),
                'modified_at': datetime.fromtimestamp(os.path.getmtime(full_path)).isoformat()
            }
        })
    
    except Exception as e:
        logger.exception(f"Error updating workspace file: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/workspace/file', methods=['DELETE'])
def delete_workspace_file():
    """WorkSpaceディレクトリ内のファイルを削除するエンドポイント"""
    try:
        # アクティブなプロファイルが必要
        if not ACTIVE_PROFILE:
            return jsonify({'error': 'No active profile selected'}), 400
        
        # ファイルパスを取得
        file_path = request.args.get('path', '')
        if not file_path:
            return jsonify({'error': 'File path is required'}), 400
        
        # WorkSpaceディレクトリパス
        workspace_path = os.path.join(WORKSPACE_DIR, ACTIVE_PROFILE)
        
        # 最終的なパス
        full_path = os.path.normpath(os.path.join(workspace_path, file_path))
        
        # パスが有効かチェック（ワークスペースディレクトリ外へのアクセスを防止）
        if not full_path.startswith(workspace_path):
            return jsonify({'error': 'Invalid file path'}), 400
        
        # ファイルが存在するか確認
        if not os.path.exists(full_path) or not os.path.isfile(full_path):
            return jsonify({'error': 'File not found'}), 404
        
        # ファイルを削除
        os.remove(full_path)
        
        return jsonify({
            'status': 'success',
            'message': f'File {file_path} deleted successfully'
        })
    
    except Exception as e:
        logger.exception(f"Error deleting workspace file: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/workspace/directory', methods=['POST'])
def create_workspace_directory():
    """WorkSpaceディレクトリ内にディレクトリを作成するエンドポイント"""
    try:
        # アクティブなプロファイルが必要
        if not ACTIVE_PROFILE:
            return jsonify({'error': 'No active profile selected'}), 400
        
        data = request.json
        dir_path = data.get('path', '')
        
        if not dir_path:
            return jsonify({'error': 'Directory path is required'}), 400
        
        # WorkSpaceディレクトリパス
        workspace_path = os.path.join(WORKSPACE_DIR, ACTIVE_PROFILE)
        
        # ディレクトリが存在しない場合は作成
        if not os.path.exists(workspace_path):
            os.makedirs(workspace_path)
        
        # 最終的なパス
        full_path = os.path.normpath(os.path.join(workspace_path, dir_path))
        
        # パスが有効かチェック（ワークスペースディレクトリ外へのアクセスを防止）
        if not full_path.startswith(workspace_path):
            return jsonify({'error': 'Invalid directory path'}), 400
        
        # ディレクトリが既に存在する場合はエラー
        if os.path.exists(full_path):
            return jsonify({'error': 'Directory already exists'}), 400
        
        # ディレクトリを作成
        os.makedirs(full_path)
        
        return jsonify({
            'status': 'success',
            'directory': {
                'name': os.path.basename(full_path),
                'path': dir_path,
                'modified_at': datetime.fromtimestamp(os.path.getmtime(full_path)).isoformat()
            }
        })
    
    except Exception as e:
        logger.exception(f"Error creating workspace directory: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/workspace/directory', methods=['DELETE'])
def delete_workspace_directory():
    """WorkSpaceディレクトリ内のディレクトリを削除するエンドポイント"""
    try:
        # アクティブなプロファイルが必要
        if not ACTIVE_PROFILE:
            return jsonify({'error': 'No active profile selected'}), 400
        
        # ディレクトリパスを取得
        dir_path = request.args.get('path', '')
        if not dir_path:
            return jsonify({'error': 'Directory path is required'}), 400
        
        # WorkSpaceディレクトリパス
        workspace_path = os.path.join(WORKSPACE_DIR, ACTIVE_PROFILE)
        
        # 最終的なパス
        full_path = os.path.normpath(os.path.join(workspace_path, dir_path))
        
        # パスが有効かチェック（ワークスペースディレクトリ外へのアクセスを防止）
        if not full_path.startswith(workspace_path):
            return jsonify({'error': 'Invalid directory path'}), 400
        
        # WorkSpaceルートディレクトリは削除できない
        if full_path == workspace_path:
            return jsonify({'error': 'Cannot delete root workspace directory'}), 400
        
        # ディレクトリが存在するか確認
        if not os.path.exists(full_path) or not os.path.isdir(full_path):
            return jsonify({'error': 'Directory not found'}), 404
        
        # ディレクトリを削除
        shutil.rmtree(full_path)
        
        return jsonify({
            'status': 'success',
            'message': f'Directory {dir_path} deleted successfully'
        })
    
    except Exception as e:
        logger.exception(f"Error deleting workspace directory: {str(e)}")
        return jsonify({'error': str(e)}), 500


# トレーニングデータ管理用APIエンドポイント

@app.route('/api/training/data', methods=['GET'])
def list_training_data():
    """トレーニングデータ一覧を取得するエンドポイント"""
    try:
        # カテゴリフィルター（オプション）
        category = request.args.get('category', None)
        
        # トレーニングマネージャを使用してデータを取得
        result = training_manager.list_training_data(PROFILES_DIR, ACTIVE_PROFILE, category)
        
        # エラーチェック
        if isinstance(result, tuple) and len(result) == 2 and isinstance(result[0], dict) and 'error' in result[0]:
            return jsonify(result[0]), result[1]
        
        return jsonify(result)
    
    except Exception as e:
        logger.exception(f"Error listing training data: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/training/data/<data_id>', methods=['GET'])
def get_training_data(data_id):
    """特定のトレーニングデータを取得するエンドポイント"""
    try:
        # データパスを取得（クエリパラメータから）
        data_path = request.args.get('path', '')
        
        # トレーニングマネージャを使用してデータを取得
        result = training_manager.get_training_data(PROFILES_DIR, ACTIVE_PROFILE, data_id, data_path)
        
        # エラーチェック
        if isinstance(result, tuple) and len(result) == 2 and isinstance(result[0], dict) and 'error' in result[0]:
            return jsonify(result[0]), result[1]
        
        return jsonify(result)
    
    except Exception as e:
        logger.exception(f"Error getting training data: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/training/upload', methods=['POST'])
def upload_training_data():
    """トレーニングデータをアップロードするエンドポイント"""
    try:
        # カテゴリ（オプション、デフォルトはgeneral）
        category = request.form.get('category', 'general')
        
        # ファイルの取得
        files = request.files.getlist('file')  # 複数ファイルに対応
        
        # トレーニングマネージャを使用してファイルを保存
        result = training_manager.save_uploaded_files(PROFILES_DIR, ACTIVE_PROFILE, files, category)
        
        # エラーチェック
        if isinstance(result, tuple) and len(result) == 2 and isinstance(result[0], dict) and 'error' in result[0]:
            return jsonify(result[0]), result[1]
        
        return jsonify(result)
    
    except Exception as e:
        logger.exception(f"Error uploading training data: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/training/data/<data_id>', methods=['DELETE'])
def delete_training_data(data_id):
    """トレーニングデータを削除するエンドポイント"""
    try:
        # データパスを取得（クエリパラメータから）
        data_path = request.args.get('path', '')
        
        # トレーニングマネージャを使用してデータを削除
        result = training_manager.delete_training_data(PROFILES_DIR, ACTIVE_PROFILE, data_id, data_path)
        
        # エラーチェック
        if isinstance(result, tuple) and len(result) == 2 and isinstance(result[0], dict) and 'error' in result[0]:
            return jsonify(result[0]), result[1]
        
        return jsonify(result)
    
    except Exception as e:
        logger.exception(f"Error deleting training data: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/training/process', methods=['POST'])
def start_training_process():
    """トレーニングプロセスを開始するエンドポイント"""
    try:
        # トレーニングパラメータを取得
        data = request.json
        
        # トレーニングマネージャを使用してプロセスを開始
        result = training_manager.start_training_process(PROFILES_DIR, ACTIVE_PROFILE, data)
        
        # エラーチェック
        if isinstance(result, tuple) and len(result) == 2 and isinstance(result[0], dict) and 'error' in result[0]:
            return jsonify(result[0]), result[1]
        
        return jsonify(result)
    
    except Exception as e:
        logger.exception(f"Error starting training process: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/training/status/<training_id>', methods=['GET'])
def get_training_status(training_id):
    """トレーニングプロセスのステータスを取得するエンドポイント"""
    try:
        # トレーニングマネージャを使用してステータスを取得
        result = training_manager.get_training_status(training_id, PROFILES_DIR, ACTIVE_PROFILE)
        
        # エラーチェック
        if isinstance(result, tuple) and len(result) == 2 and isinstance(result[0], dict) and 'error' in result[0]:
            return jsonify(result[0]), result[1]
        
        return jsonify(result)
    
    except Exception as e:
        logger.exception(f"Error getting training status: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/training/log/<training_id>', methods=['GET'])
def get_training_log(training_id):
    """トレーニングログを取得するエンドポイント"""
    try:
        # トレーニングマネージャを使用してログを取得
        result = training_manager.get_training_log(training_id, PROFILES_DIR, ACTIVE_PROFILE)
        
        # エラーチェック
        if isinstance(result, tuple) and len(result) == 2 and isinstance(result[0], dict) and 'error' in result[0]:
            return jsonify(result[0]), result[1]
        
        return jsonify(result)
    
    except Exception as e:
        logger.exception(f"Error getting training log: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/training/history', methods=['GET'])
def get_training_history():
    """トレーニング履歴を取得するエンドポイント"""
    try:
        # トレーニングマネージャを使用して履歴を取得
        result = training_manager.get_training_history(PROFILES_DIR, ACTIVE_PROFILE)
        
        # エラーチェック
        if isinstance(result, tuple) and len(result) == 2 and isinstance(result[0], dict) and 'error' in result[0]:
            return jsonify(result[0]), result[1]
        
        return jsonify(result)
    
    except Exception as e:
        logger.exception(f"Error getting training history: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/training/cancel/<training_id>', methods=['POST'])
def cancel_training_process(training_id):
    """トレーニングプロセスをキャンセルするエンドポイント"""
    try:
        # トレーニングマネージャを使用してプロセスをキャンセル
        result = training_manager.cancel_training_process(training_id, PROFILES_DIR, ACTIVE_PROFILE)
        
        # エラーチェック
        if isinstance(result, tuple) and len(result) == 2 and isinstance(result[0], dict) and 'error' in result[0]:
            return jsonify(result[0]), result[1]
        
        return jsonify(result)
    
    except Exception as e:
        logger.exception(f"Error cancelling training process: {str(e)}")
        return jsonify({'error': str(e)}), 500


def allowed_file(filename):
    """
    許可されたファイル拡張子かどうかを確認する
    """
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/api/upload', methods=['POST'])
def upload_file():
    """
    ファイルアップロードエンドポイント
    multipart/form-dataでファイルとカテゴリを受け取る
    """
    logger.info("File upload request received")
    
    # アクティブなプロファイルをチェック
    profile_training_dir = None
    if ACTIVE_PROFILE:
        profile_training_dir = os.path.join(PROFILES_DIR, ACTIVE_PROFILE, 'training_data')
        if not os.path.exists(profile_training_dir):
            os.makedirs(profile_training_dir)
    
    # アップロードフォルダが存在しなければ作成
    if not os.path.exists(app.config['UPLOAD_FOLDER']):
        os.makedirs(app.config['UPLOAD_FOLDER'])
    
    # カテゴリの取得（デフォルトは'general'）
    category = request.form.get('category', 'general')
    category_folder = os.path.join(app.config['UPLOAD_FOLDER'], category)
    
    # カテゴリフォルダが存在しなければ作成
    if not os.path.exists(category_folder):
        os.makedirs(category_folder)
    
    # リクエストにファイルがあるか確認
    if 'file' not in request.files:
        logger.error("No file part in the request")
        return jsonify({
            'error': 'No file part in the request',
            'status': 'error'
        }), 400
    
    file = request.files['file']
    
    # ファイル名が空でないか確認
    if file.filename == '':
        logger.error("No selected file")
        return jsonify({
            'error': 'No selected file',
            'status': 'error'
        }), 400
    
    # ファイルタイプが許可されているか確認
    if file and allowed_file(file.filename):
        # 安全なファイル名に変換
        original_filename = secure_filename(file.filename)
        # ユニークなファイル名を生成（衝突を避けるため）
        unique_id = str(uuid.uuid4())
        filename = f"{unique_id}_{original_filename}"
        
        # ファイルを保存
        file_path = os.path.join(category_folder, filename)
        file.save(file_path)
        
        logger.info(f"File saved successfully: {file_path}")
        
        # アクティブなプロファイルがある場合、トレーニングディレクトリにも保存（トレーニングデータ用）
        if profile_training_dir:
            profile_file_path = os.path.join(profile_training_dir, filename)
            shutil.copy2(file_path, profile_file_path)
            logger.info(f"File also saved to profile training directory: {profile_file_path}")
        
        # 成功レスポンス
        return jsonify({
            'filename': original_filename,
            'path': file_path,
            'category': category,
            'size': os.path.getsize(file_path),
            'uploaded_at': datetime.now().isoformat(),
            'status': 'success'
        })
    else:
        logger.error(f"File type not allowed: {file.filename if file else 'unknown'}")
        return jsonify({
            'error': 'File type not allowed',
            'status': 'error',
            'allowed_types': list(ALLOWED_EXTENSIONS)
        }), 400


@app.route('/api/files', methods=['GET'])
def list_files():
    """
    アップロードされたファイル一覧を取得するエンドポイント
    クエリパラメータでカテゴリを指定できる
    """
    category = request.args.get('category', 'general')
    profile_id = request.args.get('profile_id', ACTIVE_PROFILE)  # アクティブなプロファイルがデフォルト
    
    # プロファイルが指定されている場合はトレーニングデータを取得
    if profile_id:
        training_dir = os.path.join(PROFILES_DIR, profile_id, 'training_data')
        if os.path.exists(training_dir):
            return list_files_from_directory(training_dir)
    
    # 通常のカテゴリフォルダからファイルを取得
    category_folder = os.path.join(app.config['UPLOAD_FOLDER'], category)
    return list_files_from_directory(category_folder)


def list_files_from_directory(directory):
    """指定されたディレクトリからファイル一覧を取得する汎用関数"""
    # ディレクトリが存在しなければ作成
    if not os.path.exists(directory):
        os.makedirs(directory)
        return jsonify({'files': []})
    
    files = []
    for filename in os.listdir(directory):
        file_path = os.path.join(directory, filename)
        if os.path.isfile(file_path):
            # ファイル名から元のファイル名を抽出（UUID_元のファイル名の形式）
            original_filename = '_'.join(filename.split('_')[1:]) if '_' in filename else filename
            files.append({
                'filename': original_filename,
                'path': file_path,
                'size': os.path.getsize(file_path),
                'uploaded_at': datetime.fromtimestamp(os.path.getctime(file_path)).isoformat()
            })
    
    return jsonify({'files': files})


if __name__ == '__main__':
    # ディレクトリ存在確認と作成
    for directory in ['logs', MODELS_DIR, PROFILES_DIR, UPLOAD_FOLDER, WORKSPACE_DIR]:
        if not os.path.exists(directory):
            os.makedirs(directory)
    
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
    
    # プロファイルディレクトリの検索
    try:
        profiles = []
        if os.path.exists(PROFILES_DIR):
            for item in os.listdir(PROFILES_DIR):
                profile_dir = os.path.join(PROFILES_DIR, item)
                config_path = os.path.join(profile_dir, 'config.json')
                if os.path.isdir(profile_dir) and os.path.exists(config_path):
                    profiles.append(item)
        
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
    
    # Flaskアプリケーション起動
    app.run(host='0.0.0.0', port=PORT, debug=False)
