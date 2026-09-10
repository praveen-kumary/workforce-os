import React from 'react';
import { EmployeeProfile } from './EmployeeProfile';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';

export const MyProfile: React.FC = () => {
  const { user } = useAuthStore();

  // Use the authenticated user's ID to navigate to their profile
  if (user?.id) {
    return <Navigate to={`/employees/${user.id}`} replace />;
  }

  // Fallback if no user ID
  return <EmployeeProfile />;
};
