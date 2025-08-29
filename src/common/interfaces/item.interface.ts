export interface Item {
  id: number;
  owner_id: number;
  title: string;
  content?: string | null;
  created_at?: string;
}
