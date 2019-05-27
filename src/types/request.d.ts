import { User } from "../datalayer/User";

declare global {
  namespace Express {
    export interface Request {
      user?: User;
    }
  }
}
