import { jsPDF } from "jspdf";

export const downloadRoadmap = () => {
  const doc = new jsPDF();
  
  // ── Branding Header ──
  doc.setFillColor(11, 43, 79); // CodeSmartNG Dark Blue
  doc.rect(0, 0, 210, 40, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("CodeSmartNG Academic", 105, 18, { align: "center" });
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Quick Start User Guide", 105, 28, { align: "center" });

  // ── Body Text ──
  doc.setTextColor(15, 23, 42); // Slate 900
  let y = 55;

  const addSection = (title, steps) => {
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(27, 74, 122); // Brand Blue
    doc.text(title, 20, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85); // Slate 700

    steps.forEach((step) => {
      const splitText = doc.splitTextToSize(step, 170);
      doc.text(splitText, 20, y);
      y += splitText.length * 5 + 2;
    });
    y += 8;
  };

  addSection("1. Setup Your School Profile", [
    "- Log in to your Dashboard.",
    "- Click your School Logo in the blue banner to upload your school crest.",
    "- Scroll down to 'School Bank Account' and enter your fee collection account details.",
  ]);

  addSection("2. Create Classes & Teachers", [
    "- Add Teachers: Scroll down to 'Add a New Teacher' to create staff login accounts.",
    "- Create Classes: Click 'Classes' -> '+ Create Class'. Use the Primary/Secondary toggle at the top.",
    "- Assign Form Teachers: Click a class, select a teacher, and click Save.",
  ]);

  addSection("3. Add Your Pupils", [
    "- Click 'Pupils' -> '+ Admit Pupil'.",
    "- Fill in their details and select their class.",
    "- Note: For SSS classes, you must select their Stream (Science, Arts, or Commercial).",
  ]);

  addSection("4. Setup Your Fees", [
    "- Click 'Fees' -> 'Fee Structures' tab -> '+ New Fee Structure'.",
    "- Add fee items (e.g., Tuition, Books).",
    "- Pro Tip: Select 'Science Only' for Lab Fees to only charge Science pupils.",
    "- Click 'Generate Bills' to automatically bill every pupil in that class.",
  ]);

  addSection("5. Enter Results & Print Report Cards", [
    "- Click 'Results' -> '+ New Assessment'.",
    "- Enter scores for each pupil and click Save.",
    "- Go to 'Broadsheet & Publish' tab -> Click 'Compute' -> Click 'Publish'.",
    "- Click the blue 'Print' button to download a beautiful PDF Report Card.",
  ]);

  // ── Footer ──
  doc.setDrawColor(200, 200, 200);
  doc.line(20, 275, 190, 275);
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text("Need help? Contact us at codesmartng.com", 105, 282, { align: "center" });

  // Save the PDF
  doc.save("CodeSmartNG_User_Guide.pdf");
};