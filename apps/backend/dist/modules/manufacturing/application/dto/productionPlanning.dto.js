"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProductionPlanningSchema = void 0;
const zod_1 = require("zod");
exports.createProductionPlanningSchema = zod_1.z.object({
    factoryName: zod_1.z.string().min(1, "Factory List is required"),
    factoryList: zod_1.z.string().min(1, "Factory List No is required"),
    orderDate: zod_1.z.string().min(1, "Order Date is required"),
    company: zod_1.z.string().optional(),
    erpNo: zod_1.z.string().optional(),
    exFactoryDate: zod_1.z.string().min(1, "Ex Factory Date is required"),
    totalCbm: zod_1.z.coerce.number().min(0, "Total CBM must be greater than or equal to 0"),
    location: zod_1.z.enum(["SEZ", "Sirsi", "Vendor"]).optional().default("SEZ"),
    vendorName: zod_1.z.string().optional(),
});
//# sourceMappingURL=productionPlanning.dto.js.map