// LEGACY
// INACTIVE
// DO NOT USE

import React, { createContext } from 'react';

// Define a minimal context type that indicates it's inactive
interface InactiveMemberContextType {
  isLoggedIn: boolean;
  member: null;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  reloadMember: () => Promise<void>;
}

// Create a context with default inactive values
const InactiveMemberContext = createContext<InactiveMemberContextType | undefined>(undefined);

// This is the replacement for useMember hook
export const useMember = () => {
  throw new Error('Wix Members authentication flow is deactivated. This project uses Google Auth. Do not use useMember().');
};

// Minimal export for backward compatibility, but it's inactive
export const MemberContext = InactiveMemberContext;
