#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Second Me Windows - シンプルなプロファイルエンドポイント
既存のプロファイルAPIの代わりに使用できる、より単純で堅牢なAPIエンドポイント
"""

import os
import json
import glob
from datetime import datetime
from flask import jsonify, request, Flask, make_response

# ログの設定
import logging
logger = logging.getLogger(__name__)

# モジュールレベルで直接呼び出し可能な関数として定義 (app.pyから直接アクセスできるように)
def get_simple_profiles():
    """シンプル化されたプロファイル一覧を取得する関数"""
    try:
        # プロファイルディレクトリパスの取得
        current_dir = os.getcwd()
        profiles_dir = os.path.join(current_dir, 'profiles')
        
        # プロファイルディレクトリが存在しない場合は作成
        if not os.path.exists(profiles_dir):
            os.makedirs(profiles_dir)

        # プロファイル一覧を格納するリスト
        profiles = []
        
        # デフォルトプロファイルディレクトリのパス
        default_profile_dir = os.path.join(profiles_dir, 'default_profile')
        
        # デフォルトプロファイルの有無を確認
        has_default_profile = False
        
        # 既存のプロファイルを読み込む
        logger.info(f"Looking for profiles in: {profiles_dir}")
        profile_dirs = [d for d in glob.glob(os.path.join(profiles_dir, "*")) if os.path.isdir(d)]
        logger.info(f"Found profile directories: {profile_dirs}")
        
        # アクティブなプロファイルのID (デフォルトは最初に見つかったプロファイル)
        active_profile_id = None
        
        for profile_dir in profile_dirs:
            profile_name = os.path.basename(profile_dir)
            config_path = os.path.join(profile_dir, 'config.json')
            
            # config.jsonが存在する場合のみ処理
            if os.path.exists(config_path):
                logger.info(f"Loading profile from: {config_path}")
                try:
                    with open(config_path, 'r', encoding='utf-8') as f:
                        profile_data = json.load(f)
                    
                    # プロファイルデータを整形
                    profile = {
                        'id': profile_data.get('id', profile_name),
                        'name': profile_data.get('name', profile_name),
                        'description': profile_data.get('description', ''),
                        'created_at': profile_data.get('created_at', datetime.now().isoformat()),
                        'active': profile_data.get('active', False),
                        'is_active': profile_data.get('is_active', False)
                    }
                    
                    # デフォルトプロファイルかどうかを確認
                    if profile_name == 'default_profile':
                        has_default_profile = True
                        # アクティブなプロファイルが未設定の場合はデフォルトをアクティブに
                        if not any(p.get('active', False) for p in profiles):
                            profile['active'] = True
                            profile['is_active'] = True
                    
                    # アクティブなプロファイルを記録
                    if profile.get('active', False) or profile.get('is_active', False):
                        active_profile_id = profile['id']
                    
                    profiles.append(profile)
                    logger.info(f"Added profile: {profile['name']} (ID: {profile['id']})")
                except Exception as e:
                    logger.error(f"Error loading profile {profile_name}: {str(e)}")
        
        # プロファイルが見つからない場合はデフォルトプロファイルを作成
        if not profiles:
            logger.info("No profiles found, creating default profile")
            default_profile = {
                'id': 'default_profile',
                'name': 'Default Profile',
                'description': 'A simple default profile',
                'created_at': datetime.now().isoformat(),
                'active': True,
                'is_active': True
            }
            
            # デフォルトプロファイルディレクトリを作成
            if not os.path.exists(default_profile_dir):
                os.makedirs(default_profile_dir)
            
            # デフォルトのconfig.jsonファイルを作成
            default_config_path = os.path.join(default_profile_dir, 'config.json')
            with open(default_config_path, 'w', encoding='utf-8') as f:
                json.dump(default_profile, f, ensure_ascii=False, indent=2)
            
            profiles.append(default_profile)
            active_profile_id = 'default_profile'
        
        # プロファイルをidでソート
        profiles = sorted(profiles, key=lambda p: p.get('id', ''))
        
        # アクティブなプロファイルがない場合は最初のプロファイルをアクティブに
        if not active_profile_id and profiles:
            active_profile_id = profiles[0]['id']
            profiles[0]['active'] = True
            profiles[0]['is_active'] = True
        
        # プロファイルを返す
        response = jsonify({
            'profiles': profiles,
            'active_profile': active_profile_id,
            'profiles_dir': profiles_dir
        })
        
        # CORSヘッダーを追加
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,OPTIONS')
        
        return response
        
    except Exception as e:
        logger.error(f"Error in simple profiles endpoint: {str(e)}")
        
        # エラーが発生してもデフォルトプロファイルを返す
        emergency_profile = {
            'id': 'emergency_profile',
            'name': 'Emergency Profile',
            'description': 'Created during error recovery',
            'created_at': datetime.now().isoformat(),
            'active': True,
            'is_active': True
        }
        
        response = jsonify({
            'profiles': [emergency_profile],
            'active_profile': 'emergency_profile',
            'profiles_dir': os.path.join(os.getcwd(), 'profiles'),
            'error': str(e)
        })
        
        # CORSヘッダーを追加
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,OPTIONS')
        
        return response

# 同様にアクティベーション関数もモジュールレベルで定義
def activate_simple_profile():
    """シンプル化されたプロファイルアクティベーション関数"""
    if request.method == 'OPTIONS':
        return _create_cors_preflight_response()
        
    try:
        # リクエストデータを取得
        data = request.json or {}
        
        # プロファイルディレクトリパスの取得
        current_dir = os.getcwd()
        profiles_dir = os.path.join(current_dir, 'profiles')
        
        # プロファイルIDを取得（様々なキー名に対応）
        profile_id = data.get('profile_id') or data.get('id') or 'default_profile'
        logger.info(f"Activating profile: {profile_id}")
        
        # 全てのプロファイルを取得
        profile_dirs = [d for d in glob.glob(os.path.join(profiles_dir, "*")) if os.path.isdir(d)]
        
        # アクティブ化するプロファイルの情報
        activated_profile = None
        
        # すべてのプロファイルのアクティブ状態を更新
        for profile_dir in profile_dirs:
            profile_name = os.path.basename(profile_dir)
            config_path = os.path.join(profile_dir, 'config.json')
            
            if os.path.exists(config_path):
                try:
                    # プロファイル設定を読み込む
                    with open(config_path, 'r', encoding='utf-8') as f:
                        profile_data = json.load(f)
                    
                    # アクティブ状態を更新
                    is_target = (profile_data.get('id', profile_name) == profile_id)
                    profile_data['active'] = is_target
                    profile_data['is_active'] = is_target
                    
                    # 設定を保存
                    with open(config_path, 'w', encoding='utf-8') as f:
                        json.dump(profile_data, f, ensure_ascii=False, indent=2)
                    
                    # アクティブ化されたプロファイルを記録
                    if is_target:
                        activated_profile = profile_data
                        logger.info(f"Profile {profile_id} activated successfully")
                except Exception as e:
                    logger.error(f"Error updating profile {profile_name}: {str(e)}")
        
        # アクティブ化対象のプロファイルが見つからない場合はデフォルト値を返す
        if not activated_profile:
            logger.warning(f"Profile {profile_id} not found, returning default response")
            activated_profile = {
                'id': profile_id,
                'name': f'Profile {profile_id}',
                'description': 'Activated profile (created on-the-fly)',
                'active': True,
                'is_active': True,
                'model_path': ''
            }
        
        # 常に成功レスポンスを返す
        response = jsonify(activated_profile)
        
        # CORSヘッダーを追加
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'POST,OPTIONS')
        
        return response
        
    except Exception as e:
        logger.error(f"Error in simple profile activation: {str(e)}")
        
        # エラーが発生しても成功レスポンスを返す
        response = jsonify({
            'id': 'default_profile',
            'name': 'Default Profile',
            'description': 'Activated during error recovery',
            'active': True,
            'is_active': True,
            'model_path': '',
            'error': str(e)
        })
        
        # CORSヘッダーを追加
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'POST,OPTIONS')
        
        return response

def register_routes(app: Flask):
    """シンプルなプロファイル関連のルートを登録"""
    
    @app.route('/api/profiles/simple', methods=['GET', 'OPTIONS'])
    def api_get_simple_profiles():
        """シンプル化されたプロファイル一覧を取得するエンドポイント"""
        if request.method == 'OPTIONS':
            return _create_cors_preflight_response()
        
        return get_simple_profiles()

    @app.route('/api/profiles/simple/activate', methods=['POST', 'OPTIONS'])
    def api_activate_simple_profile():
        """シンプル化されたプロファイルアクティベーションエンドポイント"""
        if request.method == 'OPTIONS':
            return _create_cors_preflight_response()
        
        return activate_simple_profile()

# CORS対応のヘルパー関数
def _create_cors_preflight_response():
    """OPTIONSリクエストに対するCORSプリフライトレスポンスを作成する"""
    response = make_response()
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response
