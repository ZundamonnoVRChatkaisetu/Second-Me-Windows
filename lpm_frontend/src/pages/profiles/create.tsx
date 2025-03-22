import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { Button } from '../../components/ui/Button';
import Link from 'next/link';
import axios from 'axios';

interface Model {
  name: string;
  path: string;
  size: number;
  selected: boolean;
}

export default function CreateProfilePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedModelPath, setSelectedModelPath] = useState('');
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // モデル一覧を取得
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await axios.get('/api/models');
        setModels(response.data.models || []);
        
        // デフォルトでモデルが存在すれば最初のものを選択
        if (response.data.models && response.data.models.length > 0) {
          setSelectedModelPath(response.data.models[0].path);
        }
      } catch (err) {
        console.error('Failed to fetch models:', err);
        setError('モデル一覧の取得に失敗しました。サーバーの状態を確認してください。');
      }
    };

    fetchModels();
  }, []);

  // プロファイル作成
  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('プロファイル名を入力してください');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post('/api/profiles/create', {
        name: name.trim(),
        description: description.trim(),
        model_path: selectedModelPath
      });
      
      // 成功したら、プロファイル一覧ページにリダイレクト
      router.push('/profiles');
    } catch (err: any) {
      console.error('Failed to create profile:', err);
      setError(`プロファイルの作成に失敗しました: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // モデルサイズを適切な単位で表示する関数
  const formatSize = (gigabytes: number): string => {
    return `${gigabytes.toFixed(2)} GB`;
  };

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm p-8">
            {/* ヘッダー */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">新しい第2の自分を作成</h1>
              <Link href="/profiles" passHref>
                <Button variant="outline">キャンセル</Button>
              </Link>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md">
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleCreateProfile} className="space-y-6">
              {/* プロファイル名 */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  プロファイル名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="あなたの第2の自分の名前"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">例：「仕事用アシスタント」「英語学習サポーター」など</p>
              </div>

              {/* 説明 */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  説明
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="このプロファイルの説明や用途など"
                ></textarea>
              </div>

              {/* ベースモデル選択 */}
              <div>
                <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">
                  ベースモデル
                </label>
                {models.length === 0 ? (
                  <div className="p-3 bg-yellow-50 text-yellow-700 rounded-md">
                    <p>利用可能なモデルがありません。<Link href="/settings" className="text-blue-600 underline">設定ページ</Link>でモデルを選択または追加してください。</p>
                  </div>
                ) : (
                  <select
                    id="model"
                    value={selectedModelPath}
                    onChange={(e) => setSelectedModelPath(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {models.map((model) => (
                      <option key={model.path} value={model.path}>
                        {model.name} ({formatSize(model.size)})
                      </option>
                    ))}
                  </select>
                )}
                <p className="text-xs text-gray-500 mt-1">このプロファイルで使用するベースモデルを選択します</p>
              </div>

              {/* 送信ボタン */}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={loading || !name.trim() || models.length === 0}
                  className="px-6 py-2"
                >
                  {loading ? '作成中...' : '作成する'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
