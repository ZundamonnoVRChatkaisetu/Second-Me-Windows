#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Second Me Windows - アップロードルート
ファイルアップロードとデータインポートのためのエンドポイント
"""

import os
import json
from datetime import datetime
from flask import jsonify, request, Flask, send_from_directory
from werkzeug.utils import secure_filename
from config import logger, UPLOAD_FOLDER, ALLOWED_EXTENSIONS, PROFILES_DIR, ACTIVE_PROFILE


def allowed_file(filename):
    """許可されたファイル拡張子かチェックする関数"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def register_routes(app: Flask):
    """アップロード関連のルートを登録"""
    
    @app.route('/api/upload', methods=['POST'])
    def upload_file():
        """
        ファイルをアップロードするエンドポイント
        """
        try:
            # ファイルが添付されていない場合
            if 'file' not in request.files:
                return jsonify({
                    'error': 'ファイルが添付されていません'
                }), 400
            
            file = request.files['file']
            
            # ファイル名が空の場合
            if file.filename == '':
                return jsonify({
                    'error': 'ファイル名が空です'
                }), 400
            
            # ファイルタイプが許可されていない場合
            if not allowed_file(file.filename):
                return jsonify({
                    'error': f'この拡張子のファイルはアップロードできません。許可されている拡張子: {", ".join(ALLOWED_EXTENSIONS)}'
                }), 400
            
            # プロファイル指定がある場合はプロファイル専用のアップロードディレクトリを使用
            profile_id = request.form.get('profile_id', ACTIVE_PROFILE)
            
            if profile_id:
                upload_dir = os.path.join(PROFILES_DIR, profile_id, 'uploads')
            else:
                upload_dir = UPLOAD_FOLDER
            
            # アップロードディレクトリが存在しない場合は作成
            if not os.path.exists(upload_dir):
                os.makedirs(upload_dir, exist_ok=True)
            
            # ファイル名を安全にして保存
            filename = secure_filename(file.filename)
            file_path = os.path.join(upload_dir, filename)
            
            # ファイルを保存
            file.save(file_path)
            
            # アップロード記録の作成
            upload_record = {
                'filename': filename,
                'path': file_path,
                'size': os.path.getsize(file_path),
                'upload_time': datetime.now().isoformat(),
                'profile_id': profile_id
            }
            
            # アップロード記録をJSON形式で保存
            uploads_json = os.path.join(upload_dir, 'uploads.json')
            uploads = []
            
            if os.path.exists(uploads_json):
                try:
                    with open(uploads_json, 'r', encoding='utf-8') as f:
                        uploads = json.load(f)
                except Exception as e:
                    logger.error(f"Failed to load uploads.json: {str(e)}")
            
            uploads.append(upload_record)
            
            with open(uploads_json, 'w', encoding='utf-8') as f:
                json.dump(uploads, f, ensure_ascii=False, indent=2)
            
            logger.info(f"File uploaded: {filename} to {upload_dir}")
            
            return jsonify({
                'status': 'success',
                'message': f'ファイル "{filename}" をアップロードしました',
                'file': upload_record
            })
            
        except Exception as e:
            logger.exception(f"Error uploading file: {str(e)}")
            return jsonify({
                'error': f"ファイルのアップロード中にエラーが発生しました: {str(e)}"
            }), 500


    @app.route('/api/uploads', methods=['GET'])
    def get_uploads():
        """
        アップロードされたファイルの一覧を取得するエンドポイント
        """
        try:
            # プロファイルが指定されている場合はプロファイル専用のアップロードディレクトリを使用
            profile_id = request.args.get('profile_id', ACTIVE_PROFILE)
            
            if profile_id:
                upload_dir = os.path.join(PROFILES_DIR, profile_id, 'uploads')
            else:
                upload_dir = UPLOAD_FOLDER
            
            # アップロードディレクトリが存在しない場合
            if not os.path.exists(upload_dir):
                return jsonify({
                    'uploads': [],
                    'count': 0,
                    'upload_dir': upload_dir
                })
            
            # アップロード記録がある場合は読み込む
            uploads_json = os.path.join(upload_dir, 'uploads.json')
            uploads = []
            
            if os.path.exists(uploads_json):
                try:
                    with open(uploads_json, 'r', encoding='utf-8') as f:
                        uploads = json.load(f)
                except Exception as e:
                    logger.error(f"Failed to load uploads.json: {str(e)}")
            
            # ファイルの存在確認を行う
            valid_uploads = []
            for upload in uploads:
                file_path = upload.get('path')
                if file_path and os.path.exists(file_path):
                    valid_uploads.append(upload)
            
            return jsonify({
                'uploads': valid_uploads,
                'count': len(valid_uploads),
                'upload_dir': upload_dir
            })
            
        except Exception as e:
            logger.exception(f"Error getting uploads: {str(e)}")
            return jsonify({
                'error': f"アップロード一覧の取得中にエラーが発生しました: {str(e)}"
            }), 500


    @app.route('/api/uploads/<filename>', methods=['GET'])
    def download_file(filename):
        """
        アップロードされたファイルをダウンロードするエンドポイント
        """
        try:
            # プロファイルが指定されている場合はプロファイル専用のアップロードディレクトリを使用
            profile_id = request.args.get('profile_id', ACTIVE_PROFILE)
            
            if profile_id:
                upload_dir = os.path.join(PROFILES_DIR, profile_id, 'uploads')
            else:
                upload_dir = UPLOAD_FOLDER
            
            # ファイルの存在確認
            file_path = os.path.join(upload_dir, filename)
            if not os.path.exists(file_path):
                return jsonify({
                    'error': f'ファイル "{filename}" が見つかりません'
                }), 404
            
            # ファイルをダウンロード
            return send_from_directory(
                upload_dir,
                filename,
                as_attachment=True
            )
            
        except Exception as e:
            logger.exception(f"Error downloading file: {str(e)}")
            return jsonify({
                'error': f"ファイルのダウンロード中にエラーが発生しました: {str(e)}"
            }), 500


    @app.route('/api/uploads/<filename>', methods=['DELETE'])
    def delete_file(filename):
        """
        アップロードされたファイルを削除するエンドポイント
        """
        try:
            # プロファイルが指定されている場合はプロファイル専用のアップロードディレクトリを使用
            profile_id = request.args.get('profile_id', ACTIVE_PROFILE)
            
            if profile_id:
                upload_dir = os.path.join(PROFILES_DIR, profile_id, 'uploads')
            else:
                upload_dir = UPLOAD_FOLDER
            
            # ファイルの存在確認
            file_path = os.path.join(upload_dir, filename)
            if not os.path.exists(file_path):
                return jsonify({
                    'error': f'ファイル "{filename}" が見つかりません'
                }), 404
            
            # ファイルを削除
            os.remove(file_path)
            
            # アップロード記録から削除
            uploads_json = os.path.join(upload_dir, 'uploads.json')
            if os.path.exists(uploads_json):
                try:
                    with open(uploads_json, 'r', encoding='utf-8') as f:
                        uploads = json.load(f)
                    
                    # 対象ファイルを除外
                    uploads = [u for u in uploads if u.get('filename') != filename]
                    
                    with open(uploads_json, 'w', encoding='utf-8') as f:
                        json.dump(uploads, f, ensure_ascii=False, indent=2)
                except Exception as e:
                    logger.error(f"Failed to update uploads.json: {str(e)}")
            
            logger.info(f"File deleted: {filename} from {upload_dir}")
            
            return jsonify({
                'status': 'success',
                'message': f'ファイル "{filename}" を削除しました'
            })
            
        except Exception as e:
            logger.exception(f"Error deleting file: {str(e)}")
            return jsonify({
                'error': f"ファイルの削除中にエラーが発生しました: {str(e)}"
            }), 500


    @app.route('/api/upload/import', methods=['POST'])
    def import_data():
        """
        アップロードされたファイルからデータをインポートするエンドポイント
        """
        try:
            if not ACTIVE_PROFILE:
                return jsonify({
                    'error': 'アクティブなプロファイルが選択されていません'
                }), 400
            
            data = request.json
            file_path = data.get('file_path')
            import_type = data.get('type', 'memory')
            
            if not file_path:
                return jsonify({
                    'error': 'ファイルパスが指定されていません'
                }), 400
            
            # ファイルの存在確認
            if not os.path.exists(file_path):
                return jsonify({
                    'error': f'ファイル "{file_path}" が見つかりません'
                }), 404
            
            # ファイルの種類ごとの処理
            file_ext = os.path.splitext(file_path)[1].lower()
            
            if import_type == 'memory':
                # メモリにインポート
                memory_dir = os.path.join(PROFILES_DIR, ACTIVE_PROFILE, 'memory')
                if not os.path.exists(memory_dir):
                    os.makedirs(memory_dir, exist_ok=True)
                
                # テキストファイルの場合
                if file_ext in ['.txt', '.md']:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # メモリファイルの読み込み
                    memories = []
                    memory_file = os.path.join(memory_dir, 'memories.json')
                    
                    if os.path.exists(memory_file):
                        try:
                            with open(memory_file, 'r', encoding='utf-8') as f:
                                memories = json.load(f)
                        except Exception as e:
                            logger.error(f"Failed to load memories file: {str(e)}")
                    
                    # 新しいメモリを作成
                    new_memory = {
                        'id': str(len(memories) + 1),
                        'content': content,
                        'type': 'imported',
                        'tags': ['imported', os.path.basename(file_path)],
                        'created_at': datetime.now().isoformat(),
                        'strength': 1.0
                    }
                    
                    # メモリリストに追加
                    memories.append(new_memory)
                    
                    # メモリを保存
                    with open(memory_file, 'w', encoding='utf-8') as f:
                        json.dump(memories, f, ensure_ascii=False, indent=2)
                    
                    return jsonify({
                        'status': 'success',
                        'message': f'ファイル "{os.path.basename(file_path)}" をメモリにインポートしました',
                        'memory': new_memory
                    })
                
                # JSONファイルの場合
                elif file_ext == '.json':
                    with open(file_path, 'r', encoding='utf-8') as f:
                        imported_data = json.load(f)
                    
                    # メモリファイルの読み込み
                    memories = []
                    memory_file = os.path.join(memory_dir, 'memories.json')
                    
                    if os.path.exists(memory_file):
                        try:
                            with open(memory_file, 'r', encoding='utf-8') as f:
                                memories = json.load(f)
                        except Exception as e:
                            logger.error(f"Failed to load memories file: {str(e)}")
                    
                    # インポートした項目のカウント
                    imported_count = 0
                    
                    # インポートしたデータの処理
                    if isinstance(imported_data, list):
                        # リスト形式の場合はそのまま追加
                        for item in imported_data:
                            if 'content' in item:
                                next_id = len(memories) + 1
                                new_memory = {
                                    'id': str(next_id),
                                    'content': item['content'],
                                    'type': item.get('type', 'imported'),
                                    'tags': item.get('tags', ['imported']),
                                    'created_at': item.get('created_at', datetime.now().isoformat()),
                                    'strength': item.get('strength', 1.0)
                                }
                                memories.append(new_memory)
                                imported_count += 1
                    else:
                        # 単一オブジェクトの場合
                        if 'content' in imported_data:
                            new_memory = {
                                'id': str(len(memories) + 1),
                                'content': imported_data['content'],
                                'type': imported_data.get('type', 'imported'),
                                'tags': imported_data.get('tags', ['imported']),
                                'created_at': imported_data.get('created_at', datetime.now().isoformat()),
                                'strength': imported_data.get('strength', 1.0)
                            }
                            memories.append(new_memory)
                            imported_count = 1
                    
                    # メモリを保存
                    with open(memory_file, 'w', encoding='utf-8') as f:
                        json.dump(memories, f, ensure_ascii=False, indent=2)
                    
                    return jsonify({
                        'status': 'success',
                        'message': f'ファイル "{os.path.basename(file_path)}" をメモリにインポートしました',
                        'count': imported_count
                    })
                
                else:
                    return jsonify({
                        'error': f'サポートされていないファイル形式です: {file_ext}'
                    }), 400
            
            elif import_type == 'config':
                # プロファイル設定にインポート
                config_path = os.path.join(PROFILES_DIR, ACTIVE_PROFILE, 'config.json')
                
                # JSONファイルの場合のみサポート
                if file_ext != '.json':
                    return jsonify({
                        'error': f'設定インポートはJSONファイルのみサポートしています: {file_ext}'
                    }), 400
                
                with open(file_path, 'r', encoding='utf-8') as f:
                    imported_config = json.load(f)
                
                # 既存の設定を読み込む
                if os.path.exists(config_path):
                    with open(config_path, 'r', encoding='utf-8') as f:
                        current_config = json.load(f)
                    
                    # インポートしたデータでマージ
                    current_config.update(imported_config)
                    
                    # 設定を保存
                    with open(config_path, 'w', encoding='utf-8') as f:
                        json.dump(current_config, f, ensure_ascii=False, indent=2)
                else:
                    # 設定ファイルがない場合は新規作成
                    with open(config_path, 'w', encoding='utf-8') as f:
                        json.dump(imported_config, f, ensure_ascii=False, indent=2)
                
                return jsonify({
                    'status': 'success',
                    'message': f'ファイル "{os.path.basename(file_path)}" をプロファイル設定にインポートしました'
                })
            
            else:
                return jsonify({
                    'error': f'サポートされていないインポートタイプです: {import_type}'
                }), 400
            
        except Exception as e:
            logger.exception(f"Error importing data: {str(e)}")
            return jsonify({
                'error': f"データのインポート中にエラーが発生しました: {str(e)}"
            }), 500
