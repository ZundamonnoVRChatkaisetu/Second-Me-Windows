# Windows環境でのllama.cppのビルド手順

このドキュメントでは、Windows環境でllama.cppをビルドするための詳細な手順を説明します。

## 前提条件

以下のツールがインストールされている必要があります：

1. **Visual Studio 2019以上** （C++デスクトップ開発ワークロードがインストールされていること）
2. **CMake 3.21以上**
3. **Git**

## ビルド手順

### 1. 開発環境の準備

Windowsでのビルドには、Visual StudioのMSVC（Microsoft Visual C++）コンパイラを使用します。Visual Studioをインストールした後、「開発者コマンドプロンプト」を使用することをお勧めします。

1. スタートメニューから「**x64 Native Tools Command Prompt for VS 2022**」（またはインストールしたバージョンに応じたもの）を開きます。
   - このコマンドプロンプトは、必要なビルドツールを含むPATHが設定されています。

### 2. llama.cppのソースコードの取得

通常は`git clone`でリポジトリを取得しますが、Second-Me Windowsでは依存関係ディレクトリに含まれるアーカイブを使用します。

```bash
# セットアップスクリプトによって自動的に展開されます
# 手動で行う場合は以下のコマンドを実行してください
powershell -Command "Expand-Archive -Path 'dependencies\llama.cpp.zip' -DestinationPath '.'"
```

### 3. CMakeプロジェクトの設定

llama.cppディレクトリに移動し、ビルドディレクトリを作成します。

```cmd
cd llama.cpp
mkdir build
cd build
```

CMakeを実行して、Visual Studioのプロジェクトファイルを生成します。

```cmd
cmake .. -DBUILD_SHARED_LIBS=OFF
```

オプションの説明：
- `BUILD_SHARED_LIBS=OFF`: 静的ライブラリとしてビルドします（DLLではなく）

### 4. ビルドの実行

CMakeが生成したプロジェクトをビルドします。

```cmd
cmake --build . --config Release
```

このコマンドは、`Release`設定でビルドを実行します。ビルドが成功すると、`bin\Release`ディレクトリに実行ファイルが生成されます。

### 5. ビルド結果の確認

ビルドが完了したら、以下のファイルが生成されているか確認します：

```cmd
dir bin\Release\llama-server.exe
```

このファイルが存在すれば、ビルドは成功しています。

## よくある問題と解決策

### 1. ビルドエラー：「CUDA not found」

GPUアクセラレーション（CUDA）を有効にする場合、NVIDIAのCUDAツールキットがインストールされている必要があります。

解決策：
- CUDAが不要であれば、`-DLLAMA_CUDA=OFF`オプションを追加してください。
- CUDAが必要であれば、[NVIDIA CUDA Toolkit](https://developer.nvidia.com/cuda-downloads)をインストールしてください。

### 2. ビルドエラー：「CMake Error: Could not find a package configuration file provided by...」

必要なパッケージが見つからない場合に発生します。

解決策：
- Visual Studioインストーラーを開き、「C++によるデスクトップ開発」ワークロードが選択されていることを確認してください。
- CMakeがインストールされていることを確認し、PATHに追加されていることを確認してください。

### 3. 「cl.exe」が見つからないエラー

これは、通常のコマンドプロンプトでビルドを試みたときに発生します。

解決策：
- Visual Studio開発者コマンドプロンプト（「x64 Native Tools Command Prompt for VS」）を使用してください。

## パフォーマンスの最適化

Windows環境でのパフォーマンスを最適化するには、以下のCMakeオプションを検討してください：

```cmd
cmake .. -DLLAMA_AVX=ON -DLLAMA_AVX2=ON -DLLAMA_F16C=ON -DLLAMA_FMA=ON
```

これらのオプションは、CPUの拡張命令セットを使用してパフォーマンスを向上させます。ただし、CPUがこれらの命令をサポートしている必要があります。

最新のIntelまたはAMD CPUでは、これらすべてのオプションを有効にすることができますが、古いCPUでは互換性の問題が発生する可能性があります。

## BLAS（Basic Linear Algebra Subprograms）サポート

行列演算のパフォーマンスを向上させるために、BLASライブラリを使用することができます：

```cmd
cmake .. -DLLAMA_BLAS=ON -DLLAMA_BLAS_VENDOR=OpenBLAS
```

ただし、これには追加のライブラリのインストールが必要になる場合があります。

## GPUアクセラレーション

NVIDIA GPUを使用している場合、CUDAをサポートしてビルドすることができます：

```cmd
cmake .. -DLLAMA_CUDA=ON
```

ただし、これには事前にNVIDIA CUDAツールキットのインストールが必要です。

## まとめ

このドキュメントでは、Windows環境でllama.cppをビルドする手順と、パフォーマンスを最適化するためのオプションについて説明しました。問題が発生した場合は、エラーメッセージを確認し、提案された解決策を試してください。

ビルドプロセスに問題がある場合は、Second-Meプロジェクトの[GitHub Issues](https://github.com/ZundamonnoVRChatkaisetu/Second-Me-Windows/issues)で報告してください。
