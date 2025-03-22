import React from 'react';
import Layout from '../components/Layout';
import { Button } from '../components/ui/Button';
import Link from 'next/link';

/**
 * About ページ - Second Meプロジェクトの詳細情報を提供
 */
export default function AboutPage() {
  return (
    <Layout>
      <div className="bg-cream-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-4">Second Me について</h1>
              <p className="text-lg text-gray-600">
                あなた自身のAI自己をWindowsで実現するオープンソースプロジェクト
              </p>
            </div>

            {/* 主要セクション */}
            <div className="mb-16">
              <h2 className="text-2xl font-bold mb-6">プロジェクトの目的</h2>
              <p className="mb-4">
                Second Meは、あなた自身のAI自己（AI self）を作成するためのオープンソースプロトコルです。
                従来の大規模言語モデルとは異なり、Second Meはあなたのアイデンティティ、経験、
                価値観を反映したパーソナライズされたAIインテリジェンスを構築します。
              </p>
              <p className="mb-4">
                私たちのWindowsプロジェクトは、オリジナルのSecond Meプロトコルを
                Windows環境で利用できるように移植したものです。これにより、
                より多くの人々がこの革新的な技術にアクセスできるようになります。
              </p>
            </div>

            {/* 主な機能セクション */}
            <div className="mb-16">
              <h2 className="text-2xl font-bold mb-6">主な機能</h2>
              
              <div className="space-y-8">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-xl font-semibold mb-3">あなた自身のAI自己をトレーニング</h3>
                  <p>
                    AIネイティブメモリを使用して、Second Meであなた自身のAI自己のトレーニングを開始できます。
                    階層的メモリモデリング（HMM）とMe-Alignmentアルゴリズムを使用して、あなたのAI自己はあなたのアイデンティティを捉え、
                    コンテキストを理解し、あなたを本物のように反映します。
                  </p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-xl font-semibold mb-3">Second Meネットワーク上でのインテリジェンスの拡張</h3>
                  <p>
                    ラップトップからあなたのAI自己を分散型ネットワークに起動し、あなたの許可を得た人々やアプリケーションが
                    接続してデジタルアイデンティティとしてあなたのコンテキストを共有できます。
                  </p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-xl font-semibold mb-3">ロールプレイとAIスペース</h3>
                  <p>
                    あなたのAI自己は、さまざまなシナリオであなたを表現するために異なるペルソナに切り替えることができます。
                    また、他のSecond Meと協力してアイデアを生み出したり、問題を解決したりできます。
                  </p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-xl font-semibold mb-3">100%のプライバシーとコントロール</h3>
                  <p>
                    従来の集中型AIシステムとは異なり、Second Meはあなたの情報とインテリジェンスがローカルに保存され、
                    完全にプライベートであることを保証します。あなたのデータはあなたのコンピューターから離れることはありません。
                  </p>
                </div>
              </div>
            </div>

            {/* 技術スタック */}
            <div className="mb-16">
              <h2 className="text-2xl font-bold mb-6">技術スタック</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-xl font-semibold mb-3">バックエンド</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Python 3.10+</li>
                    <li>Flask - Webサーバー</li>
                    <li>SQLite - データベース</li>
                    <li>llama.cpp - モデル推論</li>
                    <li>GraphRAG - データ合成</li>
                  </ul>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-xl font-semibold mb-3">フロントエンド</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Next.js - フレームワーク</li>
                    <li>React - UIライブラリ</li>
                    <li>Tailwind CSS - スタイリング</li>
                    <li>Axios - APIクライアント</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* チーム情報 */}
            <div className="mb-16">
              <h2 className="text-2xl font-bold mb-6">Second Meチームについて</h2>
              <p className="mb-4">
                Second Meは、AI技術の民主化とパーソナライズされたAIの未来を信じる開発者、
                研究者、デザイナーの集まりによって開発されています。私たちは、あなた自身のデータと
                知性を制御できるAIの未来を創造することに専念しています。
              </p>
              <p>
                Windows互換版は、オリジナルのSecond Meプロジェクトの理念に基づいて、
                より多くの人々にこの技術を提供することを目的としています。
              </p>
            </div>

            {/* コミュニティ参加セクション */}
            <div className="bg-blue-50 p-8 rounded-lg text-center">
              <h2 className="text-2xl font-bold mb-4">コミュニティに参加する</h2>
              <p className="mb-6">
                Second Meプロジェクトはオープンソースであり、あなたの貢献を歓迎します。
                コードの改善、ドキュメントの作成、バグの報告など、どんな形でも参加できます。
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link href="https://github.com/ZundamonnoVRChatkaisetu/Second-Me-Windows" target="_blank">
                  <Button>GitHub で参加</Button>
                </Link>
                <Link href="/create">
                  <Button variant="primary">今すぐ始める</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
