# llama-server.exeの使用ガイド

このドキュメントでは、Second Me Windowsでllama-server.exeを使用するための詳細なガイドを提供します。

## 概要

Second Me Windowsでは、チャット機能を実現するためにllama.cppの`llama-server.exe`を使用しています。このプログラムはREST APIベースのサーバーで、大規模言語モデル（LLM）への効率的なアクセスを提供します。

## セットアップ手順

### 1. llama-server.exeの入手方法

#### A. ビルド済みバイナリを使用する方法（推奨）

1. [llama.cppのリリースページ](https://github.com/ggml-org/llama.cpp/releases)にアクセスします
2. 最新のWindows用リリース（通常は`llama-*-bin-win-x64.zip`という形式）をダウンロードします
3. ダウンロードしたZIPファイルを解凍します
4. 解凍したフォルダから`llama-server.exe`を見つけます
5. このファイルを`dependencies/llama.cpp/`フォルダにコピーします（フォルダが存在しない場合は作成してください）

#### B. ソースからビルドする方法（上級者向け）

1. llama.cppリポジトリをクローンします: `git clone https://github.com/ggml-org/llama.cpp.git`
2. Visual StudioとCMakeがインストールされていることを確認します
3. 以下のコマンドを実行してビルドします：
   ```
   cd llama.cpp
   mkdir build
   cd build
   cmake ..
   cmake --build . --config Release
   ```
4. ビルドが完了すると、`build/bin/Release/llama-server.exe`が生成されます
5. このファイルを`dependencies/llama.cpp/`フォルダにコピーします

### 2. 必要なモデルファイルの準備

llama-server.exeは、GGUFフォーマットのモデルファイルを使用します。

1. GGUFフォーマットのモデルファイルを入手します
   - 推奨モデル：Qwen2 7B GGUF、Qwen1.5 7B GGUF、Mistral 7B GGUF、LLaMA 7B GGUFなど
   - ダウンロード先： [HuggingFace](https://huggingface.co/)など
2. ダウンロードしたモデルファイルを`models/`ディレクトリに配置します

### 3. セットアップの検証

動作確認には、付属の検証スクリプトを実行します：

```
setup-llama-server.bat
```

このスクリプトは以下を確認します：
- llama-server.exeが正しい場所に配置されているか
- モデルディレクトリが存在し、GGUFモデルが配置されているか

## 使用方法

### 基本的な使い方

1. アプリケーションを起動します：
   ```
   start-new-ui.bat
   ```

2. ブラウザが自動的に開き、アプリケーションのUIが表示されます
3. 左側のサイドバーでプロファイルを選択（または新規作成）します
4. チャットインターフェースでメッセージを入力し、送信します

### 詳細設定

#### モデル選択

1. 「設定」ページに移動します
2. 「モデル設定」セクションで使用したいモデルを選択します
3. 「保存」をクリックして設定を適用します

#### サーバーパラメータのカスタマイズ

詳細なサーバーパラメータをカスタマイズしたい場合は、`.env`ファイルを編集します：

```
# llama.cppのパス
LLAMACPP_PATH=dependencies/llama.cpp

# その他のllama-serverパラメータ
LLAMA_SERVER_PORT=8080
LLAMA_CONTEXT_SIZE=2048
LLAMA_GPU_LAYERS=1
```

## トラブルシューティング

### 一般的な問題

#### 1. llama-server.exeが見つからないエラー

エラーメッセージ：
```
llama.cpp実行ファイルが見つかりません。セットアップを確認してください。
```

解決策：
- `dependencies/llama.cpp/`ディレクトリに`llama-server.exe`が正しく配置されているか確認します
- ファイルが見つからない場合は、上記の「llama-server.exeの入手方法」に従って取得してください

#### 2. モデルが見つからないエラー

エラーメッセージ：
```
選択されたモデルファイルが見つかりません
```

解決策：
- `models/`ディレクトリにGGUFモデルが正しく配置されているか確認します
- 設定ページで正しいモデルが選択されていることを確認します

#### 3. サーバー起動エラー

エラーメッセージ：
```
llama-serverの起動に失敗しました
```

解決策：
- コマンドプロンプトで手動でllama-server.exeを実行し、エラーを確認します：
  ```
  cd dependencies\llama.cpp
  llama-server.exe -m ..\..\models\your_model.gguf
  ```
- エラーメッセージを確認し、問題を特定します

#### 4. メモリ関連のエラー

エラーメッセージ：
```
out of memory
```

解決策：
- より小さなモデル（7Bなど）を使用します
- コンテキストサイズを小さくします（.envファイルでLLAMA_CONTEXT_SIZEを調整）
- GPUメモリが不足している場合は、GPU層の数を減らします（LLAMA_GPU_LAYERSを調整）

### 詳細なログの確認

問題のトラブルシューティングには、ログファイルを確認してください：
- バックエンドログ: `logs/backend.log`
- フロントエンドログ: ブラウザのコンソール（F12キーを押して開発者ツールを開く）

## 高度な設定

### サーバーの手動起動

必要に応じて、llama-serverを手動で起動することもできます：

```cmd
cd dependencies\llama.cpp
llama-server.exe -m ..\..\models\your_model.gguf --host 127.0.0.1 --port 8080 -c 2048
```

サーバーが起動している場合、アプリケーションは既存のサーバーに接続します。

### GPU高速化の活用

NVIDIAのGPUを持っている場合、GPUアクセラレーションを有効にして処理速度を向上させることができます：

```cmd
llama-server.exe -m ..\..\models\your_model.gguf -ngl 33 --host 127.0.0.1 --port 8080
```

`-ngl` パラメータはGPUに割り当てる層の数を指定します。大きな値ほど多くのGPUメモリを使用しますが、処理速度が向上します。

## 参考資料

詳細な情報については、以下のリソースを参照してください：

- [llama.cpp公式ドキュメント](https://github.com/ggml-org/llama.cpp)
- [llama-server APIリファレンス](https://github.com/ggml-org/llama.cpp/blob/master/examples/server/README.md)
- [GGUFモデルフォーマット](https://github.com/ggml-org/ggml/blob/master/docs/gguf.md)
