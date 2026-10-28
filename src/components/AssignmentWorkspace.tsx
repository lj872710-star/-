import React, { useState, useRef } from 'react';
import { useCourse } from '../context/CourseContext';
import {
  Assignment,
  GeneratedImage,
  PromptRound,
  StudentSubmission,
  SubmissionAttachment,
} from '../types';
import {
  generate9GridImages,
  readImageFileAsDataUrl,
  formatFileSize,
} from '../utils/imagePool';
import { evaluateStudentBadges } from '../utils/badgeSystem';
import { ImageLightboxModal } from './ImageLightboxModal';
import {
  ArrowLeft,
  Sparkles,
  Save,
  Send,
  FileText,
  Plus,
  Trash2,
  Award,
  CheckCircle2,
  Wand2,
  Maximize2,
  ChevronDown,
  ChevronUp,
  Zap,
  ShieldCheck,
  Upload,
  FileUp,
  FolderUp,
} from 'lucide-react';

interface AssignmentWorkspaceProps {
  assignment: Assignment;
  onBack: () => void;
  onOpenPdfReport: (assignment: Assignment, submission: StudentSubmission) => void;
}

export const AssignmentWorkspace: React.FC<AssignmentWorkspaceProps> = ({
  assignment,
  onBack,
  onOpenPdfReport,
}) => {
  const { currentStudent, getSubmissionForStudent, saveSubmissionDraft, submitAssignment } = useCourse();

  // Load existing or default submission
  const existingSub = getSubmissionForStudent(assignment.id, currentStudent.studentId);

  // Initialize rounds: ensure at least 3 default draft rounds if empty
  const [rounds, setRounds] = useState<PromptRound[]>(() => {
    if (existingSub?.rounds && existingSub.rounds.length > 0) {
      return existingSub.rounds;
    }

    const defaultTheme = assignment.id.includes('01')
      ? 'cyberpunk'
      : assignment.id.includes('02')
      ? 'architecture'
      : assignment.id.includes('03')
      ? 'product'
      : 'surreal';

    const r1Images = generate9GridImages(defaultTheme, 1, 'concept subject initial silhouette');
    const r2Images = generate9GridImages(defaultTheme, 2, 'concept subject lighting and textures');
    const r3Images = generate9GridImages(defaultTheme, 3, 'concept subject refined masterpiece 8k');

    return [
      {
        roundNumber: 1,
        roundTitle: '第1轮：主体意象构思与粗坯构建',
        conceptualIntent: '确立视觉设计的核心母题与符号隐喻，测试基础提示词对主体轮廓的控制力。',
        positivePrompt: assignment.referenceExamples[0]?.prompt || 'a cybernetic kinetic sculpture, clean geometric silhouette, studio light',
        negativePrompt: 'blurry, low quality, distorted anatomy, messy background, extra limbs',
        parameters: { aspectRatio: '1:1', style: 'Conceptual Base', cfgScale: 7.0, steps: 30, model: 'Gemini-Flash-Visual' },
        images: r1Images,
        reflectionAndCritique: '主体构型初具雏形，但细节较为平淡，缺乏材质冲击力与空间层次。下一轮重点强化表面质感与光影反差。',
        completedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      },
      {
        roundNumber: 2,
        roundTitle: '第2轮：光影介入与材质肌理混合',
        conceptualIntent: '引入高级材质（如磨砂晶体、液态金属或玄武岩）与戏剧性布光，拉开空间层次。',
        positivePrompt: 'monolithic kinetic structure, brushed titanium and obsidian veins, dramatic volumetric rim lighting, cinematic depth of field, 8k',
        negativePrompt: 'low resolution, plastic look, oversaturated, amateur sketch, watermark',
        parameters: { aspectRatio: '1:1', style: 'Textural & Lighting', cfgScale: 7.5, steps: 35, model: 'Gemini-Flash-Visual' },
        images: r2Images,
        reflectionAndCritique: '高反差光影在九宫格中表现良好，但在局部微观细节上存在轻微噪点。第3轮需要增加相机光学词与终极定型约束。',
        completedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      },
      {
        roundNumber: 3,
        roundTitle: '第3轮：微观质感强化与终极定型',
        conceptualIntent: '终极调优：平衡主体与背景光晕，强化微观纹理与工艺自洽性，产出高保真设计方案。',
        positivePrompt: 'masterpiece, colossal kinetic monolithic monument, chiseled obsidian and pulsing luminescent core, soft caustics, architectural photography, 8k octane render, hyper-detailed',
        negativePrompt: 'bad composition, noisy, deformed, oversaturated, cheap rendering',
        parameters: { aspectRatio: '1:1', style: 'Fine Art Masterpiece', cfgScale: 8.0, steps: 40, model: 'Gemini-Flash-Visual' },
        images: r3Images,
        reflectionAndCritique: '9张变体呈现出高度一致的视觉张力与细腻质感，成功选出最具代表性的主推标杆方案。',
        completedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      },
    ];
  });

  const [activeRoundIdx, setActiveRoundIdx] = useState(0);
  const [finalReflection, setFinalReflection] = useState(
    existingSub?.finalSynthesisReflection ||
      '经过至少3轮由浅入深的提示词迭代实验，我深刻体会到了控制提示词层级与负向过滤的重要性。九宫格横向对比帮助我快速捕捉到了最理想的材质与构图分支，圆满达成本次作业的学术目标。'
  );

  const [showObjectives, setShowObjectives] = useState(false);
  const [inspectingImage, setInspectingImage] = useState<GeneratedImage | null>(null);
  const [isGenerating9Grid, setIsGenerating9Grid] = useState(false);
  const [saveToast, setSaveToast] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [attachments, setAttachments] = useState<SubmissionAttachment[]>(
    existingSub?.attachments || []
  );
  const [replacingSlotIdx, setReplacingSlotIdx] = useState<number | null>(null);

  const batchUploadInputRef = useRef<HTMLInputElement | null>(null);
  const singleSlotInputRef = useRef<HTMLInputElement | null>(null);
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);

  const activeRound = rounds[activeRoundIdx] || rounds[0];

  const handleUpdateCurrentRound = (fields: Partial<PromptRound>) => {
    setRounds((prev) => {
      const next = [...prev];
      next[activeRoundIdx] = { ...next[activeRoundIdx], ...fields };
      return next;
    });
  };

  const handleBatchUpload9Grid = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    setIsGenerating9Grid(true);
    try {
      const files = Array.from(fileList).slice(0, 9);
      const updatedImages = [...activeRound.images];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const dataUrl = await readImageFileAsDataUrl(file);
        const cleanName = file.name.replace(/\.[^/.]+$/, '').slice(0, 18);
        updatedImages[i] = {
          ...updatedImages[i],
          id: `upload_r${activeRound.roundNumber}_${i + 1}_${Date.now()}`,
          url: dataUrl,
          title: `第${activeRound.roundNumber}轮 · 实传0${i + 1} (${cleanName})`,
          promptSnippet: activeRound.positivePrompt,
          styleTag: '本地上传实图',
          isCustomUpload: true,
        };
      }
      handleUpdateCurrentRound({ images: updatedImages });
      setSaveToast(`成功上传 ${files.length} 张本地图片至第 ${activeRound.roundNumber} 轮九宫格！`);
      setTimeout(() => setSaveToast(''), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating9Grid(false);
      e.target.value = '';
    }
  };

  const handleSingleSlotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || replacingSlotIdx === null) return;
    setIsGenerating9Grid(true);
    try {
      const dataUrl = await readImageFileAsDataUrl(file);
      const cleanName = file.name.replace(/\.[^/.]+$/, '').slice(0, 18);
      const updatedImages = [...activeRound.images];
      updatedImages[replacingSlotIdx] = {
        ...updatedImages[replacingSlotIdx],
        id: `upload_r${activeRound.roundNumber}_${replacingSlotIdx + 1}_${Date.now()}`,
        url: dataUrl,
        title: `第${activeRound.roundNumber}轮 · 实传0${replacingSlotIdx + 1} (${cleanName})`,
        promptSnippet: activeRound.positivePrompt,
        styleTag: '本地上传实图',
        isCustomUpload: true,
      };
      handleUpdateCurrentRound({ images: updatedImages });
      setSaveToast(`已上传替换九宫格 #0${replacingSlotIdx + 1} 位置图片！`);
      setTimeout(() => setSaveToast(''), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating9Grid(false);
      setReplacingSlotIdx(null);
      e.target.value = '';
    }
  };

  const handleAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const newItems: SubmissionAttachment[] = Array.from(fileList).map((f, idx) => ({
      id: `att_${Date.now()}_${idx}`,
      fileName: f.name,
      fileSize: formatFileSize(f.size),
      fileType: f.type || f.name.split('.').pop()?.toUpperCase() || 'FILE',
      uploadedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
    }));
    setAttachments((prev) => [...prev, ...newItems]);
    setSaveToast(`成功上传 ${newItems.length} 个作业附件文件！`);
    setTimeout(() => setSaveToast(''), 2500);
    e.target.value = '';
  };

  const handleGenerate9Grid = () => {
    setIsGenerating9Grid(true);
    setTimeout(() => {
      const theme = assignment.id.includes('01')
        ? 'cyberpunk'
        : assignment.id.includes('02')
        ? 'architecture'
        : assignment.id.includes('03')
        ? 'product'
        : 'nature';

      const new9Images = generate9GridImages(theme, activeRound.roundNumber, activeRound.positivePrompt);
      handleUpdateCurrentRound({ images: new9Images });
      setIsGenerating9Grid(false);
      setSaveToast(`已生成第 ${activeRound.roundNumber} 轮全新 9 宫格图像矩阵！`);
      setTimeout(() => setSaveToast(''), 2500);
    }, 700);
  };

  const handleAddRound = () => {
    const nextNum = rounds.length + 1;
    const theme = 'default';
    const newImgs = generate9GridImages(theme, nextNum, activeRound.positivePrompt);
    const newRound: PromptRound = {
      roundNumber: nextNum,
      roundTitle: `第${nextNum}轮：进一步深化与风格迁移`,
      conceptualIntent: '在上一轮基础上进一步拓展或微调风格参数。',
      positivePrompt: activeRound.positivePrompt + ', refined intricate details, award-winning composition',
      negativePrompt: activeRound.negativePrompt,
      parameters: { ...activeRound.parameters },
      images: newImgs,
      reflectionAndCritique: '针对新一轮九宫格生成的对比反思...',
      completedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };
    setRounds([...rounds, newRound]);
    setActiveRoundIdx(rounds.length);
  };

  const handleDeleteRound = (idx: number) => {
    if (rounds.length <= 3) {
      alert('根据教学要求，作业必须保留不少于 3 轮提示词迭代记录！');
      return;
    }
    const next = rounds.filter((_, i) => i !== idx).map((r, i) => ({ ...r, roundNumber: i + 1 }));
    setRounds(next);
    setActiveRoundIdx(Math.max(0, activeRoundIdx - 1));
  };

  const handleSetHeroImage = (imgId: string) => {
    const updatedImages = activeRound.images.map((img) => ({
      ...img,
      isSelectedHero: img.id === imgId,
    }));
    handleUpdateCurrentRound({ images: updatedImages });
  };

  const currentSubmissionData: StudentSubmission = {
    id: existingSub?.id || `sub_${currentStudent.studentId}_${assignment.id}`,
    assignmentId: assignment.id,
    studentId: currentStudent.studentId,
    studentName: currentStudent.name,
    studentClass: currentStudent.className,
    studentMajor: currentStudent.major,
    status: existingSub?.status || 'draft',
    rounds,
    finalSynthesisReflection: finalReflection,
    attachments,
    submittedAt: existingSub?.submittedAt,
    grading: existingSub?.grading,
  };

  const handleSaveDraft = () => {
    saveSubmissionDraft(currentSubmissionData);
    setSaveToast('作业草稿保存成功！随时可继续编辑。');
    setTimeout(() => setSaveToast(''), 2500);
  };

  const handleSubmit = () => {
    if (rounds.length < 3) {
      alert('提交失败：本作业要求至少完成 3 轮提示词迭代（目前仅完成 ' + rounds.length + ' 轮）！');
      return;
    }
    submitAssignment(currentSubmissionData);
    setSubmitSuccess(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Navigation & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>返回清单</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                {assignment.isFinalExam ? '期末考试大作业' : `课堂作业 #0${assignment.assignmentNumber}`}
              </span>
              <span className="text-xs text-slate-500">权重: {assignment.weightPercent}%</span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">{assignment.title}</h1>
          </div>
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleSaveDraft}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Save className="w-3.5 h-3.5 text-slate-500" />
            <span>保存草稿</span>
          </button>
          <button
            onClick={() => onOpenPdfReport(assignment, currentSubmissionData)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>导出 PDF 总结报告</span>
          </button>
          <button
            onClick={handleSubmit}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>正式提交作业</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {saveToast && (
        <div className="bg-slate-900 text-white text-xs px-4 py-2.5 rounded-lg shadow-md flex items-center justify-between animate-in fade-in">
          <span>{saveToast}</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        </div>
      )}

      {/* Assignment Concept & Pedagogical Target Header */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                作业概念说明与要求 (Concept Briefing)
              </span>
              <span className="text-[11px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-medium">
                截止: {assignment.deadline}
              </span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">{assignment.conceptOverview}</p>
          </div>
          <button
            onClick={() => setShowObjectives(!showObjectives)}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold p-1 shrink-0"
          >
            <span>{showObjectives ? '收起要求' : '查看详细量表与目标'}</span>
            {showObjectives ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Collapsible Objectives & Rubric */}
        {showObjectives && (
          <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs animate-in fade-in">
            <div>
              <span className="font-bold text-slate-800">课程学术目标与考核要求：</span>
              <ul className="list-disc list-inside mt-1.5 space-y-1 text-slate-600">
                {assignment.pedagogicalObjectives.map((obj, i) => (
                  <li key={i}>{obj}</li>
                ))}
                <li>必须完成不少于 3 轮提示词渐进迭代（目前: {rounds.length} 轮）</li>
                <li>每一轮必须包含完整的 9 张图九宫格矩阵</li>
              </ul>
            </div>
            <div>
              <span className="font-bold text-slate-800">教师评分量表标准 (总分100)：</span>
              <div className="mt-1.5 space-y-1">
                {assignment.rubric.map((r) => (
                  <div key={r.id} className="flex justify-between text-slate-600 bg-white p-1.5 rounded border border-slate-200/60">
                    <span>{r.name} ({r.description})</span>
                    <span className="font-semibold text-slate-900 font-mono">{r.maxScore}分</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Live Badge & Consistency Status Bar for Current Assignment */}
      {(() => {
        const liveEval = evaluateStudentBadges(
          currentStudent.studentId,
          [currentSubmissionData],
          [assignment]
        );
        const consistency = liveEval.metrics.overallConsistencyScore;
        const earlyUnlocked = liveEval.metrics.earlyThreeRoundCount >= 1;

        return (
          <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex flex-wrap items-center gap-3 text-slate-600">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-blue-600" />
                <span>本作业徽章里程碑实时监测：</span>
              </span>
              <span
                className={`inline-flex items-center gap-1 font-medium ${
                  earlyUnlocked ? 'text-blue-700' : 'text-slate-500'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-blue-600" />
                <span>
                  {earlyUnlocked
                    ? '✓ 已达成「三轮演进先锋」里程碑'
                    : `需完成3轮演进 (${rounds.length}/3)`}
                </span>
              </span>
              <span aria-hidden="true">·</span>
              <span
                className={`inline-flex items-center gap-1 font-medium ${
                  consistency >= 85 ? 'text-emerald-700' : 'text-slate-600'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  图像生成一致性指数：<strong className="font-mono">{consistency}%</strong>
                  {consistency >= 85 ? ' (已达成「九宫格一致性大师」标准)' : ' (目标 ≥ 85%)'}
                </span>
              </span>
            </div>

            <div className="text-[11px] text-slate-400">
              保持完整正向/负向词、固定画幅比例及标杆选优可提升一致性指数
            </div>
          </div>
        );
      })()}

      {/* Rounds Navigation Tabs */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <div className="flex items-center gap-2">
          {rounds.map((round, idx) => (
            <button
              key={round.roundNumber}
              onClick={() => setActiveRoundIdx(idx)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all ${
                activeRoundIdx === idx
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>第 {round.roundNumber} 轮</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-normal ${
                activeRoundIdx === idx ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-500'
              }`}>
                9图已就绪
              </span>
            </button>
          ))}
          <button
            onClick={handleAddRound}
            className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>添加迭代轮次</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 flex items-center gap-2 shrink-0">
          <span className="font-semibold text-slate-700">当前轮次进度：</span>
          <span className="text-emerald-700 font-bold">
            {rounds.length} 轮 (满足≥3轮要求)
          </span>
          {rounds.length > 3 && (
            <button
              onClick={() => handleDeleteRound(activeRoundIdx)}
              className="text-red-500 hover:text-red-700 text-xs p-1"
              title="删除当前轮次"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Active Round Editor & 9-Grid Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Prompts & Evolution Notes */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-900">
                Round #{activeRound.roundNumber} · 提示词构思与工程参数
              </span>
              <span className="text-[11px] font-mono text-slate-400">{activeRound.completedAt}</span>
            </div>

            {/* Conceptual Intent */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                构思设想与概念依据 (Conceptual Intent) *
              </label>
              <textarea
                rows={3}
                value={activeRound.conceptualIntent}
                onChange={(e) => handleUpdateCurrentRound({ conceptualIntent: e.target.value })}
                placeholder="阐述本轮提示词希望验证的构图意象、材质对比或概念隐喻..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 leading-relaxed"
              />
            </div>

            {/* Positive Prompt */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-blue-700">
                  正向提示词 (Positive Prompt) *
                </label>
                <button
                  type="button"
                  onClick={() => {
                    handleUpdateCurrentRound({
                      positivePrompt:
                        activeRound.positivePrompt +
                        ', cinematic lighting, high-contrast obsidian texture, 8k octane render',
                    });
                  }}
                  className="text-[11px] text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <Wand2 className="w-3 h-3" />
                  <span>智能补全修饰词</span>
                </button>
              </div>
              <textarea
                rows={4}
                value={activeRound.positivePrompt}
                onChange={(e) => handleUpdateCurrentRound({ positivePrompt: e.target.value })}
                placeholder="输入正向提示词（英文或中文均可，建议包含主体、材质、光影、镜头视角）..."
                className="w-full px-3 py-2 text-xs font-mono border border-blue-200 bg-blue-50/20 rounded-lg focus:ring-1 focus:ring-blue-500 leading-relaxed"
              />
            </div>

            {/* Negative Prompt */}
            <div>
              <label className="block text-xs font-semibold text-red-700 mb-1">
                反向负向提示词 (Negative Prompt - 杂讯过滤)
              </label>
              <input
                type="text"
                value={activeRound.negativePrompt}
                onChange={(e) => handleUpdateCurrentRound({ negativePrompt: e.target.value })}
                placeholder="blurry, distorted, oversaturated, cheap, watermark, text"
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-1 focus:ring-red-500"
              />
            </div>

            {/* Generation Parameters */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
              <div>
                <span className="text-[11px] text-slate-500">画幅宽高比</span>
                <select
                  value={activeRound.parameters.aspectRatio}
                  onChange={(e) =>
                    handleUpdateCurrentRound({
                      parameters: { ...activeRound.parameters, aspectRatio: e.target.value },
                    })
                  }
                  className="w-full mt-1 px-2 py-1.5 border border-slate-300 rounded-md text-xs"
                >
                  <option value="1:1">1:1 (正方形图)</option>
                  <option value="16:9">16:9 (电影宽画幅)</option>
                  <option value="3:4">3:4 (竖构图海报)</option>
                </select>
              </div>
              <div>
                <span className="text-[11px] text-slate-500">风格模式</span>
                <select
                  value={activeRound.parameters.style}
                  onChange={(e) =>
                    handleUpdateCurrentRound({
                      parameters: { ...activeRound.parameters, style: e.target.value },
                    })
                  }
                  className="w-full mt-1 px-2 py-1.5 border border-slate-300 rounded-md text-xs"
                >
                  <option value="Conceptual Base">概念构架</option>
                  <option value="Cyberpunk Industrial">赛博工业</option>
                  <option value="Architectural Minimal">极简空间</option>
                  <option value="Fine Art Masterpiece">大师杰作</option>
                </select>
              </div>
            </div>

            {/* Trigger 9-Grid Upload & AI Generation Buttons */}
            <input
              ref={batchUploadInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleBatchUpload9Grid}
              className="hidden"
            />
            <input
              ref={singleSlotInputRef}
              type="file"
              accept="image/*"
              onChange={handleSingleSlotUpload}
              className="hidden"
            />
            <input
              ref={attachmentInputRef}
              type="file"
              multiple
              accept=".pdf,.zip,.rar,.psd,.ai,.png,.jpg,.jpeg,.webp,.doc,.docx,.ppt,.pptx"
              onChange={handleAttachmentUpload}
              className="hidden"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => batchUploadInputRef.current?.click()}
                disabled={isGenerating9Grid}
                className="py-2.5 px-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-xs transition-all flex items-center justify-center gap-1.5"
              >
                <Upload className="w-4 h-4" />
                <span>批量上传本轮 9 张图</span>
              </button>

              <button
                type="button"
                onClick={handleGenerate9Grid}
                disabled={isGenerating9Grid}
                className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-xs transition-all flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span>{isGenerating9Grid ? '正在处理...' : 'AI 生成 9 宫格'}</span>
              </button>
            </div>
          </div>

          {/* Reflection on this round */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
            <label className="block text-xs font-bold text-emerald-800">
              【本轮反思】针对9张图效果的分析与下一轮改进计划 *
            </label>
            <textarea
              rows={3}
              value={activeRound.reflectionAndCritique}
              onChange={(e) => handleUpdateCurrentRound({ reflectionAndCritique: e.target.value })}
              placeholder="对比本轮9张图：哪一张最满意？存在什么不足（如光影过曝、细节缺失）？下一轮打算如何修改提示词？"
              className="w-full px-3 py-2 text-xs border border-emerald-200 bg-emerald-50/20 rounded-lg focus:ring-1 focus:ring-emerald-500 leading-relaxed"
            />
          </div>
        </div>

        {/* Right Column (7 cols): The 9-Grid Image Matrix */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">
                  第 {activeRound.roundNumber} 轮 · 9 宫格图像生成与上传矩阵 (3 × 3)
                </span>
                <span className="text-[11px] text-slate-400">支持点击单图放大或单独上传替换</span>
              </div>
              <button
                type="button"
                onClick={() => batchUploadInputRef.current?.click()}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>从本地电脑上传图片替换九宫格</span>
              </button>
            </div>

            {/* 3x3 Grid */}
            <div className="grid grid-cols-3 gap-3 bg-slate-100/70 p-3 rounded-xl border border-slate-200">
              {activeRound.images.map((img, i) => (
                <div
                  key={img.id}
                  onClick={() => setInspectingImage(img)}
                  className={`relative group rounded-lg overflow-hidden border cursor-pointer transition-all hover:shadow-md ${
                    img.isSelectedHero
                      ? 'border-amber-500 ring-2 ring-amber-400/50 shadow-sm'
                      : 'border-slate-300 hover:border-slate-400'
                  }`}
                >
                  <img
                    src={img.url}
                    alt={img.title}
                    className="w-full aspect-square object-cover transition-transform duration-200 group-hover:scale-102"
                  />

                  {/* Hero Badge */}
                  {img.isSelectedHero && (
                    <div className="absolute top-1.5 left-1.5 bg-amber-500 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded shadow-sm flex items-center gap-0.5 z-10">
                      <Award className="w-2.5 h-2.5" />
                      <span>主推标杆</span>
                    </div>
                  )}

                  {img.isCustomUpload && (
                    <div className="absolute top-1.5 right-1.5 bg-emerald-600 text-white font-bold text-[9px] px-1.5 py-0.5 rounded shadow-sm z-10">
                      本地实传
                    </div>
                  )}

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-slate-950/65 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-center text-white gap-1">
                    <Maximize2 className="w-4 h-4 text-slate-200" />
                    <span className="text-[10px] font-semibold">点击查看大图</span>
                    <div className="flex items-center gap-1 mt-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setReplacingSlotIdx(i);
                          singleSlotInputRef.current?.click();
                        }}
                        className="text-[9px] px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded flex items-center gap-0.5"
                      >
                        <Upload className="w-2.5 h-2.5" />
                        <span>上传图</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetHeroImage(img.id);
                        }}
                        className="text-[9px] px-2 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded"
                      >
                        设为主推
                      </button>
                    </div>
                  </div>

                  {/* Bottom Label */}
                  <div className="absolute bottom-0 inset-x-0 bg-slate-950/80 text-white text-[9px] px-2 py-1 flex items-center justify-between font-mono">
                    <span className="truncate">#0{i + 1} {img.title.split(' ')[1] || ''}</span>
                    <span className="text-slate-400 text-[8px]">
                      {img.isCustomUpload ? 'UPLOAD' : `S:${img.seed % 1000}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 px-1">
              <span>* 支持批量上传本地生成的 9 张图片或使用 AI 生成，悬浮在单图上可单独上传替换。</span>
              <span className="text-amber-600 font-semibold">★ 标有主推标杆的将作为本轮汇报核心</span>
            </div>
          </div>

          {/* Assignment Deliverable File Attachments Upload Section */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <FolderUp className="w-4 h-4 text-blue-600" />
                  <span>作业成果文件与工程附件上传端口 (Attachments Upload)</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  可上传导出的 PDF 总结报告、高清原图压缩包 (.zip)、工程源文件 (.psd/.ai) 或课堂汇报文件
                </p>
              </div>
              <button
                type="button"
                onClick={() => attachmentInputRef.current?.click()}
                className="px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 whitespace-nowrap"
              >
                <FileUp className="w-3.5 h-3.5" />
                <span>选择文件上传</span>
              </button>
            </div>

            {attachments.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-800 truncate">{att.fileName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {att.fileSize} · {att.uploadedAt}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setAttachments((prev) => prev.filter((item) => item.id !== att.id))
                      }
                      className="text-slate-400 hover:text-red-600 p-1"
                      title="移除附件"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div
                onClick={() => attachmentInputRef.current?.click()}
                className="py-4 px-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 hover:bg-slate-100/70 transition-colors cursor-pointer text-center text-xs text-slate-500"
              >
                点击此处或右上方「选择文件上传」按钮，添加 PDF 总结报告、ZIP 大图包或设计源文件
              </div>
            )}
          </div>

          {/* Overall Synthesis & Reflection */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
            <label className="block text-xs font-bold text-slate-900">
              作业整体学术总结与设计反思 (Overall Synthesis - 导出至PDF报告核心页) *
            </label>
            <textarea
              rows={4}
              value={finalReflection}
              onChange={(e) => setFinalReflection(e.target.value)}
              placeholder="总结整个作业过程中的心得体会：从第1轮到最终轮次的技术飞跃、提示词掌控感的变化、以及未来在实际设计项目中的应用设想..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 leading-relaxed"
            />
          </div>
        </div>
      </div>

      {/* Image Lightbox Inspector */}
      <ImageLightboxModal
        image={inspectingImage}
        onClose={() => setInspectingImage(null)}
        onSetHero={handleSetHeroImage}
        isHero={inspectingImage?.isSelectedHero}
      />

      {/* Submission Success Modal */}
      {submitSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">作业已正式提交归档！</h3>
              <p className="text-xs text-slate-600 mt-1">
                包含 {rounds.length} 轮提示词记录与全部 9 宫格图像，已进入教师后台评审队列。
              </p>
            </div>
            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => {
                  setSubmitSuccess(false);
                  onOpenPdfReport(assignment, currentSubmissionData);
                }}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <FileText className="w-4 h-4" />
                <span>立即查看 / 导出 PDF 总结报告</span>
              </button>
              <button
                onClick={() => {
                  setSubmitSuccess(false);
                  onBack();
                }}
                className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
              >
                返回作业清单
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
