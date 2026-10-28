import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  Assignment,
  AssignmentTemplate,
  GradingRecord,
  StudentProfile,
  StudentSubmission,
  UserRole,
} from '../types';
import {
  DEMO_STUDENTS,
  INITIAL_ASSIGNMENTS,
  INITIAL_TEMPLATES,
  createPreseededSubmissions,
} from '../data/seedData';

interface CourseContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  currentStudent: StudentProfile;
  setCurrentStudent: (student: StudentProfile) => void;
  students: StudentProfile[];
  assignments: Assignment[];
  templates: AssignmentTemplate[];
  submissions: StudentSubmission[];
  // Actions
  loginStudentByCredentials: (studentId: string, name: string, className: string, major?: string) => void;
  saveSubmissionDraft: (submission: StudentSubmission) => void;
  submitAssignment: (submission: StudentSubmission) => void;
  gradeSubmission: (submissionId: string, grading: GradingRecord) => void;
  addTemplate: (template: Omit<AssignmentTemplate, 'id' | 'createdAt' | 'isCustom'>) => AssignmentTemplate;
  updateTemplate: (template: AssignmentTemplate) => void;
  deleteTemplate: (id: string) => void;
  createAssignmentFromTemplate: (templateId: string, overrides?: Partial<Assignment>) => Assignment;
  resetAllData: () => void;
  getSubmissionForStudent: (assignmentId: string, studentId: string) => StudentSubmission | undefined;
  getSubmissionsForAssignment: (assignmentId: string) => StudentSubmission[];
}

const CourseContext = createContext<CourseContextType | null>(null);

const STORAGE_KEY_ASSIGNMENTS = 'uniaigc_assignments_v2';
const STORAGE_KEY_TEMPLATES = 'uniaigc_templates_v2';
const STORAGE_KEY_SUBMISSIONS = 'uniaigc_submissions_v1';
const STORAGE_KEY_STUDENTS = 'uniaigc_students_v1';
const STORAGE_KEY_CURRENT_STU = 'uniaigc_current_stu_v1';
const STORAGE_KEY_ROLE = 'uniaigc_role_v1';

