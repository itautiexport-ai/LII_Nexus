"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MySqlEmployeeRepository = void 0;
const uuid_1 = require("uuid");
const connection_1 = require("../../../../infrastructure/database/mysql/connection");
function mapRow(row) {
    return {
        id: row.id,
        employeeCode: row.employee_code,
        fullName: row.full_name,
        email: row.email,
        phone: row.phone,
        departmentId: row.department_id,
        designationId: row.designation_id,
        managerId: row.manager_id,
        userId: row.user_id,
        shiftId: row.shift_id,
        dateOfJoining: row.date_of_joining,
        birthday: row.birthday,
        anniversary: row.anniversary,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        deletedAt: row.deleted_at,
        salary: Number(row.salary) || 0,
    };
}
function mapRowWithRelations(row) {
    return {
        ...mapRow(row),
        departmentName: row.department_name,
        designationTitle: row.designation_title,
        managerName: row.manager_name,
        shiftName: row.shift_name,
    };
}
const SELECT_WITH_RELATIONS = `
  SELECT e.*, d.name AS department_name, g.title AS designation_title, m.name AS manager_name,
         s.name AS shift_name
  FROM employees e
  LEFT JOIN departments d ON d.id = e.department_id
  LEFT JOIN designations g ON g.id = e.designation_id
  LEFT JOIN master_hods m ON m.id = e.manager_id
  LEFT JOIN shifts s ON s.id = e.shift_id
`;
class MySqlEmployeeRepository {
    async list(params) {
        const offset = (params.page - 1) * params.pageSize;
        const conditions = ["e.deleted_at IS NULL"];
        const values = [];
        if (params.search) {
            conditions.push("(e.full_name LIKE ? OR e.employee_code LIKE ? OR e.email LIKE ?)");
            values.push(`%${params.search}%`, `%${params.search}%`, `%${params.search}%`);
        }
        if (params.departmentId) {
            conditions.push("e.department_id = ?");
            values.push(params.departmentId);
        }
        const whereClause = `WHERE ${conditions.join(" AND ")}`;
        const [rows] = await connection_1.pool.query(`${SELECT_WITH_RELATIONS} ${whereClause} ORDER BY e.created_at DESC LIMIT ? OFFSET ?`, [...values, params.pageSize, offset]);
        const [countRows] = await connection_1.pool.query(`SELECT COUNT(*) as total FROM employees e ${whereClause}`, values);
        return { items: rows.map(mapRowWithRelations), total: countRows[0].total };
    }
    async findById(id) {
        const [rows] = await connection_1.pool.query("SELECT * FROM employees WHERE id = ? AND deleted_at IS NULL", [id]);
        return rows[0] ? mapRow(rows[0]) : null;
    }
    async findByEmployeeCode(employeeCode) {
        const [rows] = await connection_1.pool.query("SELECT * FROM employees WHERE employee_code = ? AND deleted_at IS NULL", [employeeCode]);
        return rows[0] ? mapRow(rows[0]) : null;
    }
    async findByUserId(userId) {
        const [rows] = await connection_1.pool.query("SELECT * FROM employees WHERE user_id = ? AND deleted_at IS NULL", [userId]);
        return rows[0] ? mapRow(rows[0]) : null;
    }
    async checkHodExists(id) {
        const [rows] = await connection_1.pool.query("SELECT id FROM master_hods WHERE id = ?", [id]);
        return rows.length > 0;
    }
    async listDirectReports(managerId) {
        const [rows] = await connection_1.pool.query("SELECT * FROM employees WHERE manager_id = ? AND deleted_at IS NULL", [managerId]);
        return rows.map(mapRow);
    }
    async create(data) {
        const id = data.id || (0, uuid_1.v4)();
        await connection_1.pool.query(`INSERT INTO employees (id, employee_code, full_name, email, phone, department_id, designation_id, manager_id, user_id, shift_id, date_of_joining, birthday, anniversary, salary)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            id,
            data.employeeCode,
            data.fullName,
            data.email ?? null,
            data.phone ?? null,
            data.departmentId ?? null,
            data.designationId ?? null,
            data.managerId ?? null,
            data.userId ?? null,
            data.shiftId ?? null,
            data.dateOfJoining ?? null,
            data.birthday ?? null,
            data.anniversary ?? null,
            data.salary ?? 0,
        ]);
        return (await this.findById(id));
    }
    async update(id, changes) {
        const fields = [];
        const values = [];
        if (changes.employeeCode !== undefined) {
            fields.push("employee_code = ?");
            values.push(changes.employeeCode);
        }
        if (changes.fullName !== undefined) {
            fields.push("full_name = ?");
            values.push(changes.fullName);
        }
        if (changes.email !== undefined) {
            fields.push("email = ?");
            values.push(changes.email);
        }
        if (changes.phone !== undefined) {
            fields.push("phone = ?");
            values.push(changes.phone);
        }
        if (changes.departmentId !== undefined) {
            fields.push("department_id = ?");
            values.push(changes.departmentId);
        }
        if (changes.designationId !== undefined) {
            fields.push("designation_id = ?");
            values.push(changes.designationId);
        }
        if (changes.managerId !== undefined) {
            fields.push("manager_id = ?");
            values.push(changes.managerId);
        }
        if (changes.userId !== undefined) {
            fields.push("user_id = ?");
            values.push(changes.userId);
        }
        if (changes.shiftId !== undefined) {
            fields.push("shift_id = ?");
            values.push(changes.shiftId);
        }
        if (changes.dateOfJoining !== undefined) {
            fields.push("date_of_joining = ?");
            values.push(changes.dateOfJoining);
        }
        if (changes.birthday !== undefined) {
            fields.push("birthday = ?");
            values.push(changes.birthday);
        }
        if (changes.anniversary !== undefined) {
            fields.push("anniversary = ?");
            values.push(changes.anniversary);
        }
        if (changes.status !== undefined) {
            fields.push("status = ?");
            values.push(changes.status);
        }
        if (changes.salary !== undefined) {
            fields.push("salary = ?");
            values.push(changes.salary);
        }
        if (fields.length > 0) {
            values.push(id);
            await connection_1.pool.query(`UPDATE employees SET ${fields.join(", ")} WHERE id = ?`, values);
        }
        return (await this.findById(id));
    }
    async softDelete(id) {
        try {
            await connection_1.pool.query("DELETE FROM employees WHERE id = ?", [id]);
        }
        catch (err) {
            if (err.code === "ER_ROW_IS_REFERENCED_2") {
                await connection_1.pool.query("UPDATE employees SET deleted_at = NOW(), status = 'inactive', employee_code = CONCAT(employee_code, '-del-', SUBSTRING(id, 1, 6)), email = IF(email IS NULL, NULL, CONCAT(email, '-del-', SUBSTRING(id, 1, 6))) WHERE id = ?", [id]);
            }
            else {
                throw err;
            }
        }
    }
}
exports.MySqlEmployeeRepository = MySqlEmployeeRepository;
//# sourceMappingURL=MySqlEmployeeRepository.js.map