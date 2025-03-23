# Second-Me Windows 起動ガイド

## クイックスタート

すべての機能を一度に起動するには、以下のコマンドを実行してください：

```
simple-super-start.bat
```

このスクリプトは以下を自動的に行います：
1. 環境診断
2. 依存関係のインストール
3. 環境変数の設定
4. バックエンドサーバーの起動
5. フロントエンドサーバーの起動
6. ブラウザの起動

## 機能詳細

### 環境診断
- Node.js、npm、Python環境の確認
- 必要なポート(8002, 3000)の使用状況確認と自動解放

### 依存関係のインストール
- Python依存関係の自動インストール
- フロントエンド依存関係の確認とインストール

### 環境変数の設定
- バックエンドポート設定: 8002
- フロントエンド環境設定ファイルの自動生成/更新

### サーバー起動
- バックエンドサーバーの起動
- フロントエンドサーバーの起動

### ブラウザ起動
- フロントエンドへの自動接続（http://localhost:3000）

## トラブルシューティング

### バックエンド接続エラー
フロントエンドがバックエンドに接続できない場合：

1. バックエンドログを確認する
   ```
   type logs\backend.log
   ```

2. バックエンドのみを起動して詳細エラーを確認
   ```
   start-backend-only.bat
   ```

3. 環境変数が正しく設定されているか確認
   ```
   echo %LOCAL_APP_PORT%
   echo %PYTHONIOENCODING%
   ```

### プロファイル選択問題
プロファイルが選択できない、または選択が保持されない場合：

1. `active_profile.json` ファイルが存在するか確認
   ```
   dir active_profile.json
   ```

2. ファイルの内容を確認
   ```
   type active_profile.json
   ```

3. プロファイルディレクトリが存在するか確認
   ```
   dir profiles
   ```

### フロントエンド表示問題

1. 環境変数ファイルを確認
   ```
   type lpm_frontend\.env.local
   ```

2. 正しいバックエンドURLが設定されているか確認
   ```
   echo NEXT_PUBLIC_BACKEND_URL=http://localhost:8002 > lpm_frontend\.env.local
   ```

3. フロントエンドのみを再起動
   ```
   cd lpm_frontend
   npm run dev
   ```

## すべてのサービスを停止

すべてのSecond-Me関連サービスを停止するには：

```
taskkill /f /fi "WINDOWTITLE eq Second-Me*"
```

## 手動起動（詳細確認用）

### バックエンドのみ起動
```
start-backend-only.bat
```

### フロントエンドのみ起動
```
cd lpm_frontend
npm run dev
```

## その他の問題

より複雑な問題が発生した場合は、Issue報告やプロジェクトのDiscussionセクションを参照してください。
