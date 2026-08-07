import { axiosInstance as api } from "../../../services/api/axiosInstance";

export interface JobRequisitionRecord {
  id: string;
  requisition_code: string;
  title: string;
  department: string;
  positions_count: number;
  reason_for_vacancy?: string | null;
  employment_type?: string | null;
  experience_range: string | null;
  required_qualification?: string | null;
  salary_budget: string | null;
  hiring_manager: string | null;
  requested_by?: string | null;
  work_location?: string | null;
  target_date: string | null;
  status: 'Open' | 'Interviewing' | 'In Pipeline' | 'On Hold' | 'Closed';
  urgency_level?: string | null;
  job_description: string | null;
  key_skills?: string | null;
  created_at: string;
}

export interface CandidatePipelineRecord {
  id: string;
  requisition_id: string | null;
  candidate_name: string;
  email: string | null;
  phone: string | null;
  position_applied: string;
  experience_years: string | null;
  stage: 'Applied' | 'Screening' | 'Interview Scheduled' | 'Offer Sent' | 'Hired' | 'Rejected';
  interview_date: string | null;
  interviewer_name: string | null;
  rating: number;
  notes: string | null;
  created_at: string;
}

export interface ChecklistItem {
  id: number;
  title: string;
  completed: boolean;
}

export interface InductionTrackerRecord {
  id: string;
  employee_name: string;
  employee_code: string | null;
  department: string;
  joining_date: string;
  mentor_name: string | null;
  status: 'Pending' | 'In Progress' | 'Completed';
  checklist_json: string | null;
  notes: string | null;
  created_at: string;
}

export interface CandidateAssessmentRecord {
  id: string;
  candidate_name: string;
  candidate_email: string | null;
  position_applied: string;
  department: string;
  assessment_title: string;
  time_taken_minutes: number;
  section_a_score: number;
  section_b_mcq_score: number;
  section_b_practical_score: number;
  section_c_score: number;
  section_d_score: number;
  total_score: number;
  passing_score: number;
  result: 'PASSED' | 'FAILED';
  answers_json: string | null;
  submitted_at: string;
}

