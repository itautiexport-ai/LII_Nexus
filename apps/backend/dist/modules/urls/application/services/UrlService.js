"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UrlService = void 0;
class UrlService {
    constructor(repo, scope) {
        this.repo = repo;
        this.scope = scope;
    }
    async create(title, url, actorUserId) {
        const owner = await this.scope.getEmployeeForUser(actorUserId);
        return this.repo.create({ title, url, createdBy: owner?.id ?? null });
    }
    async list() {
        return this.repo.list();
    }
    async remove(id) {
        await this.repo.remove(id);
    }
}
exports.UrlService = UrlService;
//# sourceMappingURL=UrlService.js.map