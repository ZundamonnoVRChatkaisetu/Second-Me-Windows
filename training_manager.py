#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Second Me Windows トレーニングデータ管理モジュール
トレーニングデータの管理と処理を行うためのコードを提供します
"""

import os
import sys
import json
import logging
import uuid
import time
import threading
import shutil
import re
from datetime import datetime
from werkzeug.utils import secure_filename

# ロギングの設定
logger = logging.getLogger(__name__)

# トレーニング関連のグローバル変数
TRAINING_PROCESSES = {}

def get_current_training_path(profiles_dir, active_profile):
    """現在のプロファイルのトレーニングデータパスを取得"""
    if not active_profile:
        return None
    
    training_path = os.path.join(profiles_dir, active_profile, 'training_data')
    if not os.path.exists(training_path):
        try:
            os.makedirs(training_path)
        except Exception as e:
            logger.error(f"Failed to create training directory: {str(e)}")
            return None
    
    return training_path


def list_training_data(profiles_dir, active_profile, category=None):
    """トレーニングデータ一覧を取得"""
    # プロファイルが必要
    if not active_profile:
        return {"error": "No active profile selected"}, 400
    
    # プロファイルのトレーニングデータディレクトリ
    training_dir = os.path.join(profiles_dir, active_profile, 'training_data')
    
    # ディレクトリが存在しない場合は作成
    if not os.path.exists(training_dir):
        os.makedirs(training_dir)
    
    # ファイル一覧を取得
    files = []
    categories = set()
    
    for root, dirs, filenames in os.walk(training_dir):
        for filename in filenames:
            file_path = os.path.join(root, filename)
            rel_path = os.path.relpath(file_path, training_dir)
            
            # カテゴリ（サブディレクトリ）を取得
            file_category = os.path.dirname(rel_path)
            if not file_category:
                file_category = 'general'  # ルートディレクトリの場合は'general'
            
            categories.add(file_category)
            
            # カテゴリフィルターが指定されている場合は、一致するものだけを返す
            if category and file_category != category:
                continue
            
            # ファイル情報を追加
            file_info = {
                'id': str(uuid.uuid4()),  # 一時的なID
                'name': filename,
                'path': rel_path,
                'category': file_category,
                'size': os.path.getsize(file_path),
                'created_at': datetime.fromtimestamp(os.path.getctime(file_path)).isoformat(),
                'modified_at': datetime.fromtimestamp(os.path.getmtime(file_path)).isoformat()
            }
            
            # ファイルタイプに応じた処理
            if filename.lower().endswith(('.txt', '.csv', '.json', '.md')):
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        # プレビュー（最初の200文字）
                        file_info['preview'] = f.read(200)
                except:
                    file_info['preview'] = "Preview not available"
            else:
                file_info['preview'] = "Binary file"
            
            files.append(file_info)
    
    # ファイルが見つからない場合でも、利用可能なカテゴリは返す
    return {
        'training_data': sorted(files, key=lambda x: x['modified_at'], reverse=True),
        'categories': sorted(list(categories)),
        'total_count': len(files)
    }


def get_training_data(profiles_dir, active_profile, data_id, data_path):
    """特定のトレーニングデータを取得"""
    # プロファイルが必要
    if not active_profile:
        return {"error": "No active profile selected"}, 400
    
    # パス検証
    if not data_path:
        return {"error": "Data path is required"}, 400
    
    # プロファイルのトレーニングデータディレクトリ
    training_dir = os.path.join(profiles_dir, active_profile, 'training_data')
    
    # ディレクトリが存在しない場合はエラー
    if not os.path.exists(training_dir):
        return {"error": "Training data directory not found"}, 404
    
    # 最終的なパス
    full_path = os.path.normpath(os.path.join(training_dir, data_path))
    
    # パスが有効かチェック（トレーニングデータディレクトリ外へのアクセスを防止）
    if not full_path.startswith(training_dir):
        return {"error": "Invalid data path"}, 400
    
    # ファイルが存在するか確認
    if not os.path.exists(full_path) or not os.path.isfile(full_path):
        return {"error": "Training data file not found"}, 404
    
    # ファイルサイズが大きすぎる場合はエラー
    if os.path.getsize(full_path) > 5 * 1024 * 1024:  # 5MB制限
        return {"error": "File is too large to read"}, 400
    
    # カテゴリ（サブディレクトリ）を取得
    rel_path = os.path.relpath(full_path, training_dir)
    file_category = os.path.dirname(rel_path)
    if not file_category:
        file_category = 'general'  # ルートディレクトリの場合は'general'
    
    # ファイル内容を読み込む
    try:
        with open(full_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except UnicodeDecodeError:
        # テキストでない場合はバイナリとして扱う
        return {"error": "File is not a text file"}, 400
    
    # データ情報
    data_info = {
        'id': data_id,
        'name': os.path.basename(full_path),
        'path': data_path,
        'category': file_category,
        'size': os.path.getsize(full_path),
        'created_at': datetime.fromtimestamp(os.path.getctime(full_path)).isoformat(),
        'modified_at': datetime.fromtimestamp(os.path.getmtime(full_path)).isoformat(),
        'content': content
    }
    
    return {'training_data': data_info}


def save_uploaded_files(profiles_dir, active_profile, files, category='general'):
    """アップロードされたトレーニングデータファイルを保存"""
    # プロファイルが必要
    if not active_profile:
        return {"error": "No active profile selected"}, 400
    
    # プロファイルのトレーニングデータディレクトリ
    training_dir = os.path.join(profiles_dir, active_profile, 'training_data')
    
    # ディレクトリが存在しない場合は作成
    if not os.path.exists(training_dir):
        os.makedirs(training_dir)
    
    # カテゴリディレクトリのパス
    category_dir = os.path.join(training_dir, category)
    
    # カテゴリディレクトリが存在しない場合は作成
    if not os.path.exists(category_dir):
        os.makedirs(category_dir)
    
    if not files or files[0].filename == '':
        return {"error": "No selected file"}, 400
    
    uploaded_files = []
    
    for file in files:
        # 安全なファイル名に変換
        original_filename = secure_filename(file.filename)
        
        # ユニークなファイル名を生成（衝突を避けるため）
        unique_id = str(uuid.uuid4())
        filename = f"{unique_id}_{original_filename}"
        
        # ファイルを保存
        file_path = os.path.join(category_dir, filename)
        file.save(file_path)
        
        # アップロードされたファイル情報
        rel_path = os.path.relpath(file_path, training_dir)
        
        uploaded_files.append({
            'id': unique_id,
            'name': original_filename,
            'path': rel_path,
            'category': category,
            'size': os.path.getsize(file_path),
            'created_at': datetime.now().isoformat()
        })
    
    # プロファイル設定を更新（トレーニングデータ数をインクリメント）
    config_path = os.path.join(profiles_dir, active_profile, 'config.json')
    if os.path.exists(config_path):
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                config = json.load(f)
            
            # トレーニングデータ数を更新
            config['training_data_count'] = config.get('training_data_count', 0) + len(uploaded_files)
            config['updated_at'] = datetime.now().isoformat()
            
            with open(config_path, 'w', encoding='utf-8') as f:
                json.dump(config, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.error(f"Failed to update profile config: {str(e)}")
    
    return {
        'status': 'success',
        'message': f'Successfully uploaded {len(uploaded_files)} file(s)',
        'files': uploaded_files
    }


def delete_training_data(profiles_dir, active_profile, data_id, data_path):
    """トレーニングデータを削除"""
    # プロファイルが必要
    if not active_profile:
        return {"error": "No active profile selected"}, 400
    
    # パス検証
    if not data_path:
        return {"error": "Data path is required"}, 400
    
    # プロファイルのトレーニングデータディレクトリ
    training_dir = os.path.join(profiles_dir, active_profile, 'training_data')
    
    # 最終的なパス
    full_path = os.path.normpath(os.path.join(training_dir, data_path))
    
    # パスが有効かチェック（トレーニングデータディレクトリ外へのアクセスを防止）
    if not full_path.startswith(training_dir):
        return {"error": "Invalid data path"}, 400
    
    # ファイルが存在するか確認
    if not os.path.exists(full_path) or not os.path.isfile(full_path):
        return {"error": "Training data file not found"}, 404
    
    # ファイルを削除
    os.remove(full_path)
    
    # プロファイル設定を更新（トレーニングデータ数をデクリメント）
    config_path = os.path.join(profiles_dir, active_profile, 'config.json')
    if os.path.exists(config_path):
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                config = json.load(f)
            
            # トレーニングデータ数を更新（0未満にならないようにする）
            config['training_data_count'] = max(0, config.get('training_data_count', 1) - 1)
            config['updated_at'] = datetime.now().isoformat()
            
            with open(config_path, 'w', encoding='utf-8') as f:
                json.dump(config, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.error(f"Failed to update profile config: {str(e)}")
    
    return {
        'status': 'success',
        'message': f'Training data file {data_path} deleted successfully'
    }


def start_training_process(profiles_dir, active_profile, training_params):
    """トレーニングプロセスを開始"""
    # プロファイルが必要
    if not active_profile:
        return {"error": "No active profile selected"}, 400
    
    # プロファイルのトレーニングデータディレクトリ
    training_dir = os.path.join(profiles_dir, active_profile, 'training_data')
    
    # ディレクトリが存在しない場合はエラー
    if not os.path.exists(training_dir):
        return {"error": "Training data directory not found"}, 404
    
    # トレーニングパラメータを取得
    model_path = training_params.get('model_path', '')
    learning_rate = training_params.get('learning_rate', 0.00001)
    epochs = training_params.get('epochs', 3)
    batch_size = training_params.get('batch_size', 8)
    categories = training_params.get('categories', [])  # 空の場合は全カテゴリ
    auto_switch = training_params.get('auto_switch', True)  # トレーニング後に自動切り替えするかどうか
    
    # モデルが選択されているか確認
    if not model_path:
        return {"error": "No model selected for training"}, 400
    
    # モデルファイルが存在するか確認
    if not os.path.exists(model_path):
        return {"error": f"Model file not found: {model_path}"}, 404
    
    # トレーニングIDを生成
    training_id = str(uuid.uuid4())
    
    # トレーニングログディレクトリ
    log_dir = os.path.join(profiles_dir, active_profile, 'training_logs')
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)
    
    # トレーニングログファイル
    log_file = os.path.join(log_dir, f"training_{training_id}.log")
    
    # トレーニング出力モデルディレクトリ
    output_dir = os.path.join(profiles_dir, active_profile, 'trained_models')
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    # 出力モデルパス
    output_model = os.path.join(output_dir, f"model_{training_id}.gguf")
    
    # 実際のトレーニングを開始する前の情報を返す
    # 注: 実際のトレーニングは別スレッドで実行される
    training_info = {
        'id': training_id,
        'profile_id': active_profile,
        'model_path': model_path,
        'output_model': output_model,
        'parameters': {
            'learning_rate': learning_rate,
            'epochs': epochs,
            'batch_size': batch_size,
            'categories': categories,
            'auto_switch': auto_switch
        },
        'start_time': datetime.now().isoformat(),
        'status': 'preparing',
        'log_file': log_file
    }
    
    # トレーニング設定ファイルを保存
    config_file = os.path.join(log_dir, f"config_{training_id}.json")
    with open(config_file, 'w', encoding='utf-8') as f:
        json.dump(training_info, f, ensure_ascii=False, indent=2)
    
    # トレーニングプロセスを開始（バックグラウンド）
    thread = threading.Thread(
        target=run_training_process,
        args=(training_id, training_info, training_dir, profiles_dir)
    )
    thread.daemon = True
    thread.start()
    
    # グローバル変数に追加
    TRAINING_PROCESSES[training_id] = {
        'thread': thread,
        'start_time': datetime.now(),
        'info': training_info,
        'status': 'running'
    }
    
    return {
        'status': 'success',
        'message': 'Training process started',
        'training_id': training_id,
        'info': training_info
    }


def run_training_process(training_id, training_info, training_dir, profiles_dir):
    """トレーニングプロセスを実行する関数（別スレッドで実行）"""
    try:
        log_file = training_info['log_file']
        model_path = training_info['model_path']
        output_model = training_info['output_model']
        parameters = training_info['parameters']
        profile_id = training_info['profile_id']
        
        # トレーニングデータをまとめる（カテゴリに基づく）
        categories = parameters.get('categories', [])
        
        # ログファイルを初期化
        with open(log_file, 'w', encoding='utf-8') as f:
            f.write(f"=== Training started at {datetime.now().isoformat()} ===\n")
            f.write(f"Model: {model_path}\n")
            f.write(f"Output: {output_model}\n")
            f.write(f"Parameters: {json.dumps(parameters, ensure_ascii=False)}\n\n")
        
        # グローバル変数を更新
        TRAINING_PROCESSES[training_id]['status'] = 'running'
        
        # トレーニングデータ準備のログ
        with open(log_file, 'a', encoding='utf-8') as f:
            f.write("=== Preparing training data ===\n")
            
            # カテゴリが指定されていない場合は、すべてのカテゴリ
            if not categories:
                f.write("Using all available categories\n")
                # トレーニングディレクトリ内のすべてのファイルを取得
                for root, dirs, files in os.walk(training_dir):
                    for file in files:
                        f.write(f"Found file: {os.path.join(root, file)}\n")
            else:
                f.write(f"Using specified categories: {', '.join(categories)}\n")
                # 指定されたカテゴリのファイルのみ
                for category in categories:
                    category_dir = os.path.join(training_dir, category)
                    if os.path.exists(category_dir) and os.path.isdir(category_dir):
                        for file in os.listdir(category_dir):
                            f.write(f"Found file in category {category}: {file}\n")
            
            f.write("\n=== Start training ===\n")
        
        # トレーニングの実行（ここではシミュレーションのみ）
        for epoch in range(parameters['epochs']):
            with open(log_file, 'a', encoding='utf-8') as f:
                f.write(f"Epoch {epoch+1}/{parameters['epochs']}\n")
            
            # 進捗シミュレーション
            for step in range(10):
                time.sleep(1)  # 実際のトレーニングでは、ここでトレーニングステップが実行される
                loss = 0.5 - (epoch * 0.1 + step * 0.01)
                with open(log_file, 'a', encoding='utf-8') as f:
                    f.write(f"Step {step+1}/10, Loss: {loss:.4f}\n")
        
        # トレーニング出力モデルをダミーで作成
        with open(output_model, 'w', encoding='utf-8') as f:
            f.write("This is a dummy model file for simulation purposes.")
        
        # トレーニング完了
        with open(log_file, 'a', encoding='utf-8') as f:
            f.write(f"\n=== Training completed at {datetime.now().isoformat()} ===\n")
            f.write(f"Output model saved to: {output_model}\n")
        
        # グローバル変数を更新
        TRAINING_PROCESSES[training_id]['status'] = 'completed'
        TRAINING_PROCESSES[training_id]['end_time'] = datetime.now()
        
        # トレーニングモデルを自動切り替え
        if parameters.get('auto_switch', True):
            try:
                # プロファイル設定を更新
                config_path = os.path.join(profiles_dir, profile_id, 'config.json')
                if os.path.exists(config_path):
                    with open(config_path, 'r', encoding='utf-8') as f:
                        config = json.load(f)
                    
                    # トレーニング回数を更新
                    config['training_count'] = config.get('training_count', 0) + 1
                    config['last_training'] = datetime.now().isoformat()
                    
                    # トレーニング済みモデルに切り替え
                    prev_model = config.get('model_path', '')
                    config['model_path'] = output_model
                    config['prev_model_path'] = prev_model
                    
                    with open(config_path, 'w', encoding='utf-8') as f:
                        json.dump(config, f, ensure_ascii=False, indent=2)
                    
                    # ログに記録
                    with open(log_file, 'a', encoding='utf-8') as f:
                        f.write(f"\n=== Auto-switching model ===\n")
                        f.write(f"Previous model: {prev_model}\n")
                        f.write(f"New model: {output_model}\n")
                        f.write(f"Model switched successfully at {datetime.now().isoformat()}\n")
                    
                    logger.info(f"Auto-switched model for profile {profile_id}: {output_model}")
            except Exception as e:
                logger.error(f"Failed to auto-switch model: {str(e)}")
                # エラーログを記録
                with open(log_file, 'a', encoding='utf-8') as f:
                    f.write(f"\n=== Error in auto-switching model ===\n")
                    f.write(f"Error: {str(e)}\n")
        else:
            # 自動切り替えなし、通常のプロファイル更新
            try:
                config_path = os.path.join(profiles_dir, profile_id, 'config.json')
                if os.path.exists(config_path):
                    with open(config_path, 'r', encoding='utf-8') as f:
                        config = json.load(f)
                    
                    # トレーニング回数を更新
                    config['training_count'] = config.get('training_count', 0) + 1
                    config['last_training'] = datetime.now().isoformat()
                    config['latest_trained_model'] = output_model
                    
                    with open(config_path, 'w', encoding='utf-8') as f:
                        json.dump(config, f, ensure_ascii=False, indent=2)
            except Exception as e:
                logger.error(f"Failed to update profile config: {str(e)}")
    
    except Exception as e:
        logger.exception(f"Error during training process: {str(e)}")
        
        # エラーログを記録
        with open(log_file, 'a', encoding='utf-8') as f:
            f.write(f"\n=== ERROR at {datetime.now().isoformat()} ===\n")
            f.write(f"Error: {str(e)}\n")
        
        # グローバル変数を更新
        TRAINING_PROCESSES[training_id]['status'] = 'error'
        TRAINING_PROCESSES[training_id]['error'] = str(e)
        TRAINING_PROCESSES[training_id]['end_time'] = datetime.now()


def get_training_status(training_id, profiles_dir, active_profile):
    """トレーニングプロセスのステータスを取得"""
    # トレーニングIDが存在するか確認
    if training_id not in TRAINING_PROCESSES:
        # トレーニングID存在しない場合は、ログファイルから情報を取得
        # アクティブなプロファイルが必要
        if not active_profile:
            return {"error": "No active profile selected"}, 400
        
        # トレーニングログディレクトリ
        log_dir = os.path.join(profiles_dir, active_profile, 'training_logs')
        config_file = os.path.join(log_dir, f"config_{training_id}.json")
        
        if os.path.exists(config_file):
            with open(config_file, 'r', encoding='utf-8') as f:
                training_info = json.load(f)
            
            # ログファイルからステータスを判断
            log_file = training_info.get('log_file', '')
            status = 'unknown'
            
            if os.path.exists(log_file):
                with open(log_file, 'r', encoding='utf-8') as f:
                    log_content = f.read()
                    if "=== Training completed at " in log_content:
                        status = 'completed'
                    elif "=== ERROR at " in log_content:
                        status = 'error'
                    else:
                        status = 'unknown'  # ステータスが不明（中断された可能性）
            
            # トレーニング完了後の自動切り替え情報を取得
            model_switched = False
            if status == 'completed' and os.path.exists(log_file):
                with open(log_file, 'r', encoding='utf-8') as f:
                    log_content = f.read()
                    if "=== Auto-switching model ===" in log_content:
                        model_switched = True
            
            return {
                'training_id': training_id,
                'info': training_info,
                'status': status,
                'is_active': False,
                'progress': 100 if status == 'completed' else 0,
                'model_switched': model_switched
            }
        else:
            return {"error": f"Training process not found: {training_id}"}, 404
    
    # 現在のトレーニングプロセス情報を取得
    process_info = TRAINING_PROCESSES[training_id]
    training_info = process_info['info']
    status = process_info['status']
    start_time = process_info['start_time']
    
    # プログレス計算（シミュレーション用）
    elapsed = (datetime.now() - start_time).total_seconds()
    total_time = training_info['parameters']['epochs'] * 10  # 10ステップ/エポック、1ステップ/秒と仮定
    progress = min(100, int(elapsed / total_time * 100)) if status == 'running' else 100
    
    # ログファイルの最新の内容を取得
    log_content = ""
    if 'log_file' in training_info and os.path.exists(training_info['log_file']):
        with open(training_info['log_file'], 'r', encoding='utf-8') as f:
            # 最後の20行程度を取得
            lines = f.readlines()
            log_content = ''.join(lines[-20:]) if lines else ""
    
    # トレーニング完了後の自動切り替え情報を取得
    model_switched = False
    if status == 'completed' and 'log_file' in training_info and os.path.exists(training_info['log_file']):
        with open(training_info['log_file'], 'r', encoding='utf-8') as f:
            log_content_full = f.read()
            if "=== Auto-switching model ===" in log_content_full:
                model_switched = True
    
    return {
        'training_id': training_id,
        'info': training_info,
        'status': status,
        'is_active': True,
        'progress': progress,
        'log_preview': log_content,
        'elapsed_time': elapsed,
        'model_switched': model_switched
    }


def get_training_log(training_id, profiles_dir, active_profile):
    """トレーニングログを取得"""
    # アクティブなプロファイルが必要
    if not active_profile:
        return {"error": "No active profile selected"}, 400
    
    # トレーニングログディレクトリ
    log_dir = os.path.join(profiles_dir, active_profile, 'training_logs')
    
    # トレーニング設定ファイル
    config_file = os.path.join(log_dir, f"config_{training_id}.json")
    
    if not os.path.exists(config_file):
        return {"error": f"Training configuration not found: {training_id}"}, 404
    
    # 設定ファイルからログファイルパスを取得
    with open(config_file, 'r', encoding='utf-8') as f:
        training_info = json.load(f)
    
    log_file = training_info.get('log_file', '')
    
    if not log_file or not os.path.exists(log_file):
        return {"error": f"Training log file not found: {training_id}"}, 404
    
    # ログファイルの内容を取得
    with open(log_file, 'r', encoding='utf-8') as f:
        log_content = f.read()
    
    return {
        'training_id': training_id,
        'log': log_content,
        'info': training_info
    }


def get_training_history(profiles_dir, active_profile):
    """トレーニング履歴を取得"""
    # アクティブなプロファイルが必要
    if not active_profile:
        return {"error": "No active profile selected"}, 400
    
    # トレーニングログディレクトリ
    log_dir = os.path.join(profiles_dir, active_profile, 'training_logs')
    
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)
        return {'history': []}
    
    # 設定ファイル一覧からトレーニング履歴を取得
    history = []
    
    for filename in os.listdir(log_dir):
        if filename.startswith('config_') and filename.endswith('.json'):
            config_path = os.path.join(log_dir, filename)
            
            try:
                with open(config_path, 'r', encoding='utf-8') as f:
                    training_info = json.load(f)
                
                # トレーニングIDを取得
                training_id = training_info.get('id', filename.replace('config_', '').replace('.json', ''))
                log_file = training_info.get('log_file', '')
                
                # ステータスを取得
                status = 'unknown'
                end_time = None
                model_switched = False
                
                if log_file and os.path.exists(log_file):
                    with open(log_file, 'r', encoding='utf-8') as f:
                        log_content = f.read()
                        
                        if "=== Training completed at " in log_content:
                            status = 'completed'
                            # 完了時間を取得
                            match = re.search(r"=== Training completed at ([^\n]+) ===", log_content)
                            if match:
                                end_time = match.group(1)
                            
                            # モデル切り替えを確認
                            if "=== Auto-switching model ===" in log_content:
                                model_switched = True
                        elif "=== ERROR at " in log_content:
                            status = 'error'
                            # エラー時間を取得
                            match = re.search(r"=== ERROR at ([^\n]+) ===", log_content)
                            if match:
                                end_time = match.group(1)
                
                # アクティブなトレーニングプロセスの場合は、そのステータスを使用
                if training_id in TRAINING_PROCESSES:
                    status = TRAINING_PROCESSES[training_id]['status']
                    if 'end_time' in TRAINING_PROCESSES[training_id]:
                        end_time = TRAINING_PROCESSES[training_id]['end_time'].isoformat()
                
                history_entry = {
                    'id': training_id,
                    'info': training_info,
                    'status': status,
                    'active': (training_id in TRAINING_PROCESSES),
                    'start_time': training_info.get('start_time'),
                    'end_time': end_time,
                    'model_switched': model_switched
                }
                
                history.append(history_entry)
            
            except Exception as e:
                logger.error(f"Error reading training config {filename}: {str(e)}")
    
    # 開始時間でソート（新しい順）
    history = sorted(history, key=lambda x: x.get('start_time', ''), reverse=True)
    
    return {'history': history}


def cancel_training_process(training_id, profiles_dir, active_profile):
    """トレーニングプロセスをキャンセル"""
    # トレーニングIDが存在するか確認
    if training_id not in TRAINING_PROCESSES:
        return {"error": f"Active training process not found: {training_id}"}, 404
    
    # トレーニングプロセス情報を取得
    process_info = TRAINING_PROCESSES[training_id]
    training_info = process_info['info']
    thread = process_info['thread']
    
    # スレッドをキャンセルする方法は直接はないため、ステータス更新で対応
    TRAINING_PROCESSES[training_id]['status'] = 'cancelled'
    TRAINING_PROCESSES[training_id]['end_time'] = datetime.now()
    
    # ログファイルにキャンセル情報を追記
    log_file = training_info.get('log_file', '')
    if log_file and os.path.exists(log_file):
        with open(log_file, 'a', encoding='utf-8') as f:
            f.write(f"\n=== Training cancelled at {datetime.now().isoformat()} ===\n")
    
    return {
        'status': 'success',
        'message': f'Training process {training_id} has been cancelled',
        'training_id': training_id
    }
