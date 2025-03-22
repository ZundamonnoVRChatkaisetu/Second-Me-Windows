import Layout from '../components/Layout';
import { Button } from '../components/ui/Button';
import Link from 'next/link';

/**
 * About Page - Second Meについての説明ページ
 */
export default function AboutPage() {
  return (
    <Layout>
      <div className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold mb-8 text-center">Second Meについて</h1>
            
            <div className="prose prose-lg mx-auto">
              <p className="lead text-xl text-gray-600 mb-8">
                Second Meは、あなた自身のAI自己（AI self）を作成するためのオープンソースプロトコルです。
                Windows環境でも動作するように特別に設計されたこのバージョンを使用して、
                あなた自身のAIアシスタントを作成・カスタマイズできます。
              </p>
              
              <h2 className="text-2xl font-bold mt-12 mb-4">プロジェクトの哲学</h2>
              <p>
                Second Meは、あなたの情報とインテリジェンスがローカルに保存され、完全にプライベートであることを保証します。
                従来の集中型AIシステムとは異なり、あなたのデータはあなたのコンピューターから離れることはありません。
                これにより、あなたは完全なプライバシーとコントロールを保ちつつ、デジタルアイデンティティを拡張できます。
              </p>
              
              <h2 className="text-2xl font-bold mt-12 mb-4">主な機能</h2>
              
              <h3 className="text-xl font-medium mt-8 mb-2">あなた自身のAI自己をトレーニング</h3>
              <p>
                AIネイティブメモリを使用して、Second Meであなた自身のAI自己のトレーニングを開始できます。
                階層的メモリモデリング（HMM）とMe-Alignmentアルゴリズムを使用して、
                あなたのAI自己はあなたのアイデンティティを捉え、コンテキストを理解し、
                あなたを本物のように反映します。
              </p>
              
              <h3 className="text-xl font-medium mt-8 mb-2">インテリジェンスの拡張</h3>
              <p>
                ラップトップからあなたのAI自己を分散型ネットワークに起動し、
                あなたの許可を得た人々やアプリケーションが接続してデジタルアイデンティティとして
                あなたのコンテキストを共有できます。
              </p>
              
              <h3 className="text-xl font-medium mt-8 mb-2">ロールプレイとAIスペース</h3>
              <p>
                あなたのAI自己は、さまざまなシナリオであなたを表現するために異なるペルソナに切り替えることができます。
                また、他のSecond Meと協力してアイデアを生み出したり、問題を解決したりできます。
              </p>
              
              <h2 className="text-2xl font-bold mt-12 mb-4">技術について</h2>
              <p>
                Second Me Windowsは以下の技術を使用しています：
              </p>
              <ul className="list-disc pl-6 space-y-2 my-4">
                <li>フロントエンド: Next.js、React、TailwindCSS</li>
                <li>バックエンド: Python、Flask</li>
                <li>データベース: SQLite</li>
                <li>AI処理: llama.cpp</li>
              </ul>
              
              <h2 className="text-2xl font-bold mt-12 mb-4">オープンソース</h2>
              <p>
                Second Meは完全にオープンソースであり、コミュニティによって開発されています。
                GitHub上のプロジェクトに貢献することで、あなたもSecond Meの開発に参加できます。
              </p>
              
              <div className="flex justify-center mt-12">
                <Link href="/create">
                  <Button size="lg">
                    AIセルフを作成する
                  </Button>
                </Link>
              </div>
              
              <h2 className="text-2xl font-bold mt-12 mb-4">謝辞</h2>
              <p>
                このプロジェクトはオリジナルの
                <a href="https://github.com/mindverse/Second-Me" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  Second-Me
                </a>
                リポジトリに基づいており、そのコミュニティの努力に感謝します。
              </p>
              <p>
                また、以下のオープンソースプロジェクトにも感謝します：
              </p>
              <ul className="list-disc pl-6 space-y-2 my-4">
                <li>データ合成のために<a href="https://github.com/microsoft/graphrag" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">GraphRAG</a>（Microsoft）を利用</li>
                <li>モデルデプロイメントのために<a href="https://github.com/ggml-org/llama.cpp" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">llama.cpp</a>を利用</li>
                <li>ベースモデルとして主に<a href="https://huggingface.co/Qwen" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Qwen2.5</a>シリーズを使用</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
