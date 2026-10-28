import { jsPDF } from 'jspdf';
import { Assignment, StudentSubmission } from '../types';

/**
 * Downloads a structured PDF Summary Report for an assignment submission.
 */
export async function downloadSubmissionPdf(
  assignment: Assignment,
  submission: StudentSubmission
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let currentY = margin;

  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - margin) {
      doc.addPage();
      currentY = margin;
      return true;
    }
    return false;
  };

  // Header banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, currentY, contentWidth, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('AIGC COURSEWORK PORTFOLIO & PROMPT EVOLUTION REPORT', margin + 6, currentY + 9);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text(
    `UniAIGC Academic Assessment · ${assignment.semester} · Submission Verification`,
    margin + 6,
    currentY + 16
  );

  currentY += 28;

  // Metadata Panel
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(margin, currentY, contentWidth, 26, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(assignment.title, margin + 5, currentY + 7);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Student Name: ${submission.studentName}`, margin + 5, currentY + 14);
  doc.text(`Student ID: ${submission.studentId}`, margin + 65, currentY + 14);
  doc.text(`Class: ${submission.studentClass}`, margin + 120, currentY + 14);

  const statusLabel =
    submission.status === 'graded'
      ? `Graded: ${submission.grading?.totalScore} / 100`
      : submission.status === 'submitted'
      ? 'Submitted (Pending Grade)'
      : 'Draft';
  doc.text(`Status: ${statusLabel}`, margin + 5, currentY + 21);
  doc.text(`Submitted At: ${submission.submittedAt || 'N/A'}`, margin + 65, currentY + 21);
  doc.text(`Prompt Iteration Rounds: ${submission.rounds.length}`, margin + 120, currentY + 21);

  currentY += 32;

  // Assignment Concept Overview
  checkPageBreak(25);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('1. ASSIGNMENT CONCEPT & PEDAGOGICAL OBJECTIVES', margin, currentY);
  currentY += 5;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const conceptLines = doc.splitTextToSize(assignment.conceptOverview, contentWidth);
  doc.text(conceptLines, margin, currentY);
  currentY += conceptLines.length * 4 + 6;

  // Prompt Evolution Iterations
  checkPageBreak(20);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('2. MULTI-ROUND PROMPT ITERATION HISTORY (>= 3 ROUNDS)', margin, currentY);
  currentY += 6;

  submission.rounds.forEach((round, index) => {
    checkPageBreak(45);

    // Round box header
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, currentY, contentWidth, 7, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(
      `Round #${round.roundNumber}: ${round.roundTitle} (9-Image Grid Generated)`,
      margin + 4,
      currentY + 5
    );
    currentY += 10;

    // Conceptual Intent
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text('Conceptual Intent:', margin + 4, currentY);
    currentY += 4;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    const intentLines = doc.splitTextToSize(round.conceptualIntent || 'N/A', contentWidth - 8);
    doc.text(intentLines, margin + 4, currentY);
    currentY += intentLines.length * 3.6 + 3;

    // Positive Prompt
    checkPageBreak(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(37, 99, 235); // blue-600
    doc.text('Positive Prompt:', margin + 4, currentY);
    currentY += 4;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    const posLines = doc.splitTextToSize(round.positivePrompt || 'N/A', contentWidth - 8);
    doc.text(posLines, margin + 4, currentY);
    currentY += posLines.length * 3.6 + 3;

    // Negative Prompt
    if (round.negativePrompt) {
      checkPageBreak(15);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(220, 38, 38); // red-600
      doc.text('Negative Prompt:', margin + 4, currentY);
      currentY += 4;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      const negLines = doc.splitTextToSize(round.negativePrompt, contentWidth - 8);
      doc.text(negLines, margin + 4, currentY);
      currentY += negLines.length * 3.6 + 3;
    }

    // 9-Grid Images summary note
    checkPageBreak(15);
    doc.setFillColor(248, 250, 252);
    doc.rect(margin + 4, currentY, contentWidth - 8, 7, 'F');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 116, 139);
    doc.text(
      `* 9 distinct generated visual variants recorded for Round #${round.roundNumber} (Variations 01-09).`,
      margin + 8,
      currentY + 4.5
    );
    currentY += 10;

    // Reflection & Evolution
    checkPageBreak(15);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129); // emerald-600
    doc.text('Critique & Next Iteration Evolution:', margin + 4, currentY);
    currentY += 4;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    const refLines = doc.splitTextToSize(round.reflectionAndCritique || 'N/A', contentWidth - 8);
    doc.text(refLines, margin + 4, currentY);
    currentY += refLines.length * 3.6 + 8;
  });

  // Final Synthesis & Self-Reflection
  checkPageBreak(30);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('3. COMPREHENSIVE SYNTHESIS & SELF-REFLECTION', margin, currentY);
  currentY += 5;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const finalRefLines = doc.splitTextToSize(
    submission.finalSynthesisReflection || 'No overall synthesis provided.',
    contentWidth
  );
  doc.text(finalRefLines, margin, currentY);
  currentY += finalRefLines.length * 3.8 + 8;

  // Teacher Rubric & Assessment Record (If Graded)
  if (submission.grading) {
    checkPageBreak(35);
    doc.setFillColor(240, 253, 244); // green-50
    doc.setDrawColor(187, 247, 208); // green-200
    doc.roundedRect(margin, currentY, contentWidth, 32, 2, 2, 'FD');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(22, 101, 52); // green-800
    doc.text(
      `4. INSTRUCTOR EVALUATION & RUBRIC SCORE: ${submission.grading.totalScore} / 100`,
      margin + 5,
      currentY + 7
    );

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Graded by: ${submission.grading.teacherName} · Date: ${submission.grading.gradedAt}`, margin + 5, currentY + 13);

    const feedbackLines = doc.splitTextToSize(`Feedback: ${submission.grading.feedback}`, contentWidth - 10);
    doc.text(feedbackLines, margin + 5, currentY + 19);

    currentY += 36;
  }

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(
      `UniAIGC Academic Coursework Portfolio · Page ${p} of ${totalPages} · Student ID: ${submission.studentId}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
  }

  // Save the PDF file
  const filename = `${submission.studentId}_${submission.studentName}_${assignment.title.slice(0, 15)}_SummaryReport.pdf`;
  doc.save(filename);
}
