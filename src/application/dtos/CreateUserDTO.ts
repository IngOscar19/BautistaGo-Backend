import type { UserRole } from '../../domain/entities/User';

export interface CreateUserDTO {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
}
