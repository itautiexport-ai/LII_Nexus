"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMachineEfficiencyEntrySchema = exports.updateMachineTargetSchema = exports.createMachineTargetSchema = void 0;
const zod_1 = require("zod");
exports.createMachineTargetSchema = zod_1.z.object({
    machineId: zod_1.z.string().uuid("Invalid machine ID"),
    size: zod_1.z.string().min(1, "Size is required"),
    target: zod_1.z.number().min(0, "Target must be positive"),
    uom: zod_1.z.string().min(1, "UOM is required"),
});
exports.updateMachineTargetSchema = zod_1.z.object({
    target: zod_1.z.number().min(0, "Target must be positive"),
    uom: zod_1.z.string().min(1, "UOM is required"),
});
exports.createMachineEfficiencyEntrySchema = zod_1.z.object({
    departmentId: zod_1.z.string().uuid("Invalid department ID"),
    machineId: zod_1.z.string().uuid("Invalid machine ID"),
    size: zod_1.z.string().min(1, "Size is required"),
    target: zod_1.z.number().min(0, "Target must be positive"),
    achieved: zod_1.z.number().min(0, "Achieved must be positive"),
    manpowerCount: zod_1.z.number().int().min(1, "Manpower count must be at least 1"),
});
//# sourceMappingURL=machineEfficiency.dto.js.map