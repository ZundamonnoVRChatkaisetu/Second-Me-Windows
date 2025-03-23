#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Second Me Windows - プロファイルルート
プロファイルの管理と操作のためのエンドポイント
"""

import os
import json
import shutil
from flask import jsonify, request, Flask, make_response
from werkzeug.utils import secure_filename
from config import logger, PROFILES_DIR, ACTIVE_PROFILE, SELECTED_MODEL_PATH, WORKSPACE_DIR

# アクティブプロファイル情報を保存するファイル
ACTIVE_PROFILE_FILE = os.path.join(os.getcwd(), 'active_profile.json')

def save_active_profile(profile_id, model_path=''):
    """
    アクティブプロファイル情報をファイルに保存して永続化
    """
    try:
        data = {
            'active_profile': profile_id,
            'model_path': model_path
        }
        with open(ACTIVE_PROFILE_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        logger.info(f"Active profile saved to file: {profile_id}")
        return True
    except Exception as e:
        logger.error(f"Failed to save active profile: {str(e)}")
        return False

def load_active_profile():
    """
    保存されたアクティブプロファイル情報を読み込む
    """
    if not os.path.exists(ACTIVE_PROFILE_FILE):
        return None, None
        
    try:
        with open(ACTIVE_PROFILE_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return data.get('active_profile', ''), data.get('model_path', '')
    except Exception as e:
        logger.error(f"Failed to load active profile: {str(e)}")
        return None, None

def register_routes(app: Flask):
    """プロファイル関連のルートを登録"""
    
    @app.route('/api/profiles', methods=['GET', 'OPTIONS'])
    def get_profiles():
        """
        利用可能なプロファイルの一覧を取得するエンドポイント
        """
        if request.method == 'OPTIONS':
            return _create_cors_preflight_response()
            
        try:
            profiles = []
            
            # プロファイルディレクトリをスキャン
            if os.path.exists(PROFILES_DIR):
                for item in os.listdir(PROFILES_DIR):
                    profile_dir = os.path.join(PROFILES_DIR, item)
                    config_path = os.path.join(profile_dir, 'config.json')
                    
                    if os.path.isdir(profile_dir) and os.path.exists(config_path):
                        try:
                            # プロファイル設定を読み込む
                            with open(config_path, 'r', encoding='utf-8') as f:
                                config = json.load(f)
                            
                            # アクティブなプロファイルかどうかを確認
                            is_active = item == ACTIVE_PROFILE
                            
                            profiles.append({
                                'id': item,
                                'name': config.get('name', item),
                                'description': config.get('description', ''),
                                'created_at': config.get('created_at', ''),
                                'active': is_active,  # フロントエンド互換性のため
                                'is_active': is_active,
                                'model_path': config.get('model_path', ''),
                                'training_count': 0,
                                'memories_count': 0
                            })
                        except Exception as e:
                            logger.warning(f"Failed to load profile {item}: {str(e)}")
            
            response = jsonify({
                'profiles': profiles,
                'active_profile': ACTIVE_PROFILE,
                'profiles_dir': PROFILES_DIR
            })
            return _corsify_response(response)
            
        except Exception as e:
            logger.exception(f"Error getting profiles: {str(e)}")
            response = jsonify({
                'error': f"プロファイル一覧の取得中にエラーが発生しました: {str(e)}"
            })
            return _corsify_response(response, 500)


    @app.route('/api/profiles/create', methods=['POST', 'OPTIONS'])
    def create_profile():
        """
        新しいプロファイルを作成するエンドポイント
        """
        if request.method == 'OPTIONS':
            return _create_cors_preflight_response()
            
        try:
            data = request.json
            profile_name = data.get('name')
            profile_description = data.get('description', '')
            model_path = data.get('model_path', SELECTED_MODEL_PATH)
            
            if not profile_name:
                response = jsonify({
                    'error': 'プロファイル名が指定されていません'
                })
                return _corsify_response(response, 400)
            
            # プロファイルIDの生成（名前をベースに安全なファイル名に変換）
            profile_id = secure_filename(profile_name.lower().replace(' ', '_'))
            
            # 既存のプロファイルとの重複チェック
            profile_dir = os.path.join(PROFILES_DIR, profile_id)
            if os.path.exists(profile_dir):
                response = jsonify({
                    'error': f'プロファイル "{profile_name}" は既に存在します'
                })
                return _corsify_response(response, 409)
            
            # プロファイルディレクトリの作成
            os.makedirs(profile_dir, exist_ok=True)
            
            # ワークスペースディレクトリの作成
            workspace_dir = os.path.join(WORKSPACE_DIR, profile_id)
            os.makedirs(workspace_dir, exist_ok=True)
            
            # プロファイル設定の保存
            from datetime import datetime
            config = {
                'name': profile_name,
                'description': profile_description,
                'created_at': datetime.now().isoformat(),
                'model_path': model_path
            }
            
            with open(os.path.join(profile_dir, 'config.json'), 'w', encoding='utf-8') as f:
                json.dump(config, f, ensure_ascii=False, indent=2)
            
            # 新しいプロファイルをアクティブにする
            import config as app_config
            app_config.ACTIVE_PROFILE = profile_id
            
            # アクティブプロファイル情報を永続化
            save_active_profile(profile_id, model_path)
            
            logger.info(f"Created new profile {profile_id} and set as active")
            
            response = jsonify({
                'status': 'success',
                'message': f'プロファイル "{profile_name}" を作成しました',
                'profile_id': profile_id
            })
            return _corsify_response(response)
            
        except Exception as e:
            logger.exception(f"Error creating profile: {str(e)}")
            response = jsonify({
                'error': f"プロファイル作成中にエラーが発生しました: {str(e)}"
            })
            return _corsify_response(response, 500)


    @app.route('/api/profiles/select', methods=['POST', 'PUT', 'OPTIONS'])
    def select_profile():
        """
        プロファイルを選択するエンドポイント
        POSTとPUTの両方のHTTPメソッドをサポート（フロントエンド互換性のため）
        """
        if request.method == 'OPTIONS':
            return _create_cors_preflight_response()
            
        try:
            data = request.json
            profile_id = data.get('profile_id')
            
            if not profile_id:
                response = jsonify({
                    'error': 'プロファイルIDが指定されていません'
                })
                return _corsify_response(response, 400)
            
            # プロファイルの存在確認
            profile_dir = os.path.join(PROFILES_DIR, profile_id)
            config_path = os.path.join(profile_dir, 'config.json')
            
            if not os.path.exists(profile_dir) or not os.path.exists(config_path):
                response = jsonify({
                    'error': f'プロファイル "{profile_id}" が見つかりません'
                })
                return _corsify_response(response, 404)
            
            # グローバル変数を更新
            import config as app_config
            app_config.ACTIVE_PROFILE = profile_id
            
            # プロファイル設定
            profile_config = {}
            
            # プロファイルのモデルも選択
            try:
                with open(config_path, 'r', encoding='utf-8') as f:
                    profile_config = json.load(f)
                
                model_path = profile_config.get('model_path', '')
                if model_path and os.path.exists(model_path):
                    app_config.SELECTED_MODEL_PATH = model_path
                    logger.info(f"Using profile's model: {model_path}")
            except Exception as e:
                logger.error(f"Failed to load profile config: {str(e)}")
            
            # アクティブプロファイル情報を永続化
            save_active_profile(profile_id, profile_config.get('model_path', ''))
            
            # フロントエンドの期待する応答形式
            response = jsonify({
                'id': profile_id,
                'name': profile_config.get('name', profile_id),
                'description': profile_config.get('description', ''),
                'active': True,
                'is_active': True,
                'model_path': profile_config.get('model_path', ''),
                'training_count': 0,
                'memories_count': 0
            })
            return _corsify_response(response)
            
        except Exception as e:
            logger.exception(f"Error selecting profile: {str(e)}")
            response = jsonify({
                'error': f"プロファイル選択中にエラーが発生しました: {str(e)}"
            })
            return _corsify_response(response, 500)

    # フロントエンド互換性のために /activate エンドポイントを追加
    @app.route('/api/profiles/activate', methods=['POST', 'PUT', 'OPTIONS'])
    def activate_profile():
        """
        プロファイルをアクティブ化するエンドポイント
        古いフロントエンドコードとの互換性のために提供
        """
        # OPTIONS リクエストの処理
        if request.method == 'OPTIONS':
            return _create_cors_preflight_response()
            
        try:
            # リクエストのログ
            logger.info(f"activate_profile request: method={request.method}, data={request.json}")
            
            data = request.json
            if not data:
                response = jsonify({
                    'error': 'リクエストデータが空です'
                })
                return _corsify_response(response, 400)
            
            # 異なる形式からprofile_idを抽出
            profile_id = None
            if 'profile_id' in data:
                profile_id = data['profile_id']
            elif 'id' in data:
                profile_id = data['id']
            
            if not profile_id:
                response = jsonify({
                    'error': 'プロファイルIDが指定されていません'
                })
                return _corsify_response(response, 400)
            
            # プロファイルの存在確認
            profile_dir = os.path.join(PROFILES_DIR, profile_id)
            config_path = os.path.join(profile_dir, 'config.json')
            
            if not os.path.exists(profile_dir) or not os.path.exists(config_path):
                response = jsonify({
                    'error': f'プロファイル "{profile_id}" が見つかりません'
                })
                return _corsify_response(response, 404)
            
            # グローバル変数を更新
            import config as app_config
            app_config.ACTIVE_PROFILE = profile_id
            
            # プロファイル設定を読み込む
            profile_config = {}
            try:
                with open(config_path, 'r', encoding='utf-8') as f:
                    profile_config = json.load(f)
                
                # モデルも選択
                model_path = profile_config.get('model_path', '')
                if model_path and os.path.exists(model_path):
                    app_config.SELECTED_MODEL_PATH = model_path
                    logger.info(f"Using profile's model: {model_path}")
            except Exception as e:
                logger.error(f"Failed to load profile config: {str(e)}")
            
            # アクティブプロファイル情報を永続化
            save_active_profile(profile_id, profile_config.get('model_path', ''))
            
            # フロントエンドの期待する応答形式
            response_data = {
                'id': profile_id,
                'name': profile_config.get('name', profile_id),
                'description': profile_config.get('description', ''),
                'active': True,
                'is_active': True,
                'model_path': profile_config.get('model_path', ''),
                'training_count': 0,
                'memories_count': 0
            }
            
            return _corsify_response(jsonify(response_data))
            
        except Exception as e:
            logger.exception(f"Error activating profile: {str(e)}")
            response = jsonify({
                'error': f"プロファイル選択中にエラーが発生しました: {str(e)}"
            })
            return _corsify_response(response, 500)


    @app.route('/api/profiles/<profile_id>', methods=['PUT', 'OPTIONS'])
    def update_profile(profile_id):
        """
        プロファイルを更新するエンドポイント
        """
        if request.method == 'OPTIONS':
            return _create_cors_preflight_response()
            
        try:
            # プロファイルの存在確認
            profile_dir = os.path.join(PROFILES_DIR, profile_id)
            config_path = os.path.join(profile_dir, 'config.json')
            
            if not os.path.exists(profile_dir) or not os.path.exists(config_path):
                response = jsonify({
                    'error': f'プロファイル "{profile_id}" が見つかりません'
                })
                return _corsify_response(response, 404)
            
            # 現在の設定を読み込む
            with open(config_path, 'r', encoding='utf-8') as f:
                config = json.load(f)
            
            # 更新データを取得
            data = request.json
            if 'name' in data:
                config['name'] = data['name']
            if 'description' in data:
                config['description'] = data['description']
            if 'model_path' in data and data['model_path']:
                config['model_path'] = data['model_path']
            
            # 更新した設定を保存
            with open(config_path, 'w', encoding='utf-8') as f:
                json.dump(config, f, ensure_ascii=False, indent=2)
            
            response = jsonify({
                'status': 'success',
                'message': f'プロファイル "{profile_id}" を更新しました',
                'profile': config
            })
            return _corsify_response(response)
            
        except Exception as e:
            logger.exception(f"Error updating profile: {str(e)}")
            response = jsonify({
                'error': f"プロファイル更新中にエラーが発生しました: {str(e)}"
            })
            return _corsify_response(response, 500)


    @app.route('/api/profiles/<profile_id>', methods=['DELETE', 'OPTIONS'])
    def delete_profile(profile_id):
        """
        プロファイルを削除するエンドポイント
        """
        if request.method == 'OPTIONS':
            return _create_cors_preflight_response()
            
        try:
            # プロファイルの存在確認
            profile_dir = os.path.join(PROFILES_DIR, profile_id)
            
            if not os.path.exists(profile_dir):
                response = jsonify({
                    'error': f'プロファイル "{profile_id}" が見つかりません'
                })
                return _corsify_response(response, 404)
            
            # アクティブなプロファイルを削除しようとしている場合
            if profile_id == ACTIVE_PROFILE:
                response = jsonify({
                    'error': 'アクティブなプロファイルは削除できません。先に別のプロファイルを選択してください。'
                })
                return _corsify_response(response, 400)
            
            # プロファイルディレクトリを削除
            shutil.rmtree(profile_dir)
            
            # 関連するワークスペースも削除
            workspace_dir = os.path.join(WORKSPACE_DIR, profile_id)
            if os.path.exists(workspace_dir):
                shutil.rmtree(workspace_dir)
            
            response = jsonify({
                'status': 'success',
                'message': f'プロファイル "{profile_id}" を削除しました'
            })
            return _corsify_response(response)
            
        except Exception as e:
            logger.exception(f"Error deleting profile: {str(e)}")
            response = jsonify({
                'error': f"プロファイル削除中にエラーが発生しました: {str(e)}"
            })
            return _corsify_response(response, 500)

# CORS対応のヘルパー関数
def _corsify_response(response, status_code=200):
    """レスポンスにCORSヘッダーを追加する"""
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    if status_code != 200:
        response.status_code = status_code
    return response

def _create_cors_preflight_response():
    """OPTIONSリクエストに対するCORSプリフライトレスポンスを作成する"""
    response = make_response()
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response
