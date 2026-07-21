import { axiosInstance } from "../../../../services/api/axiosInstance";

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
}

export interface CreateHelpTicketPayload {
  subject: string;
  problemSolverId: string;
  problem: string;
  priority: "High" | "Medium" | "Low";
  plannedDate?: string | null;
  attachmentMandatory?: boolean;
  mediaUrl?: string | null;
}

export const helpTicketsApi = {
  create: (data: CreateHelpTicketPayload) =>
    axiosInstance.post<HelpTicket>("/help-tickets", data).then((r) => r.data),

  listAll: () =>
    axiosInstance.get<HelpTicket[]>("/help-tickets").then((r) => r.data),

  listAssignedToMe: () =>
    axiosInstance.get<HelpTicket[]>("/help-tickets/assigned-to-me").then((r) => r.data),

  listAssignedByMe: () =>
    axiosInstance.get<HelpTicket[]>("/help-tickets/assigned-by-me").then((r) => r.data),

  getById: (id: string) =>
    axiosInstance.get<HelpTicket>(`/help-tickets/${id}`).then((r) => r.data),

  updateStatus: (id: string, status: string) =>
    axiosInstance.patch<HelpTicket>(`/help-tickets/${id}/status`, { status }).then((r) => r.data),
};
