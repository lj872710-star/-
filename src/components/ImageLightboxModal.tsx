import React, { useState } from 'react';
import { GeneratedImage } from '../types';
import { X, Check, Copy, Sparkles, Award } from 'lucide-react';

interface ImageLightboxModalProps {
  image: GeneratedImage | null;
  onClose: () => void;
  onSetHero?: (imageId: string) => void;
  isHero?: boolean;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  image,
  onClose,
  onSetHero,
  isHero,
}) => {
  const [copied, setCopied] = useState(false);

  if (!image) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(image.promptSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl flex flex-col md:flex-row">
        {/* Left: High-Res Image View */}
        <div className="relative md:w-3/5 bg-black flex items-center justify-center p-4">
          <img
            src={image.url}
            alt={image.title}
            className="w-full h-auto max-h-[70vh] object-contain rounded-lg shadow-lg border border-slate-800"
          />
          {isHero && (
            <div className="absolute top-6 left-6 px-3 py-1 bg-amber-500/90 text-slate-950 font-bold text-xs rounded-full shadow-md flex items-center gap-1.5 backdrop-blur-xs">
              <Award className="w-3.5 h-3.5" />
              <span>本轮主推标杆变体</span>
            </div>
          )}
        </div>

        {/* Right: Technical Inspector & Details */}
        <div className="md:w-2/5 p-6 flex flex-col justify-between text-slate-200 bg-slate-900 border-t md:border-t-0 md:border-l border-slate-800">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-mono text-blue-400">#SEED: {image.seed}</span>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4">
              <h3 className="text-base font-bold text-white">{image.title}</h3>
              <p className="text-xs text-slate-400 mt-1">{image.styleTag}</p>
            </div>

            <div className="mt-6 space-y-3">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  提示词切片 (Prompt Snippet)
                </span>
                <div className="mt-1.5 p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs font-mono text-slate-300 leading-relaxed max-h-32 overflow-y-auto">
                  {image.promptSnippet || '无特定提示词备注'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/80">
                  <div className="text-slate-500">画幅比例</div>
                  <div className="font-semibold text-slate-200 mt-0.5">{image.aspectRatio}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/80">
                  <div className="text-slate-500">九宫格阵列位置</div>
                  <div className="font-semibold text-slate-200 mt-0.5">3 × 3 采样节点</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center gap-2">
            {onSetHero && (
              <button
                onClick={() => {
                  onSetHero(image.id);
                  onClose();
                }}
                className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                  isHero
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isHero ? '已为主推标杆' : '设为本轮主推标杆'}</span>
              </button>
            )}

            <button
              onClick={handleCopy}
              className="py-2 px-3 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center gap-1 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '已复制' : '复制词'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
