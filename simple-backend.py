#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
最小限のバックエンドアプリケーション - デバッグ用
Flaskアプリケーションの最小限の実装
"""

import os
from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # クロスオリジンリソース共有を有効化

# ポート設定
PORT = int(os.getenv('LOCAL_APP_PORT', 8002))

@app.route('/health', methods=['GET'])
def health_check():
    """ヘルスチェックエンドポイント"""
    return jsonify({
        'status': 'ok',
        'version': '1.0.0-debug'
    })

@app.route('/', methods=['GET'])
def root():
    """ルートエンドポイント"""
    return "Second Me Windows バックエンド (デバッグモード) 稼働中"

if __name__ == '__main__':
    print(f"Starting minimal debug backend on port {PORT}")
    print(f"Logs will be displayed in this console")
    print("-" * 50)
    
    # Flaskアプリケーション起動
    app.run(host='0.0.0.0', port=PORT, debug=True)
