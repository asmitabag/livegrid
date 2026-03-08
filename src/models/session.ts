export type SessionUser = Readonly<{
  userId: string;
  displayName: string;
  email?: string;
  photoURL?: string;
  color: string;
}>;