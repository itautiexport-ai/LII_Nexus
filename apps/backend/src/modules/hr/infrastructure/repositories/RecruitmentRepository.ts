import { pool } from "../../../../infrastructure/database/mysql/connection";
import { v4 as uuid } from "uuid";

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
  created_at: Date;
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
  interview_date: string | Date | null;
  interviewer_name: string | null;
  rating: number;
  notes: string | null;
  created_at: Date;
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
  created_at: Date;
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
  submitted_at: Date;
}

export class RecruitmentRepository {
  // Job Requisitions
  async findAllJobs(): Promise<JobRequisitionRecord[]> {
    const [rows] = await pool.query("SELECT * FROM hr_job_requisitions ORDER BY created_at DESC");
    return rows as JobRequisitionRecord[];
  }

  async createJob(data: {
    requisitionCode?: string;
    title: string;
    department: string;
    positionsCount?: number;
    reasonForVacancy?: string;
    employmentType?: string;
    experienceRange?: string;
    requiredQualification?: string;
    salaryBudget?: string;
    hiringManager?: string;
    requestedBy?: string;
    workLocation?: string;
    targetDate?: string;
    status?: 'Open' | 'Interviewing' | 'On Hold' | 'Closed';
    urgencyLevel?: string;
    jobDescription?: string;
    keySkills?: string;
  }): Promise<JobRequisitionRecord> {
    const id = uuid();
    const reqCode = data.requisitionCode || `REQ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    await pool.query(
      `INSERT INTO hr_job_requisitions
       (id, requisition_code, title, department, positions_count, reason_for_vacancy, employment_type, experience_range, required_qualification, salary_budget, hiring_manager, requested_by, work_location, target_date, status, urgency_level, job_description, key_skills)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        reqCode,
        data.title,
        data.department,
        data.positionsCount || 1,
        data.reasonForVacancy || null,
        data.employmentType || null,
        data.experienceRange || null,
        data.requiredQualification || null,
        data.salaryBudget || null,
        data.hiringManager || null,
        data.requestedBy || null,
        data.workLocation || null,
        data.targetDate || null,
        data.status || 'Open',
        data.urgencyLevel || 'Medium',
        data.jobDescription || null,
        data.keySkills || null,
      ]
    );
    const [rows] = await pool.query("SELECT * FROM hr_job_requisitions WHERE id = ?", [id]);
    return (rows as JobRequisitionRecord[])[0];
  }

  async updateJobStatus(id: string, status: 'Open' | 'Interviewing' | 'In Pipeline' | 'On Hold' | 'Closed'): Promise<JobRequisitionRecord | null> {
    await pool.query("UPDATE hr_job_requisitions SET status = ? WHERE id = ?", [status, id]);
    const [rows] = await pool.query("SELECT * FROM hr_job_requisitions WHERE id = ?", [id]);
    return (rows as JobRequisitionRecord[])[0] || null;
  }

  async deleteJob(id: string): Promise<void> {
    await pool.query("DELETE FROM hr_job_requisitions WHERE id = ?", [id]);
  }

  // Candidate Pipeline
  async findAllCandidates(): Promise<CandidatePipelineRecord[]> {
    const [rows] = await pool.query("SELECT * FROM hr_candidate_pipeline ORDER BY created_at DESC");
    return rows as CandidatePipelineRecord[];
  }

  async createCandidate(data: {
    requisitionId?: string;
    candidateName: string;
    email?: string;
    phone?: string;
    positionApplied: string;
    experienceYears?: string;
    stage?: 'Applied' | 'Screening' | 'Interview Scheduled' | 'Offer Sent' | 'Hired' | 'Rejected';
    interviewDate?: string;
    interviewerName?: string;
    rating?: number;
    notes?: string;
  }): Promise<CandidatePipelineRecord> {
    const id = uuid();
    await pool.query(
      `INSERT INTO hr_candidate_pipeline
       (id, requisition_id, candidate_name, email, phone, position_applied, experience_years, stage, interview_date, interviewer_name, rating, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.requisitionId || null,
        data.candidateName,
        data.email || null,
        data.phone || null,
        data.positionApplied,
        data.experienceYears || null,
        data.stage || 'Applied',
        data.interviewDate || null,
        data.interviewerName || null,
        data.rating || 0,
        data.notes || null,
      ]
    );
    const [rows] = await pool.query("SELECT * FROM hr_candidate_pipeline WHERE id = ?", [id]);
    return (rows as CandidatePipelineRecord[])[0];
  }

  async updateCandidateStage(id: string, stage: 'Applied' | 'Screening' | 'Interview Scheduled' | 'Offer Sent' | 'Hired' | 'Rejected', interviewDate?: string, notes?: string): Promise<CandidatePipelineRecord | null> {
    if (interviewDate !== undefined || notes !== undefined) {
      await pool.query(
        "UPDATE hr_candidate_pipeline SET stage = ?, interview_date = COALESCE(?, interview_date), notes = COALESCE(?, notes) WHERE id = ?",
        [stage, interviewDate || null, notes || null, id]
      );
    } else {
      await pool.query("UPDATE hr_candidate_pipeline SET stage = ? WHERE id = ?", [stage, id]);
    }
    const [rows] = await pool.query("SELECT * FROM hr_candidate_pipeline WHERE id = ?", [id]);
    return (rows as CandidatePipelineRecord[])[0] || null;
  }

  async deleteCandidate(id: string): Promise<void> {
    await pool.query("DELETE FROM hr_candidate_pipeline WHERE id = ?", [id]);
  }

  // Induction Trackers
  async findAllInductions(): Promise<InductionTrackerRecord[]> {
    const [rows] = await pool.query("SELECT * FROM hr_induction_trackers ORDER BY joining_date DESC");
    return rows as InductionTrackerRecord[];
  }

  async createInduction(data: {
    employeeName: string;
    employeeCode?: string;
    department: string;
    joiningDate: string;
    mentorName?: string;
    status?: 'Pending' | 'In Progress' | 'Completed';
    checklistJson?: string;
    notes?: string;
  }): Promise<InductionTrackerRecord> {
    const id = uuid();
    const defaultChecklist = JSON.stringify([
      { id: 1, title: "ID Card & Biometric Registration", completed: false },
      { id: 2, title: "Workstation & IT Credentials Setup", completed: false },
      { id: 3, title: "HR Policy & Orientation Briefing", completed: false },
      { id: 4, title: "Safety & PPE Training Walkthrough", completed: false },
      { id: 5, title: "Department Manager & Buddy Introduction", completed: false },
      { id: 6, title: "Bank Account & Payroll Documentation", completed: false }
    ]);

    await pool.query(
      `INSERT INTO hr_induction_trackers
       (id, employee_name, employee_code, department, joining_date, mentor_name, status, checklist_json, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.employeeName,
        data.employeeCode || `LII-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        data.department,
        data.joiningDate,
        data.mentorName || null,
        data.status || 'In Progress',
        data.checklistJson || defaultChecklist,
        data.notes || null,
      ]
    );
    const [rows] = await pool.query("SELECT * FROM hr_induction_trackers WHERE id = ?", [id]);
    return (rows as InductionTrackerRecord[])[0];
  }

  async updateInductionChecklist(id: string, checklistJson: string, status?: 'Pending' | 'In Progress' | 'Completed'): Promise<InductionTrackerRecord | null> {
    await pool.query(
      "UPDATE hr_induction_trackers SET checklist_json = ?, status = COALESCE(?, status) WHERE id = ?",
      [checklistJson, status || null, id]
    );
    const [rows] = await pool.query("SELECT * FROM hr_induction_trackers WHERE id = ?", [id]);
    return (rows as InductionTrackerRecord[])[0] || null;
  }

  async deleteInduction(id: string): Promise<void> {
    await pool.query("DELETE FROM hr_induction_trackers WHERE id = ?", [id]);
  }

  // Candidate Assessments
  async findAllAssessments(): Promise<CandidateAssessmentRecord[]> {
    const [rows] = await pool.query("SELECT * FROM hr_candidate_assessments ORDER BY submitted_at DESC");
    return rows as CandidateAssessmentRecord[];
  }

  async createAssessment(data: {
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
  }): Promise<CandidateAssessmentRecord> {
    const id = uuid();
    const totalScore = data.sectionAScore + data.sectionBMcqScore + data.sectionBPracticalScore + data.sectionCScore + data.sectionDScore;
    const result = totalScore >= 70 ? 'PASSED' : 'FAILED';

    await pool.query(
      `INSERT INTO hr_candidate_assessments
       (id, candidate_name, candidate_email, position_applied, department, time_taken_minutes, section_a_score, section_b_mcq_score, section_b_practical_score, section_c_score, section_d_score, total_score, passing_score, result, answers_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 70, ?, ?)`,
      [
        id,
        data.candidateName,
        data.candidateEmail || null,
        data.positionApplied,
        data.department,
        data.timeTakenMinutes || 0,
        data.sectionAScore,
        data.sectionBMcqScore,
        data.sectionBPracticalScore,
        data.sectionCScore,
        data.sectionDScore,
        totalScore,
        result,
        data.answersJson || null,
      ]
    );

    // Auto-update or create candidate in pipeline
    try {
      let candRows: any[] = [];
      if (data.candidateEmail && data.candidateEmail.trim() !== "") {
        const [rows] = await pool.query(
          "SELECT * FROM hr_candidate_pipeline WHERE LOWER(candidate_name) = LOWER(?) OR (email IS NOT NULL AND LOWER(email) = LOWER(?))",
          [data.candidateName.trim(), data.candidateEmail.trim()]
        );
        candRows = rows as any[];
      } else {
        const [rows] = await pool.query(
          "SELECT * FROM hr_candidate_pipeline WHERE LOWER(candidate_name) = LOWER(?)",
          [data.candidateName.trim()]
        );
        candRows = rows as any[];
      }
      const candidates = candRows as CandidatePipelineRecord[];

      const calculatedRating = totalScore >= 90 ? 5 : totalScore >= 80 ? 4 : totalScore >= 70 ? 3 : totalScore >= 50 ? 2 : 1;
      const autoNotes = `Completed Assessment: ${totalScore}/100 Marks (${result}). Time taken: ${data.timeTakenMinutes || 0} mins.`;

      if (candidates.length > 0) {
        await pool.query(
          "UPDATE hr_candidate_pipeline SET rating = ?, notes = CONCAT(IFNULL(notes, ''), '\n', ?) WHERE id = ?",
          [calculatedRating, autoNotes, candidates[0].id]
        );
      } else {
        const candId = uuid();
        await pool.query(
          `INSERT INTO hr_candidate_pipeline
           (id, candidate_name, email, position_applied, stage, rating, notes)
           VALUES (?, ?, ?, ?, 'Screening', ?, ?)`,
          [candId, data.candidateName, data.candidateEmail || null, data.positionApplied, calculatedRating, autoNotes]
        );
      }
    } catch (e) {
      console.error("Error auto-updating candidate pipeline on assessment submission:", e);
    }

    const [rows] = await pool.query("SELECT * FROM hr_candidate_assessments WHERE id = ?", [id]);
    return (rows as CandidateAssessmentRecord[])[0];
  }

  async deleteAssessment(id: string): Promise<void> {
    await pool.query("DELETE FROM hr_candidate_assessments WHERE id = ?", [id]);
  }

  // Employee Asset Management
  async findAllAssets(): Promise<any[]> {
    const [rows] = await pool.query("SELECT * FROM hr_employee_assets ORDER BY created_at DESC");
    return rows as any[];
  }

  async createAsset(data: any): Promise<any> {
    const id = uuid();
    const assetCode = `AST-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    
    await pool.query(
      `INSERT INTO hr_employee_assets
       (id, asset_code, employee_id, employee_name, department, asset_category, asset_name, serial_number, issue_date, return_date, status, condition_on_issue, remarks)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        assetCode,
        data.employeeId || data.employee_id || "EMP-001",
        data.employeeName || data.employee_name,
        data.department || null,
        data.assetCategory || data.asset_category,
        data.assetName || data.asset_name,
        data.serialNumber || data.serial_number || null,
        data.issueDate || data.issue_date || new Date().toISOString().split("T")[0],
        data.returnDate || data.return_date || null,
        data.status || 'Allocated',
        data.conditionOnIssue || data.condition_on_issue || 'Good',
        data.remarks || null,
      ]
    );

    const [rows] = await pool.query("SELECT * FROM hr_employee_assets WHERE id = ?", [id]);
    return (rows as any[])[0];
  }

  async updateAssetStatus(id: string, status: string, returnDate?: string): Promise<any> {
    if (status === "Returned") {
      const today = new Date().toISOString().split("T")[0];
      await pool.query("UPDATE hr_employee_assets SET status = ?, return_date = ? WHERE id = ?", [status, returnDate || today, id]);
    } else {
      await pool.query("UPDATE hr_employee_assets SET status = ? WHERE id = ?", [status, id]);
    }
    const [rows] = await pool.query("SELECT * FROM hr_employee_assets WHERE id = ?", [id]);
    return (rows as any[])[0];
  }

  async deleteAsset(id: string): Promise<void> {
    await pool.query("DELETE FROM hr_employee_assets WHERE id = ?", [id]);
  }

  // Employee Separation & F&F Settlement
  async findAllSeparations(): Promise<any[]> {
    const [rows] = await pool.query("SELECT * FROM hr_employee_separations ORDER BY created_at DESC");
    return rows as any[];
  }

  async createSeparation(data: any): Promise<any> {
    const id = uuid();
    const caseCode = `SEP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const defaultClearances = JSON.stringify({
      HR: { status: "Pending", remarks: "", approvedBy: "", approvalDate: "" },
      ReportingManager: { status: "Pending", remarks: "", approvedBy: "", approvalDate: "" },
      DepartmentHead: { status: "Pending", remarks: "", approvedBy: "", approvalDate: "" },
      IT: { status: "Pending", remarks: "", approvedBy: "", approvalDate: "" },
      Admin: { status: "Pending", remarks: "", approvedBy: "", approvalDate: "" },
      Stores: { status: "Pending", remarks: "", approvedBy: "", approvalDate: "" },
      Production: { status: "Pending", remarks: "", approvedBy: "", approvalDate: "" },
      Quality: { status: "Pending", remarks: "", approvedBy: "", approvalDate: "" },
      Purchase: { status: "Pending", remarks: "", approvedBy: "", approvalDate: "" },
      Accounts: { status: "Pending", remarks: "", approvedBy: "", approvalDate: "" },
      Security: { status: "Pending", remarks: "", approvedBy: "", approvalDate: "" },
      Maintenance: { status: "Pending", remarks: "", approvedBy: "", approvalDate: "" }
    });

    await pool.query(
      `INSERT INTO hr_employee_separations
       (id, case_code, employee_id, employee_name, department, designation, reporting_manager, joining_date, resignation_date, last_working_day, notice_period_days, notice_period_served, notice_shortfall_days, notice_pay_recovery, employment_type, exit_type, reason_for_leaving, management_remarks, status, clearances_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        caseCode,
        data.employeeId || data.employee_id,
        data.employeeName || data.employee_name,
        data.department || null,
        data.designation || null,
        data.reportingManager || data.reporting_manager || null,
        data.joiningDate || data.joining_date || null,
        data.resignationDate || data.resignation_date || new Date().toISOString().split("T")[0],
        data.lastWorkingDay || data.last_working_day || new Date().toISOString().split("T")[0],
        data.noticePeriodDays || 30,
        data.noticePeriodServed || 30,
        data.noticeShortfallDays || 0,
        data.noticePayRecovery || 0,
        data.employmentType || 'Permanent',
        data.exitType || 'Resignation',
        data.reasonForLeaving || null,
        data.managementRemarks || null,
        data.status || 'Resignation Submitted',
        data.clearancesJson || defaultClearances,
      ]
    );

    const [rows] = await pool.query("SELECT * FROM hr_employee_separations WHERE id = ?", [id]);
    return (rows as any[])[0];
  }

  async updateSeparationStatus(id: string, status: string, payload?: any): Promise<any> {
    await pool.query(
      `UPDATE hr_employee_separations
       SET status = ?,
           clearances_json = COALESCE(?, clearances_json),
           asset_recoveries_json = COALESCE(?, asset_recoveries_json),
           leave_settlement_json = COALESCE(?, leave_settlement_json),
           payroll_settlement_json = COALESCE(?, payroll_settlement_json),
           exit_interview_json = COALESCE(?, exit_interview_json),
           gross_earnings = COALESCE(?, gross_earnings),
           gross_deductions = COALESCE(?, gross_deductions),
           net_payable = COALESCE(?, net_payable),
           payment_status = COALESCE(?, payment_status),
           payment_date = COALESCE(?, payment_date),
           payment_mode = COALESCE(?, payment_mode)
       WHERE id = ?`,
      [
        status,
        payload?.clearancesJson || null,
        payload?.assetRecoveriesJson || null,
        payload?.leaveSettlementJson || null,
        payload?.payrollSettlementJson || null,
        payload?.exitInterviewJson || null,
        payload?.grossEarnings !== undefined ? payload.grossEarnings : null,
        payload?.grossDeductions !== undefined ? payload.grossDeductions : null,
        payload?.netPayable !== undefined ? payload.netPayable : null,
        payload?.paymentStatus || null,
        payload?.paymentDate || null,
        payload?.paymentMode || null,
        id,
      ]
    );

    const [rows] = await pool.query("SELECT * FROM hr_employee_separations WHERE id = ?", [id]);
    return (rows as any[])[0];
  }

  async deleteSeparation(id: string): Promise<void> {
    await pool.query("DELETE FROM hr_employee_separations WHERE id = ?", [id]);
  }
}
