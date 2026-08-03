import PDFDocument from "pdfkit";
import { MOMDocument } from "./MOMGeneratorService";

export class MOMExportService {
  async toPdfBuffer(mom: MOMDocument): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: "A4" });
      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      doc.fontSize(18).text("Minutes of Meeting", { align: "center" });
      doc.moveDown(0.5);
      doc.fontSize(14).text(mom.meetingTitle);
      doc.fontSize(10).fillColor("#666").text(`${mom.meetingType.replace(/_/g, " ")} · ${mom.meetingDate} · ${mom.status}`);
      doc.fillColor("#000").moveDown();

      doc.fontSize(12).text("Attendees");
      doc.fontSize(9).text(mom.attendees.length > 0 ? mom.attendees.join(", ") : "None recorded.");
      doc.moveDown();

      doc.fontSize(12).text("Agenda");
      doc.fontSize(9);
      mom.agenda.forEach((item, i) => doc.text(`${i + 1}. ${item}`));
      if (mom.agenda.length === 0) doc.text("No agenda items recorded.");
      doc.moveDown();

      if (mom.discussionNotes) {
        doc.fontSize(12).text("Discussion Notes");
        doc.fontSize(9).text(mom.discussionNotes);
        doc.moveDown();
      }

      if (mom.reviewSections.length > 0) {
        doc.fontSize(12).text("Review Sections");
        doc.fontSize(9);
        for (const s of mom.reviewSections) {
          doc.text(`${s.reviewType.replace(/_/g, " ").toUpperCase()}${s.hasAutomatedData ? " (linked to live report data)" : ""}: ${s.notes ?? "No notes."}`);
        }
        doc.moveDown();
      }

      doc.fontSize(12).text("Decision Register");
      doc.fontSize(9);
      mom.decisions.forEach((d, i) => doc.text(`${i + 1}. ${d}`));
      if (mom.decisions.length === 0) doc.text("No decisions recorded.");
      doc.moveDown();

      doc.fontSize(12).text("Action Tracker");
      doc.fontSize(9);
      for (const a of mom.actions) {
        doc.text(`[${a.status.toUpperCase()}] ${a.description} — ${a.assignee}, due ${a.targetDate}, priority ${a.priority}`);
      }
      if (mom.actions.length === 0) doc.text("No actions recorded.");
      doc.moveDown();

      if (mom.carriedForwardPendingActions.length > 0) {
        doc.fontSize(12).text("Pending Actions Carried Forward From Previous Meeting");
        doc.fontSize(9);
        for (const a of mom.carriedForwardPendingActions) {
          doc.text(`[${a.status.toUpperCase()}] ${a.description} — ${a.assignee}, due ${a.targetDate}`);
        }
        doc.moveDown();
      }

      if (mom.attachments.length > 0) {
        doc.fontSize(12).text("Attachments");
        doc.fontSize(9).text(mom.attachments.join(", "));
      }

      doc.end();
    });
  }
}
