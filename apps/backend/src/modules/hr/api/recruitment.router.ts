import { Router } from "express";
import { RecruitmentController } from "../application/controllers/RecruitmentController";

export const recruitmentRouter = Router();

// Job Requisitions
recruitmentRouter.get("/jobs", RecruitmentController.getJobs);
recruitmentRouter.post("/jobs", RecruitmentController.createJob);
recruitmentRouter.patch("/jobs/:id/status", RecruitmentController.updateJobStatus);
recruitmentRouter.delete("/jobs/:id", RecruitmentController.deleteJob);

// Candidate Pipeline
recruitmentRouter.get("/candidates", RecruitmentController.getCandidates);
recruitmentRouter.post("/candidates", RecruitmentController.createCandidate);
recruitmentRouter.patch("/candidates/:id/stage", RecruitmentController.updateCandidateStage);
recruitmentRouter.delete("/candidates/:id", RecruitmentController.deleteCandidate);

// Induction & Onboarding
recruitmentRouter.get("/inductions", RecruitmentController.getInductions);
recruitmentRouter.post("/inductions", RecruitmentController.createInduction);
recruitmentRouter.patch("/inductions/:id/checklist", RecruitmentController.updateInductionChecklist);
recruitmentRouter.delete("/inductions/:id", RecruitmentController.deleteInduction);

// Candidate Online Assessments (Pure System-Driven)
recruitmentRouter.get("/assessments", RecruitmentController.getAssessments);
recruitmentRouter.post("/assessments", RecruitmentController.createAssessment);
recruitmentRouter.delete("/assessments/:id", RecruitmentController.deleteAssessment);

// Employee Asset Management
recruitmentRouter.get("/assets", RecruitmentController.getAssets);
recruitmentRouter.post("/assets", RecruitmentController.allocateAsset);
recruitmentRouter.patch("/assets/:id/status", RecruitmentController.updateAssetStatus);
recruitmentRouter.delete("/assets/:id", RecruitmentController.deleteAsset);

// Employee Separation & F&F Settlement
recruitmentRouter.get("/separations", RecruitmentController.getSeparations);
recruitmentRouter.post("/separations", RecruitmentController.createSeparation);
recruitmentRouter.patch("/separations/:id/status", RecruitmentController.updateSeparationStatus);
recruitmentRouter.delete("/separations/:id", RecruitmentController.deleteSeparation);
