import React, { useEffect, useState } from 'react';
import { useAppContext } from '../lib/AppContext';

interface ConnectionStatusProps {
  className?: string;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ className = '' }) => {
  const { 
    backendConnected, 
    profiles,
    retryBackendConnection,
    error: globalError
  } = useAppContext();
  const [isRetrying, setIsRetrying] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // 接続問題の詳細な診断情報を取得
  const connectionDiagnostics = () => {
    const issues = [];
    
    if (!backendConnected) {
      issues.push('バックエンドサーバー接続エラー (http://localhost:8002)');
    }
    
    if (profiles.error) {
      issues.push(`プロファイル取得エラー: ${profiles.error}`);
    }
    
    if (globalError) {
      issues.push(`システムエラー: ${globalError}`);
    }
    
    return issues;
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await retryBackendConnection();
    } finally {
      setIsRetrying(false);
    }
  };

  const issues = connectionDiagnostics();
  const hasIssues = issues.length > 0;

  // スタイルの設定
  const wrapperClass = `${className} p-2 rounded-md transition-all duration-300 ${expanded ? 'w-80' : 'w-auto'}`;
  const statusClass = `flex items-center ${hasIssues ? 'text-red-500' : 'text-green-500'} cursor-pointer`;
  
  return (
    <div className={wrapperClass}>
      <div 
        className={statusClass}
        onClick={() => setExpanded(!expanded)}
        title={hasIssues ? '接続問題があります。クリックで詳細表示' : '接続状態は正常です'}
      >
        <div className={`w-3 h-3 rounded-full mr-2 ${hasIssues ? 'bg-red-500' : 'bg-green-500'}`}></div>
        <span className="text-sm font-medium">
          {hasIssues ? '接続問題' : '接続正常'}
        </span>
      </div>

      {expanded && hasIssues && (
        <div className="mt-2 text-sm bg-gray-100 dark:bg-gray-800 p-3 rounded-md">
          <h4 className="font-bold mb-2">診断結果:</h4>
          <ul className="list-disc list-inside space-y-1">
            {issues.map((issue, idx) => (
              <li key={idx} className="text-red-500">{issue}</li>
            ))}
          </ul>
          
          <div className="mt-3 space-y-2">
            <h4 className="font-bold">推奨される対応策:</h4>
            <ol className="list-decimal list-inside space-y-1 text-gray-700 dark:text-gray-300">
              <li>バックエンドサーバーが起動しているか確認してください</li>
              <li>
                <code className="bg-gray-200 dark:bg-gray-700 p-1 rounded text-xs">
                  start-with-cors.bat
                </code> 
                を使用してバックエンドを再起動してください
              </li>
              <li>
                <code className="bg-gray-200 dark:bg-gray-700 p-1 rounded text-xs">
                  debug-connection.bat
                </code> 
                を実行して詳細な診断を行ってください
              </li>
            </ol>
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="mt-3 w-full px-3 py-1.5 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
            >
              {isRetrying ? '再接続中...' : '再接続を試みる'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus;
