import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import ChatInterface from '../components/ChatInterface';
import ProfileSwitcher from '../components/ProfileSwitcher';
import axios from 'axios';
import { formatUptime } from '../lib/utils';
import { useAppContext } from '../lib/AppContext';

/**
 * チャットページ
 * Second Meとのチャット専用ページ
 */
export default function ChatPage() {
  const { profiles } = useAppContext();
  const [status, setStatus] = useState<{
    status: string;
    uptime: number;
    version: string;
  } | null>(null);
  
  const [backendInfo, setBackendInfo] = useState<any>(null);

  // バックエンドのヘルスチェック
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await axios.get('/health');
        setStatus(response.data);
      } catch (error) {
        console.error('Health check failed:', error);
        setStatus(null);
      }
    };

    // バックエンド情報を取得
    const getBackendInfo = async () => {
      try {
        const response = await axios.get('/api/info');
        setBackendInfo(response.data);
      } catch (error) {
        console.error('Failed to get backend info:', error);
      }
    };

    checkHealth();
    getBackendInfo();
    
    const interval = setInterval(checkHealth, 30000); // 30秒ごとに確認
    return () => clearInterval(interval);
  }, []);
  
  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row gap-6">
              {/* 左側のサイドバー */}
              <div className="w-full md:w-1/4">
                {/* プロファイル選択セクション */}
                <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <h2 className="text-lg font-medium">プロファイル</h2>
                  </div>
                  
                  {/* アクティブなプロファイル情報 */}
                  <div className="mb-3">
                    <div className="text-sm text-gray-500 mb-1">現在使用中:</div>
                    <div className="font-medium">
                      {profiles.active ? (
                        <div className="flex items-center">
                          <span className="mr-2">👤</span>
                          {profiles.active.name}
                        </div>
                      ) : (
                        <div className="text-yellow-600">選択されていません</div>
                      )}
                    </div>
                  </div>
                  
                  {/* プロファイル切り替えコンポーネント */}
                  <ProfileSwitcher />
                </div>
                
                <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                  <h2 className="text-lg font-medium mb-3">ステータス</h2>
                  
                  {status ? (
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                        <span className="text-sm text-gray-600">接続済み</span>
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        <div>バージョン: v{status.version}</div>
                        <div>稼働時間: {formatUptime(status.uptime)}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <div className="h-3 w-3 rounded-full bg-red-500 mr-2"></div>
                      <span className="text-sm text-gray-600">未接続</span>
                    </div>
                  )}
                </div>
                
                <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                  <h2 className="text-lg font-medium mb-3">システム情報</h2>
                  
                  {backendInfo ? (
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>OS: {backendInfo.environment?.os || 'N/A'}</div>
                      <div>Python: {backendInfo.environment?.python_version?.split(' ')[0] || 'N/A'}</div>
                      <div>ポート: {backendInfo.environment?.port || 'N/A'}</div>
                      <div>モデル: {backendInfo.model?.loaded ? '読み込み済み' : '未読み込み'}</div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600">
                      情報を取得できません
                    </div>
                  )}
                </div>
                
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <h2 className="text-lg font-medium mb-3">ヘルプ</h2>
                  
                  <div className="text-sm text-gray-600 space-y-3">
                    <p>
                      Second Meはあなたの質問に答えたり、会話をしたりすることができます。
                    </p>
                    
                    <div>
                      <strong>使い方のヒント:</strong>
                      <ul className="list-disc pl-5 mt-1 space-y-1">
                        <li>明確で具体的な質問をする</li>
                        <li>複雑な話題は分割して質問する</li>
                        <li>フィードバックを提供して学習を助ける</li>
                        <li>会話の流れを自然に保つ</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* チャットエリア */}
              <div className="w-full md:w-3/4">
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold">Second Me チャット</h1>
                    <div className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                      {profiles.active ? `${profiles.active.name}と会話中` : '選択されていません'}
                    </div>
                  </div>
                  <ChatInterface className="h-[600px]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
