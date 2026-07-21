"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
const DomainError_1 = require("../../core/domain/errors/DomainError");
function validate(schema) {
    return (req, _res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            throw new DomainError_1.ValidationError("Request validation failed.", result.error.flatten());
        }
        req.body = result.data;
        next();
    };
}
//# sourceMappingURL=validate-request.middleware.js.map