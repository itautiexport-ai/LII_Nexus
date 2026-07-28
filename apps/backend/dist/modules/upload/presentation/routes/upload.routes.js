"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const auth_middleware_1 = require("../../../../shared/middlewares/auth.middleware");
const apiResponse_1 = require("../../../../shared/utils/apiResponse");
const FileParsingService_1 = require("../../application/services/FileParsingService");
const router = (0, express_1.Router)();
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, path_1.default.join(__dirname, "../../../../../uploads"));
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = (0, uuid_1.v4)();
        const ext = path_1.default.extname(file.originalname);
        cb(null, `${uniqueSuffix}${ext}`);
    },
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});
router.post("/upload", auth_middleware_1.authMiddleware, upload.single("file"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: "No file uploaded." });
    }
    // Generate the URL for the uploaded file
    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    let parsedData = [];
    try {
        const parser = new FileParsingService_1.FileParsingService();
        parsedData = await parser.parseSalarySheet(req.file.path);
    }
    catch (err) {
        console.error("Failed to parse file:", err);
    }
    return (0, apiResponse_1.ok)(res, {
        fileUrl,
        fileName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        parsedData
    });
});
exports.default = router;
//# sourceMappingURL=upload.routes.js.map