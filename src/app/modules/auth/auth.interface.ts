export interface ILoginUserPayload {
  email: string;
  password: string;
}

export interface IRegisterPatientPayload {
  name: string;
  email: string;
  password: string;
}

export interface IGooleLoginPayload {
  idToken: string;
}

export interface IForgotPasswordPayload{
  email:string
}

export interface IResetpaswordPyalod{
  email:string,
  newPassword:string,
  otp:string
}