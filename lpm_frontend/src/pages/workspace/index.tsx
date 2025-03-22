import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import WorkSpaceExplorer from '../../components/WorkSpaceExplorer';
import { Button } from '../../components/ui/Button';
import Link from 'next/link';
import axios from 'axios';

export default function WorkSpacePage() {
  const [activeProfile, setActiveProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // アクティブなプロファイル情報を取得
  useEffect(() => {
    const fetchProfileInfo = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // システム情報エンドポイントから情報を取得
        const infoResponse = await axios.get('/api/info');
        const info = infoResponse.data;
        
        // WorkSpace機能が有効かチェック
        if (!info.workspace?.enabled) {
          setError('WorkSpace機能は現在使用できません。');
          setLoading(false);
          return;
        }
        
        // アクティブなプロファイル情報を取得
        if (!info.profile?.active) {
          setError('アクティブなプロファイルがありません。プロファイルを作成または選択してください。');
          setLoading(false);
          return;
        }
        
        // プロファイルの詳細情報を取得
        const profilesResponse = await axios.get('/api/profiles');
        const activeProfile = profilesResponse.data.profiles.find(
          (p: any) => p.active
        );
        
        if (!activeProfile) {
          setError('アクティブなプロファイル情報を取得できませんでした。');
          setLoading(false);
          return;
        }
        
        setActiveProfile(activeProfile);
      } catch (err) {
        console.error('Failed to fetch profile info:', err);
        setError('プロファイル情報の取得に失敗しました。');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileInfo();
  }, []);

  // プロファイルが選択されていない場合
  if (!loading && !activeProfile) {
    return (
      <Layout>
        <div className="bg-gray-50 min-h-screen py-8">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm p-8">
              <div className="p-4 bg-yellow-50 text-yellow-700 rounded-md mb-6">
                <p>{error || 'アクティブなプロファイルがありません。プロファイルを作成または選択してください。'}</p>
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
          <div className="max-w-6xl mx-auto">
            {/* ヘッダー */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h1 className="text-2xl font-bold">WorkSpace エクスプローラー</h1>
                  {activeProfile && (
                    <p className="text-gray-500">
                      プロファイル: {activeProfile.name}
                    </p>
                  )}
                </div>
                <Link href="/">
                  <Button variant="outline">
                    ホームに戻る
                  </Button>
                </Link>
              </div>
              
              <p className="text-gray-600 mb-4">
                WorkSpaceはプロファイルごとに独立した作業領域です。
                第2の自分がアクセスできるファイルやデータを管理できます。
                プロファイルごとに別々のWorkSpaceがあるため、データが混ざることはありません。
              </p>
            </div>
            
            {/* エラー表示 */}
            {error && (
              <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
                <p>{error}</p>
              </div>
            )}
            
            {/* 読み込み中表示 */}
            {loading ? (
              <div className="bg-white rounded-xl shadow-sm p-6 flex justify-center">
                <p className="text-gray-500">読み込み中...</p>
              </div>
            ) : (
              // WorkSpaceエクスプローラーコンポーネント
              <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
                <div className="h-[70vh]">
                  <WorkSpaceExplorer />
                </div>
              </div>
            )}
            
            {/* 使い方ガイド */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">WorkSpaceの使い方</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">基本操作</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• ファイルやフォルダの作成・編集・削除ができます</li>
                    <li>• フォルダをクリックして中に入ることができます</li>
                    <li>• 「上の階層へ」をクリックして親フォルダに戻れます</li>
                    <li>• ファイルをクリックすると内容が表示されます</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">AIとの連携</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• WorkSpace内のファイルはAIが参照できます</li>
                    <li>• チャット中に「ファイル○○を開いて」と指示できます</li>
                    <li>• AIにファイルの作成・編集を依頼できます</li>
                    <li>• 別のプロファイルのファイルには互いにアクセスできません</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
