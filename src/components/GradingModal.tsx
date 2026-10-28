import React, { useState } from 'react';
import { Assignment, GradingRecord, StudentSubmission } from '../types';
import { useCourse } from '../context/CourseContext';
import {
  X,
  Award,
  CheckCircle2,
  FileText,
  Sliders,
  MessageSquare,
  Sparkles,
  Layers,
} from 'lucide-react';

interface GradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: Assignment;
  submission: StudentSubmission;
}

export const GradingModal: React.FC<GradingModalProps> = ({
  isOpen,
  onClose,
  assignment,
  submission,
}) => {
  const { gradeSubmission } = useCourse();

  // Initialize scores from previous grading or max
  const [rubricScores, setRubricScores] = useState<Record<string, number>>(() => {
    if (submission.grading?.rubricScores) {
      return submission.grading.rubricScores;
    }
    const initial: Record<string, number> = {};
    assignment.rubric.forEach((r) => {
      // Default to ~90%
      initial[r.id] = Math.round(r.maxScore * 0.9);
    });
    return initial;
  });

  const [feedback, setFeedback] = useState(
    submission.grading?.feedback ||
      '提示词演进过程逻辑清晰，从粗坯形态到细致光影层级递进明确。九宫格选图具有较高的审美判断力，反思深入，符合本阶段教学要求。'
  );
  const [teacherName, setTeacherName] = useState(
    submission.grading?.teacherName || '李教授 (主讲导师)'
  );

  if (!isOpen) return null;

  const totalScore = Object.values(rubricScores).reduce((a, b) => a + b, 0);

  const handleScoreChange = (rubricId: string, value: number, max: number) => {
    const clamped = Math.max(0, Math.min(max, value));
    setRubricScores((prev) => ({
      ...prev,
      [rubricId]: clamped,
    }));
  };

  const handleQuickTag = (tag: string) => {
    if (!feedback.includes(tag)) {
      setFeedback((prev) => prev + ` 【${tag}】`);
    }
  };

  const handleSaveGrade = (e: React.FormEvent) => {
    e.preventDefault();
    const record: GradingRecord = {
      gradedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      teacherName,
      rubricScores,
      totalScore,
      feedback,
      exemplaryRound: submission.rounds.length,
    };
    gradeSubmission(submission.id, record);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold">作业评审与多维量表评分</h3>
              <p className="text-xs text-slate-400">
                学生: {submission.studentName} ({submission.studentId}) · {assignment.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Two-Pane Body */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          {/* Left Pane (7 cols): Submission History & 9-Grids */}
          <div className="lg:col-span-7 p-6 overflow-y-auto space-y-6 bg-slate-50/50">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                学生提示词演进档案 (共 {submission.rounds.length} 轮)
              </span>
              <span className="text-xs font-mono text-slate-500">
                提交时间: {submission.submittedAt || '未归档'}
              </span>
            </div>

            {submission.rounds.map((round) => (
              <div
                key={round.roundNumber}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-900 text-white">
                      Round #{round.roundNumber}
                    </span>
                    <span className="text-xs font-bold text-slate-800">{round.roundTitle}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">{round.completedAt}</span>
                </div>

                <div className="text-xs">
                  <span className="font-semibold text-slate-700">构思设想：</span>
                  <p className="text-slate-600 mt-0.5 bg-slate-50 p-2 rounded">{round.conceptualIntent}</p>
                </div>

                <div className="text-xs">
                  <span className="font-semibold text-blue-700">正向提示词：</span>
                  <p className="font-mono text-slate-800 text-[11px] mt-0.5 bg-blue-50/40 p-2 rounded border border-blue-100">
                    {round.positivePrompt}
                  </p>
                </div>

                {round.negativePrompt && (
                  <div className="text-xs">
                    <span className="font-semibold text-red-600">负向提示词：</span>
                    <p className="font-mono text-slate-600 text-[11px] mt-0.5 bg-red-50/30 p-2 rounded">
                      {round.negativePrompt}
                    </p>
                  </div>
                )}

                {/* 9-Grid Mini view */}
                <div>
                  <span className="text-[11px] font-semibold text-slate-700 block mb-1.5">
                    本轮 9 宫格生成矩阵 (3 × 3)：
                  </span>
                  <div className="grid grid-cols-3 gap-1.5 bg-slate-50 p-2 rounded-lg border border-slate-200">
                    {round.images.map((img, i) => (
                      <div
                        key={img.id}
                        className={`relative rounded overflow-hidden border ${
                          img.isSelectedHero ? 'border-amber-500 ring-2 ring-amber-400' : 'border-slate-200'
                        }`}
                      >
                        <img src={img.url} alt={img.title} className="w-full aspect-square object-cover" />
                        {img.isSelectedHero && (
                          <div className="absolute top-0.5 left-0.5 bg-amber-500 text-slate-950 font-black text-[8px] px-1 rounded">
                            标杆
                          </div>
                        )}
                        <div className="absolute bottom-0 inset-x-0 bg-slate-950/80 text-white text-[8px] px-1 truncate font-mono">
                          #0{i + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-xs bg-emerald-50/50 p-2.5 rounded border border-emerald-100">
                  <span className="font-semibold text-emerald-800">本轮学生反思：</span>
                  <p className="text-emerald-700 mt-0.5">{round.reflectionAndCritique}</p>
                </div>
              </div>
            ))}

            <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs">
              <span className="font-bold text-slate-800 block mb-1">学生总体学术总结与反思：</span>
              <p className="text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded">
                {submission.finalSynthesisReflection || '无'}
              </p>
              {submission.attachments && submission.attachments.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <span className="font-bold text-slate-800 block mb-1.5">
                    学生上传的工程附件 ({submission.attachments.length} 份)：
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {submission.attachments.map((att) => (
                      <span
                        key={att.id}
                        className="px-2.5 py-1 rounded bg-blue-50 border border-blue-200 text-blue-800 font-mono text-[11px]"
                      >
                        {att.fileName} · {att.fileSize}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Pane (5 cols): Rubric Scoring Form */}
          <form onSubmit={handleSaveGrade} className="lg:col-span-5 p-6 flex flex-col justify-between bg-white overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    多维度量表评分
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500">折算总分:</span>
                  <span className="text-2xl font-black text-blue-600 ml-1.5 font-mono">{totalScore}</span>
                  <span className="text-xs text-slate-400"> / 100</span>
                </div>
              </div>

              {/* Rubric Sliders */}
              <div className="space-y-4">
                {assignment.rubric.map((r) => {
                  const score = rubricScores[r.id] ?? r.maxScore;
                  return (
                    <div key={r.id} className="space-y-1.5 p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800">{r.name}</span>
                        <div className="flex items-center gap-1 font-mono font-bold text-blue-700">
                          <span>{score}</span>
                          <span className="text-slate-400 text-[10px]">/ {r.maxScore}分</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500">{r.description}</p>
                      <input
                        type="range"
                        min={0}
                        max={r.maxScore}
                        value={score}
                        onChange={(e) => handleScoreChange(r.id, parseInt(e.target.value) || 0, r.maxScore)}
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                    </div>
                  );
                })}
              </div>

              {/* Quick Feedback Tags */}
              <div>
                <span className="text-xs font-semibold text-slate-700 block mb-1.5">
                  快速批注关键词：
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    '提示词递进明显',
                    '材质质感出众',
                    '九宫格选优合理',
                    '负向词控制精准',
                    '反思深度深刻',
                    '建议强化镜头语言',
                    '构图视角有待丰富',
                  ].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleQuickTag(tag)}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Teacher Comments */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  学术评语与指导反馈 (将呈现在学生报告与成绩册) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="针对学生的提示词构思、9宫格艺术性及迭代反思给出评语..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  评审教师署名
                </label>
                <input
                  type="text"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                取消
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>保存评分与评语</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