export const recruitmentApi = {
  // Jobs
  getJobs: async (): Promise<JobRequisitionRecord[]> => {
    const res = await api.get("/hr/recruitment/jobs");
    return res.data.data;
  },
  createJob: async (data: any): Promise<JobRequisitionRecord> => {
    const res = await api.post("/hr/recruitment/jobs", data);
    return res.data.data;
  },
  updateJobStatus: async (id: string, status: string): Promise<JobRequisitionRecord> => {
    const res = await api.patch(`/hr/recruitment/jobs/${id}/status`, { status });
    return res.data.data;
  },
  deleteJob: async (id: string): Promise<void> => {
    await api.delete(`/hr/recruitment/jobs/${id}`);
  },

  // Candidates
  getCandidates: async (): Promise<CandidatePipelineRecord[]> => {
    const res = await api.get("/hr/recruitment/candidates");
    return res.data.data;
  },
  createCandidate: async (data: any): Promise<CandidatePipelineRecord> => {
    const res = await api.post("/hr/recruitment/candidates", data);
    return res.data.data;
  },
  updateCandidateStage: async (id: string, stage: string, interviewDate?: string, notes?: string): Promise<CandidatePipelineRecord> => {
    const res = await api.patch(`/hr/recruitment/candidates/${id}/stage`, { stage, interviewDate, notes });
    return res.data.data;
  },
  deleteCandidate: async (id: string): Promise<void> => {
    await api.delete(`/hr/recruitment/candidates/${id}`);
  },

  // Inductions
  getInductions: async (): Promise<InductionTrackerRecord[]> => {
    const res = await api.get("/hr/recruitment/inductions");
    return res.data.data;
  },
  createInduction: async (data: any): Promise<InductionTrackerRecord> => {
    const res = await api.post("/hr/recruitment/inductions", data);
    return res.data.data;
  },
  updateInductionChecklist: async (id: string, checklistJson: string, status?: string): Promise<InductionTrackerRecord> => {
    const res = await api.patch(`/hr/recruitment/inductions/${id}/checklist`, { checklistJson, status });
    return res.data.data;
  },
  deleteInduction: async (id: string): Promise<void> => {
    await api.delete(`/hr/recruitment/inductions/${id}`);
  },

  // Assessments
  getAssessments: async (): Promise<CandidateAssessmentRecord[]> => {
    const res = await api.get("/hr/recruitment/assessments");
    return res.data.data;
  },
  submitAssessment: async (data: {
    candidateName: string;
    candidateEmail?: string;
    positionApplied: string;
    department: string;
    timeTakenMinutes?: number;
    sectionAScore: number;
    sectionBMcqScore: number;
    sectionBPracticalScore: number;
    sectionCScore: number;
    sectionDScore: number;
    answersJson?: string;
  }): Promise<CandidateAssessmentRecord> => {
    const res = await api.post("/hr/recruitment/assessments", data);
    return res.data.data;
  },
  deleteAssessment: async (id: string): Promise<void> => {
    await api.delete(`/hr/recruitment/assessments/${id}`);
  },

  // Assets
  getAssets: async (): Promise<EmployeeAssetRecord[]> => {
    const res = await api.get("/hr/recruitment/assets");
    return res.data.data;
  },
  allocateAsset: async (data: any): Promise<EmployeeAssetRecord> => {
    const res = await api.post("/hr/recruitment/assets", data);
    return res.data.data;
  },
  updateAssetStatus: async (id: string, status: string, returnDate?: string): Promise<EmployeeAssetRecord> => {
    const res = await api.patch(`/hr/recruitment/assets/${id}/status`, { status, returnDate });
    return res.data.data;
  },
  deleteAsset: async (id: string): Promise<void> => {
    await api.delete(`/hr/recruitment/assets/${id}`);
  },

  // Separation & F&F Settlement
  getSeparations: async (): Promise<EmployeeSeparationRecord[]> => {
    const res = await api.get("/hr/recruitment/separations");
    return res.data.data;
  },
  createSeparation: async (data: any): Promise<EmployeeSeparationRecord> => {
    const res = await api.post("/hr/recruitment/separations", data);
    return res.data.data;
  },
  updateSeparationStatus: async (id: string, status: string, payload?: any): Promise<EmployeeSeparationRecord> => {
    const res = await api.patch(`/hr/recruitment/separations/${id}/status`, { status, ...payload });
    return res.data.data;
  },
  deleteSeparation: async (id: string): Promise<void> => {
    await api.delete(`/hr/recruitment/separations/${id}`);
  },
};

export interface EmployeeAssetRecord {
  id: string;
  asset_code: string;
  employee_id: string;
  employee_name: string;
  department: string | null;
  asset_category: string;
  asset_name: string;
  serial_number: string | null;
  issue_date: string;
  return_date: string | null;
  status: 'Allocated' | 'Returned' | 'Under Maintenance';
  condition_on_issue: string | null;
  remarks: string | null;
  created_at: string;
}

export interface EmployeeSeparationRecord {
  id: string;
  case_code: string;
  employee_id: string;
  employee_name: string;
  department: string | null;
  designation: string | null;
  reporting_manager: string | null;
  joining_date: string | null;
  resignation_date: string;
  last_working_day: string;
  notice_period_days: number;
  notice_period_served: number;
  notice_shortfall_days: number;
  notice_pay_recovery: number;
  employment_type: string;
  exit_type: string;
  reason_for_leaving: string | null;
  management_remarks: string | null;
  status: string;
  clearances_json: string | null;
  asset_recoveries_json: string | null;
  leave_settlement_json: string | null;
  payroll_settlement_json: string | null;
  exit_interview_json: string | null;
  gross_earnings: number;
  gross_deductions: number;
  net_payable: number;
  payment_status: string;
  payment_date: string | null;
  payment_mode: string;
  employee_signature: string | null;
  hr_signature: string | null;
  created_at: string;
}
