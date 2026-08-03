import { axiosInstance as api } from "../../../services/api/axiosInstance";

export interface SecurityNightFormRecord {
  id: string;
  guard_name: string;
  shift_date: string;
  gate_location: string | null;
  patrol_status: string;
  observations: string | null;
  remarks: string | null;
  image_url: string | null;
  photo_captured_at: string | null;
  created_at: string;
}

export interface SecurityVisitorEntryRecord {
  id: string;
  visitor_name: string;
  phone: string | null;
  company_name: string | null;
  person_to_meet: string | null;
  purpose: string | null;
  in_time: string;
  out_time: string | null;
  status: 'Checked-In' | 'Checked-Out';
  created_at: string;
}

export const securityCustomApi = {
  // Security Night Form
  getNightForms: async (): Promise<SecurityNightFormRecord[]> => {
    const res = await api.get("/hr/security/night-form");
    return res.data.data;
  },
  createNightForm: async (data: {
    guardName: string;
    shiftDate: string;
    gateLocation?: string;
    patrolStatus?: string;
    observations?: string;
    remarks?: string;
    imageUrl?: string;
    photoCapturedAt?: string;
  }): Promise<SecurityNightFormRecord> => {
    const res = await api.post("/hr/security/night-form", data);
    return res.data.data;
  },
  deleteNightForm: async (id: string): Promise<void> => {
    await api.delete(`/hr/security/night-form/${id}`);
  },

  // Visitor Entry
  getVisitorEntries: async (): Promise<SecurityVisitorEntryRecord[]> => {
    const res = await api.get("/hr/security/visitor-entry");
    return res.data.data;
  },
  createVisitorEntry: async (data: {
    visitorName: string;
    phone?: string;
    companyName?: string;
    personToMeet?: string;
    purpose?: string;
  }): Promise<SecurityVisitorEntryRecord> => {
    const res = await api.post("/hr/security/visitor-entry", data);
    return res.data.data;
  },
  checkOutVisitorEntry: async (id: string): Promise<SecurityVisitorEntryRecord> => {
    const res = await api.patch(`/hr/security/visitor-entry/${id}/checkout`);
    return res.data.data;
  },
  deleteVisitorEntry: async (id: string): Promise<void> => {
    await api.delete(`/hr/security/visitor-entry/${id}`);
  },
};
