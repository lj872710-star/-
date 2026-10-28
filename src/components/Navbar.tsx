import React from 'react';
import { useCourse } from '../context/CourseContext';
import {
  Sparkles,
  QrCode,
  GraduationCap,
  LayoutDashboard,
  FileSpreadsheet,
  Layers,
  BookOpen,
  RotateCcw,
  Upload,
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onOpenQR: () => void;
  onOpenTemplateStudio: () => void;
  onOpenUploadPortal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  onOpenQR,
  onOpenTemplateStudio,
  onOpenUploadPortal,
}) => {
  const { role, setRole, currentStudent, resetAllData } = useCourse();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-base font-bold text-slate-900 tracking-tight whitespace-nowrap">
              《人工智能与数字艺术》
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links (Contextual) */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {role === 'student' ? (
            <>
              <button
                onClick={() => onTabChange('assignments')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                  currentTab === 'assignments'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>英雄榜作业清单 (6+1)</span>
              </button>
              <button
                onClick={onOpenUploadPortal}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-2xs transition-colors whitespace-nowrap"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>作业上传端口</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onTabChange('teacher_analytics')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  currentTab === 'teacher_analytics'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>数据看板</span>
              </button>
              <button
                onClick={() => onTabChange('teacher_grading')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  currentTab === 'teacher_grading'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>作业批改</span>
              </button>
              <button
                onClick={() => onTabChange('teacher_gradebook')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  currentTab === 'teacher_gradebook'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>成绩汇总</span>
              </button>
              <button
                onClick={onOpenTemplateStudio}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>自定义模版库</span>
              </button>
            </>
          )}
        </nav>

        {/* Zone 3: Role Switcher & Student Identity */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Role Toggle */}
          <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200/80">
            <button
              onClick={() => {
                setRole('student');
                onTabChange('assignments');
              }}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                role === 'student'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              学生端
            </button>
            <button
              onClick={() => {
                setRole('teacher');
                onTabChange('teacher_analytics');
              }}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                role === 'teacher'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              教师端
            </button>
          </div>

          {/* Student QR Login / Profile */}
          {role === 'student' ? (
            <button
              onClick={onOpenQR}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:border-slate-400 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <QrCode className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline font-semibold">{currentStudent.name}</span>
              <span className="text-slate-400 hidden md:inline">({currentStudent.studentId})</span>
              <span className="text-[10px] text-blue-600 bg-blue-50 px-1 rounded ml-0.5">切换/扫码</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-indigo-800 bg-indigo-50 border border-indigo-200 rounded-lg">
              <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
              <span>教师督导模式</span>
            </div>
          )}

          {/* Reset Demo Data Helper */}
          <button
            onClick={() => {
              if (window.confirm('确定要重置所有演示数据为初始状态吗？')) {
                resetAllData();
              }
            }}
            title="重置初始演示数据"
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
