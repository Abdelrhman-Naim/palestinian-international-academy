"use client";

import React from 'react';
import AdminDashboard from '@/pages/AdminDashboard';
import { AdminGuard } from '@/components/guards/RoleGuards';

export default function AdminDashboardLayout({ children }) {
  return (
    <AdminGuard>
      <AdminDashboard>{children}</AdminDashboard>
    </AdminGuard>
  );
}
