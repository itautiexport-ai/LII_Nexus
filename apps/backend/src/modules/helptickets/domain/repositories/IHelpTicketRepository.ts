export interface HelpTicket {
  id: string;
  subject: string;
  problemSolverId: string;
  problemSolverName?: string;
  problem: string;
  mediaUrl?: string | null;
  priority: "High" | "Medium" | "Low";
  plannedDate?: string | null;
  attachmentMandatory: boolean;
  status: "Open" | "In Progress" | "Resolved" | "Closed";
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IHelpTicketRepository {
  create(ticket: HelpTicket): Promise<void>;
  findById(id: string): Promise<HelpTicket | null>;
  listAll(): Promise<HelpTicket[]>;
  listAssignedToMe(userId: string): Promise<HelpTicket[]>;
  listAssignedByMe(userId: string): Promise<HelpTicket[]>;
  updateStatus(id: string, status: string): Promise<void>;
}
