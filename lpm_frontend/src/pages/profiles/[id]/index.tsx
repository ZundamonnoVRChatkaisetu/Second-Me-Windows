import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import { Button } from '../../../components/ui/Button';
import Link from 'next/link';
import axios from 'axios';

/**
 * プロファイル詳細ページ
 */
export default function ProfileDetailPage() {
  const router = useRouter();
  const { id } = router.query; // URLからプロファイルIDを取得
  
  const [profile, setProfile] = useState<any>(null);
  const [memories, setMemories] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // プロファイル情報の取得
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        // プロファイル一覧を取得して、IDに一致するものを探す
        const response = await axios.get('/api/profiles');
        const profileList = response.data.profiles || [];
        const currentProfile = profileList.find((p: any) => p.id === id);
        
        if (currentProfile) {
          setProfile(currentProfile);
          setIsActive(currentProfile.active);
          
          // プロファイルのメモリーを取得（アクティブなプロファイルにする必要がある）
          if (currentProfile.active) {
            try {
              const memoriesResponse = await axios.get('/api/memory');
              setMemories(memoriesResponse.data.memories || []);
            } catch (memError) {
              console.error('Failed to fetch memories:', memError);
            }
          }
          
          // プロファイルのファイルを取得
          try {
            const filesResponse = await axios.get(`/api/files?profile_id=${id}`);
            setFiles(filesResponse.data.files || []);
          } catch (filesError) {
            console.error('Failed to fetch files:', filesError);
          }
        } else {
          setError('プロファイルが見つかりません');
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        setError('プロファイル情報の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [id]);

  // プロファイルをアクティブにする
  const handleActivateProfile = async () => {
    if (!id) return;
    
    try {
      await axios.post('/api/profiles/activate', {
        profile_id: id
      });
      setIsActive(true);
      // メモリーを再取得
      try {
        const memoriesResponse = await axios.get('/api/memory');
        setMemories(memoriesResponse.data.memories || []);
      } catch (memError) {
        console.error('Failed to fetch memories after activation:', memError);
      }
    } catch (err) {
      console.error('Failed to activate profile:', err);
      setError('プロファイルのアクティブ化に失敗しました');
    }
  };

  // プロファイルを削除する
  const handleDeleteProfile = async () => {
    if (!id) return;
    
    try {
      await axios.post('/api/profiles/delete', {
        profile_id: id
      });
      // 削除成功後、プロファイル一覧ページにリダイレクト
      router.push('/profiles');
    } catch (err: any) {
      console.error('Failed to delete profile:', err);
      setError(`プロファイルの削除に失敗しました: ${err.response?.data?.error || err.message}`);
      setShowDeleteModal(false);
    }
  };

  // 日付フォーマット
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateStr;
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
                <p className="text-gray-500">プロファイル情報を読み込み中...</p>
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

  // プロファイルが見つからない場合
  if (!profile) {
    return (
      <Layout>
        <div className="bg-gray-50 min-h-screen py-8">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm p-8">
              <div className="p-4 bg-yellow-50 text-yellow-700 rounded-md mb-4">
                <p>プロファイルが見つかりませんでした。</p>
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
          <div className="max-w-3xl mx-auto">
            {/* ヘッダー部分 */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h1 className="text-2xl font-bold">{profile.name}</h1>
                  <p className="text-gray-500 text-sm">ID: {profile.id}</p>
                </div>
                <div className="flex space-x-2">
                  <Link href={`/profiles/${id}/edit`}>
                    <Button variant="outline">
                      編集
                    </Button>
                  </Link>
                  <Button
                    variant="destructive"
                    onClick={() => setShowDeleteModal(true)}
                    disabled={isActive}
                  >
                    削除
                  </Button>
                  {!isActive && (
                    <Button
                      variant="primary"
                      onClick={handleActivateProfile}
                    >
                      アクティブにする
                    </Button>
                  )}
                </div>
              </div>
              
              {/* ステータスバッジ */}
              <div className="mb-4">
                {isActive && (
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    アクティブ
                  </span>
                )}
              </div>
              
              {/* 詳細情報 */}
              <div className="border-t pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h2 className="text-sm font-medium text-gray-500">説明</h2>
                    <p className="mt-1">{profile.description || '説明なし'}</p>
                  </div>
                  <div>
                    <h2 className="text-sm font-medium text-gray-500">モデル</h2>
                    <p className="mt-1 break-all">{profile.model_path || '選択なし'}</p>
                  </div>
                  <div>
                    <h2 className="text-sm font-medium text-gray-500">作成日時</h2>
                    <p className="mt-1">{formatDate(profile.created_at)}</p>
                  </div>
                  <div>
                    <h2 className="text-sm font-medium text-gray-500">最終更新日時</h2>
                    <p className="mt-1">{formatDate(profile.updated_at)}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* メモリーセクション */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">メモリー</h2>
                <Link href={isActive ? '/memory/add' : '#'}>
                  <Button variant="outline" disabled={!isActive}>
                    メモリーを追加
                  </Button>
                </Link>
              </div>
              
              {!isActive && (
                <div className="p-4 bg-yellow-50 text-yellow-700 rounded-md mb-4">
                  <p>メモリーを管理するには、このプロファイルをアクティブにしてください。</p>
                </div>
              )}
              
              {isActive && memories.length === 0 && (
                <div className="p-4 bg-gray-50 text-gray-500 rounded-md">
                  <p>このプロファイルにはまだメモリーがありません。</p>
                </div>
              )}
              
              {memories.length > 0 && (
                <div className="border rounded-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">内容</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">作成日時</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {memories.map((memory) => (
                        <tr key={memory.id}>
                          <td className="px-6 py-4 whitespace-normal">
                            <div className="text-sm text-gray-900 line-clamp-2">{memory.content}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{formatDate(memory.created_at)}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            {/* トレーニングデータセクション */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">トレーニングデータ</h2>
                <Link href={isActive ? '/upload?category=training' : '#'}>
                  <Button variant="outline" disabled={!isActive}>
                    ファイルをアップロード
                  </Button>
                </Link>
              </div>
              
              {files.length === 0 && (
                <div className="p-4 bg-gray-50 text-gray-500 rounded-md">
                  <p>このプロファイルにはまだトレーニングデータがありません。</p>
                </div>
              )}
              
              {files.length > 0 && (
                <div className="border rounded-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ファイル名</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">サイズ</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">アップロード日時</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {files.map((file) => (
                        <tr key={file.path}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{file.filename}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{Math.round(file.size / 1024)} KB</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{formatDate(file.uploaded_at)}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            {/* アクション */}
            <div className="flex justify-between">
              <Link href="/profiles">
                <Button variant="outline">
                  プロファイル一覧に戻る
                </Button>
              </Link>
              
              <Link href="/chat">
                <Button variant="primary" disabled={!isActive}>
                  チャットを開始
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
            <h2 className="text-xl font-bold mb-4">プロファイルの削除</h2>
            <p className="mb-6">
              本当に「{profile.name}」を削除しますか？この操作は元に戻せません。
            </p>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
              >
                キャンセル
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteProfile}
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
