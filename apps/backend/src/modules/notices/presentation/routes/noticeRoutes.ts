import { Router } from 'express';
import { NoticeController } from '../controllers/NoticeController';
import { NoticeService } from '../../application/services/NoticeService';
import { MySqlNoticeRepository } from '../../infrastructure/repositories/MySqlNoticeRepository';
import { pool } from '../../../../infrastructure/database/mysql/connection';

const router = Router();
const repo = new MySqlNoticeRepository(pool);
const service = new NoticeService(repo);
const controller = new NoticeController(service);

router.get('/', controller.getNotices.bind(controller));
router.post('/', controller.createNotice.bind(controller));
router.delete('/:id', controller.deleteNotice.bind(controller));

export { router as noticeRoutes };
