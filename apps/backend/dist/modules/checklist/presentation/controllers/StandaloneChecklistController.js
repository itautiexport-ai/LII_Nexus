"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StandaloneChecklistController = void 0;
const checklist_dto_1 = require("../../application/dto/checklist.dto");
class StandaloneChecklistController {
    constructor(service) {
        this.service = service;
        this.createChecklist = async (req, res) => {
            const dto = checklist_dto_1.CreateStandaloneChecklistSchema.parse(req.body);
            const assignedBy = dto.assignBy;
            const checklist = await this.service.createChecklist(dto, assignedBy);
            res.status(201).json({ success: true, data: checklist });
        };
        this.getAllChecklists = async (req, res) => {
            const checklists = await this.service.getAllChecklists();
            res.json({ success: true, data: checklists });
        };
        this.deleteChecklist = async (req, res) => {
            const { id } = req.params;
            await this.service.deleteChecklist(id);
            res.json({ success: true, message: "Checklist deleted successfully" });
        };
    }
}
exports.StandaloneChecklistController = StandaloneChecklistController;
//# sourceMappingURL=StandaloneChecklistController.js.map