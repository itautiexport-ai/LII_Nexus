"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MasterDataService = void 0;
class MasterDataService {
    constructor(repo) {
        this.repo = repo;
    }
    // Wood Types
    async getWoodTypes() {
        return await this.repo.getWoodTypes();
    }
    async createWoodType(name) {
        if (!name)
            throw new Error("Name is required");
        return await this.repo.createWoodType(name);
    }
    async updateWoodType(id, name, status) {
        if (!name)
            throw new Error("Name is required");
        return await this.repo.updateWoodType(id, name, status);
    }
    async deleteWoodType(id) {
        await this.repo.deleteWoodType(id);
    }
    // Priorities
    async getPriorities() {
        return await this.repo.getPriorities();
    }
    async createPriority(name, colorCode) {
        if (!name || !colorCode)
            throw new Error("Name and color code are required");
        return await this.repo.createPriority(name, colorCode);
    }
    async updatePriority(id, name, colorCode, status) {
        if (!name || !colorCode)
            throw new Error("Name and color code are required");
        return await this.repo.updatePriority(id, name, colorCode, status);
    }
    async deletePriority(id) {
        await this.repo.deletePriority(id);
    }
    // Buyers
    async getBuyers() {
        return await this.repo.getBuyers();
    }
    async createBuyer(name) {
        if (!name)
            throw new Error("Name is required");
        return await this.repo.createBuyer(name);
    }
    async updateBuyer(id, name) {
        if (!name)
            throw new Error("Name is required");
        return await this.repo.updateBuyer(id, name);
    }
    async deleteBuyer(id) {
        await this.repo.deleteBuyer(id);
    }
    // UOMs
    async getUoms() {
        return await this.repo.getUoms();
    }
    async createUom(name) {
        if (!name)
            throw new Error("Name is required");
        return await this.repo.createUom(name);
    }
    async updateUom(id, name) {
        if (!name)
            throw new Error("Name is required");
        return await this.repo.updateUom(id, name);
    }
    async deleteUom(id) {
        await this.repo.deleteUom(id);
    }
    // HODs
    async getHods() {
        return await this.repo.getHods();
    }
    async createHod(name) {
        if (!name)
            throw new Error("Name is required");
        return await this.repo.createHod(name);
    }
    async updateHod(id, name) {
        if (!name)
            throw new Error("Name is required");
        return await this.repo.updateHod(id, name);
    }
    async deleteHod(id) {
        await this.repo.deleteHod(id);
    }
    // Merchants
    async getMerchants() {
        return await this.repo.getMerchants();
    }
    async createMerchant(name, status = 'active') {
        if (!name)
            throw new Error("Name is required");
        return await this.repo.createMerchant(name, status);
    }
    async updateMerchant(id, name, status) {
        if (!name)
            throw new Error("Name is required");
        return await this.repo.updateMerchant(id, name, status);
    }
    async deleteMerchant(id) {
        await this.repo.deleteMerchant(id);
    }
}
exports.MasterDataService = MasterDataService;
//# sourceMappingURL=MasterDataService.js.map