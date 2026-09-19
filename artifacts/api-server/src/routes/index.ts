import { Router, type IRouter } from "express";
import healthRouter from "./health";
import googleOAuthRouter from "./google-oauth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(googleOAuthRouter);

export default router;
