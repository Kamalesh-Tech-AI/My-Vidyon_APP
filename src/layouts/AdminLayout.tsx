import { ReactNode } from 'react';
import { DashboardLayout } from './DashboardLayout';
import { useTranslation } from '@/i18n/TranslationContext';
import {
  LayoutDashboard,
  Building2,
  Users,
  Shield,
  GraduationCap,
  Megaphone,
  BarChart3,
  Settings,
} from 'lucide-react';

export function AdminLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();

  const adminNavItems = [
    { label: t.nav.dashboard, href: '/admin', icon: LayoutDashboard },
    { label: 'School Structure', href: '/admin/structure', icon: Building2 }, // Setup Board, Class, Section
    { label: 'My Subjects', href: '/admin/subjects', icon: GraduationCap }, // Subject Master & Allocation
    { label: t.nav.users, href: '/admin/users', icon: Users }, // Students, Staff, Parents
    { label: 'Approvals', href: '/admin/approvals', icon: Shield }, // Leaves, Marks
    { label: 'Announcements', href: '/admin/communication', icon: Megaphone }, // Notices
    { label: t.nav.analytics, href: '/admin/reports', icon: BarChart3 }, // Reports
    { label: t.nav.settings, href: '/admin/settings', icon: Settings },
  ];

  return (
    <DashboardLayout navItems={adminNavItems} roleColor="text-admin">
      {children}
    </DashboardLayout>
  );
}
