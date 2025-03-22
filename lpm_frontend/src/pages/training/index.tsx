import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../../components/Layout';
import { getTrainingData, deleteTrainingData } from '../../lib/api-client';

// 型定義
interface TrainingData {
  id: string;
  name: string;
  path: string;
  category: string;
  size: number;
  created_at: string;
  modified_at: string;
  preview?: string;
}

const TrainingDataPage: React.FC = () => {
  const router = useRouter();
  const [trainingData, setTrainingData] = useState<TrainingData[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // データ読み込み
  const fetchTrainingData = async (category?: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getTrainingData(category);
      setTrainingData(response.training_data || []);
      setCategories(response.categories || []);
      setLoading(false);
    } catch (err) {
      console.error('トレーニングデータの取得に失敗しました', err);
      setError('トレーニングデータの取得に失敗しました。ネットワーク接続を確認してください。');
      setLoading(false);
    }
  };

  // 初期読み込み
  useEffect(() => {
    fetchTrainingData();
  }, []);

  // カテゴリ選択時の処理
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const category = e.target.value;
    setSelectedCategory(category);
    fetchTrainingData(category || undefined);
  };

  // データ削除の処理
  const handleDelete = async (data: TrainingData) => {
    if (window.confirm(`「${data.name}」を削除してもよろしいですか？`)) {
      try {
        await deleteTrainingData(data.id, data.path);
        // 削除後、リストを更新
        fetchTrainingData(selectedCategory || undefined);
      } catch (err) {
        console.error('削除に失敗しました', err);
        setError('データの削除に失敗しました');
      }
    }
  };

  // 検索フィルタ
  const filteredData = trainingData.filter((data) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      data.name.toLowerCase().includes(query) || 
      data.category.toLowerCase().includes(query) ||
      (data.preview && data.preview.toLowerCase().includes(query))
    );
  });

  // ファイルサイズのフォーマット
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <Layout>
      <Head>
        <title>トレーニングデータ管理 - Second Me</title>
      </Head>
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">トレーニングデータ管理</h1>
          <div className="flex space-x-2">
            <button
              onClick={() => router.push('/training/upload')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              アップロード
            </button>
            <button
              onClick={() => router.push('/training/process')}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
            >
              トレーニング実行
            </button>
            <button
              onClick={() => router.push('/training/history')}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
            >
              トレーニング履歴
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
            <p>{error}</p>
          </div>
        )}

        <div className="flex flex-col md:flex-row justify-between mb-4 gap-4">
          <div className="w-full md:w-1/3">
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              カテゴリでフィルタ
            </label>
            <select
              id="category"
              value={selectedCategory}
              onChange={handleCategoryChange}
              className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
            >
              <option value="">すべてのカテゴリ</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          
          <div className="w-full md:w-2/3">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              検索
            </label>
            <input
              type="text"
              id="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ファイル名やコンテンツで検索..."
              className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="bg-gray-100 p-10 text-center rounded-md">
            <p className="text-gray-500">
              {searchQuery
                ? '検索条件に一致するトレーニングデータがありません'
                : 'トレーニングデータがありません。「アップロード」ボタンからデータを追加してください。'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 border-b text-left">ファイル名</th>
                  <th className="px-4 py-2 border-b text-left">カテゴリ</th>
                  <th className="px-4 py-2 border-b text-left">サイズ</th>
                  <th className="px-4 py-2 border-b text-left">更新日時</th>
                  <th className="px-4 py-2 border-b text-left">プレビュー</th>
                  <th className="px-4 py-2 border-b text-left">アクション</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((data) => (
                  <tr key={data.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 border-b">{data.name}</td>
                    <td className="px-4 py-2 border-b">{data.category}</td>
                    <td className="px-4 py-2 border-b">{formatFileSize(data.size)}</td>
                    <td className="px-4 py-2 border-b">
                      {new Date(data.modified_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 border-b">
                      <div className="max-w-xs truncate">{data.preview || '-'}</div>
                    </td>
                    <td className="px-4 py-2 border-b">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => router.push(`/training/view?id=${data.id}&path=${encodeURIComponent(data.path)}`)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          表示
                        </button>
                        <button
                          onClick={() => handleDelete(data)}
                          className="text-red-600 hover:text-red-800"
                        >
                          削除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        <div className="mt-6">
          <p className="text-sm text-gray-500">
            トレーニングデータ数: {filteredData.length} 件
            {searchQuery && ` (検索結果)`}
            {selectedCategory && ` (カテゴリ: ${selectedCategory})`}
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default TrainingDataPage;
