export interface User {
  name: string;
  email: string;
  id: number;
}
export interface DBUser extends User {
  password: string;
}
