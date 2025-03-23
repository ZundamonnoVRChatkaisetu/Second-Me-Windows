#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Second Me Windows - プロファイル作成エンドポイント
新しいプロファイルを作成するためのAPIエンドポイント
"""

import os
import json
import uuid
from datetime import datetime
from flask import jsonify, request, Flask, make_response

# ログの設定
import logging
logger = logging.getLogger(__name__)

def register_routes(app: Flask):
    """プロファイル作成関連のルートを登録"""
    
    @app.route('/api/profiles/create', methods=['POST', 'OPTIONS'])
    def create_profile():
        """新しいプロファイルを作成するエンドポイント"""
        if request.method == 'OPTIONS':
            return _create_cors_preflight_response()
        
        try:
            # リクエストデータを取得
            data = request.json or {}
            
            # 必須フィールドの確認
            if not data.get('name'):
                return jsonify({'error': 'プロファイル名は必須です'}), 400
            
            # プロファイルID (指定がなければ生成)
            profile_id = data.get('id', f"profile_{uuid.uuid4().hex[:8]}")
            
            # プロファイルディレクトリパスの取得
            current_dir = os.getcwd()
            profiles_dir = os.path.join(current_dir, 'profiles')
            
            # プロファイルディレクトリが存在しない場合は作成
            if not os.path.exists(profiles_dir):
                os.makedirs(profiles_dir)
            
            # プロファイルディレクトリのパス
            profile_dir = os.path.join(profiles_dir, profile_id)
            
            # すでに存在する場合はエラー
            if os.path.exists(profile_dir):
                return jsonify({'error': f'プロファイルID {profile_id} は既に存在します'}), 400
            
            # プロファイルディレクトリを作成
            os.makedirs(profile_dir)
            
            # プロファイルデータを準備
            profile_data = {
                'id': profile_id,
                'name': data.get('name'),
                'description': data.get('description', ''),
                'purpose': data.get('purpose', ''),
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat(),
                'model_path': data.get('model_path', ''),
                'active': False,
                'is_active': False,
                'parameters': data.get('parameters', {}),
                'personality': data.get('personality', {})
            }
            
            # config.jsonファイルを作成
            config_path = os.path.join(profile_dir, 'config.json')
            with open(config_path, 'w', encoding='utf-8') as f:
                json.dump(profile_data, f, ensure_ascii=False, indent=2)
            
            # カスタムプロンプトがある場合は保存
            if data.get('personality', {}).get('custom_prompt'):
                prompt_path = os.path.join(profile_dir, 'system_prompt.txt')
                with open(prompt_path, 'w', encoding='utf-8') as f:
                    f.write(data['personality']['custom_prompt'])
            
            # 成功レスポンスを返す
            response = jsonify({
                'success': True,
                'message': 'プロファイルが正常に作成されました',
                'profile': profile_data
            })
            
            # CORSヘッダーを追加
            response.headers.add('Access-Control-Allow-Origin', '*')
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
            response.headers.add('Access-Control-Allow-Methods', 'POST,OPTIONS')
            
            logger.info(f"Profile {profile_id} created successfully")
            return response
            
        except Exception as e:
            logger.error(f"Error creating profile: {str(e)}")
            
            # エラーレスポンスを返す
            response = jsonify({
                'success': False,
                'error': f'プロファイルの作成に失敗しました: {str(e)}'
            }), 500
            
            # CORSヘッダーを追加
            response[0].headers.add('Access-Control-Allow-Origin', '*')
            response[0].headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
            response[0].headers.add('Access-Control-Allow-Methods', 'POST,OPTIONS')
            
            return response

    @app.route('/api/models', methods=['GET', 'OPTIONS'])
    def get_models():
        """利用可能なモデル一覧を取得するエンドポイント"""
        if request.method == 'OPTIONS':
            return _create_cors_preflight_response()
        
        try:
            # モデルディレクトリパスの取得
            current_dir = os.getcwd()
            models_dir = os.path.join(current_dir, 'models')
            
            # モデルディレクトリが存在しない場合は作成
            if not os.path.exists(models_dir):
                os.makedirs(models_dir)
            
            # モデルファイルを検索
            model_files = []
            for ext in ['.gguf', '.bin', '.ggml', '.pt']:
                model_files.extend(os.path.join(models_dir, f) for f in os.listdir(models_dir) if f.endswith(ext))
            
            # モデル情報を取得
            models = []
            for model_path in model_files:
                model_name = os.path.basename(model_path)
                model_size = os.path.getsize(model_path) / (1024 * 1024 * 1024)  # GB単位
                
                models.append({
                    'name': model_name,
                    'path': model_path,
                    'size': model_size,
                    'selected': False
                })
            
            # モデルがない場合はダミーモデルを返す
            if not models:
                models.append({
                    'name': 'ダミーモデル',
                    'path': os.path.join(models_dir, 'dummy.gguf'),
                    'size': 0.1,
                    'selected': True,
                    'is_dummy': True
                })
            else:
                # 最初のモデルを選択状態に
                models[0]['selected'] = True
            
            # 成功レスポンスを返す
            response = jsonify({
                'success': True,
                'models': models,
                'models_dir': models_dir
            })
            
            # CORSヘッダーを追加
            response.headers.add('Access-Control-Allow-Origin', '*')
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
            response.headers.add('Access-Control-Allow-Methods', 'GET,OPTIONS')
            
            return response
            
        except Exception as e:
            logger.error(f"Error getting models: {str(e)}")
            
            # エラーレスポンスを返す
            response = jsonify({
                'success': False,
                'error': f'モデル一覧の取得に失敗しました: {str(e)}',
                'models': [
                    {
                        'name': 'ダミーモデル',
                        'path': '',
                        'size': 0.1,
                        'selected': True,
                        'is_dummy': True
                    }
                ]
            })
            
            # CORSヘッダーを追加
            response.headers.add('Access-Control-Allow-Origin', '*')
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
            response.headers.add('Access-Control-Allow-Methods', 'GET,OPTIONS')
            
            return response

# CORS対応のヘルパー関数
def _create_cors_preflight_response():
    """OPTIONSリクエストに対するCORSプリフライトレスポンスを作成する"""
    response = make_response()
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response
