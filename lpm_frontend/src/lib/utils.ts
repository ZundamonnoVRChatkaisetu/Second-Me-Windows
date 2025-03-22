import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * ユーティリティ関数: クラス名を結合して最適化する
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 環境変数からバックエンドのURLを取得する
 * 環境変数が設定されていない場合はデフォルト値を返す
 */
export function getBackendUrl(): string {
  // クライアントサイドの場合はwindow.location.originからの相対パスを使用
  if (typeof window !== 'undefined') {
    const envUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (envUrl) {
      console.log('Using backend URL from env:', envUrl);
      return envUrl;
    }
    // 環境変数がない場合はデフォルト値
    console.log('Using default backend URL: http://localhost:8002');
    return 'http://localhost:8002';
  }
  
  // サーバーサイドの場合
  return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8002';
}

/**
 * APIエンドポイントの完全なURLを生成する
 * @param path - APIエンドポイントのパス（例: '/api/chat'）
 * @returns 完全なURL
 */
export function getApiUrl(path: string): string {
  const baseUrl = getBackendUrl();
  // パスが/で始まる場合は結合時に重複しないように調整
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

/**
 * 日時を文字列に変換する
 */
export function formatDate(date: Date): string {
  return date.toLocaleString();
}

/**
 * 文字列を指定された長さに切り詰める
 * @param str - 対象の文字列
 * @param maxLength - 最大長
 * @returns 切り詰められた文字列
 */
export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
}

/**
 * フォーマット済みの経過時間を取得する
 * @param seconds - 経過秒数
 * @returns フォーマット済みの時間文字列
 */
export function formatUptime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes} min`;
}
