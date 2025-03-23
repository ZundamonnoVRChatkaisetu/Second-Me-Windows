# Progress Report: Second Me Windows対応

## エラー分析

現在発生している主なエラーは以下に集約されます：

### 1. React JSXレンダリングエラー
```
TypeError: (0 , react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV) is not a function
```
- 影響範囲: フロントエンドのレンダリング
- 原因: Next.js 14.1.0とReact 18.2.0の互換性問題

### 2. CORSプロキシ重複宣言エラー
```
SyntaxError: Identifier 'createProxyMiddleware' has already been declared
```
- 影響範囲: バックエンドとフロントエンドの通信
- 原因: cors-anywhere.jsファイル内での重複宣言

### 3. UI依存関係のエラー
```
Module not found: Can't resolve 'class-variance-authority'
```
- 影響範囲: UIコンポーネントのレンダリング
- 原因: shadcn/ui関連のパッケージが不足している

### 4. バックエンド接続エラー
```
Failed to proxy http://localhost:8002/health AggregateError [ECONNREFUSED]
```
- 影響範囲: APIデータ取得
- 原因: Pythonバックエンドが正しく起動していない

### 5. 文字化けエラー
```
SyntaxError: Invalid or unexpected token
```
- 影響範囲: CORSプロキシの起動
- 原因: CORSプロキシスクリプト内の日本語文字列が文字化けしている

### 6. モデルサイズ表示エラー
```
TypeError: Cannot read properties of undefined (reading 'toFixed')
```
- 影響範囲: モデル選択UIの表示
- 原因: モデルサイズ情報がundefinedの場合の処理が不適切

### 7. API エンドポイント不一致エラー
```
POST /api/models/set 405 (Method Not Allowed)
```
- 影響範囲: モデル選択とプロファイル切り替え機能
- 原因: フロントエンドとバックエンドのAPIエンドポイント名の不一致

### 8. 複数コマンドウィンドウ問題
- 影響範囲: 使用体験
- 原因: 各サービスが個別のウィンドウで起動する設計

### 9. プロファイル選択問題
```
プロファイル管理から選択しても選択されない
```
- 影響範囲: プロファイル管理と切り替え機能
- 原因: プロファイル選択時の状態が永続化されておらず、サーバー再起動時に選択状態がリセットされる

### 10. バッチファイル文字化け問題（新規）
```
'Me' は、内部コマンドまたは外部コマンド、
操作可能なプログラムまたはバッチ ファイルとして認識されていません。
```
- 影響範囲: バッチファイルの実行
- 原因: バッチファイル内の日本語文字がUTF-8で保存されているのに対し、コマンドプロンプトが別のエンコーディングを使用している

## 修正内容

### 1. CORSプロキシの重複宣言問題を修正
- `cors-anywhere.js`ファイルを修正し、重複宣言の問題を解決
- 変更内容：
  ```javascript
  // 修正前
  const { createProxyMiddleware } = require('http-proxy-middleware');
  
  // 修正後
  const httpProxy = require('http-proxy-middleware');
  const createProxyMiddleware = httpProxy.createProxyMiddleware;
  ```

### 2. Next.jsとReactの互換性問題を解決
- Next.jsのバージョンを14.1.0から13.5.6にダウングレード
- eslint-config-nextも同じバージョンに合わせて更新
- package.jsonの修正内容：
  ```diff
  - "next": "14.1.0",
  + "next": "13.5.6",
  - "eslint-config-next": "14.1.0",
  + "eslint-config-next": "13.5.6",
  ```

### 3. UI依存関係の追加
- shadcn/uiコンポーネントに必要なパッケージを追加
- 追加したパッケージ：
  ```diff
  + "class-variance-authority": "^0.7.0",
  + "clsx": "^2.1.0",
  + "tailwind-merge": "^2.2.1",
  ```

### 4. CORSプロキシの文字化け問題を修正
- 日本語のエラーメッセージを英語に変更
- コード内のすべてのテキストをASCII文字のみを使用するように変更
- 変更内容：
  ```diff
  - error: 'バックエンドサービスに接続できませんでした。サービスが実行中か確認してください。',
  + error: 'Could not connect to backend service. Please check if the service is running.',
  ```

### 5. モデルサイズ表示エラーの修正
- `ModelSelector.tsx`ファイルの`formatSize`関数を修正し、undefinedチェックを追加
- 変更内容：
  ```diff
  - const formatSize = (gigabytes: number): string => {
  -   return `${gigabytes.toFixed(2)} GB`;
  - };
  + const formatSize = (gigabytes: number | undefined): string => {
  +   if (gigabytes === undefined || gigabytes === null) {
  +     return "サイズ不明";
  +   }
  +   return `${gigabytes.toFixed(2)} GB`;
  + };
  ```

### 6. APIエンドポイント不一致の修正
- ModelSelector.tsxのエンドポイントを修正してバックエンドと一致させる
  ```diff
  - await axios.post('/api/models/set', { model_path: selectedModelPath });
  + await axios.post('/api/models/select', { model_path: selectedModelPath });
  ```

- ProfileSelector.tsxのプロファイル選択処理を強化
  ```javascript
  // selectエンドポイントを最初に試し、失敗したらactivateを試す
  await axios.post('/api/profiles/select', requestData, requestConfig)
    .then(response => {
      console.log("Profile selection response:", response);
    })
    .catch(async (selectErr) => {
      console.warn("Profile select endpoint failed, trying activate endpoint:", selectErr);
      const activateResponse = await axios.post('/api/profiles/activate', requestData, requestConfig);
      console.log("Profile activation response:", activateResponse);
    });
  ```

