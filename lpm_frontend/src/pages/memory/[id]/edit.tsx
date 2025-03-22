import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import { Button } from '../../../components/ui/Button';
import Link from 'next/link';
import axios from 'axios';

interface Memory {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  profile_id: string;
  category?: string;
  importance?: number;
  tags?: string[];
}

/**
 * メモリー編集ページ
 */
export default function EditMemoryPage() {
  const router = useRouter();
  const { id } = router.query; // URLからメモリーIDを取得
  
  const [memory, setMemory] = useState<Memory | null>(null);
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [importance, setImportance] = useState<number>(3);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([
    '個人情報', '好み', '知識', '思い出', '仕事', '趣味', 'その他'
  ]);

  // メモリー情報の取得
  useEffect(() => {
    const fetchMemory = async () => {
      if (!id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // メモリー一覧を取得して、IDに一致するものを探す
        const response = await axios.get('/api/memory');
        const memories = response.data.memories || [];
        const targetMemory = memories.find((m: Memory) => m.id === id);
        
        if (targetMemory) {
          setMemory(targetMemory);
          setContent(targetMemory.content || '');
          setCategory(targetMemory.category || '');
          setImportance(targetMemory.importance || 3);
          setTags(targetMemory.tags || []);
          
          // カテゴリーが既存のリストにない場合は追加
          if (targetMemory.category && !categories.includes(targetMemory.category)) {
            setCategories(prev => [...prev, targetMemory.category!]);
          }
        } else {
          setError('指定されたメモリーが見つかりません');
        }
      } catch (err) {
        console.error('Failed to fetch memory:', err);
        setError('メモリー情報の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchMemory();
  }, [id]);

  // メモリーの更新
  const handleUpdateMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id) return;
    if (!content.trim()) {
      setError('メモリーの内容を入力してください');
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);
      
      // メモリー更新APIを呼び出し（この例では、削除して再作成する方法を使用）
      // 実際のAPIでは、updateエンドポイントを使用することが望ましい
      await axios.post('/api/memory/delete', { memory_id: id });
      
      // 新しいメモリーを作成
      await axios.post('/api/memory', {
        content: content.trim(),
        category: category || undefined,
        importance: importance,
        tags: tags.length > 0 ? tags : undefined
      });
      
      // 成功メッセージを表示
      setSuccessMessage('メモリーを更新しました');
      
      // 3秒後にメモリー一覧に戻る
      setTimeout(() => {
        router.push('/memory');
      }, 3000);
    } catch (err: any) {
      console.error('Failed to update memory:', err);
      setError(`メモリーの更新に失敗しました: ${err.response?.data?.error || err.message}`);
    } finally {
      setSaving(false);
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

  // 作成日時のフォーマット
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };

  // ローディング表示
  if (loading) {
    return (
      <Layout>
        <div className="bg-gray-50 min-h-screen py-8">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm p-8">
              <div className="flex justify-center items-center h-64">
                <p className="text-gray-500">メモリー情報を読み込み中...</p>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // エラー表示
  if (error && !memory) {
    return (
      <Layout>
        <div className="bg-gray-50 min-h-screen py-8">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm p-8">
              <div className="p-4 bg-red-50 text-red-700 rounded-md mb-4">
                <p>{error}</p>
              </div>
              <div className="flex justify-center">
                <Link href="/memory">
                  <Button variant="outline">
                    メモリー一覧に戻る
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
                <h1 className="text-2xl font-bold">メモリー編集</h1>
                {memory && (
                  <p className="text-gray-500 text-sm">
                    作成日時: {formatDate(memory.created_at)}
                  </p>
                )}
              </div>
              <Link href="/memory">
                <Button variant="outline">
                  メモリー一覧に戻る
                </Button>
              </Link>
            </div>
            
            {/* 成功メッセージ */}
            {successMessage && (
              <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-md">
                <p>{successMessage}</p>
                <p className="text-sm mt-2">数秒後にメモリー一覧ページに戻ります...</p>
              </div>
            )}
            
            {/* エラーメッセージ */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md">
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleUpdateMemory} className="space-y-6">
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
                  disabled={saving || !content.trim()}
                  className="px-6 py-2"
                >
                  {saving ? '保存中...' : '変更を保存'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
