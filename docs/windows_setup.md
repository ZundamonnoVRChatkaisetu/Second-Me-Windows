# Windows環境でのSecond-Meセットアップガイド

このドキュメントでは、Windows環境でSecond-Meをセットアップし実行するための詳細な手順について説明します。

## システム要件

- **オペレーティングシステム**: Windows 10 または Windows 11
- **メモリ**: 最低8GB RAM（16GB以上推奨）
- **ストレージ**: 最低10GB空き容量（モデルによってはさらに必要）
- **プロセッサ**: マルチコアCPU（Intel Core i5以上または同等品）

## 必要なソフトウェア

以下のソフトウェアがインストールされている必要があります：

1. **Python 3.10以上**
2. **Git**
3. **Visual Studio 2019以上** （C++によるデスクトップ開発ワークロードが必要）
4. **CMake 3.21以上**
5. **Node.js 18.x以上** とnpm

## インストール手順

### 1. 前提ソフトウェアのインストール

#### Python 3.10以上のインストール

1. [Python公式サイト](https://www.python.org/downloads/)からPython 3.10以上のインストーラーをダウンロードします。
2. インストーラーを実行し、「**Add Python to PATH**」オプションを必ず選択してください。
3. インストール完了後、コマンドプロンプトで以下を実行してインストールを確認します：
   ```cmd
   python --version
   ```

#### Gitのインストール

1. [Git公式サイト](https://git-scm.com/download/win)からGitインストーラーをダウンロードします。
2. インストーラーを実行し、デフォルト設定でインストールします。
3. インストール完了後、コマンドプロンプトで以下を実行してインストールを確認します：
   ```cmd
   git --version
   ```

#### Visual Studioのインストール

1. [Visual Studioダウンロードページ](https://visualstudio.microsoft.com/downloads/)からCommunity版（無料）またはその他のエディションをダウンロードします。
2. インストーラーを実行し、「**C++によるデスクトップ開発**」ワークロードを選択します。
3. インストールを完了します。

#### CMakeのインストール

1. [CMake公式サイト](https://cmake.org/download/)からCMakeをダウンロードします。
2. インストーラーを実行し、「**Add CMake to the system PATH**」オプションを選択します。
3. インストール完了後、コマンドプロンプトで以下を実行してインストールを確認します：
   ```cmd
   cmake --version
   ```

#### Node.jsとnpmのインストール

1. [Node.js公式サイト](https://nodejs.org/)からLTS版をダウンロードします。
2. インストーラーを実行し、デフォルト設定でインストールします。
3. インストール完了後、コマンドプロンプトで以下を実行してインストールを確認します：
   ```cmd
   node --version
   npm --version
   ```

### 2. Second-Meリポジトリのクローン

管理者権限でコマンドプロンプトを開き、以下のコマンドを実行します：

```cmd
git clone https://github.com/ZundamonnoVRChatkaisetu/Second-Me-Windows.git
cd Second-Me-Windows
```

### 3. セットアップの実行

リポジトリのディレクトリで以下のコマンドを実行します：

```cmd
scripts\setup.bat
```

このスクリプトは以下の処理を行います：
- Minicondaのインストール（まだインストールされていない場合）
- Conda環境のセットアップ
- 必要なPythonパッケージのインストール
- llama.cppのビルド
- フロントエンド依存関係のインストール

セットアップには、システムスペックに応じて10〜30分程度かかることがあります。

#### 注意事項

- Visual Studioがインストールされていない場合、llama.cppのビルドが失敗する可能性があります。その場合は、Visual Studioをインストールしてから再度セットアップを実行してください。
- スクリプトがMinicondaをインストールした場合は、インストール完了後に一度コマンドプロンプトを閉じて再度開き、セットアップスクリプトを再実行してください。

### 4. 環境設定

サンプルの環境設定ファイルを実際の設定ファイルにコピーします：

```cmd
copy .env.example .env
```

必要に応じて`.env`ファイルを編集し、適切な設定に変更します：

```
# Conda環境名
CONDA_DEFAULT_ENV=second-me

# ポート設定
LOCAL_APP_PORT=8002
LOCAL_FRONTEND_PORT=3000

# ログレベル設定
LOG_LEVEL=INFO

# モデル設定
MODEL_PATH=models/Qwen2.5-1.8B-Chat-GGUF/qwen2_5-1_8b-chat-q5_k_m.gguf
```

### 5. モデルのダウンロード

Second-Meを実行するには、LLMモデルが必要です。サポートされているモデルをダウンロードし、`models`ディレクトリに配置します。

推奨モデル：
- [Qwen2.5-1.8B-Chat-GGUF](https://huggingface.co/Qwen/Qwen2.5-1.8B-Chat-GGUF)
- [Qwen2.5-7B-Chat-GGUF](https://huggingface.co/Qwen/Qwen2.5-7B-Chat-GGUF)（より高性能・より多くのメモリが必要）

ダウンロードしたモデルを、`.env`ファイルの`MODEL_PATH`に設定したパスに配置します。

## アプリケーションの起動

### アプリケーションの開始

以下のコマンドでSecond-Meを起動します：

```cmd
scripts\start.bat
```

このスクリプトは以下の処理を行います：
- バックエンドサーバーの起動（ポート8002）
- フロントエンドサーバーの起動（ポート3000）

起動が完了すると、ブラウザで自動的に`http://localhost:3000`が開き、Second-Meのウェブインターフェイスが表示されます。

### アプリケーションの停止

以下のコマンドでSecond-Meを停止します：

```cmd
scripts\stop.bat
```

## トラブルシューティング

### 一般的な問題

#### 「'conda'は、内部コマンドまたは外部コマンドとして認識されていません」

Condaがインストールされていないか、PATHに追加されていません。setup.batを再実行してください。インストール後、コマンドプロンプトを再起動する必要がある場合があります。

#### llama.cppのビルドエラー

Visual Studioが正しくインストールされていない可能性があります。「C++によるデスクトップ開発」ワークロードがインストールされていることを確認してください。また、詳細なビルド方法については`docs/llama_cpp_windows.md`を参照してください。

#### 「モデルが見つかりません」エラー

`.env`ファイルの`MODEL_PATH`が正しく設定されているか、指定されたパスにモデルファイルが存在するか確認してください。

#### フロントエンドの起動エラー

Node.jsとnpmが正しくインストールされているか確認してください。また、フロントエンドディレクトリで`npm install`を手動で実行することで問題が解決する場合があります。

### ログの確認

エラーが発生した場合は、以下のログファイルを確認してください：

- バックエンドログ: `logs/backend.log`
- フロントエンドログ: `logs/frontend.log`

## カスタマイズ

### ポートの変更

バックエンドおよびフロントエンドが使用するポートを変更するには、`.env`ファイルの`LOCAL_APP_PORT`と`LOCAL_FRONTEND_PORT`を編集します。

### モデルの変更

異なるLLMモデルを使用するには、新しいモデルを`models`ディレクトリにダウンロードし、`.env`ファイルの`MODEL_PATH`を更新します。

### ログレベルの変更

ログの詳細度を変更するには、`.env`ファイルの`LOG_LEVEL`を編集します。使用可能なレベルは以下の通りです：
- `DEBUG`: 最も詳細なログ
- `INFO`: 標準的な情報ログ（デフォルト）
- `WARNING`: 警告のみ
- `ERROR`: エラーのみ
- `CRITICAL`: 重大なエラーのみ

## アップデート

リポジトリの最新バージョンに更新するには、以下のコマンドを実行します：

```cmd
git pull
scripts\setup.bat
```

## サポートとコントリビューション

問題が発生した場合や、プロジェクトに貢献したい場合は、[GitHub Issues](https://github.com/ZundamonnoVRChatkaisetu/Second-Me-Windows/issues)を利用してください。
