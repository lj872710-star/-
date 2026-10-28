import React, { useState, useEffect, useRef } from 'react';
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
import {
  X,
  Upload,
  Image as ImageIcon,
  FileUp,
  CheckCircle2,
  Plus,
  Trash2,
  Award,
  Sparkles,
  FileText,
  Send,
  Save,
  FolderUp,
} from 'lucide-react';

interface AssignmentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAssignmentId?: string | null;
  onOpenFullWorkspace?: (assignmentId: string) => void;
  onOpenPdfReport?: (assignment: Assignment, submission: StudentSubmission) => void;
}

export const AssignmentUploadModal: React.FC<AssignmentUploadModalProps> = ({
  isOpen,
  onClose,
  initialAssignmentId,
  onOpenFullWorkspace,
  onOpenPdfReport,
}) => {
  const {
    assignments,
    currentStudent,
    getSubmissionForStudent,
    saveSubmissionDraft,
    submitAssignment,
  } = useCourse();

  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>(
    initialAssignmentId || assignments[0]?.id || 'asg_01'
  );

  useEffect(() => {
    if (initialAssignmentId) {
      setSelectedAssignmentId(initialAssignmentId);
    }
  }, [initialAssignmentId]);

  const selectedAssignment =
    assignments.find((a) => a.id === selectedAssignmentId) || assignments[0];

  const existingSub = getSubmissionForStudent(
    selectedAssignment.id,
    currentStudent.studentId
  );

  const buildDefaultRounds = (asg: Assignment): PromptRound[] => {
    const theme = asg.id.includes('01')
      ? 'cyberpunk'
      : asg.id.includes('02')
      ? 'architecture'
      : asg.id.includes('03')
      ? 'product'
      : 'surreal';

    return [1, 2, 3].map((num) => ({
      roundNumber: num,
      roundTitle:
        num === 1
          ? '第1轮：基础意象构思与粗坯构建'
          : num === 2
          ? '第2轮：光影介入与材质肌理混合'
          : '第3轮：微观质感强化与终极定型',
      conceptualIntent: `针对${asg.title}的第${num}轮核心视觉概念推演与符号转译。`,
      positivePrompt:
        asg.referenceExamples[num - 1]?.prompt ||
        `masterpiece, round ${num} concept design, high contrast studio lighting, 8k`,
      negativePrompt: 'blurry, low quality, distorted anatomy, messy background, watermark',
      parameters: {
        aspectRatio: '1:1',
        style: 'Digital Art Concept',
        cfgScale: 7.5,
        steps: 35,
        model: 'AIGC-Visual',
      },
      images: generate9GridImages(theme, num, `round ${num} concept`),
      reflectionAndCritique: `第${num}轮9宫格生成效果对比分析与参数优化记录。`,
      completedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
    }));
  };

  const [rounds, setRounds] = useState<PromptRound[]>(() =>
    existingSub?.rounds && existingSub.rounds.length > 0
      ? existingSub.rounds
      : buildDefaultRounds(selectedAssignment)
  );
  const [activeRoundIdx, setActiveRoundIdx] = useState(0);
  const [finalReflection, setFinalReflection] = useState(
    existingSub?.finalSynthesisReflection ||
      '通过不少于3轮的提示词迭代与九宫格图像上传对比，完成了从概念设定到最终定型的完整数字艺术创作流程。'
  );
  const [attachments, setAttachments] = useState<SubmissionAttachment[]>(
    existingSub?.attachments || []
  );

  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [replacingSlotIdx, setReplacingSlotIdx] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState('');

  const batchInputRef = useRef<HTMLInputElement | null>(null);
  const singleSlotInputRef = useRef<HTMLInputElement | null>(null);
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);

  // Sync state when selectedAssignmentId changes
  useEffect(() => {
    const sub = getSubmissionForStudent(selectedAssignment.id, currentStudent.studentId);
    if (sub && sub.rounds.length > 0) {
      setRounds(sub.rounds);
      setFinalReflection(sub.finalSynthesisReflection || '');
      setAttachments(sub.attachments || []);
    } else {
      setRounds(buildDefaultRounds(selectedAssignment));
      setFinalReflection(
        '通过不少于3轮的提示词迭代与九宫格图像上传对比，完成了从概念设定到最终定型的完整数字艺术创作流程。'
      );
      setAttachments([]);
    }
    setActiveRoundIdx(0);
  }, [selectedAssignmentId, currentStudent.studentId]);

  if (!isOpen) return null;

  const activeRound = rounds[activeRoundIdx] || rounds[0];

  const updateCurrentRound = (fields: Partial<PromptRound>) => {
    setRounds((prev) => {
      const next = [...prev];
      next[activeRoundIdx] = {
        ...next[activeRoundIdx],
        ...fields,
        completedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      };
      return next;
    });
  };

  // Batch upload 1..9 images into current round's 9-grid
  const handleBatchImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setIsUploadingImages(true);
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

      updateCurrentRound({ images: updatedImages });
      setToastMessage(
        `已成功上传 ${files.length} 张图片至第 ${activeRound.roundNumber} 轮九宫格！`
      );
      setTimeout(() => setToastMessage(''), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploadingImages(false);
      e.target.value = '';
    }
  };

  // Replace a single slot (0..8) in the 9-grid
  const handleSingleSlotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || replacingSlotIdx === null) return;

    setIsUploadingImages(true);
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
      updateCurrentRound({ images: updatedImages });
      setToastMessage(
        `已替换第 ${activeRound.roundNumber} 轮九宫格 #0${replacingSlotIdx + 1} 位置图片！`
      );
      setTimeout(() => setToastMessage(''), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploadingImages(false);
      setReplacingSlotIdx(null);
      e.target.value = '';
    }
  };

  // Upload supplementary attachment files (PDF, ZIP, PSD, etc.)
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
    setToastMessage(`已上传 ${newItems.length} 个作业附件文档！`);
    setTimeout(() => setToastMessage(''), 2500);
    e.target.value = '';
  };

  const handleSetHero = (imgId: string) => {
    const updated = activeRound.images.map((img) => ({
      ...img,
      isSelectedHero: img.id === imgId,
    }));
    updateCurrentRound({ images: updated });
  };

  const handleAddRound = () => {
    const nextNum = rounds.length + 1;
    const newRound: PromptRound = {
      roundNumber: nextNum,
      roundTitle: `第${nextNum}轮：深化实验与视觉定型`,
      conceptualIntent: `在第${nextNum - 1}轮基础上继续深化概念与细节控制。`,
      positivePrompt: activeRound.positivePrompt,
      negativePrompt: activeRound.negativePrompt,
      parameters: { ...activeRound.parameters },
      images: generate9GridImages('default', nextNum, activeRound.positivePrompt),
      reflectionAndCritique: `第${nextNum}轮九宫格迭代对比反思。`,
      completedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };
    setRounds([...rounds, newRound]);
    setActiveRoundIdx(rounds.length);
  };

  const buildSubmissionPayload = (): StudentSubmission => ({
    id: existingSub?.id || `sub_${currentStudent.studentId}_${selectedAssignment.id}`,
    assignmentId: selectedAssignment.id,
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
  });

  const handleSave = () => {
    const payload = buildSubmissionPayload();
    saveSubmissionDraft(payload);
    setToastMessage('作业上传记录已保存！');
    setTimeout(() => setToastMessage(''), 2500);
  };

  const handleConfirmSubmit = () => {
    if (rounds.length < 3) {
      alert('需要至少完成 3 轮提示词与九宫格记录方可正式提交！');
      return;
    }
    const payload = buildSubmissionPayload();
    submitAssignment(payload);
    setToastMessage('作业已正式上传提交至教师评阅端！');
    setTimeout(() => {
      setToastMessage('');
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Hidden File Inputs */}
        <input
          ref={batchInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleBatchImagesUpload}
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

        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                《人工智能与数字艺术》· 学生作业上传端口
              </h3>
              <p className="text-xs text-slate-400">
                当前登录：{currentStudent.name} ({currentStudent.studentId} ·{' '}
                {currentStudent.className}) · 支持本地图片批量上传九宫格与作业附件提交
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast Banner */}
        {toastMessage && (
          <div className="px-6 py-2.5 bg-emerald-600 text-white text-xs font-semibold flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{toastMessage}</span>
            </div>
            <span className="text-[11px] opacity-90">已实时同步至云端存档</span>
          </div>
        )}

        {/* Top Assignment & Round Selector Strip */}
        <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1">
            <label className="text-xs font-bold text-slate-700 whitespace-nowrap">
              选择上传作业项：
            </label>
            <select
              value={selectedAssignmentId}
              onChange={(e) => setSelectedAssignmentId(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 max-w-md"
            >
              {assignments.map((asg) => (
                <option key={asg.id} value={asg.id}>
                  {asg.title} ({asg.isFinalExam ? '期末40%' : '平时10%'})
                </option>
              ))}
            </select>
          </div>

          {/* Round Selector Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {rounds.map((r, idx) => {
              const uploadedCount = r.images.filter((img) => img.isCustomUpload).length;
              return (
                <button
                  key={r.roundNumber}
                  type="button"
                  onClick={() => setActiveRoundIdx(idx)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                    activeRoundIdx === idx
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  第 {r.roundNumber} 轮
                  {uploadedCount > 0 && (
                    <span className="ml-1 text-[10px] text-emerald-400">
                      (已传{uploadedCount}图)
                    </span>
                  )}
                </button>
              );
            })}
            <button
              type="button"
              onClick={handleAddRound}
              className="px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg flex items-center gap-1 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>新增轮次</span>
            </button>
          </div>
        </div>

        {/* Main Scrollable Upload Content */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-50/40">
          {/* Left Column (7 cols): 9-Grid Image Upload Zone */}
          <div className="lg:col-span-7 space-y-4">
            {/* Prominent Drag & Drop / Batch Upload Box */}
            <div className="p-5 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-blue-600" />
                  <h4 className="text-xs font-bold text-slate-900">
                    第 {activeRound.roundNumber} 轮 · 本地生成图像批量上传 (9宫格)
                  </h4>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  支持一次多选上传 1～9 张本地生成的图像（PNG / JPG / WEBP），或点击下方九宫格中任意单张图进行单独替换。
                </p>
              </div>

              <button
                type="button"
                disabled={isUploadingImages}
                onClick={() => batchInputRef.current?.click()}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <Upload className="w-4 h-4" />
                <span>{isUploadingImages ? '正在读取图片...' : '批量选择图片上传 (最多9张)'}</span>
              </button>
            </div>

            {/* Interactive 3x3 9-Grid Upload Matrix */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">
                  第 {activeRound.roundNumber} 轮 · 9 宫格图像槽位（点击单图可替换上传）
                </span>
                <span className="text-[11px] text-slate-500">
                  已上传本地实图：{' '}
                  <strong className="text-blue-600 font-mono">
                    {activeRound.images.filter((i) => i.isCustomUpload).length}
                  </strong>{' '}
                  / 9 张
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2.5 bg-slate-100/70 p-2.5 rounded-xl border border-slate-200">
                {activeRound.images.map((img, idx) => (
                  <div
                    key={img.id}
                    className={`relative group rounded-lg overflow-hidden border bg-white ${
                      img.isSelectedHero
                        ? 'border-amber-500 ring-2 ring-amber-400/50'
                        : 'border-slate-300'
                    }`}
                  >
                    <img
                      src={img.url}
                      alt={img.title}
                      className="w-full aspect-square object-cover"
                    />

                    {/* Top status indicators */}
                    <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between gap-1 pointer-events-none">
                      {img.isSelectedHero ? (
                        <span className="bg-amber-500 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <Award className="w-2.5 h-2.5" />
                          <span>标杆</span>
                        </span>
                      ) : (
                        <span />
                      )}
                      {img.isCustomUpload && (
                        <span className="bg-emerald-600 text-white font-bold text-[9px] px-1.5 py-0.5 rounded">
                          实传图
                        </span>
                      )}
                    </div>

                    {/* Hover Upload / Hero Actions */}
                    <div className="absolute inset-0 bg-slate-950/65 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-2">
                      <button
                        type="button"
                        onClick={() => {
                          setReplacingSlotIdx(idx);
                          singleSlotInputRef.current?.click();
                        }}
                        className="w-full py-1 px-2 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold rounded flex items-center justify-center gap-1"
                      >
                        <Upload className="w-3 h-3" />
                        <span>上传替换 #0{idx + 1}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetHero(img.id)}
                        className="w-full py-1 px-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-[10px] font-bold rounded"
                      >
                        {img.isSelectedHero ? '当前标杆' : '设为主推标杆'}
                      </button>
                    </div>

                    <div className="absolute bottom-0 inset-x-0 bg-slate-950/80 text-white text-[9px] px-2 py-0.5 font-mono truncate">
                      #0{idx + 1} · {img.isCustomUpload ? '本地上传' : '预设变体'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): Prompt Record & File Attachment Upload */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">
                第 {activeRound.roundNumber} 轮 · 提示词与反思记录
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  本轮构思说明 (Concept Intent) *
                </label>
                <textarea
                  rows={2}
                  value={activeRound.conceptualIntent}
                  onChange={(e) => updateCurrentRound({ conceptualIntent: e.target.value })}
                  placeholder="填写本轮视觉构思、主体意象与设计目标..."
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-blue-700 mb-1">
                  本轮正向提示词 (Positive Prompt) *
                </label>
                <textarea
                  rows={3}
                  value={activeRound.positivePrompt}
                  onChange={(e) => updateCurrentRound({ positivePrompt: e.target.value })}
                  placeholder="粘贴或输入生成本轮9张图所使用的正向提示词..."
                  className="w-full px-2.5 py-1.5 text-xs font-mono border border-blue-200 bg-blue-50/20 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-red-700 mb-1">
                  负向提示词 (Negative Prompt)
                </label>
                <input
                  type="text"
                  value={activeRound.negativePrompt}
                  onChange={(e) => updateCurrentRound({ negativePrompt: e.target.value })}
                  placeholder="blurry, low quality, deformed..."
                  className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-emerald-800 mb-1">
                  本轮效果分析与下一轮改进反思 *
                </label>
                <textarea
                  rows={2}
                  value={activeRound.reflectionAndCritique}
                  onChange={(e) =>
                    updateCurrentRound({ reflectionAndCritique: e.target.value })
                  }
                  placeholder="针对本轮9张图的效果评价及下一轮修改计划..."
                  className="w-full px-2.5 py-1.5 text-xs border border-emerald-200 bg-emerald-50/20 rounded-lg"
                />
              </div>
            </div>

            {/* Deliverable File Attachments Upload Card */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <FolderUp className="w-4 h-4 text-indigo-600" />
                    <span>作业成果附件上传 (可选)</span>
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    支持上传 PDF报告、高清大图压缩包(.zip)、源文件(.psd)或汇报课件
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => attachmentInputRef.current?.click()}
                  className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg flex items-center gap-1 whitespace-nowrap"
                >
                  <FileUp className="w-3.5 h-3.5" />
                  <span>上传文件</span>
                </button>
              </div>

              {attachments.length > 0 ? (
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="font-medium text-slate-800 truncate">
                          {att.fileName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          ({att.fileSize})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setAttachments((prev) => prev.filter((item) => item.id !== att.id))
                        }
                        className="text-slate-400 hover:text-red-600 p-0.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[11px] text-slate-400 py-2 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                  暂未上传额外工程附件（点击右上方“上传文件”添加）
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            {onOpenFullWorkspace && (
              <button
                type="button"
                onClick={() => {
                  handleSave();
                  onClose();
                  onOpenFullWorkspace(selectedAssignment.id);
                }}
                className="px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                进入全屏工作台精修
              </button>
            )}
            {onOpenPdfReport && (
              <button
                type="button"
                onClick={() => {
                  const payload = buildSubmissionPayload();
                  saveSubmissionDraft(payload);
                  onOpenPdfReport(selectedAssignment, payload);
                }}
                className="px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>生成并导出 PDF 总结报告</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>暂存上传草稿</span>
            </button>
            <button
              type="button"
              onClick={handleConfirmSubmit}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>确认上传并正式提交作业</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
