"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toPublicUser = toPublicUser;
function toPublicUser(user, roles = []) {
    return {
        id: user.id,
        employeeCode: user.employeeCode,
        email: user.email,
        tempPassword: user.tempPassword,
        fullName: user.fullName,
        whatsappNumber: user.whatsappNumber,
        status: user.status,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        roles,
    };
}
//# sourceMappingURL=User.js.map