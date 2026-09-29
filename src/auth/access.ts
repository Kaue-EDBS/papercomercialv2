import { createContext, useContext } from 'react';

// F01 (docs/requirements/fluxos-principais.md): only two profiles. The server decides the role;
// the UI only mirrors it to hide what the profile cannot use.
export type Role = 'admin' | 'viewer';
export type Access = { role: Role; email: string };

export const AccessContext = createContext<Access | null>(null);

export const useAccess = (): Access => {
  const access = useContext(AccessContext);
  if (!access) throw new Error('useAccess must be used inside AuthGate.');
  return access;
};

export const isRole = (value: unknown): value is Role => value === 'admin' || value === 'viewer';
