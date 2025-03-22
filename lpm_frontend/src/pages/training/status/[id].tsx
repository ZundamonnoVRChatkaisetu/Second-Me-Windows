import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getTrainingProcessStatus, getTrainingLog, cancelTrainingProcess } from '../../../lib/api-client';
import Layout from '../../../components/layout/Layout';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Progress } from '../../../components/ui/Progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/Tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../../components/ui/AlertDialog';
import { Alert, AlertDescription, AlertTitle } from '../../../components/ui/Alert';
import { useToast } from '../../../hooks/useToast';
import { ArrowLeft, AlertCircle, XCircle, CheckCircle, Clock, Activity, Terminal } from 'lucide-react';

const TrainingStatusPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { toast } = useToast();
  const [status, setStatus] = useState(null);
  const [log, setLog] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const logEndRef = useRef(null);
  
  // ポーリング用タイマー
  const pollingIntervalRef = useRef(null);
  const logPollingIntervalRef = useRef(null);
  
  useEffect(() => {
    if (id) {
      fetchTrainingStatus();
      fetchTrainingLog();
      
      // 定期的に状態を取得（5秒ごと）
      pollingIntervalRef.current = setInterval(fetchTrainingStatus, 5000);
      
      // 定期的にログを取得（2秒ごと）
      logPollingIntervalRef.current = setInterval(fetchTrainingLog, 2000);
      
      return () => {
        clearInterval(pollingIntervalRef.current);
        clearInterval(logPollingIntervalRef.current);
      };
    }
  }, [id]);
  
  // ログが更新されたらスクロールを一番下に移動
  useEffect(() => {
    if (logEndRef.current && activeTab === 'logs') {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [log, activeTab]);
  
  const fetchTrainingStatus = async () => {
    if (!id) return;
    
    try {
      const result = await getTrainingProcessStatus(id.toString());
      setStatus(result);
      
      // トレーニングが完了または失敗したらポーリングを停止
      if (
        result.status === 'completed' ||
        result.status === 'failed' ||
        result.status === 'cancelled'
      ) {
        clearInterval(pollingIntervalRef.current);
      }
    } catch (err) {
      console.error('Failed to fetch training status:', err);
      setError('トレーニング状態の取得に失敗しました。');
      clearInterval(pollingIntervalRef.current);
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchTrainingLog = async () => {
    if (!id) return;
    
    try {
      const result = await getTrainingLog(id.toString());
      setLog(result.log);
      
      // トレーニングが完了または失敗したらポーリングを停止
      if (status && (
        status.status === 'completed' ||
        status.status === 'failed' ||
        status.status === 'cancelled'
      )) {
        clearInterval(logPollingIntervalRef.current);
      }
    } catch (err) {
      console.error('Failed to fetch training log:', err);
      // ログ取得失敗はエラーとして表示しない（ステータスのみ表示）
    }
  };
  
  const handleCancelTraining = async () => {
    if (!id) return;
    
    try {
      await cancelTrainingProcess(id.toString());
      toast({
        title: 'トレーニングをキャンセルしました',
        description: 'トレーニングプロセスのキャンセルを要求しました。処理が完全に停止するまで少し時間がかかることがあります。',
      });
      
      // 状態を即時更新
      fetchTrainingStatus();
    } catch (err) {
      console.error('Failed to cancel training:', err);
      toast({
        title: 'トレーニングのキャンセルに失敗しました',
        description: '再度お試しいただくか、トレーニングが完了するまでお待ちください。',
        variant: 'destructive',
      });
    }
  };
  
  const getStatusIcon = () => {
    if (!status) return <Clock className="h-6 w-6 text-gray-400" />;
    
    switch (status.status) {
      case 'waiting':
        return <Clock className="h-6 w-6 text-blue-500" />;
      case 'in_progress':
        return <Activity className="h-6 w-6 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'failed':
        return <XCircle className="h-6 w-6 text-red-500" />;
      case 'cancelled':
        return <XCircle className="h-6 w-6 text-amber-500" />;
      default:
        return <Clock className="h-6 w-6 text-gray-400" />;
    }
  };
  
  const getStatusText = () => {
    if (!status) return '読み込み中...';
    
    switch (status.status) {
      case 'waiting':
        return '待機中';
      case 'in_progress':
        return '処理中';
      case 'completed':
        return '完了';
      case 'failed':
        return '失敗';
      case 'cancelled':
        return 'キャンセル済み';
      default:
        return '不明';
    }
  };
  
  const getStatusColor = () => {
    if (!status) return 'bg-gray-100';
    
    switch (status.status) {
      case 'waiting':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100';
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return '---';
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };
  
  const calculateElapsedTime = () => {
    if (!status || !status.start_time) return '---';
    
    const startTime = new Date(status.start_time).getTime();
    const endTime = status.end_time
      ? new Date(status.end_time).getTime()
      : Date.now();
    
    const elapsed = endTime - startTime;
    const seconds = Math.floor(elapsed / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}時間 ${minutes % 60}分 ${seconds % 60}秒`;
    } else if (minutes > 0) {
      return `${minutes}分 ${seconds % 60}秒`;
    } else {
      return `${seconds}秒`;
    }
  };
  
  const formatProgress = () => {
    if (!status) return 0;
    
    switch (status.status) {
      case 'waiting':
        return 0;
      case 'in_progress':
        return status.progress || 0;
      case 'completed':
        return 100;
      case 'failed':
      case 'cancelled':
        return status.progress || 0;
      default:
        return 0;
    }
  };
  
  return (
    <Layout>
      <div className="container mx-auto py-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" asChild className="mr-2">
            <Link href="/training">
              <ArrowLeft className="h-4 w-4 mr-1" />
              戻る
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">トレーニング進捗状況</h1>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>エラー</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>トレーニング ID: {id}</CardTitle>
                    <CardDescription>
                      トレーニングプロセスの詳細情報と進捗状況
                    </CardDescription>
                  </div>
                  <div className={`flex items-center px-3 py-1 rounded-full ${getStatusColor()}`}>
                    {getStatusIcon()}
                    <span className="ml-2 font-medium">{getStatusText()}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="mb-4">
                    <TabsTrigger value="overview">概要</TabsTrigger>
                    <TabsTrigger value="logs">ログ</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview" className="space-y-6">
                    {/* 進捗バー */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>進捗: {formatProgress().toFixed(1)}%</span>
                        {status && status.current_epoch && status.total_epochs && (
                          <span>エポック: {status.current_epoch} / {status.total_epochs}</span>
                        )}
                      </div>
                      <Progress value={formatProgress()} className="h-2" />
                    </div>
                    
                    {/* ステータス情報 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-500">開始時間</p>
                        <p>{formatDate(status?.start_time)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-500">終了時間</p>
                        <p>{formatDate(status?.end_time)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-500">経過時間</p>
                        <p>{calculateElapsedTime()}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-500">対象データ</p>
                        <p>{status?.file_count || 0} ファイル</p>
                      </div>
                    </div>
                    
                    {/* パラメータ情報 */}
                    <div>
                      <h3 className="font-medium mb-2">トレーニングパラメータ</h3>
                      <div className="bg-gray-50 p-4 rounded-md space-y-2">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-500">学習率</p>
                            <p>{status?.parameters?.learning_rate || '---'}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-500">エポック数</p>
                            <p>{status?.parameters?.epochs || '---'}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-500">バッチサイズ</p>
                            <p>{status?.parameters?.batch_size || '---'}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-500">モデルパス</p>
                            <p className="truncate">{status?.parameters?.model_path || '自動選択'}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-500">対象カテゴリ</p>
                          <div className="flex flex-wrap gap-1">
                            {status?.parameters?.categories?.map((category) => (
                              <span
                                key={category}
                                className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs"
                              >
                                {category}
                              </span>
                            )) || '---'}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* アクションボタン */}
                    <div className="flex justify-end gap-2">
                      {status?.status === 'waiting' || status?.status === 'in_progress' ? (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive">トレーニングをキャンセル</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>トレーニングをキャンセルしますか？</AlertDialogTitle>
                              <AlertDialogDescription>
                                この操作は元に戻せません。トレーニングプロセスが中断され、現在までの学習結果は保存されません。
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>やめる</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={handleCancelTraining}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                キャンセルする
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : (
                        <Button asChild>
                          <Link href="/training">トレーニング一覧に戻る</Link>
                        </Button>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="logs">
                    <Card className="bg-black text-green-400 font-mono text-sm">
                      <CardContent className="p-4">
                        <div className="h-96 overflow-y-auto whitespace-pre-wrap">
                          {log || 'ログデータがありません...'}
                          <div ref={logEndRef} />
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
            
            {/* トレーニング完了時のメッセージ */}
            {status?.status === 'completed' && (
              <Alert variant="success" className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertTitle>トレーニングが正常に完了しました</AlertTitle>
                <AlertDescription>
                  トレーニングされたモデルは保存され、チャット機能ですぐに使用できます。
                  <div className="mt-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href="/">チャットで試す</Link>
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
            
            {/* トレーニング失敗時のメッセージ */}
            {status?.status === 'failed' && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>トレーニングに失敗しました</AlertTitle>
                <AlertDescription>
                  ログを確認して、問題を特定してください。その後、パラメータを調整して再試行してください。
                  <div className="mt-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href="/training/process">再試行する</Link>
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
            
            {/* トレーニングキャンセル時のメッセージ */}
            {status?.status === 'cancelled' && (
              <Alert variant="warning" className="bg-amber-50 border-amber-200">
                <XCircle className="h-4 w-4 text-amber-500" />
                <AlertTitle>トレーニングはキャンセルされました</AlertTitle>
                <AlertDescription>
                  トレーニングプロセスは正常にキャンセルされました。
                  <div className="mt-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href="/training/process">新しいトレーニングを開始</Link>
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TrainingStatusPage;
