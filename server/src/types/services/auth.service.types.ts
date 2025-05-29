export interface IAuthService {
    login(email: string, password: string): Promise<{ user: any; token: string }>;
    register(userData: RegisterUserData): Promise<{ user: any; token: string }>;
    logout(token: string): Promise<void>;
    verifyToken(token: string): Promise<any>;
    refreshToken(refreshToken: string): Promise<{ token: string }>;
    forgotPassword(email: string): Promise<void>;
    resetPassword(token: string, newPassword: string): Promise<void>;
}

export interface RegisterUserData {
    email: string;
    password: string;
    name: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

export interface AuthResponse {
    user: any;
    tokens: AuthTokens;
}