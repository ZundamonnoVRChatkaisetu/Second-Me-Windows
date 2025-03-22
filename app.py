#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Second Me Windows バックエンドアプリケーション
基本的なAPIエンドポイントを提供するFlaskアプリケーション
"""

import os
import sys
import json
import logging
import requests
import uuid
import re
import subprocess
import shutil
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
from werkzeug.utils import secure_filename

# 環境変数の読み込み
load_dotenv()

# ロギングの設定
log_level = os.getenv('LOG_LEVEL', 'INFO')
logging.basicConfig(
    level=getattr(logging, log_level),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(os.path.join('logs', 'backend.log'))
    ]
)
logger = logging.getLogger(__name__)

# Flaskアプリケーションの設定
app = Flask(__name__)
CORS(app)  # クロスオリジンリソース共有を有効化

# ポート設定
PORT = int(os.getenv('LOCAL_APP_PORT', 8002))

# モデルのディレクトリパス
MODELS_DIR = os.getenv('MODELS_DIR', os.path.join(os.getcwd(), 'models'))

# プロファイルディレクトリパス
PROFILES_DIR = os.getenv('PROFILES_DIR', os.path.join(os.getcwd(), 'profiles'))

# 現在選択されているモデル
SELECTED_MODEL_PATH = os.getenv('SELECTED_MODEL_PATH', '')

# 現在のアクティブプロファイル
ACTIVE_PROFILE = os.getenv('ACTIVE_PROFILE', '')

# llama.cppのパス
LLAMACPP_PATH = os.getenv('LLAMACPP_PATH', os.path.join(os.getcwd(), 'dependencies', 'llama.cpp'))
LLAMACPP_MAIN = os.path.join(LLAMACPP_PATH, 'main')

# ファイルアップロード設定
UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', os.path.join(os.getcwd(), 'uploads'))
ALLOWED_EXTENSIONS = {'pdf', 'txt', 'doc', 'docx', 'csv', 'json'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB制限

# サーバー起動時間
START_TIME = datetime.now()


@app.route('/health', methods=['GET'])
@app.route('/api/health', methods=['GET'])  # フロントエンドの期待するエンドポイントを追加
def health_check():
    """ヘルスチェックエンドポイント"""
    uptime = (datetime.now() - START_TIME).total_seconds()
    return jsonify({
        'status': 'ok',
        'uptime': uptime,
        'version': '1.0.0-windows'
    })


@app.route('/api/info', methods=['GET'])
def get_info():
    """システム情報エンドポイント"""
    return jsonify({
        'environment': {
            'python_version': sys.version,
            'os': sys.platform,
            'port': PORT,
            'log_level': log_level
        },
        'model': {
            'path': SELECTED_MODEL_PATH,
            'loaded': bool(SELECTED_MODEL_PATH and os.path.exists(SELECTED_MODEL_PATH))
        },
        'profile': {
            'active': ACTIVE_PROFILE,
            'exists': bool(ACTIVE_PROFILE and os.path.exists(os.path.join(PROFILES_DIR, ACTIVE_PROFILE)))
        },
        'system': {
            'start_time': START_TIME.isoformat(),
            'uptime': (datetime.now() - START_TIME).total_seconds()
        }
    })


@app.route('/api/echo', methods=['POST'])
def echo():
    """エコーエンドポイント - 受け取ったデータをそのまま返す"""
    data = request.json
    logger.info(f"Echo request received: {data}")
    return jsonify({
        'received': data,
        'timestamp': datetime.now().isoformat()
    })


@app.route('/api/models', methods=['GET'])
def get_models():
    """
    /modelsディレクトリから利用可能なモデルファイルの一覧を取得
    """
    try:
        # /modelsディレクトリが存在しない場合は作成
        if not os.path.exists(MODELS_DIR):
            os.makedirs(MODELS_DIR)
            return jsonify({'models': []})
        
        # モデルファイル検索パターン
        model_patterns = [
            r'.*\.gguf$',  # llama.cpp モデル（GGUF形式）
            r'.*\.bin$',   # 一般的なバイナリモデル
            r'.*\.pt$',    # PyTorch モデル
            r'.*\.ggml$'   # 旧GGML形式モデル
        ]
        
        models = []
        
        # ディレクトリ内のファイルを検索
        for root, dirs, files in os.walk(MODELS_DIR):
            for file in files:
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, MODELS_DIR)
                
                # ファイルが指定パターンに一致するか確認
                if any(re.match(pattern, file) for pattern in model_patterns):
                    # ファイルサイズをGB単位で計算
                    size_bytes = os.path.getsize(file_path)
                    size_gb = round(size_bytes / (1024 * 1024 * 1024), 2)
                    
                    # モデル情報を追加
                    model_info = {
                        'name': file,
                        'path': file_path,
                        'rel_path': rel_path,
                        'size': size_gb,
                        'size_bytes': size_bytes,
                        'modified_at': datetime.fromtimestamp(os.path.getmtime(file_path)).isoformat()
                    }
                    
                    # 現在選択されているモデルかどうかを追加
                    if SELECTED_MODEL_PATH and os.path.samefile(file_path, SELECTED_MODEL_PATH):
                        model_info['selected'] = True
                    else:
                        model_info['selected'] = False
                    
                    models.append(model_info)
        
        # 修正日時でソート（新しい順）
        models = sorted(models, key=lambda x: x['modified_at'], reverse=True)
        
        return jsonify({'models': models})
    
    except Exception as e:
        logger.exception(f"Error while scanning for models: {str(e)}")
        return jsonify({'error': str(e), 'models': []}), 500


@app.route('/api/models/set', methods=['POST'])
def set_model():
    """モデルを選択するエンドポイント"""
    try:
        data = request.json
        model_path = data.get('model_path')
        
        if not model_path:
            return jsonify({'error': 'Model path is required'}), 400
        
        # モデルが存在するか確認
        if not os.path.exists(model_path):
            return jsonify({'error': f'Model file not found at {model_path}'}), 404
        
        # グローバル変数を更新
        global SELECTED_MODEL_PATH
        SELECTED_MODEL_PATH = model_path
        
        # アクティブなプロファイルがある場合は設定を更新
        if ACTIVE_PROFILE:
            profile_config_path = os.path.join(PROFILES_DIR, ACTIVE_PROFILE, 'config.json')
            if os.path.exists(profile_config_path):
                try:
                    with open(profile_config_path, 'r', encoding='utf-8') as f:
                        config = json.load(f)
                    
                    config['model_path'] = model_path
                    
                    with open(profile_config_path, 'w', encoding='utf-8') as f:
                        json.dump(config, f, ensure_ascii=False, indent=2)
                except Exception as e:
                    logger.error(f"Failed to update profile config: {str(e)}")
        
        logger.info(f"Selected model: {model_path}")
        
        return jsonify({
            'status': 'success',
            'model': {
                'path': model_path,
                'name': os.path.basename(model_path)
            },
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        logger.exception(f"Error while setting model: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/profiles', methods=['GET'])
def get_profiles():
    """
    プロファイル一覧を取得するエンドポイント
    """
    try:
        # プロファイルディレクトリが存在しない場合は作成
        if not os.path.exists(PROFILES_DIR):
            os.makedirs(PROFILES_DIR)
            return jsonify({'profiles': []})
        
        profiles = []
        
        # ディレクトリ内のプロファイルを検索
        for item in os.listdir(PROFILES_DIR):
            profile_dir = os.path.join(PROFILES_DIR, item)
            
            # ディレクトリかつconfig.jsonが存在する場合のみプロファイルとして扱う
            if os.path.isdir(profile_dir) and os.path.exists(os.path.join(profile_dir, 'config.json')):
                try:
                    # 設定ファイルの読み込み
                    with open(os.path.join(profile_dir, 'config.json'), 'r', encoding='utf-8') as f:
                        config = json.load(f)
                    
                    # プロファイル情報を作成
                    profile_info = {
                        'id': item,
                        'name': config.get('name', item),
                        'description': config.get('description', ''),
                        'created_at': config.get('created_at', ''),
                        'updated_at': config.get('updated_at', ''),
                        'model_path': config.get('model_path', ''),
                        'training_count': config.get('training_count', 0),
                        'memories_count': config.get('memories_count', 0),
                        'active': (ACTIVE_PROFILE == item)
                    }
                    
                    profiles.append(profile_info)
                except Exception as e:
                    logger.error(f"Error reading profile {item}: {str(e)}")
        
        # 作成日時でソート（新しい順）
        profiles = sorted(profiles, key=lambda x: x.get('created_at', ''), reverse=True)
        
        return jsonify({'profiles': profiles})
    
    except Exception as e:
        logger.exception(f"Error while scanning for profiles: {str(e)}")
        return jsonify({'error': str(e), 'profiles': []}), 500


@app.route('/api/profiles/create', methods=['POST'])
def create_profile():
    """
    新しいプロファイルを作成するエンドポイント
    """
    try:
        data = request.json
        name = data.get('name', '').strip()
        description = data.get('description', '').strip()
        base_model_path = data.get('model_path', '')
        
        # 名前が必須
        if not name:
            return jsonify({'error': 'Profile name is required'}), 400
        
        # プロファイルIDの生成（名前をベースにしたスラッグ）
        profile_id = re.sub(r'[^a-z0-9_]', '_', name.lower())
        profile_id = f"{profile_id}_{uuid.uuid4().hex[:8]}"  # 一意性を確保するためにUUIDを追加
        
        # プロファイルディレクトリのパス
        profile_dir = os.path.join(PROFILES_DIR, profile_id)
        
        # ディレクトリが既に存在する場合はエラー
        if os.path.exists(profile_dir):
            return jsonify({'error': f'Profile directory already exists: {profile_id}'}), 400
        
        # プロファイルディレクトリ構造を作成
        os.makedirs(profile_dir)
        os.makedirs(os.path.join(profile_dir, 'memories'))
        os.makedirs(os.path.join(profile_dir, 'training_data'))
        
        # 現在の日時
        now = datetime.now().isoformat()
        
        # 設定ファイルの作成
        config = {
            'name': name,
            'description': description,
            'created_at': now,
            'updated_at': now,
            'model_path': base_model_path,
            'training_count': 0,
            'memories_count': 0
        }
        
        with open(os.path.join(profile_dir, 'config.json'), 'w', encoding='utf-8') as f:
            json.dump(config, f, ensure_ascii=False, indent=2)
        
        # 新しいプロファイルをアクティブにする
        global ACTIVE_PROFILE, SELECTED_MODEL_PATH
        ACTIVE_PROFILE = profile_id
        
        # モデルパスが指定されていれば選択する
        if base_model_path and os.path.exists(base_model_path):
            SELECTED_MODEL_PATH = base_model_path
        
        logger.info(f"Created new profile: {profile_id} (name: {name})")
        
        return jsonify({
            'status': 'success',
            'profile': {
                'id': profile_id,
                'name': name,
                'description': description,
                'created_at': now,
                'updated_at': now,
                'model_path': base_model_path,
                'active': True
            }
        })
    
    except Exception as e:
        logger.exception(f"Error while creating profile: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/profiles/activate', methods=['POST'])
def activate_profile():
    """
    プロファイルをアクティブにするエンドポイント
    """
    try:
        data = request.json
        profile_id = data.get('profile_id')
        
        if not profile_id:
            return jsonify({'error': 'Profile ID is required'}), 400
        
        # プロファイルが存在するか確認
        profile_dir = os.path.join(PROFILES_DIR, profile_id)
        config_path = os.path.join(profile_dir, 'config.json')
        
        if not os.path.exists(profile_dir) or not os.path.exists(config_path):
            return jsonify({'error': f'Profile not found: {profile_id}'}), 404
        
        # 設定ファイルの読み込み
        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)
        
        # グローバル変数を更新
        global ACTIVE_PROFILE, SELECTED_MODEL_PATH
        ACTIVE_PROFILE = profile_id
        
        # モデルパスも設定
        model_path = config.get('model_path', '')
        if model_path and os.path.exists(model_path):
            SELECTED_MODEL_PATH = model_path
        
        logger.info(f"Activated profile: {profile_id}")
        
        return jsonify({
            'status': 'success',
            'profile': {
                'id': profile_id,
                'name': config.get('name', profile_id),
                'model_path': SELECTED_MODEL_PATH
            }
        })
    
    except Exception as e:
        logger.exception(f"Error while activating profile: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/profiles/update', methods=['POST'])
def update_profile():
    """
    プロファイル情報を更新するエンドポイント
    """
    try:
        data = request.json
        profile_id = data.get('profile_id')
        
        if not profile_id:
            return jsonify({'error': 'Profile ID is required'}), 400
        
        # プロファイルが存在するか確認
        profile_dir = os.path.join(PROFILES_DIR, profile_id)
        config_path = os.path.join(profile_dir, 'config.json')
        
        if not os.path.exists(profile_dir) or not os.path.exists(config_path):
            return jsonify({'error': f'Profile not found: {profile_id}'}), 404
        
        # 設定ファイルの読み込み
        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)
        
        # 更新可能なフィールド
        update_fields = ['name', 'description', 'model_path']
        updated = False
        
        for field in update_fields:
            if field in data and data[field] is not None:
                config[field] = data[field]
                updated = True
        
        if updated:
            # 更新日時を設定
            config['updated_at'] = datetime.now().isoformat()
            
            # 設定ファイルを保存
            with open(config_path, 'w', encoding='utf-8') as f:
                json.dump(config, f, ensure_ascii=False, indent=2)
            
            # 現在アクティブなプロファイルを更新した場合は、グローバル変数も更新
            if ACTIVE_PROFILE == profile_id and 'model_path' in data:
                global SELECTED_MODEL_PATH
                model_path = data['model_path']
                if model_path and os.path.exists(model_path):
                    SELECTED_MODEL_PATH = model_path
            
            logger.info(f"Updated profile: {profile_id}")
        
        return jsonify({
            'status': 'success',
            'profile': {
                'id': profile_id,
                'name': config.get('name', profile_id),
                'description': config.get('description', ''),
                'model_path': config.get('model_path', ''),
                'updated_at': config.get('updated_at', '')
            }
        })
    
    except Exception as e:
        logger.exception(f"Error while updating profile: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/profiles/delete', methods=['POST'])
def delete_profile():
    """
    プロファイルを削除するエンドポイント
    """
    try:
        data = request.json
        profile_id = data.get('profile_id')
        
        if not profile_id:
            return jsonify({'error': 'Profile ID is required'}), 400
        
        # プロファイルが存在するか確認
        profile_dir = os.path.join(PROFILES_DIR, profile_id)
        
        if not os.path.exists(profile_dir):
            return jsonify({'error': f'Profile not found: {profile_id}'}), 404
        
        # 現在アクティブなプロファイルは削除できない（前もって別のプロファイルをアクティブにする必要がある）
        if ACTIVE_PROFILE == profile_id:
            return jsonify({'error': 'Cannot delete the active profile. Please activate another profile first.'}), 400
        
        # プロファイルディレクトリを削除
        shutil.rmtree(profile_dir)
        
        logger.info(f"Deleted profile: {profile_id}")
        
        return jsonify({
            'status': 'success',
            'message': f'Profile {profile_id} deleted successfully'
        })
    
    except Exception as e:
        logger.exception(f"Error while deleting profile: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/chat', methods=['POST'])
def chat():
    """
    チャットエンドポイント
    llama.cppを使用してローカルモデルで応答を生成
    """
    data = request.json
    message = data.get('message', '')
    logger.info(f"Chat request received with message: {message}")
    
    # モデルが選択されているか確認
    if not SELECTED_MODEL_PATH:
        logger.warning("No model selected, returning error message")
        return jsonify({
            'message': "モデルが選択されていません。設定ページでモデルを選択してください。",
            'timestamp': datetime.now().isoformat()
        })
    
    # モデルファイルが存在するか確認
    if not os.path.exists(SELECTED_MODEL_PATH):
        logger.error(f"Selected model file not found: {SELECTED_MODEL_PATH}")
        return jsonify({
            'message': f"選択されたモデルファイルが見つかりません: {SELECTED_MODEL_PATH}",
            'timestamp': datetime.now().isoformat()
        })
    
    # llamacpp実行可能ファイルが存在するか確認
    if not os.path.exists(LLAMACPP_MAIN):
        logger.error(f"llama.cpp executable not found at {LLAMACPP_MAIN}")
        return jsonify({
            'message': "llama.cpp実行ファイルが見つかりません。セットアップを確認してください。",
            'timestamp': datetime.now().isoformat()
        })
    
    try:
        # 現在のプロファイル名を取得（存在する場合）
        profile_name = ""
        if ACTIVE_PROFILE:
            config_path = os.path.join(PROFILES_DIR, ACTIVE_PROFILE, 'config.json')
            if os.path.exists(config_path):
                with open(config_path, 'r', encoding='utf-8') as f:
                    config = json.load(f)
                    profile_name = config.get('name', ACTIVE_PROFILE)
        
        # llama.cppへのプロンプト作成（プロファイル情報を含める）
        if profile_name:
            system_prompt = f"あなたは{profile_name}です。ユーザーの質問に丁寧に答えてください。"
            prompt = f"<s>[INST] {system_prompt} [/INST]</s>\n\n[INST] {message} [/INST]"
        else:
            prompt = f"<s>[INST] {message} [/INST]</s>"
        
        # llama.cppコマンドの構築
        cmd = [
            LLAMACPP_MAIN,
            '-m', SELECTED_MODEL_PATH,
            '-p', prompt,
            '--ctx-size', '2048',
            '--temp', '0.7',
            '--top-p', '0.9',
            '--seed', '-1',
            '-n', '1024',
            '--repeat-penalty', '1.1',
            '-ngl', '1'  # GPUレイヤー数（GPUを使用する場合）
        ]
        
        logger.info(f"Running command: {' '.join(cmd)}")
        
        # サブプロセスとして実行（タイムアウト60秒）
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding='utf-8'
        )
        
        try:
            stdout, stderr = process.communicate(timeout=60)
        except subprocess.TimeoutExpired:
            process.kill()
            logger.error("llama.cpp process timed out")
            return jsonify({
                'message': "応答生成がタイムアウトしました。再度お試しください。",
                'timestamp': datetime.now().isoformat()
            })
        
        # エラーチェック
        if process.returncode != 0:
            logger.error(f"llama.cpp process failed with code {process.returncode}: {stderr}")
            return jsonify({
                'message': f"モデル実行中にエラーが発生しました: {stderr[:200]}...",
                'timestamp': datetime.now().isoformat()
            })
        
        # 応答の抽出
        assistant_response = ""
        if "[/INST]" in stdout:
            # 最後の[/INST]の後の部分を取得
            assistant_response = stdout.split("[/INST]")[-1].strip()
        else:
            assistant_response = stdout.strip()
        
        # 応答が空の場合
        if not assistant_response:
            logger.warning("Empty response from llama.cpp")
            return jsonify({
                'message': "モデルからの応答が空でした。再度お試しください。",
                'timestamp': datetime.now().isoformat()
            })
        
        # 成功レスポンス
        return jsonify({
            'message': assistant_response,
            'timestamp': datetime.now().isoformat()
        })
    
    except Exception as e:
        logger.exception(f"Error during chat processing: {str(e)}")
        return jsonify({
            'message': f"エラーが発生しました: {str(e)}",
            'timestamp': datetime.now().isoformat()
        })


@app.route('/api/memory', methods=['GET'])
def list_memories():
    """メモリーリストエンドポイント"""
    try:
        # アクティブなプロファイルが必要
        if not ACTIVE_PROFILE:
            return jsonify({'error': 'No active profile selected'}), 400
        
        # プロファイルのメモリーディレクトリ
        memories_dir = os.path.join(PROFILES_DIR, ACTIVE_PROFILE, 'memories')
        
        # ディレクトリが存在しない場合は作成
        if not os.path.exists(memories_dir):
            os.makedirs(memories_dir)
            return jsonify({'memories': []})
        
        memories = []
        
        # メモリーファイル（JSON）を読み込む
        for filename in os.listdir(memories_dir):
            if filename.endswith('.json'):
                try:
                    file_path = os.path.join(memories_dir, filename)
                    with open(file_path, 'r', encoding='utf-8') as f:
                        memory = json.load(f)
                    
                    # メモリーIDとしてファイル名（拡張子なし）を使用
                    memory_id = os.path.splitext(filename)[0]
                    memory['id'] = memory_id
                    
                    memories.append(memory)
                except Exception as e:
                    logger.error(f"Error reading memory file {filename}: {str(e)}")
        
        # 作成日時でソート（新しい順）
        memories = sorted(memories, key=lambda x: x.get('created_at', ''), reverse=True)
        
        return jsonify({'memories': memories})
    
    except Exception as e:
        logger.exception(f"Error listing memories: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/memory', methods=['POST'])
def add_memory():
    """メモリー追加エンドポイント"""
    try:
        # アクティブなプロファイルが必要
        if not ACTIVE_PROFILE:
            return jsonify({'error': 'No active profile selected'}), 400
        
        data = request.json
        content = data.get('content', '').strip()
        
        if not content:
            return jsonify({'error': 'Memory content is required'}), 400
        
        # プロファイルのメモリーディレクトリ
        memories_dir = os.path.join(PROFILES_DIR, ACTIVE_PROFILE, 'memories')
        
        # ディレクトリが存在しない場合は作成
        if not os.path.exists(memories_dir):
            os.makedirs(memories_dir)
        
        # 現在の日時
        now = datetime.now().isoformat()
        
        # 一意のIDを生成
        memory_id = str(uuid.uuid4())
        
        # メモリーを作成
        memory = {
            'content': content,
            'created_at': now,
            'updated_at': now,
            'profile_id': ACTIVE_PROFILE
        }
        
        # JSONファイルとして保存
        with open(os.path.join(memories_dir, f"{memory_id}.json"), 'w', encoding='utf-8') as f:
            json.dump(memory, f, ensure_ascii=False, indent=2)
        
        # プロファイル設定を更新してメモリー数をインクリメント
        config_path = os.path.join(PROFILES_DIR, ACTIVE_PROFILE, 'config.json')
        if os.path.exists(config_path):
            try:
                with open(config_path, 'r', encoding='utf-8') as f:
                    config = json.load(f)
                
                # メモリー数を更新
                config['memories_count'] = config.get('memories_count', 0) + 1
                config['updated_at'] = now
                
                with open(config_path, 'w', encoding='utf-8') as f:
                    json.dump(config, f, ensure_ascii=False, indent=2)
            except Exception as e:
                logger.error(f"Failed to update profile config: {str(e)}")
        
        # 結果を返す
        memory['id'] = memory_id
        return jsonify({'memory': memory, 'status': 'success'})
    
    except Exception as e:
        logger.exception(f"Error adding memory: {str(e)}")
        return jsonify({'error': str(e)}), 500


def allowed_file(filename):
    """
    許可されたファイル拡張子かどうかを確認する
    """
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/api/upload', methods=['POST'])
def upload_file():
    """
    ファイルアップロードエンドポイント
    multipart/form-dataでファイルとカテゴリを受け取る
    """
    logger.info("File upload request received")
    
    # アクティブなプロファイルをチェック
    profile_training_dir = None
    if ACTIVE_PROFILE:
        profile_training_dir = os.path.join(PROFILES_DIR, ACTIVE_PROFILE, 'training_data')
        if not os.path.exists(profile_training_dir):
            os.makedirs(profile_training_dir)
    
    # アップロードフォルダが存在しなければ作成
    if not os.path.exists(app.config['UPLOAD_FOLDER']):
        os.makedirs(app.config['UPLOAD_FOLDER'])
    
    # カテゴリの取得（デフォルトは'general'）
    category = request.form.get('category', 'general')
    category_folder = os.path.join(app.config['UPLOAD_FOLDER'], category)
    
    # カテゴリフォルダが存在しなければ作成
    if not os.path.exists(category_folder):
        os.makedirs(category_folder)
    
    # リクエストにファイルがあるか確認
    if 'file' not in request.files:
        logger.error("No file part in the request")
        return jsonify({
            'error': 'No file part in the request',
            'status': 'error'
        }), 400
    
    file = request.files['file']
    
    # ファイル名が空でないか確認
    if file.filename == '':
        logger.error("No selected file")
        return jsonify({
            'error': 'No selected file',
            'status': 'error'
        }), 400
    
    # ファイルタイプが許可されているか確認
    if file and allowed_file(file.filename):
        # 安全なファイル名に変換
        original_filename = secure_filename(file.filename)
        # ユニークなファイル名を生成（衝突を避けるため）
        unique_id = str(uuid.uuid4())
        filename = f"{unique_id}_{original_filename}"
        
        # ファイルを保存
        file_path = os.path.join(category_folder, filename)
        file.save(file_path)
        
        logger.info(f"File saved successfully: {file_path}")
        
        # アクティブなプロファイルがある場合、トレーニングディレクトリにも保存（トレーニングデータ用）
        if profile_training_dir:
            profile_file_path = os.path.join(profile_training_dir, filename)
            shutil.copy2(file_path, profile_file_path)
            logger.info(f"File also saved to profile training directory: {profile_file_path}")
        
        # 成功レスポンス
        return jsonify({
            'filename': original_filename,
            'path': file_path,
            'category': category,
            'size': os.path.getsize(file_path),
            'uploaded_at': datetime.now().isoformat(),
            'status': 'success'
        })
    else:
        logger.error(f"File type not allowed: {file.filename if file else 'unknown'}")
        return jsonify({
            'error': 'File type not allowed',
            'status': 'error',
            'allowed_types': list(ALLOWED_EXTENSIONS)
        }), 400


@app.route('/api/files', methods=['GET'])
def list_files():
    """
    アップロードされたファイル一覧を取得するエンドポイント
    クエリパラメータでカテゴリを指定できる
    """
    category = request.args.get('category', 'general')
    profile_id = request.args.get('profile_id', ACTIVE_PROFILE)  # アクティブなプロファイルがデフォルト
    
    # プロファイルが指定されている場合はトレーニングデータを取得
    if profile_id:
        training_dir = os.path.join(PROFILES_DIR, profile_id, 'training_data')
        if os.path.exists(training_dir):
            return list_files_from_directory(training_dir)
    
    # 通常のカテゴリフォルダからファイルを取得
    category_folder = os.path.join(app.config['UPLOAD_FOLDER'], category)
    return list_files_from_directory(category_folder)


def list_files_from_directory(directory):
    """指定されたディレクトリからファイル一覧を取得する汎用関数"""
    # ディレクトリが存在しなければ作成
    if not os.path.exists(directory):
        os.makedirs(directory)
        return jsonify({'files': []})
    
    files = []
    for filename in os.listdir(directory):
        file_path = os.path.join(directory, filename)
        if os.path.isfile(file_path):
            # ファイル名から元のファイル名を抽出（UUID_元のファイル名の形式）
            original_filename = '_'.join(filename.split('_')[1:]) if '_' in filename else filename
            files.append({
                'filename': original_filename,
                'path': file_path,
                'size': os.path.getsize(file_path),
                'uploaded_at': datetime.fromtimestamp(os.path.getctime(file_path)).isoformat()
            })
    
    return jsonify({'files': files})


if __name__ == '__main__':
    # ディレクトリ存在確認と作成
    for directory in ['logs', MODELS_DIR, PROFILES_DIR, UPLOAD_FOLDER]:
        if not os.path.exists(directory):
            os.makedirs(directory)
    
    logger.info(f"Starting Second Me backend on port {PORT}")
    logger.info(f"Log level: {log_level}")
    logger.info(f"Models directory: {MODELS_DIR}")
    logger.info(f"Profiles directory: {PROFILES_DIR}")
    
    # llama.cppの実行ファイルの存在確認
    if not os.path.exists(LLAMACPP_MAIN):
        logger.warning(f"llama.cpp executable not found at {LLAMACPP_MAIN}")
    else:
        logger.info(f"llama.cpp executable found at {LLAMACPP_MAIN}")
    
    # モデルディレクトリの検索
    try:
        model_files = [f for f in os.listdir(MODELS_DIR) if f.endswith(('.gguf', '.bin', '.pt', '.ggml'))]
        if model_files:
            logger.info(f"Found {len(model_files)} model files in {MODELS_DIR}")
            
            # 選択されたモデルが設定されていなければ、最初のモデルを選択
            if not SELECTED_MODEL_PATH:
                SELECTED_MODEL_PATH = os.path.join(MODELS_DIR, model_files[0])
                logger.info(f"Auto-selected model: {SELECTED_MODEL_PATH}")
        else:
            logger.warning(f"No model files found in {MODELS_DIR}")
    except Exception as e:
        logger.warning(f"Error scanning models directory: {str(e)}")
    
    # プロファイルディレクトリの検索
    try:
        profiles = []
        if os.path.exists(PROFILES_DIR):
            for item in os.listdir(PROFILES_DIR):
                profile_dir = os.path.join(PROFILES_DIR, item)
                config_path = os.path.join(profile_dir, 'config.json')
                if os.path.isdir(profile_dir) and os.path.exists(config_path):
                    profiles.append(item)
        
        if profiles:
            logger.info(f"Found {len(profiles)} profiles")
            
            # アクティブなプロファイルが設定されていなければ、最初のプロファイルを選択
            if not ACTIVE_PROFILE:
                ACTIVE_PROFILE = profiles[0]
                logger.info(f"Auto-selected profile: {ACTIVE_PROFILE}")
                
                # プロファイルのモデルも選択
                try:
                    with open(os.path.join(PROFILES_DIR, ACTIVE_PROFILE, 'config.json'), 'r', encoding='utf-8') as f:
                        config = json.load(f)
                    model_path = config.get('model_path', '')
                    if model_path and os.path.exists(model_path):
                        SELECTED_MODEL_PATH = model_path
                        logger.info(f"Using profile's model: {SELECTED_MODEL_PATH}")
                except Exception as e:
                    logger.error(f"Failed to load profile config: {str(e)}")
        else:
            logger.info("No profiles found, will create default profile if needed")
    except Exception as e:
        logger.warning(f"Error scanning profiles directory: {str(e)}")
    
    # Flaskアプリケーション起動
    app.run(host='0.0.0.0', port=PORT, debug=False)
