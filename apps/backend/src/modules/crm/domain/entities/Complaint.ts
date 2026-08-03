export type ComplaintStatus = 'new' | 'assigned' | 'under_investigation' | 'capa_in_progress' | 'pending_customer' | 'resolved' | 'closed' | 'escalated';
export type ComplaintPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Complaint {
  id: string;
  complaintNumber: string;
  buyerId: string | null;
  title: string;
  description: string | null;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  assignedTo: string | null;
  
  // Registration Fields
  orderInvoiceNo: string | null;
  productSku: string | null;
  complaintCategory: string | null;
  attachments: string[] | null;

  // Investigation Fields
  inspectionFindings: string | null;
  rootCause: string | null;
  responsibleDepartment: string | null;
  rcaNotes: string | null;

  // CAPA Fields
  immediateAction: string | null;
  correctiveAction: string | null;
  preventiveAction: string | null;
  capaResponsiblePerson: string | null;
  targetCompletionDate: Date | null;
  verificationStatus: string | null;

  // Resolution Fields
  resolutionType: string | null;
  customerConfirmation: boolean;
  closureDate: Date | null;
  satisfactionRating: number | null;
  lessonsLearned: string | null;
  repeatIssue: boolean;

  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface ComplaintRecord extends Complaint {
  buyerName?: string;
  assignedToName?: string;
  capaResponsiblePersonName?: string;
}
