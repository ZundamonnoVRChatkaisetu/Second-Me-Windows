import React from 'react';
import Layout from '../components/Layout';
import ModelSelector from '../components/ModelSelector';

/**
 * アプリケーション設定ページ
 * モデル設定やその他の設定を管理する画面
 */
const SettingsPage: React.FC = () => {
  return (
    <Layout>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">設定</h1>
        
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
              <h2 className="text-lg font-medium text-gray-900">AIモデル設定</h2>
              <p className="mt-1 text-sm text-gray-500">
                Second Meが使用するAIモデルの設定を行います。
                Ollamaが起動していることを確認してください。
              </p>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <ModelSelector />
            </div>
          </div>
          
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
              <h2 className="text-lg font-medium text-gray-900">一般設定</h2>
              <p className="mt-1 text-sm text-gray-500">
                アプリケーション全体に関わる基本設定を行います。
              </p>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <div className="py-2 text-gray-500 italic">
                この機能は近日公開予定です。
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
              <h2 className="text-lg font-medium text-gray-900">詳細設定</h2>
              <p className="mt-1 text-sm text-gray-500">
                高度なシステム設定を行います。これらの設定は慎重に変更してください。
              </p>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <div className="py-2 text-gray-500 italic">
                この機能は近日公開予定です。
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage;
