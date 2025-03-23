import axios from 'axios';

// 環境変数からバックエンドのURLを取得、デフォルト値も設定
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8002';

console.log('Debug client using backend URL:', BACKEND_URL);

// 様々な方法でバックエンドとの接続をテスト
export const testBackendConnection = async (): Promise<{
  success: boolean;
  error?: string;
  results: {[key: string]: any};
}> => {
  console.log('Testing backend connection...');
  
  const results: {[key: string]: any} = {};
  let success = false;
  let error = '';
  
  // 1. 通常のAjax (axios)
  try {
    console.log('Testing with Axios...');
    const response = await axios.get(`${BACKEND_URL}/api/debug`, {
      timeout: 5000
    });
    results.axios = {
      success: true,
      status: response.status,
      data: response.data
    };
    success = true;
  } catch (err: any) {
    console.error('Axios test failed:', err);
    results.axios = {
      success: false,
      error: err.message
    };
    error = `Axios test failed: ${err.message}`;
  }
  
  // 2. フェッチAPI
  try {
    console.log('Testing with Fetch API...');
    const response = await fetch(`${BACKEND_URL}/api/debug`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      results.fetch = {
        success: true,
        status: response.status,
        data: data
      };
      success = true;
    } else {
      results.fetch = {
        success: false,
        status: response.status,
        statusText: response.statusText
      };
    }
  } catch (err: any) {
    console.error('Fetch test failed:', err);
    results.fetch = {
      success: false,
      error: err.message
    };
    if (!error) error = `Fetch test failed: ${err.message}`;
  }
  
  // 3. JSONP (CORSの問題を回避するための古典的な方法)
  try {
    console.log('Testing with JSONP...');
    
    // JSONPリクエストの作成 (スクリプトタグを使用)
    const jsonpPromise = new Promise((resolve, reject) => {
      // コールバック関数名を生成
      const callbackName = `jsonpCallback_${Date.now()}`;
      
      // グローバルにコールバック関数を定義
      (window as any)[callbackName] = (data: any) => {
        // クリーンアップ
        document.body.removeChild(script);
        delete (window as any)[callbackName];
        
        resolve(data);
      };
      
      // スクリプトタグを作成
      const script = document.createElement('script');
      script.src = `${BACKEND_URL}/api/jsonp/debug?callback=${callbackName}`;
      script.onerror = (err) => {
        // クリーンアップ
        document.body.removeChild(script);
        delete (window as any)[callbackName];
        
        reject(new Error('JSONP request failed'));
      };
      
      // 5秒タイムアウト
      const timeoutId = setTimeout(() => {
        // クリーンアップ
        if (script.parentNode) document.body.removeChild(script);
        delete (window as any)[callbackName];
        
        reject(new Error('JSONP request timed out'));
      }, 5000);
      
      // スクリプトタグをDOMに追加
      document.body.appendChild(script);
    });
    
    const jsonpData = await jsonpPromise;
    results.jsonp = {
      success: true,
      data: jsonpData
    };
    success = true;
  } catch (err: any) {
    console.error('JSONP test failed:', err);
    results.jsonp = {
      success: false,
      error: err.message
    };
    if (!error) error = `JSONP test failed: ${err.message}`;
  }
  
  // 4. 代替エンドポイント (通常のAPIとは異なるパス)
  try {
    console.log('Testing alternative endpoint...');
    const response = await axios.get(`${BACKEND_URL}/debug`, {
      timeout: 5000
    });
    results.alternative = {
      success: true,
      status: response.status,
      data: response.data
    };
    success = true;
  } catch (err: any) {
    console.error('Alternative endpoint test failed:', err);
    results.alternative = {
      success: false,
      error: err.message
    };
    if (!error) error = `Alternative endpoint test failed: ${err.message}`;
  }
  
  // 5. ヘルスエンドポイント
  try {
    console.log('Testing health endpoint...');
    const response = await axios.get(`${BACKEND_URL}/health`, {
      timeout: 5000
    });
    results.health = {
      success: true,
      status: response.status,
      data: response.data
    };
    success = true;
  } catch (err: any) {
    console.error('Health endpoint test failed:', err);
    results.health = {
      success: false,
      error: err.message
    };
    if (!error) error = `Health endpoint test failed: ${err.message}`;
  }
  
  // 接続テスト結果のまとめ
  return {
    success,
    error: success ? undefined : error,
    results
  };
};

// ブラウザの情報を取得
export const getBrowserInfo = (): any => {
  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    cookieEnabled: navigator.cookieEnabled,
    platform: navigator.platform,
    vendor: navigator.vendor,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    location: window.location.href,
    origin: window.location.origin
  };
};

// ネットワーク診断情報を収集
export const getNetworkDiagnostics = async (): Promise<any> => {
  // RTTをテスト
  const startTime = Date.now();
  let rtt = null;
  
  try {
    await fetch(`${BACKEND_URL}/health?_=${Date.now()}`, {
      method: 'GET',
      cache: 'no-store'
    });
    rtt = Date.now() - startTime;
  } catch (err) {
    console.error('RTT test failed:', err);
  }
  
  return {
    rtt,
    backend_url: BACKEND_URL,
    // 現在時刻（タイムゾーン情報付き）
    local_time: new Date().toString(),
    timezone_offset: new Date().getTimezoneOffset()
  };
};

// クライアント診断ツールのエクスポート
const clientDiagnostics = {
  testBackendConnection,
  getBrowserInfo,
  getNetworkDiagnostics
};

export default clientDiagnostics;
