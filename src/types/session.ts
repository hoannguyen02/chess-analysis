export type Session = {
  username: string;
  role: string;
  id: string;
  permissions: Record<string, boolean>;
};
