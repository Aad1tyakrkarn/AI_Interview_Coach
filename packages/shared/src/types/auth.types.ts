import { Role } from './user.types';

export interface ILoginRequest {
  email: string;
  password: string;
  twoFactorCode?: string;
}

export interface ILoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: Role;
    firstName: string;
    lastName: string;
  };
}

export interface IRegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface ITokenPayload {
  userId: string;
  role: Role;
  sessionId: string;
}

export interface IPasswordResetRequest {
  email: string;
}

export interface IPasswordResetConfirm {
  token: string;
  newPassword: string;
}

export interface I2FASetupResponse {
  secret: string;
  qrCodeUrl: string;
}

export interface IEmailVerification {
  token: string;
}
