#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Second Me Windows - ワークスペースルート
ファイルとフォルダの操作を提供するエンドポイント
"""

import os
import json
import shutil
from datetime import datetime
from flask import jsonify, request, Flask, send_file
from werkzeug.utils import secure_filename
from config import logger, WORKSPACE_DIR, ACTIVE_PROFILE


def register_routes(app: Flask):
    """ワークスペース関連のルートを登録"""
    
    @app.route('/api/workspace', methods=['GET'])
    def get_workspace():
        """
        現在のワークスペースの情報を取得するエンドポイント
        """
        try:
            if not ACTIVE_PROFILE:
                return jsonify({
                    'error': 'アクティブなプロファイルが選択されていません'
                }), 400
            
            # ワークスペースディレクトリのパス
            workspace_path = os.path.join(WORKSPACE_DIR, ACTIVE_PROFILE)
            
            # ディレクトリが存在しない場合は作成
            if not os.path.exists(workspace_path):
                os.makedirs(workspace_path, exist_ok=True)
            
            # ルートディレクトリの内容を取得
            items = get_directory_contents(workspace_path)
            
            return jsonify({
                'profile': ACTIVE_PROFILE,
                'workspace_path': workspace_path,
                'items': items
            })
            
        except Exception as e:
            logger.exception(f"Error getting workspace: {str(e)}")
            return jsonify({
                'error': f"ワークスペースの取得中にエラーが発生しました: {str(e)}"
            }), 500


    @app.route('/api/workspace/browse', methods=['GET'])
    def browse_workspace():
        """
        ワークスペース内の特定ディレクトリの内容を取得するエンドポイント
        """
        try:
            if not ACTIVE_PROFILE:
                return jsonify({
                    'error': 'アクティブなプロファイルが選択されていません'
                }), 400
            
            # ベースディレクトリ
            base_path = os.path.join(WORKSPACE_DIR, ACTIVE_PROFILE)
            
            # 相対パスが指定されている場合
            rel_path = request.args.get('path', '')
            
            # 絶対パスの計算（パス走査攻撃を防止）
            target_path = os.path.normpath(os.path.join(base_path, rel_path))
            
            # ベースパスの範囲外を参照していないか確認
            if not target_path.startswith(base_path):
                return jsonify({
                    'error': '無効なパスです。ワークスペース外のディレクトリは参照できません。'
                }), 403
            
            # ディレクトリが存在しない場合
            if not os.path.exists(target_path) or not os.path.isdir(target_path):
                return jsonify({
                    'error': f'ディレクトリ "{rel_path}" が見つかりません'
                }), 404
            
            # ディレクトリの内容を取得
            items = get_directory_contents(target_path)
            
            # 親ディレクトリの相対パスを計算
            parent_path = os.path.dirname(rel_path) if rel_path else None
            
            return jsonify({
                'path': rel_path,
                'parent_path': parent_path,
                'items': items
            })
            
        except Exception as e:
            logger.exception(f"Error browsing workspace: {str(e)}")
            return jsonify({
                'error': f"ワークスペース内のディレクトリ閲覧中にエラーが発生しました: {str(e)}"
            }), 500


    @app.route('/api/workspace/mkdir', methods=['POST'])
    def create_directory():
        """
        ワークスペース内に新しいディレクトリを作成するエンドポイント
        """
        try:
            if not ACTIVE_PROFILE:
                return jsonify({
                    'error': 'アクティブなプロファイルが選択されていません'
                }), 400
            
            data = request.json
            parent_path = data.get('parent_path', '')
            dir_name = data.get('name', '')
            
            if not dir_name:
                return jsonify({
                    'error': 'ディレクトリ名が指定されていません'
                }), 400
            
            # 安全なディレクトリ名に変換
            safe_dir_name = secure_filename(dir_name)
            
            # ベースディレクトリ
            base_path = os.path.join(WORKSPACE_DIR, ACTIVE_PROFILE)
            
            # 新しいディレクトリのパス
            new_dir_path = os.path.normpath(os.path.join(base_path, parent_path, safe_dir_name))
            
            # ベースパスの範囲外を参照していないか確認
            if not new_dir_path.startswith(base_path):
                return jsonify({
                    'error': '無効なパスです。ワークスペース外にディレクトリを作成できません。'
                }), 403
            
            # ディレクトリが既に存在する場合
            if os.path.exists(new_dir_path):
                return jsonify({
                    'error': f'ディレクトリ "{safe_dir_name}" は既に存在します'
                }), 409
            
            # ディレクトリを作成
            os.makedirs(new_dir_path, exist_ok=True)
            
            # 相対パスを計算
            rel_path = os.path.join(parent_path, safe_dir_name) if parent_path else safe_dir_name
            
            return jsonify({
                'status': 'success',
                'message': f'ディレクトリ "{safe_dir_name}" を作成しました',
                'path': rel_path
            })
            
        except Exception as e:
            logger.exception(f"Error creating directory: {str(e)}")
            return jsonify({
                'error': f"ディレクトリの作成中にエラーが発生しました: {str(e)}"
            }), 500


    @app.route('/api/workspace/upload', methods=['POST'])
    def upload_to_workspace():
        """
        ワークスペース内にファイルをアップロードするエンドポイント
        """
        try:
            if not ACTIVE_PROFILE:
                return jsonify({
                    'error': 'アクティブなプロファイルが選択されていません'
                }), 400
            
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
            
            # 保存先のディレクトリパス
            parent_path = request.form.get('path', '')
            
            # ベースディレクトリ
            base_path = os.path.join(WORKSPACE_DIR, ACTIVE_PROFILE)
            
            # 保存先のフルパス
            target_dir = os.path.normpath(os.path.join(base_path, parent_path))
            
            # ベースパスの範囲外を参照していないか確認
            if not target_dir.startswith(base_path):
                return jsonify({
                    'error': '無効なパスです。ワークスペース外にファイルをアップロードできません。'
                }), 403
            
            # ディレクトリが存在しない場合は作成
            if not os.path.exists(target_dir):
                os.makedirs(target_dir, exist_ok=True)
            
            # ファイル名を安全にして保存
            filename = secure_filename(file.filename)
            file_path = os.path.join(target_dir, filename)
            
            # ファイルを保存
            file.save(file_path)
            
            # 相対パスの計算
            rel_file_path = os.path.join(parent_path, filename) if parent_path else filename
            
            logger.info(f"File uploaded to workspace: {filename} to {target_dir}")
            
            return jsonify({
                'status': 'success',
                'message': f'ファイル "{filename}" をアップロードしました',
                'path': rel_file_path,
                'size': os.path.getsize(file_path),
                'type': 'file'
            })
            
        except Exception as e:
            logger.exception(f"Error uploading to workspace: {str(e)}")
            return jsonify({
                'error': f"ワークスペースへのアップロード中にエラーが発生しました: {str(e)}"
            }), 500


    @app.route('/api/workspace/download', methods=['GET'])
    def download_from_workspace():
        """
        ワークスペース内のファイルをダウンロードするエンドポイント
        """
        try:
            if not ACTIVE_PROFILE:
                return jsonify({
                    'error': 'アクティブなプロファイルが選択されていません'
                }), 400
            
            # ファイルの相対パス
            file_path = request.args.get('path', '')
            
            if not file_path:
                return jsonify({
                    'error': 'ファイルパスが指定されていません'
                }), 400
            
            # ベースディレクトリ
            base_path = os.path.join(WORKSPACE_DIR, ACTIVE_PROFILE)
            
            # ファイルの絶対パス
            full_path = os.path.normpath(os.path.join(base_path, file_path))
            
            # ベースパスの範囲外を参照していないか確認
            if not full_path.startswith(base_path):
                return jsonify({
                    'error': '無効なパスです。ワークスペース外のファイルはダウンロードできません。'
                }), 403
            
            # ファイルが存在しない場合
            if not os.path.exists(full_path) or not os.path.isfile(full_path):
                return jsonify({
                    'error': f'ファイル "{file_path}" が見つかりません'
                }), 404
            
            # ファイルをダウンロード
            return send_file(
                full_path,
                as_attachment=True,
                download_name=os.path.basename(full_path)
            )
            
        except Exception as e:
            logger.exception(f"Error downloading from workspace: {str(e)}")
            return jsonify({
                'error': f"ワークスペースからのダウンロード中にエラーが発生しました: {str(e)}"
            }), 500


    @app.route('/api/workspace/delete', methods=['POST'])
    def delete_workspace_item():
        """
        ワークスペース内のファイルまたはディレクトリを削除するエンドポイント
        """
        try:
            if not ACTIVE_PROFILE:
                return jsonify({
                    'error': 'アクティブなプロファイルが選択されていません'
                }), 400
            
            data = request.json
            item_path = data.get('path', '')
            item_type = data.get('type', '')  # 'file' または 'directory'
            
            if not item_path:
                return jsonify({
                    'error': 'パスが指定されていません'
                }), 400
            
            if not item_type or item_type not in ['file', 'directory']:
                return jsonify({
                    'error': '無効なアイテムタイプです。"file" または "directory" を指定してください。'
                }), 400
            
            # ベースディレクトリ
            base_path = os.path.join(WORKSPACE_DIR, ACTIVE_PROFILE)
            
            # アイテムの絶対パス
            full_path = os.path.normpath(os.path.join(base_path, item_path))
            
            # ベースパスの範囲外を参照していないか確認
            if not full_path.startswith(base_path):
                return jsonify({
                    'error': '無効なパスです。ワークスペース外のアイテムは削除できません。'
                }), 403
            
            # アイテムが存在しない場合
            if not os.path.exists(full_path):
                return jsonify({
                    'error': f'アイテム "{item_path}" が見つかりません'
                }), 404
            
            # アイテムタイプの確認
            is_file = os.path.isfile(full_path)
            is_dir = os.path.isdir(full_path)
            
            if (item_type == 'file' and not is_file) or (item_type == 'directory' and not is_dir):
                return jsonify({
                    'error': f'指定されたアイテム "{item_path}" はタイプ {item_type} ではありません'
                }), 400
            
            # 削除処理
            if item_type == 'file':
                os.remove(full_path)
                logger.info(f"File deleted from workspace: {full_path}")
            else:
                shutil.rmtree(full_path)
                logger.info(f"Directory deleted from workspace: {full_path}")
            
            return jsonify({
                'status': 'success',
                'message': f'{item_type} "{item_path}" を削除しました'
            })
            
        except Exception as e:
            logger.exception(f"Error deleting workspace item: {str(e)}")
            return jsonify({
                'error': f"ワークスペースアイテムの削除中にエラーが発生しました: {str(e)}"
            }), 500


    @app.route('/api/workspace/rename', methods=['POST'])
    def rename_workspace_item():
        """
        ワークスペース内のファイルまたはディレクトリの名前を変更するエンドポイント
        """
        try:
            if not ACTIVE_PROFILE:
                return jsonify({
                    'error': 'アクティブなプロファイルが選択されていません'
                }), 400
            
            data = request.json
            old_path = data.get('old_path', '')
            new_name = data.get('new_name', '')
            
            if not old_path:
                return jsonify({
                    'error': '元のパスが指定されていません'
                }), 400
            
            if not new_name:
                return jsonify({
                    'error': '新しい名前が指定されていません'
                }), 400
            
            # 安全なファイル名に変換
            safe_new_name = secure_filename(new_name)
            
            # ベースディレクトリ
            base_path = os.path.join(WORKSPACE_DIR, ACTIVE_PROFILE)
            
            # 元のアイテムのフルパス
            old_full_path = os.path.normpath(os.path.join(base_path, old_path))
            
            # ベースパスの範囲外を参照していないか確認
            if not old_full_path.startswith(base_path):
                return jsonify({
                    'error': '無効なパスです。ワークスペース外のアイテムは変更できません。'
                }), 403
            
            # 元のアイテムが存在しない場合
            if not os.path.exists(old_full_path):
                return jsonify({
                    'error': f'アイテム "{old_path}" が見つかりません'
                }), 404
            
            # 親ディレクトリと新しいパスを計算
            parent_dir = os.path.dirname(old_full_path)
            new_full_path = os.path.join(parent_dir, safe_new_name)
            
            # 新しい名前のアイテムが既に存在する場合
            if os.path.exists(new_full_path):
                return jsonify({
                    'error': f'アイテム "{safe_new_name}" は既に存在します'
                }), 409
            
            # 名前を変更
            os.rename(old_full_path, new_full_path)
            
            # 新しい相対パスを計算
            parent_rel_path = os.path.dirname(old_path)
            new_rel_path = os.path.join(parent_rel_path, safe_new_name) if parent_rel_path else safe_new_name
            
            logger.info(f"Workspace item renamed: {old_full_path} -> {new_full_path}")
            
            return jsonify({
                'status': 'success',
                'message': f'アイテム "{old_path}" の名前を "{safe_new_name}" に変更しました',
                'new_path': new_rel_path
            })
            
        except Exception as e:
            logger.exception(f"Error renaming workspace item: {str(e)}")
            return jsonify({
                'error': f"ワークスペースアイテムの名前変更中にエラーが発生しました: {str(e)}"
            }), 500


    @app.route('/api/workspace/read', methods=['GET'])
    def read_workspace_file():
        """
        ワークスペース内のファイルの内容を読み取るエンドポイント
        """
        try:
            if not ACTIVE_PROFILE:
                return jsonify({
                    'error': 'アクティブなプロファイルが選択されていません'
                }), 400
            
            # ファイルの相対パス
            file_path = request.args.get('path', '')
            
            if not file_path:
                return jsonify({
                    'error': 'ファイルパスが指定されていません'
                }), 400
            
            # ベースディレクトリ
            base_path = os.path.join(WORKSPACE_DIR, ACTIVE_PROFILE)
            
            # ファイルの絶対パス
            full_path = os.path.normpath(os.path.join(base_path, file_path))
            
            # ベースパスの範囲外を参照していないか確認
            if not full_path.startswith(base_path):
                return jsonify({
                    'error': '無効なパスです。ワークスペース外のファイルは読み取れません。'
                }), 403
            
            # ファイルが存在しない場合
            if not os.path.exists(full_path) or not os.path.isfile(full_path):
                return jsonify({
                    'error': f'ファイル "{file_path}" が見つかりません'
                }), 404
            
            # ファイル情報を取得
            file_stats = os.stat(full_path)
            file_size = file_stats.st_size
            file_modified = datetime.fromtimestamp(file_stats.st_mtime).isoformat()
            
            # ファイルの種類に基づいて読み取り方法を決定
            file_ext = os.path.splitext(full_path)[1].lower()
            
            # テキストファイルの場合
            if file_ext in ['.txt', '.md', '.py', '.js', '.html', '.css', '.json', '.csv', '.ts']:
                try:
                    with open(full_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    return jsonify({
                        'path': file_path,
                        'name': os.path.basename(file_path),
                        'content': content,
                        'size': file_size,
                        'modified': file_modified,
                        'type': 'text'
                    })
                except UnicodeDecodeError:
                    # UTF-8でデコードできない場合はバイナリファイルとして扱う
                    return jsonify({
                        'path': file_path,
                        'name': os.path.basename(file_path),
                        'content': None,
                        'size': file_size,
                        'modified': file_modified,
                        'type': 'binary',
                        'message': 'バイナリファイルの内容は表示できません'
                    })
            
            # バイナリファイルの場合
            else:
                return jsonify({
                    'path': file_path,
                    'name': os.path.basename(file_path),
                    'content': None,
                    'size': file_size,
                    'modified': file_modified,
                    'type': 'binary',
                    'message': 'バイナリファイルの内容は表示できません'
                })
            
        except Exception as e:
            logger.exception(f"Error reading workspace file: {str(e)}")
            return jsonify({
                'error': f"ワークスペースファイルの読み取り中にエラーが発生しました: {str(e)}"
            }), 500


    @app.route('/api/workspace/write', methods=['POST'])
    def write_workspace_file():
        """
        ワークスペース内のファイルに内容を書き込むエンドポイント
        """
        try:
            if not ACTIVE_PROFILE:
                return jsonify({
                    'error': 'アクティブなプロファイルが選択されていません'
                }), 400
            
            data = request.json
            file_path = data.get('path', '')
            content = data.get('content', '')
            
            if not file_path:
                return jsonify({
                    'error': 'ファイルパスが指定されていません'
                }), 400
            
            # ベースディレクトリ
            base_path = os.path.join(WORKSPACE_DIR, ACTIVE_PROFILE)
            
            # ファイルの絶対パス
            full_path = os.path.normpath(os.path.join(base_path, file_path))
            
            # ベースパスの範囲外を参照していないか確認
            if not full_path.startswith(base_path):
                return jsonify({
                    'error': '無効なパスです。ワークスペース外のファイルは書き込めません。'
                }), 403
            
            # 親ディレクトリが存在しない場合は作成
            parent_dir = os.path.dirname(full_path)
            if not os.path.exists(parent_dir):
                os.makedirs(parent_dir, exist_ok=True)
            
            # ファイルに書き込み
            with open(full_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            logger.info(f"Workspace file written: {full_path}")
            
            return jsonify({
                'status': 'success',
                'message': f'ファイル "{file_path}" に内容を書き込みました',
                'path': file_path,
                'size': os.path.getsize(full_path)
            })
            
        except Exception as e:
            logger.exception(f"Error writing workspace file: {str(e)}")
            return jsonify({
                'error': f"ワークスペースファイルの書き込み中にエラーが発生しました: {str(e)}"
            }), 500


# ヘルパー関数: ディレクトリの内容を取得
def get_directory_contents(dir_path):
    """指定されたディレクトリの内容を取得"""
    items = []
    
    for item in os.listdir(dir_path):
        item_path = os.path.join(dir_path, item)
        is_dir = os.path.isdir(item_path)
        
        # ファイル情報の取得
        stats = os.stat(item_path)
        size = stats.st_size if not is_dir else 0
        modified = datetime.fromtimestamp(stats.st_mtime).isoformat()
        
        items.append({
            'name': item,
            'type': 'directory' if is_dir else 'file',
            'size': size,
            'modified': modified,
            'extension': os.path.splitext(item)[1].lower()[1:] if not is_dir else None
        })
    
    # 並び替え: ディレクトリ → ファイル、各グループ内ではアルファベット順
    items.sort(key=lambda x: (0 if x['type'] == 'directory' else 1, x['name'].lower()))
    
    return items
