export type UserRole = "super_admin" | "curador" | "cliente";

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  exento_pago: boolean;
  avatar_config: Record<string, unknown>;
}
