import { axiosInstance } from "../../../services/api/axiosInstance";

export type ComplaintStatus = 'new' | 'assigned' | 'under_investigation' | 'capa_in_progress' | 'pending_customer' | 'resolved' | 'closed' | 'escalated';
export type ComplaintPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Complaint {
  id: string;
  complaintNumber: string;
  buyerId: string | null;
  buyerName?: string;
  title: string;
  description: string | null;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  assignedTo: string | null;
  assignedToName?: string;
  capaResponsiblePersonName?: string;

  orderInvoiceNo: string | null;
  productSku: string | null;
  complaintCategory: string | null;
  attachments: string[] | null;

  inspectionFindings: string | null;
  rootCause: string | null;
  responsibleDepartment: string | null;
  rcaNotes: string | null;

  immediateAction: string | null;
  correctiveAction: string | null;
  preventiveAction: string | null;
  capaResponsiblePerson: string | null;
  targetCompletionDate: string | null;
  verificationStatus: string | null;

  resolutionType: string | null;
  customerConfirmation: boolean;
  closureDate: string | null;
  satisfactionRating: number | null;
  lessonsLearned: string | null;
  repeatIssue: boolean;

  createdAt: string;
  updatedAt: string;
}

export interface ListComplaintsParams {
  search?: string;
  status?: ComplaintStatus;
  priority?: ComplaintPriority;
  buyerId?: string;
  assignedTo?: string;
}

export const complaintApi = {
  list: async (params?: ListComplaintsParams) => {
    const res = await axiosInstance.get<{ items: Complaint[]; total: number }>("/crm/complaints", { params });
    return res.data;
  },

  getById: async (id: string) => {
    const res = await axiosInstance.get<Complaint>(`/crm/complaints/${id}`);
    return res.data;
  },

  create: async (data: Partial<Omit<Complaint, 'id' | 'createdAt' | 'updatedAt' | 'complaintNumber'>>) => {
    const res = await axiosInstance.post<Complaint>("/crm/complaints", data);
    return res.data;
  },

  update: async (id: string, data: Partial<Omit<Complaint, 'id' | 'createdAt' | 'updatedAt' | 'complaintNumber'>>) => {
    const res = await axiosInstance.put<Complaint>(`/crm/complaints/${id}`, data);
    return res.data;
  },

  delete: async (id: string) => {
    await axiosInstance.delete(`/crm/complaints/${id}`);
  }
};
