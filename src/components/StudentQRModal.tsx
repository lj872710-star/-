import React, { useState } from 'react';
import { useCourse } from '../context/CourseContext';
import { X, QrCode, Smartphone, UserCheck, ShieldCheck, Sparkles } from 'lucide-react';
import { DEMO_STUDENTS } from '../data/seedData';

interface StudentQRModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StudentQRModal: React.FC<StudentQRModalProps> = ({ isOpen, onClose }) => {
  const { currentStudent, loginStudentByCredentials, setCurrentStudent } = useCourse();

  const [studentId, setStudentId] = useState(currentStudent.studentId || '');
  const [name, setName] = useState(currentStudent.name || '');
  const [className, setClassName] = useState(currentStudent.className || '');
  const [major, setMajor] = useState(currentStudent.major || '视觉传达设计');
  const [isScanning, setIsScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId.trim() || !name.trim()) return;
    loginStudentByCredentials(studentId.trim(), name.trim(), className.trim() || '未设定班级', major);
    onClose();
  };

  const handleSimulateScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setScanSuccess(true);
      // Auto-pick next demo student or current
      const nextStu = DEMO_STUDENTS.find((s) => s.studentId !== currentStudent.studentId) || DEMO_STUDENTS[0];
      setStudentId(nextStu.studentId);
      setName(nextStu.name);
      setClassName(nextStu.className);
      setMajor(nextStu.major);
      setCurrentStudent(nextStu);

      setTimeout(() => {
        setScanSuccess(false);
        onClose();
      }, 1000);
    }, 1200);
  };

  const handleSelectDemo = (stu: (typeof DEMO_STUDENTS)[0]) => {
    setStudentId(stu.studentId);
    setName(stu.name);
    setClassName(stu.className);
    setMajor(stu.major);
    setCurrentStudent(stu);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">学生作业空间身份认证</h3>
              <p className="text-[11px] text-slate-500">支持扫码登录与学号姓名绑定</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* QR Code Simulation Area */}
          <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 relative overflow-hidden">
            {isScanning && (
              <div className="absolute inset-0 bg-blue-600/10 flex flex-col items-center justify-center z-10">
                <div className="w-full h-1 bg-blue-500 shadow-md animate-bounce mb-2" />
                <span className="text-xs font-semibold text-blue-700 bg-white/90 px-2 py-0.5 rounded shadow-xs">
                  正在扫描校园识别码...
                </span>
              </div>
            )}

            {scanSuccess && (
              <div className="absolute inset-0 bg-emerald-600/90 flex flex-col items-center justify-center text-white z-10">
                <ShieldCheck className="w-10 h-10 mb-1" />
                <span className="text-sm font-bold">扫码认证成功！</span>
                <span className="text-xs opacity-90">已自动同步学生作业数据</span>
              </div>
            )}

            {/* Realistic SVG QR Pattern */}
            <div className="p-3 bg-white rounded-lg shadow-xs border border-slate-200">
              <svg width="130" height="130" viewBox="0 0 130 130" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Outer Markers */}
                <rect x="10" y="10" width="35" height="35" stroke="#0F172A" strokeWidth="5" rx="3" />
                <rect x="19" y="19" width="17" height="17" fill="#2563EB" rx="2" />

                <rect x="85" y="10" width="35" height="35" stroke="#0F172A" strokeWidth="5" rx="3" />
                <rect x="94" y="19" width="17" height="17" fill="#2563EB" rx="2" />

                <rect x="10" y="85" width="35" height="35" stroke="#0F172A" strokeWidth="5" rx="3" />
                <rect x="19" y="94" width="17" height="17" fill="#2563EB" rx="2" />

                {/* QR Data Dots */}
                <rect x="52" y="15" width="6" height="6" fill="#0F172A" />
                <rect x="62" y="15" width="6" height="12" fill="#0F172A" />
                <rect x="72" y="21" width="6" height="6" fill="#0F172A" />
                <rect x="52" y="32" width="12" height="6" fill="#0F172A" />
                <rect x="68" y="32" width="8" height="8" fill="#2563EB" />

                <rect x="15" y="55" width="8" height="6" fill="#0F172A" />
                <rect x="28" y="55" width="16" height="6" fill="#0F172A" />
                <rect x="50" y="52" width="6" height="16" fill="#0F172A" />
                <rect x="62" y="60" width="14" height="6" fill="#0F172A" />
                <rect x="82" y="52" width="18" height="6" fill="#0F172A" />
                <rect x="105" y="55" width="14" height="6" fill="#0F172A" />

                <rect x="55" y="75" width="16" height="6" fill="#0F172A" />
                <rect x="75" y="75" width="6" height="16" fill="#2563EB" />
                <rect x="55" y="88" width="8" height="12" fill="#0F172A" />
                <rect x="85" y="88" width="14" height="6" fill="#0F172A" />
                <rect x="105" y="80" width="12" height="14" fill="#0F172A" />
                <rect x="90" y="105" width="10" height="10" fill="#0F172A" />
                <rect x="68" y="105" width="12" height="8" fill="#0F172A" />
              </svg>
            </div>

            <div className="mt-3 text-center">
              <button
                type="button"
                onClick={handleSimulateScan}
                disabled={isScanning}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>模拟手机/校园码扫码登录</span>
              </button>
              <p className="text-[10px] text-slate-400 mt-1">
                教室投影/桌牌扫一扫，实时同步作业记录
              </p>
            </div>
          </div>

          {/* Quick Demo Pickers */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-700">快速载入演示学生：</span>
              <span className="text-[10px] text-slate-400">点击即用</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {DEMO_STUDENTS.slice(0, 3).map((stu) => (
                <button
                  key={stu.id}
                  type="button"
                  onClick={() => handleSelectDemo(stu)}
                  className={`px-2 py-1.5 text-left border rounded-lg transition-all ${
                    currentStudent.studentId === stu.studentId
                      ? 'border-blue-500 bg-blue-50/60 text-blue-900'
                      : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold truncate">{stu.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono">{stu.studentId}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Manual Input Form */}
          <form onSubmit={handleSubmit} className="space-y-3 pt-2 border-t border-slate-100">
            <div className="text-xs font-semibold text-slate-700">或手动填写学籍信息：</div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">学号 *</label>
                <input
                  type="text"
                  required
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="如: 20240901"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">姓名 *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="如: 张辰宇"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">行政班级</label>
                <input
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="如: 视觉传达2401班"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">专业方向</label>
                <input
                  type="text"
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  placeholder="如: 数字媒体艺术"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5"
            >
              <UserCheck className="w-4 h-4" />
              <span>确认登录并载入作业记录</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
