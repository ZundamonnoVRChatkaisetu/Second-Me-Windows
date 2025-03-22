import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getTrainingHistory } from '../../lib/api-client';
import Layout from '../../components/layout/Layout';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { ArrowLeft, ExternalLink, Clock, CheckCircle, XCircle, Activity } from 'lucide-react';

const TrainingHistoryPage = () => {
  const router = useRouter();
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTrainingHistory();
  }, []);

  const fetchTrainingHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getTrainingHistory();
      setHistory(data.items || []);
    } catch (err) {
      console.error('Failed to fetch training history:', err);
      setError('トレーニング履歴の取得に失敗しました。再度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'waiting':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Clock className="h-3 w-3 mr-1" />
            待機中
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Activity className="h-3 w-3 mr-1" />
            処理中
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            完了
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            失敗
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            <XCircle className="h-3 w-3 mr-1" />
            キャンセル
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            不明
          </Badge>
        );
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
    });
  };

  const calculateDuration = (startTime, endTime) => {
    if (!startTime) return '---';
    
    const start = new Date(startTime).getTime();
    const end = endTime ? new Date(endTime).getTime() : Date.now();
    
    const elapsed = end - start;
    const seconds = Math.floor(elapsed / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}時間 ${minutes % 60}分`;
    } else if (minutes > 0) {
      return `${minutes}分`;
    } else {
      return `${seconds}秒`;
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
          <h1 className="text-3xl font-bold">トレーニング履歴</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>過去のトレーニング実行履歴</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : error ? (
              <div className="text-center p-4 text-red-500">{error}</div>
            ) : history.length === 0 ? (
              <div className="text-center p-8 text-gray-500">
                トレーニング履歴がありません。トレーニングを実行すると、ここに記録されます。
                <div className="mt-4">
                  <Button asChild variant="outline">
                    <Link href="/training/process">トレーニングを開始する</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>ステータス</TableHead>
                      <TableHead>開始日時</TableHead>
                      <TableHead>所要時間</TableHead>
                      <TableHead>ファイル数</TableHead>
                      <TableHead>エポック</TableHead>
                      <TableHead className="w-20">詳細</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono">{item.id.slice(0, 8)}</TableCell>
                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                        <TableCell>{formatDate(item.start_time)}</TableCell>
                        <TableCell>
                          {calculateDuration(item.start_time, item.end_time)}
                        </TableCell>
                        <TableCell>{item.file_count || 0}</TableCell>
                        <TableCell>
                          {item.current_epoch !== undefined && item.total_epochs !== undefined
                            ? `${item.current_epoch}/${item.total_epochs}`
                            : '---'}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            asChild
                          >
                            <Link href={`/training/status/${item.id}`} title="詳細を表示">
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default TrainingHistoryPage;
