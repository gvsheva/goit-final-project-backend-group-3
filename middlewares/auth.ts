import { type NextFunction, type Request, type Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

import authConfig from "../config/auth.ts";
import { Session } from "../models/index.ts";

declare module "express-serve-static-core" {
    interface Request {
        session?: Session;
        authToken?: string;
    }
}

interface TokenPayload extends JwtPayload {
    sid?: string;
    email?: string;
}

function extractToken(req: Request): string | null {
    const header = req.get("authorization");
    if (!header) {
        return null;
    }

    const [scheme, token] = header.split(" ");
    if (scheme?.toLowerCase() === "bearer" && token) {
        return token;
    }

    return null;
}

export async function authMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    const token = extractToken(req);

    if (!token) {
        res.status(401).json({ message: "Authorization token is required" });
        return;
    }

    let payload: TokenPayload;
    try {
        payload = jwt.verify(token, authConfig.jwtSecret) as TokenPayload;
    } catch (error) {
        res.status(401).json({ message: "Invalid or expired token" });
        return;
    }

    const sessionId = payload.sid;

    if (!sessionId) {
        res.status(401).json({ message: "Invalid token payload" });
        return;
    }

    try {
        const session = await Session.findOne({
            where: { id: sessionId, closed: false },
            include: [Session.associations.user],
        });

        if (!session) {
            res.status(401).json({ message: "Session is not active" });
            return;
        }

        req.session = session;
        req.authToken = token;

        next();
    } catch (error) {
        next(error);
    }
}

export default authMiddleware;
