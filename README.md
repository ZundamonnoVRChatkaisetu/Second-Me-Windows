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
Visual Studioをまだインストールしていない場合は、Visual Studio Communityをインストールし、「C++によるデスクトップ開発」ワークロードを選択してください。

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

## チュートリアル
- [ユーザーチュートリアル](https://second-me.gitbook.io/a-new-ai-species-making-we-matter-again)に従って、あなた自身のSecond Meを構築できます。

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
