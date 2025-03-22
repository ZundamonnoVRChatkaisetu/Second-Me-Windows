import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Button } from '../components/ui/Button';
import Link from 'next/link';
import axios from 'axios';

/**
 * ネットワークページ - Second Meネットワークの管理と設定
 */
export default function NetworkPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [networkInfo, setNetworkInfo] = useState({
    peers: 0,
    status: 'disconnected',
    lastSync: null,
    publicMode: false,
    learningMode: false,
    collaborationMode: false
  });
  const [isLoading, setIsLoading] = useState(false);

  // バックエンドのヘルスチェック
  useEffect(() => {
    const checkHealth = async () => {
      try {
        await axios.get('/health');
        setIsConnected(true);
      } catch (error) {
        console.error('Health check failed:', error);
        setIsConnected(false);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000); // 30秒ごとに確認
    return () => clearInterval(interval);
  }, []);

  // ネットワーク接続
  const connectToNetwork = () => {
    setIsLoading(true);
    setTimeout(() => {
      setNetworkInfo({
        peers: 12,
        status: 'connected',
        lastSync: new Date().toISOString(),
        publicMode: true,
        learningMode: false,
        collaborationMode: true
      });
      setIsLoading(false);
    }, 2000);
  };

  // ネットワーク切断
  const disconnectFromNetwork = () => {
    setIsLoading(true);
    setTimeout(() => {
      setNetworkInfo({
        peers: 0,
        status: 'disconnected',
        lastSync: null,
        publicMode: false,
        learningMode: false,
        collaborationMode: false
      });
      setIsLoading(false);
    }, 1000);
  };

  // 設定の切り替え
  const toggleSetting = (setting) => {
    setNetworkInfo({
      ...networkInfo,
      [setting]: !networkInfo[setting]
    });
  };

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">Second Me ネットワーク</h1>
              <p className="text-gray-600">
                グローバルなSecond Meネットワークへの接続と設定
              </p>
            </div>

            {/* 接続ステータス */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold mb-1">ネットワークステータス</h2>
                  <div className="flex items-center">
                    <div className={`h-3 w-3 rounded-full ${networkInfo.status === 'connected' ? 'bg-green-500' : 'bg-red-500'} mr-2`}></div>
                    <span className="text-sm font-medium">
                      {networkInfo.status === 'connected' ? 'ネットワーク接続中' : 'ネットワーク未接続'}
                    </span>
                  </div>
                </div>
                <div>
                  {networkInfo.status === 'connected' ? (
                    <Button 
                      variant="outline" 
                      onClick={disconnectFromNetwork} 
                      disabled={isLoading || !isConnected}
                    >
                      {isLoading ? '処理中...' : '切断'}
                    </Button>
                  ) : (
                    <Button 
                      onClick={connectToNetwork} 
                      disabled={isLoading || !isConnected}
                    >
                      {isLoading ? '接続中...' : '接続'}
                    </Button>
                  )}
                </div>
              </div>

              {networkInfo.status === 'connected' && (
                <div className="mt-4 text-sm text-gray-600">
                  <div className="grid grid-cols-2 gap-2">
                    <div>接続ピア: <span className="font-medium">{networkInfo.peers}</span></div>
                    <div>最終同期: <span className="font-medium">{new Date(networkInfo.lastSync).toLocaleString()}</span></div>
                  </div>
                </div>
              )}
            </div>

            {/* ネットワーク設定 */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">ネットワーク設定</h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">パブリックモード</h3>
                    <p className="text-sm text-gray-600">他のユーザーがあなたのAIとやり取りできるようにします</p>
                  </div>
                  <div className="relative inline-block w-12 align-middle select-none">
                    <input 
                      type="checkbox" 
                      className="sr-only" 
                      id="toggle-public" 
                      checked={networkInfo.publicMode}
                      onChange={() => toggleSetting('publicMode')}
                      disabled={!isConnected}
                    />
                    <label 
                      htmlFor="toggle-public"
                      className={`block overflow-hidden h-6 rounded-full cursor-pointer ${networkInfo.publicMode ? 'bg-blue-500' : 'bg-gray-300'}`}
                    >
                      <span 
                        className={`block h-6 w-6 rounded-full bg-white transform transition-transform ${networkInfo.publicMode ? 'translate-x-6' : 'translate-x-0'}`}
                      ></span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">継続的学習モード</h3>
                    <p className="text-sm text-gray-600">使用中に学習し続けるようにします</p>
                  </div>
                  <div className="relative inline-block w-12 align-middle select-none">
                    <input 
                      type="checkbox" 
                      className="sr-only" 
                      id="toggle-learning" 
                      checked={networkInfo.learningMode} 
                      onChange={() => toggleSetting('learningMode')}
                      disabled={!isConnected}
                    />
                    <label 
                      htmlFor="toggle-learning"
                      className={`block overflow-hidden h-6 rounded-full cursor-pointer ${networkInfo.learningMode ? 'bg-blue-500' : 'bg-gray-300'}`}
                    >
                      <span 
                        className={`block h-6 w-6 rounded-full bg-white transform transition-transform ${networkInfo.learningMode ? 'translate-x-6' : 'translate-x-0'}`}
                      ></span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">協力モード</h3>
                    <p className="text-sm text-gray-600">他のAIと協力して問題解決します</p>
                  </div>
                  <div className="relative inline-block w-12 align-middle select-none">
                    <input 
                      type="checkbox" 
                      className="sr-only" 
                      id="toggle-collaboration" 
                      checked={networkInfo.collaborationMode}
                      onChange={() => toggleSetting('collaborationMode')}
                      disabled={!isConnected}
                    />
                    <label 
                      htmlFor="toggle-collaboration"
                      className={`block overflow-hidden h-6 rounded-full cursor-pointer ${networkInfo.collaborationMode ? 'bg-blue-500' : 'bg-gray-300'}`}
                    >
                      <span 
                        className={`block h-6 w-6 rounded-full bg-white transform transition-transform ${networkInfo.collaborationMode ? 'translate-x-6' : 'translate-x-0'}`}
                      ></span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* プライバシーノート */}
            <div className="bg-blue-50 p-6 rounded-lg mb-6">
              <h2 className="text-xl font-semibold mb-2">プライバシーノート</h2>
              <p className="text-sm mb-4">
                Second Meネットワークに接続しても、あなたの個人データは常にあなたのコントロール下にあります。
                データはローカルに保存され、サードパーティと共有されることはありません。
                パブリックモードを有効にすると、公開中は他のユーザーとのAI自己の対話が許可されます。
              </p>
              <p className="text-sm font-medium">
                ネットワーク使用時も、最高レベルのプライバシーとセキュリティを確保しています。
              </p>
            </div>

            {/* アクションボタン */}
            <div className="text-center">
              <Link href="/create">
                <Button variant="outline" className="mr-2">
                  AI自己を作成
                </Button>
              </Link>
              <Link href="/chat">
                <Button>
                  チャットを開始
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
