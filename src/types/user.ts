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
  feedback: string;
  rating: number;
  location: string;
};

export type Role = {
  value: string; // Id of the role
  label: string;
  _id?: string;
};

export type UserExpanded = {
  username: string;
  password?: string;
  refreshToken?: string;
  subscriptionStart?: string;
  subscriptionEnd?: string;
  status?: StatusType;
  role?: Role;
  _id?: string;
};
