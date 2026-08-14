import { NextFunction, Request, Response } from "express";

type HandlerAssincrono = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

/** Encaminha rejeicoes de handlers async para o errorHandler do Express. */
export function asyncHandler(handler: HandlerAssincrono) {
  return (req: Request, res: Response, next: NextFunction): void => {
    handler(req, res, next).catch(next);
  };
}
