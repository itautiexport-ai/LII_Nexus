import { Request, Response } from "express";
import { RecruitmentRepository } from "../../infrastructure/repositories/RecruitmentRepository";

const repo = new RecruitmentRepository();

export class RecruitmentController {
  // Jobs
  static async getJobs(_req: Request, res: Response) {
    try {
      const data = await repo.findAllJobs();
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async createJob(req: Request, res: Response) {
    try {
      const {
        title,
        department,
        positionsCount,
        reasonForVacancy,
        employmentType,
        experienceRange,
        requiredQualification,
        salaryBudget,
        hiringManager,
        requestedBy,
        workLocation,
        targetDate,
        status,
        urgencyLevel,
        jobDescription,
        keySkills,
      } = req.body;

      if (!title || !department) {
        return res.status(400).json({ success: false, error: "Title and Department are required." });
      }

      const data = await repo.createJob({
        title,
        department,
        positionsCount: positionsCount ? Number(positionsCount) : 1,
        reasonForVacancy,
        employmentType,
        experienceRange,
        requiredQualification,
        salaryBudget,
        hiringManager,
        requestedBy,
        workLocation,
        targetDate,
        status,
        urgencyLevel,
        jobDescription,
        keySkills,
      });

      res.status(201).json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async updateJobStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!status) return res.status(400).json({ success: false, error: "Status is required." });
      const data = await repo.updateJobStatus(id, status);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async deleteJob(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await repo.deleteJob(id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // Candidates
  static async getCandidates(_req: Request, res: Response) {
    try {
      const data = await repo.findAllCandidates();
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async createCandidate(req: Request, res: Response) {
    try {
      const { requisitionId, candidateName, email, phone, positionApplied, experienceYears, stage, interviewDate, interviewerName, rating, notes } = req.body;
      if (!candidateName || !positionApplied) {
        return res.status(400).json({ success: false, error: "Candidate Name and Position Applied are required." });
      }

      const data = await repo.createCandidate({
        requisitionId,
        candidateName,
        email,
        phone,
        positionApplied,
        experienceYears,
        stage,
        interviewDate,
        interviewerName,
        rating: rating ? Number(rating) : 0,
        notes,
      });

      res.status(201).json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async updateCandidateStage(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { stage, interviewDate, notes } = req.body;
      if (!stage) return res.status(400).json({ success: false, error: "Stage is required." });
      const data = await repo.updateCandidateStage(id, stage, interviewDate, notes);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async deleteCandidate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await repo.deleteCandidate(id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // Inductions
  static async getInductions(_req: Request, res: Response) {
    try {
      const data = await repo.findAllInductions();
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async createInduction(req: Request, res: Response) {
    try {
      const { employeeName, employeeCode, department, joiningDate, mentorName, status, notes } = req.body;
      if (!employeeName || !department || !joiningDate) {
        return res.status(400).json({ success: false, error: "Employee Name, Department, and Joining Date are required." });
      }

      const data = await repo.createInduction({
        employeeName,
        employeeCode,
        department,
        joiningDate,
        mentorName,
        status,
        notes,
      });

      res.status(201).json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async updateInductionChecklist(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { checklistJson, status } = req.body;
      if (!checklistJson) return res.status(400).json({ success: false, error: "Checklist data is required." });
      const data = await repo.updateInductionChecklist(id, checklistJson, status);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async deleteInduction(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await repo.deleteInduction(id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // Assessments
  static async getAssessments(_req: Request, res: Response) {
    try {
      const data = await repo.findAllAssessments();
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async createAssessment(req: Request, res: Response) {
    try {
      const { candidateName, candidateEmail, positionApplied, department, timeTakenMinutes, sectionAScore, sectionBMcqScore, sectionBPracticalScore, sectionCScore, sectionDScore, answersJson } = req.body;
      if (!candidateName || !positionApplied || !department) {
        return res.status(400).json({ success: false, error: "Candidate Name, Position Applied, and Department are required." });
      }

      const data = await repo.createAssessment({
        candidateName,
        candidateEmail,
        positionApplied,
        department,
        timeTakenMinutes: timeTakenMinutes ? Number(timeTakenMinutes) : 0,
        sectionAScore: Number(sectionAScore || 0),
        sectionBMcqScore: Number(sectionBMcqScore || 0),
        sectionBPracticalScore: Number(sectionBPracticalScore || 0),
        sectionCScore: Number(sectionCScore || 0),
        sectionDScore: Number(sectionDScore || 0),
        answersJson,
      });

      res.status(201).json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async deleteAssessment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await repo.deleteAssessment(id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // Employee Asset Management
  static async getAssets(req: Request, res: Response) {
    try {
      const data = await repo.findAllAssets();
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async allocateAsset(req: Request, res: Response) {
    try {
      const { employeeName, assetCategory, assetName } = req.body;
      if (!employeeName || !assetCategory || !assetName) {
        return res.status(400).json({ success: false, error: "Employee Name, Asset Category and Asset Name are required." });
      }
      const data = await repo.createAsset(req.body);
      res.status(201).json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async updateAssetStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status, returnDate } = req.body;
      if (!status) return res.status(400).json({ success: false, error: "Status is required." });
      const data = await repo.updateAssetStatus(id, status, returnDate);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async deleteAsset(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await repo.deleteAsset(id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // Employee Separation & F&F Settlement
  static async getSeparations(req: Request, res: Response) {
    try {
      const data = await repo.findAllSeparations();
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async createSeparation(req: Request, res: Response) {
    try {
      const { employeeName, resignationDate, lastWorkingDay } = req.body;
      if (!employeeName || !resignationDate || !lastWorkingDay) {
        return res.status(400).json({ success: false, error: "Employee Name, Resignation Date, and Last Working Day are required." });
      }
      const data = await repo.createSeparation(req.body);
      res.status(201).json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async updateSeparationStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!status) return res.status(400).json({ success: false, error: "Status is required." });
      const data = await repo.updateSeparationStatus(id, status, req.body);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async deleteSeparation(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await repo.deleteSeparation(id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}
