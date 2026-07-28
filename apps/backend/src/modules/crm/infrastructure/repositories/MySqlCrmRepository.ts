import { v4 as uuid } from "uuid";
import { pool } from "../../../../infrastructure/database/mysql/connection";
import { Lead, LeadFile, LeadFollowup, LeadWithContext, computeWeightedForecast } from "../../domain/entities/Lead";
import { CreateLeadData, ICrmRepository, ListLeadsParams, UpdateLeadData } from "../../domain/repositories/ICrmRepository";

function mapLead(row: any): Lead {
  return {
    id: row.id,
    leadCode: row.lead_code,
    inquiryDate: row.inquiry_date,
    contactName: row.contact_name,
    contactPersons: row.contact_persons,
    companyName: row.company_name,
    country: row.country,
    city: row.city,
    multipleAddresses: row.multiple_addresses,
    phone: row.phone,
    email: row.email,
    leadSource: row.lead_source,
    tradeFairName: row.trade_fair_name,
    leadCategory: row.lead_category,
    currency: row.currency,
    preferredLanguage: row.preferred_language,
    creditLimit: row.credit_limit === null ? null : Number(row.credit_limit),
    paymentTerms: row.payment_terms,
    productCategory: row.product_category,
    inquiryDetails: row.inquiry_details,
    assignedMerchantId: row.assigned_merchant_id,
    salesStage: row.sales_stage,
    forecastAmount: row.forecast_amount === null ? null : Number(row.forecast_amount),
    winProbability: row.win_probability === null ? null : Number(row.win_probability),
    weightedForecast: row.weighted_forecast === null ? null : Number(row.weighted_forecast),
    expectedCloseDate: row.expected_close_date,
    nextFollowUpDate: row.next_follow_up_date,
    followUpRemarks: row.follow_up_remarks,
    nextAction: row.next_action,
    status: row.status,
    priority: row.priority,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

function mapFollowup(row: any): LeadFollowup {
  return {
    id: row.id, leadId: row.lead_id, dueDate: row.due_date, completedAt: row.completed_at,
    onTime: row.on_time === null ? null : !!row.on_time, remarks: row.remarks, nextAction: row.next_action,
    loggedBy: row.logged_by, createdAt: row.created_at,
  };
}

const WITH_CONTEXT_SELECT = `
  SELECT cl.*, m.name AS merchant_name, cb.full_name AS created_by_name, ub.full_name AS updated_by_name
  FROM crm_leads cl
  LEFT JOIN master_merchants m ON m.id = cl.assigned_merchant_id
  LEFT JOIN employees cb ON cb.id = cl.created_by
  LEFT JOIN employees ub ON ub.id = cl.updated_by
`;

function mapWithContext(row: any): LeadWithContext {
  const lead = mapLead(row);
  const delayDays = lead.status === "active" && lead.nextFollowUpDate
    ? Math.max(0, Math.round((new Date(new Date().toDateString()).getTime() - new Date(lead.nextFollowUpDate).getTime()) / 86400000))
    : 0;
  return { ...lead, merchantName: row.merchant_name, createdByName: row.created_by_name, updatedByName: row.updated_by_name, delayDays };
}

export class MySqlCrmRepository implements ICrmRepository {
  async list(params: ListLeadsParams) {
    const offset = (params.page - 1) * params.pageSize;
    const conditions = ["cl.deleted_at IS NULL"];
    const values: unknown[] = [];

    if (params.search) {
      conditions.push("(cl.contact_name LIKE ? OR cl.company_name LIKE ? OR cl.lead_code LIKE ? OR cl.email LIKE ?)");
      values.push(`%${params.search}%`, `%${params.search}%`, `%${params.search}%`, `%${params.search}%`);
    }
    if (params.assignedMerchantId) { conditions.push("cl.assigned_merchant_id = ?"); values.push(params.assignedMerchantId); }
    if (params.status) { conditions.push("cl.status = ?"); values.push(params.status); }
    if (params.salesStage) { conditions.push("cl.sales_stage = ?"); values.push(params.salesStage); }
    if (params.leadSource) { conditions.push("cl.lead_source = ?"); values.push(params.leadSource); }
    if (params.leadCategory) { conditions.push("cl.lead_category = ?"); values.push(params.leadCategory); }
    if (params.priority) { conditions.push("cl.priority = ?"); values.push(params.priority); }
    if (params.overdueOnly) { conditions.push("cl.status = 'active' AND cl.next_follow_up_date < CURDATE()"); }
    const whereClause = `WHERE ${conditions.join(" AND ")}`;

    const [rows] = await pool.query<any[]>(
      `${WITH_CONTEXT_SELECT} ${whereClause} ORDER BY cl.updated_at DESC LIMIT ? OFFSET ?`,
      [...values, params.pageSize, offset]
    );
    const [countRows] = await pool.query<any[]>(`SELECT COUNT(*) as total FROM crm_leads cl ${whereClause}`, values);
    return { items: rows.map(mapWithContext), total: countRows[0].total as number };
  }

  async findById(id: string): Promise<Lead | null> {
    const [rows] = await pool.query<any[]>("SELECT * FROM crm_leads WHERE id = ? AND deleted_at IS NULL", [id]);
    return rows[0] ? mapLead(rows[0]) : null;
  }

  async getWithContext(id: string): Promise<LeadWithContext | null> {
    const [rows] = await pool.query<any[]>(`${WITH_CONTEXT_SELECT} WHERE cl.id = ? AND cl.deleted_at IS NULL`, [id]);
    return rows[0] ? mapWithContext(rows[0]) : null;
  }

  async findByLeadCode(leadCode: string): Promise<Lead | null> {
    const [rows] = await pool.query<any[]>("SELECT * FROM crm_leads WHERE lead_code = ? AND deleted_at IS NULL", [leadCode]);
    return rows[0] ? mapLead(rows[0]) : null;
  }

  async nextLeadCodeSequence(): Promise<number> {
    const [rows] = await pool.query<any[]>("SELECT COUNT(*) as total FROM crm_leads");
    return Number(rows[0].total) + 1;
  }

  async create(data: CreateLeadData): Promise<Lead> {
    const id = data.id || uuid();
    const weightedForecast = computeWeightedForecast(data.forecastAmount ?? null, data.winProbability ?? null);
    await pool.query(
      `INSERT INTO crm_leads
         (id, lead_code, inquiry_date, contact_name, contact_persons, company_name, country, city, multiple_addresses, phone, email,
          lead_source, trade_fair_name, lead_category, currency, preferred_language, credit_limit, payment_terms, product_category, inquiry_details, assigned_merchant_id,
          forecast_amount, win_probability, weighted_forecast, expected_close_date, next_follow_up_date,
          follow_up_remarks, next_action, priority, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, data.leadCode, data.inquiryDate, data.contactName, data.contactPersons ?? null, data.companyName ?? null, data.country ?? null,
        data.city ?? null, data.multipleAddresses ?? null, data.phone ?? null, data.email ?? null, data.leadSource, data.tradeFairName ?? null, data.leadCategory,
        data.currency ?? null, data.preferredLanguage ?? null, data.creditLimit ?? null, data.paymentTerms ?? null,
        data.productCategory ?? null, data.inquiryDetails ?? null, data.assignedMerchantId ?? null,
        data.forecastAmount ?? null, data.winProbability ?? null, weightedForecast, data.expectedCloseDate ?? null,
        data.nextFollowUpDate ?? null, data.followUpRemarks ?? null, data.nextAction ?? null,
        data.priority ?? "medium", data.createdBy,
      ]
    );
    return (await this.findById(id))!;
  }

  async update(id: string, changes: UpdateLeadData): Promise<Lead> {
    const existing = await this.findById(id);
    if (!existing) throw new Error("Lead not found");

    const nextForecast = changes.forecastAmount !== undefined ? changes.forecastAmount : existing.forecastAmount;
    const nextProbability = changes.winProbability !== undefined ? changes.winProbability : existing.winProbability;
    const weightedForecast = computeWeightedForecast(nextForecast, nextProbability);

    const fieldMap: Record<string, string> = {
      contactName: "contact_name", contactPersons: "contact_persons", companyName: "company_name", country: "country", city: "city",
      multipleAddresses: "multiple_addresses", phone: "phone", email: "email", leadSource: "lead_source", tradeFairName: "trade_fair_name", leadCategory: "lead_category",
      currency: "currency", preferredLanguage: "preferred_language", creditLimit: "credit_limit", paymentTerms: "payment_terms",
      productCategory: "product_category", inquiryDetails: "inquiry_details", salesStage: "sales_stage",
      forecastAmount: "forecast_amount", winProbability: "win_probability", expectedCloseDate: "expected_close_date",
      nextFollowUpDate: "next_follow_up_date", followUpRemarks: "follow_up_remarks", nextAction: "next_action",
      status: "status", priority: "priority", updatedBy: "updated_by",
    };
    const fields: string[] = [];
    const values: unknown[] = [];
    for (const [key, column] of Object.entries(fieldMap)) {
      const value = (changes as any)[key];
      if (value !== undefined) { fields.push(`${column} = ?`); values.push(value); }
    }
    fields.push("weighted_forecast = ?");
    values.push(weightedForecast);

    values.push(id);
    await pool.query(`UPDATE crm_leads SET ${fields.join(", ")} WHERE id = ?`, values);
    return (await this.findById(id))!;
  }

  async assign(id: string, merchantId: string | null, updatedBy: string | null): Promise<Lead> {
    await pool.query("UPDATE crm_leads SET assigned_merchant_id = ?, updated_by = ? WHERE id = ?", [merchantId, updatedBy, id]);
    return (await this.findById(id))!;
  }

  async softDelete(id: string): Promise<void> {
    await pool.query("UPDATE crm_leads SET deleted_at = NOW() WHERE id = ?", [id]);
  }

  async logFollowup(data: { id: string; leadId: string; dueDate: string; remarks?: string | null; nextAction?: string | null; loggedBy: string | null }): Promise<LeadFollowup> {
    const id = data.id || uuid();
    await pool.query(
      "INSERT INTO crm_lead_followups (id, lead_id, due_date, remarks, next_action, logged_by) VALUES (?, ?, ?, ?, ?, ?)",
      [id, data.leadId, data.dueDate, data.remarks ?? null, data.nextAction ?? null, data.loggedBy]
    );
    const [rows] = await pool.query<any[]>("SELECT * FROM crm_lead_followups WHERE id = ?", [id]);
    return mapFollowup(rows[0]);
  }

  async completeFollowup(id: string, remarks: string | null, loggedBy: string | null): Promise<LeadFollowup> {
    await pool.query(
      `UPDATE crm_lead_followups
       SET completed_at = NOW(), on_time = (DATE(NOW()) <= due_date), remarks = COALESCE(?, remarks), logged_by = ?
       WHERE id = ?`,
      [remarks, loggedBy, id]
    );
    const [rows] = await pool.query<any[]>("SELECT * FROM crm_lead_followups WHERE id = ?", [id]);
    return mapFollowup(rows[0]);
  }

  async getPendingFollowup(leadId: string): Promise<LeadFollowup | null> {
    const [rows] = await pool.query<any[]>(
      "SELECT * FROM crm_lead_followups WHERE lead_id = ? AND completed_at IS NULL ORDER BY due_date DESC LIMIT 1",
      [leadId]
    );
    return rows[0] ? mapFollowup(rows[0]) : null;
  }

  async listFollowupsForLead(leadId: string): Promise<LeadFollowup[]> {
    const [rows] = await pool.query<any[]>("SELECT * FROM crm_lead_followups WHERE lead_id = ? ORDER BY created_at DESC", [leadId]);
    return rows.map(mapFollowup);
  }

  async addFile(leadId: string, fileName: string, fileUrl: string, uploadedBy: string | null): Promise<LeadFile> {
    const id = uuid();
    await pool.query(
      "INSERT INTO crm_lead_files (id, lead_id, file_name, file_url, uploaded_by) VALUES (?, ?, ?, ?, ?)",
      [id, leadId, fileName, fileUrl, uploadedBy]
    );
    const [rows] = await pool.query<any[]>("SELECT * FROM crm_lead_files WHERE id = ?", [id]);
    const r = rows[0];
    return { id: r.id, leadId: r.lead_id, fileName: r.file_name, fileUrl: r.file_url, uploadedBy: r.uploaded_by, uploadedAt: r.uploaded_at };
  }

  async listFilesForLead(leadId: string): Promise<LeadFile[]> {
    const [rows] = await pool.query<any[]>("SELECT * FROM crm_lead_files WHERE lead_id = ?", [leadId]);
    return rows.map((r) => ({ id: r.id, leadId: r.lead_id, fileName: r.file_name, fileUrl: r.file_url, uploadedBy: r.uploaded_by, uploadedAt: r.uploaded_at }));
  }

  // Quotations
  async listQuotations(): Promise<any[]> {
    const [rows] = await pool.query<any[]>(`
      SELECT q.*, b.name as buyer_name,
        (SELECT price FROM crm_quotation_quotes WHERE quotation_id = q.id ORDER BY created_at DESC LIMIT 1) as latest_price,
        (SELECT currency FROM crm_quotation_quotes WHERE quotation_id = q.id ORDER BY created_at DESC LIMIT 1) as latest_currency
      FROM crm_quotations q
      LEFT JOIN master_data_buyers b ON q.buyer_id = b.id
      WHERE q.deleted_at IS NULL
      ORDER BY q.created_at DESC
    `);
    return rows;
  }

  async createQuotation(data: any): Promise<any> {
    const id = uuid();
    await pool.query(
      "INSERT INTO crm_quotations (id, buyer_id, sku_code, product_name, product_image_url, status) VALUES (?, ?, ?, ?, ?, ?)",
      [id, data.buyerId, data.skuCode, data.productName, data.productImageUrl || null, data.status || 'draft']
    );
    const [rows] = await pool.query<any[]>("SELECT * FROM crm_quotations WHERE id = ?", [id]);
    return rows[0];
  }

  async updateQuotationStatus(id: string, status: string): Promise<void> {
    await pool.query("UPDATE crm_quotations SET status = ? WHERE id = ?", [status, id]);
  }

  async addQuotationQuote(data: any): Promise<any> {
    const id = uuid();
    await pool.query(
      "INSERT INTO crm_quotation_quotes (id, quotation_id, quote_name, currency, price, notes) VALUES (?, ?, ?, ?, ?, ?)",
      [id, data.quotationId, data.quoteName, data.currency || 'USD', data.price, data.notes || null]
    );
    const [rows] = await pool.query<any[]>("SELECT * FROM crm_quotation_quotes WHERE id = ?", [id]);
    return rows[0];
  }

  async listQuotationQuotes(quotationId: string): Promise<any[]> {
    const [rows] = await pool.query<any[]>("SELECT * FROM crm_quotation_quotes WHERE quotation_id = ? ORDER BY created_at ASC", [quotationId]);
    return rows;
  }
}
