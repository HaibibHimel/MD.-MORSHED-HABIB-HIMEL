interface CvData {
  profile: {
    full_name: string;
    title_line: string;
    headline: string;
    short_intro: string;
    about_location: string;
    about_description: string;
    contact_email: string;
    contact_phone: string;
    contact_location: string;
    languages: Array<{ language: string; level: string }>;
    interests: string[];
  };
  skills: Array<{ name: string; category: string; description: string }>;
  experiences: Array<{
    role: string;
    company: string;
    period: string;
    location: string;
    responsibilities: string[];
  }>;
  education: Array<{
    degree: string;
    institution: string;
    university: string;
    period: string;
    cgpa: string;
  }>;
  certifications: Array<{
    title: string;
    issuer: string;
    period: string;
  }>;
}

function escapePdfText(input: string): string {
  return input
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if (!current) {
      current = word;
    } else if (current.length + 1 + word.length <= maxChars) {
      current += ' ' + word;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function generatePortfolioPdf(data: CvData): Buffer {
  const pages: string[][] = [[]];
  let y = 745;

  const ensureSpace = (needed: number) => {
    if (y - needed < 56) {
      pages.push([]);
      y = 745;
    }
  };

  const currentOps = () => pages[pages.length - 1];

  const drawText = (
    text: string,
    x: number,
    fontSize: number,
    font: 'F1' | 'F2',
    colorRgb: [number, number, number],
    lineHeight: number
  ) => {
    ensureSpace(lineHeight);
    const [r, g, b] = colorRgb;
    currentOps().push(
      `BT /${font} ${fontSize} Tf ${r} ${g} ${b} rg 1 0 0 1 ${x} ${y} Tm (${escapePdfText(text)}) Tj ET`
    );
    y -= lineHeight;
  };

  const drawRule = () => {
    ensureSpace(14);
    currentOps().push(`0.82 0.85 0.90 RG 0.7 w 52 ${y + 4} m 560 ${y + 4} l S`);
    y -= 10;
  };

  const drawSectionHeader = (title: string) => {
    ensureSpace(28);
    y -= 6;
    drawText(title.toUpperCase(), 52, 10.5, 'F2', [0.09, 0.25, 0.58], 14);
    drawRule();
  };

  // Header
  drawText(data.profile.full_name.toUpperCase(), 52, 20, 'F2', [0.05, 0.10, 0.22], 24);
  drawText(data.profile.title_line, 52, 10.5, 'F2', [0.15, 0.38, 0.78], 15);
  drawText(
    `${data.profile.contact_email}  |  ${data.profile.contact_phone}  |  ${data.profile.about_location}`,
    52,
    9.5,
    'F1',
    [0.28, 0.33, 0.41],
    16
  );

  // Summary
  drawSectionHeader('Professional Summary');
  for (const line of wrapText(data.profile.about_description, 92)) {
    drawText(line, 52, 10, 'F1', [0.12, 0.16, 0.24], 14);
  }

  // Experience
  drawSectionHeader('Work Experience');
  for (const exp of data.experiences) {
    ensureSpace(44);
    drawText(`${exp.role} - ${exp.company}`, 52, 11, 'F2', [0.06, 0.11, 0.20], 14);
    drawText(`${exp.period}  |  ${exp.location}`, 52, 9.5, 'F1', [0.35, 0.41, 0.50], 14);
    for (const resp of exp.responsibilities) {
      const wrapped = wrapText(`- ${resp}`, 88);
      for (const line of wrapped) {
        drawText(line, 62, 9.8, 'F1', [0.15, 0.20, 0.28], 13.5);
      }
    }
    y -= 5;
  }

  // Education
  drawSectionHeader('Education');
  for (const edu of data.education) {
    ensureSpace(40);
    drawText(edu.degree, 52, 11, 'F2', [0.06, 0.11, 0.20], 14);
    drawText(`${edu.institution} (${edu.university})`, 52, 10, 'F1', [0.18, 0.24, 0.34], 14);
    drawText(`${edu.period}  |  ${edu.cgpa}`, 52, 9.5, 'F1', [0.35, 0.41, 0.50], 16);
  }

  // Skills
  drawSectionHeader('Core Skills');
  const skillNames = data.skills.map((s) => s.name).join('  |  ');
  for (const line of wrapText(skillNames, 90)) {
    drawText(line, 52, 10, 'F1', [0.12, 0.16, 0.24], 14);
  }

  // Certifications
  drawSectionHeader('Certifications');
  for (const cert of data.certifications) {
    ensureSpace(32);
    drawText(cert.title, 52, 10.5, 'F2', [0.06, 0.11, 0.20], 14);
    drawText(`${cert.issuer}  |  ${cert.period}`, 52, 9.5, 'F1', [0.30, 0.36, 0.46], 15);
  }

  // Languages & Interests
  drawSectionHeader('Languages & Interests');
  const langs = data.profile.languages.map((l) => `${l.language}: ${l.level}`).join(', ');
  if (langs) {
    drawText(`Languages: ${langs}`, 52, 10, 'F1', [0.12, 0.16, 0.24], 14);
  }
  if (data.profile.interests.length > 0) {
    drawText(`Interests: ${data.profile.interests.join(', ')}`, 52, 10, 'F1', [0.12, 0.16, 0.24], 14);
  }

  // Build PDF objects
  const objects: string[] = [];
  // 1: Catalog, 2: Pages, 3: F1 Helvetica, 4: F2 Helvetica-Bold
  const pageObjIds: number[] = [];
  let nextId = 5;

  const pagePairs: Array<{ pageId: number; contentId: number; stream: string }> = [];
  for (const ops of pages) {
    const pageId = nextId++;
    const contentId = nextId++;
    pageObjIds.push(pageId);
    pagePairs.push({ pageId, contentId, stream: ops.join('\n') });
  }

  objects.push(`1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`);
  objects.push(
    `2 0 obj\n<< /Type /Pages /Kids [${pageObjIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageObjIds.length} >>\nendobj\n`
  );
  objects.push(`3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`);
  objects.push(`4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n`);

  for (const pair of pagePairs) {
    objects.push(
      `${pair.pageId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${pair.contentId} 0 R >>\nendobj\n`
    );
    const streamBytes = Buffer.byteLength(pair.stream, 'utf8');
    objects.push(
      `${pair.contentId} 0 obj\n<< /Length ${streamBytes} >>\nstream\n${pair.stream}\nendstream\nendobj\n`
    );
  }

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += obj;
  }

  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += `0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(pdf, 'utf8');
}
