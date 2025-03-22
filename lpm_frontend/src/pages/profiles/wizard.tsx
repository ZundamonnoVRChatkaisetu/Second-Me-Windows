import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { Button } from '../../components/ui/Button';
import Link from 'next/link';
import axios from 'axios';
import StepWizard from '../../components/ui/StepWizard';
import BasicInfoStep, { validateBasicInfo } from '../../components/profile/BasicInfoStep';
import ModelSelectionStep, { validateModelSelection } from '../../components/profile/ModelSelectionStep';
import PersonalityStep, { validatePersonality } from '../../components/profile/PersonalityStep';
import CompleteStep, { validateComplete } from '../../components/profile/CompleteStep';

/**
 * ウィザード形式の第2の自分作成ページ
 */
export default function ProfileWizardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // プロファイル作成処理
  const handleCreateProfile = async (formData: any) => {
    try {
      setLoading(true);
      setError(null);
      
      // パーソナリティからカスタムプロンプトを生成
      let systemPrompt = formData.customPrompt;
      if (!systemPrompt && (formData.personality || formData.expertise?.length > 0 || formData.tone)) {
        systemPrompt = generateSystemPrompt(formData);
      }
      
      // APIに送信するデータを準備
      const profileData = {
        name: formData.name,
        description: formData.description,
        purpose: formData.purpose,
        model_path: formData.selectedModelPath,
        parameters: {
          temperature: formData.temperature || 0.7,
          max_tokens: formData.maxLength || 2048
        },
        personality: {
          description: formData.personality || '',
          tone: formData.tone || 'neutral',
          expertise: formData.expertise || [],
          custom_prompt: systemPrompt
        }
      };
      
      // プロファイル作成APIを呼び出し
      const response = await axios.post('/api/profiles/create', profileData);
      
      // レスポンスからプロファイルIDを取得
      // バックエンドから返されるレスポンス形式に合わせて適切なパスを使用
      const profileId = response.data.profile?.id;
      
      console.log("プロファイル作成レスポンス:", response.data);
      
      // プロファイルIDが存在する場合のみアクティブ化を試みる
      if (profileId) {
        try {
          // 作成したプロファイルをアクティブにする
          await axios.post('/api/profiles/activate', {
            profile_id: profileId
          });
          console.log("プロファイルのアクティブ化に成功:", profileId);
        } catch (activateErr: any) {
          console.error('Failed to activate profile:', activateErr);
          console.log("アクティブ化エラーのレスポンス:", activateErr.response?.data);
          // アクティブ化に失敗してもプロファイル作成は成功しているので、エラーとして扱わない
        }
      } else {
        console.warn("プロファイルIDが見つかりません。レスポンス:", response.data);
      }
      
      // リダイレクト先を決定
      if (formData.redirectToChat) {
        router.push('/chat');
      } else {
        router.push('/profiles');
      }
    } catch (err: any) {
      console.error('Failed to create profile:', err);
      setError(`第2の自分の作成に失敗しました: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // パーソナリティ設定からシステムプロンプトを生成
  const generateSystemPrompt = (formData: any): string => {
    let prompt = '';
    
    // 名前と目的を追加
    prompt += `あなたは「${formData.name}」という${formData.purpose || '第2の自分'}です。\n\n`;
    
    // パーソナリティの説明があれば追加
    if (formData.personality) {
      prompt += `${formData.personality}\n\n`;
    }
    
    // 口調の設定を追加
    const toneMap: { [key: string]: string } = {
      'formal': '丁寧でフォーマルな口調で話してください。',
      'casual': 'カジュアルで親しみやすい口調で話してください。',
      'neutral': '中立的でバランスの取れた口調で話してください。',
      'enthusiastic': '熱意があり、積極的な口調で話してください。',
      'professional': 'プロフェッショナルで専門的な口調で話してください。',
      'humorous': 'ユーモアを交えた明るい口調で話してください。'
    };
    
    if (formData.tone && toneMap[formData.tone]) {
      prompt += `${toneMap[formData.tone]}\n\n`;
    }
    
    // 専門分野があれば追加
    if (formData.expertise && formData.expertise.length > 0) {
      prompt += `特に「${formData.expertise.join('」「')}」の分野に詳しく、これらについて質問されたら詳細に答えられます。\n\n`;
    }
    
    prompt += `ユーザーの質問に対して適切かつ有益な応答を提供してください。`;
    
    return prompt;
  };

  // ウィザードのステップを定義
  const wizardSteps = [
    {
      title: '基本情報',
      component: <BasicInfoStep />,
      validate: () => validateBasicInfo({}),
    },
    {
      title: 'モデル選択',
      component: <ModelSelectionStep />,
      validate: () => validateModelSelection({}),
    },
    {
      title: 'パーソナリティ',
      component: <PersonalityStep />,
      validate: () => validatePersonality({}),
    },
    {
      title: '完了',
      component: <CompleteStep />,
      validate: () => validateComplete({}),
    }
  ];

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm p-8">
            {/* ヘッダー */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">第2の自分を作成</h1>
              <Link href="/profiles" passHref>
                <Button variant="outline">キャンセル</Button>
              </Link>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md">
                <p>{error}</p>
              </div>
            )}

            {/* ステップウィザード */}
            <StepWizard
              steps={wizardSteps}
              onComplete={handleCreateProfile}
              submitButtonText={loading ? '作成中...' : '第2の自分を作成する'}
              cancelButtonText="キャンセル"
              onCancel={() => router.push('/profiles')}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}
