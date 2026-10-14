import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

/**
 * Generates a report card PDF and returns it as a Buffer.
 * Supports both primary (numeric) and nursery (developmental).
 */
export const generateReportCardPDF = (data) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 40 });
      const chunks = [];
      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const { school, student, class: cls, session, term, results, summary } = data;

      const isNursery = cls?.level === "nursery";

      // ── Header ───────────────────────────────────────────
      doc.fontSize(20).font("Helvetica-Bold")
        .text(school.name.toUpperCase(), { align: "center" });
      doc.fontSize(10).font("Helvetica")
        .text(`${term} Report Card — ${session}`, { align: "center" });
      doc.moveDown(0.5);

      // ── Pupil info ──────────────────────────────────────
      doc.fontSize(11).font("Helvetica-Bold").text("Pupil Information", { underline: true });
      doc.moveDown(0.3);
      doc.fontSize(10).font("Helvetica");
      doc.text(`Name: ${student.fullName}`);
      doc.text(`Admission No: ${student.admissionNumber}`);
      doc.text(`Class: ${cls?.name || student.className}`);
      doc.text(`Gender: ${student.gender}`);
      if (student.dateOfBirth) {
        const age = Math.floor((Date.now() - new Date(student.dateOfBirth).getTime())
          / (365.25 * 24 * 60 * 60 * 1000));
        doc.text(`Age: ${age} years`);
      }
      doc.moveDown(0.7);

      if (isNursery) {
        // ── Nursery developmental table ────────────────
        doc.fontSize(11).font("Helvetica-Bold").text("Developmental Assessment", { underline: true });
        doc.moveDown(0.3);
        doc.fontSize(10).font("Helvetica");

        const headerY = doc.y;
        doc.text("Skill Area", 40, headerY, { width: 200 });
        doc.text("Rating",
