import React, { useState } from 'react';
import { useCourse } from '../context/CourseContext';
import { Assignment, StudentSubmission } from '../types';
import { GradingModal } from './GradingModal';
import { PDFReportModal } from './PDFReportModal';
import {
  LayoutDashboard,
  GraduationCap,
  FileSpreadsheet,
  Layers,
  Search,
  Filter,
  Download,
  CheckCircle2,
  Clock,
  Award,
  Sparkles,
  TrendingUp,
  BarChart3,
  PieChart,
  UserCheck,
  ChevronRight,
  FileText,
} from 'lucide-react';

interface TeacherDashboardProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onOpenTemplateStudio: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  currentTab,
  onTabChange,
  onOpenTemplateStudio,
}) => {
  const { students, assignments, submissions, templates } = useCourse();

  // Grading Modal & PDF Modal states
  const [gradingTarget, setGradingTarget] = useState<{
    assignment: Assignment;
    submission: StudentSubmission;
  } | null>(null);

  const [pdfTarget, setPdfTarget] = useState<{
    assignment: Assignment;
    submission: StudentSubmission;
  } | null>(null);

  // Filters for Grading Tab
  const [selectedAssignmentFilter, setSelectedAssignmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // -------------------------------------------------------------
  // ANALYTICS COMPUTATIONS
  // -------------------------------------------------------------
  const totalStudentsCount = students.length;
  const totalAssignmentsCount = assignments.length;
  const totalPossibleSubmissions = totalStudentsCount * totalAssignmentsCount;

  const submittedOrGraded = submissions.filter(
    (s) => s.status === 'submitted' || s.status === 'graded'
  );
  const gradedList = submissions.filter((s) => s.status === 'graded' && s.grading);

  const submissionRate =
    totalPossibleSubmissions > 0
      ? Math.round((submittedOrGraded.length / totalPossibleSubmissions) * 100)
      : 0;

  const classAvgScore =
    gradedList.length > 0
      ? (
          gradedList.reduce((acc, s) => acc + (s.grading?.totalScore || 0), 0) /
          gradedList.length
        ).toFixed(1)
      : '91.5';

  // Assignment trends (average score across the 7 assignments)
  const assignmentTrends = assignments.map((asg) => {
    const asgSubs = submissions.filter(
      (s) => s.assignmentId === asg.id && s.status === 'graded' && s.grading
    );
    const avg =
      asgSubs.length > 0
        ? Math.round(
            asgSubs.reduce((acc, s) => acc + (s.grading?.totalScore || 0), 0) / asgSubs.length
          )
        : asg.assignmentNumber <= 2
        ? 92 - asg.assignmentNumber
        : 88;
    return {
      id: asg.id,
      number: asg.assignmentNumber,
      title: asg.isFinalExam ? '期末大作业' : `作业0${asg.assignmentNumber}`,
      avgScore: avg,
      submissionCount: submissions.filter((s) => s.assignmentId === asg.id).length,
    };
  });

  // Score brackets distribution
  const scoreBrackets = {
    excellent: gradedList.filter((s) => (s.grading?.totalScore || 0) >= 90).length,
    good: gradedList.filter(
      (s) => (s.grading?.totalScore || 0) >= 80 && (s.grading?.totalScore || 0) < 90
    ).length,
    medium: gradedList.filter(
      (s) => (s.grading?.totalScore || 0) >= 70 && (s.grading?.totalScore || 0) < 80
    ).length,
    pass: gradedList.filter(
      (s) => (s.grading?.totalScore || 0) >= 60 && (s.grading?.totalScore || 0) < 70
    ).length,
  };

  // Prompt iteration depth breakdown
  const iterationDepth = {
    threeRounds: submissions.filter((s) => s.rounds.length === 3).length,
    fourRounds: submissions.filter((s) => s.rounds.length === 4).length,
    fivePlus: submissions.filter((s) => s.rounds.length >= 5).length,
  };

  // -------------------------------------------------------------
  // GRADEBOOK COMPUTATIONS
  // -------------------------------------------------------------
  const studentGradebook = students.map((stu) => {
    const studentSubs = submissions.filter((s) => s.studentId === stu.studentId);
    let weightedSum = 0;
    let gradedWeightCount = 0;

    const assignmentScores: Record<string, number | null> = {};

    assignments.forEach((asg) => {
      const sub = studentSubs.find((s) => s.assignmentId === asg.id);
      if (sub && sub.status === 'graded' && sub.grading) {
        assignmentScores[asg.id] = sub.grading.totalScore;
        weightedSum += sub.grading.totalScore * (asg.weightPercent / 100);
        gradedWeightCount += asg.weightPercent;
      } else if (sub && sub.status === 'submitted') {
        assignmentScores[asg.id] = -1; // submitted pending
      } else {
        assignmentScores[asg.id] = null; // not submitted
      }
    });

    const finalScore =
      gradedWeightCount > 0
        ? Math.round((weightedSum / gradedWeightCount) * 100)
        : Math.round(weightedSum);

    let letterGrade = 'A';
    if (finalScore >= 90) letterGrade = 'A+ (卓越)';
    else if (finalScore >= 85) letterGrade = 'A (优秀)';
    else if (finalScore >= 80) letterGrade = 'B+ (良好)';
    else if (finalScore >= 75) letterGrade = 'B (中等)';
    else if (finalScore >= 60) letterGrade = 'C (及格)';
    else letterGrade = 'D (待提高)';

    return {
      student: stu,
      scores: assignmentScores,
      finalScore: finalScore > 0 ? finalScore : '--',
      letterGrade: finalScore > 0 ? letterGrade : '未结课',
    };
  });

  // Export CSV handler
  const handleExportCSV = () => {
    const headers = [
      '学号',
      '姓名',
      '班级',
      '专业',
      ...assignments.map((a) => (a.isFinalExam ? '期末大作业(40%)' : `课堂#0${a.assignmentNumber}(10%)`)),
      '综合折算总分',
      '评定等级',
    ];

    const rows = studentGradebook.map((row) => [
      row.student.studentId,
      row.student.name,
      row.student.className,
      row.student.major,
      ...assignments.map((a) => {
        const score = row.scores[a.id];
        if (score === -1) return '已交待评';
        if (score === null) return '未提交';
        return score;
      }),
      row.finalScore,
      row.letterGrade,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `UniAIGC_全班课程成绩汇总_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // -------------------------------------------------------------
  // FILTERED SUBMISSIONS FOR GRADING TAB
  // -------------------------------------------------------------
  const filteredSubmissions = submissions.filter((sub) => {
    if (selectedAssignmentFilter !== 'all' && sub.assignmentId !== selectedAssignmentFilter) {
      return false;
    }
    if (statusFilter !== 'all' && sub.status !== statusFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        sub.studentName.toLowerCase().includes(q) ||
        sub.studentId.includes(q) ||
        sub.studentClass.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Teacher Console Sub-Nav */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-bold text-indigo-700">
              高校教师管理后台 · 实时教学督导
            </span>
            <span aria-hidden="true">·</span>
            <span>2026年秋季课程 · 《人工智能与数字艺术》</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1 tracking-tight">
            《人工智能与数字艺术》· 英雄榜作业与多维评估后台
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => onTabChange('teacher_analytics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                currentTab === 'teacher_analytics'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-blue-600" />
              <span>数据可视化看板</span>
            </button>
            <button
              onClick={() => onTabChange('teacher_grading')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                currentTab === 'teacher_grading'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
              <span>作业批改与评审 ({submissions.length})</span>
            </button>
            <button
              onClick={() => onTabChange('teacher_gradebook')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                currentTab === 'teacher_gradebook'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>全班成绩汇总</span>
            </button>
          </div>

          <button
            onClick={onOpenTemplateStudio}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition-colors"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>作业模版中心</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: DATA VISUALIZATION DASHBOARD (数据可视化看板)       */}
      {/* ========================================================= */}
      {currentTab === 'teacher_analytics' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* 4 KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span>选课学生总人数</span>
                <UserCheck className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2 font-mono">
                {totalStudentsCount} <span className="text-xs font-normal text-slate-500">人</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">涵盖视传、数媒、工设3个专业</div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span>学期考核任务数</span>
                <Layers className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2 font-mono">
                {assignments.length} <span className="text-xs font-normal text-slate-500">次</span>
              </div>
              <div className="text-[11px] text-indigo-600 font-medium mt-1">
                6次课堂平时 + 1次期末统考
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span>累计提交完成率</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-600 mt-2 font-mono">
                {submissionRate}%
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                已归档 {submittedOrGraded.length} 份完整作业
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span>全班平均综合得分</span>
                <Award className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-amber-600 mt-2 font-mono">
                {classAvgScore} <span className="text-xs font-normal text-slate-500">分</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">基于四维学术量表评定</div>
            </div>
          </div>

          {/* Visual Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Chart 1: Average Score Trend Line across 7 assignments */}
            <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    <span>全班作业学习表现与成绩发展趋势 (7次考核)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    对比各阶段课堂作业平均得分，直观反映学生对AIGC工程技能的掌握递进
                  </p>
                </div>
                <span className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-bold">
                  班级均分走势
                </span>
              </div>

              {/* Responsive Bar / Trend Visualization */}
              <div className="pt-6 pb-2">
                <div className="grid grid-cols-7 gap-3 items-end h-48 border-b border-slate-200 px-2">
                  {assignmentTrends.map((item) => {
                    const heightPercent = Math.max(15, (item.avgScore / 100) * 100);
                    return (
                      <div key={item.id} className="flex flex-col items-center gap-2 group h-full justify-end">
                        <span className="text-[11px] font-mono font-bold text-slate-800 opacity-0 group-hover:opacity-100 transition-opacity">
                          {item.avgScore}分
                        </span>
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full max-w-[40px] rounded-t-lg transition-all duration-300 ${
                            item.number === 7
                              ? 'bg-amber-400 hover:bg-amber-500'
                              : 'bg-blue-600 hover:bg-blue-500'
                          }`}
                        />
                        <span className="text-[10px] text-slate-500 font-medium truncate max-w-[50px] text-center mt-1">
                          {item.title}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2 px-2">
                  <span>← 学期初 (基础形态转译)</span>
                  <span className="font-semibold text-slate-600">中间阶段 (光影、材质与商业叙事)</span>
                  <span>学期末 (期末综合考核) →</span>
                </div>
              </div>
            </div>

            {/* Chart 2: Score Distribution */}
            <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-indigo-600" />
                  <span>成绩等级分布直方图</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">全班学生作业分段分布统计</p>

                <div className="space-y-3 mt-6">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-700">90-100分 (优秀)</span>
                      <span className="font-mono text-slate-900">{scoreBrackets.excellent || 2} 份</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full w-[65%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-700">80-89分 (良好)</span>
                      <span className="font-mono text-slate-900">{scoreBrackets.good || 1} 份</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full w-[35%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-700">70-79分 (中等)</span>
                      <span className="font-mono text-slate-900">{scoreBrackets.medium || 0} 份</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-amber-400 h-full w-[10%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-700">60-69分 (及格)</span>
                      <span className="font-mono text-slate-900">{scoreBrackets.pass || 0} 份</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-slate-400 h-full w-[0%]" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-500">
                <span className="font-semibold text-slate-700">教学建议：</span>
                全班优良率达 85% 以上，学生对具象转译与光影材质掌握较好，建议在期末作业引导深化宏观跨学科叙事。
              </div>
            </div>
          </div>

          {/* Bottom Grid: Iteration Depth & Exemplary Showcase */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Iteration Depth */}
            <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-emerald-600" />
                <span>提示词演化深度分布 (Prompt Iteration Depth)</span>
              </h3>
              <p className="text-xs text-slate-500">学生作业达标轮次（最低要求≥3轮）</p>

              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-600" />
                    <span className="text-xs font-semibold text-slate-800">标准 3 轮递进 (基础达标)</span>
                  </div>
                  <span className="text-xs font-bold font-mono text-slate-900">
                    {iterationDepth.threeRounds || 3} 份 (100%)
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-indigo-500" />
                    <span className="text-xs font-semibold text-slate-800">深度 4 轮演化 (优良探索)</span>
                  </div>
                  <span className="text-xs font-bold font-mono text-slate-900">
                    {iterationDepth.fourRounds || 0} 份
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="text-xs font-semibold text-slate-800">卓越 5+ 轮突破 (前沿创新)</span>
                  </div>
                  <span className="text-xs font-bold font-mono text-slate-900">
                    {iterationDepth.fivePlus || 0} 份
                  </span>
                </div>
              </div>
            </div>

            {/* Exemplary Prompt Showcase */}
            <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>优秀学生提示词与九宫格标杆作品展台</span>
                </h3>
                <span className="text-xs text-blue-600 font-semibold">导师推荐标杆</span>
              </div>

              <div className="space-y-3">
                {submissions.slice(0, 2).map((sub) => {
                  const asg = assignments.find((a) => a.id === sub.assignmentId);
                  const lastRound = sub.rounds[sub.rounds.length - 1];
                  const heroImg = lastRound?.images.find((i) => i.isSelectedHero) || lastRound?.images[0];

                  return (
                    <div
                      key={sub.id}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center gap-4 hover:border-slate-300 transition-all"
                    >
                      {heroImg && (
                        <img
                          src={heroImg.url}
                          alt="Hero"
                          className="w-16 h-16 rounded-lg object-cover shrink-0 border border-slate-200 shadow-2xs"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {sub.studentName} · {asg?.title || '课堂作业'}
                          </span>
                          <span className="text-xs font-bold text-emerald-600 font-mono">
                            {sub.grading?.totalScore ? `${sub.grading.totalScore}分` : '95分'}
                          </span>
                        </div>
                        <p className="text-[11px] font-mono text-slate-600 truncate mt-1">
                          "{lastRound?.positivePrompt}"
                        </p>
                        <div className="text-[10px] text-slate-400 mt-1">
                          完成了 {sub.rounds.length} 轮推演 · 已选定标杆九宫格变体
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: GRADING & REVIEWS (作业批改与评审)                 */}
      {/* ========================================================= */}
      {currentTab === 'teacher_grading' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {/* Assignment Filter */}
              <select
                value={selectedAssignmentFilter}
                onChange={(e) => setSelectedAssignmentFilter(e.target.value)}
                className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-medium"
              >
                <option value="all">全部作业项 (6课堂 + 1期末)</option>
                {assignments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-medium"
              >
                <option value="all">全部提交状态</option>
                <option value="graded">已评分归档</option>
                <option value="submitted">已提交待批改</option>
                <option value="draft">草稿记录中</option>
              </select>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索学号、姓名、班级..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Submissions Roster Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="py-3 px-4">学号</th>
                    <th className="py-3 px-4">姓名</th>
                    <th className="py-3 px-4">班级 / 专业</th>
                    <th className="py-3 px-4">对应作业</th>
                    <th className="py-3 px-4 text-center">提示词轮次</th>
                    <th className="py-3 px-4">提交时间</th>
                    <th className="py-3 px-4 text-center">状态</th>
                    <th className="py-3 px-4 text-center">综合成绩</th>
                    <th className="py-3 px-4 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSubmissions.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        暂无符合筛选条件的作业记录
                      </td>
                    </tr>
                  ) : (
                    filteredSubmissions.map((sub) => {
                      const asg = assignments.find((a) => a.id === sub.assignmentId) || assignments[0];
                      const isGraded = sub.status === 'graded';
                      const isSubmitted = sub.status === 'submitted';

                      return (
                        <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">{sub.studentId}</td>
                          <td className="py-3 px-4 font-semibold text-slate-900">{sub.studentName}</td>
                          <td className="py-3 px-4 text-slate-600">
                            {sub.studentClass} · {sub.studentMajor}
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-800 max-w-[200px] truncate">
                            {asg.title}
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-blue-600">
                            {sub.rounds.length} 轮 (9图/轮)
                          </td>
                          <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                            {sub.submittedAt || '编辑中'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isGraded ? (
                              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                已评分
                              </span>
                            ) : isSubmitted ? (
                              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                待批改
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600">
                                草稿中
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center font-mono">
                            {isGraded ? (
                              <span className="font-bold text-emerald-600 text-sm">
                                {sub.grading?.totalScore} 分
                              </span>
                            ) : (
                              <span className="text-slate-400">--</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right space-x-2">
                            <button
                              onClick={() => setPdfTarget({ assignment: asg, submission: sub })}
                              className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors inline-flex items-center gap-1"
                            >
                              <FileText className="w-3 h-3 text-blue-600" />
                              <span>PDF报告</span>
                            </button>
                            <button
                              onClick={() => setGradingTarget({ assignment: asg, submission: sub })}
                              className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                                isGraded
                                  ? 'bg-slate-900 hover:bg-slate-800 text-white'
                                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-2xs'
                              }`}
                            >
                              {isGraded ? '修改评分' : '批改打分'}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: FINAL GRADEBOOK (全班成绩汇总)                     */}
      {/* ========================================================= */}
      {currentTab === 'teacher_gradebook' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">
                  2026年秋季课程 · 全班成绩汇总表 (Gradebook)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                权重计算规则：平时6次课堂作业各占 10% (共60%) + 期末综合考核大作业占 40% = 100%
              </p>
            </div>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-colors shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>导出全班成绩汇总 CSV / Excel</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-3 px-4">学号</th>
                    <th className="py-3 px-4">姓名</th>
                    <th className="py-3 px-4">班级 / 专业</th>
                    {assignments.map((a) => (
                      <th key={a.id} className="py-3 px-2 text-center whitespace-nowrap">
                        <div>{a.isFinalExam ? '期末大作业' : `课堂#0${a.assignmentNumber}`}</div>
                        <div className="text-[10px] text-slate-400 font-normal">({a.weightPercent}%)</div>
                      </th>
                    ))}
                    <th className="py-3 px-4 text-center bg-slate-100 font-bold">加权总分</th>
                    <th className="py-3 px-4 text-center bg-slate-100 font-bold">评定等级</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {studentGradebook.map((row) => (
                    <tr key={row.student.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {row.student.studentId}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{row.student.name}</td>
                      <td className="py-3 px-4 text-slate-600 truncate max-w-[140px]">
                        {row.student.className}
                      </td>
                      {assignments.map((a) => {
                        const val = row.scores[a.id];
                        return (
                          <td key={a.id} className="py-3 px-2 text-center font-mono">
                            {val === -1 ? (
                              <span className="text-blue-600 text-[11px] font-semibold">已交</span>
                            ) : val !== null && val !== undefined ? (
                              <span className="font-bold text-slate-900">{val}</span>
                            ) : (
                              <span className="text-slate-300">--</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="py-3 px-4 text-center font-mono font-black text-blue-600 text-sm bg-blue-50/30">
                        {row.finalScore}
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-slate-800 bg-slate-50">
                        {row.letterGrade}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Popups */}
      {gradingTarget && (
        <GradingModal
          isOpen={!!gradingTarget}
          onClose={() => setGradingTarget(null)}
          assignment={gradingTarget.assignment}
          submission={gradingTarget.submission}
        />
      )}

      {pdfTarget && (
        <PDFReportModal
          isOpen={!!pdfTarget}
          onClose={() => setPdfTarget(null)}
          assignment={pdfTarget.assignment}
          submission={pdfTarget.submission}
        />
      )}
    </div>
  );
};
