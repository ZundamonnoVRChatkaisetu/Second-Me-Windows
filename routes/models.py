#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Second Me Windows - モデルルート
モデルの管理とアクセスのためのエンドポイント
"""

import os
import json
from flask import jsonify, request, Flask
from config import logger, MODELS_DIR, SELECTED_MODEL_PATH, PROFILES_DIR, ACTIVE_PROFILE


def register_routes(app: Flask):
    """モデル関連のルートを登録"""
    
    @app.route('/api/models', methods=['GET'])
    def get_models():
        """
        使用可能なモデルの一覧を取得するエンドポイント
        """
        try:
            # モデルディレクトリをスキャン
            model_files = []
            if os.path.exists(MODELS_DIR):
                model_files = [
                    f for f in os.listdir(MODELS_DIR) 
                    if os.path.isfile(os.path.join(MODELS_DIR, f)) and 
                    f.endswith(('.gguf', '.bin', '.pt', '.ggml'))
                ]
            
            # モデル情報の詳細を取得
            models = []
            for model_file in model_files:
                model_path = os.path.join(MODELS_DIR, model_file)
                model_size = os.path.getsize(model_path) / (1024 * 1024)  # MBに変換
                
                # 選択されているモデルかどうかを確認
                is_selected = model_path == SELECTED_MODEL_PATH
                
                models.append({
                    'name': model_file,
                    'path': model_path,
                    'size_mb': round(model_size, 2),
                    'is_selected': is_selected
                })
            
            return jsonify({
                'models': models,
                'selected_model': os.path.basename(SELECTED_MODEL_PATH) if SELECTED_MODEL_PATH else None,
                'models_dir': MODELS_DIR
            })
            
        except Exception as e:
            logger.exception(f"Error getting models: {str(e)}")
            return jsonify({
                'error': f"モデル一覧の取得中にエラーが発生しました: {str(e)}"
            }), 500


    @app.route('/api/models/select', methods=['POST'])
    def select_model():
        """
        モデルを選択するエンドポイント
        """
        try:
            data = request.json
            model_path = data.get('model_path')
            
            if not model_path:
                return jsonify({
                    'error': 'モデルパスが指定されていません'
                }), 400
            
            # 相対パスが指定された場合は絶対パスに変換
            if not os.path.isabs(model_path):
                model_path = os.path.join(MODELS_DIR, model_path)
            
            # モデルファイルの存在確認
            if not os.path.exists(model_path):
                return jsonify({
                    'error': f'モデルファイルが見つかりません: {model_path}'
                }), 404
            
            # グローバル変数を更新
            import config
            config.SELECTED_MODEL_PATH = model_path
            
            # 現在のプロファイルの設定も更新
            if ACTIVE_PROFILE:
                profile_config_path = os.path.join(PROFILES_DIR, ACTIVE_PROFILE, 'config.json')
                if os.path.exists(profile_config_path):
                    try:
                        with open(profile_config_path, 'r', encoding='utf-8') as f:
                            profile_config = json.load(f)
                        
                        # モデルパスを更新
                        profile_config['model_path'] = model_path
                        
                        with open(profile_config_path, 'w', encoding='utf-8') as f:
                            json.dump(profile_config, f, ensure_ascii=False, indent=2)
                        
                        logger.info(f"Updated profile {ACTIVE_PROFILE} with model {model_path}")
                    except Exception as e:
                        logger.error(f"Failed to update profile config: {str(e)}")
            
            return jsonify({
                'status': 'success',
                'message': f'モデルを選択しました: {os.path.basename(model_path)}',
                'model_path': model_path
            })
            
        except Exception as e:
            logger.exception(f"Error selecting model: {str(e)}")
            return jsonify({
                'error': f"モデル選択中にエラーが発生しました: {str(e)}"
            }), 500


    @app.route('/api/models/info/<model_name>', methods=['GET'])
    def get_model_info(model_name):
        """
        特定のモデルの詳細情報を取得するエンドポイント
        """
        try:
            model_path = os.path.join(MODELS_DIR, model_name)
            
            # モデルファイルの存在確認
            if not os.path.exists(model_path):
                return jsonify({
                    'error': f'モデルファイルが見つかりません: {model_name}'
                }), 404
            
            # モデル情報の取得
            file_stats = os.stat(model_path)
            model_size = file_stats.st_size / (1024 * 1024)  # MBに変換
            model_modified = file_stats.st_mtime
            
            # 現在選択されているモデルかどうか
            is_selected = model_path == SELECTED_MODEL_PATH
            
            return jsonify({
                'name': model_name,
                'path': model_path,
                'size_mb': round(model_size, 2),
                'modified': model_modified,
                'is_selected': is_selected
            })
            
        except Exception as e:
            logger.exception(f"Error getting model info: {str(e)}")
            return jsonify({
                'error': f"モデル情報の取得中にエラーが発生しました: {str(e)}"
            }), 500
