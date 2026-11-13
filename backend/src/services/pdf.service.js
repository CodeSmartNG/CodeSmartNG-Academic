import PDFDocument from "pdfkit";

export const generateReportCardPDF = async (data) => {
  console.log("🚀🚀🚀 generateReportCardPDF CALLED 🚀🚀🚀");

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const chunks = [];
    
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => {
      const buffer = Buffer.concat(chunks);
      console.log(`✅✅✅ PDF COMPLETE: ${buffer.length} bytes ✅✅✅`);
      resolve(buffer);
    });
    doc.on("error", (err) => {
      console.error("❌❌❌ PDF ERROR:", err);
      reject(err);
    });

    // Minimum test
    doc.fontSize(30).text("HELLO PDF", { align: "center" });
    doc.moveDown();
    doc.fontSize(14).text("If you see this, it works!");
    
    doc.end();
  });
};
