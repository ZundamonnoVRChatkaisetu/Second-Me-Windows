#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Second Me Windows - llama-serverルート
llama-serverの管理と制御のエンドポイント
"""

from flask import jsonify, Flask
from config import SELECTED_MODEL_PATH, LLAMA_SERVER_URL
import os
from services.llama_server import (
    start_llama_server, stop_llama_server, check_llama_server
)


def register_routes(app: Flask):
    """llama-server関連のルートを登録"""
    
    @app.route('/api/llama-server/status', methods=['GET'])
    def llama_server_status():
        """llama-serverの状態を取得するエンドポイント"""
        is_running = check_llama_server()
        
        return jsonify({
            'status': 'running' if is_running else 'stopped',
            'model': os.path.basename(SELECTED_MODEL_PATH) if SELECTED_MODEL_PATH else None,
            'url': LLAMA_SERVER_URL
        })


    @app.route('/api/llama-server/start', methods=['POST'])
    def start_llama_server_endpoint():
        """llama-serverを起動するエンドポイント"""
        result = start_llama_server()
        
        if result:
            return jsonify({
                'status': 'success',
                'message': 'llama-server started successfully'
            })
        else:
            return jsonify({
                'status': 'error',
                'message': 'Failed to start llama-server'
            }), 500


    @app.route('/api/llama-server/stop', methods=['POST'])
    def stop_llama_server_endpoint():
        """llama-serverを停止するエンドポイント"""
        result = stop_llama_server()
        
        if result:
            return jsonify({
                'status': 'success',
                'message': 'llama-server stopped successfully'
            })
        else:
            return jsonify({
                'status': 'error',
                'message': 'Failed to stop llama-server'
            }), 500
