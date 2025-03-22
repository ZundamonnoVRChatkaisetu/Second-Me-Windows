import React from 'react';
import Layout from '../components/Layout';
import { Button } from '../components/ui/Button';
import Link from 'next/link';

/**
 * Second Meの概要ページ
 */
export default function AboutPage() {
  return (
    <Layout>
      <div className="bg-cream-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* ヘッダーセクション */}
            <div className="text-center mb-16">
              <div className="mb-6 inline-flex">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-blue-400"></div>
                </div>
              </div>
              <h1 className="text-4xl font-bold mb-4">Second Meについて</h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                あなた自身のAI自己をWindowsで実現する、オープンソースプロトコル
              </p>
            </div>

            {/* ミッションセクション */}
            <div className="bg-white rounded-lg shadow-sm p-8 mb-12">
              <h2 className="text-2xl font-bold mb-4">私たちのミッション</h2>
              <p className="text-gray-600 mb-6">
                Second Meは、個人が自分自身のAIアシスタントを作成し、完全にプライベートな環境でコントロールできるようにすることを目指しています。私たちは、AIテクノロジーがプライバシーを損なわずに個人の生産性と創造性を向上させるべきだと信じています。
              </p>
              <p className="text-gray-600 mb-6">
                私たちのビジョンは、誰もが自分自身のAIを持ち、それが自分のアイデンティティ、価値観、興味に完全に合わせられた状態で、日々のタスクをサポートする世界です。
              </p>
              <p className="text-gray-600">
                Second Meは100%オープンソースであり、コミュニティ主導で開発されています。私たちは、AIの未来はオープンで透明性があり、個人が制御できるべきだと信じています。
              </p>
            </div>

            {/* 特徴セクション */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-xl font-semibold mb-3">プライバシー重視</h3>
                <p className="text-gray-600">
                  あなたのデータはローカルに保存され、あなたが完全にコントロールします。クラウドにデータが送信されることはありません。
                </p>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-xl font-semibold mb-3">オープンソース</h3>
                <p className="text-gray-600">
                  すべてのコードはオープンソースで、透明性があり、コミュニティによって検証されています。
                </p>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-xl font-semibold mb-3">パーソナライズ</h3>
                <p className="text-gray-600">
                  あなたの好み、興味、価値観に基づいて、AIを完全にカスタマイズすることができます。
                </p>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-xl font-semibold mb-3">Windows対応</h3>
                <p className="text-gray-600">
                  このバージョンは特にWindows環境用に最適化されており、誰でも簡単に使用できます。
                </p>
              </div>
            </div>

            {/* 技術セクション */}
            <div className="bg-white rounded-lg shadow-sm p-8 mb-12">
              <h2 className="text-2xl font-bold mb-4">技術について</h2>
              <p className="text-gray-600 mb-6">
                Second Meは最新のAI技術を使用しており、特に以下の技術に基づいています：
              </p>
              
              <ul className="list-disc pl-6 space-y-3 text-gray-600 mb-6">
                <li>
                  <strong>階層的メモリモデリング（HMM）</strong> - あなたの記憶とコンテキストを整理し、AIがより良く理解できるようにします。
                </li>
                <li>
                  <strong>Me-Alignmentアルゴリズム</strong> - あなたの価値観と好みにAIを調整します。
                </li>
                <li>
                  <strong>ローカルファーストアーキテクチャ</strong> - プライバシーを確保するために、すべてのデータと処理をローカルで行います。
                </li>
                <li>
                  <strong>オープンソースLLM</strong> - 透明性とカスタマイズのために、オープンソースの大規模言語モデルを使用しています。
                </li>
              </ul>
              
              <p className="text-gray-600">
                私たちは継続的に技術を改善し、コミュニティからのフィードバックを取り入れています。
              </p>
            </div>

            {/* チームセクション */}
            <div className="bg-white rounded-lg shadow-sm p-8 mb-12">
              <h2 className="text-2xl font-bold mb-4">コミュニティ</h2>
              <p className="text-gray-600 mb-6">
                Second Meは世界中の開発者、研究者、AIエンスージアストのコミュニティによって支えられています。私たちのコミュニティは、オープンで包括的で、協力的な環境でイノベーションを促進することを目指しています。
              </p>
              
              <p className="text-gray-600 mb-6">
                あなたもコミュニティに参加して、コードを貢献したり、バグを報告したり、新機能を提案したり、ドキュメントを改善したりすることができます。
              </p>
              
              <div className="flex justify-center">
                <Link href="https://github.com/ZundamonnoVRChatkaisetu/Second-Me-Windows" target="_blank">
                  <Button variant="primary">
                    GitHubで参加する
                  </Button>
                </Link>
              </div>
            </div>

            {/* 始め方セクション */}
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">始めましょう</h2>
              <p className="text-gray-600 mb-6">
                Second Meを始めるのは簡単です。今すぐあなた自身のAI自己を作成しましょう。
              </p>
              
              <Link href="/create">
                <Button variant="primary" size="lg">
                  AIセルフを作成
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
