import { Response, Request } from "express";

export const index = (req: Request, res: Response) => {
  res.json({ message: "Hello World!" });
};
