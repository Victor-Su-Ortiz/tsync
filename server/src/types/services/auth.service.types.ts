export interface IAuthService {
  register(userData: RegisterUserInput): Promise<AuthResponse>;
  login(loginData: LoginInput): Promise<AuthResponse>;
  googleAuth(idToken: string, accessToken: string, code: string): Promise<AuthResponse>;
  verifyEmail(token: string): Promise<{ message: string }>;
  requestPasswordReset(email: string): Promise<{ message: string }>;
  resetPassword(token: string, newPassword: string): Promise<{ message: string }>;
  validateToken(token: string): Promise<{ valid: boolean; user?: any }>;
  changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ message: string }>;
}

// Types
export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  user: any;
  token: string;
}
