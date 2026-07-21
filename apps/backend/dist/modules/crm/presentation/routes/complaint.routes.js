"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ComplaintController_1 = require("../controllers/ComplaintController");
const ComplaintService_1 = require("../../application/services/ComplaintService");
const MySqlComplaintRepository_1 = require("../../infrastructure/repositories/MySqlComplaintRepository");
const router = (0, express_1.Router)();
const repo = new MySqlComplaintRepository_1.MySqlComplaintRepository();
const service = new ComplaintService_1.ComplaintService(repo);
const controller = new ComplaintController_1.ComplaintController(service);
router.post("/", controller.create);
router.get("/", controller.list);
router.get("/:id", controller.getById);
router.put("/:id", controller.update);
router.delete("/:id", controller.delete);
exports.default = router;
//# sourceMappingURL=complaint.routes.js.map