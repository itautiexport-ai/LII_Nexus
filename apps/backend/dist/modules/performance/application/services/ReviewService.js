"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewService = void 0;
const uuid_1 = require("uuid");
const DomainError_1 = require("../../../../core/domain/errors/DomainError");
const AuditService_1 = require("../../../../shared/services/AuditService");
const Review_1 = require("../../domain/entities/Review");
const Goal_1 = require("../../domain/entities/Goal");
class ReviewService {
    constructor(reviewRepo, goalRepo, scope) {
        this.reviewRepo = reviewRepo;
        this.goalRepo = goalRepo;
        this.scope = scope;
    }
    async listMine(actorUserId) {
        const actor = await this.scope.requireEmployeeForUser(actorUserId);
        return this.reviewRepo.listForEmployee(actor.id);
    }
    async listIManage(actorUserId) {
        const actor = await this.scope.requireEmployeeForUser(actorUserId);
        return this.reviewRepo.listForManager(actor.id);
    }
    async listForEmployee(employeeId, actorUserId, hasViewOverride) {
        await this.scope.authorize(actorUserId, employeeId, hasViewOverride);
        return this.reviewRepo.listForEmployee(employeeId);
    }
    async getById(reviewId, actorUserId, hasViewOverride) {
        const review = await this.reviewRepo.findById(reviewId);
        if (!review)
            throw new DomainError_1.NotFoundError("Review not found.");
        await this.scope.authorize(actorUserId, review.employeeId, hasViewOverride);
        const goalScores = await this.reviewRepo.getGoalScores(reviewId);
        return { ...review, goalScores };
    }
    /** Anyone can initiate a review of their own performance (self-service);
     *  a manager can initiate one for a direct report; HR/admin can initiate
     *  for anyone via the override permission. Ad hoc, no fixed cycle. */
    async initiate(employeeId, actorUserId, hasCreateOverride) {
        const target = await this.scope.authorize(actorUserId, employeeId, hasCreateOverride);
        const review = await this.reviewRepo.create({
            id: (0, uuid_1.v4)(),
            employeeId,
            managerId: target.managerId,
            initiatedBy: actorUserId,
        });
        await AuditService_1.AuditService.record({
            actorUserId,
            action: "REVIEW_INITIATED",
            entityType: "performance_review",
            entityId: review.id,
            afterState: { employeeId, managerId: target.managerId },
        });
        return review;
    }
    /** Only the employee themselves can submit their own self-assessment - this
     *  step is never delegable, even to a manager or admin, and has no
     *  override permission (there is deliberately no `hasOverride` param here). */
    async submitSelfAssessment(reviewId, selfSummary, actorUserId) {
        const review = await this.reviewRepo.findById(reviewId);
        if (!review)
            throw new DomainError_1.NotFoundError("Review not found.");
        const actor = await this.scope.requireEmployeeForUser(actorUserId);
        if (!this.scope.isSelf(actor, review.employeeId)) {
            throw new DomainError_1.ForbiddenError("Only the employee being reviewed can submit their self-assessment.");
        }
        if (review.status !== "self_pending") {
            throw new DomainError_1.ValidationError(`This review is not awaiting a self-assessment (current status: ${review.status}).`);
        }
        const updated = await this.reviewRepo.submitSelfAssessment(reviewId, selfSummary);
        await AuditService_1.AuditService.record({ actorUserId, action: "REVIEW_SELF_SUBMITTED", entityType: "performance_review", entityId: reviewId });
        return updated;
    }
    /** Only the employee's actual manager (or HR/admin via override) can submit
     *  the manager assessment. This is the point where goal progress is
     *  snapshotted and the blended score is computed and locked in.
     *  Never self-service, even without an override - handled by
     *  authorizeManagerOnly, which does not treat "is the employee themselves"
     *  as a valid path here. */
    async submitManagerAssessment(reviewId, input, actorUserId, hasManagerOverride) {
        const review = await this.reviewRepo.findById(reviewId);
        if (!review)
            throw new DomainError_1.NotFoundError("Review not found.");
        await this.scope.authorizeManagerOnly(actorUserId, review.employeeId, hasManagerOverride, "Only this employee's manager can submit the manager assessment.");
        if (review.status !== "manager_pending") {
            throw new DomainError_1.ValidationError(`This review is not awaiting a manager assessment (current status: ${review.status}).`);
        }
        // Snapshot current goals + achievement into the review record.
        const goals = await this.goalRepo.listForEmployee(review.employeeId);
        const snapshots = goals.map((g) => {
            const achievementPercentage = (0, Goal_1.computeAchievementPercentage)(g);
            return {
                goalId: g.id,
                goalTitleSnapshot: g.title,
                weight: g.weight,
                targetValue: g.targetValue,
                achievedValue: g.currentValue,
                achievementPercentage,
            };
        });
        await this.reviewRepo.saveGoalScores(reviewId, snapshots);
        const goalScore = (0, Review_1.computeWeightedGoalScore)(snapshots);
        const overallScore = (0, Review_1.computeOverallScore)(goalScore, input.managerScore);
        const updated = await this.reviewRepo.submitManagerAssessment(reviewId, {
            managerSummary: input.managerSummary,
            managerScore: input.managerScore,
            goalScore,
            overallScore,
        });
        await AuditService_1.AuditService.record({
            actorUserId,
            action: "REVIEW_MANAGER_SUBMITTED",
            entityType: "performance_review",
            entityId: reviewId,
            afterState: { managerScore: input.managerScore, goalScore, overallScore },
        });
        return updated;
    }
}
exports.ReviewService = ReviewService;
//# sourceMappingURL=ReviewService.js.map