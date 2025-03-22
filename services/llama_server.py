#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Second Me Windows - llama-serverサービス
llama-serverの起動、停止、通信を管理するモジュール
"""

import os
import time
import subprocess
import requests
from config import (
    logger, IS_WINDOWS, LLAMA_SERVER_PROCESS, LLAMACPP_MAIN,
    SELECTED_MODEL_PATH, LLAMA_SERVER_HOST, LLAMA_SERVER_PORT,
    LLAMA_SERVER_URL, LLAMA_SERVER_HEALTH_URL
)


def start_llama_server():
    """
    llama-server.exeを起動する関数
    """
    global LLAMA_SERVER_PROCESS
    
    # すでに実行中なら何もしない
    if LLAMA_SERVER_PROCESS is not None and LLAMA_SERVER_PROCESS.poll() is None:
        logger.info("llama-server is already running")
        return True
    
    # llama-server.exeが存在するか確認
    if not os.path.exists(LLAMACPP_MAIN):
        logger.error(f"llama-server executable not found at {LLAMACPP_MAIN}")
        return False
    
    # モデルが選択されているか確認
    if not SELECTED_MODEL_PATH or not os.path.exists(SELECTED_MODEL_PATH):
        logger.error("No model selected or model file not found")
        return False
    
    # llama-server.exeの起動コマンド作成
    cmd = [
        LLAMACPP_MAIN,
        '-m', SELECTED_MODEL_PATH,
        '--host', LLAMA_SERVER_HOST,
        '--port', str(LLAMA_SERVER_PORT),
        '--ctx-size', '2048',
        '-ngl', '1'  # GPUレイヤー数
    ]
    
    try:
        logger.info(f"Starting llama-server with command: {' '.join(cmd)}")
        
        # サブプロセスとして実行（非ブロッキング）
        LLAMA_SERVER_PROCESS = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding='utf-8'
        )
        
        # サーバーの起動を待つ（最大30秒）
        for _ in range(30):
            try:
                response = requests.get(LLAMA_SERVER_HEALTH_URL, timeout=1)
                if response.status_code == 200:
                    logger.info("llama-server started successfully")
                    return True
            except:
                time.sleep(1)
        
        # タイムアウト
        logger.error("Timed out waiting for llama-server to start")
        return False
    
    except Exception as e:
        logger.exception(f"Error starting llama-server: {str(e)}")
        return False


def stop_llama_server():
    """
    llama-server.exeを停止する関数
    """
    global LLAMA_SERVER_PROCESS
    
    if LLAMA_SERVER_PROCESS is not None:
        logger.info("Stopping llama-server")
        
        try:
            # WindowsとLinuxで異なる終了方法
            if IS_WINDOWS:
                # Windowsの場合はtaskkillを使用
                subprocess.run(['taskkill', '/F', '/T', '/PID', str(LLAMA_SERVER_PROCESS.pid)])
            else:
                # Linuxの場合はterminate/killを使用
                LLAMA_SERVER_PROCESS.terminate()
                time.sleep(2)
                if LLAMA_SERVER_PROCESS.poll() is None:
                    LLAMA_SERVER_PROCESS.kill()
            
            LLAMA_SERVER_PROCESS = None
            logger.info("llama-server stopped")
            return True
        
        except Exception as e:
            logger.exception(f"Error stopping llama-server: {str(e)}")
            return False
    
    return True


def check_llama_server():
    """
    llama-serverが実行中かチェックする関数
    """
    try:
        response = requests.get(LLAMA_SERVER_HEALTH_URL, timeout=1)
        return response.status_code == 200
    except:
        return False


def generate_llm_response(prompt, temperature=0.7, max_tokens=1024):
    """
    llama-serverにリクエストを送信してLLMの応答を生成する関数
    """
    # llama-serverが実行中か確認
    if not check_llama_server():
        # 実行していなければ起動
        if not start_llama_server():
            return None, "llama-serverの起動に失敗しました"
    
    try:
        # リクエストデータ
        payload = {
            "prompt": prompt,
            "temperature": temperature,
            "n_predict": max_tokens,
            "stop": ["</s>", "[/INST]"],  # 停止トークン
            "stream": False,  # ストリーミングなし
            "repeat_penalty": 1.1,
            "top_p": 0.9
        }
        
        # APIリクエスト送信
        logger.info(f"Sending request to llama-server: {prompt[:100]}...")
        response = requests.post(LLAMA_SERVER_URL, json=payload, timeout=30)
        
        # レスポンスチェック
        if response.status_code == 200:
            data = response.json()
            generated_text = data.get('content', '')
            logger.info(f"Received response from llama-server: {generated_text[:100]}...")
            return generated_text, None
        else:
            error_msg = f"llama-server returned error: {response.status_code} - {response.text}"
            logger.error(error_msg)
            return None, error_msg
    
    except Exception as e:
        error_msg = f"Error communicating with llama-server: {str(e)}"
        logger.exception(error_msg)
        return None, error_msg
