import { JwtPayload } from "../lib/jwt";

declare global {
  namespace Express {
    interface Request {
      usuario?: JwtPayload;
    }
  }
}

export {};
