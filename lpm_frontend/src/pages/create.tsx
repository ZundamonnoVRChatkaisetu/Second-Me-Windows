import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';

/**
 * 第2の自分を作るページ
 * プロファイル作成ページにリダイレクト
 */
export default function CreatePage() {
  const router = useRouter();

  // コンポーネントのマウント時に/profiles/createにリダイレクト
  useEffect(() => {
    router.push('/profiles/create');
  }, [router]);

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">リダイレクト中...</h1>
            <p className="text-gray-600">
              第2の自分の作成ページに移動しています。自動的にリダイレクトされない場合は、
              <a href="/profiles/create" className="text-blue-600 hover:text-blue-800 underline">こちらをクリック</a>
              してください。
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
