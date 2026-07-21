import { v4 as uuid } from "uuid";
import { IDprEntryRepository, CreateDprEntryData, UpdateDprEntryData, ListDprEntriesParams } from "../../domain/repositories/IDprEntryRepository";
import { NotFoundError } from "../../../../core/domain/errors/DomainError";
import { AuditService } from "../../../../shared/services/AuditService";
import { EmployeeScopeService } from "../../../performance/application/services/EmployeeScopeService";

export class DprEntryService {
  constructor(
    private readonly repo: IDprEntryRepository,
    private readonly scope: EmployeeScopeService
  ) {}

  async list(params: ListDprEntriesParams) {
    return this.repo.list(params);
  }

  async getById(id: string) {
    const entry = await this.repo.getWithContext(id);
    if (!entry) throw new NotFoundError("DPR entry not found.");
    return entry;
  }

  async create(input: {
    entryDate: string;
    shiftId: string;
    factoryDepartmentId: string;
    supervisorId: string;
    hodId?: string | null;
    totalTarget: number;
    uom: string;
    totalOperator: number;
    totalHelper: number;
    totalContractor: number;
    manpowerDepartmentId?: string | null;
    items: Array<{
      aliasName?: string | null;
      productCode?: string | null;
      woodType?: string | null;
      orderQty: number;
      okQty: number;
      reworkQty: number;
      uom: string;
      qtyAsPerUom?: number | null;
    }>;
    totalAchievement?: number;
    totalRework?: number;
  }, actorId: string) {
    const actorEmployee = await this.scope.requireEmployeeForUser(actorId);

    // Auto-calculate totals from items if not provided manually
    const calcAchievement = input.items.reduce((sum, item) => sum + (item.qtyAsPerUom ?? 0), 0);
    const calcRework = input.items.reduce((sum, item) => sum + (item.reworkQty || 0), 0);

    const totalAchievement = input.totalAchievement ?? calcAchievement;
    const totalRework = input.totalRework ?? calcRework;

    const data: CreateDprEntryData = {
      id: uuid(),
      entryDate: input.entryDate,
      shiftId: input.shiftId,
      factoryDepartmentId: input.factoryDepartmentId,
      supervisorId: input.supervisorId,
      hodId: input.hodId || null,
      totalTarget: input.totalTarget,
      uom: input.uom,
      totalAchievement,
      totalRework,
      totalOperator: input.totalOperator,
      totalHelper: input.totalHelper,
      totalContractor: input.totalContractor,
      manpowerDepartmentId: input.manpowerDepartmentId ?? null,
      submittedBy: actorEmployee.id,
      items: input.items.map((item, idx) => ({
        id: uuid(),
        aliasName: item.aliasName ?? null,
        productCode: item.productCode ?? null,
        woodType: item.woodType ?? null,
        orderQty: item.orderQty,
        okQty: item.okQty,
        reworkQty: item.reworkQty,
        uom: item.uom,
        qtyAsPerUom: item.qtyAsPerUom ?? null,
        sortOrder: idx,
      })),
    };

    const entry = await this.repo.create(data);
    await AuditService.record({
      actorUserId: actorId,
      action: "DPR_ENTRY_CREATED",
      entityType: "dpr_entry",
      entityId: entry.id,
      afterState: { entryDate: entry.entryDate, itemCount: data.items.length },
    });
    return this.repo.getWithContext(entry.id);
  }

  async update(id: string, changes: {
    entryDate?: string;
    shiftId?: string;
    factoryDepartmentId?: string;
    supervisorId?: string;
    hodId?: string | null;
    totalTarget?: number;
    uom?: string;
    totalOperator?: number;
    totalHelper?: number;
    totalContractor?: number;
    manpowerDepartmentId?: string | null;
    items?: Array<{
      aliasName?: string | null;
      productCode?: string | null;
      woodType?: string | null;
      orderQty: number;
      okQty: number;
      reworkQty: number;
      uom: string;
      qtyAsPerUom?: number | null;
    }>;
    totalAchievement?: number;
    totalRework?: number;
  }, actorId: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("DPR entry not found.");

    const { items, ...headerChanges } = changes;
    const updateData: UpdateDprEntryData = { ...headerChanges };

    // If items are provided, recalculate totals (unless provided manually)
    if (items) {
      const calcAchievement = items.reduce((sum, item) => sum + (item.qtyAsPerUom ?? 0), 0);
      const calcRework = items.reduce((sum, item) => sum + (item.reworkQty || 0), 0);
      
      (updateData as any).totalAchievement = changes.totalAchievement ?? calcAchievement;
      (updateData as any).totalRework = changes.totalRework ?? calcRework;
      updateData.items = items.map((item, idx) => ({
        id: uuid(),
        aliasName: item.aliasName ?? null,
        productCode: item.productCode ?? null,
        woodType: item.woodType ?? null,
        orderQty: item.orderQty,
        okQty: item.okQty,
        reworkQty: item.reworkQty,
        uom: item.uom,
        qtyAsPerUom: item.qtyAsPerUom ?? null,
        sortOrder: idx,
      }));
    }

    const updated = await this.repo.update(id, updateData);
    await AuditService.record({
      actorUserId: actorId,
      action: "DPR_ENTRY_UPDATED",
      entityType: "dpr_entry",
      entityId: id,
    });
    return this.repo.getWithContext(updated.id);
  }

  async remove(id: string, actorId: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("DPR entry not found.");
    await this.repo.softDelete(id);
    await AuditService.record({
      actorUserId: actorId,
      action: "DPR_ENTRY_DELETED",
      entityType: "dpr_entry",
      entityId: id,
    });
  }
}
