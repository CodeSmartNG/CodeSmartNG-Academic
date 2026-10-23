import PDFDocument from "pdfkit";

export const generateReportCardPDF = (data) => {
  return new Promise((resolve, reject) => {
    try {
      console.log("📄 PDF SERVICE CALLED");
      console.log("📄 Data received:", {
        student: data?.student?.fullName,
        resultsCount: data?.results?.length,
        hasSummary: !!data?.summary,
      });

      const doc = new PDFDocument();
      const chunks = [];
      
      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => {
        const buffer = Buffer.concat(chunks);
        console.log(`✅ PDF BUFFER READY: ${buffer.length} bytes`);
        resolve(buffer);
      });
      doc.on("error", (err) => {
        console.error("❌ PDF STREAM ERROR:", err);
        reject(err);
      });

      // Simple content
      doc.fontSize(20).text("CodeSmartNG Test", { align: "center" });
      doc.moveDown();
      doc.fontSize(14).text(`Student: ${data?.student?.fullName || "Unknown"}`);
      doc.text(`Term: ${data?.term || "Unknown"}`);
      doc.text(`Session: ${data?.session || "Unknown"}`);
      doc.text(`Subjects: ${data?.results?.length || 0}`);
      doc.moveDown();
      doc.text("If you can read this, PDFKit is working!");

      doc.end();
    } catch (err) {
      console.error("❌ PDF SERVICE ERROR:", err);
      reject(err);
    }
  });
};
