import { Assignment, PromptRound, StudentSubmission } from '../types';

export interface StudentBadge {
  id: string;
  title: string;
  englishTitle: string;
  category: 'evolution' | 'consistency' | 'early' | 'excellence';
  description: string;
  criteriaText: string;
  unlocked: boolean;
  progress: number; // 0 to 100
  progressLabel: string;
  unlockedAt?: string;
  relatedAssignmentTitle?: string;
  accentColor: 'blue' | 'emerald' | 'amber' | 'indigo' | 'rose' | 'teal';
  metricHighlight?: string;
}

export interface ConsistencyMetrics {
  overallConsistencyScore: number; // 0 - 100
  promptCoherenceScore: number; // 0 - 100
  negativeFilterStability: number; // 0 - 100
  gridCompletionRate: number; // 0 - 100
  parameterProgressionScore: number; // 0 - 100
  earlyThreeRoundCount: number;
  totalThreeRoundMilestones: number;
  totalRoundsCompleted: number;
}

export interface BadgeSystemSummary {
  badges: StudentBadge[];
  unlockedCount: number;
  totalCount: number;
  metrics: ConsistencyMetrics;
  studentRankTitle: string;
}

/**
 * Evaluates prompt and parameter consistency across rounds of a submission
 */
function evaluateSubmissionConsistency(rounds: PromptRound[]): {
  promptCoherence: number;
  negativeStability: number;
  gridRate: number;
  paramProgression: number;
} {
  if (!rounds || rounds.length === 0) {
    return { promptCoherence: 0, negativeStability: 0, gridRate: 0, paramProgression: 0 };
  }

  // 1. Grid completion & hero selection rate (9 images per round + hero selected)
  const validGridRounds = rounds.filter(
    (r) => r.images && r.images.length === 9 && r.images.some((img) => img.isSelectedHero)
  ).length;
  const gridRate = Math.round((validGridRounds / rounds.length) * 100);

  // 2. Negative prompt hygiene stability
  const roundsWithNeg = rounds.filter(
    (r) => r.negativePrompt && r.negativePrompt.trim().length >= 10
  ).length;
  const negativeStability = Math.round((roundsWithNeg / rounds.length) * 100);

  // 3. Prompt token coherence & progressive enrichment
  let coherencePoints = 0;
  for (let i = 0; i < rounds.length; i++) {
    const promptLen = rounds[i].positivePrompt?.trim().length || 0;
    const intentLen = rounds[i].conceptualIntent?.trim().length || 0;
    const reflectionLen = rounds[i].reflectionAndCritique?.trim().length || 0;

    let roundScore = 0;
    if (promptLen >= 30) roundScore += 40;
    else if (promptLen >= 15) roundScore += 25;

    if (intentLen >= 15) roundScore += 30;
    if (reflectionLen >= 15) roundScore += 30;

    // Bonus if prompt evolves/expands compared to previous round
    if (i > 0) {
      const prevWords = new Set(
        rounds[i - 1].positivePrompt
          .toLowerCase()
          .split(/[\s,]+/)
          .filter((w) => w.length > 3)
      );
      const currWords = rounds[i].positivePrompt
        .toLowerCase()
        .split(/[\s,]+/)
        .filter((w) => w.length > 3);
      const shared = currWords.filter((w) => prevWords.has(w)).length;
      if (shared >= 1 && currWords.length >= prevWords.size) {
        roundScore = Math.min(100, roundScore + 10);
      }
    }
    coherencePoints += Math.min(100, roundScore);
  }
  const promptCoherence = Math.round(coherencePoints / rounds.length);

  // 4. Parameter & aspect ratio consistency
  const baseAspect = rounds[0].parameters?.aspectRatio || '1:1';
  const consistentAspectCount = rounds.filter(
    (r) => (r.parameters?.aspectRatio || '1:1') === baseAspect
  ).length;
  const paramProgression = Math.round((consistentAspectCount / rounds.length) * 100);

  return {
    promptCoherence,
    negativeStability,
    gridRate,
    paramProgression,
  };
}

/**
 * Checks whether a submission achieved the 3-round milestone early (before deadline)
 */
function isEarlyMilestone(sub: StudentSubmission, assignment?: Assignment): boolean {
  if (sub.rounds.length < 3) return false;
  if (!assignment?.deadline) return true;

  const deadlineDate = new Date(assignment.deadline.replace(' ', 'T'));
  const latestRoundTime =
    sub.submittedAt || sub.rounds[sub.rounds.length - 1]?.completedAt;

  if (!latestRoundTime) return true;
  const completedDate = new Date(latestRoundTime.replace(' ', 'T'));

  if (isNaN(deadlineDate.getTime()) || isNaN(completedDate.getTime())) {
    return true;
  }

  // Early if completed before the deadline (at least 12 hours ahead or before deadline date)
  return completedDate.getTime() <= deadlineDate.getTime();
}

