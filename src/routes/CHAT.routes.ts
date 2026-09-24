import { Router } from "express";
import authMiddleware from "../middleware/session";
import { save, historial, cambio_estado, getAplicacion } from '../controllers/CHAT/CHAT.controller';

const router = Router()

router.post('/CHAT/save', authMiddleware, save);
//router.post('/CHAT/listar', authMiddleware, historial);
// router.post('/CHAT/cambio_estado', authMiddleware, cambio_estado);
router.post('/CHAT/aplicacion', authMiddleware, getAplicacion);

export default router;