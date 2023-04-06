declare global {
  namespace Express {
    interface User {
      accountId: number;
      username: string;
    }
  }
}
export default global;
