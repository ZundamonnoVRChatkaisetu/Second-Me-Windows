#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Second Me Windows - メモリルート
AIの記憶を管理するためのエンドポイント
"""

import os
import json
from datetime import datetime
from flask import jsonify, request, Flask
from config import logger, PROFILES_DIR, ACTIVE_PROFILE


def register_routes(app: Flask):
    """メモリ関連のルートを登録"""
    
    @app.route('/api/memory', methods=['GET'])
    def get_memories():
        """
        現在のプロファイルのメモリを取得するエンドポイント
        """
        try:
            if not ACTIVE_PROFILE:
                return jsonify({
                    'error': 'アクティブなプロファイルが選択されていません'
                }), 400
            
            # メモリディレクトリのパス
            memory_dir = os.path.join(PROFILES_DIR, ACTIVE_PROFILE, 'memory')
            
            # ディレクトリが存在しない場合は作成
            if not os.path.exists(memory_dir):
                os.makedirs(memory_dir, exist_ok=True)
            
            # メモリファイルの読み込み
            memories = []
            memory_file = os.path.join(memory_dir, 'memories.json')
            
            if os.path.exists(memory_file):
                try:
                    with open(memory_file, 'r', encoding='utf-8') as f:
                        memories = json.load(f)
                except Exception as e:
                    logger.error(f"Failed to load memories file: {str(e)}")
            
            return jsonify({
                'memories': memories,
                'count': len(memories)
            })
            
        except Exception as e:
            logger.exception(f"Error getting memories: {str(e)}")
            return jsonify({
                'error': f"メモリの取得中にエラーが発生しました: {str(e)}"
            }), 500


    @app.route('/api/memory/create', methods=['POST'])
    def create_memory():
        """
        新しいメモリを作成するエンドポイント
        """
        try:
            if not ACTIVE_PROFILE:
                return jsonify({
                    'error': 'アクティブなプロファイルが選択されていません'
                }), 400
            
            data = request.json
            memory_content = data.get('content')
            memory_type = data.get('type', 'general')
            memory_tags = data.get('tags', [])
            
            if not memory_content:
                return jsonify({
                    'error': 'メモリの内容が指定されていません'
                }), 400
            
            # メモリディレクトリのパス
            memory_dir = os.path.join(PROFILES_DIR, ACTIVE_PROFILE, 'memory')
            
            # ディレクトリが存在しない場合は作成
            if not os.path.exists(memory_dir):
                os.makedirs(memory_dir, exist_ok=True)
            
            # 既存のメモリを読み込む
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
                'content': memory_content,
                'type': memory_type,
                'tags': memory_tags,
                'created_at': datetime.now().isoformat(),
                'strength': 1.0  # 新しいメモリの初期強度
            }
            
            # メモリリストに追加
            memories.append(new_memory)
            
            # メモリを保存
            with open(memory_file, 'w', encoding='utf-8') as f:
                json.dump(memories, f, ensure_ascii=False, indent=2)
            
            return jsonify({
                'status': 'success',
                'message': 'メモリを作成しました',
                'memory': new_memory
            })
            
        except Exception as e:
            logger.exception(f"Error creating memory: {str(e)}")
            return jsonify({
                'error': f"メモリの作成中にエラーが発生しました: {str(e)}"
            }), 500


    @app.route('/api/memory/<memory_id>', methods=['GET'])
    def get_memory(memory_id):
        """
        特定のメモリを取得するエンドポイント
        """
        try:
            if not ACTIVE_PROFILE:
                return jsonify({
                    'error': 'アクティブなプロファイルが選択されていません'
                }), 400
            
            # メモリファイルのパス
            memory_file = os.path.join(PROFILES_DIR, ACTIVE_PROFILE, 'memory', 'memories.json')
            
            if not os.path.exists(memory_file):
                return jsonify({
                    'error': 'メモリファイルが見つかりません'
                }), 404
            
            # メモリを読み込む
            with open(memory_file, 'r', encoding='utf-8') as f:
                memories = json.load(f)
            
            # 指定されたIDのメモリを検索
            memory = next((m for m in memories if m['id'] == memory_id), None)
            
            if not memory:
                return jsonify({
                    'error': f'メモリID {memory_id} が見つかりません'
                }), 404
            
            return jsonify(memory)
            
        except Exception as e:
            logger.exception(f"Error getting memory: {str(e)}")
            return jsonify({
                'error': f"メモリの取得中にエラーが発生しました: {str(e)}"
            }), 500


    @app.route('/api/memory/<memory_id>', methods=['PUT'])
    def update_memory(memory_id):
        """
        メモリを更新するエンドポイント
        """
        try:
            if not ACTIVE_PROFILE:
                return jsonify({
                    'error': 'アクティブなプロファイルが選択されていません'
                }), 400
            
            # メモリファイルのパス
            memory_file = os.path.join(PROFILES_DIR, ACTIVE_PROFILE, 'memory', 'memories.json')
            
            if not os.path.exists(memory_file):
                return jsonify({
                    'error': 'メモリファイルが見つかりません'
                }), 404
            
            # メモリを読み込む
            with open(memory_file, 'r', encoding='utf-8') as f:
                memories = json.load(f)
            
            # 指定されたIDのメモリのインデックスを検索
            memory_index = next((i for i, m in enumerate(memories) if m['id'] == memory_id), None)
            
            if memory_index is None:
                return jsonify({
                    'error': f'メモリID {memory_id} が見つかりません'
                }), 404
            
            # 更新データを取得
            data = request.json
            
            # メモリを更新
            if 'content' in data:
                memories[memory_index]['content'] = data['content']
            if 'type' in data:
                memories[memory_index]['type'] = data['type']
            if 'tags' in data:
                memories[memory_index]['tags'] = data['tags']
            if 'strength' in data:
                memories[memory_index]['strength'] = data['strength']
            
            # 更新日時を記録
            memories[memory_index]['updated_at'] = datetime.now().isoformat()
            
            # 更新したメモリを保存
            with open(memory_file, 'w', encoding='utf-8') as f:
                json.dump(memories, f, ensure_ascii=False, indent=2)
            
            return jsonify({
                'status': 'success',
                'message': f'メモリID {memory_id} を更新しました',
                'memory': memories[memory_index]
            })
            
        except Exception as e:
            logger.exception(f"Error updating memory: {str(e)}")
            return jsonify({
                'error': f"メモリの更新中にエラーが発生しました: {str(e)}"
            }), 500


    @app.route('/api/memory/<memory_id>', methods=['DELETE'])
    def delete_memory(memory_id):
        """
        メモリを削除するエンドポイント
        """
        try:
            if not ACTIVE_PROFILE:
                return jsonify({
                    'error': 'アクティブなプロファイルが選択されていません'
                }), 400
            
            # メモリファイルのパス
            memory_file = os.path.join(PROFILES_DIR, ACTIVE_PROFILE, 'memory', 'memories.json')
            
            if not os.path.exists(memory_file):
                return jsonify({
                    'error': 'メモリファイルが見つかりません'
                }), 404
            
            # メモリを読み込む
            with open(memory_file, 'r', encoding='utf-8') as f:
                memories = json.load(f)
            
            # 指定されたIDのメモリを削除
            updated_memories = [m for m in memories if m['id'] != memory_id]
            
            if len(updated_memories) == len(memories):
                return jsonify({
                    'error': f'メモリID {memory_id} が見つかりません'
                }), 404
            
            # 更新したメモリリストを保存
            with open(memory_file, 'w', encoding='utf-8') as f:
                json.dump(updated_memories, f, ensure_ascii=False, indent=2)
            
            return jsonify({
                'status': 'success',
                'message': f'メモリID {memory_id} を削除しました'
            })
            
        except Exception as e:
            logger.exception(f"Error deleting memory: {str(e)}")
            return jsonify({
                'error': f"メモリの削除中にエラーが発生しました: {str(e)}"
            }), 500


    @app.route('/api/memory/search', methods=['POST'])
    def search_memories():
        """
        メモリを検索するエンドポイント
        """
        try:
            if not ACTIVE_PROFILE:
                return jsonify({
                    'error': 'アクティブなプロファイルが選択されていません'
                }), 400
            
            data = request.json
            query = data.get('query', '').lower()
            memory_type = data.get('type')
            tags = data.get('tags', [])
            
            # メモリファイルのパス
            memory_file = os.path.join(PROFILES_DIR, ACTIVE_PROFILE, 'memory', 'memories.json')
            
            if not os.path.exists(memory_file):
                return jsonify({
                    'memories': [],
                    'count': 0
                })
            
            # メモリを読み込む
            with open(memory_file, 'r', encoding='utf-8') as f:
                memories = json.load(f)
            
            # 検索条件に基づいてフィルタリング
            results = []
            for memory in memories:
                # クエリでフィルタリング
                content_match = query in memory['content'].lower() if query else True
                
                # タイプでフィルタリング
                type_match = memory['type'] == memory_type if memory_type else True
                
                # タグでフィルタリング
                tag_match = all(tag in memory['tags'] for tag in tags) if tags else True
                
                if content_match and type_match and tag_match:
                    results.append(memory)
            
            return jsonify({
                'memories': results,
                'count': len(results)
            })
            
        except Exception as e:
            logger.exception(f"Error searching memories: {str(e)}")
            return jsonify({
                'error': f"メモリの検索中にエラーが発生しました: {str(e)}"
            }), 500
