export type UserRole = 'CLIENT' | 'KITCHEN' | 'DELIVERY' | 'ADMIN';

export class User {
  constructor(
    public readonly id: string,
    public name: string,
    public email: string,
    public passwordHash: string,
    public role: UserRole,
    public phone?: string,
    public isActive: boolean = true,
    public deletedAt: Date | null = null,
  ) {}

  deactivate(): void {
    this.isActive = false;
    this.deletedAt = new Date();
  }

  activate(): void {
    this.isActive = true;
    this.deletedAt = null;
  }
}
