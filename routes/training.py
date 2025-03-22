#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Second Me Windows - トレーニングルート
AIモデルのトレーニングを管理するエンドポイント
"""

import os
import json
import shutil
from datetime import datetime
from flask import jsonify, request, Flask
from config import logger, PROFILES_DIR, ACTIVE_PROFILE, TRAINING_DIR
import training_manager


def register_routes(app: Flask):
    """トレーニング関連のルートを登録"""
    
    @app.route('/api/training/status', methods=['GET'])
    def get_training_status():
        """
        現在のトレーニング状態を取得するエンドポイント
        """
        try:
            if not ACTIVE_PROFILE:
                return jsonify({
                    'error': 'アクティブなプロファイルが選択されていません'
                }), 400
            
            # トレーニングディレクトリのパス
            training_path = training_manager.get_current_training_path(PROFILES_DIR, ACTIVE_PROFILE)
            
            # 現在アクティブなトレーニングプロセスの確認
            is_training_running = training_manager.is_training_running(ACTIVE_PROFILE)
            
            # トレーニング設定の読み込み
            training_config = {}
            config_path = os.path.join(training_path, 'config.json')
            if os.path.exists(config_path):
                try:
                    with open(config_path, 'r', encoding='utf-8') as f:
                        training_config = json.load(f)
                except Exception as e:
                    logger.error(f"Failed to load training config: {str(e)}")
            
            # トレーニング記録の読み込み
            training_logs = []
            log_path = os.path.join(training_path, 'logs.json')
            if os.path.exists(log_path):
                try:
                    with open(log_path, 'r', encoding='utf-8') as f:
                        training_logs = json.load(f)
                except Exception as e:
                    logger.error(f"Failed to load training logs: {str(e)}")
            
            # 最新のトレーニング記録を取得
            latest_training = None
            if training_logs:
                latest_training = training_logs[-1]
            
            return jsonify({
                'profile': ACTIVE_PROFILE,
                'is_training': is_training_running,
                'training_path': training_path,
                'config': training_config,
                'latest_training': latest_training,
                'log_count': len(training_logs)
            })
            
        except Exception as e:
            logger.exception(f"Error getting training status: {str(e)}")
            return jsonify({
                'error': f"トレーニング状態の取得中にエラーが発生しました: {str(e)}"
            }), 500


    @app.route('/api/training/start', methods=['POST'])
    def start_training():
        """
        トレーニングを開始するエンドポイント
        """
        try:
            if not ACTIVE_PROFILE:
                return jsonify({
                    'error': 'アクティブなプロファイルが選択されていません'
                }), 400
            
            # すでにトレーニングが実行中の場合
            if training_manager.is_training_running(ACTIVE_PROFILE):
                return jsonify({
                    'error': 'すでにトレーニングが実行中です'
                }), 400
            
            # トレーニングパラメータの取得
            data = request.json
            epochs = data.get('epochs', 3)
            batch_size = data.get('batch_size', 4)
            learning_rate = data.get('learning_rate', 0.0001)
            
            # トレーニングディレクトリの準備
            training_path = training_manager.get_current_training_path(PROFILES_DIR, ACTIVE_PROFILE)
            os.makedirs(training_path, exist_ok=True)
            
            # トレーニング設定の保存
            config = {
                'epochs': epochs,
                'batch_size': batch_size,
                'learning_rate': learning_rate,
                'start_time': datetime.now().isoformat()
            }
            
            with open(os.path.join(training_path, 'config.json'), 'w', encoding='utf-8') as f:
                json.dump(config, f, ensure_ascii=False, indent=2)
            
            # トレーニングプロセスの開始
            result = training_manager.start_training(
                ACTIVE_PROFILE,
                epochs=epochs,
                batch_size=batch_size,
                learning_rate=learning_rate
            )
            
            if result:
                return jsonify({
                    'status': 'success',
                    'message': 'トレーニングを開始しました',
                    'profile': ACTIVE_PROFILE,
                    'config': config
                })
            else:
                return jsonify({
                    'error': 'トレーニングの開始に失敗しました'
                }), 500
            
        except Exception as e:
            logger.exception(f"Error starting training: {str(e)}")
            return jsonify({
                'error': f"トレーニング開始中にエラーが発生しました: {str(e)}"
            }), 500


    @app.route('/api/training/stop', methods=['POST'])
    def stop_training():
        """
        実行中のトレーニングを停止するエンドポイント
        """
        try:
            if not ACTIVE_PROFILE:
                return jsonify({
                    'error': 'アクティブなプロファイルが選択されていません'
                }), 400
            
            # トレーニングが実行中でない場合
            if not training_manager.is_training_running(ACTIVE_PROFILE):
                return jsonify({
                    'error': 'トレーニングが実行中ではありません'
                }), 400
            
            # トレーニングプロセスの停止
            result = training_manager.stop_training(ACTIVE_PROFILE)
            
            if result:
                return jsonify({
                    'status': 'success',
                    'message': 'トレーニングを停止しました',
                    'profile': ACTIVE_PROFILE
                })
            else:
                return jsonify({
                    'error': 'トレーニングの停止に失敗しました'
                }), 500
            
        except Exception as e:
            logger.exception(f"Error stopping training: {str(e)}")
            return jsonify({
                'error': f"トレーニング停止中にエラーが発生しました: {str(e)}"
            }), 500


    @app.route('/api/training/logs', methods=['GET'])
    def get_training_logs():
        """
        トレーニングログを取得するエンドポイント
        """
        try:
            if not ACTIVE_PROFILE:
                return jsonify({
                    'error': 'アクティブなプロファイルが選択されていません'
                }), 400
            
            # トレーニングディレクトリのパス
            training_path = training_manager.get_current_training_path(PROFILES_DIR, ACTIVE_PROFILE)
            
            # トレーニングログの読み込み
            logs = []
            log_path = os.path.join(training_path, 'logs.json')
            if os.path.exists(log_path):
                try:
                    with open(log_path, 'r', encoding='utf-8') as f:
                        logs = json.load(f)
                except Exception as e:
                    logger.error(f"Failed to load training logs: {str(e)}")
            
            return jsonify({
                'logs': logs,
                'count': len(logs)
            })
            
        except Exception as e:
            logger.exception(f"Error getting training logs: {str(e)}")
            return jsonify({
                'error': f"トレーニングログの取得中にエラーが発生しました: {str(e)}"
            }), 500


    @app.route('/api/training/metrics', methods=['GET'])
    def get_training_metrics():
        """
        トレーニングメトリクスを取得するエンドポイント
        """
        try:
            if not ACTIVE_PROFILE:
                return jsonify({
                    'error': 'アクティブなプロファイルが選択されていません'
                }), 400
            
            # トレーニングディレクトリのパス
            training_path = training_manager.get_current_training_path(PROFILES_DIR, ACTIVE_PROFILE)
            
            # メトリクスファイルのパス
            metrics_path = os.path.join(training_path, 'metrics.json')
            
            # メトリクスの読み込み
            metrics = {}
            if os.path.exists(metrics_path):
                try:
                    with open(metrics_path, 'r', encoding='utf-8') as f:
                        metrics = json.load(f)
                except Exception as e:
                    logger.error(f"Failed to load training metrics: {str(e)}")
            
            return jsonify(metrics)
            
        except Exception as e:
            logger.exception(f"Error getting training metrics: {str(e)}")
            return jsonify({
                'error': f"トレーニングメトリクスの取得中にエラーが発生しました: {str(e)}"
            }), 500


    @app.route('/api/training/data', methods=['GET'])
    def get_training_data():
        """
        トレーニングデータを取得するエンドポイント
        """
        try:
            if not ACTIVE_PROFILE:
                return jsonify({
                    'error': 'アクティブなプロファイルが選択されていません'
                }), 400
            
            # トレーニングディレクトリのパス
            training_path = training_manager.get_current_training_path(PROFILES_DIR, ACTIVE_PROFILE)
            
            # トレーニングデータディレクトリ
            data_path = os.path.join(training_path, 'data')
            
            # データディレクトリが存在しない場合は作成
            if not os.path.exists(data_path):
                os.makedirs(data_path, exist_ok=True)
            
            # トレーニングデータファイルの一覧を取得
            data_files = []
            if os.path.exists(data_path):
                data_files = [f for f in os.listdir(data_path) if os.path.isfile(os.path.join(data_path, f))]
            
            return jsonify({
                'data_files': data_files,
                'count': len(data_files),
                'data_path': data_path
            })
            
        except Exception as e:
            logger.exception(f"Error getting training data: {str(e)}")
            return jsonify({
                'error': f"トレーニングデータの取得中にエラーが発生しました: {str(e)}"
            }), 500


    @app.route('/api/training/data/upload', methods=['POST'])
    def upload_training_data():
        """
        トレーニングデータをアップロードするエンドポイント
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
            
            # トレーニングデータディレクトリのパス
            data_path = os.path.join(
                training_manager.get_current_training_path(PROFILES_DIR, ACTIVE_PROFILE),
                'data'
            )
            
            # ディレクトリが存在しない場合は作成
            if not os.path.exists(data_path):
                os.makedirs(data_path, exist_ok=True)
            
            # ファイルを保存
            from werkzeug.utils import secure_filename
            filename = secure_filename(file.filename)
            file_path = os.path.join(data_path, filename)
            file.save(file_path)
            
            logger.info(f"Uploaded training data file: {filename}")
            
            return jsonify({
                'status': 'success',
                'message': f'トレーニングデータ "{filename}" をアップロードしました',
                'filename': filename,
                'file_path': file_path
            })
            
        except Exception as e:
            logger.exception(f"Error uploading training data: {str(e)}")
            return jsonify({
                'error': f"トレーニングデータのアップロード中にエラーが発生しました: {str(e)}"
            }), 500


    @app.route('/api/training/data/<filename>', methods=['DELETE'])
    def delete_training_data(filename):
        """
        トレーニングデータを削除するエンドポイント
        """
        try:
            if not ACTIVE_PROFILE:
                return jsonify({
                    'error': 'アクティブなプロファイルが選択されていません'
                }), 400
            
            # トレーニングデータファイルのパス
            file_path = os.path.join(
                training_manager.get_current_training_path(PROFILES_DIR, ACTIVE_PROFILE),
                'data',
                filename
            )
            
            # ファイルが存在しない場合
            if not os.path.exists(file_path):
                return jsonify({
                    'error': f'ファイル "{filename}" が見つかりません'
                }), 404
            
            # ファイルを削除
            os.remove(file_path)
            
            logger.info(f"Deleted training data file: {filename}")
            
            return jsonify({
                'status': 'success',
                'message': f'トレーニングデータ "{filename}" を削除しました'
            })
            
        except Exception as e:
            logger.exception(f"Error deleting training data: {str(e)}")
            return jsonify({
                'error': f"トレーニングデータの削除中にエラーが発生しました: {str(e)}"
            }), 500
