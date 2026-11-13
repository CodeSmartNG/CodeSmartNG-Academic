import PDFDocument from "pdfkit";

// Helper: format grade color for PDF
const gradeColor = (grade) => {
  if (!grade) return "#64748b";
  const g = grade.toUpperCase();
  if (g.startsWith("A") || g.startsWith("B")) return "#16a34a"; // green
  if (g.startsWith("C")) return "#2563eb"; // blue
  if (g.startsWith("D") || g.startsWith("E")) return "#d97706"; // amber
  if (g.startsWith("F")) return "#dc2626"; // red
  return "#64748b";
};

export const generateReportCardPDF = async (data) => {
  const { school, student, class: cls, session, term, results, summary, isSecondary } = data;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const marginLeft = 40;
    const contentWidth = pageWidth - 80;

    // ═══════════════════════════════════════════════════════
    // 1. HEADER — School info
    // ═══════════════════════════════════════════════════════
    doc.rect(0, 0, pageWidth, 90).fill(isSecondary ? "#0b2b4f" : "#0b4d2f");

    doc.fillColor("white")
      .fontSize(22)
      .font("Helvetica-Bold")
      .text(school?.name || "School Name", marginLeft, 24, { width: contentWidth, align: "center" });

    doc.fontSize(10)
      .font("Helvetica")
      .text(`${school?.address || ""}`, marginLeft, 52, { width: contentWidth, align: "center" });

    doc.fontSize(9)
      .text(`${isSecondary ? "SECONDARY SCHOOL REPORT CARD" : "PRIMARY SCHOOL REPORT CARD"}`, marginLeft, 70, {
        width: contentWidth,
        align: "center",
        characterSpacing: 1,
      });

    doc.moveDown(3);

    // ═══════════════════════════════════════════════════════
    // 2. SESSION / TERM BAR
    // ═══════════════════════════════════════════════════════
    let y = 105;
    doc.rect(marginLeft, y, contentWidth, 22).fill("#f1f5f9");
    doc.fillColor("#0f172a")
      .fontSize(9)
      .font("Helvetica-Bold")
      .text(`SESSION: ${session}`, marginLeft + 8, y + 7)
      .text(`TERM: ${term}`, marginLeft + 200, y + 7)
      .text(`CLASS: ${cls?.name || student.className || ""}`, marginLeft + 380, y + 7);

    // ═══════════════════════════════════════════════════════
    // 3. STUDENT INFO
    // ═══════════════════════════════════════════════════════
    y = 140;
    doc.fillColor("#334155").fontSize(10).font("Helvetica-Bold");

    const row1 = [
      ["NAME", student.fullName],
      ["ADMISSION NO", student.admissionNumber],
    ];
    const row2 = [
      ["GENDER", student.gender?.toUpperCase()],
      ["STREAM", isSecondary && student.stream ? student.stream.toUpperCase() : "N/A"],
    ];

    let x = marginLeft;
    for (const [label, value] of row1) {
      doc.fontSize(8).fillColor("#64748b").text(label, x, y);
      doc.fontSize(10).fillColor("#0f172a").font("Helvetica-Bold").text(value || "—", x, y + 12);
      x += contentWidth / 2;
    }
    y += 32;

    x = marginLeft;
    for (const [label, value] of row2) {
      doc.fontSize(8).fillColor("#64748b").font("Helvetica").text(label, x, y);
      doc.fontSize(10).fillColor("#0f172a").font("Helvetica-Bold").text(value || "—", x, y + 12);
      x += contentWidth / 2;
    }
    y += 35;

    // ═══════════════════════════════════════════════════════
    // 4. RESULTS TABLE
    // ═══════════════════════════════════════════════════════
    const columns = isSecondary
      ? [
          { label: "SUBJECT", width: 130, align: "left" },
          { label: "CA1", width: 35, align: "center" },
          { label: "CA2", width: 35, align: "center" },
          { label: "ASG", width: 35, align: "center" },
          { label: "EXAM", width: 45, align: "center" },
          { label: "TOTAL", width: 45, align: "center" },
          { label: "GRADE", width: 50, align: "center" },
          { label: "GP", width: 35, align: "center" },
        ]
      : [
          { label: "SUBJECT", width: 190, align: "left" },
          { label: "CA", width: 45, align: "center" },
          { label: "EXAM", width: 45, align: "center" },
          { label: "TOTAL", width: 45, align: "center" },
          { label: "GRADE", width: 50, align: "center" },
          { label: "REMARK", width: 105, align: "left" },
        ];

    // Table header
    doc.rect(marginLeft, y, contentWidth, 22).fill(isSecondary ? "#0b2b4f" : "#0b4d2f");
    let colX = marginLeft;
    doc.fillColor("white").fontSize(8).font("Helvetica-Bold");
    for (const col of columns) {
      doc.text(col.label, colX + 4, y + 7, { width: col.width - 8, align: col.align });
      colX += col.width;
    }
    y += 22;

    // Table rows
    doc.font("Helvetica").fontSize(8).fillColor("#0f172a");
    const lineHeight = 18;
    const maxRows = Math.min(results.length, 20);

    for (let i = 0; i < maxRows; i++) {
      const r = results[i];
      const rowY = y + i * lineHeight;

      // Alternate row background
      if (i % 2 === 0) {
        doc.rect(marginLeft, rowY, contentWidth, lineHeight).fill("#f8fafc");
      }

      // Extract component scores
      const scores = {};
      r.scores?.forEach((s) => {
        scores[s.assessmentName] = s.score;
      });

      const cells = isSecondary
        ? [
            r.subjectId?.name || "—",
            scores["CA 1"] ?? "—",
            scores["CA 2"] ?? "—",
            scores["Assignment"] ?? "—",
            scores["Examination"] ?? "—",
            `${r.totalScore ?? 0}`,
            r.grade || "—",
            r.gradePoint ?? "—",
          ]
        : [
            r.subjectId?.name || "—",
            scores["First Test"] ?? scores["Class Assessment"] ?? "—",
            scores["Examination"] ?? "—",
            `${r.totalScore ?? 0}`,
            r.grade || "—",
            r.remark || "—",
          ];

      colX = marginLeft;
      doc.fillColor("#0f172a");
      for (let c = 0; c < columns.length; c++) {
        const col = columns[c];
        // Color the grade cell
        if (columns[c].label === "GRADE") {
          doc.fillColor(gradeColor(r.grade));
        } else {
          doc.fillColor("#0f172a");
        }
        doc.text(String(cells[c]), colX + 4, rowY + 5, {
          width: col.width - 8,
          align: col.align,
        });
        colX += col.width;
      }
    }

    y += maxRows * lineHeight + 10;

    // ═══════════════════════════════════════════════════════
    // 5. SUMMARY
    // ═══════════════════════════════════════════════════════
    if (summary) {
      doc.rect(marginLeft, y, contentWidth, 42).fill("#f1f5f9").stroke("#cbd5e1");
      
      const summaryCols = [
        { label: "TOTAL SCORE", value: summary.overallTotal ?? "—" },
        { label: "AVERAGE %", value: summary.overallAverage?.toFixed(1) ?? "—" },
        { label: "OVERALL GRADE", value: summary.overallGrade ?? "—" },
        { label: isSecondary ? "TOTAL GP" : "POSITION", value: isSecondary ? summary.gradePoint ?? "—" : summary.positionInClass ?? "—" },
        { label: isSecondary ? "POSITION" : "OUT OF", value: isSecondary ? summary.positionInClass ?? "—" : summary.totalPupilsInClass ?? "—" },
      ];

      const cellWidth = contentWidth / summaryCols.length;
      summaryCols.forEach((sc, i) => {
        const sx = marginLeft + i * cellWidth;
        doc.fillColor("#64748b").fontSize(7).font("Helvetica").text(sc.label, sx + 4, y + 8, { width: cellWidth - 8, align: "center" });
        doc.fillColor(i === 2 ? gradeColor(summary.overallGrade) : "#0f172a")
          .fontSize(12).font("Helvetica-Bold")
          .text(String(sc.value), sx + 4, y + 20, { width: cellWidth - 8, align: "center" });
      });
      y += 55;
    }

    // ═══════════════════════════════════════════════════════
    // 6. COMMENTS
    // ═══════════════════════════════════════════════════════
    doc.fillColor("#334155").fontSize(8).font("Helvetica-Bold").text("FORM TEACHER'S COMMENT", marginLeft, y);
    doc.fillColor("#0f172a").fontSize(9).font("Helvetica").text(summary?.formTeacherComment || "—", marginLeft + 130, y, { width: contentWidth - 130 });
    y += 20;

    doc.fillColor("#334155").fontSize(8).font("Helvetica-Bold").text("HEAD TEACHER'S COMMENT", marginLeft, y);
    doc.fillColor("#0f172a").fontSize(9).font("Helvetica").text(summary?.headTeacherComment || "—", marginLeft + 130, y, { width: contentWidth - 130 });
    y += 30;

    // ═══════════════════════════════════════════════════════
    // 7. GRADING KEY (bottom left)
    // ═══════════════════════════════════════════════════════
    const scale = isSecondary
      ? [
          ["A1", "75-100"], ["B2", "70-74"], ["B3", "65-69"],
          ["C4", "60-64"], ["C5", "55-59"], ["C6", "50-54"],
          ["D7", "45-49"], ["E8", "40-44"], ["F9", "0-39"],
        ]
      : [
          ["A", "70-100"], ["B", "60-69"], ["C", "50-59"],
          ["D", "40-49"], ["E", "30-39"], ["F", "0-29"],
        ];

    doc.fillColor("#334155").fontSize(8).font("Helvetica-Bold").text("GRADING KEY", marginLeft, y);
    y += 12;

    const scaleColWidth = 60;
    const scalePerRow = isSecondary ? 3 : 3;
    for (let i = 0; i < scale.length; i++) {
      const row = Math.floor(i / scalePerRow);
      const col = i % scalePerRow;
      const sx = marginLeft + col * scaleColWidth;
      const sy = y + row * 12;
      doc.fillColor(gradeColor(scale[i][0])).fontSize(8).font("Helvetica-Bold").text(scale[i][0], sx, sy);
      doc.fillColor("#64748b").font("Helvetica").text(scale[i][1], sx + 22, sy);
    }

    // ═══════════════════════════════════════════════════════
    // 8. SIGNATURES (bottom right)
    // ═══════════════════════════════════════════════════════
    const sigY = pageHeight - 70;
    doc.fillColor("#64748b").fontSize(8).font("Helvetica")
      .text("________________________", pageWidth - 200, sigY)
      .text(school?.proprietorName || "Head Teacher", pageWidth - 200, sigY + 12, { width: 160, align: "center" })
      .text("Head Teacher's Signature", pageWidth - 200, sigY + 25, { width: 160, align: "center" });

    // ═══════════════════════════════════════════════════════
    // 9. FOOTER
    // ═══════════════════════════════════════════════════════
    doc.fillColor("#94a3b8").fontSize(7).font("Helvetica")
      .text(
        `Generated by CodeSmartNG Academic · ${new Date().toLocaleDateString()}`,
        marginLeft,
        pageHeight - 30,
        { width: contentWidth, align: "center" }
      );

    doc.end();
  });
};
