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

  // コンポーネント初期化時にプロファイル一覧を取得
  useEffect(() => {
    fetchProfiles();
  }, []);

  // プロファイル一覧を取得する関数
  const fetchProfiles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Fetching profiles from API...");
      const response = await axios.get('/api/profiles');
      console.log("Profiles response:", response.data);
      
      const profilesList = response.data.profiles || [];
      setProfiles(profilesList);
      
      // アクティブなプロファイルを特定
      const activeProfile = profilesList.find(p => p.active);
      if (activeProfile) {
        setActiveProfileId(activeProfile.id);
      }
    } catch (err: any) {
      console.error('Failed to fetch profiles:', err);
      setError('プロファイルの取得に失敗しました。サーバーが起動していることを確認してください。');
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
        }
      };
      
      // リクエスト本文 - 両方のエンドポイントで使われるフィールド名を含める
      const requestData = { 
        profile_id: profileId,
        id: profileId  // 一部のバックエンドエンドポイントが id をサポート
      };
      
      console.log("Request data:", requestData);
      console.log("Request config:", requestConfig);
      
      try {
        // selectエンドポイントを最初に試す (より信頼性が高い)
        await axios.post('/api/profiles/select', requestData, requestConfig)
          .then(response => {
            console.log("Profile selection response:", response);
            // 選択成功
          })
          .catch(async (selectErr) => {
            console.warn("Profile select endpoint failed, trying activate endpoint:", selectErr);
            // selectが失敗した場合はactivateを試す
            const activateResponse = await axios.post('/api/profiles/activate', requestData, requestConfig);
            console.log("Profile activation response:", activateResponse);
          });
        
        // 選択状態を更新
        setProfiles(prevProfiles => prevProfiles.map(profile => ({
          ...profile,
          active: profile.id === profileId
        })));
        
        setActiveProfileId(profileId);
        
        const activeProfile = profiles.find(p => p.id === profileId);
        setSuccess(`プロファイル「${activeProfile?.name || profileId}」をアクティブにしました`);
        
        // 3秒後に成功メッセージを非表示
        setTimeout(() => setSuccess(null), 3000);
        
        // 変更が反映されるようにプロファイル一覧を再取得
        fetchProfiles();
      } catch (axiosErr: any) {
        console.error("Axios error details:", {
          message: axiosErr.message,
          response: axiosErr.response,
          request: axiosErr.request,
          config: axiosErr.config
        });
        throw axiosErr;
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
      }
      
      setError('プロファイルのアクティブ化に失敗しました。サーバーログを確認してください。');
    } finally {
      setActivating(false);
    }
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
        <h3 className="text-lg font-medium">第2の自分（プロファイル）</h3>
        <Button
          onClick={goToCreateProfile}
          className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700"
        >
          + 新規作成
        </Button>
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
                        使用する
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
