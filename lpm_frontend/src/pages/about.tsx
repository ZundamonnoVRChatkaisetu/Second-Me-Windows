import Layout from '../components/Layout';
import { Button } from '../components/ui/Button';
import Link from 'next/link';

/**
 * 概要ページ
 * プロジェクトについての詳細情報
 */
export default function AboutPage() {
  return (
    <Layout>
      <div className="bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h1 className="text-3xl font-bold mb-6">Second Me について</h1>
              
              <div className="prose max-w-none">
                <p className="text-lg text-gray-700 mb-6">
                  Second Meは、あなた自身のAI自己（AI self）を作成するためのオープンソースプロトコルです。
                  階層的メモリモデリング（HMM）とMe-Alignmentアルゴリズムを使用して、あなたのAI自己はあなたのアイデンティティを捉え、
                  コンテキストを理解し、あなたを本物のように反映します。
                </p>
                
                <h2 className="text-2xl font-semibold mt-8 mb-4">ミッション</h2>
                <p className="mb-4">
                  私たちのミッションは、すべての人が自分自身のAI自己を持ち、デジタル世界でより効果的に自分自身を表現できるようにすることです。
                  私たちは、AIが私たちの代わりに話すのではなく、私たちと一緒に話すことができる世界を信じています。
                </p>
                
                <h2 className="text-2xl font-semibold mt-8 mb-4">主な特徴</h2>
                <ul className="list-disc pl-6 mb-6 space-y-2">
                  <li>
                    <strong>あなた自身のAI自己をトレーニング</strong> - AIネイティブメモリを使用して、今すぐあなた自身のAI自己のトレーニングを開始できます。
                  </li>
                  <li>
                    <strong>ネットワーク上でのインテリジェンスの拡張</strong> - あなたのAI自己を分散型ネットワークに起動し、あなたの許可を得た人々が接続できます。
                  </li>
                  <li>
                    <strong>ロールプレイとAIスペース</strong> - あなたのAI自己は、さまざまなシナリオであなたを表現するために異なるペルソナに切り替えることができます。
                  </li>
                  <li>
                    <strong>100%のプライバシーとコントロール</strong> - あなたの情報とインテリジェンスはローカルに保存され、完全にプライベートです。
                  </li>
                </ul>
                
                <h2 className="text-2xl font-semibold mt-8 mb-4">技術</h2>
                <p className="mb-4">
                  Second Meは、最先端のAI技術を活用しています：
                </p>
                <ul className="list-disc pl-6 mb-6 space-y-2">
                  <li>最新の言語モデル（LLM）をローカルで実行</li>
                  <li>階層的メモリモデリング（HMM）でコンテキストを理解</li>
                  <li>Me-Alignmentアルゴリズムでアイデンティティを捕捉</li>
                  <li>分散型ネットワークでAI自己を共有</li>
                </ul>
                
                <h2 className="text-2xl font-semibold mt-8 mb-4">Windows版について</h2>
                <p className="mb-4">
                  Second Me WindowsはオリジナルのSecond Meをベースに、Windows環境でも動作するように改変されたバージョンです。
                  Python、Node.js、React、およびNext.jsを使用して実装されており、
                  Windows 10/11上で動作します。
                </p>
                
                <div className="bg-blue-50 p-6 rounded-lg mt-8">
                  <h3 className="text-xl font-medium mb-3">オープンソースコミュニティ</h3>
                  <p>
                    Second Meはオープンソースプロジェクトであり、コミュニティからの貢献を歓迎します。
                    バグ修正、新機能の追加、ドキュメントの改善など、どんな形の貢献も大歓迎です。
                  </p>
                  <div className="mt-4">
                    <Link href="https://github.com/ZundamonnoVRChatkaisetu/Second-Me-Windows" target="_blank">
                      <Button>GitHubでコントリビュート</Button>
                    </Link>
                  </div>
                </div>
              </div>
              
              <div className="mt-12 flex justify-center">
                <Link href="/">
                  <Button variant="outline" className="mr-4">ホームに戻る</Button>
                </Link>
                <Link href="/create">
                  <Button>始めましょう</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
