import React, { useState } from 'react';
import { CourseProvider, useCourse } from './context/CourseContext';
import { Navbar } from './components/Navbar';
import { StudentAssignmentList } from './components/StudentAssignmentList';
import { AssignmentWorkspace } from './components/AssignmentWorkspace';
import { TeacherDashboard } from './components/TeacherDashboard';
import { StudentQRModal } from './components/StudentQRModal';
import { TemplateStudioModal } from './components/TemplateStudioModal';
import { PDFReportModal } from './components/PDFReportModal';
import { AssignmentUploadModal } from './components/AssignmentUploadModal';
import { Assignment, StudentSubmission } from './types';

function MainApp() {
  const { role, assignments } = useCourse();

  // Navigation tab state
  const [currentTab, setCurrentTab] = useState<'assignments' | 'teacher_analytics' | 'teacher_grading' | 'teacher_gradebook'>('assignments');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);

  // Modal triggers
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isTemplateStudioOpen, setIsTemplateStudioOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadTargetAssignmentId, setUploadTargetAssignmentId] = useState<string | null>(null);

  // PDF Preview Modal
  const [pdfModalData, setPdfModalData] = useState<{
    assignment: Assignment;
    submission: StudentSubmission;
  } | null>(null);

  const selectedAssignment = assignments.find((a) => a.id === selectedAssignmentId);

  const handleSelectAssignment = (assignmentId: string) => {
    setSelectedAssignmentId(assignmentId);
  };

  const handleBackToAssignmentList = () => {
    setSelectedAssignmentId(null);
  };

  const handleOpenPdfReport = (assignment: Assignment, submission: StudentSubmission) => {
    setPdfModalData({ assignment, submission });
  };

  const handleOpenUploadPortal = (assignmentId?: string) => {
    setUploadTargetAssignmentId(assignmentId || selectedAssignmentId || assignments[0]?.id || null);
    setIsUploadModalOpen(true);
  };

  const handleSelectTemplateToCreate = (newAssignmentId: string) => {
    setSelectedAssignmentId(newAssignmentId);
    setIsTemplateStudioOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navbar Contract */}
      <Navbar
        currentTab={currentTab}
        onTabChange={(tab) => {
          setCurrentTab(tab as any);
          if (role === 'student') {
            setSelectedAssignmentId(null);
          }
        }}
        onOpenQR={() => setIsQRModalOpen(true)}
        onOpenTemplateStudio={() => setIsTemplateStudioOpen(true)}
        onOpenUploadPortal={() => handleOpenUploadPortal()}
      />

      {/* Main View Port */}
      <main className="flex-1">
        {role === 'student' ? (
          selectedAssignment ? (
            <AssignmentWorkspace
              assignment={selectedAssignment}
              onBack={handleBackToAssignmentList}
              onOpenPdfReport={handleOpenPdfReport}
            />
          ) : (
            <StudentAssignmentList
              onSelectAssignment={handleSelectAssignment}
              onOpenPdfReport={handleOpenPdfReport}
              onOpenQR={() => setIsQRModalOpen(true)}
              onOpenUploadPortal={handleOpenUploadPortal}
            />
          )
        ) : (
          <TeacherDashboard
            currentTab={currentTab}
            onTabChange={(tab) => setCurrentTab(tab as any)}
            onOpenTemplateStudio={() => setIsTemplateStudioOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>《人工智能与数字艺术》· 英雄榜作业记录与多维评估系统 · 2026</span>
          <div className="flex items-center gap-4 text-slate-400">
            <span>6次课堂《……英雄榜》 + 1次期末统考</span>
            <span>·</span>
            <span>≥3轮提示词演进与9宫格图像上传</span>
            <span>·</span>
            <span>学术PDF总结归档</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <StudentQRModal isOpen={isQRModalOpen} onClose={() => setIsQRModalOpen(false)} />

      <TemplateStudioModal
        isOpen={isTemplateStudioOpen}
        onClose={() => setIsTemplateStudioOpen(false)}
        onSelectTemplateToCreate={handleSelectTemplateToCreate}
      />

      <AssignmentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        initialAssignmentId={uploadTargetAssignmentId}
        onOpenFullWorkspace={(asgId) => {
          setSelectedAssignmentId(asgId);
        }}
        onOpenPdfReport={handleOpenPdfReport}
      />

      {pdfModalData && (
        <PDFReportModal
          isOpen={!!pdfModalData}
          onClose={() => setPdfModalData(null)}
          assignment={pdfModalData.assignment}
          submission={pdfModalData.submission}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <CourseProvider>
      <MainApp />
    </CourseProvider>
  );
}
