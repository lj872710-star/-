export interface RubricItem {
  id: string;
  name: string;
  weight: number; // e.g. 25 (%)
  maxScore: number; // e.g. 25
  description: string;
}

export interface AssignmentTemplate {
  id: string;
  title: string;
  courseCategory: string;
  conceptBrief: string;
  detailedRequirements: string;
  minPromptRounds: number; // minimum 3
  imageCountPerRound: number; // 9
  aspectRatio: string;
  styleKeywords: string[];
  rubricItems: RubricItem[];
  defaultDeadlineDays: number;
  isCustom: boolean;
  createdAt: string;
}

export interface GeneratedImage {
  id: string;
  url: string;
  title: string;
  seed: number;
  promptSnippet: string;
  styleTag: string;
  aspectRatio: string;
  isSelectedHero?: boolean;
  isCustomUpload?: boolean;
}

export interface SubmissionAttachment {
  id: string;
  fileName: string;
  fileSize: string;
  fileType: string;
  uploadedAt: string;
  dataUrl?: string;
}

export interface PromptRound {
  roundNumber: number;
  roundTitle: string;
  conceptualIntent: string; // 构思设想与概念依据
  positivePrompt: string; // 正向提示词
  negativePrompt: string; // 反向负向提示词
  parameters: {
    aspectRatio: string;
    style: string;
    cfgScale: number;
    steps: number;
    model: string;
  };
  images: GeneratedImage[]; // Exactly 9 images
  reflectionAndCritique: string; // 针对本轮9张图的效果分析与下一轮迭代思路
  completedAt: string;
}

export interface Assignment {
  id: string;
  templateId?: string;
  assignmentNumber: number; // 1 to 6 = 课堂作业, 7 = 期末考试
  isFinalExam: boolean;
  title: string;
  courseName: string;
  semester: string;
  conceptOverview: string;
  pedagogicalObjectives: string[];
  submissionRequirements: {
    minRounds: number; // >= 3
    imagesPerRound: number; // 9
    includeNegativePrompt: boolean;
    requireReflection: boolean;
  };
  weightPercent: number; // e.g. 10 for classroom, 40 for final exam
  deadline: string;
  rubric: RubricItem[];
  referenceExamples: {
    stage: string;
    prompt: string;
    outcomeNote: string;
  }[];
}

export interface StudentProfile {
  id: string;
  studentId: string; // 学号
  name: string; // 姓名
  className: string; // 班级
  major: string; // 专业
  avatar?: string;
}

export interface GradingRecord {
  gradedAt: string;
  teacherName: string;
  rubricScores: Record<string, number>;
  totalScore: number;
  feedback: string;
  exemplaryRound?: number;
}

export interface StudentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  studentClass: string;
  studentMajor: string;
  status: 'draft' | 'submitted' | 'graded';
  rounds: PromptRound[];
  finalSynthesisReflection: string; // 作业总体总结与收获
  heroImageId?: string;
  attachments?: SubmissionAttachment[];
  submittedAt?: string;
  grading?: GradingRecord;
}

export type UserRole = 'student' | 'teacher';
