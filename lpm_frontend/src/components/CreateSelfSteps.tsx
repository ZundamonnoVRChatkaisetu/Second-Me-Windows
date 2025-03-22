import React from 'react';
import StepCard from './StepCard';
import { Button } from './ui/Button';
import Link from 'next/link';

/**
 * AIセルフ作成ステップを表示するコンポーネント
 * オリジナルのSecond Meの「第二の自分を作る方法」モーダルに相当
 */
const CreateSelfSteps: React.FC = () => {
  // 各ステップの情報
  const steps = [
    {
      number: 1,
      title: 'アイデンティティを定義する',
      description: 'まず自分のアイデンティティを定義することから始めましょう。これが「第二の自分」の基盤となります。',
      imageSrc: '/images/step-identity.png',
    },
    {
      number: 2,
      title: '思い出をアップロード',
      description: 'メモ、ドキュメント、その他のコンテンツをアップロードして、体験を共有しましょう。',
      imageSrc: '/images/step-upload.png',
    },
    {
      number: 3,
      title: '第二の私を訓練する',
      description: 'あなたのアイデンティティ、経験、好みを学習して AI モデルをトレーニングします。',
      imageSrc: '/images/step-train.png',
    },
    {
      number: 4,
      title: 'AIネットワークに参加する',
      description: 'Second Me とネットワーク内の他の AI エンティティ間の相互作用を調べます。',
      imageSrc: '/images/step-network.png',
    }
  ];

  return (
    <div className="bg-cream-50 py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">第二の自分を作る方法</h2>
            <p className="text-lg text-gray-600">
              デジタル ID 基盤を構築するには、次の簡単な手順に従ってください。
            </p>
          </div>

          {/* ステップカード */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {steps.map((step) => (
              <StepCard
                key={step.number}
                number={step.number}
                title={step.title}
                description={step.description}
                imageSrc={step.imageSrc}
              />
            ))}
          </div>

          {/* アクションボタン */}
          <div className="text-center">
            <Link href="/create">
              <Button variant="primary" size="lg">
                続く
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateSelfSteps;
