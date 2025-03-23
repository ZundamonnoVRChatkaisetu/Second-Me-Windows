#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Second Me Windows - 設定ファイル
グローバル変数と環境設定
"""

import os
import sys
import json
import logging
from datetime import datetime
from dotenv import load_dotenv

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

# サーバー設定
PORT = int(os.getenv('LOCAL_APP_PORT', 8002))

# llama-server設定
LLAMA_SERVER_HOST = os.getenv('LLAMA_SERVER_HOST', '127.0.0.1')
LLAMA_SERVER_PORT = int(os.getenv('LLAMA_SERVER_PORT', 8080))
LLAMA_SERVER_URL = f"http://{LLAMA_SERVER_HOST}:{LLAMA_SERVER_PORT}/completion"
LLAMA_SERVER_HEALTH_URL = f"http://{LLAMA_SERVER_HOST}:{LLAMA_SERVER_PORT}/health"

# パス設定
MODELS_DIR = os.getenv('MODELS_DIR', os.path.join(os.getcwd(), 'models'))
PROFILES_DIR = os.getenv('PROFILES_DIR', os.path.join(os.getcwd(), 'profiles'))
WORKSPACE_DIR = os.getenv('WORKSPACE_DIR', os.path.join(os.getcwd(), 'WorkSpace'))
TRAINING_DIR = os.getenv('TRAINING_DIR', os.path.join(os.getcwd(), 'training'))
UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', os.path.join(os.getcwd(), 'uploads'))

# アクティブプロファイル情報を保存するファイル
ACTIVE_PROFILE_FILE = os.path.join(os.getcwd(), 'active_profile.json')

# 保存されているアクティブプロファイル情報を読み込む
def load_active_profile_info():
    if not os.path.exists(ACTIVE_PROFILE_FILE):
        return None, None
        
    try:
        with open(ACTIVE_PROFILE_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
        profile_id = data.get('active_profile', '')
        model_path = data.get('model_path', '')
        logger.info(f"Loaded active profile from file: {profile_id}")
        return profile_id, model_path
    except Exception as e:
        logger.error(f"Failed to load active profile from file: {str(e)}")
        return None, None

# 保存されたアクティブプロファイル情報があれば読み込む
saved_profile_id, saved_model_path = load_active_profile_info()

# 現在選択されているモデル
SELECTED_MODEL_PATH = os.getenv('SELECTED_MODEL_PATH', saved_model_path if saved_model_path else '')

# 現在のアクティブプロファイル
ACTIVE_PROFILE = os.getenv('ACTIVE_PROFILE', saved_profile_id if saved_profile_id else '')

# 設定情報をログに出力
logger.info(f"Active profile: {ACTIVE_PROFILE}")
logger.info(f"Selected model path: {SELECTED_MODEL_PATH}")

# llama.cppのパス
LLAMACPP_PATH = os.getenv('LLAMACPP_PATH', os.path.join(os.getcwd(), 'llama.cpp', 'build', 'bin', 'Release'))

# Windows環境かどうかを確認
IS_WINDOWS = sys.platform.startswith('win')

# Windows環境では.exe拡張子を追加
# Windows環境ではllama-server.exe, それ以外ではmainを使用
if IS_WINDOWS:
    LLAMACPP_MAIN = os.path.join(LLAMACPP_PATH, 'llama-server.exe')
else:
    LLAMACPP_MAIN = os.path.join(LLAMACPP_PATH, 'main')

# ファイル許可設定
ALLOWED_EXTENSIONS = {'pdf', 'txt', 'doc', 'docx', 'csv', 'json', 'md', 'py', 'js', 'ts', 'html', 'css'}

# llama-server.exeプロセス（グローバル変数）
LLAMA_SERVER_PROCESS = None

# サーバー起動時間
START_TIME = datetime.now()
