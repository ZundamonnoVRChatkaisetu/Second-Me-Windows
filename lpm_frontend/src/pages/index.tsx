import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import HeroSection from '../components/HeroSection';
import CreateSelfSteps from '../components/CreateSelfSteps';
import ChatInterface from '../components/ChatInterface';

export default function Home() {
  const [status, setStatus] = useState<{
    status: string;
    uptime: number;
    version: string;
  } | null>(null);

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

    checkHealth();
    const interval = setInterval(checkHealth, 30000); // 30秒ごとに確認
    return () => clearInterval(interval);
  }, []);

  return (
    <Layout>
      {/* ヒーローセクション */}
      <HeroSection />

      {/* コンテンツセクション */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* 左側: チャットインターフェース */}
            <div>
              <h2 className="text-2xl font-bold mb-6">Second Me と会話する</h2>
              <div className="bg-gray-50 p-1 rounded-lg">
                <ChatInterface />
              </div>
              
              {/* ステータスインジケーター */}
              {status && (
                <div className="mt-4 flex items-center">
                  <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                  <span className="text-sm text-gray-600">
                    接続済み (v{status.version} - Uptime: {Math.floor(status.uptime / 60)} min)
                  </span>
                </div>
              )}
              
              {!status && (
                <div className="mt-4 flex items-center">
                  <div className="h-3 w-3 rounded-full bg-red-500 mr-2"></div>
                  <span className="text-sm text-gray-600">バックエンド未接続</span>
                </div>
              )}
            </div>
            
            {/* 右側: 機能の説明 */}
            <div>
              <h2 className="text-2xl font-bold mb-6">自分自身のAI自己をWindowsで</h2>
              
              <div className="space-y-6">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium mb-2">プライバシーとコントロール</h3>
                  <p>
                    Second Meはあなたのデータをローカルに保存し、完全なプライバシーと制御を保証します。
                    あなたのデータはあなたのコンピューターから離れることはありません。
                  </p>
                </div>
                
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium mb-2">あなた自身のAI自己をトレーニング</h3>
                  <p>
                    AIネイティブメモリを使用して、あなた自身のAI自己のトレーニングを開始します。
                    階層的メモリモデリング（HMM）を使用して、あなたのアイデンティティを捕捉します。
                  </p>
                </div>
                
                <div className="bg-purple-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium mb-2">オープンソースの取り組み</h3>
                  <p>
                    Second Meは完全にオープンソースであり、継続的に改善および拡張されています。
                    GitHub上で貢献し、プロジェクトの成長を手伝うことができます。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* セットアップステップセクション */}
      <CreateSelfSteps />
    </Layout>
  );
}
