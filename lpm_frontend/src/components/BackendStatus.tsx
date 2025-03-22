import { useState, useEffect } from 'react';
import apiClient from '../lib/api-client';
import { getBackendUrl } from '../lib/utils';

// バックエンド接続状態を表示するコンポーネント
export default function BackendStatus() {
  const [status, setStatus] = useState<'loading' | 'connected' | 'disconnected'>('loading');
  const [info, setInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const backendUrl = getBackendUrl();

  useEffect(() => {
    // 接続チェック関数
    const checkConnection = async () => {
      try {
        console.log('Checking backend connection at:', backendUrl);
        const response = await apiClient.get('/health');
        console.log('Backend health check response:', response.data);
        
        setStatus('connected');
        setError(null);
        
        // 追加情報を取得
        try {
          const infoResponse = await apiClient.get('/api/info');
          setInfo(infoResponse.data);
        } catch (infoError) {
          console.warn('Error fetching backend info:', infoError);
        }
      } catch (err) {
        console.error('Backend connection error:', err);
        setStatus('disconnected');
        setError(err instanceof Error ? err.message : String(err));
      }
    };

    checkConnection();

    // 定期的にチェック
    const interval = setInterval(checkConnection, 10000);
    return () => clearInterval(interval);
  }, [backendUrl]);

  // 状態に応じたUIを表示
  return (
    <div className="my-4 p-4 rounded-lg border">
      <h3 className="text-lg font-medium mb-2">バックエンド接続状態</h3>
      
      {status === 'loading' && (
        <div className="flex items-center text-blue-600">
          <div className="animate-spin h-4 w-4 border-2 border-blue-600 rounded-full border-t-transparent mr-2"></div>
          接続確認中...
        </div>
      )}
      
      {status === 'connected' && (
        <div>
          <div className="flex items-center text-green-600">
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            接続済み: {backendUrl}
          </div>
          
          {info && (
            <div className="mt-2 text-sm text-gray-600">
              <div>Python: {info.environment?.python_version?.split(' ')[0]}</div>
              <div>OS: {info.environment?.os}</div>
              <div>稼働時間: {Math.floor(info.system?.uptime / 60)} 分</div>
            </div>
          )}
        </div>
      )}
      
      {status === 'disconnected' && (
        <div>
          <div className="flex items-center text-red-600">
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            未接続: {backendUrl}
          </div>
          
          {error && (
            <div className="mt-2 text-sm text-red-500">
              エラー: {error}
            </div>
          )}
          
          <div className="mt-2 text-sm">
            <ul className="list-disc pl-5">
              <li>バックエンドが起動しているか確認してください</li>
              <li>ポート {backendUrl.split(':').pop()} が開いているか確認してください</li>
              <li>ファイアウォールの設定を確認してください</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
