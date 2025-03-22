import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { Button } from '../../components/ui/Button';
import Link from 'next/link';
import axios from 'axios';

/**
 * 新規メモリー追加ページ
 */
export default function AddMemoryPage() {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [importance, setImportance] = useState<number>(3); // デフォルト値は3（中程度）
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeProfile, setActiveProfile] = useState<any>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([
    '個人情報', '好み', '知識', '思い出', '仕事', '趣味', 'その他'
  ]);

  // アクティブなプロファイルを取得
  useEffect(() => {
    const fetchActiveProfile = async () => {
      try {
        const response = await axios.get('/api/profiles');
        const profiles = response.data.profiles || [];
        const active = profiles.find((p: any) => p.active);
        
        if (active) {
          setActiveProfile(active);
        } else {
          setError('アクティブなプロファイルがありません。プロファイルを作成または選択してください。');
        }
      } catch (err) {
        console.error('Failed to fetch active profile:', err);
        setError('プロファイル情報の取得に失敗しました。サーバーが起動していることを確認してください。');
      }
    };

    fetchActiveProfile();
  }, []);

  // メモリーの追加
  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      setError('メモリーの内容を入力してください');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // メモリー追加APIを呼び出し
      const response = await axios.post('/api/memory', {
        content: content.trim(),
        category: category || undefined,
        importance: importance,
        tags: tags.length > 0 ? tags : undefined
      });
      
      // 成功メッセージを表示
      setSuccessMessage('メモリーを追加しました');
      
      // フォームをリセット
      setContent('');
      setCategory('');
      setImportance(3);
      setTags([]);
      setTagInput('');
      
      // 3秒後に成功メッセージを非表示
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err: any) {
      console.error('Failed to add memory:', err);
      setError(`メモリーの追加に失敗しました: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // タグの追加
  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  // タグの削除
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // エンターキーでタグを追加
  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  // カテゴリーの追加
  const handleAddCategory = () => {
    const newCategory = prompt('新しいカテゴリーを入力してください');
    if (newCategory && !categories.includes(newCategory)) {
      setCategories([...categories, newCategory]);
      setCategory(newCategory);
    }
  };

  // プロファイルが選択されていない場合
  if (!activeProfile && !loading) {
    return (
      <Layout>
        <div className="bg-gray-50 min-h-screen py-8">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm p-8">
              <div className="p-4 bg-yellow-50 text-yellow-700 rounded-md mb-6">
                <p>アクティブなプロファイルがありません。プロファイルを作成または選択してください。</p>
              </div>
              <div className="flex justify-center">
                <Link href="/profiles">
                  <Button>
                    プロファイル管理へ
                  </Button>
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
              <div>
                <h1 className="text-2xl font-bold">新規メモリー追加</h1>
                {activeProfile && (
                  <p className="text-gray-500">
                    プロファイル: {activeProfile.name}
                  </p>
                )}
              </div>
              <Link href="/memory">
                <Button variant="outline">
                  メモリー一覧に戻る
                </Button>
              </Link>
            </div>
            
            {/* 説明文 */}
            <div className="mb-6 p-4 bg-blue-50 text-blue-800 rounded-md">
              <h2 className="font-medium text-lg mb-2">メモリーとは？</h2>
              <p className="mb-2">
                メモリーは第2の自分（AI）があなたを理解するための重要な情報です。
                個人的な思い出や知識、好みなどを記録することで、
                より適切な応答が得られるようになります。
              </p>
              <p>
                例: 「私はコーヒーが好きだが、夜は飲まない」「2023年に沖縄旅行をした」
                「仕事では○○の分野を担当している」など
              </p>
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

            <form onSubmit={handleAddMemory} className="space-y-6">
              {/* メモリー内容 */}
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                  メモリーの内容 <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="あなた自身やあなたの好み、経験、知識について記述してください"
                  required
                ></textarea>
              </div>

              {/* カテゴリー */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  カテゴリー
                </label>
                <div className="flex space-x-2">
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">カテゴリーを選択</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none hover:bg-gray-50"
                    title="新しいカテゴリーを追加"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* 重要度 */}
              <div>
                <label htmlFor="importance" className="block text-sm font-medium text-gray-700 mb-1">
                  重要度: {importance}
                </label>
                <input
                  type="range"
                  id="importance"
                  min="1"
                  max="5"
                  step="1"
                  value={importance}
                  onChange={(e) => setImportance(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>最低 (1)</span>
                  <span>中 (3)</span>
                  <span>最高 (5)</span>
                </div>
              </div>

              {/* タグ */}
              <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
                  タグ（複数可）
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    id="tags"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="タグを入力してEnterキーを押してください"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none hover:bg-gray-50"
                  >
                    追加
                  </button>
                </div>
                
                {/* タグリスト */}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full flex items-center"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 text-blue-500 hover:text-blue-700"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* アクションボタン */}
              <div className="flex justify-between">
                <Link href="/memory">
                  <Button variant="outline" type="button">
                    キャンセル
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={loading || !content.trim()}
                  className="px-6 py-2"
                >
                  {loading ? '追加中...' : 'メモリーを追加'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
