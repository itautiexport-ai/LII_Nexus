"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FmsManagerController = void 0;
const fms_dto_1 = require("../../application/dto/fms.dto");
class FmsManagerController {
    constructor(service) {
        this.service = service;
        this.createFms = async (req, res) => {
            try {
                const dto = fms_dto_1.CreateFmsManagerSchema.parse(req.body);
                const fms = await this.service.createFms(dto);
                res.status(201).json({ success: true, data: fms });
            }
            catch (err) {
                if (err.errors) {
                    return res.status(400).json({ success: false, errors: err.errors });
                }
                console.error(err);
                res.status(500).json({ success: false, message: "Internal server error" });
            }
        };
        this.getAllFms = async (req, res) => {
            try {
                const fmsList = await this.service.getAllFms();
                res.json({ success: true, data: fmsList });
            }
            catch (err) {
                console.error(err);
                res.status(500).json({ success: false, message: "Internal server error" });
            }
        };
        this.deleteFms = async (req, res) => {
            try {
                const { id } = req.params;
                await this.service.deleteFms(id);
                res.json({ success: true, message: "FMS Manager deleted successfully" });
            }
            catch (err) {
                console.error(err);
                res.status(500).json({ success: false, message: "Internal server error" });
            }
        };
        this.updateFms = async (req, res) => {
            try {
                const { id } = req.params;
                const dto = fms_dto_1.CreateFmsManagerSchema.parse(req.body);
                const fms = await this.service.updateFms(id, dto);
                res.json({ success: true, data: fms });
            }
            catch (err) {
                if (err.errors) {
                    return res.status(400).json({ success: false, errors: err.errors });
                }
                console.error(err);
                res.status(500).json({ success: false, message: "Internal server error" });
            }
        };
        this.addStep = async (req, res) => {
            try {
                const { fmsId } = req.params;
                const dto = fms_dto_1.CreateFmsStepSchema.parse(req.body);
                const step = await this.service.addStep(fmsId, dto);
                res.status(201).json({ success: true, data: step });
            }
            catch (err) {
                if (err.errors) {
                    return res.status(400).json({ success: false, errors: err.errors });
                }
                console.error(err);
                res.status(500).json({ success: false, message: "Internal server error" });
            }
        };
        this.getSteps = async (req, res) => {
            try {
                const { fmsId } = req.params;
                const steps = await this.service.getSteps(fmsId);
                res.json({ success: true, data: steps });
            }
            catch (err) {
                console.error(err);
                res.status(500).json({ success: false, message: "Internal server error" });
            }
        };
        this.deleteStep = async (req, res) => {
            try {
                const { stepId } = req.params;
                await this.service.deleteStep(stepId);
                res.json({ success: true, message: "Step deleted" });
            }
            catch (err) {
                console.error(err);
                res.status(500).json({ success: false, message: "Internal server error" });
            }
        };
        this.updateStep = async (req, res) => {
            try {
                const { stepId } = req.params;
                const dto = fms_dto_1.CreateFmsStepSchema.parse(req.body);
                const step = await this.service.updateStep(stepId, dto);
                res.json({ success: true, data: step });
            }
            catch (err) {
                if (err.errors) {
                    return res.status(400).json({ success: false, errors: err.errors });
                }
                console.error(err);
                res.status(500).json({ success: false, message: "Internal server error" });
            }
        };
    }
}
exports.FmsManagerController = FmsManagerController;
//# sourceMappingURL=FmsManagerController.js.map