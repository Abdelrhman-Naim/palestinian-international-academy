"use client";

import React from 'react';
import InstructorDashboard from '@/pages/InstructorDashboard';
import { InstructorGuard } from '@/components/guards/RoleGuards';

export default function InstructorDashboardLayout({ children }) {
  return (
    <InstructorGuard>
      <InstructorDashboard>{children}</InstructorDashboard>
    </InstructorGuard>
  );
}
