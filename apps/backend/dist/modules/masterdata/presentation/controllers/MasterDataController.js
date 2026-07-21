"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MasterDataController = void 0;
class MasterDataController {
    constructor(service) {
        this.service = service;
    }
    // Wood Types
    async getWoodTypes(req, res) {
        const data = await this.service.getWoodTypes();
        res.json({ success: true, data });
    }
    async createWoodType(req, res) {
        const data = await this.service.createWoodType(req.body.name);
        res.json({ success: true, data });
    }
    async updateWoodType(req, res) {
        const data = await this.service.updateWoodType(req.params.id, req.body.name, req.body.status);
        res.json({ success: true, data });
    }
    async deleteWoodType(req, res) {
        await this.service.deleteWoodType(req.params.id);
        res.json({ success: true });
    }
    // Priorities
    async getPriorities(req, res) {
        const data = await this.service.getPriorities();
        res.json({ success: true, data });
    }
    async createPriority(req, res) {
        const data = await this.service.createPriority(req.body.name, req.body.colorCode);
        res.json({ success: true, data });
    }
    async updatePriority(req, res) {
        const data = await this.service.updatePriority(req.params.id, req.body.name, req.body.colorCode, req.body.status);
        res.json({ success: true, data });
    }
    async deletePriority(req, res) {
        await this.service.deletePriority(req.params.id);
        res.json({ success: true });
    }
    // Buyers
    async getBuyers(req, res) {
        const data = await this.service.getBuyers();
        res.json({ success: true, data });
    }
    async createBuyer(req, res) {
        const data = await this.service.createBuyer(req.body.name);
        res.json({ success: true, data });
    }
    async updateBuyer(req, res) {
        const data = await this.service.updateBuyer(req.params.id, req.body.name);
        res.json({ success: true, data });
    }
    async deleteBuyer(req, res) {
        await this.service.deleteBuyer(req.params.id);
        res.json({ success: true });
    }
    async importBuyers(req, res) {
        const file = req.file;
        if (!file) {
            res.status(400).json({ success: false, error: "No file uploaded" });
            return;
        }
        // Lazy load XLSX to process the file
        const XLSX = require("xlsx");
        const workbook = XLSX.read(file.buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        let count = 0;
        for (const row of data) {
            const name = row["Name"] || row["name"] || row["Buyer Name"];
            if (name) {
                await this.service.createBuyer(name);
                count++;
            }
        }
        res.json({ success: true, count });
    }
    // UOMs
    async getUoms(_req, res) {
        const data = await this.service.getUoms();
        res.json({ success: true, data });
    }
    async createUom(req, res) {
        const data = await this.service.createUom(req.body.name);
        res.json({ success: true, data });
    }
    async updateUom(req, res) {
        const data = await this.service.updateUom(req.params.id, req.body.name);
        res.json({ success: true, data });
    }
    async deleteUom(req, res) {
        await this.service.deleteUom(req.params.id);
        res.json({ success: true });
    }
    // HODs
    async getHods(_req, res) {
        const data = await this.service.getHods();
        res.json({ success: true, data });
    }
    async createHod(req, res) {
        const data = await this.service.createHod(req.body.name);
        res.json({ success: true, data });
    }
    async updateHod(req, res) {
        const data = await this.service.updateHod(req.params.id, req.body.name);
        res.json({ success: true, data });
    }
    async deleteHod(req, res) {
        await this.service.deleteHod(req.params.id);
        res.json({ success: true });
    }
    // Merchants
    async getMerchants(_req, res) {
        const data = await this.service.getMerchants();
        res.json({ success: true, data });
    }
    async createMerchant(req, res) {
        const data = await this.service.createMerchant(req.body.name, req.body.status);
        res.json({ success: true, data });
    }
    async updateMerchant(req, res) {
        const data = await this.service.updateMerchant(req.params.id, req.body.name, req.body.status);
        res.json({ success: true, data });
    }
    async deleteMerchant(req, res) {
        await this.service.deleteMerchant(req.params.id);
        res.json({ success: true });
    }
}
exports.MasterDataController = MasterDataController;
//# sourceMappingURL=MasterDataController.js.map