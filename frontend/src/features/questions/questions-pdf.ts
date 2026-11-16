import type { Question } from './questions-api';

export async function downloadQuestionsPdf(
  companyName: string,
  questions: Question[],
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ format: 'a4', unit: 'mm' });
  const margin = 18;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const textWidth = pageWidth - margin * 2;
  let y = margin;

  function addText(
    text: string,
    fontSize: number,
    fontStyle: 'normal' | 'bold' = 'normal',
    gapAfter = 3,
  ) {
    pdf.setFont('helvetica', fontStyle);
    pdf.setFontSize(fontSize);
    const lines = pdf.splitTextToSize(text, textWidth) as string[];
    const lineHeight = fontSize * 0.45;

    for (const line of lines) {
      if (y + lineHeight > pageHeight - margin) {
        pdf.addPage();
        y = margin;
      }
      pdf.text(line, margin, y);
      y += lineHeight;
    }

    y += gapAfter;
  }

  addText(companyName, 18, 'bold', 2);
  addText('Interview Questions', 12, 'normal', 8);

  questions.forEach((question, index) => {
    addText(`${index + 1}. ${question.prompt}`, 11, 'bold', 4);
    addText(`Answer: ${question.answer ?? ''}`, 10, 'normal', 3);

    if (question.specialties.length > 0) {
      addText(
        `Specialties: ${question.specialties.map((specialty) => specialty.name).join(', ')}`,
        9,
        'normal',
        7,
      );
    } else {
      y += 4;
    }
  });

  const safeCompanyName =
    companyName
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9-_]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'company';
  pdf.save(`${safeCompanyName}-questions.pdf`);
}
