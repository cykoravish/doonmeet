export interface NavUser {
  _id: string;
  name: string;
  avatar: string | null;
  isGuest: boolean;
  email?: string;
}