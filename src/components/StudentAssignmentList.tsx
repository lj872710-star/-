import React from 'react';
import { useCourse } from '../context/CourseContext';
import { Assignment, StudentSubmission } from '../types';
import { evaluateStudentBadges } from '../utils/badgeSystem';
import { StudentBadgeShowcase } from './StudentBadgeShowcase';
import {
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  ArrowRight,
  Award,
  Layers,
  ShieldCheck,
  Zap,
  Upload,
} from 'lucide-react';

interface StudentAssignmentListProps {
  onSelectAssignment: (assignmentId: string) => void;
  onOpenPdfReport: (assignment: Assignment, submission: StudentSubmission) => void;
  onOpenQR: () => void;
  onOpenUploadPortal: (assignmentId?: string) => void;
}

export const StudentAssignmentList: React.FC<StudentAssignmentListProps> = ({
  onSelectAssignment,
  onOpenPdfReport,
  onOpenQR,
  onOpenUploadPortal,
}) => {
  const { assignments, submissions, currentStudent, getSubmissionForStudent } = useCourse();

  const classroomAssignments = assignments.filter((a) => !a.isFinalExam);
  const finalExam = assignments.find((a) => a.isFinalExam);

  // Compute stats for current student
  const totalAssignments = assignments.length;
  let completedCount = 0;
  let gradedCount = 0;
  let sumScore = 0;

  assignments.forEach((asg) => {
    const sub = getSubmissionForStudent(asg.id, currentStudent.studentId);
    if (sub?.status === 'submitted' || sub?.status === 'graded') {
      completedCount++;
    }
    if (sub?.status === 'graded' && sub.grading) {
      gradedCount++;
      sumScore += sub.grading.totalScore;
    }
  });

  const avgScore = gradedCount > 0 ? (sumScore / gradedCount).toFixed(1) : '--';

  // Evaluate student badges & consistency metrics
  const badgeSummary = evaluateStudentBadges(
    currentStudent.studentId,
    submissions,
    assignments
  );

  // Find next incomplete assignment for quick milestone jump
  const handleJumpToNextMilestoneAssignment = () => {
    const nextAsg =
      assignments.find((a) => {
        const sub = getSubmissionForStudent(a.id, currentStudent.studentId);
        return !sub || sub.rounds.length < 3 || sub.status === 'draft';
      }) || assignments[0];
    if (nextAsg) {
      onSelectAssignment(nextAsg.id);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Student Profile Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-lg border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
              <span className="font-semibold text-blue-300">2026年秋季学期 · 在线考核中心</span>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-white">课程：《人工智能与数字艺术》</span>
              <span aria-hidden="true">·</span>
              <span className="text-amber-300 font-semibold">{badgeSummary.studentRankTitle}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              《人工智能与数字艺术》· {currentStudent.name} 同学
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              本课程共设 <span className="font-bold text-white">6 次《……英雄榜》课堂作业</span> 与{' '}
              <span className="font-bold text-amber-300">1 次期末《数字艺术巅峰英雄榜》</span>。每次作业须完成不少于{' '}
              <span className="font-bold text-blue-300">3 轮提示词渐进迭代</span>，记录对应的{' '}
              <span className="font-bold text-blue-300">9 宫格图像生成矩阵</span>，并导出官方总结 PDF 报告。
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="px-4 py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-center">
              <div className="text-[11px] text-slate-300">完成进度</div>
              <div className="text-xl font-bold mt-0.5 font-mono">
                {completedCount}{' '}
                <span className="text-xs text-slate-400 font-normal">/ {totalAssignments}</span>
              </div>
            </div>
            <div className="px-4 py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-center">
              <div className="text-[11px] text-slate-300">荣誉徽章</div>
              <div className="text-xl font-bold text-emerald-300 mt-0.5 font-mono">
                {badgeSummary.unlockedCount}{' '}
                <span className="text-xs text-slate-400 font-normal">/ {badgeSummary.totalCount}</span>
              </div>
            </div>
            <div className="px-4 py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-center">
              <div className="text-[11px] text-slate-300">平均成绩</div>
              <div className="text-xl font-bold text-amber-300 mt-0.5 font-mono">{avgScore}</div>
            </div>
            <button
              onClick={() => onOpenUploadPortal()}
              className="px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-colors shadow-sm flex flex-col items-center justify-center gap-1"
            >
              <Upload className="w-4 h-4" />
              <span>作业上传端口</span>
            </button>
            <button
              onClick={onOpenQR}
              className="px-3.5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors shadow-sm flex flex-col items-center justify-center gap-1"
            >
              <Clock className="w-4 h-4" />
              <span>切换学号</span>
            </button>
          </div>
        </div>
      </div>

      {/* Student Badge System Visualization (3-Round Evolution Milestones & Image Generation Consistency) */}
      <StudentBadgeShowcase
        badgeSummary={badgeSummary}
        onSelectAssignmentForMilestone={handleJumpToNextMilestoneAssignment}
      />

      {/* Final Exam Spotlight (期末综合考核大作业) */}
      {finalExam && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-600" />
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                期末综合考核大作业 (Final Capstone Exam)
              </h2>
            </div>
            <span className="text-xs font-semibold text-amber-700">
              综合权重占比 40%
            </span>
          </div>

          {(() => {
            const sub = getSubmissionForStudent(finalExam.id, currentStudent.studentId);
            const roundCount = sub?.rounds?.length || 0;
            const isGraded = sub?.status === 'graded';
            const isSubmitted = sub?.status === 'submitted';

            return (
              <div className="p-6 rounded-2xl border border-amber-300 bg-gradient-to-br from-amber-50/50 via-white to-amber-50/20 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <span className="font-bold text-amber-900">综合考核 #07</span>
                    <span aria-hidden="true">·</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      截止时间: {finalExam.deadline}
                    </span>
                    {roundCount >= 3 && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-blue-700 font-semibold flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5" />
                          已达成3轮演进里程碑
                        </span>
                      </>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-slate-900">{finalExam.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                    {finalExam.conceptOverview}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 pt-1">
                    <span className="font-medium text-slate-700">要求：不少于 3 轮提示词演化</span>
                    <span aria-hidden="true">·</span>
                    <span>每轮 9 张图九宫格</span>
                    <span aria-hidden="true">·</span>
                    <span>深度理论反思</span>
                    <span aria-hidden="true">·</span>
                    <span>学术 PDF 总结归档</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row md:flex-col items-end gap-3 shrink-0">
                  {/* Status Indicator */}
                  <div className="text-right">
                    {isGraded ? (
                      <div>
                        <span className="text-xs text-emerald-700 font-semibold">已评分归档</span>
                        <div className="text-2xl font-black text-emerald-600 font-mono">
                          {sub?.grading?.totalScore} <span className="text-xs font-normal">分</span>
                        </div>
                      </div>
                    ) : isSubmitted ? (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                        <span>已提交 ({roundCount} 轮)，待评分</span>
                      </div>
                    ) : roundCount > 0 ? (
                      <div className="text-xs text-slate-500">
                        草稿中: 已完成 <span className="font-bold text-slate-900">{roundCount}</span> / 3 轮
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400">尚未开始记录</div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {sub && roundCount > 0 && (
                      <button
                        onClick={() => onOpenPdfReport(finalExam, sub)}
                        className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                        <span>PDF 报告</span>
                      </button>
                    )}
                    <button
                      onClick={() => onOpenUploadPortal(finalExam.id)}
                      className="px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>上传作业</span>
                    </button>
                    <button
                      onClick={() => onSelectAssignment(finalExam.id)}
                      className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                    >
                      <span>{roundCount > 0 ? '工作台精修' : '开启期末作业'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Classroom Assignments (6次课堂作业) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              学期课堂作业 (6次平时作业 · 每次各占 10%)
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            全部作业均要求概念说明、不少于3轮提示词演进、9宫格图像生成及PDF总结报告
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {classroomAssignments.map((assignment) => {
            const sub = getSubmissionForStudent(assignment.id, currentStudent.studentId);
            const roundCount = sub?.rounds?.length || 0;
            const isGraded = sub?.status === 'graded';
            const isSubmitted = sub?.status === 'submitted';
            const hasThreeRoundMilestone = roundCount >= 3;
            const hasHighConsistency =
              hasThreeRoundMilestone &&
              sub?.rounds.every(
                (r) =>
                  r.images?.length === 9 &&
                  r.negativePrompt?.trim().length >= 10 &&
                  r.positivePrompt?.trim().length >= 20
              );

            return (
              <div
                key={assignment.id}
                className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                    <span className="font-bold text-slate-900">
                      0{assignment.assignmentNumber}. 课堂作业
                    </span>
                    <span>权重: {assignment.weightPercent}%</span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 mt-2 line-clamp-1">
                    {assignment.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
                    {assignment.conceptOverview}
                  </p>

                  {/* Milestone Indicators */}
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                    {hasThreeRoundMilestone ? (
                      <span className="text-blue-700 font-medium inline-flex items-center gap-1">
                        <Zap className="w-3 h-3 text-blue-600" />
                        <span>已达成3轮演进</span>
                      </span>
                    ) : (
                      <span>○ 待达成3轮演进</span>
                    )}
                    <span aria-hidden="true">·</span>
                    {hasHighConsistency ? (
                      <span className="text-emerald-700 font-medium inline-flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        <span>高一致性九宫格</span>
                      </span>
                    ) : (
                      <span>9图矩阵标准</span>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{assignment.deadline.split(' ')[0]} 截止</span>
                    </div>
                    <div className="font-medium">
                      {isGraded ? (
                        <span className="text-emerald-700 font-bold">
                          得分: {sub?.grading?.totalScore} 分
                        </span>
                      ) : isSubmitted ? (
                        <span className="text-blue-700">已提交 ({roundCount}轮)</span>
                      ) : roundCount > 0 ? (
                        <span className="text-amber-700">草稿中 ({roundCount}/3轮)</span>
                      ) : (
                        <span className="text-slate-400">未开始</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  {sub && roundCount > 0 ? (
                    <button
                      onClick={() => onOpenPdfReport(assignment, sub)}
                      className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      <span>PDF报告</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-400">需完成≥3轮</span>
                  )}

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onOpenUploadPortal(assignment.id)}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>上传作业</span>
                    </button>
                    <button
                      onClick={() => onSelectAssignment(assignment.id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-2xs transition-colors"
                    >
                      <span>{roundCount > 0 ? '工作台' : '记录'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
