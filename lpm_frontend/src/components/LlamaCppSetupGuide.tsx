import React from 'react';
import Link from 'next/link';
import { Button } from './ui/Button';

/**
 * llama.cppのセットアップガイドを表示するコンポーネント
 * ユーザーがllama.cppを正しくビルドおよび設定する方法を案内します
 */
const LlamaCppSetupGuide: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">llama.cppセットアップガイド</h2>
      
      <div className="prose dark:prose-invert max-w-none">
        <p className="text-red-600 font-medium mb-4">
          llama.cppの実行ファイル(llama-server.exe)が見つからないため、チャット機能を利用できません。
          以下の手順に従ってセットアップを完了してください。
        </p>
        
        <h3 className="text-lg font-medium mt-6 mb-2">Windows環境でのセットアップ手順：</h3>
        
        <ol className="space-y-4 list-decimal pl-5">
          <li>
            <strong>ビルド済みバイナリを入手する方法（推奨）：</strong>
            <ul className="list-disc pl-5 mt-2">
              <li>
                <a 
                  href="https://github.com/ggml-org/llama.cpp/releases" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  llama.cpp公式リリースページ
                </a>
                から最新のWindows用ビルド済みバイナリ（通常は <code>llama-*-bin-win-x64.zip</code> というファイル名）をダウンロード
              </li>
              <li>ダウンロードしたZIPファイルを解凍</li>
              <li>解凍したフォルダ内の <code>llama-server.exe</code> を <code>dependencies/llama.cpp/</code> フォルダ内にコピー</li>
            </ul>
          </li>
          
          <li>
            <strong>ソースコードからビルドする方法（上級者向け）：</strong>
            <ul className="list-disc pl-5 mt-2">
              <li>
                <a 
                  href="https://github.com/ggml-org/llama.cpp" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  llama.cppリポジトリ
                </a>
                からソースコードをクローンまたはダウンロード
              </li>
              <li>CMakeとVisual Studioがインストールされていることを確認</li>
              <li>コマンドプロンプトでビルドコマンドを実行：</li>
              <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded overflow-auto">
                <code>
                  mkdir build<br />
                  cd build<br />
                  cmake ..<br />
                  cmake --build . --config Release
                </code>
              </pre>
              <li>ビルドが完了すると <code>build/bin/Release/llama-server.exe</code> が生成されます</li>
              <li>この <code>llama-server.exe</code> を <code>dependencies/llama.cpp/</code> フォルダ内にコピー</li>
            </ul>
          </li>
        </ol>
        
        <h3 className="text-lg font-medium mt-6 mb-2">ディレクトリ構造：</h3>
        <p>正しく設定されると、以下のようなディレクトリ構造になります：</p>
        <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded overflow-auto">
          <code>
            Second-Me-Windows/<br />
            ├── dependencies/<br />
            │   ├── llama.cpp/<br />
            │   │   ├── llama-server.exe  &lt;-- このファイルが必要<br />
            │   │   └── ... (その他のファイル)<br />
            │   └── ... (その他のディレクトリ)<br />
            └── ... (その他のファイル)
          </code>
        </pre>
        
        <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg mt-6">
          <h4 className="text-blue-800 dark:text-blue-300 font-medium">注意事項：</h4>
          <ul className="list-disc pl-5 mt-2 text-blue-800 dark:text-blue-300">
            <li>ディレクトリ名とファイル名は大文字小文字を区別します</li>
            <li>使用するモデルは <code>models/</code> ディレクトリに配置してください</li>
            <li>GPUアクセラレーションを利用する場合は、CUDAまたはDirectML対応のllama.cppビルドが必要です</li>
            <li>Windows環境では <code>main.exe</code> ではなく <code>llama-server.exe</code> が必要です</li>
          </ul>
        </div>
      </div>
      
      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <Button
          variant="default"
          onClick={() => window.location.reload()}
        >
          セットアップ後に再読み込み
        </Button>
        
        <Link href="https://github.com/ggml-org/llama.cpp/releases" passHref>
          <Button
            variant="outline"
            onClick={() => {}}
          >
            ビルド済みバイナリをダウンロード
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default LlamaCppSetupGuide;
