import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAppContext } from '@/lib/AppContext';
import { Button } from './ui/Button';
import axios from 'axios';

// バックエンドのURLを取得
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8002';

/**
 * 各機能ページで使用するプロファイル切り替えコンポーネント
 * どのページからでもプロファイルを簡単に切り替えられるようにします
 */
const ProfileSwitcher: React.FC = () => {
  const router = useRouter();
  const {
    profiles,
    fetchProfiles,
    activateProfile,
    setError
  } = useAppContext();

  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // プロファイル一覧を取得
  useEffect(() => {
    const loadProfiles = async () => {
      if (!profiles.all.length && !profiles.loading) {
        await fetchProfiles();
      }
    };

    loadProfiles();
  }, [fetchProfiles, profiles.all.length, profiles.loading]);

  // ドロップダウン外のクリックを検出して閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // ドロップダウン表示切り替え
  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  // プロファイル切り替え処理
  const handleProfileChange = async (profileId: string) => {
    setShowDropdown(false);

    // 既にアクティブなプロファイルの場合は何もしない
    if (profiles.active?.id === profileId) return;

    setLoading(true);
    
    try {
      // APIを直接呼び出し
      const requestConfig = {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      };
      
      // リクエスト本文
      const requestData = { profile_id: profileId };
      
      console.log(`切り替え先プロファイル: ${profileId}`);
      
      try {
        // selectエンドポイントを使用
        const response = await axios.post(
          `${BACKEND_URL}/api/profiles/select`, 
          requestData, 
          requestConfig
        );
        console.log("Profile selection response:", response.data);
        
        // 成功メッセージを表示
        setSuccessMessage("プロファイルを切り替えました。ページをリロードします...");
        
        // 少し待ってからページをリロード
        setTimeout(() => {
          window.location.reload();
        }, 1500);
        
      } catch (selectError) {
        console.warn("Select endpoint failed, trying activate endpoint:", selectError);
        
        // フォールバック: activateエンドポイントを使用
        try {
          const activateResponse = await axios.post(
            `${BACKEND_URL}/api/profiles/activate`, 
            requestData, 
            requestConfig
          );
          console.log("Profile activation response:", activateResponse.data);
          
          // 成功メッセージを表示
          setSuccessMessage("プロファイルをアクティブ化しました。ページをリロードします...");
          
          // 少し待ってからページをリロード
          setTimeout(() => {
            window.location.reload();
          }, 1500);
          
        } catch (activateError: any) {
          console.error("Both endpoints failed:", activateError);
          throw activateError;
        }
      }
    } catch (error: any) {
      console.error('Failed to change profile:', error);
      
      // AppContextを使用したエラー表示
      if (error.response && error.response.data && error.response.data.error) {
        setError(`プロファイル切り替えエラー: ${error.response.data.error}`);
      } else {
        setError('プロファイルの切り替えに失敗しました。サーバー接続を確認してください。');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      {/* 成功メッセージ（表示される場合） */}
      {successMessage && (
        <div className="absolute -top-12 left-0 right-0 p-2 bg-green-100 text-green-800 text-sm rounded">
          <span>{successMessage}</span>
        </div>
      )}
      
      {/* 現在のプロファイル表示ボタン */}
      <button
        ref={buttonRef}
        onClick={toggleDropdown}
        disabled={loading}
        className="flex items-center px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 shadow-sm"
      >
        {loading ? (
          <>
            <span className="mr-2 inline-block w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></span>
            <span>処理中...</span>
          </>
        ) : (
          <>
            <span className="mr-2">👤</span>
            <span className="font-medium">{profiles.active ? profiles.active.name : '選択なし'}</span>
            <span className="ml-2">{showDropdown ? '▲' : '▼'}</span>
          </>
        )}
      </button>

      {/* プロファイル選択ドロップダウン */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute right-0 mt-1 w-60 bg-white rounded-md shadow-lg z-30 overflow-hidden"
        >
          <div className="py-1">
            {/* ヘッダー */}
            <div className="px-4 py-2 bg-gray-100 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-700">プロファイルを選択</h3>
            </div>

            {/* プロファイル一覧 */}
            <div className="max-h-60 overflow-y-auto">
              {profiles.all.length > 0 ? (
                profiles.all.map((profile) => (
                  <button
                    key={profile.id}
                    onClick={() => handleProfileChange(profile.id)}
                    disabled={loading}
                    className={`w-full text-left block px-4 py-2 text-sm ${
                      profile.active
                        ? 'bg-blue-100 text-blue-800 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center">
                      <span className="mr-2">{profile.active ? '✓' : '　'}</span>
                      <div>
                        <div>{profile.name}</div>
                        {profile.description && (
                          <div className="text-xs text-gray-500 truncate">
                            {profile.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-gray-500 italic">
                  プロファイルがありません
                </div>
              )}
            </div>

            {/* 管理リンク */}
            <div className="px-3 py-2 bg-gray-50 border-t border-gray-100">
              <Button
                onClick={() => {
                  setShowDropdown(false);
                  router.push('/profiles');
                }}
                disabled={loading}
                className={`w-full text-sm py-1 bg-blue-600 hover:bg-blue-700 ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                プロファイル管理
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileSwitcher;
