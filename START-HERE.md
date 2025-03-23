# Second-Me Windows スタートガイド

このガイドでは、Second-Me Windowsを効率的に起動し、発生する可能性のある一般的な問題を解決する方法を説明します。

## クイックスタート

Windows環境でSecond-Meを起動するための推奨方法は以下のとおりです：

```
launch-windows.bat
```

このスクリプトは、必要なすべての環境設定、依存関係のチェック、サービスの起動を自動的に行います。

## 前提条件

- **Python 3.10+**: `python --version` で確認できます
- **Node.js 18.0+**: `node --version` で確認できます
- **Git**: `git --version` で確認できます

## 起動オプション

### 1. 推奨: 統合起動スクリプト
```
launch-windows.bat
```
すべてのサービス（バックエンド、CORSプロキシ、フロントエンド）を適切な順序で起動します。バックエンドとCORSプロキシは最小化されたウィンドウで起動され、フロントエンドのみが主要ウィンドウとして表示されます。

### 2. バックエンドのみの起動 (デバッグ用)
```
start-backend-only.bat
```
Pythonバックエンドサーバーのみを起動します。バックエンドの問題を診断する際に便利です。

### 3. 単一ウィンドウモード
```
single-window-start.bat
```
すべてのサービスを起動しますが、最小化されたウィンドウが複数表示されます。

## トラブルシューティング

### エラー: バックエンドサーバー接続エラー (http://localhost:8002)

バックエンドサーバーに接続できない場合：

1. バックエンドのログを確認:
   ```
   type logs\backend.log
   ```

2. バックエンドが実行中か確認:
   ```
   netstat -ano | findstr ":8002"
   ```

3. バックエンドのみを直接起動して問題を確認:
   ```
   start-backend-only.bat
   ```

### エラー: CORSプロキシの問題

CORSプロキシに関連するエラーが発生した場合：

1. CORSプロキシのログを確認:
   ```
   type logs\cors-proxy.log
   ```

2. すべてのプロセスを終了してから再起動:
   ```
   taskkill /f /fi "WINDOWTITLE eq Second-Me*"
   launch-windows.bat
   ```

### エラー: 依存関係の問題

npm依存関係またはPythonパッケージのエラーが発生した場合：

1. フロントエンド依存関係のクリーンアップ:
   ```
   cd lpm_frontend
   clean-all.bat
   cd ..
   ```

2. Python仮想環境のリフレッシュ:
   ```
   rmdir /s /q second-me-venv
   launch-windows.bat
   ```

## サービスの停止

すべてのSecond-Meサービスを停止するには：

```
taskkill /f /fi "WINDOWTITLE eq Second-Me*"
```

## 詳細情報

より詳細なトラブルシューティング情報が必要な場合は、`TROUBLESHOOTING.md`を参照してください。
