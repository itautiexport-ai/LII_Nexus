"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateFactoryDepartmentSchema = exports.createFactoryDepartmentSchema = void 0;
const zod_1 = require("zod");
exports.createFactoryDepartmentSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    productionMethod: zod_1.z.enum(["finished_sku", "component_level"]),
});
exports.updateFactoryDepartmentSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    productionMethod: zod_1.z.enum(["finished_sku", "component_level"]).optional(),
    status: zod_1.z.enum(["active", "inactive"]).optional(),
});
//# sourceMappingURL=factoryDepartment.dto.js.map