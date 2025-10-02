export interface IAuthSuccessResponse {
  message: string;
  user: {
    userId: string;
    email: string;
    iat: number;
    exp: number;
  }
}
