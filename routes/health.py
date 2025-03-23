#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Second Me Windows - ヘルスチェックルート
システム状態と健全性を確認するエンドポイント
"""

from datetime import datetime
from flask import jsonify, Flask, request
from config import START_TIME, logger, PORT, log_level, MODELS_DIR, PROFILES_DIR, WORKSPACE_DIR
from config import ACTIVE_PROFILE, SELECTED_MODEL_PATH, LLAMACPP_MAIN
import os
import sys
import traceback
import training_manager
from services.llama_server import check_llama_server


def register_routes(app: Flask):
    """ヘルスチェック関連のルートを登録"""
    
    @app.route('/health', methods=['GET', 'OPTIONS'])
    @app.route('/api/health', methods=['GET', 'OPTIONS'])  # フロントエンドの期待するエンドポイントを追加
    def health_check():
        """ヘルスチェックエンドポイント"""
        if request.method == 'OPTIONS':
            return _create_cors_preflight_response()
            
        try:
            uptime = (datetime.now() - START_TIME).total_seconds()
            
            # llama-serverの状態も確認
            llama_server_status = "running" if check_llama_server() else "stopped"
            
            response = jsonify({
                'status': 'ok',
                'message': 'Second Me Windows API Server is running',
                'uptime': uptime,
                'version': '1.0.0-windows',
                'llama_server': llama_server_status
            })
            
            # CORSヘッダーを追加
            response.headers.add('Access-Control-Allow-Origin', '*')
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Accept,Origin')
            response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
            return response
        except Exception as e:
            logger.exception(f"Health check error: {str(e)}")
            logger.error(traceback.format_exc())
            
            error_response = jsonify({
                'status': 'error',
                'message': f'Health check failed: {str(e)}'
            })
            
            # CORSヘッダーを追加
            error_response.headers.add('Access-Control-Allow-Origin', '*')
            error_response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
            error_response.headers.add('Access-Control-Allow-Methods', 'GET,OPTIONS')
            return error_response, 500


    @app.route('/api/info', methods=['GET', 'OPTIONS'])
    def get_info():
        """システム情報エンドポイント"""
        if request.method == 'OPTIONS':
            return _create_cors_preflight_response()
            
        try:
            response = jsonify({
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
                'llama_server': {
                    'executable': LLAMACPP_MAIN,
                    'exists': os.path.exists(LLAMACPP_MAIN),
                    'running': check_llama_server(),
                },
                'system': {
                    'start_time': START_TIME.isoformat(),
                    'uptime': (datetime.now() - START_TIME).total_seconds()
                }
            })
            return _corsify_response(response)
        except Exception as e:
            logger.exception(f"Error getting system info: {str(e)}")
            logger.error(traceback.format_exc())
            
            error_response = jsonify({
                'status': 'error',
                'message': f'Error getting system info: {str(e)}'
            })
            return _corsify_response(error_response, 500)


    @app.route('/api/echo', methods=['POST', 'OPTIONS'])
    def echo():
        """エコーエンドポイント - 受け取ったデータをそのまま返す"""
        if request.method == 'OPTIONS':
            return _create_cors_preflight_response()
            
        try:
            data = request.json
            logger.info(f"Echo request received: {data}")
            response = jsonify({
                'received': data,
                'timestamp': datetime.now().isoformat()
            })
            return _corsify_response(response)
        except Exception as e:
            logger.exception(f"Echo error: {str(e)}")
            error_response = jsonify({
                'status': 'error',
                'message': f'Echo failed: {str(e)}'
            })
            return _corsify_response(error_response, 500)


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


# CORS対応のヘルパー関数
def _corsify_response(response, status_code=200):
    """レスポンスにCORSヘッダーを追加する"""
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Accept,Origin')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    if status_code != 200:
        response.status_code = status_code
    return response

def _create_cors_preflight_response():
    """OPTIONSリクエストに対するCORSプリフライトレスポンスを作成する"""
    from flask import make_response
    response = make_response()
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Accept,Origin')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    response.headers.add('Access-Control-Max-Age', '3600')
    return response
