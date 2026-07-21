"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHrEvaluations = exports.createHrEvaluation = exports.getHodEvaluations = exports.createHodEvaluation = void 0;
const PerformanceEvaluationService_1 = require("../../application/services/PerformanceEvaluationService");
const evaluation_dto_1 = require("../../application/dto/evaluation.dto");
const createHodEvaluation = async (req, res) => {
    try {
        const data = evaluation_dto_1.createEvaluationSchema.parse(req.body);
        const record = await PerformanceEvaluationService_1.performanceEvaluationService.createHodEvaluation(data);
        res.status(201).json({ success: true, data: record });
    }
    catch (error) {
        console.error("HOD Evaluation Error:", error);
        res.status(400).json({ success: false, error: error?.errors ? JSON.stringify(error.errors) : error.message });
    }
};
exports.createHodEvaluation = createHodEvaluation;
const getHodEvaluations = async (req, res) => {
    try {
        const records = await PerformanceEvaluationService_1.performanceEvaluationService.getHodEvaluations();
        res.json({ success: true, data: records });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.getHodEvaluations = getHodEvaluations;
const createHrEvaluation = async (req, res) => {
    try {
        const data = evaluation_dto_1.createEvaluationSchema.parse(req.body);
        const record = await PerformanceEvaluationService_1.performanceEvaluationService.createHrEvaluation(data);
        res.status(201).json({ success: true, data: record });
    }
    catch (error) {
        console.error("HR Evaluation Error:", error);
        res.status(400).json({ success: false, error: error?.errors ? JSON.stringify(error.errors) : error.message });
    }
};
exports.createHrEvaluation = createHrEvaluation;
const getHrEvaluations = async (req, res) => {
    try {
        const records = await PerformanceEvaluationService_1.performanceEvaluationService.getHrEvaluations();
        res.json({ success: true, data: records });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.getHrEvaluations = getHrEvaluations;
//# sourceMappingURL=PerformanceEvaluationController.js.map