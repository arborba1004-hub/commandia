// LEGACY
// INACTIVE
// DO NOT USE

import React from 'react';

/**
 * This is a legacy, inactive provider.
 * All Wix Members authentication logic has been removed.
 * The project uses Google Auth exclusively.
 * This component only returns children without any real behavior.
 */
export const MemberProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};
