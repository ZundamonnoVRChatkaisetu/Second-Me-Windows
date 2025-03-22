import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from './ui/Button';
import { ThemeToggle } from './ThemeToggle';
import { useTheme } from './ThemeProvider';
import axios from 'axios';

interface ActiveProfile {
  id: string;
  name: string;
}

/**
 * アプリケーションのナビゲーションヘッダーコンポーネント
 * オリジナルSecond Meのヘッダーと同様のデザイン
 */
const NavigationHeader: React.FC = () => {
  const { theme } = useTheme();
  const [activeProfile, setActiveProfile] = useState<ActiveProfile | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  // アクティブなプロファイルを取得
  useEffect(() => {
    const fetchActiveProfile = async () => {
      try {
        const response = await axios.get('/api/profiles');
        const profiles = response.data.profiles || [];
        const active = profiles.find((p: any) => p.active);
        
        if (active) {
          setActiveProfile({
            id: active.id,
            name: active.name
          });
        }
      } catch (err) {
        console.error('Failed to fetch active profile:', err);
      }
    };
    
    fetchActiveProfile();
  }, []);

  // プロファイルメニューの表示・非表示を切り替え
  const toggleProfileMenu = () => {
    setShowProfileMenu(!showProfileMenu);
  };
  
  return (
    <header className={`w-full ${ 
      theme === 'dark' 
        ? 'bg-gray-900 border-gray-800' 
        : 'bg-blue-600 border-blue-700'
    } border-b transition-colors duration-200`}>
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* ロゴとブランド */}
        <div className="flex items-center space-x-2">
          <Link href="/" className="flex items-center">
            <div className={`w-8 h-8 rounded-full ${
              theme === 'dark' ? 'bg-blue-800' : 'bg-blue-100'
            } flex items-center justify-center mr-2`}>
              <div className={`w-6 h-6 rounded-full ${
                theme === 'dark' ? 'bg-blue-600' : 'bg-blue-400'
              }`}></div>
            </div>
            <span className="text-white font-medium text-lg">Second Me</span>
          </Link>
        </div>

        {/* ナビゲーションリンク - 中央配置 */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/chat" className="text-blue-100 hover:text-white transition-colors">
            チャット
          </Link>
          <Link href="/memory" className="text-blue-100 hover:text-white transition-colors">
            メモリー
          </Link>
          <Link href="/workspace" className="text-blue-100 hover:text-white transition-colors">
            WorkSpace
          </Link>
          <Link href="/network" className="text-blue-100 hover:text-white transition-colors">
            ネットワーク
          </Link>
          <Link href="/docs" className="text-blue-100 hover:text-white transition-colors">
            ドキュメント
          </Link>
        </nav>

        {/* 右側のアクション */}
        <div className="flex items-center space-x-4">
          {/* アクティブなプロファイル */}
          <div className="relative">
            <button 
              onClick={toggleProfileMenu}
              className="flex items-center text-blue-100 hover:text-white transition-colors"
            >
              <span className="mr-1">👤</span>
              <span className="hidden sm:inline">{activeProfile ? activeProfile.name : '選択なし'}</span>
              <span className="ml-1">▼</span>
            </button>
            
            {/* プロファイルメニュー（クリック時に表示） */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                <div className="py-1">
                  <Link href="/profiles" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    プロファイル管理
                  </Link>
                  <Link href="/profiles/create" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    新規プロファイル作成
                  </Link>
                  <Link href="/profiles/wizard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    ウィザード形式で作成
                  </Link>
                  <hr className="my-1" />
                  <Link href="/memory" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    メモリー管理
                  </Link>
                  <Link href="/workspace" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    WorkSpace
                  </Link>
                </div>
              </div>
            )}
          </div>
          
          {/* 設定ページへのリンク */}
          <Link href="/settings" className="text-blue-100 hover:text-white transition-colors">
            ⚙️ <span className="hidden sm:inline">設定</span>
          </Link>
          
          {/* テーマ切り替えボタン */}
          <ThemeToggle className="text-white" />
          
          <Link href="https://github.com/ZundamonnoVRChatkaisetu/Second-Me-Windows" 
                target="_blank"
                className="text-blue-100 hover:text-white transition-colors hidden lg:inline-block">
            GitHub でスターを付ける
          </Link>
          
          {/* リンク先をウィザードページに変更 */}
          <Link href="/profiles/wizard">
            <Button 
              variant="primary" 
              size="sm" 
              rounded="full" 
              className={`${
                theme === 'dark' 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-white text-blue-600 hover:bg-blue-50'
              }`}
            >
              <span className="hidden sm:inline">第2の自分を作る</span>
              <span className="sm:hidden">作成</span>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default NavigationHeader;
