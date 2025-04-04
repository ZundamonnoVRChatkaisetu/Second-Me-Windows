# Second Me - Windows Compatible Version

![Second Me](https://github.com/mindverse/Second-Me/blob/master/images/cover.png)

<div align="center">
  
[![Homepage](https://img.shields.io/badge/Second_Me-Homepage-blue?style=flat-square&logo=homebridge)](https://www.secondme.io/)
[![Report](https://img.shields.io/badge/Paper-arXiv-red?style=flat-square&logo=arxiv)](https://arxiv.org/abs/2503.08102)

</div>

*このリポジトリは [Second-Me](https://github.com/mindverse/Second-Me) のWindows互換版です。*

## プロジェクトについて

Second Meは、あなた自身のAI自己（AI self）を作成するためのオープンソースプロトコルです。Windowsでも動作するように改変されたこのリポジトリにより、Windows環境でSecond Meを体験できます。

## 主な機能

### **あなた自身のAI自己をトレーニング**
AIネイティブメモリを使用して、Second Meで今すぐあなた自身のAI自己のトレーニングを開始できます。階層的メモリモデリング（HMM）とMe-Alignmentアルゴリズムを使用して、あなたのAI自己はあなたのアイデンティティを捉え、コンテキストを理解し、あなたを本物のように反映します。

### **Second Meネットワーク上でのインテリジェンスの拡張**
ラップトップからあなたのAI自己を分散型ネットワークに起動し、あなたの許可を得た人々やアプリケーションが接続してデジタルアイデンティティとしてあなたのコンテキストを共有できます。

### **ロールプレイとAIスペース**
あなたのAI自己は、さまざまなシナリオであなたを表現するために異なるペルソナに切り替えることができます。また、他のSecond Meと協力してアイデアを生み出したり、問題を解決したりできます。

### **100%のプライバシーとコントロール**
従来の集中型AIシステムとは異なり、Second Meはあなたの情報とインテリジェンスがローカルに保存され、完全にプライベートであることを保証します。

## セットアップ手順

### 前提条件
- Windows 10/11 オペレーティングシステム
- Git（インストール済み）
- Python 3.10以上
- Visual Studio 2019以上（C++コンパイラを含む）
- CMake 3.21以上
- Node.js 18.0以上

#### Visual Studioのインストール
Visual Studioをまだインストールしていない場合は、Visual Studio Communityをインストールし、「**C++によるデスクトップ開発**」ワークロードを選択してください。

#### CMakeのインストール
CMakeがインストールされていない場合は、[公式サイト](https://cmake.org/download/)からダウンロードしてインストールできます。

### インストールと設定

1. リポジトリのクローン
```cmd
git clone https://github.com/ZundamonnoVRChatkaisetu/Second-Me-Windows.git
cd Second-Me-Windows
```

2. 環境のセットアップ
```cmd
scripts\setup.bat
```

これにより自動的に:
- 必要なシステム依存関係がチェックされます
- Python venv 環境がセットアップされます (デフォルト: second-me-venv)
- 必要なPythonパッケージがインストールされます
- llama.cppがビルドされます
- フロントエンド環境がセットアップされます

3. llama-server.exeの設定
```cmd
setup-llama-server.bat
```

これにより自動的に:
- llama-server.exeの存在確認と配置ガイダンス
- モデルディレクトリの確認と設定ガイダンス
- 詳細なセットアップ手順の案内

> **注意**: チャット機能を利用するには、llama-server.exeが必要です。詳細な手順は[llama-server.exeの使用ガイド](docs/llama_server_guide.md)を参照してください。

4. サービスの開始（新UI版）
```cmd
start-new-ui.bat
```

5. サービスへのアクセス
ブラウザを開き、`http://localhost:3000` にアクセスしてください

6. 従来のUIで起動する場合
```cmd
start-all-in-one.bat
```

7. CORS問題が発生した場合
```cmd
start-with-cors.bat
```

8. 接続問題の診断
```cmd
debug-connection.bat
```

## UI構成

### 新UIバージョン（オリジナルSecond Meに近いデザイン）
新UIバージョンでは以下の機能が含まれています：

- **ホームページ**: Second Meの概要と機能の紹介
- **チャット機能**: 高度なチャットインターフェース（llama-server.exeを使用）
- **AIセルフ作成プロセス**: ステップバイステップのセットアップガイド
  - アイデンティティの定義
  - 思い出のアップロード
  - AIのトレーニング
  - ネットワーク連携

### 従来のUI（チャットのみ）
シンプルなチャットインターフェースのみを提供します。

## チャット機能について

このプロジェクトでは、Windows環境でllama-server.exeを使用してチャット機能を実現しています。チャット機能を利用するには以下の手順を実行してください：

1. **llama-server.exeの入手**
   - [llama.cppリリースページ](https://github.com/ggml-org/llama.cpp/releases)から最新のWindows用ビルド済みバイナリをダウンロード
   - `llama-server.exe`を`dependencies/llama.cpp/`ディレクトリに配置

2. **GGUFモデルの入手と配置**
   - GGUFフォーマットのモデル（例：Qwen2, LLaMa, Mistral）を入手
   - `models/`ディレクトリに配置

3. **チャットの利用**
   - アプリケーションを起動後、左側のプロファイル選択
   - チャットインターフェースからメッセージを送信

詳細な設定とトラブルシューティングについては、[llama-server.exeの使用ガイド](docs/llama_server_guide.md)を参照してください。

## Python仮想環境について

このプロジェクトでは、Python標準の `venv` モジュールを使用して仮想環境を作成します。これにより、システムのPythonから分離された環境でSecond Meを実行できます。

### 仮想環境の場所と名前

デフォルトでは、仮想環境はプロジェクトルートディレクトリの `second-me-venv` フォルダに作成されます。この名前は `.env` ファイルで変更できます：

```
VENV_NAME=second-me-venv
```

### 手動での仮想環境の操作

必要に応じて、以下のコマンドで仮想環境を手動で操作できます：

- 仮想環境のアクティベート:
  ```cmd
  second-me-venv\Scripts\activate.bat
  ```
  
- 仮想環境の非アクティベート:
  ```cmd
  deactivate
  ```

## 日本語環境での注意事項

日本語版Windowsで文字化けやエラーが発生する場合は、以下の点に注意してください：

1. **コマンドプロンプトの文字コード** - Windows標準のコマンドプロンプトを使用する場合、文字コードの問題が生じる可能性があります。PowerShellの使用をお勧めします。

2. **スクリプトの実行ポリシー** - PowerShellでスクリプトを実行する場合、実行ポリシーの設定が必要な場合があります。管理者権限でPowerShellを開き、以下を実行してください：
   ```powershell
   Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

3. **パスの問題** - 日本語を含むパスでの動作に問題がある場合は、英語のみのパスにプロジェクトを配置してください。

4. **環境変数の設定** - システム環境変数`PYTHONIOENCODING=utf-8`を設定すると、Pythonの出力の文字化けを防ぐことができます。

## チュートリアル
- [ユーザーチュートリアル](https://second-me.gitbook.io/a-new-ai-species-making-we-matter-again)に従って、あなた自身のSecond Meを構築できます。

## よくある問題と解決方法

### セットアップ時のエラー

1. **「Python is not installed or not in PATH」エラー**
   - Python 3.10以上がインストールされ、PATHに追加されていることを確認してください。

2. **「Visual C++ compiler not found」エラー**
   - Visual Studioが正しくインストールされていることを確認してください。「C++によるデスクトップ開発」ワークロードが必要です。

3. **「CMake is not installed or not in PATH」エラー**
   - CMakeがインストールされ、PATHに追加されていることを確認してください。

4. **llama.cppのビルドエラー**
   - 詳細については `docs/llama_cpp_windows.md` を参照してください。Visual Studio開発者コマンドプロンプトからの実行が推奨される場合があります。

### 起動時のエラー

1. **「Python virtual environment not found」エラー**
   - セットアップが完了していることを確認してください。
   - `.env` ファイルで正しい venv 名が指定されているか確認してください。

2. **ポートが既に使用されているエラー**
   - 指定されたポート（デフォルトでは3000および8002）が他のアプリケーションで使用されていないことを確認してください。
   - `.env`ファイルでポート設定を変更できます。

3. **バックエンド接続エラー**
   - `debug-connection.bat`を実行してネットワーク接続を診断してください。
   - 必要に応じて`start-with-cors.bat`を使用してCORS問題を解決してください。

4. **llama-server.exeが見つからないエラー**
   - `setup-llama-server.bat`を実行してllama-server.exeの設定を確認してください。
   - `dependencies/llama.cpp/`ディレクトリにllama-server.exeが正しく配置されているか確認してください。

## 新しいUIコンポーネントの追加について

新UIを開発するためには、依存関係を更新する必要があります：

```cmd
cd lpm_frontend
update-deps.bat
```

これにより必要なパッケージがインストールされます。

## 貢献

Second Meへの貢献を歓迎します！バグの修正、新機能の追加、ドキュメントの改善に興味がある場合は、コントリビューションガイドをご確認ください。また、コミュニティでの経験共有、技術カンファレンスでの発表、ソーシャルメディアでの共有などでSecond Meをサポートすることもできます。

## 謝辞

このプロジェクトはオリジナルの[Second-Me](https://github.com/mindverse/Second-Me)リポジトリに基づいており、そのコミュニティの努力に感謝します。

このプロジェクトは、以下のオープンソースプロジェクトを利用しています：

- データ合成のために[GraphRAG](https://github.com/microsoft/graphrag)（Microsoft）を利用
- モデルデプロイメントのために[llama.cpp](https://github.com/ggml-org/llama.cpp)を利用
- ベースモデルとして主に[Qwen2.5](https://huggingface.co/Qwen)シリーズを使用

## ライセンス

Second Meは、Apache License 2.0の下でライセンスされたオープンソースソフトウェアです。詳細については、[LICENSE](LICENSE)ファイルをご覧ください。
