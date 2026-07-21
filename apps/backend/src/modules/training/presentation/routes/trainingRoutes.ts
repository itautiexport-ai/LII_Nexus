import { Router } from 'express';
import { TrainingController } from '../controllers/TrainingController';
import { TrainingService } from '../../application/services/TrainingService';
import { MySqlTrainingRepository } from '../../infrastructure/repositories/MySqlTrainingRepository';
import { pool } from '../../../../infrastructure/database/mysql/connection';

const router = Router();
const repo = new MySqlTrainingRepository(pool);
const service = new TrainingService(repo);
const controller = new TrainingController(service);

router.get('/calendars', controller.listCalendars.bind(controller));
router.post('/calendars', controller.createCalendar.bind(controller));

router.get('/sessions', controller.listSessions.bind(controller));
router.post('/sessions', controller.createSession.bind(controller));
router.put('/sessions/:id/status', controller.updateSessionStatus.bind(controller));
router.delete('/sessions/:id', controller.deleteSession.bind(controller));

export { router as trainingRoutes };
