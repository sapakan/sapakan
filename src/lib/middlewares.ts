import { NextFunction, Request, Response } from "express";

export const ensureLoggedIn = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/auth/signin");
};