export function evaluateStudentBadges(
  studentId: string,
  submissions: StudentSubmission[],
  assignments: Assignment[]
): BadgeSystemSummary {
  const studentSubs = submissions.filter((s) => s.studentId === studentId);

  let totalRoundsCompleted = 0;
  let totalThreeRoundMilestones = 0;
  let earlyThreeRoundCount = 0;
  let deepIterationCount = 0; // >= 4 rounds
  let highGradeCount = 0;
  let earliestMilestoneTimestamp: string | undefined;
  let earliestMilestoneAssignment: string | undefined;
  let bestConsistencyAssignment: string | undefined;

  let sumCoherence = 0;
  let sumNegative = 0;
  let sumGrid = 0;
  let sumParam = 0;

  studentSubs.forEach((sub) => {
    const asg = assignments.find((a) => a.id === sub.assignmentId);
    const roundCount = sub.rounds?.length || 0;
    totalRoundsCompleted += roundCount;

    if (roundCount >= 3) {
      totalThreeRoundMilestones++;
      if (isEarlyMilestone(sub, asg)) {
        earlyThreeRoundCount++;
        const stamp = sub.submittedAt || sub.rounds[2]?.completedAt;
        if (!earliestMilestoneTimestamp) {
          earliestMilestoneTimestamp = stamp;
          earliestMilestoneAssignment = asg?.title;
        }
      }
    }

    if (roundCount >= 4) {
      deepIterationCount++;
    }

    if (sub.status === 'graded' && (sub.grading?.totalScore || 0) >= 90) {
      highGradeCount++;
    }

    const c = evaluateSubmissionConsistency(sub.rounds);
    sumCoherence += c.promptCoherence;
    sumNegative += c.negativeStability;
    sumGrid += c.gridRate;
    sumParam += c.paramProgression;

    if (c.promptCoherence >= 85 && c.gridRate === 100 && !bestConsistencyAssignment) {
      bestConsistencyAssignment = asg?.title;
    }
  });

  const subCount = studentSubs.length;
  const promptCoherenceScore = subCount > 0 ? Math.round(sumCoherence / subCount) : 0;
  const negativeFilterStability = subCount > 0 ? Math.round(sumNegative / subCount) : 0;
  const gridCompletionRate = subCount > 0 ? Math.round(sumGrid / subCount) : 0;
  const parameterProgressionScore = subCount > 0 ? Math.round(sumParam / subCount) : 0;

  const overallConsistencyScore =
    subCount > 0
      ? Math.round(
          promptCoherenceScore * 0.35 +
            negativeFilterStability * 0.2 +
            gridCompletionRate * 0.25 +
            parameterProgressionScore * 0.2
        )
      : 0;

  const badges: StudentBadge[] = [
    {
      id: 'badge_early_3round_pioneer',
      title: '三轮演进先锋',
      englishTitle: '3-Round Evolution Pioneer',
      category: 'early',
      description: '在作业截止日期前率先达成「不少于3轮提示词演进」里程碑，展现敏捷的AIGC构思执行力。',
      criteriaText: '在截止时间前完成任意1次作业的完整3轮提示词演化记录',
      unlocked: earlyThreeRoundCount >= 1,
      progress: Math.min(100, earlyThreeRoundCount * 100),
      progressLabel: `${earlyThreeRoundCount} / 1 次提前达标`,
      unlockedAt: earliestMilestoneTimestamp,
      relatedAssignmentTitle: earliestMilestoneAssignment,
      accentColor: 'blue',
      metricHighlight: earlyThreeRoundCount >= 1 ? `已提前达成 ${earlyThreeRoundCount} 次` : '待解锁',
    },
    {
      id: 'badge_consistency_master',
      title: '九宫格一致性大师',
      englishTitle: '9-Grid Consistency Master',
      category: 'consistency',
      description: '在多轮9宫格图像生成中保持极高的主体语义连贯性、负向词杂讯过滤稳定性与主推标杆甄选完备度。',
      criteriaText: '图像生成综合一致性指数 ≥ 85% 且完成至少 1 份 3 轮九宫格定型',
      unlocked: overallConsistencyScore >= 85 && totalThreeRoundMilestones >= 1,
      progress: Math.min(100, Math.round((overallConsistencyScore / 85) * 100)),
      progressLabel: `一致性指数 ${overallConsistencyScore}% / 85%`,
      unlockedAt: earliestMilestoneTimestamp,
      relatedAssignmentTitle: bestConsistencyAssignment || earliestMilestoneAssignment,
      accentColor: 'emerald',
      metricHighlight: `一致性 ${overallConsistencyScore}%`,
    },
    {
      id: 'badge_multi_evolution_veteran',
      title: '多维迭代架构师',
      englishTitle: 'Iterative Prompt Architect',
      category: 'evolution',
      description: '持续践行提示词工程方法论，累计完成 6 轮以上提示词渐进演化或单次作业突破 4 轮深度实验。',
      criteriaText: '累计完成 ≥ 6 轮提示词迭代，或在单次作业中完成 ≥ 4 轮深度推演',
      unlocked: totalRoundsCompleted >= 6 || deepIterationCount >= 1,
      progress:
        deepIterationCount >= 1
          ? 100
          : Math.min(100, Math.round((totalRoundsCompleted / 6) * 100)),
      progressLabel:
        deepIterationCount >= 1
          ? `已完成 4+ 轮深度实验`
          : `累计完成 ${totalRoundsCompleted} / 6 轮`,
      unlockedAt: earliestMilestoneTimestamp,
      relatedAssignmentTitle: earliestMilestoneAssignment,
      accentColor: 'indigo',
      metricHighlight: `累计 ${totalRoundsCompleted} 轮 / ${totalRoundsCompleted * 9} 图`,
    },
    {
      id: 'badge_negative_guard',
      title: '纯净语义守门人',
      englishTitle: 'Zero-Noise Precision Guard',
      category: 'consistency',
      description: '每一轮提示词均严格配置负向词（Negative Prompts）与一致画幅参数，有效抑制画面畸变与AI杂讯。',
      criteriaText: '负向词过滤稳定度与画幅参数一致率均达到 90% 以上',
      unlocked:
        negativeFilterStability >= 90 &&
        parameterProgressionScore >= 90 &&
        totalThreeRoundMilestones >= 1,
      progress: Math.min(
        100,
        Math.round(((negativeFilterStability + parameterProgressionScore) / 180) * 100)
      ),
      progressLabel: `过滤稳定度 ${negativeFilterStability}%`,
      unlockedAt: earliestMilestoneTimestamp,
      accentColor: 'teal',
      metricHighlight: `参数稳定 ${parameterProgressionScore}%`,
    },
    {
      id: 'badge_academic_excellence',
      title: '学术标杆创作者',
      englishTitle: 'Academic Rubric Laureate',
      category: 'excellence',
      description: '提示词演化链条、九宫格艺术表现与反思报告获得指导教师 90 分以上优秀评级。',
      criteriaText: '任意一次课堂或期末作业获得教师量表评分 ≥ 90 分',
      unlocked: highGradeCount >= 1,
      progress: highGradeCount >= 1 ? 100 : studentSubs.some((s) => s.status === 'submitted') ? 60 : 20,
      progressLabel: highGradeCount >= 1 ? `已获 ${highGradeCount} 次 90+ 评级` : '等待教师评分 ≥ 90',
      unlockedAt: studentSubs.find((s) => (s.grading?.totalScore || 0) >= 90)?.grading?.gradedAt,
      relatedAssignmentTitle: assignments.find(
        (a) => a.id === studentSubs.find((s) => (s.grading?.totalScore || 0) >= 90)?.assignmentId
      )?.title,
      accentColor: 'amber',
      metricHighlight: highGradeCount >= 1 ? '导师认证标杆' : '冲刺 90+ 分',
    },
  ];

  const unlockedCount = badges.filter((b) => b.unlocked).length;

  let studentRankTitle = 'AIGC 见习探索者';
  if (unlockedCount >= 5) studentRankTitle = 'AIGC 首席提示词大师';
  else if (unlockedCount >= 3) studentRankTitle = 'AIGC 高阶概念架构师';
  else if (unlockedCount >= 1) studentRankTitle = 'AIGC 进阶迭代先锋';

  return {
    badges,
    unlockedCount,
    totalCount: badges.length,
    studentRankTitle,
    metrics: {
      overallConsistencyScore,
      promptCoherenceScore,
      negativeFilterStability,
      gridCompletionRate,
      parameterProgressionScore,
      earlyThreeRoundCount,
      totalThreeRoundMilestones,
      totalRoundsCompleted,
    },
  };
}
