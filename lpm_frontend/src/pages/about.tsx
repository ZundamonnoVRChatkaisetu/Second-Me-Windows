import React from 'react';
import Layout from '../components/Layout';
import { Button } from '../components/ui/Button';
import Link from 'next/link';

/**
 * 概要ページ
 * Second Meプロジェクトの詳細情報を提供
 */
export default function AboutPage() {
  return (
    <Layout>
      <div className="bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-6 text-center">Second Meについて</h1>
            
            <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
              <h2 className="text-2xl font-bold mb-4">私たちのビジョン</h2>
              <p className="text-lg mb-6">
                Second Meは、あなた自身のAI自己（AI self）を作成するためのオープンソースプロトコルです。
                私たちのビジョンは、個人のデジタルアイデンティティの未来を再定義し、
                あなたの情報とインテリジェンスが完全にプライベートで、あなた自身の制御下にあることを保証することです。
              </p>
              
              <div className="bg-blue-50 p-6 rounded-lg mb-6">
                <h3 className="text-xl font-semibold mb-2">プライバシーファースト</h3>
                <p>
                  従来の集中型AIシステムとは異なり、Second Meはあなたの情報がローカルに保存され、
                  100%プライベートであることを保証します。あなたのデータはあなただけのものです。
                </p>
              </div>
              
              <div className="bg-purple-50 p-6 rounded-lg mb-6">
                <h3 className="text-xl font-semibold mb-2">オープンソースの取り組み</h3>
                <p>
                  Second Meは完全にオープンソースであり、透明性と協力を重視しています。
                  私たちは、コミュニティの貢献によってプロジェクトが成長し、改善されることを信じています。
                </p>
              </div>
              
              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-2">ユーザー中心のデザイン</h3>
                <p>
                  私たちのプロトコルは、技術的な専門知識に関係なく、誰もが自分自身のAI自己を作成できるように
                  設計されています。使いやすさとアクセシビリティは、私たちの最優先事項です。
                </p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
              <h2 className="text-2xl font-bold mb-4">主な機能</h2>
              
              <div className="space-y-6">
                <div className="flex">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-1">AIネイティブメモリ</h3>
                    <p>
                      Second Meは、あなたの思い出、ドキュメント、その他のコンテンツを使用して、
                      あなた自身のAI自己のトレーニングを開始します。階層的メモリモデリング（HMM）と
                      Me-Alignmentアルゴリズムを使用して、あなたのアイデンティティを捉えます。
                    </p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-1">グローバルネットワーク</h3>
                    <p>
                      あなたのAI自己を分散型ネットワークに起動し、あなたの許可を得た人々や
                      アプリケーションが接続してあなたのデジタルアイデンティティとしてコンテキストを共有できます。
                    </p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-1">ロールプレイとAIスペース</h3>
                    <p>
                      あなたのAI自己は、さまざまなシナリオであなたを表現するために異なるペルソナに
                      切り替えることができます。また、他のSecond Meと協力してアイデアを生み出したり、
                      問題を解決したりできます。
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
              <h2 className="text-2xl font-bold mb-4">技術スタック</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded p-4">
                  <h3 className="font-semibold mb-2">フロントエンド</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Next.js</li>
                    <li>React</li>
                    <li>Tailwind CSS</li>
                    <li>TypeScript</li>
                  </ul>
                </div>
                
                <div className="border rounded p-4">
                  <h3 className="font-semibold mb-2">バックエンド</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Python</li>
                    <li>Flask</li>
                    <li>SQLite</li>
                    <li>llama.cpp</li>
                  </ul>
                </div>
                
                <div className="border rounded p-4">
                  <h3 className="font-semibold mb-2">AI & モデル</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Qwen2.5シリーズ</li>
                    <li>階層的メモリモデリング（HMM）</li>
                    <li>Me-Alignmentアルゴリズム</li>
                  </ul>
                </div>
                
                <div className="border rounded p-4">
                  <h3 className="font-semibold mb-2">デプロイメント</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Windows互換</li>
                    <li>ローカルデプロイメント</li>
                    <li>コンテナ化（予定）</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-lg mb-6">
                興味を持ちましたか？今すぐSecond Meを使ってあなた自身のAI自己を作成しましょう。
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link href="/create">
                  <Button 
                    variant="primary" 
                    size="lg" 
                    className="w-full sm:w-auto"
                  >
                    第二の自分を作る
                  </Button>
                </Link>
                
                <Link href="https://github.com/ZundamonnoVRChatkaisetu/Second-Me-Windows" target="_blank">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="w-full sm:w-auto"
                  >
                    GitHubで見る
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
