"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const UserController_1 = require("../controllers/UserController");
const user_dto_1 = require("../../application/dto/user.dto");
const validate_request_middleware_1 = require("../../../../shared/middlewares/validate-request.middleware");
const auth_middleware_1 = require("../../../../shared/middlewares/auth.middleware");
const rbac_middleware_1 = require("../../../../shared/middlewares/rbac.middleware");
const asyncHandler_1 = require("../../../../shared/utils/asyncHandler");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const connection_1 = require("../../../../infrastructure/database/mysql/connection");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
// Multer setup for avatar uploads
const avatarStorage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        const dir = path_1.default.join(__dirname, "../../../../../uploads/avatars");
        if (!fs_1.default.existsSync(dir))
            fs_1.default.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (_req, file, cb) => {
        const ext = path_1.default.extname(file.originalname);
        cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    },
});
const uploadAvatar = (0, multer_1.default)({ storage: avatarStorage, limits: { fileSize: 5 * 1024 * 1024 } });
router.get("/", (0, rbac_middleware_1.requirePermission)("identity.user.view"), (0, asyncHandler_1.asyncHandler)(UserController_1.UserController.list));
router.get("/:id", (0, rbac_middleware_1.requirePermission)("identity.user.view"), (0, asyncHandler_1.asyncHandler)(UserController_1.UserController.getById));
router.post("/", (0, rbac_middleware_1.requirePermission)("identity.user.create"), (0, validate_request_middleware_1.validate)(user_dto_1.createUserSchema), (0, asyncHandler_1.asyncHandler)(UserController_1.UserController.create));
router.patch("/:id", (0, rbac_middleware_1.requirePermission)("identity.user.update"), (0, validate_request_middleware_1.validate)(user_dto_1.updateUserSchema), (0, asyncHandler_1.asyncHandler)(UserController_1.UserController.update));
router.delete("/:id", (0, rbac_middleware_1.requirePermission)("identity.user.deactivate"), (0, asyncHandler_1.asyncHandler)(UserController_1.UserController.deactivate));
// Avatar upload – any authenticated user can upload (or admin for others)
router.post("/:id/avatar", uploadAvatar.single("avatar"), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.file) {
        res.status(400).json({ error: "No file uploaded" });
        return;
    }
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    await connection_1.pool.query("UPDATE users SET avatar_url = ? WHERE id = ?", [avatarUrl, req.params.id]);
    res.json({ data: { avatarUrl } });
}));
exports.default = router;
//# sourceMappingURL=user.routes.js.map