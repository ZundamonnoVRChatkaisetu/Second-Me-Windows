import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Button } from './ui/Button';
import { ThemeToggle } from './ThemeToggle';
import { useTheme } from './ThemeProvider';
import { useAppContext, Profile } from '@/lib/AppContext';

/**
 * アプリケーションのナビゲーションヘッダーコンポーネント
 * オリジナルSecond Meのヘッダーと同様のデザイン
 */
const NavigationHeader: React.FC = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const { 
    profiles, 
    fetchProfiles, 
    activateProfile, 
    setLoading,
    setError
  } = useAppContext();
  
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMainMenu, setShowMainMenu] = useState(false);

  // プロファイル一覧を取得
  useEffect(() => {
    const loadProfiles = async () => {
      if (!profiles.all.length && !profiles.loading) {
        await fetchProfiles();
      }
    };
    
    loadProfiles();
  }, [fetchProfiles, profiles.all.length, profiles.loading]);

  // プロファイルメニューの表示・非表示を切り替え
  const toggleProfileMenu = () => {
    setShowProfileMenu(!showProfileMenu);
    if (showMainMenu) setShowMainMenu(false);
  };

  // メインメニューの表示・非表示を切り替え（モバイル用）
  const toggleMainMenu = () => {
    setShowMainMenu(!showMainMenu);
    if (showProfileMenu) setShowProfileMenu(false);
  };

  // プロファイルを切り替える関数
  const handleProfileChange = async (profileId: string) => {
    setShowProfileMenu(false);
    
    // 既にアクティブなプロファイルの場合は何もしない
    if (profiles.active?.id === profileId) return;
    
    try {
      const success = await activateProfile(profileId);
      if (success) {
        // 現在のページをリロードして最新情報を反映
        router.reload();
      }
    } catch (error) {
      console.error('プロファイル切り替えエラー:', error);
      setError('プロファイルの切り替えに失敗しました');
    }
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

        {/* モバイルメニューボタン */}
        <div className="md:hidden">
          <button 
            onClick={toggleMainMenu}
            className="text-white p-2 focus:outline-none"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
        </div>

        {/* ナビゲーションリンク - 中央配置（デスクトップ） */}
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
          <Link href="/training" className="text-blue-100 hover:text-white transition-colors">
            トレーニング
          </Link>
          <Link href="/network" className="text-blue-100 hover:text-white transition-colors">
            ネットワーク
          </Link>
          <Link href="/docs" className="text-blue-100 hover:text-white transition-colors">
            ドキュメント
          </Link>
        </nav>

        {/* 右側のアクション（デスクトップ） */}
        <div className="hidden md:flex items-center space-x-4">
          {/* アクティブなプロファイル */}
          <div className="relative">
            <button 
              onClick={toggleProfileMenu}
              className="flex items-center text-blue-100 hover:text-white transition-colors"
            >
              <span className="mr-1">👤</span>
              <span className="hidden sm:inline">{profiles.active ? profiles.active.name : '選択なし'}</span>
              <span className="ml-1">▼</span>
            </button>
            
            {/* プロファイルメニュー（クリック時に表示） */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-10 overflow-hidden">
                <div className="py-1">
                  {/* プロファイル切り替えセクション */}
                  {profiles.all.length > 0 && (
                    <div className="px-4 py-2 bg-gray-100">
                      <h3 className="text-sm font-medium text-gray-700">プロファイル切り替え</h3>
                    </div>
                  )}
                  
                  {/* プロファイル一覧 */}
                  <div className="max-h-60 overflow-y-auto">
                    {profiles.all.map(profile => (
                      <button
                        key={profile.id}
                        onClick={() => handleProfileChange(profile.id)}
                        className={`w-full text-left block px-4 py-2 text-sm ${
                          profile.active 
                            ? 'bg-blue-100 text-blue-800 font-medium' 
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center">
                          <span className="mr-2">
                            {profile.active ? '✓' : '　'}
                          </span>
                          <div>
                            <div>{profile.name}</div>
                            {profile.description && (
                              <div className="text-xs text-gray-500 truncate">{profile.description}</div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                    
                    {profiles.all.length === 0 && (
                      <div className="px-4 py-2 text-sm text-gray-500">
                        プロファイルがありません
                      </div>
                    )}
                  </div>
                  
                  <hr className="my-1" />
                  
                  {/* プロファイル管理リンク */}
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
                  
                  {/* 機能リンク */}
                  <Link href="/memory" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    メモリー管理
                  </Link>
                  <Link href="/workspace" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    WorkSpace
                  </Link>
                  <Link href="/training" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    トレーニング
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
      
      {/* モバイルメニュー（ハンバーガーメニュークリック時に表示） */}
      {showMainMenu && (
        <div className="md:hidden bg-white shadow-lg">
          <nav className="px-4 py-2">
            <Link href="/chat" className="block py-2 text-gray-700">
              チャット
            </Link>
            <Link href="/memory" className="block py-2 text-gray-700">
              メモリー
            </Link>
            <Link href="/workspace" className="block py-2 text-gray-700">
              WorkSpace
            </Link>
            <Link href="/training" className="block py-2 text-gray-700">
              トレーニング
            </Link>
            <Link href="/network" className="block py-2 text-gray-700">
              ネットワーク
            </Link>
            <Link href="/docs" className="block py-2 text-gray-700">
              ドキュメント
            </Link>
            <hr className="my-2" />
            <Link href="/profiles" className="block py-2 text-gray-700">
              プロファイル管理
            </Link>
            <Link href="/settings" className="block py-2 text-gray-700">
              設定
            </Link>
            
            {/* アクティブプロファイル情報 */}
            <div className="mt-3 pt-3 border-t">
              <div className="text-sm text-gray-500">アクティブなプロファイル:</div>
              <div className="font-medium text-gray-800">
                {profiles.active ? profiles.active.name : '選択なし'}
              </div>
              
              {/* プロファイル切り替えボタン */}
              <button
                onClick={toggleProfileMenu}
                className="mt-2 w-full py-2 px-3 bg-blue-50 text-blue-700 rounded text-sm flex justify-between items-center"
              >
                <span>プロファイルを切り替える</span>
                <span>{showProfileMenu ? '▲' : '▼'}</span>
              </button>
              
              {/* プロファイル一覧（モバイル用） */}
              {showProfileMenu && (
                <div className="mt-1 mb-2 bg-gray-50 rounded border border-gray-200 overflow-y-auto max-h-60">
                  {profiles.all.map(profile => (
                    <button
                      key={profile.id}
                      onClick={() => handleProfileChange(profile.id)}
                      className={`w-full text-left block px-3 py-2 text-sm ${
                        profile.active 
                          ? 'bg-blue-100 text-blue-800 font-medium' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center">
                        <span className="mr-2">
                          {profile.active ? '✓' : '　'}
                        </span>
                        <div>
                          <div>{profile.name}</div>
                          {profile.description && (
                            <div className="text-xs text-gray-500 truncate">{profile.description}</div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* テーマ切り替え */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t">
              <span className="text-gray-700">テーマ</span>
              <ThemeToggle />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default NavigationHeader;
