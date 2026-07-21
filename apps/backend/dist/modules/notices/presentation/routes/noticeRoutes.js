"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.noticeRoutes = void 0;
const express_1 = require("express");
const NoticeController_1 = require("../controllers/NoticeController");
const NoticeService_1 = require("../../application/services/NoticeService");
const MySqlNoticeRepository_1 = require("../../infrastructure/repositories/MySqlNoticeRepository");
const connection_1 = require("../../../../infrastructure/database/mysql/connection");
const router = (0, express_1.Router)();
exports.noticeRoutes = router;
const repo = new MySqlNoticeRepository_1.MySqlNoticeRepository(connection_1.pool);
const service = new NoticeService_1.NoticeService(repo);
const controller = new NoticeController_1.NoticeController(service);
router.get('/', controller.getNotices.bind(controller));
router.post('/', controller.createNotice.bind(controller));
router.delete('/:id', controller.deleteNotice.bind(controller));
//# sourceMappingURL=noticeRoutes.js.map