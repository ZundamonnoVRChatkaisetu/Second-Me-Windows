import React from 'react';
import Layout from '../../components/Layout';
import ProfileSelector from '../../components/ProfileSelector';
import { Button } from '../../components/ui/Button';
import Link from 'next/link';

export default function ProfilesPage() {
  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            {/* ヘッダー */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold">第2の自分の管理</h1>
                  <p className="text-gray-600 mt-2">
                    複数の第2の自分（プロファイル）を作成・管理することで、異なる目的や特性を持つAI自己を使い分けられます。
                  </p>
                </div>
                <Link href="/profiles/create" passHref>
                  <Button className="whitespace-nowrap">
                    + 新規作成
                  </Button>
                </Link>
              </div>
            </div>

            {/* プロファイルセレクター */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="border-b border-gray-200 p-4 bg-gray-50">
                <h2 className="font-medium">プロファイル一覧</h2>
              </div>
              <ProfileSelector />
            </div>

            {/* 使い方ガイド */}
            <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
              <h2 className="text-lg font-medium mb-4">プロファイルの使い方</h2>
              
              <div className="space-y-4 text-gray-700">
                <div>
                  <h3 className="font-medium">プロファイルとは？</h3>
                  <p>プロファイルは、異なる目的や特性を持つ「第2の自分」を作成・管理するための仕組みです。それぞれのプロファイルは独自のモデル、記憶、トレーニングデータを持ちます。</p>
                </div>
                
                <div>
                  <h3 className="font-medium">使用例</h3>
                  <ul className="list-disc ml-5 space-y-1">
                    <li>仕事用の専門的な知識を持つプロファイル</li>
                    <li>特定の趣味や興味に特化したプロファイル</li>
                    <li>異なる言語を話すプロファイル</li>
                    <li>創作活動やブレインストーミングに最適化されたプロファイル</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium">始め方</h3>
                  <p>「新規作成」ボタンをクリックして、プロファイル名と説明を入力し、ベースとなるモデルを選択するだけで新しいプロファイルが作成できます。</p>
                </div>
                
                <div>
                  <h3 className="font-medium">プロファイルの切り替え</h3>
                  <p>使いたいプロファイルの「使用する」ボタンをクリックすると、そのプロファイルがアクティブになり、チャットや設定がそのプロファイルに切り替わります。</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
