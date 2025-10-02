export interface ILoginSuccessResponse {
  message: string;
  data: {
    token: string;
    user: {
      id: string;
      email: string;
    }
  }
}
