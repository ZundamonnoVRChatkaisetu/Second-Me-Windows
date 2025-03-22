#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Second Me Windows - チャットルート
LLMとのチャットを管理するエンドポイント
"""

from datetime import datetime
from flask import jsonify, request, Flask
from config import logger, PROFILES_DIR, SELECTED_MODEL_PATH, ACTIVE_PROFILE, IS_WINDOWS, LLAMACPP_MAIN
import os
import subprocess
from services.llama_server import generate_llm_response


def register_routes(app: Flask):
    """チャット関連のルートを登録"""
    
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
        
        try:
            # 現在のプロファイル名を取得（存在する場合）
            profile_name = ""
            if ACTIVE_PROFILE:
                config_path = os.path.join(PROFILES_DIR, ACTIVE_PROFILE, 'config.json')
                if os.path.exists(config_path):
                    with open(config_path, 'r', encoding='utf-8') as f:
                        import json
                        config = json.load(f)
                        profile_name = config.get('name', ACTIVE_PROFILE)
            
            # llama.cppへのプロンプト作成（プロファイル情報を含める）
            if profile_name:
                system_prompt = f"あなたは{profile_name}です。ユーザーの質問に丁寧に答えてください。"
                prompt = f"<s>[INST] {system_prompt} [/INST]</s>\n\n[INST] {message} [/INST]"
            else:
                prompt = f"<s>[INST] {message} [/INST]</s>"
            
            # llama-server.exeを使用する場合（Windowsの場合）
            if IS_WINDOWS and LLAMACPP_MAIN.endswith('llama-server.exe'):
                # llama-serverにリクエストを送信して応答を生成
                generated_text, error = generate_llm_response(prompt)
                
                if error:
                    logger.error(f"Error generating response: {error}")
                    return jsonify({
                        'message': f"応答生成中にエラーが発生しました: {error}",
                        'timestamp': datetime.now().isoformat()
                    })
                
                return jsonify({
                    'message': generated_text,
                    'timestamp': datetime.now().isoformat()
                })
            
            # 通常のmain実行ファイルを使用する場合
            else:
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
