# Second-Me Windows 構築進捗

## 現在の状態
- 問題は特定されました：Next.jsのルーティング設定とバックエンドの健全性チェックの接続問題
- 修正を実施：Next.jsのリライトルールが健全性チェックエンドポイント（/health）をカバーしていませんでした
- シンプルな起動スクリプト（simple-start.bat）を追加し、余分なチェックをスキップ

## 問題分析と解決策
1. **問題点の特定**:
   - フロントエンドからバックエンドへの接続が確立できていない
   - 具体的には、`/health`エンドポイントへのリクエストがプロキシされていない
   - 環境変数の名前の不一致（`BACKEND_URL` vs `NEXT_PUBLIC_BACKEND_URL`）

2. **実装した解決策**:
   - `next.config.js`を更新し、`/health`エンドポイントのリライトルールを追加
   - 環境変数名を`NEXT_PUBLIC_BACKEND_URL`に統一（Next.jsのクライアントサイドで読み取れるように）
   - シンプルな起動スクリプト（simple-start.bat）を追加

3. **修正されたファイル**:
   - `lpm_frontend/next.config.js`: リライトルールと環境変数設定を修正
   - `simple-start.bat`: シンプルな起動スクリプトを新規追加

## 更新された構築手順

### 一般的な構築手順
1. リポジトリをクローン:
   ```
   git clone https://github.com/ZundamonnoVRChatkaisetu/Second-Me-Windows.git
   cd Second-Me-Windows
   ```

2. セットアップスクリプトを実行（初回のみ）:
   ```
   scripts\setup.bat
   ```

3. アプリケーションを起動:
   ```
   simple-start.bat
   ```

### トラブルシューティング手順

問題が発生した場合の対処:

1. **診断**: 
   ```
   debug-connection.bat
   ```
   各種ポートとサービスのステータスを確認します。

2. **CORSプロキシ経由で起動**:
   ```
   start-with-cors.bat
   ```
   CORSエラーが発生している場合はこちらを試してください。

3. **手動での起動**:
   ```
   # バックエンドの起動
   second-me-venv\Scripts\activate.bat
   python app.py
   
   # 別のターミナルでフロントエンドの起動
   cd lpm_frontend
   npm run dev
   ```

## 次のアクション
- 修正されたセットアップで問題なく動作することを確認
- より詳細なドキュメントを作成して、Windows環境での各コンポーネントの役割と連携方法を説明
- 本番環境ビルドのサポートを検討

## メモ
- Next.jsのプロキシ設定は開発モード(`npm run dev`)のときに特に重要
- 本番モード(`npm run build`後の`npm start`)ではサーバサイドでのプロキシを別途設定する必要がある
- Windows環境でのパス区切り文字やエンコーディングには引き続き注意が必要
