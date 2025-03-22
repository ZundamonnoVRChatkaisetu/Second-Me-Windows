import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAppContext } from '@/lib/AppContext';
import { Button } from './ui/Button';

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
    <div className="relative">
      {/* 現在のプロファイル表示ボタン */}
      <button
        ref={buttonRef}
        onClick={toggleDropdown}
        className="flex items-center px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 shadow-sm"
      >
        <span className="mr-2">👤</span>
        <span className="font-medium">{profiles.active ? profiles.active.name : '選択なし'}</span>
        <span className="ml-2">{showDropdown ? '▲' : '▼'}</span>
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
                    className={`w-full text-left block px-4 py-2 text-sm ${
                      profile.active
                        ? 'bg-blue-100 text-blue-800 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
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
                className="w-full text-sm py-1 bg-blue-600 hover:bg-blue-700"
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
