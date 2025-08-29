export interface User {
  id: number;
  email: string;
  created_at?: string; // DB returns created_at column; keep name to match query
}
