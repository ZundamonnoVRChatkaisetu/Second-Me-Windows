#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Second Me Windows - プロファイルデバッグルート
プロファイル問題のトラブルシューティングのためのエンドポイント
"""

import os
import json
import traceback
from flask import jsonify, request, Flask, make_response
from config import logger, PROFILES_DIR, ACTIVE_PROFILE, WORKSPACE_DIR

def register_routes(app: Flask):
    """プロファイルデバッグルートを登録"""
    
    @app.route('/api/profile-debug', methods=['GET', 'OPTIONS'])
    def profile_debug():
        """
        プロファイル状態のデバッグ情報を提供するエンドポイント
        """
        if request.method == 'OPTIONS':
            return _create_cors_preflight_response()
        
        try:
            # 現在の作業ディレクトリ
            cwd = os.getcwd()
            
            # プロファイルディレクトリのチェック
            profile_dir_exists = os.path.exists(PROFILES_DIR)
            profile_items = []
            
            if profile_dir_exists:
                try:
                    items = os.listdir(PROFILES_DIR)
                    for item in items:
                        item_path = os.path.join(PROFILES_DIR, item)
                        item_type = "directory" if os.path.isdir(item_path) else "file"
                        item_size = os.path.getsize(item_path) if os.path.isfile(item_path) else 0
                        profile_items.append({
                            "name": item,
                            "type": item_type,
                            "size": item_size
                        })
                except Exception as e:
                    logger.error(f"Error listing profile directory: {str(e)}")
            
            # アクティブプロファイルのデバッグ情報
            active_profile_file = os.path.join(cwd, 'active_profile.json')
            active_profile_file_exists = os.path.exists(active_profile_file)
            active_profile_data = None
            
            if active_profile_file_exists:
                try:
                    with open(active_profile_file, 'r', encoding='utf-8') as f:
                        active_profile_data = json.load(f)
                except Exception as e:
                    logger.error(f"Error reading active_profile.json: {str(e)}")
            
            # WorkSpace ディレクトリのチェック
            workspace_dir_exists = os.path.exists(WORKSPACE_DIR)
            workspace_items = []
            
            if workspace_dir_exists:
                try:
                    items = os.listdir(WORKSPACE_DIR)
                    for item in items:
                        item_path = os.path.join(WORKSPACE_DIR, item)
                        item_type = "directory" if os.path.isdir(item_path) else "file"
                        workspace_items.append({
                            "name": item,
                            "type": item_type
                        })
                except Exception as e:
                    logger.error(f"Error listing workspace directory: {str(e)}")
            
            # デフォルトプロファイルディレクトリの詳細チェック
            default_profile_dir = os.path.join(PROFILES_DIR, "default_profile")
            default_profile_exists = os.path.exists(default_profile_dir)
            default_profile_config = None
            
            if default_profile_exists:
                config_path = os.path.join(default_profile_dir, 'config.json')
                if os.path.exists(config_path):
                    try:
                        with open(config_path, 'r', encoding='utf-8') as f:
                            default_profile_config = json.load(f)
                    except Exception as e:
                        logger.error(f"Error reading default profile config: {str(e)}")
            
            # パスパーミッションのチェック
            path_permissions = {}
            for path in [PROFILES_DIR, WORKSPACE_DIR, cwd]:
                if os.path.exists(path):
                    try:
                        writable = os.access(path, os.W_OK)
                        readable = os.access(path, os.R_OK)
                        path_permissions[path] = {
                            "readable": readable,
                            "writable": writable
                        }
                    except Exception as e:
                        path_permissions[path] = {
                            "error": str(e)
                        }
            
            # レスポンスの作成
            debug_info = {
                "current_working_directory": cwd,
                "profiles_dir": {
                    "path": PROFILES_DIR,
                    "exists": profile_dir_exists,
                    "items": profile_items
                },
                "active_profile": {
                    "value": ACTIVE_PROFILE,
                    "file_exists": active_profile_file_exists,
                    "file_data": active_profile_data
                },
                "workspace_dir": {
                    "path": WORKSPACE_DIR,
                    "exists": workspace_dir_exists,
                    "items": workspace_items
                },
                "default_profile": {
                    "path": default_profile_dir,
                    "exists": default_profile_exists,
                    "config": default_profile_config
                },
                "path_permissions": path_permissions
            }
            
            response = jsonify(debug_info)
            return _corsify_response(response)
            
        except Exception as e:
            logger.exception(f"Error in profile debug endpoint: {str(e)}")
            logger.error(traceback.format_exc())
            
            response = jsonify({
                "error": f"プロファイルデバッグ情報の取得中にエラーが発生しました: {str(e)}",
                "traceback": traceback.format_exc()
            })
            return _corsify_response(response, 500)

    @app.route('/api/fix-profiles', methods=['POST', 'OPTIONS'])
    def fix_profiles():
        """
        プロファイル問題を修正するエンドポイント
        """
        if request.method == 'OPTIONS':
            return _create_cors_preflight_response()
        
        try:
            # プロファイルディレクトリがない場合は作成
            if not os.path.exists(PROFILES_DIR):
                os.makedirs(PROFILES_DIR)
                logger.info(f"Created profiles directory: {PROFILES_DIR}")
            
            # デフォルトプロファイルディレクトリがない場合は作成
            default_profile_id = "default_profile"
            default_profile_dir = os.path.join(PROFILES_DIR, default_profile_id)
            
            if not os.path.exists(default_profile_dir):
                os.makedirs(default_profile_dir)
                logger.info(f"Created default profile directory: {default_profile_dir}")
            
            # デフォルトプロファイル設定ファイルがない場合は作成
            config_path = os.path.join(default_profile_dir, 'config.json')
            if not os.path.exists(config_path):
                from datetime import datetime
                default_config = {
                    'name': "Default Profile",
                    'description': "Auto-created emergency profile",
                    'created_at': datetime.now().isoformat(),
                    'model_path': ""
                }
                
                with open(config_path, 'w', encoding='utf-8') as f:
                    json.dump(default_config, f, ensure_ascii=False, indent=2)
                logger.info(f"Created default profile config: {config_path}")
            
            # アクティブプロファイル情報ファイルがない場合は作成
            active_profile_file = os.path.join(os.getcwd(), 'active_profile.json')
            if not os.path.exists(active_profile_file):
                active_profile_data = {
                    'active_profile': default_profile_id,
                    'model_path': ""
                }
                
                with open(active_profile_file, 'w', encoding='utf-8') as f:
                    json.dump(active_profile_data, f, ensure_ascii=False, indent=2)
                logger.info(f"Created active profile file: {active_profile_file}")
            
            # グローバル変数を更新
            import config as app_config
            app_config.ACTIVE_PROFILE = default_profile_id
            
            # WorkSpaceディレクトリがない場合は作成
            if not os.path.exists(WORKSPACE_DIR):
                os.makedirs(WORKSPACE_DIR)
                logger.info(f"Created workspace directory: {WORKSPACE_DIR}")
            
            # プロファイル用のWorkSpaceディレクトリがない場合は作成
            profile_workspace_dir = os.path.join(WORKSPACE_DIR, default_profile_id)
            if not os.path.exists(profile_workspace_dir):
                os.makedirs(profile_workspace_dir)
                logger.info(f"Created profile workspace directory: {profile_workspace_dir}")
            
            response = jsonify({
                "status": "success",
                "message": "プロファイル問題を修正しました",
                "active_profile": default_profile_id
            })
            return _corsify_response(response)
            
        except Exception as e:
            logger.exception(f"Error fixing profiles: {str(e)}")
            logger.error(traceback.format_exc())
            
            response = jsonify({
                "error": f"プロファイル問題の修正中にエラーが発生しました: {str(e)}",
                "traceback": traceback.format_exc()
            })
            return _corsify_response(response, 500)

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
    response = make_response()
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Accept,Origin')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response
