import React from 'react';
import Layout from '../components/Layout';
import ModelSelector from '../components/ModelSelector';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

/**
 * アプリケーション設定ページ
 * モデル設定やその他の設定を管理する画面
 */
const SettingsPage: React.FC = () => {
  return (
    <Layout>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">設定</h1>
        
        <Tabs defaultValue="models" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="models">モデル設定</TabsTrigger>
            <TabsTrigger value="general">一般設定</TabsTrigger>
            <TabsTrigger value="advanced">詳細設定</TabsTrigger>
          </TabsList>
          
          <TabsContent value="models">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>AIモデル設定</CardTitle>
                  <CardDescription>
                    Second Meが使用するAIモデルの設定を行います。
                    Ollamaが起動していることを確認してください。
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ModelSelector />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>モデルパラメータ設定</CardTitle>
                  <CardDescription>
                    モデルの動作に関わる詳細パラメータを設定します。
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="py-2 text-gray-500 italic">
                    この機能は近日公開予定です。
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>一般設定</CardTitle>
                <CardDescription>
                  アプリケーション全体に関わる基本設定を行います。
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="py-2 text-gray-500 italic">
                  この機能は近日公開予定です。
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="advanced">
            <Card>
              <CardHeader>
                <CardTitle>詳細設定</CardTitle>
                <CardDescription>
                  高度なシステム設定を行います。これらの設定は慎重に変更してください。
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="py-2 text-gray-500 italic">
                  この機能は近日公開予定です。
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default SettingsPage;
