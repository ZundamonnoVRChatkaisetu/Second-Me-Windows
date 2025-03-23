#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Second Me Windows - デフォルトプロファイル作成ツール
プロファイルが取得できない場合のトラブルシューティングツール
"""

import os
import json
import sys
from datetime import datetime

def create_default_profile():
    """デフォルトプロファイルを作成する"""
    print("Second Me Windows デフォルトプロファイル作成ツール")
    print("="*50)
    
    # 現在の作業ディレクトリを確認
    cwd = os.getcwd()
    print(f"現在の作業ディレクトリ: {cwd}")
    
    # プロファイルディレクトリを特定
    profiles_dir = os.path.join(cwd, 'profiles')
    if not os.path.exists(profiles_dir):
        os.makedirs(profiles_dir)
        print(f"プロファイルディレクトリを作成しました: {profiles_dir}")
    else:
        print(f"既存のプロファイルディレクトリを使用します: {profiles_dir}")
    
    # デフォルトプロファイルのID
    default_profile_id = "default_profile"
    default_profile_dir = os.path.join(profiles_dir, default_profile_id)
    
    # デフォルトプロファイルディレクトリの作成
    if not os.path.exists(default_profile_dir):
        os.makedirs(default_profile_dir)
        print(f"デフォルトプロファイルディレクトリを作成しました: {default_profile_dir}")
    else:
        print(f"既存のデフォルトプロファイルディレクトリを使用します: {default_profile_dir}")
    
    # デフォルトプロファイルの設定
    default_config = {
        'name': "Default Profile",
        'description': "Manually created default profile",
        'created_at': datetime.now().isoformat(),
        'model_path': ""  # モデルパスは空に
    }
    
    # 設定ファイルの保存
    config_path = os.path.join(default_profile_dir, 'config.json')
    with open(config_path, 'w', encoding='utf-8') as f:
        json.dump(default_config, f, ensure_ascii=False, indent=2)
    print(f"デフォルトプロファイル設定を作成しました: {config_path}")
    
    # アクティブプロファイル情報を保存
    active_profile_file = os.path.join(cwd, 'active_profile.json')
    active_profile_data = {
        'active_profile': default_profile_id,
        'model_path': default_config['model_path']
    }
    with open(active_profile_file, 'w', encoding='utf-8') as f:
        json.dump(active_profile_data, f, ensure_ascii=False, indent=2)
    print(f"アクティブプロファイル情報を保存しました: {active_profile_file}")
    
    # ワークスペースディレクトリも確認
    workspace_dir = os.path.join(cwd, 'WorkSpace')
    if not os.path.exists(workspace_dir):
        os.makedirs(workspace_dir)
        print(f"ワークスペースディレクトリを作成しました: {workspace_dir}")
    
    # プロファイル用のワークスペースディレクトリ
    profile_workspace_dir = os.path.join(workspace_dir, default_profile_id)
    if not os.path.exists(profile_workspace_dir):
        os.makedirs(profile_workspace_dir)
        print(f"プロファイル用のワークスペースディレクトリを作成しました: {profile_workspace_dir}")
    
    print("\nデフォルトプロファイルの作成が完了しました。")
    print("バックエンドサーバーとフロントエンドを再起動してください。")
    print("="*50)

if __name__ == '__main__':
    try:
        create_default_profile()
    except Exception as e:
        print(f"エラーが発生しました: {str(e)}")
        import traceback
        traceback.print_exc()
    
    # スクリプト終了時にユーザーに確認
    if sys.platform.startswith('win'):
        input("何かキーを押して終了してください...")
