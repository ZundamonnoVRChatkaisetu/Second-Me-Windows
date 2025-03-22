import React, { useState, useEffect, ReactNode } from 'react';
import { Button } from './Button';

interface StepWizardProps {
  steps: {
    title: string;
    component: ReactNode;
    validate?: () => boolean | Promise<boolean>;
  }[];
  initialStep?: number;
  onComplete?: (data: any) => void;
  submitButtonText?: string;
  cancelButtonText?: string;
  onCancel?: () => void;
  formData?: any; // 追加: 親コンポーネントから渡されるフォームデータ
  updateFormData?: (data: any) => void; // 追加: 親コンポーネントのフォームデータ更新関数
}

/**
 * ステップウィザードコンポーネント
 * マルチステップフォームを簡単に実装するためのコンポーネント
 */
const StepWizard: React.FC<StepWizardProps> = ({
  steps,
  initialStep = 0,
  onComplete,
  submitButtonText = '完了',
  cancelButtonText = 'キャンセル',
  onCancel,
  formData: parentFormData, // 親コンポーネントから渡されるフォームデータ
  updateFormData: parentUpdateFormData, // 親コンポーネントのフォームデータ更新関数
}) => {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [formData, setFormData] = useState<Record<string, any>>(parentFormData || {});
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // 親コンポーネントのフォームデータが変更された場合に同期
  useEffect(() => {
    if (parentFormData) {
      setFormData(parentFormData);
    }
  }, [parentFormData]);

  // ステップの移動
  const goToStep = (step: number) => {
    if (step >= 0 && step < steps.length) {
      setCurrentStep(step);
      setValidationError(null);
    }
  };

  // 次のステップへ
  const nextStep = async () => {
    setValidationError(null);
    
    // 現在のステップに検証関数がある場合は実行
    if (steps[currentStep].validate) {
      setIsValidating(true);
      try {
        const isValid = await steps[currentStep].validate!();
        if (!isValid) {
          setValidationError('入力内容を確認してください');
          setIsValidating(false);
          return;
        }
      } catch (error: any) {
        setValidationError(error.message || '検証中にエラーが発生しました');
        setIsValidating(false);
        return;
      }
      setIsValidating(false);
    }
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // 最後のステップであれば完了ハンドラーを実行
      onComplete && onComplete(parentFormData || formData);
    }
  };

  // 前のステップへ
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setValidationError(null);
    }
  };

  // 入力データを更新する関数（子コンポーネントに渡す）
  const updateLocalFormData = (update: Record<string, any>) => {
    // 親コンポーネントの更新関数がある場合はそちらも呼び出す
    if (parentUpdateFormData) {
      parentUpdateFormData(update);
    } else {
      setFormData(prev => ({ ...prev, ...update }));
    }
  };

  // ステップリストの表示
  const renderStepIndicators = () => {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                  index === currentStep
                    ? 'bg-blue-600 text-white'
                    : index < currentStep
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {index < currentStep ? '✓' : index + 1}
              </div>
              <span className="text-xs text-gray-600">{step.title}</span>
            </div>
          ))}
        </div>
        <div className="relative mt-2">
          <div className="absolute top-0 h-1 bg-gray-200 w-full"></div>
          <div
            className="absolute top-0 h-1 bg-blue-600 transition-all"
            style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
          ></div>
        </div>
      </div>
    );
  };

  // クローン化して子コンポーネントにpropsを渡す
  const currentStepComponent = React.isValidElement(steps[currentStep].component)
    ? React.cloneElement(steps[currentStep].component as React.ReactElement, {
        formData: parentFormData || formData,
        updateFormData: updateLocalFormData,
      })
    : steps[currentStep].component;

  return (
    <div>
      {renderStepIndicators()}

      {validationError && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md">
          {validationError}
        </div>
      )}

      <div className="mb-6">{currentStepComponent}</div>

      <div className="flex justify-between">
        <div>
          {currentStep > 0 && (
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={isValidating}
            >
              前へ
            </Button>
          )}
          {currentStep === 0 && onCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isValidating}
            >
              {cancelButtonText}
            </Button>
          )}
        </div>
        <Button
          onClick={nextStep}
          disabled={isValidating}
        >
          {isValidating ? '検証中...' : currentStep < steps.length - 1 ? '次へ' : submitButtonText}
        </Button>
      </div>
    </div>
  );
};

export default StepWizard;
