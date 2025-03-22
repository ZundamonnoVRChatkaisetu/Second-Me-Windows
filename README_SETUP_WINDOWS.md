# Second Me Windows セットアップガイド

## 前提条件

以下のソフトウェアがインストールされていることを確認してください：

- Windows 10/11 オペレーティングシステム
- Git（インストール済み）
- Python 3.10以上
- Visual Studio 2019以上（C++コンパイラを含む）
- CMake 3.21以上
- Node.js（最新の安定版を推奨）

## セットアップ手順

### 1. リポジトリをクローン

```cmd
git clone https://github.com/ZundamonnoVRChatkaisetu/Second-Me-Windows.git
cd Second-Me-Windows
```

### 2. llama.cpp アーカイブのダウンロード

Second Meのセットアップには、llama.cppライブラリが必要です。以下の手順でダウンロードしてください：

1. ブラウザで [llama.cpp リポジトリ](https://github.com/ggml-org/llama.cpp) にアクセス
2. 「Code」ボタンをクリック
3. 「Download ZIP」オプションを選択して、ZIPファイルをダウンロード
4. ダウンロードしたZIPファイル（`llama.cpp-master.zip`）を、`dependencies` ディレクトリに配置

**注意**: セットアップスクリプトは自動的に `llama.cpp-master.zip` または `llama.cpp.zip` という名前のファイルを探します。

### 3. セットアップスクリプトの実行

以下のコマンドを実行してセットアップを開始します：

```cmd
scripts\setup.bat
```

このスクリプトは以下の処理を行います：
- システム要件のチェック
- Python仮想環境のセットアップ
- 必要なPythonパッケージのインストール
- llama.cppのビルド
- フロントエンド依存関係のインストール

### 4. アプリケーションの起動

セットアップが正常に完了したら、以下のコマンドでアプリケーションを起動できます：

```cmd
scripts\start.bat
```

### 5. アクセス

ブラウザを開き、`http://localhost:3000` にアクセスしてSecond Meを使用開始します。

## トラブルシューティング

### llama.cpp関連のエラー

セットアップ中に「Local llama.cpp archive not found」というエラーが表示された場合：

1. `dependencies` ディレクトリに `llama.cpp-master.zip` ファイルが存在することを確認
2. ZIPファイルが破損している場合は、再ダウンロードを試行
3. ファイル名が正確に `llama.cpp-master.zip` または `llama.cpp.zip` であることを確認

### Visual C++ コンパイラに関するエラー

「Visual C++ compiler not found」というエラーが表示された場合：

1. Visual Studioが正しくインストールされていることを確認
2. 「C++によるデスクトップ開発」ワークロードがインストールされていることを確認
3. Visual Studio開発者コマンドプロンプトから setup.bat を実行してみる

### PowerShellスクリプト実行ポリシーに関するエラー

PowerShellスクリプトの実行でエラーが発生した場合：

1. 管理者権限でPowerShellを開く
2. 以下のコマンドを実行して、ローカルスクリプトの実行を許可：
   ```powershell
   Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

## その他の情報

詳細については、メインの [README.md](README.md) ファイルを参照してください。

このセットアップガイドに関する問題や提案があれば、GitHub Issuesでお知らせください。
