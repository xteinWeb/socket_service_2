import { Router } from "express";
import authMiddleware from "../middleware/session";
import { sendMail } from "../controllers/email/emailer.controller";

const router = Router() //Exportar las rutas

// router.post('/email/emailerAuto', sendMail)

export default router;