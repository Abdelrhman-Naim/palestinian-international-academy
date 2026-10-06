"use client";

import React from 'react';
import Dashboard from '@/pages/Dashboard';
import { StudentGuard } from '@/components/guards/RoleGuards';

export default function StudentDashboardLayout({ children }) {
  return (
    <StudentGuard>
      <Dashboard>{children}</Dashboard>
    </StudentGuard>
  );
}
