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
- 必要なシステム依存関係がインストールされます
- Python環境がセットアップされます
- llama.cppがビルドされます
- フロントエンド環境がセットアップされます

3. サービスの開始
```cmd
scripts\start.bat
```

4. サービスへのアクセス
ブラウザを開き、`http://localhost:3000` にアクセスしてください

5. ヘルプとその他のコマンド
```cmd
scripts\help.bat
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

1. **「Conda environment not found」エラー**
   - セットアップが完了していることを確認してください。
   - コマンドプロンプトを再起動して再試行してください。

2. **ポートが既に使用されているエラー**
   - 指定されたポート（デフォルトでは3000および8002）が他のアプリケーションで使用されていないことを確認してください。
   - `.env`ファイルでポート設定を変更できます。

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
