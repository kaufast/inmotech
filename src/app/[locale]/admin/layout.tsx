import { ReactNode } from 'react';
import AdminDashboardLayout from '@/components/layout/AdminDashboardLayout';

type Props = {
  children: ReactNode;
};

export default function AdminLayout({ children }: Props) {
  return (
    <AdminDashboardLayout>
      {children}
    </AdminDashboardLayout>
  );
}