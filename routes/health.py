#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Second Me Windows - ヘルスチェックルート
システム状態と健全性を確認するエンドポイント
"""

from datetime import datetime
from flask import jsonify, Flask
from config import START_TIME, logger, PORT, log_level, MODELS_DIR, PROFILES_DIR, WORKSPACE_DIR
from config import ACTIVE_PROFILE, SELECTED_MODEL_PATH, LLAMACPP_MAIN
import os
import sys
import training_manager
from services.llama_server import check_llama_server


def register_routes(app: Flask):
    """ヘルスチェック関連のルートを登録"""
    
    @app.route('/health', methods=['GET'])
    @app.route('/api/health', methods=['GET'])  # フロントエンドの期待するエンドポイントを追加
    def health_check():
        """ヘルスチェックエンドポイント"""
        uptime = (datetime.now() - START_TIME).total_seconds()
        
        # llama-serverの状態も確認
        llama_server_status = "running" if check_llama_server() else "stopped"
        
        return jsonify({
            'status': 'ok',
            'uptime': uptime,
            'version': '1.0.0-windows',
            'llama_server': llama_server_status
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


    @app.route('/api/echo', methods=['POST'])
    def echo():
        """エコーエンドポイント - 受け取ったデータをそのまま返す"""
        from flask import request
        data = request.json
        logger.info(f"Echo request received: {data}")
        return jsonify({
            'received': data,
            'timestamp': datetime.now().isoformat()
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
