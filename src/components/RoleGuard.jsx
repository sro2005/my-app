import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Client-side role gate for navigation. API authorization remains the security boundary.
 * A role mismatch returns the user to the appropriate application home.
 */
const RoleGuard = ({ user, allowedRole, allowedRoles, children }) => {
  const roles = allowedRoles || (allowedRole ? [allowedRole] : []);
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/home-page" replace />;
  return children;
};

export default RoleGuard;
