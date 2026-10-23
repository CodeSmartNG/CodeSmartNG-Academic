import PDFDocument from "pdfkit";

export const generateReportCardPDF = async (data) => {
  console.log("🎯🎯🎯 PDF SERVICE STARTED 🎯🎯🎯");
  console.log("Data received:", {
    student: data?.student?.fullName,
    resultsCount: data?.results?.length,
    schoolName: data?.school?.name,
  });

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const chunks = [];
      
      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => {
        const buffer = Buffer.concat(chunks);
        console.log(`✅✅✅ PDF BUFFER: ${buffer.length} bytes ✅✅✅`);
        resolve(buffer);
      });
      doc.on("error", (err) => {
        console.error("❌ PDF Stream Error:", err);
        reject(err);
      });

      // Minimal content
      doc.fontSize(24).font("Helvetica-Bold").fillColor("#000").text("CODE SMART NG", { align: "center" });
      doc.moveDown();
      doc.fontSize(14).font("Helvetica").text(`School: ${data?.school?.name || "Unknown"}`);
      doc.text(`Student: ${data?.student?.fullName || "Unknown"}`);
      doc.text(`Admission: ${data?.student?.admissionNumber || "Unknown"}`);
      doc.text(`Class: ${data?.class?.name || "Unknown"}`);
      doc.text(`Session: ${data?.session || "Unknown"}`);
      doc.text(`Term: ${data?.term || "Unknown"}`);
      doc.text(`Subjects: ${data?.results?.length || 0}`);
      doc.moveDown();
      doc.text("If you can read this, the PDF is working!");
      doc.moveDown();
      doc.fontSize(10).fillColor("#666").text(`Generated: ${new Date().toLocaleString()}`);

      doc.end();
    } catch (err) {
      console.error("❌ PDF CATCH ERROR:", err);
      reject(err);
    }
  });
};
