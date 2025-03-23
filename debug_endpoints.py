#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Second Me Windows - デバッグ用APIエンドポイント
API接続テスト用の様々なデバッグエンドポイントを提供
"""

import json
import logging
from flask import Flask, jsonify, request, make_response

# ロガーの設定
logger = logging.getLogger(__name__)

def register_debug_routes(app: Flask):
    """デバッグ用のAPIエンドポイントを登録する"""
    
    # 標準のデバッグエンドポイント (api/debug)
    @app.route('/api/debug', methods=['GET', 'OPTIONS'])
    def debug_endpoint():
        """デバッグ用APIエンドポイント"""
        if request.method == 'OPTIONS':
            return _create_cors_preflight_response()
        
        # レスポンスのビルド
        response_data = {
            'status': 'ok',
            'message': 'Debug endpoint is working',
            'request_info': {
                'remote_addr': request.remote_addr,
                'method': request.method,
                'user_agent': request.headers.get('User-Agent', ''),
                'accept': request.headers.get('Accept', ''),
                'content_type': request.headers.get('Content-Type', ''),
                'origin': request.headers.get('Origin', ''),
                'referer': request.headers.get('Referer', '')
            }
        }
        
        logger.info(f"Debug endpoint accessed from: {request.remote_addr}")
        return jsonify(response_data)
    
    # 代替デバッグエンドポイント (ルートパスの /debug)
    @app.route('/debug', methods=['GET', 'OPTIONS'])
    def alternative_debug_endpoint():
        """代替デバッグエンドポイント (ルートパス)"""
        if request.method == 'OPTIONS':
            return _create_cors_preflight_response()
        
        # レスポンスのビルド
        response_data = {
            'status': 'ok',
            'message': 'Alternative debug endpoint is working',
            'request_info': {
                'remote_addr': request.remote_addr,
                'method': request.method,
                'headers': {k: v for k, v in request.headers.items()}
            }
        }
        
        logger.info(f"Alternative debug endpoint accessed from: {request.remote_addr}")
        return jsonify(response_data)
    
    # JSONP用のデバッグエンドポイント
    @app.route('/api/jsonp/debug', methods=['GET'])
    def jsonp_debug_endpoint():
        """JSONP対応のデバッグエンドポイント"""
        # コールバック関数名を取得
        callback = request.args.get('callback', 'callback')
        
        # データを準備
        data = {
            'status': 'ok',
            'message': 'JSONP debug endpoint is working',
            'timestamp': str(__import__('datetime').datetime.now())
        }
        
        # JSONPレスポンスを返す
        resp = f"{callback}({json.dumps(data)})"
        response = make_response(resp)
        response.headers['Content-Type'] = 'application/javascript'
        return response
    
    # 特殊なCORSヘッダーテスト用エンドポイント
    @app.route('/api/debug/cors-test', methods=['GET', 'OPTIONS'])
    def cors_test_endpoint():
        """CORSテスト用エンドポイント"""
        if request.method == 'OPTIONS':
            response = make_response()
            response.headers.add('Access-Control-Allow-Origin', '*')
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With')
            response.headers.add('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
            return response
        
        # CORSヘッダー付きのレスポンスを返す
        response = jsonify({
            'status': 'ok',
            'message': 'CORS test endpoint is working',
            'headers_received': {k: v for k, v in request.headers.items()}
        })
        
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With')
        
        return response
    
    # ネットワーク診断用エンドポイント
    @app.route('/api/debug/network', methods=['GET'])
    def network_diagnostic():
        """ネットワーク診断情報を返す"""
        import socket
        import platform
        import os
        
        # 基本的なネットワーク情報の収集
        hostname = socket.gethostname()
        local_ip = socket.gethostbyname(hostname)
        
        # システム情報
        system_info = {
            'platform': platform.platform(),
            'python_version': platform.python_version(),
            'hostname': hostname,
            'local_ip': local_ip,
            'is_windows': os.name == 'nt',
            'processor': platform.processor(),
            'machine': platform.machine()
        }
        
        return jsonify({
            'status': 'ok',
            'message': 'Network diagnostic information',
            'system_info': system_info,
            'request_headers': {k: v for k, v in request.headers.items()}
        })

    logger.info("Debug endpoints registered successfully")

# CORS対応のヘルパー関数
def _create_cors_preflight_response():
    """OPTIONSリクエストに対するCORSプリフライトレスポンスを作成する"""
    response = make_response()
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response
