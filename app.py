#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Second Me Windows バックエンドアプリケーション
基本的なAPIエンドポイントを提供するFlaskアプリケーション
"""

import os
import json
import traceback
from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
from werkzeug.utils import secure_filename
import config
from config import (
    logger, PORT, MODELS_DIR, PROFILES_DIR, UPLOAD_FOLDER, WORKSPACE_DIR,
    SELECTED_MODEL_PATH, ACTIVE_PROFILE, LLAMACPP_MAIN, START_TIME, log_level
)
from routes import register_routes

# Flaskアプリケーションの設定
app = Flask(__name__)

# CORSの詳細設定
cors = CORS(
    app, 
    resources={r"/*": {"origins": "*"}},  # すべてのリソースへのアクセスを許可
    supports_credentials=True,
    allow_headers=["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    max_age=3600
)

# すべてのレスポンスにCORSヘッダーを追加
@app.after_request
def add_cors_headers(response):
    # すでにヘッダーがある場合でも常に上書き
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Accept,Origin')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    response.headers.add('Access-Control-Max-Age', '3600')
    
    # ログ出力（デバッグ用）
    if log_level == 'DEBUG':
        logger.debug(f"Response headers: {dict(response.headers)}")
    
    return response

# OPTIONSリクエストに対するグローバルハンドラ
@app.route('/', defaults={'path': ''}, methods=['OPTIONS'])
@app.route('/<path:path>', methods=['OPTIONS'])
def handle_options(path):
    """すべてのOPTIONSリクエストに対して適切なCORSレスポンスを返す"""
    response = make_response()
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Accept,Origin')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    response.headers.add('Access-Control-Max-Age', '3600')
    return response

# アップロード設定
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB制限

# デバッグ用のルート
@app.route('/')
def index():
    """ルートパスへのアクセスに対する応答"""
    return jsonify({
        'status': 'ok',
        'message': 'Second Me Windows API Server is running',
        'version': '1.0.0'
    })

# エラーハンドラー
@app.errorhandler(404)
def not_found(error):
    """404エラーハンドラー"""
    return jsonify({
        'error': 'Not Found',
        'message': 'The requested URL was not found on the server.'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    """500エラーハンドラー"""
    logger.error(f"Internal Server Error: {error}")
    logger.error(traceback.format_exc())
    return jsonify({
        'error': 'Internal Server Error',
        'message': 'The server encountered an internal error.'
    }), 500

# ルートを登録
try:
    register_routes(app)
    logger.info("All routes registered successfully")
except Exception as e:
    logger.error(f"Error registering routes: {str(e)}")
    logger.error(traceback.format_exc())

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
                # グローバル変数の SELECTED_MODEL_PATH を更新
                config.SELECTED_MODEL_PATH = os.path.join(MODELS_DIR, model_files[0])
                logger.info(f"Auto-selected model: {config.SELECTED_MODEL_PATH}")
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
                # グローバル変数の ACTIVE_PROFILE を更新
                config.ACTIVE_PROFILE = profiles[0]
                logger.info(f"Auto-selected profile: {config.ACTIVE_PROFILE}")
                
                # プロファイルのモデルも選択
                try:
                    with open(os.path.join(PROFILES_DIR, config.ACTIVE_PROFILE, 'config.json'), 'r', encoding='utf-8') as f:
                        config_data = json.load(f)
                    model_path = config_data.get('model_path', '')
                    if model_path and os.path.exists(model_path):
                        config.SELECTED_MODEL_PATH = model_path
                        logger.info(f"Using profile's model: {config.SELECTED_MODEL_PATH}")
                except Exception as e:
                    logger.error(f"Failed to load profile config: {str(e)}")
        else:
            logger.info("No profiles found, will create default profile if needed")
    except Exception as e:
        logger.warning(f"Error scanning profiles directory: {str(e)}")
    
    # Flaskアプリケーション起動
    app.run(host='0.0.0.0', port=PORT, debug=False, threaded=True)
