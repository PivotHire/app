
export enum UserRole {
    ADMIN = "admin",
    BUSINESS = "business",
    TALENT = "talent"
}

export function getRoleFromEmail(email: string): UserRole | null {
    if (email.endsWith("@pivothire.tech")) {
        return UserRole.ADMIN;
    }
    return null;
}
