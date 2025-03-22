# CORS接続問題のトラブルシューティングガイド

このガイドでは、Second Me Windowsで発生するCORS（Cross-Origin Resource Sharing）およびバックエンド接続関連の問題の解決方法について説明します。

## よくある問題と解決方法

### 1. プロファイル選択時にバックエンド接続エラーが発生する

#### 症状
- プロファイルを選択しようとすると「バックエンドサービスに接続できません」というエラーが表示される
- コンソールに `Access-Control-Allow-Origin` ヘッダーに関するエラーが表示される
- リクエストが「No 'Access-Control-Allow-Origin' header is present」エラーで失敗する

#### 解決方法
1. **CORSプロキシを使用する**
   ```
   start-with-cors.bat
   ```
   このスクリプトは、フロントエンドとバックエンド間にCORSプロキシを設置し、適切なヘッダーを追加します。

2. **バックエンドが実行中であることを確認**
   ```
   debug-connection.bat
   ```
   このスクリプトはポートの使用状況を確認し、バックエンドが正しく実行されているかどうかを診断します。

3. **手動でバックエンドを再起動**
   ```
   %VENV_NAME%\Scripts\activate.bat
   python app.py
   ```

### 2. ConnectionStatusコンポーネントが接続問題を表示している

#### 症状
- UIの右上に赤い接続状態インジケータが表示される
- 「接続問題」というテキストと赤い丸が表示される

#### 解決方法
1. インジケータをクリックして詳細なエラー情報を確認
2. 推奨される対応策に従う
3. 「再接続を試みる」ボタンを押して接続を再試行
4. 問題が解決しない場合は、`debug-connection.bat`を実行して詳細な診断を行う

### 3. CORSプロキシの起動に失敗する

#### 症状
- `start-with-cors.bat`の実行時にプロキシの起動に失敗する
- Node.jsのエラーが表示される

#### 解決方法
1. **必要なパッケージがインストールされていることを確認**
   ```
   cd lpm_frontend
   npm install express http-proxy-middleware cors
   ```

2. **プロキシが使用するポートが空いていることを確認**
   ```
   netstat -ano | findstr ":8003"
   ```
   ポートが使用中の場合は、使用しているプロセスを終了するか、`.env`ファイルで別のポートを指定します。

3. **手動でプロキシを起動**
   ```
   cd lpm_frontend
   node public/cors-anywhere.js
   ```
   エラーメッセージを確認し、必要な修正を行います。

## CORS問題の技術的な背景

CORSは、Webブラウザにおけるセキュリティメカニズムで、異なるオリジン（ドメイン、ポート、プロトコル）間でのリソース共有を制限します。

Second Me Windowsでは、フロントエンドアプリケーション（ポート3000）からバックエンドAPI（ポート8002）へのリクエストが「異なるオリジン」として扱われるため、バックエンドサーバーが適切なCORSヘッダーを返さなければ、ブラウザはリクエストをブロックします。

### 技術的解決策の詳細

1. **CORSプロキシの使用**
   - フロントエンドとバックエンド間に中間プロキシを設置
   - プロキシがリクエストを受け取り、適切なCORSヘッダーを追加してからバックエンドに転送
   - バックエンドからのレスポンスにもCORSヘッダーを追加してフロントエンドに返す

2. **バックエンドでのCORS設定**
   - Flaskの`app.py`では`flask_cors`パッケージを使用してCORSをサポート
   - `after_request`ハンドラでリクエストごとにCORSヘッダーを追加
   - 適切なオリジン、ヘッダー、メソッドの設定が重要

3. **プリフライトリクエストの処理**
   - ブラウザは実際のリクエストの前に`OPTIONS`メソッドでプリフライトリクエストを送信
   - サーバーは適切なCORSヘッダーでプリフライトリクエストに応答する必要がある
   - プリフライトレスポンスが適切でない場合、ブラウザは実際のリクエストを送信しない

## 詳細な診断手順

### APIエンドポイントの直接テスト
バックエンドAPIを直接テストするには：

```bash
curl -v http://localhost:8002/api/profiles
```

`Access-Control-Allow-Origin`ヘッダーが含まれているかを確認：

```bash
curl -v -X OPTIONS http://localhost:8002/api/profiles -H "Origin: http://localhost:3000" -H "Access-Control-Request-Method: GET"
```

### フロントエンドのネットワークログ確認
ブラウザの開発者ツールを使用して：

1. F12キーを押すか、右クリックして「検査」を選択
2. 「Network」タブを選択
3. 「Fetch/XHR」でフィルタリング
4. ページを再読み込みしてAPIリクエストを観察
5. 失敗したリクエストのヘッダーとレスポンスを確認

### バックエンドのログ確認
バックエンドのログを確認して問題を特定：

1. バックエンドのコマンドウィンドウでログメッセージを確認
2. `logs/backend.log`ファイルを検査
3. エラーメッセージを確認して対応する

## 高度な設定オプション

### 環境変数
`.env`ファイルでは以下のオプションを設定できます：

```
# バックエンドのポート
LOCAL_APP_PORT=8002

# フロントエンドのポート
LOCAL_FRONTEND_PORT=3000

# CORSプロキシのポート
CORS_PORT=8003

# Python仮想環境名
VENV_NAME=second-me-venv
```

### CORSプロキシのカスタマイズ
`lpm_frontend/public/cors-anywhere.js`ファイルを編集してプロキシの動作をカスタマイズできます：

- 特定のオリジンのみを許可
- ヘッダーやメソッドの追加/削除
- リクエスト/レスポンスの変換
- エラーハンドリングの調整

## 参考文献
- [MDN Web Docs: CORS](https://developer.mozilla.org/ja/docs/Web/HTTP/CORS)
- [Flask-CORS ドキュメント](https://flask-cors.readthedocs.io/)
- [http-proxy-middleware ドキュメント](https://github.com/chimurai/http-proxy-middleware)
