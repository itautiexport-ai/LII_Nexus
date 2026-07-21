"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MySqlMachineEfficiencyRepository = void 0;
const connection_1 = require("../../../../infrastructure/database/mysql/connection");
class MySqlMachineEfficiencyRepository {
    // -- Targets --
    async createTarget(target) {
        await connection_1.pool.execute(`INSERT INTO machine_targets (id, machine_id, size, target, uom) VALUES (?, ?, ?, ?, ?)`, [target.id, target.machineId, target.size, target.target, target.uom]);
    }
    async updateTarget(id, target, uom) {
        await connection_1.pool.execute(`UPDATE machine_targets SET target = ?, uom = ? WHERE id = ?`, [target, uom, id]);
    }
    async deleteTarget(id) {
        await connection_1.pool.execute(`UPDATE machine_targets SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?`, [id]);
    }
    async listTargets(machineId) {
        let query = `
      SELECT mt.*, m.name as machine_name
      FROM machine_targets mt
      LEFT JOIN machines m ON m.id = mt.machine_id
      WHERE mt.deleted_at IS NULL
    `;
        const params = [];
        if (machineId) {
            query += ` AND mt.machine_id = ?`;
            params.push(machineId);
        }
        query += ` ORDER BY mt.created_at DESC`;
        const [rows] = await connection_1.pool.execute(query, params);
        return rows.map((row) => ({
            id: row.id,
            machineId: row.machine_id,
            machineName: row.machine_name,
            size: row.size,
            target: parseFloat(row.target),
            uom: row.uom,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        }));
    }
    async getTargetById(id) {
        const [rows] = await connection_1.pool.execute(`SELECT mt.*, m.name as machine_name FROM machine_targets mt LEFT JOIN machines m ON m.id = mt.machine_id WHERE mt.id = ? AND mt.deleted_at IS NULL`, [id]);
        if (!rows.length)
            return null;
        const row = rows[0];
        return {
            id: row.id,
            machineId: row.machine_id,
            machineName: row.machine_name,
            size: row.size,
            target: parseFloat(row.target),
            uom: row.uom,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }
    async getTargetByMachineAndSize(machineId, size) {
        const [rows] = await connection_1.pool.execute(`SELECT * FROM machine_targets WHERE machine_id = ? AND size = ? AND deleted_at IS NULL`, [machineId, size]);
        if (!rows.length)
            return null;
        const row = rows[0];
        return {
            id: row.id,
            machineId: row.machine_id,
            size: row.size,
            target: parseFloat(row.target),
            uom: row.uom,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }
    // -- Entries --
    async createEntry(entry) {
        await connection_1.pool.execute(`INSERT INTO machine_efficiency_entries 
        (id, department_id, machine_id, size, target, achieved, manpower_count, efficiency, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            entry.id,
            entry.departmentId,
            entry.machineId,
            entry.size,
            entry.target,
            entry.achieved,
            entry.manpowerCount,
            entry.efficiency,
            entry.createdBy,
        ]);
    }
    async listEntries() {
        const query = `
      SELECT 
        mee.*,
        d.name as department_name,
        m.name as machine_name,
        u.full_name as created_by_name
      FROM machine_efficiency_entries mee
      LEFT JOIN departments d ON d.id = mee.department_id
      LEFT JOIN machines m ON m.id = mee.machine_id
      LEFT JOIN users u ON u.id = mee.created_by
      WHERE mee.deleted_at IS NULL
      ORDER BY mee.created_at DESC
    `;
        const [rows] = await connection_1.pool.execute(query);
        return rows.map((row) => ({
            id: row.id,
            departmentId: row.department_id,
            departmentName: row.department_name,
            machineId: row.machine_id,
            machineName: row.machine_name,
            size: row.size,
            target: parseFloat(row.target),
            achieved: parseFloat(row.achieved),
            manpowerCount: parseInt(row.manpower_count, 10),
            efficiency: parseFloat(row.efficiency),
            createdBy: row.created_by,
            createdByName: row.created_by_name,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        }));
    }
    async getEntryById(id) {
        const query = `
      SELECT 
        mee.*,
        d.name as department_name,
        m.name as machine_name,
        u.full_name as created_by_name
      FROM machine_efficiency_entries mee
      LEFT JOIN departments d ON d.id = mee.department_id
      LEFT JOIN machines m ON m.id = mee.machine_id
      LEFT JOIN users u ON u.id = mee.created_by
      WHERE mee.id = ? AND mee.deleted_at IS NULL
    `;
        const [rows] = await connection_1.pool.execute(query, [id]);
        if (!rows.length)
            return null;
        const row = rows[0];
        return {
            id: row.id,
            departmentId: row.department_id,
            departmentName: row.department_name,
            machineId: row.machine_id,
            machineName: row.machine_name,
            size: row.size,
            target: parseFloat(row.target),
            achieved: parseFloat(row.achieved),
            manpowerCount: parseInt(row.manpower_count, 10),
            efficiency: parseFloat(row.efficiency),
            createdBy: row.created_by,
            createdByName: row.created_by_name,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }
}
exports.MySqlMachineEfficiencyRepository = MySqlMachineEfficiencyRepository;
//# sourceMappingURL=MySqlMachineEfficiencyRepository.js.map