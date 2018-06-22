import { User } from './user';
import { Group } from './group';

export interface ServerResponse {
  success: boolean,
  message: string,
  user: User,
  group: Group,
}