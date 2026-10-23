import PDFDocument from "pdfkit";

export const generateReportCardPDF = (data) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const chunks = [];
      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => {
        const buffer = Buffer.concat(chunks);
        console.log(`✅ PDF Generated: ${buffer.length} bytes`);
        resolve(buffer);
      });
      doc.on("error", reject);

      const { school, student, class: cls, session, term, results, summary } = data;

      // Header
      doc.fontSize(20).text(school?.name || "School Name", { align: "center" });
      doc.fontSize(12).text(`${term || ""} Report Card — ${session || ""}`, { align: "center" });
      doc.moveDown();

      // Pupil Info
      doc.fontSize(10);
      doc.text(`Name: ${student?.fullName || "Unknown"}`);
      doc.text(`Admission No: ${student?.admissionNumber || "Unknown"}`);
      doc.text(`Class: ${cls?.name || student?.className || "Unknown"}`);
      doc.moveDown();

      // Table Header
      doc.fontSize(11).font("Helvetica-Bold");
      doc.text("Subject", 50, doc.y);
      doc.text("Score", 250, doc.y - 12);
      doc.text("Grade", 350, doc.y - 12);
      doc.text("Remark", 420, doc.y - 12);
      doc.moveDown();
      doc.font("Helvetica");

      // Table Rows
      (results || []).forEach((r) => {
        doc.text(r?.subjectId?.name || "—", 50, doc.y);
        doc.text(`${r?.totalScore ?? 0}/${r?.maxPossible ?? 100}`, 250, doc.y - 12);
        doc.text(r?.grade || "—", 350, doc.y - 12);
        doc.text(r?.remark || "—", 420, doc.y - 12);
        doc.moveDown();
      });

      doc.moveDown();

      // Summary
      doc.font("Helvetica-Bold");
      doc.text(`Total: ${summary?.overallTotal ?? 0}`);
      doc.text(`Average: ${summary?.overallAverage ?? 0}%`);
      doc.text(`Grade: ${summary?.overallGrade ?? "—"}`);
      doc.text(`Position: ${summary?.positionInClass ?? "—"} of ${summary?.totalPupilsInClass ?? "—"}`);

      doc.end();
    } catch (err) {
      console.error("❌ PDF ERROR:", err);
      reject(err);
    }
  });
};
