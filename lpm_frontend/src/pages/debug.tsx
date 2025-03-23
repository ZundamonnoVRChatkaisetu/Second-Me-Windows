import React, { useState, useEffect } from 'react';
import clientDiagnostics from '../lib/debug-client';
import { useAppContext } from '../lib/AppContext';

// デバッグページのコンポーネント
const DebugPage: React.FC = () => {
  const { backendConnected, retryBackendConnection } = useAppContext();
  const [testResults, setTestResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [browserInfo, setBrowserInfo] = useState<any>(null);
  const [networkInfo, setNetworkInfo] = useState<any>(null);

  // ページ読み込み時に基本診断情報を収集
  useEffect(() => {
    setBrowserInfo(clientDiagnostics.getBrowserInfo());
    
    const getNetworkInfo = async () => {
      const info = await clientDiagnostics.getNetworkDiagnostics();
      setNetworkInfo(info);
    };
    
    getNetworkInfo();
  }, []);

  // バックエンド接続テスト
  const runConnectionTest = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const results = await clientDiagnostics.testBackendConnection();
      setTestResults(results);
      
      if (!results.success) {
        setError(results.error || 'バックエンド接続テストに失敗しました');
      }
      
      // AppContextの接続状態も更新
      if (retryBackendConnection) {
        await retryBackendConnection();
      }
    } catch (err: any) {
      setError(`テスト実行中にエラーが発生しました: ${err.message}`);
      setTestResults(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Second-Me Windows - 接続診断ツール</h1>
      
      {/* 接続ステータス */}
      <div className="mb-6 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-2">現在の接続状態</h2>
        <div className="flex items-center">
          <div className={`w-4 h-4 rounded-full mr-2 ${backendConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <p>{backendConnected ? 'バックエンドに接続済み' : 'バックエンドに未接続'}</p>
        </div>
        
        <button 
          onClick={runConnectionTest}
          disabled={loading}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {loading ? '接続テスト実行中...' : '接続テストを実行'}
        </button>
      </div>
      
      {/* エラーメッセージ */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg text-red-800">
          <h3 className="font-semibold">エラー:</h3>
          <p>{error}</p>
        </div>
      )}
      
      {/* テスト結果 */}
      {testResults && (
        <div className="mb-6 p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-2">接続テスト結果</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(testResults.results).map(([key, value]: [string, any]) => (
              <div key={key} className="p-3 border rounded">
                <h3 className="font-semibold">{key} テスト</h3>
                <div className="flex items-center mt-1">
                  <div className={`w-3 h-3 rounded-full mr-2 ${value.success ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <p>{value.success ? '成功' : '失敗'}</p>
                </div>
                {value.status && <p className="text-sm">ステータス: {value.status}</p>}
                {value.error && <p className="text-sm text-red-600">エラー: {value.error}</p>}
                {value.data && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-blue-500">レスポンスデータ</summary>
                    <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                      {JSON.stringify(value.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* ブラウザ情報 */}
      {browserInfo && (
        <div className="mb-6 p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-2">ブラウザ情報</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {Object.entries(browserInfo).map(([key, value]) => (
              <div key={key} className="flex">
                <span className="font-medium mr-2">{key}:</span>
                <span className="truncate">{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* ネットワーク情報 */}
      {networkInfo && (
        <div className="mb-6 p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-2">ネットワーク診断</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {Object.entries(networkInfo).map(([key, value]) => (
              <div key={key} className="flex">
                <span className="font-medium mr-2">{key}:</span>
                <span>{value !== null ? String(value) : 'N/A'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* ヘルプ情報 */}
      <div className="p-4 border rounded-lg bg-blue-50">
        <h2 className="text-xl font-semibold mb-2">トラブルシューティング</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>バックエンドサーバーが起動しているか確認してください（<code>start-backend-only.bat</code>）</li>
          <li>ポート8002が他のアプリケーションで使用されていないか確認してください</li>
          <li>ファイアウォールがバックエンド接続をブロックしていないか確認してください</li>
          <li>CORSの設定が正しいか確認してください</li>
          <li>接続が確立できない場合は、ログファイル（<code>logs/backend.log</code>）を確認してください</li>
        </ul>
      </div>
    </div>
  );
};

export default DebugPage;
