import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { fetchTrainingData } from '../../lib/api-client';
import Link from 'next/link';

// トレーニングデータ型定義
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

// トレーニングデータページコンポーネント
const TrainingDataPage: React.FC = () => {
  const router = useRouter();
  const [trainingData, setTrainingData] = useState<TrainingData[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // トレーニングデータの取得
  useEffect(() => {
    const loadTrainingData = async () => {
      try {
        setLoading(true);
        const response = await fetchTrainingData(selectedCategory);
        
        if (response.training_data) {
          setTrainingData(response.training_data);
          setCategories(response.categories || []);
        } else {
          setError('トレーニングデータを取得できませんでした');
        }
      } catch (err) {
        console.error('トレーニングデータの取得エラー:', err);
        setError('トレーニングデータの読み込み中にエラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    loadTrainingData();
  }, [selectedCategory]);

  // カテゴリ変更ハンドラ
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
  };

  // 検索語変更ハンドラ
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // トレーニングデータのフィルタリング
  const filteredData = trainingData.filter(item => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      item.name.toLowerCase().includes(searchLower) ||
      item.category.toLowerCase().includes(searchLower) ||
      (item.preview && item.preview.toLowerCase().includes(searchLower))
    );
  });

  // ファイルサイズのフォーマット
  const formatFileSize = (size: number) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  // 日付のフォーマット
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (e) {
      return dateString;
    }
  };

  // トレーニングデータの削除確認
  const confirmDelete = (data: TrainingData) => {
    if (window.confirm(`「${data.name}」を削除してもよろしいですか？`)) {
      handleDelete(data);
    }
  };

  // トレーニングデータの削除処理
  const handleDelete = async (data: TrainingData) => {
    try {
      const response = await fetch(`/api/training/data/${data.id}?path=${encodeURIComponent(data.path)}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // 成功したら一覧を更新
        setTrainingData(prev => prev.filter(item => item.id !== data.id));
        alert('トレーニングデータを削除しました');
      } else {
        const errorData = await response.json();
        setError(errorData.error || '削除中にエラーが発生しました');
      }
    } catch (err) {
      console.error('削除エラー:', err);
      setError('削除中にエラーが発生しました');
    }
  };

  return (
    <Layout title="トレーニングデータ管理">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">トレーニングデータ管理</h1>
          <div className="flex space-x-4">
            <Link href="/training/upload" className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded">
              アップロード
            </Link>
            <Link href="/training/process" className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded">
              トレーニング実行
            </Link>
            <Link href="/training/history" className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded">
              履歴
            </Link>
          </div>
        </div>

        <div className="mb-6 flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
          <div className="flex-1">
            <input
              type="text"
              placeholder="検索..."
              className="w-full p-2 border border-gray-300 rounded"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
          <div className="w-full md:w-64">
            <select
              className="w-full p-2 border border-gray-300 rounded"
              value={selectedCategory}
              onChange={handleCategoryChange}
            >
              <option value="">すべてのカテゴリ</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto"></div>
            <p className="mt-4">データを読み込んでいます...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="bg-gray-100 p-8 rounded-lg text-center">
            <p className="text-gray-600">
              {searchTerm 
                ? '検索条件に一致するトレーニングデータが見つかりません' 
                : 'トレーニングデータがありません'
              }
            </p>
            <Link href="/training/upload" className="mt-4 inline-block bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded">
              トレーニングデータをアップロード
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-2 px-4 border-b border-gray-200 text-left">ファイル名</th>
                  <th className="py-2 px-4 border-b border-gray-200 text-left">カテゴリ</th>
                  <th className="py-2 px-4 border-b border-gray-200 text-left">サイズ</th>
                  <th className="py-2 px-4 border-b border-gray-200 text-left">更新日時</th>
                  <th className="py-2 px-4 border-b border-gray-200 text-left">プレビュー</th>
                  <th className="py-2 px-4 border-b border-gray-200 text-left">アクション</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((data) => (
                  <tr key={data.id} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b border-gray-200">
                      <span className="font-medium">{data.name}</span>
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200">
                      <span className="inline-block bg-blue-100 text-blue-800 py-1 px-2 rounded-full text-xs">
                        {data.category}
                      </span>
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200">
                      {formatFileSize(data.size)}
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200">
                      {formatDate(data.modified_at)}
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200">
                      <div className="text-xs text-gray-600 truncate max-w-xs">
                        {data.preview || 'プレビューなし'}
                      </div>
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => router.push(`/training/data/${data.id}?path=${encodeURIComponent(data.path)}`)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          表示
                        </button>
                        <button
                          onClick={() => confirmDelete(data)}
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
      </div>
    </Layout>
  );
};

export default TrainingDataPage;
