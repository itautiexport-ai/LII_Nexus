import { Router } from 'express';
import { MetalPriceService } from '../../application/services/MetalPriceService';
import { asyncHandler } from '../../../../shared/utils/asyncHandler';
// Mounted behind the existing master-data authMiddleware.
const router = Router();
const service = new MetalPriceService();
router.get('/', asyncHandler(async (_req, res) => res.json({ success: true, data: await service.list() })));
router.post('/import-browser', asyncHandler(async (req, res) => res.json({ success: true, data: await service.importLegacy(req.body.records) })));
router.post('/', asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await service.create(req.body) })));
router.put('/:id', asyncHandler(async (req, res) => res.json({ success: true, data: await service.update(req.params.id, req.body) })));
router.delete('/:id', asyncHandler(async (req, res) => { await service.remove(req.params.id); res.json({ success: true }); }));
export default router;
