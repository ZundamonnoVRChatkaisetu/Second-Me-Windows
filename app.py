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

# モデルパス（現在選択されているモデル名を保持）
MODEL_PATH = os.getenv('MODEL_PATH', '')

# Ollama設定
OLLAMA_BASE_URL = os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434')

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
            'path': MODEL_PATH,
            'loaded': bool(MODEL_PATH)
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


@app.route('/api/chat', methods=['POST'])
def chat():
    """
    チャットエンドポイント
    Ollamaを使用してメッセージに応答
    """
    data = request.json
    message = data.get('message', '')
    logger.info(f"Chat request received with message: {message}")
    
    # モデルが設定されているか確認
    if not MODEL_PATH:
        logger.warning("No model selected, returning dummy response")
        return jsonify({
            'message': "モデルが選択されていません。設定ページでモデルを選択してください。",
            'timestamp': datetime.now().isoformat()
        })
    
    try:
        # Ollamaへのリクエスト
        ollama_response = requests.post(
            f"{OLLAMA_BASE_URL}/api/chat",
            json={
                "model": MODEL_PATH,
                "messages": [
                    {"role": "user", "content": message}
                ],
                "stream": False
            },
            timeout=60  # タイムアウトを60秒に設定
        )
        
        # レスポンスの確認
        if ollama_response.status_code == 200:
            # 成功した場合の応答内容を取得
            response_data = ollama_response.json()
            content = response_data.get('message', {}).get('content', '')
            
            if not content:
                logger.error(f"Ollama returned empty content: {response_data}")
                return jsonify({
                    'message': "Ollamaからの応答が空でした。再度お試しください。",
                    'timestamp': datetime.now().isoformat()
                })
            
            # 成功レスポンス
            return jsonify({
                'message': content,
                'timestamp': datetime.now().isoformat()
            })
        else:
            # エラーレスポンス
            logger.error(f"Ollama API error: {ollama_response.status_code} - {ollama_response.text}")
            return jsonify({
                'message': f"Ollamaからのエラー応答: {ollama_response.status_code}",
                'timestamp': datetime.now().isoformat()
            })
    
    except requests.exceptions.Timeout:
        logger.error("Ollama API request timed out")
        return jsonify({
            'message': "Ollamaからの応答がタイムアウトしました。再度お試しください。",
            'timestamp': datetime.now().isoformat()
        })
    
    except Exception as e:
        logger.exception(f"Error communicating with Ollama: {str(e)}")
        return jsonify({
            'message': f"Ollamaとの通信中にエラーが発生しました: {str(e)}",
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


@app.route('/api/ollama/models', methods=['GET'])
def get_ollama_models():
    """Ollamaから利用可能なモデルの一覧を取得するエンドポイント"""
    try:
        # Ollamaのモデル一覧APIを呼び出し
        response = requests.get(f"{OLLAMA_BASE_URL}/api/tags")
        
        if response.status_code == 200:
            models = response.json().get('models', [])
            # モデル情報を整形
            formatted_models = [
                {
                    'name': model.get('name'),
                    'size': model.get('size'),
                    'modified_at': model.get('modified_at'),
                    'details': model.get('details', {})
                }
                for model in models
            ]
            return jsonify({'models': formatted_models})
        else:
            logger.error(f"Failed to get models from Ollama: {response.status_code} - {response.text}")
            return jsonify({'error': 'Failed to get models from Ollama', 'models': []}), 500
    except Exception as e:
        logger.exception(f"Error while fetching Ollama models: {str(e)}")
        return jsonify({'error': str(e), 'models': []}), 500


@app.route('/api/ollama/set-model', methods=['POST'])
def set_ollama_model():
    """使用するOllamaモデルを設定するエンドポイント"""
    try:
        data = request.json
        model_name = data.get('model_name')
        
        if not model_name:
            return jsonify({'error': 'Model name is required'}), 400
        
        # モデル名をグローバル変数に設定
        global MODEL_PATH
        MODEL_PATH = model_name
        
        logger.info(f"Set Ollama model to: {model_name}")
        
        return jsonify({
            'status': 'success',
            'model_name': model_name,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        logger.exception(f"Error while setting Ollama model: {str(e)}")
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    # ディレクトリ存在確認
    if not os.path.exists('logs'):
        os.makedirs('logs')
        
    logger.info(f"Starting Second Me backend on port {PORT}")
    logger.info(f"Log level: {log_level}")
    
    if MODEL_PATH:
        logger.info(f"Using Ollama model: {MODEL_PATH}")
    else:
        logger.warning("No model selected, chat functionality will be limited")
    
    # Ollamaが利用可能か確認
    try:
        response = requests.get(f"{OLLAMA_BASE_URL}/api/tags")
        if response.status_code == 200:
            available_models = [model.get('name') for model in response.json().get('models', [])]
            logger.info(f"Ollama available models: {', '.join(available_models)}")
        else:
            logger.warning(f"Ollama API returned status code: {response.status_code}")
    except Exception as e:
        logger.warning(f"Could not connect to Ollama API: {str(e)}")
    
    # Flaskアプリケーション起動
    app.run(host='0.0.0.0', port=PORT, debug=False)
