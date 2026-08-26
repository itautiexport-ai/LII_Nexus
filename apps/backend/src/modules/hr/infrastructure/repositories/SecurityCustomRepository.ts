import { pool } from "../../../../infrastructure/database/mysql/connection";
import { v4 as uuid } from "uuid";

export interface SecurityNightFormRecord {
  id: string;
  guard_name: string;
  shift_date: string;
  gate_location: string | null;
  patrol_status: string;
  observations: string | null;
  remarks: string | null;
  image_url: string | null;
  photo_captured_at: Date | null;
  created_at: Date;
}

export interface SecurityVisitorEntryRecord {
  id: string;
  visitor_name: string;
  phone: string | null;
  company_name: string | null;
  person_to_meet: string | null;
  purpose: string | null;
  image_url: string | null;
  photo_captured_at: Date | null;
  in_time: Date;
  out_time: Date | null;
  status: 'Checked-In' | 'Checked-Out';
  created_at: Date;
}

export class SecurityCustomRepository {
  // Security Night Form
  async findAllNightForms(): Promise<SecurityNightFormRecord[]> {
    const [rows] = await pool.query("SELECT * FROM security_night_forms ORDER BY created_at DESC");
    return rows as SecurityNightFormRecord[];
  }

  async createNightForm(data: {
    guardName: string;
    shiftDate: string;
    gateLocation?: string;
    patrolStatus?: string;
    observations?: string;
    remarks?: string;
    imageUrl?: string;
    photoCapturedAt?: string;
  }): Promise<SecurityNightFormRecord> {
    const id = uuid();
    const photoTime = data.photoCapturedAt ? new Date(data.photoCapturedAt) : null;
    await pool.query(
      `INSERT INTO security_night_forms (id, guard_name, shift_date, gate_location, patrol_status, observations, remarks, image_url, photo_captured_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.guardName,
        data.shiftDate,
        data.gateLocation || null,
        data.patrolStatus || 'Normal',
        data.observations || null,
        data.remarks || null,
        data.imageUrl || null,
        photoTime,
      ]
    );
    const [rows] = await pool.query("SELECT * FROM security_night_forms WHERE id = ?", [id]);
    return (rows as SecurityNightFormRecord[])[0];
  }

  async deleteNightForm(id: string): Promise<void> {
    await pool.query("DELETE FROM security_night_forms WHERE id = ?", [id]);
  }

  // Visitor Entry
  async findAllVisitorEntries(): Promise<SecurityVisitorEntryRecord[]> {
    const [rows] = await pool.query("SELECT * FROM security_visitor_entries ORDER BY in_time DESC");
    return rows as SecurityVisitorEntryRecord[];
  }

  async createVisitorEntry(data: {
    visitorName: string;
    phone?: string;
    companyName?: string;
    personToMeet?: string;
    purpose?: string;
    imageUrl?: string;
    photoCapturedAt?: string;
  }): Promise<SecurityVisitorEntryRecord> {
    const id = uuid();
    await pool.query(
      `INSERT INTO security_visitor_entries (id, visitor_name, phone, company_name, person_to_meet, purpose, image_url, photo_captured_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.visitorName,
        data.phone || null,
        data.companyName || null,
        data.personToMeet || null,
        data.purpose || null,
        data.imageUrl || null,
        data.photoCapturedAt || null,
      ]
    );
    const [rows] = await pool.query("SELECT * FROM security_visitor_entries WHERE id = ?", [id]);
    return (rows as SecurityVisitorEntryRecord[])[0];
  }

  async checkOutVisitorEntry(id: string): Promise<SecurityVisitorEntryRecord | null> {
    const now = new Date();
    await pool.query("UPDATE security_visitor_entries SET status = 'Checked-Out', out_time = ? WHERE id = ?", [now, id]);
    const [rows] = await pool.query("SELECT * FROM security_visitor_entries WHERE id = ?", [id]);
    return (rows as SecurityVisitorEntryRecord[])[0] || null;
  }

  async deleteVisitorEntry(id: string): Promise<void> {
    await pool.query("DELETE FROM security_visitor_entries WHERE id = ?", [id]);
  }
}
