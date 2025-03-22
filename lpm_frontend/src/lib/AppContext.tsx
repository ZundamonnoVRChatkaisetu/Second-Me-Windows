import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { checkBackendHealth } from './api-client';

// プロファイルの型定義
export interface Profile {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  model_path?: string;
  training_count?: number;
  memories_count?: number;
  has_workspace?: boolean;
  active: boolean;
}

// アプリケーション全体の共有状態の型定義
interface AppState {
  // バックエンドの接続状態
  backendConnected: boolean;
  // ユーザー情報
  user: {
    name: string;
    initialized: boolean;
  };
  // プロファイル情報
  profiles: {
    all: Profile[];
    active: Profile | null;
    loading: boolean;
    error: string | null;
  };
  // アップロードされたファイル
  uploadedFiles: string[];
  // トレーニング状態
  training: {
    isTraining: boolean;
    progress: number;
    completed: boolean;
  };
  // システム設定
  settings: {
    notifications: boolean;
    autoSave: boolean;
    language: string;
  };
  // アプリケーションのロード状態
  isLoading: boolean;
  loadingMessage: string;
  // エラー状態
  error: string | null;
}

// コンテキストで提供する関数の型定義
interface AppContextType extends AppState {
  // バックエンド接続状態を更新
  setBackendConnected: (connected: boolean) => void;
  // ユーザー情報を更新
  updateUser: (name: string) => void;
  // 初期化状態を更新
  setInitialized: (initialized: boolean) => void;
  // プロファイル関連の操作
  fetchProfiles: () => Promise<void>;
  activateProfile: (profileId: string) => Promise<boolean>;
  // ファイルリストを更新
  addUploadedFile: (fileName: string) => void;
  clearUploadedFiles: () => void;
  // トレーニング状態を更新
  startTraining: () => void;
  updateTrainingProgress: (progress: number) => void;
  completeTraining: () => void;
  resetTraining: () => void;
  // 設定を更新
  updateSettings: (settings: Partial<AppState['settings']>) => void;
  // ローディング状態を設定
  setLoading: (isLoading: boolean, message?: string) => void;
  // エラー状態を設定
  setError: (error: string | null) => void;
}

// デフォルト値の設定
const defaultState: AppState = {
  backendConnected: false,
  user: {
    name: '',
    initialized: false
  },
  profiles: {
    all: [],
    active: null,
    loading: false,
    error: null
  },
  uploadedFiles: [],
  training: {
    isTraining: false,
    progress: 0,
    completed: false
  },
  settings: {
    notifications: true,
    autoSave: true,
    language: 'ja'
  },
  isLoading: false,
  loadingMessage: '',
  error: null
};

// コンテキストの作成
const AppContext = createContext<AppContextType | undefined>(undefined);

// AppContextを使用するためのカスタムフック
export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

