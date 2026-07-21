"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ok = ok;
exports.created = created;
function ok(res, data, meta = null, statusCode = 200) {
    return res.status(statusCode).json({ success: true, data, meta, error: null });
}
function created(res, data) {
    return ok(res, data, null, 201);
}
//# sourceMappingURL=apiResponse.js.map