### 7. Pythonバックエンド起動問題の解決
- 環境変数の適切な設定
  ```
  set PYTHONIOENCODING=utf-8
  set LOCAL_APP_PORT=8002
  ```
- Pythonの仮想環境の確認と作成
- 必要なPythonパッケージのインストール自動化
  ```
  pip install flask flask-cors python-dotenv
  ```

### 8. 新しい統合起動システムの開発
- `launch-windows.bat` - 完全な統合起動スクリプト
  - すべての依存関係チェック
  - Pythonバックエンドの正しい起動
  - CORSプロキシの確実な設定
  - サービス状態の確認機能
  - 詳細なログ機能

### 9. デバッグ用ツールの追加
- `start-backend-only.bat` - バックエンドのみを起動するスクリプト
  - バックエンドの問題を診断する際に便利
  - コンソール出力でリアルタイムのログを表示

### 10. ユーザーガイドの改善
- `START-HERE.md` - ユーザーフレンドリーな起動ガイド
  - 推奨される起動方法の解説
  - 一般的な問題のトラブルシューティング
  - サービス管理方法の説明

### 11. バックエンド接続専用ツールの開発
- `connect-backend.bat` - バックエンド接続に特化した専用ツール
  - 自動的にCORSプロキシを設定
  - バックエンドとプロキシを一括起動
  - 環境変数を正しく設定
  - アスキー文字のみを使用したエラーメッセージでの文字化け防止

### 12. 不要なbatファイルの整理
- 以下の空のbatファイルについてissue #1で削除推奨
  - fix-permissions.bat
  - fix-requirements.bat
  - foreground-backend.bat
  - foreground-frontend.bat
  - simple-start.bat

### 13. プロファイル選択問題の修正
- アクティブプロファイル情報を永続化するシステムを追加
  ```python
  # プロファイル情報をJSONファイルに保存
  def save_active_profile(profile_id, model_path=''):
      try:
          data = {
              'active_profile': profile_id,
              'model_path': model_path
          }
          with open(ACTIVE_PROFILE_FILE, 'w', encoding='utf-8') as f:
              json.dump(data, f, ensure_ascii=False, indent=2)
          logger.info(f"Active profile saved to file: {profile_id}")
          return True
      except Exception as e:
          logger.error(f"Failed to save active profile: {str(e)}")
          return False
  ```

- バックエンド起動時にアクティブプロファイルを読み込む機能を追加
  ```python
  # 保存されたアクティブプロファイル情報を読み込む
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
  ```

- フロントエンドのプロファイル選択後の処理を改善
  ```javascript
  // 選択成功後にページを確実にリロード
  setSuccess(`プロファイル「${activeProfile?.name || profileId}」を選択しました。ページをリロードします...`);
  
  // 変更が確実に反映されるよう、少し待ってからページをリロード
  setTimeout(() => {
    window.location.reload();
  }, 1500);
  ```

### 14. バッチファイル文字化け問題の修正（新規）
- バッチファイルの冒頭でUTF-8コードページを設定
  ```batch
  @echo off
  chcp 65001 > nul
  ```
- 日本語文字列を英語に置き換え
  ```diff
  - echo %BOLD%%BLUE%      Second-Me Windows スーパースタートツール      %RESET%
  + echo %BOLD%%BLUE%      Second-Me Windows Super Start Tool      %RESET%
  ```
- ASCII文字のみを使用して文字化けを防止

## 使用方法

### 推奨方法: 統合起動スクリプト
プロジェクトのルートディレクトリで以下のコマンドを実行：
```
super-start.bat
```
このスクリプトは、すべての必要なチェックとサービスの起動を自動的に行います。

### バックエンド問題の診断
バックエンドの問題を診断する場合：
```
start-backend-only.bat
```
これにより、バックエンドサーバーが直接コンソールで起動され、エラーメッセージをリアルタイムで確認できます。

### バックエンド接続のみの場合
バックエンドのみを起動し、CORSプロキシを経由して接続する場合：
```
connect-backend.bat
```
このスクリプトは、バックエンドとCORSプロキシの起動に特化しており、フロントエンドのUI起動は行いません。

### すべてのサービスを停止
```
taskkill /f /fi "WINDOWTITLE eq Second-Me*"
```

## エラーパターンと対応策

| エラーメッセージ | 考えられる原因 | 対応策 |
|------------|------------|--------|
| jsxDEV is not a function | React/Next.jsの互換性 | Next.jsを13.5.6にダウングレード |
| createProxyMiddleware has already been declared | CORSスクリプトの重複宣言 | CORSプロキシファイルを再生成 |
| Can't resolve 'class-variance-authority' | 不足しているUI依存関係 | 必要なパッケージをインストール |
| ECONNREFUSED (バックエンド接続エラー) | Pythonバックエンドが起動していない | super-start.batまたはstart-backend-only.batを使用して起動 |
| Invalid or unexpected token | 文字化けの問題 | 再生成されたASCII版CORSプロキシを使用 |
| Cannot read properties of undefined (reading 'toFixed') | モデルサイズがundefined | undefinedチェックを含む修正版のModelSelector.tsxを使用 |
| 405 Method Not Allowed | API エンドポイントの不一致 | フロントエンドのAPI呼び出しパスをバックエンドと一致させる |
| プロファイルが選択されない | プロファイル状態の永続化問題 | 修正版のprofiles.pyとconfig.pyを使用 |
| バッチファイル文字化け | エンコーディングの不一致 | チェックコードページで`chcp 65001`を追加しANSI文字に制限 |

## 今後の課題
- llama-serverとの連携強化
- ローカライズの改善
- インストールプロセスの自動化
- Windows専用のフロントエンド環境自動設定スクリプトの開発
