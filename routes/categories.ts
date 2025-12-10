import { Router, type Request, type Response } from "express";

const router = Router();

router.get("/", function (_req: Request, res: Response) {
    res.status(501).json({ message: "GET /categories not implemented yet" });
});

export default router;
