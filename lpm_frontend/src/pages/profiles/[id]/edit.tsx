import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import { Button } from '../../../components/ui/Button';
import Link from 'next/link';
import axios from 'axios';

interface Model {
  name: string;
  path: string;
  size: number;
  selected: boolean;
}

/**
 * プロファイル編集ページ
 */
export default function ProfileEditPage() {
  const router = useRouter();
  const { id } = router.query; // URLからプロファイルIDを取得
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedModelPath, setSelectedModelPath] = useState('');
  const [models, setModels] = useState<Model[]>([]);
  const [originalProfile, setOriginalProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // プロファイル情報とモデル一覧の取得
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // プロファイル情報の取得
        const profilesResponse = await axios.get('/api/profiles');
        const profileList = profilesResponse.data.profiles || [];
        const profile = profileList.find((p: any) => p.id === id);
        
        if (profile) {
          setOriginalProfile(profile);
          setName(profile.name || '');
          setDescription(profile.description || '');
          setSelectedModelPath(profile.model_path || '');
        } else {
          setError('プロファイルが見つかりません');
        }
        
        // モデル一覧の取得
        const modelsResponse = await axios.get('/api/models');
        setModels(modelsResponse.data.models || []);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // プロファイル更新処理
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id) return;
    if (!name.trim()) {
      setError('第2の自分の名前を入力してください');
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);
      
      // プロファイル更新APIを呼び出し
      await axios.post('/api/profiles/update', {
        profile_id: id,
        name: name.trim(),
        description: description.trim(),
        model_path: selectedModelPath
      });
      
      // 成功メッセージを表示
      setSuccessMessage('プロファイルを更新しました');
      
      // 現在のプロファイルがアクティブな場合、モデルも設定する
      if (originalProfile?.active && selectedModelPath) {
        try {
          await axios.post('/api/models/set', {
            model_path: selectedModelPath
          });
        } catch (modelErr) {
          console.error('Failed to set model:', modelErr);
          // モデル設定に失敗してもプロファイル更新は成功しているので、エラーとして扱わない
        }
      }
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      setError(`プロファイルの更新に失敗しました: ${err.response?.data?.error || err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // モデルサイズを適切な単位で表示する関数
  const formatSize = (gigabytes: number): string => {
    return `${gigabytes.toFixed(2)} GB`;
  };

  // ローディング表示
  if (loading) {
    return (
      <Layout>
        <div className="bg-gray-50 min-h-screen py-8">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm p-8">
              <div className="flex justify-center items-center h-64">
                <p className="text-gray-500">プロファイル情報を読み込み中...</p>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // エラー表示
  if (error && !originalProfile) {
    return (
      <Layout>
        <div className="bg-gray-50 min-h-screen py-8">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm p-8">
              <div className="p-4 bg-red-50 text-red-700 rounded-md mb-4">
                <p>{error}</p>
              </div>
              <div className="flex justify-center">
                <Link href="/profiles">
                  <Button variant="outline">プロファイル一覧に戻る</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm p-8">
            {/* ヘッダー */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">第2の自分を編集</h1>
              <Link href={`/profiles/${id}`}>
                <Button variant="outline">キャンセル</Button>
              </Link>
            </div>
            
            {/* 成功メッセージ */}
            {successMessage && (
              <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-md">
                <p>{successMessage}</p>
              </div>
            )}
            
            {/* エラーメッセージ */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md">
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              {/* プロファイル名 */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  第2の自分の名前 <span className="text-red-500">*</span>
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
                <p className="text-xs text-gray-500 mt-1">例：「仕事用アシスタント」「英語学習サポーター」「創作パートナー」など</p>
              </div>

              {/* 説明 */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  目的・特徴
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="この第2の自分の目的や特徴を書いてみましょう"
                ></textarea>
                <p className="text-xs text-gray-500 mt-1">
                  例：「ビジネス文書作成の支援」「プログラミング学習のガイド」「創作アイデアを広げるための対話相手」など
                </p>
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
                    <option value="">モデルを選択</option>
                    {models.map((model) => (
                      <option key={model.path} value={model.path}>
                        {model.name} ({formatSize(model.size)})
                      </option>
                    ))}
                  </select>
                )}
                <p className="text-xs text-gray-500 mt-1">この第2の自分の基盤となるAIモデルを選択します。より高性能なモデルほど表現力が豊かになります。</p>
              </div>

              {/* 送信ボタン */}
              <div className="flex justify-between">
                <Link href={`/profiles/${id}`}>
                  <Button variant="outline" type="button">
                    キャンセル
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={saving || !name.trim()}
                  className="px-6 py-2"
                >
                  {saving ? '保存中...' : '変更を保存'}
                </Button>
              </div>
            </form>
            
            {/* ヒント */}
            <div className="mt-8 p-4 bg-blue-50 text-blue-800 rounded-md">
              <h3 className="font-medium mb-2">ヒント</h3>
              <p className="text-sm">
                第2の自分の名前や説明を変更しても、これまでの対話履歴やメモリーなどのデータは保持されます。
                モデルを変更した場合は、第2の自分の応答スタイルや知識が変わる可能性があります。
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
