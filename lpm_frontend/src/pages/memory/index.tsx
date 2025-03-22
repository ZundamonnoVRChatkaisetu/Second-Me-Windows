import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { Button } from '../../components/ui/Button';
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
}

/**
 * メモリー一覧・管理ページ
 */
export default function MemoryPage() {
  const router = useRouter();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeProfile, setActiveProfile] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [categories, setCategories] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [memoryToDelete, setMemoryToDelete] = useState<string | null>(null);

  // メモリーとプロファイル情報の取得
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // アクティブなプロファイルの取得
        const profilesResponse = await axios.get('/api/profiles');
        const profiles = profilesResponse.data.profiles || [];
        const active = profiles.find((p: any) => p.active);
        
        if (!active) {
          setError('アクティブなプロファイルがありません。プロファイルを作成または選択してください。');
          setLoading(false);
          return;
        }
        
        setActiveProfile(active);
        
        // メモリーの取得
        const memoriesResponse = await axios.get('/api/memory');
        const memoriesList = memoriesResponse.data.memories || [];
        setMemories(memoriesList);
        
        // カテゴリーの抽出（ユニークな値のみ）
        const categorySet = new Set<string>();
        memoriesList.forEach((memory: Memory) => {
          if (memory.category) {
            categorySet.add(memory.category);
          }
        });
        setCategories(Array.from(categorySet));
        
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('データの取得に失敗しました。サーバーが起動していることを確認してください。');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // メモリーの削除
  const handleDeleteMemory = async () => {
    if (!memoryToDelete) return;
    
    try {
      await axios.post('/api/memory/delete', { memory_id: memoryToDelete });
      
      // 削除したメモリーを一覧から除外
      setMemories(prev => prev.filter(memory => memory.id !== memoryToDelete));
      
      // モーダルを閉じる
      setShowDeleteModal(false);
      setMemoryToDelete(null);
    } catch (err) {
      console.error('Failed to delete memory:', err);
      setError('メモリーの削除に失敗しました。');
    }
  };

  // 削除モーダルを表示
  const openDeleteModal = (memoryId: string) => {
    setMemoryToDelete(memoryId);
    setShowDeleteModal(true);
  };

  // フィルタリングと並べ替え
  const filteredAndSortedMemories = () => {
    // 検索クエリとカテゴリーでフィルタリング
    let filtered = memories.filter(memory => {
      const matchesSearch = searchQuery === '' || 
        memory.content.toLowerCase().includes(searchQuery.toLowerCase());
        
      const matchesCategory = selectedCategory === 'all' || 
        memory.category === selectedCategory;
        
      return matchesSearch && matchesCategory;
    });
    
    // 並べ替え
    filtered = [...filtered].sort((a, b) => {
      // 重要度で並べ替え
      if (sortBy === 'importance') {
        const importanceA = a.importance || 0;
        const importanceB = b.importance || 0;
        return sortOrder === 'asc' ? importanceA - importanceB : importanceB - importanceA;
      }
      
      // 日付で並べ替え
      const dateA = new Date(a[sortBy as keyof Memory] as string).getTime();
      const dateB = new Date(b[sortBy as keyof Memory] as string).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
    
    return filtered;
  };

  // 日付フォーマット
  const formatDate = (dateString: string) => {
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

  // 重要度表示
  const renderImportance = (importance?: number) => {
    if (!importance) return 'なし';
    
    const stars = '★'.repeat(importance) + '☆'.repeat(5 - importance);
    return (
      <span className="text-yellow-500">{stars}</span>
    );
  };

  // ソート順変更
  const toggleSortOrder = () => {
    setSortOrder(prevOrder => prevOrder === 'asc' ? 'desc' : 'asc');
  };

  // ページヘッダー
  const renderHeader = () => (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold">メモリー管理</h1>
          {activeProfile && (
            <p className="text-gray-500">
              プロファイル: {activeProfile.name}
            </p>
          )}
        </div>
        <Link href="/memory/add">
          <Button>
            + 新規メモリー追加
          </Button>
        </Link>
      </div>
      
      <p className="text-gray-600 mb-4">
        メモリーは第2の自分（AI）があなたを理解するための重要な情報です。
        個人的な思い出や知識、好みなどを記録することで、
        より適切な応答が得られるようになります。
      </p>
    </div>
  );

  // 検索・フィルターUI
  const renderSearchAndFilter = () => (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 検索ボックス */}
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            検索
          </label>
          <input
            type="text"
            id="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="メモリーを検索..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {/* カテゴリーフィルター */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            カテゴリー
          </label>
          <select
            id="category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">すべて</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
        
        {/* ソート */}
        <div>
          <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-1">
            並べ替え
          </label>
          <div className="flex space-x-2">
            <select
              id="sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="created_at">作成日時</option>
              <option value="updated_at">更新日時</option>
              <option value="importance">重要度</option>
            </select>
            <button
              onClick={toggleSortOrder}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none hover:bg-gray-50"
              title={sortOrder === 'asc' ? '昇順' : '降順'}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // メモリー一覧
  const renderMemoryList = () => {
    const memoriesToShow = filteredAndSortedMemories();
    
    if (memoriesToShow.length === 0) {
      return (
        <div className="bg-white rounded-xl shadow-sm p-6 text-center">
          <p className="text-gray-500">
            {searchQuery || selectedCategory !== 'all'
              ? '条件に一致するメモリーがありません。'
              : 'メモリーがまだありません。「新規メモリー追加」ボタンから追加してください。'}
          </p>
        </div>
      );
    }
    
    return (
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">内容</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">カテゴリー</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">重要度</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">作成日時</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">アクション</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {memoriesToShow.map((memory) => (
                <tr key={memory.id}>
                  <td className="px-6 py-4 whitespace-normal">
                    <div className="text-sm text-gray-900 line-clamp-2">{memory.content}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{memory.category || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">{renderImportance(memory.importance)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{formatDate(memory.created_at)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex space-x-2">
                      <Link href={`/memory/${memory.id}/edit`}>
                        <Button variant="outline" className="text-xs px-2 py-1">
                          編集
                        </Button>
                      </Link>
                      <Button
                        variant="destructive"
                        className="text-xs px-2 py-1"
                        onClick={() => openDeleteModal(memory.id)}
                      >
                        削除
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // プロファイルが選択されていない場合
  if (!loading && !activeProfile) {
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

  // エラー表示
  if (error) {
    return (
      <Layout>
        <div className="bg-gray-50 min-h-screen py-8">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm p-8">
              <div className="p-4 bg-red-50 text-red-700 rounded-md mb-4">
                <p>{error}</p>
              </div>
              <div className="flex justify-center">
                <Link href="/">
                  <Button variant="outline">
                    ホームに戻る
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
          <div className="max-w-5xl mx-auto">
            {/* ヘッダー */}
            {renderHeader()}
            
            {/* 検索・フィルター */}
            {renderSearchAndFilter()}
            
            {/* メモリー一覧 */}
            {loading ? (
              <div className="bg-white rounded-xl shadow-sm p-6 flex justify-center">
                <p className="text-gray-500">読み込み中...</p>
              </div>
            ) : (
              renderMemoryList()
            )}
            
            {/* 一括アップロードリンク */}
            <div className="mt-6 flex justify-between">
              <Link href="/memory/batch-upload">
                <Button variant="outline">
                  一括アップロード
                </Button>
              </Link>
              
              <Link href="/">
                <Button variant="outline">
                  ホームに戻る
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* 削除確認モーダル */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">メモリーの削除</h2>
            <p className="mb-6">
              本当にこのメモリーを削除しますか？この操作は元に戻せません。
            </p>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setMemoryToDelete(null);
                }}
              >
                キャンセル
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteMemory}
              >
                削除する
              </Button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
