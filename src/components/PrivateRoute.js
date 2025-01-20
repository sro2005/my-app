import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const PrivateRoute = ({ allowedRoles }) => {
  const userRole = localStorage.getItem('userRole');
  return allowedRoles.includes(userRole) ? <Outlet /> : <Navigate to="/" />;
};

export default PrivateRoute;
