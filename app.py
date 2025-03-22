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
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
from werkzeug.utils import secure_filename

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

# 現在選択されているモデル
SELECTED_MODEL_PATH = os.getenv('SELECTED_MODEL_PATH', '')

# llama.cppのパス
LLAMACPP_PATH = os.getenv('LLAMACPP_PATH', os.path.join(os.getcwd(), 'dependencies', 'llama.cpp'))
LLAMACPP_MAIN = os.path.join(LLAMACPP_PATH, 'main')

# ファイルアップロード設定
UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', os.path.join(os.getcwd(), 'uploads'))
ALLOWED_EXTENSIONS = {'pdf', 'txt', 'doc', 'docx', 'csv', 'json'}
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
        'system': {
            'start_time': START_TIME.isoformat(),
            'uptime': (datetime.now() - START_TIME).total_seconds()
        }
    })


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
        # llama.cppへのプロンプト作成
        prompt = f"USER: {message}\nASSISTANT:"
        
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
        assistant_response = stdout.split('ASSISTANT:')[-1].strip()
        
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
    """メモリーリストエンドポイント (プレースホルダー)"""
    # ダミーデータ
    memories = [
        {'id': 1, 'content': 'これは記憶サンプル1です', 'created_at': '2025-03-22T10:00:00'},
        {'id': 2, 'content': 'これは記憶サンプル2です', 'created_at': '2025-03-22T11:00:00'}
    ]
    return jsonify({'memories': memories})


@app.route('/api/memory', methods=['POST'])
def add_memory():
    """メモリー追加エンドポイント (プレースホルダー)"""
    data = request.json
    content = data.get('content', '')
    
    # ダミー応答
    new_memory = {
        'id': 3,  # 実際にはDBで生成
        'content': content,
        'created_at': datetime.now().isoformat()
    }
    
    return jsonify({'memory': new_memory, 'status': 'success'})


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
    category_folder = os.path.join(app.config['UPLOAD_FOLDER'], category)
    
    # カテゴリフォルダが存在しなければ作成
    if not os.path.exists(category_folder):
        os.makedirs(category_folder)
        return jsonify({'files': []})
    
    files = []
    for filename in os.listdir(category_folder):
        file_path = os.path.join(category_folder, filename)
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
    # ディレクトリ存在確認
    if not os.path.exists('logs'):
        os.makedirs('logs')
    
    if not os.path.exists(MODELS_DIR):
        os.makedirs(MODELS_DIR)
        
    logger.info(f"Starting Second Me backend on port {PORT}")
    logger.info(f"Log level: {log_level}")
    logger.info(f"Models directory: {MODELS_DIR}")
    
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
    
    # Flaskアプリケーション起動
    app.run(host='0.0.0.0', port=PORT, debug=False)
