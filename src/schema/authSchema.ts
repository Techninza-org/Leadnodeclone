export const authSchema = `

  type CreateUserResponse {
    user: User
  }

  type LoginUserResponse {
    user: User
  }

  type GenerateOTPResponse {
    otp: String
    otpExpiry: String
    id: String
  }
`;
