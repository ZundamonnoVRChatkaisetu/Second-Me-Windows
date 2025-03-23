import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from './ui/Button';

interface Profile {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  model_path: string;
  training_count: number;
  memories_count: number;
  active: boolean;
}

// バックエンドのURLを取得
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8002';

/**
 * プロファイル一覧を取得し、選択・作成・管理できるUIを提供するコンポーネント
 */
const ProfileSelector: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activating, setActivating] = useState<boolean>(false);
  const [activeProfileId, setActiveProfileId] = useState<string>('');
  const [retryCount, setRetryCount] = useState<number>(0);
  const [autoRetry, setAutoRetry] = useState<boolean>(true);

  // コンポーネント初期化時にプロファイル一覧を取得
  useEffect(() => {
    fetchProfiles();
  }, []);

  // 自動リトライのためのeffect
  useEffect(() => {
    if (autoRetry && retryCount < 3 && error) {
      const timer = setTimeout(() => {
        console.log(`Retrying profile fetch attempt ${retryCount + 1}...`);
        fetchProfiles();
        setRetryCount(prev => prev + 1);
      }, 2000); // 2秒後にリトライ
      
      return () => clearTimeout(timer);
    }
  }, [error, retryCount, autoRetry]);

  // プロファイル一覧を取得する関数
  const fetchProfiles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Fetching profiles from API...");
      // 完全なURLを使用し、タイムアウトを長めに設定
      const response = await axios.get(`${BACKEND_URL}/api/profiles`, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      console.log("Profiles response:", response.data);
      
      const profilesList = response.data.profiles || [];
      
      if (profilesList.length === 0) {
        console.log("No profiles found, checking if backend is creating default profile...");
        // 少し待ってから再度取得を試みる
        setTimeout(() => {
          fetchProfiles();
        }, 2000);
        return;
      }
      
      setProfiles(profilesList);
      
      // アクティブなプロファイルを特定
      const activeProfile = profilesList.find(p => p.active);
      if (activeProfile) {
        setActiveProfileId(activeProfile.id);
      }
      
      // 自動リトライをリセット
      setRetryCount(0);
      setAutoRetry(false);
    } catch (err: any) {
      console.error('Failed to fetch profiles:', err);
      
      // より詳細なエラーメッセージを生成
      let errorMsg = 'プロファイルの取得に失敗しました。';
      
      if (err.response) {
        // サーバーからのレスポンスがある場合
        errorMsg += ` サーバーエラー: ${err.response.status} - ${err.response.data?.error || 'Unknown error'}`;
      } else if (err.request) {
        // リクエストは送信されたがレスポンスがない場合
        errorMsg += ' サーバーが応答していません。バックエンドが起動していることを確認してください。';
      } else {
        // リクエストの設定時に問題が発生した場合
        errorMsg += ` エラー詳細: ${err.message}`;
      }
      
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // プロファイルをアクティブにする関数
  const activateProfile = async (profileId: string) => {
    try {
      setActivating(true);
      setError(null);
      setSuccess(null);
      
      console.log(`Activating profile ${profileId}...`);
      
      // リクエストの詳細をログ出力
      const requestConfig = {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 10000
      };
      
      // リクエスト本文 - profile_idフィールドを使用
      const requestData = { profile_id: profileId };
      
      console.log("Request data:", requestData);
      console.log("Request config:", requestConfig);
      
      // /api/profiles/selectエンドポイントを直接呼び出し
      try {
        const selectResponse = await axios.post(
          `${BACKEND_URL}/api/profiles/select`, 
          requestData, 
          requestConfig
        );
        console.log("Profile selection response:", selectResponse);
        
        // 選択成功 - クライアント側の状態を更新
        setProfiles(prevProfiles => 
          prevProfiles.map(profile => ({
            ...profile,
            active: profile.id === profileId
          }))
        );
        
        setActiveProfileId(profileId);
        
        const activeProfile = profiles.find(p => p.id === profileId);
        setSuccess(`プロファイル「${activeProfile?.name || profileId}」を選択しました。ページをリロードします...`);
        
        // 変更が確実に反映されるよう、少し待ってからページをリロード
        setTimeout(() => {
          window.location.reload();
        }, 1500);
        
      } catch (selectErr) {
        console.warn("Profile select endpoint failed:", selectErr);
        
        // selectが失敗した場合はactivateを試す
        try {
          const activateResponse = await axios.post(
            `${BACKEND_URL}/api/profiles/activate`, 
            requestData, 
            requestConfig
          );
          console.log("Profile activation response:", activateResponse);
          
          // activateが成功した場合も同様に状態を更新
          setProfiles(prevProfiles => 
            prevProfiles.map(profile => ({
              ...profile,
              active: profile.id === profileId
            }))
          );
          
          setActiveProfileId(profileId);
          
          const activeProfile = profiles.find(p => p.id === profileId);
          setSuccess(`プロファイル「${activeProfile?.name || profileId}」をアクティブにしました。ページをリロードします...`);
          
          // 変更が確実に反映されるよう、少し待ってからページをリロード
          setTimeout(() => {
            window.location.reload();
          }, 1500);
          
        } catch (activateErr: any) {
          console.error("Both endpoints failed:", activateErr);
          throw activateErr;
        }
      }
    } catch (err: any) {
      console.error('Failed to activate profile:', err);
      
      // エラー詳細をログ出力
      if (err.response) {
        console.error('Error response:', {
          data: err.response.data,
          status: err.response.status,
          headers: err.response.headers
        });
        
        // サーバーからのエラーメッセージがあれば表示
        const serverError = err.response.data?.error;
        if (serverError) {
          setError(`プロファイル選択エラー: ${serverError}`);
        } else {
          setError('プロファイルのアクティブ化に失敗しました。サーバーログを確認してください。');
        }
      } else {
        setError('サーバーに接続できません。バックエンドが起動しているか確認してください。');
      }
    } finally {
      setActivating(false);
    }
  };

  // 手動で再取得する関数
  const handleRetry = () => {
    setError(null);
    fetchProfiles();
  };

  // プロファイル作成ページに移動
  const goToCreateProfile = () => {
    window.location.href = '/profiles/create';
  };

  // プロファイル詳細ページに移動
  const goToProfileDetail = (profileId: string) => {
    window.location.href = `/profiles/${profileId}`;
  };

  // 作成日時を整形
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-medium">第2の自分（プロファイル）</h3>
          {!loading && !error && profiles.length > 0 && (
            <p className="text-sm text-gray-500">
              {profiles.length}件のプロファイルが利用可能です
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {error && (
            <Button
              onClick={handleRetry}
              className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700"
            >
              再取得
            </Button>
          )}
          <Button
            onClick={goToCreateProfile}
            className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700"
          >
            + 新規作成
          </Button>
        </div>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin h-6 w-6 border-2 border-blue-500 rounded-full border-t-transparent mr-2"></div>
          <span>プロファイル一覧を取得中...</span>
        </div>
      ) : error ? (
        <div className="p-3 bg-red-100 border border-red-300 rounded-md mb-4 text-red-700">
          <span className="mr-2">⚠️</span>
          <span>{error}</span>
        </div>
      ) : profiles.length === 0 ? (
        <div className="text-center py-4 text-gray-500">
          <p>利用可能なプロファイルがありません。</p>
          <p className="mt-2">
            「新規作成」ボタンをクリックして、第2の自分を作成してください。
          </p>
        </div>
      ) : (
        <>
          {success && (
            <div className="flex items-center p-3 mb-4 bg-green-100 border border-green-300 rounded-md text-green-700">
              <span className="mr-2">✓</span>
              <span>{success}</span>
            </div>
          )}
          
          <div className="divide-y divide-gray-200">
            {profiles.map((profile) => (
              <div 
                key={profile.id} 
                className={`py-3 ${profile.active ? 'bg-blue-50' : ''}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{profile.name}</h4>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{profile.description || 'No description'}</p>
                    <div className="mt-2 flex flex-wrap gap-x-4 text-xs text-gray-500">
                      <span>作成: {formatDate(profile.created_at)}</span>
                      <span>記憶: {profile.memories_count || 0}件</span>
                      <span>訓練: {profile.training_count || 0}回</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {profile.active ? (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        使用中
                      </span>
                    ) : (
                      <Button
                        onClick={() => activateProfile(profile.id)}
                        disabled={activating}
                        className="px-3 py-1 text-xs"
                      >
                        {activating ? '処理中...' : '使用する'}
                      </Button>
                    )}
                    <Button
                      onClick={() => goToProfileDetail(profile.id)}
                      className="px-3 py-1 text-xs bg-gray-200 text-gray-800 hover:bg-gray-300"
                    >
                      詳細
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ProfileSelector;
