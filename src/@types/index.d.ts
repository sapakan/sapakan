declare global {
  namespace Express {
    interface User {
      accountId: number;
      username: string;
    }

    interface Request {
      rawBody: Buffer;
    }
  }
}
export default global;
