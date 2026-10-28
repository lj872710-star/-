import React, { useState } from 'react';
import { Assignment, StudentSubmission } from '../types';
import { downloadSubmissionPdf } from '../utils/pdfExport';
import { X, Download, Printer, Award, Sparkles, CheckCircle2 } from 'lucide-react';

interface PDFReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: Assignment;
  submission: StudentSubmission;
}

export const PDFReportModal: React.FC<PDFReportModalProps> = ({
  isOpen,
  onClose,
  assignment,
  submission,
}) => {
  const [downloading, setDownloading] = useState(false);

  if (!isOpen) return null;

  const handleDownloadPdf = async () => {
    try {
      setDownloading(true);
      await downloadSubmissionPdf(assignment, submission);
    } catch (e) {
      console.error(e);
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-100 rounded-2xl max-w-5xl w-full my-6 shadow-2xl border border-slate-300 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Action Bar */}
        <div className="px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold tracking-tight">PDF 总结报告预览与导出</span>
            <span className="text-xs text-slate-400">· 包含全部提示词演进、9宫格图像及评分记录</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>系统打印</span>
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloading ? '正在生成PDF...' : '下载完整PDF报告'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Paper View */}
        <div className="p-4 sm:p-8 overflow-y-auto bg-slate-200/70 flex justify-center">
          <div className="bg-white rounded-xl shadow-md border border-slate-300 max-w-4xl w-full p-8 sm:p-12 text-slate-900 space-y-8 print:p-0 print:border-none print:shadow-none">
            {/* Document Header */}
            <div className="border-b border-slate-900 pb-6 flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-blue-600">
                  {assignment.courseName} · {assignment.semester}
                </div>
                <h1 className="text-2xl font-black text-slate-950 mt-1 tracking-tight">
                  AIGC提示词作业全流程记录与评估报告
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  UniAIGC Academic Portfolio Assessment · 官方数字归档凭证
                </p>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs font-mono text-slate-400">ARCHIVE ID</div>
                <div className="text-sm font-mono font-bold text-slate-800">{submission.id}</div>
                <div className="text-xs text-emerald-600 font-semibold mt-1">
                  {submission.status === 'graded' ? '● 已正式评分归档' : '● 待教师评审'}
                </div>
              </div>
            </div>

            {/* Student & Course Meta Box */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <div>
                <div className="text-slate-500 font-medium">学生学号</div>
                <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">{submission.studentId}</div>
              </div>
              <div>
                <div className="text-slate-500 font-medium">学生姓名</div>
                <div className="text-sm font-bold text-slate-900 mt-0.5">{submission.studentName}</div>
              </div>
              <div>
                <div className="text-slate-500 font-medium">班级 / 专业</div>
                <div className="text-sm font-semibold text-slate-900 mt-0.5 truncate">
                  {submission.studentClass} ({submission.studentMajor})
                </div>
              </div>
              <div>
                <div className="text-slate-500 font-medium">课程考核项</div>
                <div className="text-sm font-semibold text-slate-900 mt-0.5">
                  {assignment.isFinalExam ? '期末大作业 (权重40%)' : `课堂作业#0${assignment.assignmentNumber} (权重10%)`}
                </div>
              </div>
            </div>

            {/* Section 1: Concept & Pedagogical Target */}
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 pb-2 border-b border-slate-200">
                01. 作业概念说明与学术目标 (Concept & Objectives)
              </h2>
              <div className="mt-3 text-xs leading-relaxed text-slate-700 bg-slate-50/60 p-4 rounded-lg border border-slate-200/80">
                <p className="font-semibold text-slate-900 mb-1.5">{assignment.title}</p>
                <p>{assignment.conceptOverview}</p>
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <span className="font-semibold text-slate-800">核心考核指标：</span>
                  <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-600">
                    {assignment.pedagogicalObjectives.map((obj, i) => (
                      <li key={i}>{obj}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Section 2: Iteration Chain with 9-Grids */}
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                  02. 提示词迭代演化记录与九宫格图像（不少于3轮）
                </h2>
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  共完成 {submission.rounds.length} 轮演进
                </span>
              </div>

              <div className="mt-6 space-y-8">
                {submission.rounds.map((round) => (
                  <div
                    key={round.roundNumber}
                    className="p-5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-xs font-bold rounded bg-slate-900 text-white">
                          Round #{round.roundNumber}
                        </span>
                        <span className="text-sm font-bold text-slate-900">{round.roundTitle}</span>
                      </div>
                      <span className="text-xs text-slate-400 font-mono">{round.completedAt}</span>
                    </div>

                    {/* Conceptual Intent */}
                    <div className="text-xs">
                      <span className="font-bold text-slate-700">【构思设想与理论依据】</span>
                      <p className="text-slate-600 mt-1 leading-relaxed bg-slate-50 p-2.5 rounded border border-slate-200/60">
                        {round.conceptualIntent || '无特定构思记录'}
                      </p>
                    </div>

                    {/* Prompts */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-lg bg-blue-50/50 border border-blue-100">
                        <span className="font-bold text-blue-800">正向提示词 (Positive Prompt)</span>
                        <p className="mt-1 text-slate-800 font-mono text-[11px] leading-relaxed break-words">
                          {round.positivePrompt}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="font-bold text-red-700">反向负向词 (Negative Prompt)</span>
                        <p className="mt-1 text-slate-600 font-mono text-[11px] leading-relaxed break-words">
                          {round.negativePrompt || '未设置特定负向词'}
                        </p>
                      </div>
                    </div>

                    {/* 9-Image Grid Showcase */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <span>本轮 9 宫格图像生成矩阵 (3 × 3 变体)：</span>
                          <span className="text-[11px] text-slate-400 font-normal">
                            已记录 9 张完整高精度方案
                          </span>
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                        {round.images.map((img, i) => (
                          <div
                            key={img.id}
                            className={`relative group rounded-lg overflow-hidden border transition-all ${
                              img.isSelectedHero
                                ? 'border-amber-500 ring-2 ring-amber-400/50 shadow-sm'
                                : 'border-slate-200'
                            }`}
                          >
                            <img
                              src={img.url}
                              alt={img.title}
                              className="w-full aspect-square object-cover"
                            />
                            {img.isSelectedHero && (
                              <div className="absolute top-1 left-1 bg-amber-500 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded shadow-xs flex items-center gap-0.5">
                                <Award className="w-2.5 h-2.5" />
                                <span>标杆方案</span>
                              </div>
                            )}
                            <div className="absolute bottom-0 inset-x-0 bg-slate-900/80 text-white text-[9px] px-1.5 py-0.5 truncate font-mono">
                              #0{i + 1} · {img.title.split(' ')[1] || `变体${i + 1}`}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Reflection */}
                    <div className="text-xs bg-emerald-50/60 p-3 rounded-lg border border-emerald-100">
                      <span className="font-bold text-emerald-900">【本轮反思分析与下一轮迭代思路】</span>
                      <p className="text-emerald-800 mt-1 leading-relaxed">
                        {round.reflectionAndCritique || '无迭代反思'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 3: Comprehensive Synthesis */}
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 pb-2 border-b border-slate-200">
                03. 作业整体设计反思与学术总结 (Overall Synthesis)
              </h2>
              <div className="mt-3 p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs leading-relaxed text-slate-700">
                <p>{submission.finalSynthesisReflection || '学生未填写总体总结。'}</p>
              </div>
              {submission.attachments && submission.attachments.length > 0 && (
                <div className="mt-3 p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                  <span className="font-bold text-slate-800 block mb-1.5">
                    随附工程附件与高清成果文件 ({submission.attachments.length} 份)：
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {submission.attachments.map((att) => (
                      <span
                        key={att.id}
                        className="px-2.5 py-1 rounded bg-white border border-slate-200 text-slate-700 font-mono text-[11px]"
                      >
                        {att.fileName} ({att.fileSize})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Section 4: Teacher Rubric & Assessment */}
            {submission.grading && (
              <div className="p-5 rounded-xl bg-slate-900 text-white space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span className="text-sm font-bold">教师评分与学术评语归档</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400">总评成绩：</span>
                    <span className="text-xl font-black text-amber-400 ml-1">
                      {submission.grading.totalScore}
                    </span>
                    <span className="text-xs text-slate-400"> / 100 分</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {assignment.rubric.map((r) => {
                    const score = submission.grading?.rubricScores[r.id] ?? r.maxScore;
                    return (
                      <div key={r.id} className="p-2.5 rounded bg-slate-800/80 border border-slate-700">
                        <div className="text-slate-400 truncate">{r.name}</div>
                        <div className="font-bold text-emerald-400 text-sm mt-0.5">
                          {score} <span className="text-[10px] text-slate-500">/ {r.maxScore}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="text-xs bg-slate-800 p-3 rounded-lg border border-slate-700">
                  <span className="font-semibold text-slate-300">指导教师学术反馈：</span>
                  <p className="mt-1 text-slate-200 leading-relaxed">{submission.grading.feedback}</p>
                  <div className="mt-2 text-[10px] text-slate-400 text-right">
                    评定教师：{submission.grading.teacherName} · {submission.grading.gradedAt}
                  </div>
                </div>
              </div>
            )}

            {/* Document Footer */}
            <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
              <span>UniAIGC 高校教学平台 · 自动生成并验证</span>
              <span>学籍号：{submission.studentId} · 姓名：{submission.studentName}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
