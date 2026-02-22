export interface AuthenticationResponse {
    id: number;
    username: string;
    fullName: string;
    email: string | null;
    accessToken: string;
    refreshToken: string;
    role: string;
    message: string;
    success: boolean;
}