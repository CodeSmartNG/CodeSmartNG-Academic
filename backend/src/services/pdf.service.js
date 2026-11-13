import PDFDocument from "pdfkit";

const gradeColor = (grade) => {
  if (!grade) return "#64748b";
  const g = grade.toUpperCase();
  if (g.startsWith("A") || g.startsWith("B")) return "#16a34a";
  if (g.startsWith("C")) return "#2563eb";
  if (g.startsWith("D") || g.startsWith("E")) return "#d97706";
  if (g.startsWith("F")) return "#dc2626";
  return "#64748b";
};

export const generateReportCardPDF = async (data) => {
  const { school, student, class: cls, session, term, results, summary, isSecondary } = data;
  const isSec = isSecondary === true;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W = doc.page.width;
    const H = doc.page.height;
    const L = 40;
    const CW = W - 80;

    // HEADER
    doc.rect(0, 0, W, 90).fill(isSec ? "#0b2b4f" : "#0b4d2f");
    doc.fillColor("white").fontSize(20).font("Helvetica-Bold")
      .text(school?.name || "School Name", L, 20, { width: CW, align: "center" });
    doc.fontSize(9).font("Helvetica")
      .text(school?.address || "", L, 48, { width: CW, align: "center" });
    doc.fontSize(8).text(
      isSec ? "SECONDARY SCHOOL REPORT CARD" : "PRIMARY SCHOOL REPORT CARD",
      L, 68, { width: CW, align: "center", characterSpacing: 1 }
    );

    // SESSION BAR
    let y = 105;
    doc.rect(L, y, CW, 22).fill("#f1f5f9");
    doc.fillColor("#0f172a").fontSize(9).font("Helvetica-Bold")
      .text(`SESSION: ${session}`, L + 8, y + 7)
      .text(`TERM: ${term}`, L + 200, y + 7)
      .text(`CLASS: ${cls?.name || student.className}`, L + 380, y + 7);

    // STUDENT INFO
    y = 140;
    const info = [
      ["NAME", student.fullName],
      ["ADMISSION NO", student.admissionNumber],
      ["GENDER", student.gender?.toUpperCase()],
      ["STREAM", isSec && student.stream ? student.stream.toUpperCase() : "N/A"],
    ];
    let x = L;
    info.forEach((item, i) => {
      if (i === 2) { x = L; y += 32; }
      doc.fontSize(7).fillColor("#64748b").font("Helvetica").text(item[0], x, y);
      doc.fontSize(10).fillColor("#0f172a").font("Helvetica-Bold").text(item[1] || "—", x, y + 12);
      x += CW / 2;
    });
    y += 32;

    // RESULTS TABLE
    const cols = isSec
      ? [
          { label: "SUBJECT", w: 130, a: "left" },
          { label: "CA1", w: 35, a: "center" },
          { label: "CA2", w: 35, a: "center" },
          { label: "ASG", w: 35, a: "center" },
          { label: "EXAM", w: 45, a: "center" },
          { label: "TOTAL", w: 45, a: "center" },
          { label: "GRADE", w: 50, a: "center" },
          { label: "GP", w: 35, a: "center" },
        ]
      : [
          { label: "SUBJECT", w: 190, a: "left" },
          { label: "CA", w: 45, a: "center" },
          { label: "EXAM", w: 45, a: "center" },
          { label: "TOTAL", w: 45, a: "center" },
          { label: "GRADE", w: 50, a: "center" },
          { label: "REMARK", w: 105, a: "left" },
        ];

    doc.rect(L, y, CW, 22).fill(isSec ? "#0b2b4f" : "#0b4d2f");
    let colX = L;
    doc.fillColor("white").fontSize(8).font("Helvetica-Bold");
    cols.forEach((c) => {
      doc.text(c.label, colX + 4, y + 7, { width: c.w - 8, align: c.a });
      colX += c.w;
    });
    y += 22;

    doc.font("Helvetica").fontSize(8);
    const rowH = 18;
    results.slice(0, 20).forEach((r, i) => {
      const rowY = y + i * rowH;
      if (i % 2 === 0) doc.rect(L, rowY, CW, rowH).fill("#f8fafc");
      
      const scores = {};
      r.scores?.forEach((s) => { scores[s.assessmentName] = s.score; });

      const cells = isSec
        ? [r.subjectId?.name, scores["CA 1"] ?? "—", scores["CA 2"] ?? "—",
           scores["Assignment"] ?? "—", scores["Examination"] ?? "—",
           r.totalScore ?? 0, r.grade, r.gradePoint ?? "—"]
        : [r.subjectId?.name, scores["First Test"] ?? "—", scores["Examination"] ?? "—",
           `${r.totalScore}/${r.maxPossible}`, r.grade, r.remark];

      colX = L;
      cols.forEach((c, ci) => {
        doc.fillColor(c.label === "GRADE" ? gradeColor(r.grade) : "#0f172a");
        doc.text(String(cells[ci] ?? ""), colX + 4, rowY + 5, { width: c.w - 8, align: c.a });
        colX += c.w;
      });
    });
    y += Math.min(results.length, 20) * rowH + 15;

    // SUMMARY
    if (summary) {
      doc.rect(L, y, CW, 42).fill("#f1f5f9");
      const sCols = [
        ["TOTAL", summary.overallTotal ?? "—"],
        ["AVERAGE", `${summary.overallAverage?.toFixed(1) ?? 0}%`],
        ["GRADE", summary.overallGrade ?? "—"],
        ...(isSec ? [["GRADE POINT", summary.gradePoint ?? "—"]] : []),
        ["POSITION", summary.positionInClass ? `${summary.positionInClass}/${summary.totalPupilsInClass}` : "—"],
      ];
      const cw = CW / sCols.length;
      sCols.forEach((sc, i) => {
        const sx = L + i * cw;
        doc.fillColor("#64748b").fontSize(7).font("Helvetica").text(sc[0], sx + 4, y + 8, { width: cw - 8, align: "center" });
        doc.fillColor(i === 2 ? gradeColor(summary.overallGrade) : "#0f172a")
          .fontSize(12).font("Helvetica-Bold").text(String(sc[1]), sx + 4, y + 20, { width: cw - 8, align: "center" });
      });
      y += 55;
    }

    // COMMENTS
    doc.fillColor("#334155").fontSize(8).font("Helvetica-Bold").text("FORM TEACHER'S COMMENT:", L, y);
    doc.fillColor("#0f172a").fontSize(9).font("Helvetica").text(summary?.formTeacherComment || "—", L + 130, y, { width: CW - 130 });
    y += 20;
    doc.fillColor("#334155").fontSize(8).font("Helvetica-Bold").text("HEAD TEACHER'S COMMENT:", L, y);
    doc.fillColor("#0f172a").fontSize(9).font("Helvetica").text(summary?.headTeacherComment || "—", L + 130, y, { width: CW - 130 });
    y += 30;

    // GRADING KEY
    const scale = isSec
      ? [["A1", "75-100"], ["B2", "70-74"], ["B3", "65-69"], ["C4", "60-64"], ["C5", "55-59"], ["C6", "50-54"], ["D7", "45-49"], ["E8", "40-44"], ["F9", "0-39"]]
      : [["A", "70-100"], ["B", "60-69"], ["C", "50-59"], ["D", "40-49"], ["E", "30-39"], ["F", "0-29"]];

    doc.fillColor("#334155").fontSize(8).font("Helvetica-Bold").text("GRADING KEY:", L, y);
    y += 12;
    scale.forEach((item, i) => {
      const sx = L + (i % 3) * 70;
      const sy = y + Math.floor(i / 3) * 12;
      doc.fillColor(gradeColor(item[0])).fontSize(8).font("Helvetica-Bold").text(item[0], sx, sy);
      doc.fillColor("#64748b").font("Helvetica").text(item[1], sx + 22, sy);
    });

    // SIGNATURES
    const sigY = H - 70;
    doc.fillColor("#64748b").fontSize(8).font("Helvetica")
      .text("________________________", W - 200, sigY)
      .text(school?.proprietorName || "Head Teacher", W - 200, sigY + 12, { width: 160, align: "center" })
      .text("Head Teacher", W - 200, sigY + 25, { width: 160, align: "center" });

    // FOOTER
    doc.fillColor("#94a3b8").fontSize(7).text(
      `Generated by CodeSmartNG Academic · ${new Date().toLocaleDateString()}`,
      L, H - 30, { width: CW, align: "center" }
    );

    doc.end();
  });
};
