import React, { useState } from 'react';
import { BadgeSystemSummary, StudentBadge } from '../utils/badgeSystem';
import {
  Award,
  Sparkles,
  ShieldCheck,
  Zap,
  Layers,
  CheckCircle2,
  Lock,
  TrendingUp,
  Sliders,
  ChevronDown,
  ChevronUp,
  ArrowRight,
} from 'lucide-react';

interface StudentBadgeShowcaseProps {
  badgeSummary: BadgeSystemSummary;
  onSelectAssignmentForMilestone?: () => void;
}

export const StudentBadgeShowcase: React.FC<StudentBadgeShowcaseProps> = ({
  badgeSummary,
  onSelectAssignmentForMilestone,
}) => {
  const [filterCategory, setFilterCategory] = useState<'all' | 'unlocked' | 'evolution' | 'consistency'>('all');
  const [selectedBadge, setSelectedBadge] = useState<StudentBadge | null>(null);
  const [showConsistencyDiagnostic, setShowConsistencyDiagnostic] = useState(false);

  const { badges, unlockedCount, totalCount, metrics, studentRankTitle } = badgeSummary;

  const filteredBadges = badges.filter((b) => {
    if (filterCategory === 'unlocked') return b.unlocked;
    if (filterCategory === 'evolution') return b.category === 'evolution' || b.category === 'early';
    if (filterCategory === 'consistency') return b.category === 'consistency';
    return true;
  });

  const renderBadgeIcon = (badge: StudentBadge) => {
    const isUnlocked = badge.unlocked;
    const baseClass = 'w-5 h-5';
    switch (badge.id) {
      case 'badge_early_3round_pioneer':
        return <Zap className={`${baseClass} ${isUnlocked ? 'text-blue-600' : 'text-slate-400'}`} />;
      case 'badge_consistency_master':
        return <ShieldCheck className={`${baseClass} ${isUnlocked ? 'text-emerald-600' : 'text-slate-400'}`} />;
      case 'badge_multi_evolution_veteran':
        return <Layers className={`${baseClass} ${isUnlocked ? 'text-indigo-600' : 'text-slate-400'}`} />;
      case 'badge_negative_guard':
        return <Sliders className={`${baseClass} ${isUnlocked ? 'text-teal-600' : 'text-slate-400'}`} />;
      default:
        return <Award className={`${baseClass} ${isUnlocked ? 'text-amber-500' : 'text-slate-400'}`} />;
    }
  };

  const getAccentStyles = (badge: StudentBadge) => {
    if (!badge.unlocked) {
      return {
        iconBg: 'bg-slate-100 border-slate-200',
        barColor: 'bg-slate-400',
        accentText: 'text-slate-500',
      };
    }
    switch (badge.accentColor) {
      case 'blue':
        return {
          iconBg: 'bg-blue-50 border-blue-200',
          barColor: 'bg-blue-600',
          accentText: 'text-blue-700',
        };
      case 'emerald':
        return {
          iconBg: 'bg-emerald-50 border-emerald-200',
          barColor: 'bg-emerald-600',
          accentText: 'text-emerald-700',
        };
      case 'indigo':
        return {
          iconBg: 'bg-indigo-50 border-indigo-200',
          barColor: 'bg-indigo-600',
          accentText: 'text-indigo-700',
        };
      case 'teal':
        return {
          iconBg: 'bg-teal-50 border-teal-200',
          barColor: 'bg-teal-600',
          accentText: 'text-teal-700',
        };
      default:
        return {
          iconBg: 'bg-amber-50 border-amber-200',
          barColor: 'bg-amber-500',
          accentText: 'text-amber-700',
        };
    }
  };

  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Top Summary Header */}
      <div className="p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Award className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-slate-800">学术成就与能力徽章系统</span>
            <span aria-hidden="true">·</span>
            <span>学术头衔：{studentRankTitle}</span>
            <span aria-hidden="true">·</span>
            <span>
              已点亮 <strong className="text-slate-900">{unlockedCount}</strong> / {totalCount} 枚
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            三轮演进里程碑 & 九宫格生成一致性评估
          </h2>
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            系统实时追踪每次作业的「提前达成 3 轮提示词演化」进度与「跨轮次 9 宫格图像生成一致性指数」，自动授予数字学术徽章。
          </p>
        </div>

        {/* Key Consistency & Evolution Metrics Strip */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 shrink-0">
          <div className="text-left">
            <div className="text-[11px] text-slate-500">提前达成3轮里程碑</div>
            <div className="text-lg font-black text-slate-900 font-mono mt-0.5">
              {metrics.earlyThreeRoundCount}{' '}
              <span className="text-xs font-normal text-slate-500">
                次 (共完成 {metrics.totalRoundsCompleted} 轮)
              </span>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-200 hidden sm:block" />

          <div className="text-left">
            <div className="text-[11px] text-slate-500">图像生成一致性指数</div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span
                className={`text-lg font-black font-mono ${
                  metrics.overallConsistencyScore >= 85
                    ? 'text-emerald-600'
                    : metrics.overallConsistencyScore >= 70
                    ? 'text-blue-600'
                    : 'text-slate-700'
                }`}
              >
                {metrics.overallConsistencyScore}%
              </span>
              <span className="text-[11px] text-slate-500">
                {metrics.overallConsistencyScore >= 85
                  ? '● 高一致性'
                  : metrics.overallConsistencyScore > 0
                  ? '● 稳定演进'
                  : '○ 待记录'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowConsistencyDiagnostic(!showConsistencyDiagnostic)}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1 whitespace-nowrap shrink-0"
          >
            <span>一致性诊断明细</span>
            {showConsistencyDiagnostic ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Expandable Consistency Diagnostic Breakdown */}
      {showConsistencyDiagnostic && (
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-150">
          <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">提示词语义递进连贯度</span>
              <span className="font-mono font-bold text-blue-600">{metrics.promptCoherenceScore}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${metrics.promptCoherenceScore}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500">
              检测跨轮次核心主体词保留率与修饰词、构思反思的完整度
            </p>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">九宫格完备与标杆选优率</span>
              <span className="font-mono font-bold text-emerald-600">{metrics.gridCompletionRate}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 transition-all duration-300"
                style={{ width: `${metrics.gridCompletionRate}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500">
              每轮完整生成 9 张变体并明确标记主推标杆方案的比例
            </p>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">负向词杂讯过滤稳定度</span>
              <span className="font-mono font-bold text-teal-600">{metrics.negativeFilterStability}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-600 transition-all duration-300"
                style={{ width: `${metrics.negativeFilterStability}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500">
              各轮次持续配置有效 Negative Prompts 抑制畸变与噪点的比例
            </p>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">画幅比例与参数一致性</span>
              <span className="font-mono font-bold text-indigo-600">{metrics.parameterProgressionScore}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 transition-all duration-300"
                style={{ width: `${metrics.parameterProgressionScore}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500">
              同组对比实验中保持画幅比例与模型参数控制变量的规范度
            </p>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="px-6 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg w-fit">
          <button
            type="button"
            onClick={() => setFilterCategory('all')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              filterCategory === 'all'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            全部徽章 ({badges.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterCategory('unlocked')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              filterCategory === 'unlocked'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            已点亮 ({unlockedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterCategory('evolution')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              filterCategory === 'evolution'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            3轮演进里程碑
          </button>
          <button
            type="button"
            onClick={() => setFilterCategory('consistency')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              filterCategory === 'consistency'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            图像生成一致性
          </button>
        </div>

        <span className="text-[11px] text-slate-400">
          点击任意徽章卡片可查看详细解锁依据与关联作业
        </span>
      </div>

      {/* Badge Cards Grid */}
      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {filteredBadges.map((badge) => {
          const styles = getAccentStyles(badge);
          const isSelected = selectedBadge?.id === badge.id;

          return (
            <div
              key={badge.id}
              onClick={() => setSelectedBadge(isSelected ? null : badge)}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-4 ${
                badge.unlocked
                  ? isSelected
                    ? 'border-slate-900 bg-slate-50/70 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                  : 'border-slate-200/70 bg-slate-50/40 opacity-80 hover:opacity-100'
              }`}
            >
              <div className="space-y-3">
                {/* Icon & Status Row */}
                <div className="flex items-start justify-between gap-2">
                  <div
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${styles.iconBg}`}
                  >
                    {renderBadgeIcon(badge)}
                  </div>
                  <div className="text-right">
                    {badge.unlocked ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>已点亮</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                        <Lock className="w-3 h-3" />
                        <span>待解锁</span>
                      </span>
                    )}
                    <div className={`text-[10px] font-mono mt-0.5 ${styles.accentText}`}>
                      {badge.metricHighlight}
                    </div>
                  </div>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{badge.title}</h3>
                  <div className="text-[10px] text-slate-400 font-mono">{badge.englishTitle}</div>
                  <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
                    {badge.description}
                  </p>
                </div>
              </div>

              {/* Progress Bar & Criteria */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 truncate">{badge.progressLabel}</span>
                  <span className="font-mono font-bold text-slate-700">{badge.progress}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${styles.barColor}`}
                    style={{ width: `${badge.progress}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Badge Inspector Drawer */}
      {selectedBadge && (
        <div className="px-6 py-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-150">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-white">{selectedBadge.title}</span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-300 font-mono">{selectedBadge.englishTitle}</span>
              <span className="text-slate-400">·</span>
              <span className={selectedBadge.unlocked ? 'text-emerald-400 font-semibold' : 'text-amber-300'}>
                {selectedBadge.unlocked ? '● 已达成荣誉条件' : '○ 进行中挑战'}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              解锁标准：{selectedBadge.criteriaText}
              {selectedBadge.relatedAssignmentTitle && (
                <span className="text-slate-400">
                  {' '}
                  · 关联作业：{selectedBadge.relatedAssignmentTitle}
                </span>
              )}
              {selectedBadge.unlockedAt && (
                <span className="text-slate-400 font-mono"> · 达成时间：{selectedBadge.unlockedAt}</span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!selectedBadge.unlocked && onSelectAssignmentForMilestone && (
              <button
                type="button"
                onClick={onSelectAssignmentForMilestone}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
              >
                <span>前往作业达成此徽章</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setSelectedBadge(null)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
            >
              收起详情
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
