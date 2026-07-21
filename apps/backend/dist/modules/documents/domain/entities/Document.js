"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inferPreviewKind = inferPreviewKind;
/** Derived from the filename extension, purely to tell the frontend which
 *  preview mode to use - PDF viewer vs. image viewer vs. no preview. */
function inferPreviewKind(fileName) {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (ext === "pdf")
        return "pdf";
    if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext ?? ""))
        return "image";
    if (["mp4", "mov", "webm"].includes(ext ?? ""))
        return "video";
    return "none";
}
//# sourceMappingURL=Document.js.map