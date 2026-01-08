import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ParentLayout } from '@/layouts/ParentLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/i18n/TranslationContext';
import { ChildCard } from '@/components/cards/ChildCard';
import { Phone, Shield, School, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Helper to deduce performance mock based on nothing (random/demo)
const getPerformance = () => ['Excellent', 'Good', 'Average'][Math.floor(Math.random() * 3)] as 'Excellent' | 'Good' | 'Average';

export function ParentDashboard() {
    const { user } = useAuth();
    const { t } = useTranslation();

    const { data: dashboardData, isLoading, error } = useQuery({
        queryKey: ['parent-dashboard', user?.id],
        queryFn: async () => {
            // 1. Get Parent details using profile_id
            const { data: parentData, error: parentError } = await supabase
                .from('parents')
                .select('id, institution_id')
                .eq('profile_id', user?.id)
                .single();

            if (parentError) {
                console.error('Parent record not found for profile:', user?.id);
                throw new Error('Parent record not found. Please contact support.');
            }

            // 2. Get linked Students
            const { data: links, error: linkError } = await supabase
                .from('student_parents')
                .select('student_id')
                .eq('parent_id', parentData.id);

            if (linkError) throw linkError;

            const studentIds = links.map(l => l.student_id);

            if (studentIds.length === 0) {
                return { students: [], stats: { attendance: '0%', fees: '₹0', exams: 0 } };
            }

            // 3. Fetch detailed Student data
            const { data: students, error: studentError } = await supabase
                .from('students')
                .select('*')
                .in('id', studentIds);

            if (studentError) throw studentError;

            return {
                students: students.map(child => ({
                    id: child.id,
                    name: child.name,
                    grade: child.class_name || 'Not Assigned',
                    rollNo: child.register_number || 'N/A',
                    attendance: 85 + Math.floor(Math.random() * 10), // Mock for now
                    performance: 'Excellent',
                    teacherName: 'Class Teacher',
                    teacherPhone: '+91 90000 00000'
                })),
                stats: {
                    attendance: '92%',
                    fees: '₹12,500 Pending',
                    exams: 1
                }
            };
        },
        enabled: !!user?.id
    });

    if (isLoading) {
        return (
            <ParentLayout>
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </ParentLayout>
        );
    }

    return (
        <ParentLayout>
            <PageHeader
                title={`${t.common.welcome}, ${user?.name}!`}
                subtitle={t.parent.dashboard.subtitle}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-4 sm:mt-6 mb-8">
                {dashboardData?.students && dashboardData.students.length > 0 ? (
                    dashboardData.students.map((child: any) => (
                        <ChildCard key={child.id} {...child} />
                    ))
                ) : (
                    <div className="col-span-full bg-card rounded-lg border-2 border-dashed p-10 text-center">
                        <User className="w-12 h-12 text-muted-foreground mx-auto mb-2 opacity-20" />
                        <p className="text-muted-foreground italic">
                            No students linked to this account yet.
                        </p>
                    </div>
                )}
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-card p-4 rounded-lg border border-border shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <Calendar className="w-5 h-5 text-primary" />
                        <h4 className="font-semibold text-sm">Avg. Attendance</h4>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{dashboardData?.stats.attendance}</p>
                </div>
                <div className="bg-card p-4 rounded-lg border border-border shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <CreditCard className="w-5 h-5 text-warning" />
                        <h4 className="font-semibold text-sm">Fees Due</h4>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{dashboardData?.stats.fees}</p>
                </div>
                <div className="bg-card p-4 rounded-lg border border-border shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <Shield className="w-5 h-5 text-info" />
                        <h4 className="font-semibold text-sm">System Status</h4>
                    </div>
                    <p className="text-2xl font-bold text-foreground">Operational</p>
                </div>
            </div>

            {/* Emergency Contacts Section */}
            <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Phone className="w-5 h-5 text-destructive" />
                    Emergency Contacts
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-card rounded-lg border border-border p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="p-2.5 bg-blue-100 dark:bg-blue-900/20 rounded-full text-blue-600 dark:text-blue-400">
                            <School className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground font-medium">School Office</p>
                            <a href="tel:+914412345678" className="font-semibold text-foreground hover:text-primary transition-colors block">
                                044-1234 5678
                            </a>
                        </div>
                    </div>
                    <div className="bg-card rounded-lg border border-border p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="p-2.5 bg-red-100 dark:bg-red-900/20 rounded-full text-red-600 dark:text-red-400">
                            <Shield className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground font-medium">Main Guard</p>
                            <a href="tel:+919876500000" className="font-semibold text-foreground hover:text-primary transition-colors block">
                                +91 98765 00000
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </ParentLayout>
    );
}

// Add missing icons locally for the component
import { Loader2, Phone, School, User, Calendar, CreditCard } from 'lucide-react';
