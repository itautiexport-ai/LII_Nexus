"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateCartonOrderSchema = void 0;
const zod_1 = require("zod");
exports.CreateCartonOrderSchema = zod_1.z.object({
    erpOrderNumber: zod_1.z.string().min(1, "ERP Order Number is required"),
    companyName: zod_1.z.enum(["LII", "LIE"]).optional(),
    aliasName: zod_1.z.string().optional(),
});
//# sourceMappingURL=cartonOrder.dto.js.map