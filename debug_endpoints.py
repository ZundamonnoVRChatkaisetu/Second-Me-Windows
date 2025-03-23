#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Second Me Windows - デバッグ用エンドポイント
テストと診断目的のための単純なAPIエンドポイント
"""

from flask import Flask, jsonify, request, Response
import logging

# ロガーの取得
logger = logging.getLogger(__name__)

def register_debug_routes(app: Flask):
    """デバッグ用のエンドポイントを登録する"""
    
    @app.route('/debug', methods=['GET', 'OPTIONS'])
    def debug_info():
        """デバッグ情報を返すエンドポイント"""
        if request.method == 'OPTIONS':
            resp = Response('')
            resp.headers['Access-Control-Allow-Origin'] = '*'
            resp.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
            resp.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
            return resp
            
        # リクエスト情報のログ
        logger.info(f"Debug request received: {request.remote_addr}")
        logger.info(f"Debug request headers: {dict(request.headers)}")
        
        # デバッグ情報を準備
        debug_data = {
            'status': 'ok',
            'message': 'Debug endpoint is working',
            'request': {
                'remote_addr': request.remote_addr,
                'method': request.method,
                'headers': dict(request.headers),
                'args': dict(request.args)
            },
            'server_info': {
                'flask_version': app.version
            }
        }
        
        # レスポンスを準備
        response = jsonify(debug_data)
        
        # CORSヘッダーを明示的に設定
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        
        return response

    @app.route('/api/debug', methods=['GET', 'OPTIONS'])
    def api_debug_info():
        """API互換のデバッグ情報を返すエンドポイント"""
        if request.method == 'OPTIONS':
            resp = Response('')
            resp.headers['Access-Control-Allow-Origin'] = '*'
            resp.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
            resp.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
            return resp
            
        # リクエスト情報のログ
        logger.info(f"API Debug request received: {request.remote_addr}")
        logger.info(f"API Debug request headers: {dict(request.headers)}")
        
        # デバッグ情報を準備
        debug_data = {
            'status': 'ok',
            'message': 'API Debug endpoint is working',
            'request_info': {
                'remote_addr': request.remote_addr,
                'method': request.method,
                'headers': dict(request.headers)
            },
            'cors_status': 'enabled'
        }
        
        # レスポンスを準備
        response = jsonify(debug_data)
        
        # CORSヘッダーを明示的に設定
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        
        return response

    # JSONPを使用したCORSバイパステスト用エンドポイント
    @app.route('/api/jsonp/debug', methods=['GET'])
    def jsonp_debug():
        """JSONPを使用したデバッグ情報を返すエンドポイント"""
        # コールバック関数名を取得
        callback = request.args.get('callback', 'callback')
        
        # デバッグ情報を準備
        debug_data = {
            'status': 'ok',
            'message': 'JSONP Debug endpoint is working',
            'method': 'JSONP (Cross-Origin compatible)',
            'timestamp': '2025-03-23T00:00:00Z'
        }
        
        # JSONPレスポンスを生成
        jsonp_response = f"{callback}({jsonify(debug_data).get_data(as_text=True)});"
        
        # レスポンスを準備
        response = Response(jsonp_response, mimetype='application/javascript')
        
        return response

    # エンドポイントのテスト
    logger.info("Debug endpoints registered successfully")
