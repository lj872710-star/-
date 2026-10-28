import React, { useState } from 'react';
import { useCourse } from '../context/CourseContext';
import { AssignmentTemplate, RubricItem } from '../types';
import {
  X,
  Plus,
  Layers,
  Save,
  Trash2,
  Copy,
  Sparkles,
  Calendar,
  Grid,
  Check,
  ArrowRight,
  BookOpen,
} from 'lucide-react';

interface TemplateStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplateToCreate?: (templateId: string) => void;
}

export const TemplateStudioModal: React.FC<TemplateStudioModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplateToCreate,
}) => {
  const { templates, addTemplate, updateTemplate, deleteTemplate, createAssignmentFromTemplate } = useCourse();

  const [activeTab, setActiveTab] = useState<'list' | 'editor'>('list');
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [courseCategory, setCourseCategory] = useState('《人工智能与数字艺术》');
  const [conceptBrief, setConceptBrief] = useState('');
  const [detailedRequirements, setDetailedRequirements] = useState('');
  const [minPromptRounds, setMinPromptRounds] = useState(3);
  const [imageCountPerRound, setImageCountPerRound] = useState(9);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [styleKeywordsText, setStyleKeywordsText] = useState('超写实光影, 几何解构, 概念艺术, 8k');
  const [defaultDeadlineDays, setDefaultDeadlineDays] = useState(7);
  const [rubricItems, setRubricItems] = useState<RubricItem[]>([
    { id: 'rb_c1', name: '概念传达与理论依据', weight: 25, maxScore: 25, description: '对作业设计概念的理解深度' },
    { id: 'rb_c2', name: '提示词工程与迭代深度', weight: 35, maxScore: 35, description: '提示词结构清晰度及不少于3轮有效递进' },
    { id: 'rb_c3', name: '九宫格生成质量与选优', weight: 25, maxScore: 25, description: '九宫格图像视觉冲击力与变体挑选' },
    { id: 'rb_c4', name: '设计反思与总结报告', weight: 15, maxScore: 15, description: '自我审视能力与技术演化记录' },
  ]);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [createdAssignmentMsg, setCreatedAssignmentMsg] = useState('');

  if (!isOpen) return null;

  const handleOpenCreateNew = () => {
    setEditingTemplateId(null);
    setTitle('');
    setCourseCategory('《人工智能与数字艺术》');
    setConceptBrief('');
    setDetailedRequirements('1. 阐明概念内核；\n2. 完成不少于3轮提示词深入迭代；\n3. 每轮输出完整的9张图九宫格变体矩阵；\n4. 记录每轮反思并导出PDF报告。');
    setMinPromptRounds(3);
    setImageCountPerRound(9);
    setAspectRatio('1:1');
    setStyleKeywordsText('超写实光影, 工业质感, 概念艺术, 8k');
    setDefaultDeadlineDays(7);
    setActiveTab('editor');
  };

  const handleEditTemplate = (tpl: AssignmentTemplate) => {
    setEditingTemplateId(tpl.id);
    setTitle(tpl.title);
    setCourseCategory(tpl.courseCategory);
    setConceptBrief(tpl.conceptBrief);
    setDetailedRequirements(tpl.detailedRequirements);
    setMinPromptRounds(tpl.minPromptRounds);
    setImageCountPerRound(tpl.imageCountPerRound);
    setAspectRatio(tpl.aspectRatio);
    setStyleKeywordsText(tpl.styleKeywords.join(', '));
    setDefaultDeadlineDays(tpl.defaultDeadlineDays);
    setRubricItems(tpl.rubricItems);
    setActiveTab('editor');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !conceptBrief.trim()) return;

    const keywords = styleKeywordsText
      .split(/[,，、]/)
      .map((k) => k.trim())
      .filter(Boolean);

    if (editingTemplateId) {
      updateTemplate({
        id: editingTemplateId,
        title,
        courseCategory,
        conceptBrief,
        detailedRequirements,
        minPromptRounds,
        imageCountPerRound,
        aspectRatio,
        styleKeywords: keywords,
        defaultDeadlineDays,
        rubricItems,
        isCustom: true,
        createdAt: new Date().toISOString(),
      });
    } else {
      addTemplate({
        title,
        courseCategory,
        conceptBrief,
        detailedRequirements,
        minPromptRounds,
        imageCountPerRound,
        aspectRatio,
        styleKeywords: keywords,
        defaultDeadlineDays,
        rubricItems,
      });
    }

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setActiveTab('list');
    }, 800);
  };

  const handleSpawnAssignment = (tplId: string) => {
    const asg = createAssignmentFromTemplate(tplId);
    setCreatedAssignmentMsg(`成功发布新作业: ${asg.title}`);
    if (onSelectTemplateToCreate) {
      onSelectTemplateToCreate(asg.id);
    }
    setTimeout(() => {
      setCreatedAssignmentMsg('');
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">教师作业模版中心 (Assignment Template Studio)</h3>
              <p className="text-xs text-slate-500">
                预设概念说明、AI提示词轮次要求、9宫格图像规格与评分量表，随时一键发布新作业
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'list'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              模版列表 ({templates.length})
            </button>
            <button
              onClick={handleOpenCreateNew}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'editor' && !editingTemplateId
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>新建自定义模版</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Global Toast for Created Assignment */}
        {createdAssignmentMsg && (
          <div className="bg-emerald-600 text-white text-xs px-6 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span className="font-semibold">{createdAssignmentMsg}</span>
            </div>
            <span className="text-[10px] bg-emerald-700 px-2 py-0.5 rounded">学生与教师均已同步</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
          {activeTab === 'list' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  可用作业模版库 ({templates.length} 个)
                </span>
                <span className="text-xs text-slate-500">
                  点击“发布为新作业”即可自动将其添加到全班作业清单
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                              {tpl.courseCategory}
                            </span>
                            {tpl.isCustom && (
                              <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                教师自定义
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 mt-2">{tpl.title}</h4>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                        {tpl.conceptBrief}
                      </p>

                      <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="bg-slate-50 p-2 rounded border border-slate-100">
                          <div className="text-[10px] text-slate-400">提示词迭代</div>
                          <div className="font-bold text-slate-800 mt-0.5">≥ {tpl.minPromptRounds} 轮</div>
                        </div>
                        <div className="bg-slate-50 p-2 rounded border border-slate-100">
                          <div className="text-[10px] text-slate-400">图像规格</div>
                          <div className="font-bold text-slate-800 mt-0.5">{tpl.imageCountPerRound}张九宫格</div>
                        </div>
                        <div className="bg-slate-50 p-2 rounded border border-slate-100">
                          <div className="text-[10px] text-slate-400">默认周期</div>
                          <div className="font-bold text-slate-800 mt-0.5">{tpl.defaultDeadlineDays} 天</div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEditTemplate(tpl)}
                          className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                        >
                          编辑参数
                        </button>
                        {tpl.isCustom && (
                          <button
                            onClick={() => {
                              if (window.confirm(`确定删除模版 "${tpl.title}" 吗？`)) {
                                deleteTemplate(tpl.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <button
                        onClick={() => handleSpawnAssignment(tpl.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-2xs transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5 text-blue-400" />
                        <span>发布为新作业</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Template Editor Form */
            <form onSubmit={handleSave} className="space-y-6 max-w-3xl mx-auto">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="text-sm font-bold text-slate-900">
                    {editingTemplateId ? '编辑自定义作业模版' : '创建全新作业模版'}
                  </h4>
                  <span className="text-xs text-slate-400">* 标有星号的为必填字段</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      模版标题（每次作业以《……英雄榜》命名） *
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="如: 《超现实肌理英雄榜》作业模版"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      课程名称 / 归属
                    </label>
                    <input
                      type="text"
                      value={courseCategory}
                      onChange={(e) => setCourseCategory(e.target.value)}
                      placeholder="《人工智能与数字艺术》"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    概念说明与教学目标 (Concept Explanation) *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={conceptBrief}
                    onChange={(e) => setConceptBrief(e.target.value)}
                    placeholder="详细说明本模版对应的学术概念、美学理论背景、所要训练的AIGC核心技能..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    详细作业要求与操作指引
                  </label>
                  <textarea
                    rows={3}
                    value={detailedRequirements}
                    onChange={(e) => setDetailedRequirements(e.target.value)}
                    placeholder="对学生提交的步骤要求、提示词格式说明等..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>

                {/* Predefined Fields Requested by User */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      AI 提示词最少迭代轮次
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={3}
                        max={10}
                        value={minPromptRounds}
                        onChange={(e) => setMinPromptRounds(Math.max(3, parseInt(e.target.value) || 3))}
                        className="w-20 px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold"
                      />
                      <span className="text-xs text-slate-500">轮 (默认≥3轮)</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      每轮图像生成数量要求
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={9}
                        max={9}
                        value={imageCountPerRound}
                        readOnly
                        className="w-20 px-3 py-2 text-xs border border-slate-200 bg-slate-100 rounded-lg font-bold text-slate-600"
                      />
                      <span className="text-xs text-slate-500">张 (标准九宫格)</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      默认作业截止周期
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={60}
                        value={defaultDeadlineDays}
                        onChange={(e) => setDefaultDeadlineDays(parseInt(e.target.value) || 7)}
                        className="w-20 px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold"
                      />
                      <span className="text-xs text-slate-500">天后截止</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    图像生成规格建议 / 风格关键词 (逗号分隔)
                  </label>
                  <input
                    type="text"
                    value={styleKeywordsText}
                    onChange={(e) => setStyleKeywordsText(e.target.value)}
                    placeholder="如: 超写实光影, 几何解构, 概念艺术, 8k"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>

                {/* Rubric Items */}
                <div className="pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-slate-700">
                      预设评分量表 (Rubric Items - 总分100分)
                    </label>
                    <span className="text-xs font-mono text-blue-600">
                      当前总计: {rubricItems.reduce((acc, r) => acc + r.maxScore, 0)} 分
                    </span>
                  </div>
                  <div className="space-y-2">
                    {rubricItems.map((item, idx) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs"
                      >
                        <span className="w-6 text-slate-400 font-mono">0{idx + 1}</span>
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => {
                            const next = [...rubricItems];
                            next[idx].name = e.target.value;
                            setRubricItems(next);
                          }}
                          className="flex-1 px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                        />
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400">满分:</span>
                          <input
                            type="number"
                            value={item.maxScore}
                            onChange={(e) => {
                              const next = [...rubricItems];
                              next[idx].maxScore = parseInt(e.target.value) || 0;
                              next[idx].weight = parseInt(e.target.value) || 0;
                              setRubricItems(next);
                            }}
                            className="w-14 px-2 py-1 bg-white border border-slate-200 rounded text-xs font-bold text-center"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savedSuccess ? '保存成功！' : '保存模版'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