export const CourseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<UserRole>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_ROLE);
    return saved === 'teacher' ? 'teacher' : 'student';
  });

  const [students, setStudents] = useState<StudentProfile[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STUDENTS);
      return saved ? JSON.parse(saved) : DEMO_STUDENTS;
    } catch {
      return DEMO_STUDENTS;
    }
  });

  const [currentStudent, setCurrentStudentState] = useState<StudentProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CURRENT_STU);
      return saved ? JSON.parse(saved) : DEMO_STUDENTS[0];
    } catch {
      return DEMO_STUDENTS[0];
    }
  });

  const [assignments, setAssignments] = useState<Assignment[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ASSIGNMENTS);
      return saved ? JSON.parse(saved) : INITIAL_ASSIGNMENTS;
    } catch {
      return INITIAL_ASSIGNMENTS;
    }
  });

  const [templates, setTemplates] = useState<AssignmentTemplate[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TEMPLATES);
      return saved ? JSON.parse(saved) : INITIAL_TEMPLATES;
    } catch {
      return INITIAL_TEMPLATES;
    }
  });

  const [submissions, setSubmissions] = useState<StudentSubmission[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SUBMISSIONS);
      return saved ? JSON.parse(saved) : createPreseededSubmissions();
    } catch {
      return createPreseededSubmissions();
    }
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ROLE, role);
  }, [role]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CURRENT_STU, JSON.stringify(currentStudent));
  }, [currentStudent]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ASSIGNMENTS, JSON.stringify(assignments));
  }, [assignments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(templates));
  }, [templates]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SUBMISSIONS, JSON.stringify(submissions));
  }, [submissions]);

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
  };

  const setCurrentStudent = (stu: StudentProfile) => {
    setCurrentStudentState(stu);
  };

  const loginStudentByCredentials = (studentId: string, name: string, className: string, major?: string) => {
    const existing = students.find((s) => s.studentId === studentId);
    if (existing) {
      const updated = {
        ...existing,
        name: name || existing.name,
        className: className || existing.className,
        major: major || existing.major,
      };
      setStudents((prev) => prev.map((s) => (s.id === existing.id ? updated : s)));
      setCurrentStudentState(updated);
    } else {
      const newStu: StudentProfile = {
        id: `stu_${Date.now()}`,
        studentId,
        name,
        className,
        major: major || '设计学类',
      };
      setStudents((prev) => [...prev, newStu]);
      setCurrentStudentState(newStu);
    }
    setRoleState('student');
  };

  const saveSubmissionDraft = (submission: StudentSubmission) => {
    setSubmissions((prev) => {
      const idx = prev.findIndex((s) => s.id === submission.id || (s.assignmentId === submission.assignmentId && s.studentId === submission.studentId));
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...submission, status: next[idx].status === 'graded' ? 'graded' : 'draft' };
        return next;
      }
      return [...prev, { ...submission, status: 'draft' }];
    });
  };

  const submitAssignment = (submission: StudentSubmission) => {
    setSubmissions((prev) => {
      const idx = prev.findIndex((s) => s.id === submission.id || (s.assignmentId === submission.assignmentId && s.studentId === submission.studentId));
      const finalized = {
        ...submission,
        status: 'submitted' as const,
        submittedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      };
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = finalized;
        return next;
      }
      return [...prev, finalized];
    });
  };

  const gradeSubmission = (submissionId: string, grading: GradingRecord) => {
    setSubmissions((prev) =>
      prev.map((sub) => {
        if (sub.id === submissionId) {
          return {
            ...sub,
            status: 'graded',
            grading,
          };
        }
        return sub;
      })
    );
  };

  const addTemplate = (templateData: Omit<AssignmentTemplate, 'id' | 'createdAt' | 'isCustom'>): AssignmentTemplate => {
    const newTpl: AssignmentTemplate = {
      ...templateData,
      id: `tpl_custom_${Date.now()}`,
      createdAt: new Date().toISOString(),
      isCustom: true,
    };
    setTemplates((prev) => [newTpl, ...prev]);
    return newTpl;
  };

  const updateTemplate = (updated: AssignmentTemplate) => {
    setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  const deleteTemplate = (id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  const createAssignmentFromTemplate = (templateId: string, overrides?: Partial<Assignment>): Assignment => {
    const template = templates.find((t) => t.id === templateId) || templates[0];
    const newNumber = assignments.length + 1;
    const isFinalExam = overrides?.isFinalExam ?? false;

    const cleanBaseTitle = template.title
      .replace('作业模版', '')
      .replace('模版', '')
      .replace(/[《》]/g, '')
      .trim();
    const heroTitle = cleanBaseTitle.endsWith('英雄榜')
      ? `《${cleanBaseTitle}》`
      : `《${cleanBaseTitle}英雄榜》`;

    const newAssignment: Assignment = {
      id: `asg_${Date.now()}`,
      templateId: template.id,
      assignmentNumber: newNumber,
      isFinalExam,
      title: overrides?.title || `课堂作业 0${newNumber}：${heroTitle}`,
      courseName: '《人工智能与数字艺术》',
      semester: '2026年秋季学期',
      conceptOverview: overrides?.conceptOverview || template.conceptBrief,
      pedagogicalObjectives: [
        '基于模版标准规范执行提示词工程',
        `不少于${template.minPromptRounds}轮高质量概念演进与反思`,
        '产出高清晰度九宫格变体矩阵并提炼设计结论',
      ],
      submissionRequirements: {
        minRounds: template.minPromptRounds,
        imagesPerRound: template.imageCountPerRound,
        includeNegativePrompt: true,
        requireReflection: true,
      },
      weightPercent: isFinalExam ? 40 : 10,
      deadline: overrides?.deadline || '2026-11-30 23:59',
      rubric: template.rubricItems,
      referenceExamples: [
        {
          stage: '第1轮：基础概念',
          prompt: `minimalist ${template.styleKeywords[0] || 'design'}, clean aesthetic`,
          outcomeNote: '确立主体形态与构图骨架。',
        },
      ],
      ...overrides,
    };

    setAssignments((prev) => [...prev, newAssignment]);
    return newAssignment;
  };

  const resetAllData = () => {
    localStorage.removeItem(STORAGE_KEY_ASSIGNMENTS);
    localStorage.removeItem(STORAGE_KEY_TEMPLATES);
    localStorage.removeItem(STORAGE_KEY_SUBMISSIONS);
    localStorage.removeItem(STORAGE_KEY_STUDENTS);
    localStorage.removeItem(STORAGE_KEY_CURRENT_STU);
    localStorage.removeItem(STORAGE_KEY_ROLE);

    setAssignments(INITIAL_ASSIGNMENTS);
    setTemplates(INITIAL_TEMPLATES);
    setSubmissions(createPreseededSubmissions());
    setStudents(DEMO_STUDENTS);
    setCurrentStudentState(DEMO_STUDENTS[0]);
    setRoleState('student');
  };

  const getSubmissionForStudent = (assignmentId: string, studentId: string) => {
    return submissions.find((s) => s.assignmentId === assignmentId && s.studentId === studentId);
  };

  const getSubmissionsForAssignment = (assignmentId: string) => {
    return submissions.filter((s) => s.assignmentId === assignmentId);
  };

  return (
    <CourseContext.Provider
      value={{
        role,
        setRole,
        currentStudent,
        setCurrentStudent,
        students,
        assignments,
        templates,
        submissions,
        loginStudentByCredentials,
        saveSubmissionDraft,
        submitAssignment,
        gradeSubmission,
        addTemplate,
        updateTemplate,
        deleteTemplate,
        createAssignmentFromTemplate,
        resetAllData,
        getSubmissionForStudent,
        getSubmissionsForAssignment,
      }}
    >
      {children}
    </CourseContext.Provider>
  );
};

export const useCourse = () => {
  const ctx = useContext(CourseContext);
  if (!ctx) {
    throw new Error('useCourse must be used within a CourseProvider');
  }
  return ctx;
};