// AppContextプロバイダーコンポーネント
export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  // アプリケーションの状態
  const [state, setState] = useState<AppState>(defaultState);

  // バックエンドの健全性をチェック
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const isConnected = await checkBackendHealth();
        setState(prev => ({ ...prev, backendConnected: isConnected }));
        
        // バックエンド接続が確立されたらプロファイル情報を取得
        if (isConnected) {
          fetchProfiles();
        }
      } catch (error) {
        setState(prev => ({ 
          ...prev, 
          backendConnected: false,
          error: 'バックエンドに接続できません。'
        }));
      }
    };

    // 初回チェック
    checkConnection();

    // 定期的なチェック（30秒ごと）
    const interval = setInterval(checkConnection, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // ユーザーのローカルストレージからの復元
  useEffect(() => {
    // ユーザー情報の復元
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setState(prev => ({
          ...prev,
          user: {
            ...prev.user,
            ...parsedUser
          }
        }));
      } catch (e) {
        console.error('Failed to parse user data from localStorage', e);
      }
    }

    // 設定の復元
    const savedSettings = localStorage.getItem('settings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setState(prev => ({
          ...prev,
          settings: {
            ...prev.settings,
            ...parsedSettings
          }
        }));
      } catch (e) {
        console.error('Failed to parse settings from localStorage', e);
      }
    }
  }, []);

  // プロファイル一覧を取得する関数
  const fetchProfiles = async () => {
    try {
      setState(prev => ({
        ...prev,
        profiles: {
          ...prev.profiles,
          loading: true,
          error: null
        }
      }));

      const response = await axios.get('/api/profiles');
      const profiles = response.data.profiles || [];
      const activeProfile = profiles.find((p: Profile) => p.active) || null;

      setState(prev => ({
        ...prev,
        profiles: {
          all: profiles,
          active: activeProfile,
          loading: false,
          error: null
        }
      }));

      return profiles;
    } catch (error: any) {
      console.error('Failed to fetch profiles:', error);
      setState(prev => ({
        ...prev,
        profiles: {
          ...prev.profiles,
          loading: false,
          error: 'プロファイル情報の取得に失敗しました'
        }
      }));
      return [];
    }
  };

  // プロファイルをアクティブにする関数
  const activateProfile = async (profileId: string): Promise<boolean> => {
    try {
      setLoading(true, 'プロファイルをアクティブにしています...');
      
      // プロファイルをアクティブにするAPIを呼び出し
      await axios.post('/api/profiles/activate', {
        profile_id: profileId
      });
      
      // プロファイル一覧を再取得して最新情報に更新
      await fetchProfiles();
      
      setLoading(false);
      return true;
    } catch (error: any) {
      console.error('Failed to activate profile:', error);
      setError(`プロファイルのアクティブ化に失敗しました: ${error.response?.data?.error || error.message}`);
      setLoading(false);
      return false;
    }
  };

  // 状態更新関数
  const setBackendConnected = (connected: boolean) => {
    setState(prev => ({ ...prev, backendConnected: connected }));
  };

  const updateUser = (name: string) => {
    const updatedUser = { ...state.user, name };
    setState(prev => ({ 
      ...prev, 
      user: updatedUser
    }));
    // ローカルストレージに保存
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const setInitialized = (initialized: boolean) => {
    const updatedUser = { ...state.user, initialized };
    setState(prev => ({ 
      ...prev, 
      user: updatedUser
    }));
    // ローカルストレージに保存
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const addUploadedFile = (fileName: string) => {
    setState(prev => ({
      ...prev,
      uploadedFiles: [...prev.uploadedFiles, fileName]
    }));
  };

  const clearUploadedFiles = () => {
    setState(prev => ({
      ...prev,
      uploadedFiles: []
    }));
  };

  const startTraining = () => {
    setState(prev => ({
      ...prev,
      training: {
        ...prev.training,
        isTraining: true,
        progress: 0,
        completed: false
      }
    }));
  };

  const updateTrainingProgress = (progress: number) => {
    setState(prev => ({
      ...prev,
      training: {
        ...prev.training,
        progress
      }
    }));
  };

  const completeTraining = () => {
    setState(prev => ({
      ...prev,
      training: {
        ...prev.training,
        isTraining: false,
        progress: 100,
        completed: true
      }
    }));
  };

  const resetTraining = () => {
    setState(prev => ({
      ...prev,
      training: {
        isTraining: false,
        progress: 0,
        completed: false
      }
    }));
  };

  const updateSettings = (settings: Partial<AppState['settings']>) => {
    const updatedSettings = { ...state.settings, ...settings };
    setState(prev => ({
      ...prev,
      settings: updatedSettings
    }));
    // ローカルストレージに保存
    localStorage.setItem('settings', JSON.stringify(updatedSettings));
  };

  const setLoading = (isLoading: boolean, message: string = '') => {
    setState(prev => ({
      ...prev,
      isLoading,
      loadingMessage: message
    }));
  };

  const setError = (error: string | null) => {
    setState(prev => ({
      ...prev,
      error
    }));
  };

  // コンテキスト値
  const contextValue: AppContextType = {
    ...state,
    setBackendConnected,
    updateUser,
    setInitialized,
    fetchProfiles,
    activateProfile,
    addUploadedFile,
    clearUploadedFiles,
    startTraining,
    updateTrainingProgress,
    completeTraining,
    resetTraining,
    updateSettings,
    setLoading,
    setError
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};
