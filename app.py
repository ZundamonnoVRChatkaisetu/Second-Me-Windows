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
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

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

# モデルパス
MODEL_PATH = os.getenv('MODEL_PATH', '')

# サーバー起動時間
START_TIME = datetime.now()


@app.route('/health', methods=['GET'])
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
            'loaded': bool(MODEL_PATH and os.path.exists(MODEL_PATH))
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
    実際の処理はダミーで、llama.cppが統合されるまでのプレースホルダー
    """
    data = request.json
    message = data.get('message', '')
    logger.info(f"Chat request received with message: {message}")
    
    # ダミー応答 (実際にはここでllama.cppを呼び出す)
    response = {
        'message': f"あなたのメッセージを受け取りました: {message}",
        'timestamp': datetime.now().isoformat()
    }
    
    return jsonify(response)


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


if __name__ == '__main__':
    # ディレクトリ存在確認
    if not os.path.exists('logs'):
        os.makedirs('logs')
        
    logger.info(f"Starting Second Me backend on port {PORT}")
    logger.info(f"Log level: {log_level}")
    
    if MODEL_PATH:
        if os.path.exists(MODEL_PATH):
            logger.info(f"Model found at {MODEL_PATH}")
        else:
            logger.warning(f"Model not found at {MODEL_PATH}")
    else:
        logger.warning("MODEL_PATH not set, chat functionality will be limited")
    
    # Flaskアプリケーション起動
    app.run(host='0.0.0.0', port=PORT, debug=False)
