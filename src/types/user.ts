import { StatusType } from './status';

export type User = {
  username: string;
  password: string;
  refreshToken?: string;
  subscriptionStart: Date;
  subscriptionEnd: Date;
  status: StatusType;
  role: string;
  _id?: string;
};
