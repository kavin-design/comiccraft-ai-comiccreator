import React from 'react';
import { Loader2, AlertCircle, RotateCcw, PenTool, BookOpen, Palette, CheckCircle2, LayoutTemplate } from 'lucide-react';

export type PipelineStep =
  | 'idle'
  | 'outline'
  | 'story'
  | 'drawing-1'
  | 'drawing-2'
  | 'drawing-3'
  | 'drawing-4'
  | 'drawing-5'
  | 'layout'
  | 'done'
  | 'error';

interface GenerationProgressProps {
  currentStep: PipelineStep;
  error: string | null;
  onRetry: () => void;
  characterName: string;
}

const STEPS_LIST: { id: PipelineStep; label: string; icon: React.ElementType }[] = [
  { id: 'outline', label: 'Writing outline…', icon: PenTool },
  { id: 'story', label: 'Writing story…', icon: BookOpen },
  { id: 'drawing-1', label: 'Drawing panel 1/5 …', icon: Palette },
  { id: 'drawing-2', label: 'Drawing panel 2/5 …', icon: Palette },
  { id: 'drawing-3', label: 'Drawing panel 3/5 …', icon: Palette },
  { id: 'drawing-4', label: 'Drawing panel 4/5 …', icon: Palette },
  { id: 'drawing-5', label: 'Drawing panel 5/5 …', icon: Palette },
  { id: 'layout', label: 'Building layout…', icon: LayoutTemplate },
];

export const GenerationProgress: React.FC<GenerationProgressProps> = ({
  currentStep,
  error,
  onRetry,
  characterName,
}) => {
  const getStepStatus = (stepId: PipelineStep) => {
    const order: PipelineStep[] = [
      'outline',
      'story',
      'drawing-1',
      'drawing-2',
      'drawing-3',
      'drawing-4',
      'drawing-5',
      'layout',
      'done',
    ];
    const currentIndex = order.indexOf(currentStep);
    const stepIndex = order.indexOf(stepId);

    if (error) {
      if (currentIndex === stepIndex) return 'failed';
      return currentIndex > stepIndex ? 'completed' : 'pending';
    }

    if (currentIndex > stepIndex || currentStep === 'done') return 'completed';
    if (currentIndex === stepIndex) return 'active';
    return 'pending';
  };

  const getProgressPercentage = () => {
    switch (currentStep) {
      case 'outline':
        return 15;
      case 'story':
        return 30;
      case 'drawing-1':
        return 45;
      case 'drawing-2':
        return 60;
      case 'drawing-3':
        return 75;
      case 'drawing-4':
        return 85;
      case 'drawing-5':
        return 95;
      case 'layout':
      case 'done':
        return 100;
      default:
        return 5;
    }
  };

  const activeStepObj = STEPS_LIST.find((s) => s.id === currentStep) || STEPS_LIST[0];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-amber-50 border-4 border-slate-900 rounded-3xl p-6 md:p-8 max-w-lg w-full comic-shadow-lg relative overflow-hidden">
        {/* Comic background accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-300 rounded-bl-full -z-0 opacity-40" />

        {/* Header */}
        <div className="relative z-10 text-center mb-6">
          <div className="inline-block bg-rose-500 text-white font-comic text-xl px-4 py-1 rounded-full border-2 border-slate-900 comic-shadow-sm mb-2 transform -rotate-1">
            CREATIVE INK IN PROGRESS!
          </div>
          <h2 className="font-comic text-3xl md:text-4xl text-slate-900">
            Crafting {characterName ? `"${characterName}'s"` : 'Your'} Comic
          </h2>
          <p className="text-sm font-semibold text-slate-600 mt-1">
            Gemini is weaving dialogue and illustrating 5 vibrant panels...
          </p>
        </div>

        {/* Progress Bar */}
        <div className="relative z-10 mb-6">
          <div className="flex justify-between items-center text-xs font-bold text-slate-700 mb-1.5 font-comic-body">
            <span>{activeStepObj.label}</span>
            <span>{getProgressPercentage()}%</span>
          </div>
          <div className="w-full h-4 bg-slate-200 rounded-full border-2 border-slate-900 overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-amber-400 via-rose-500 to-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
        </div>

        {/* Error Banner */}
        {error ? (
          <div className="relative z-10 bg-rose-100 border-2 border-rose-600 rounded-2xl p-4 text-slate-900 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-comic text-lg text-rose-800">Oops! A Plot Twist Occurred</h4>
                <p className="text-sm text-slate-700 mt-1 font-medium">{error}</p>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={onRetry}
                className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 text-white font-bold text-sm rounded-xl comic-border comic-shadow-sm hover:bg-rose-700 active:scale-95 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                Retry Comic Creation
              </button>
            </div>
          </div>
        ) : (
          /* Step progression display */
          <div className="relative z-10 bg-white/90 border-2 border-slate-900 rounded-2xl p-4 space-y-2.5 max-h-64 overflow-y-auto">
            {STEPS_LIST.map((step) => {
              const status = getStepStatus(step.id);
              const StepIcon = step.icon;

              return (
                <div
                  key={step.id}
                  className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                    status === 'active'
                      ? 'bg-amber-100/90 border-amber-500 font-bold shadow-xs scale-102'
                      : status === 'completed'
                      ? 'bg-emerald-50/70 border-emerald-300 text-slate-600'
                      : 'bg-slate-50/50 border-slate-200 text-slate-400 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center border ${
                        status === 'active'
                          ? 'bg-amber-400 border-slate-900 text-slate-900'
                          : status === 'completed'
                          ? 'bg-emerald-500 border-emerald-700 text-white'
                          : 'bg-slate-200 border-slate-300 text-slate-500'
                      }`}
                    >
                      <StepIcon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-sm font-comic-body">{step.label}</span>
                  </div>

                  <div>
                    {status === 'active' && (
                      <Loader2 className="w-4 h-4 text-amber-600 animate-spin" />
                    )}
                    {status === 'completed' && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-5 text-center text-xs font-semibold text-slate-500 font-comic-body">
          ⚡ Free-tier rate limits respected • Smooth sequential rendering
        </div>
      </div>
    </div>
  );
};
