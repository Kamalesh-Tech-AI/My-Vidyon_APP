import { ParentLayout } from '@/layouts/ParentLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/i18n/TranslationContext';
import { useParentDashboard } from '@/hooks/useParentDashboard';
import { Phone, Shield, School, User, Calendar, CreditCard, AlertCircle } from 'lucide-react';

export function ParentDashboard() {
    const { user } = useAuth();
    const { t } = useTranslation();

    const { stats, children, childrenAttendance, leaveRequests, feeData } = useParentDashboard(
        user?.id,
        user?.institutionId
    );

    return (
        <ParentLayout>
            <PageHeader
                title={`${t.common.welcome}, ${user?.name}!`}
                subtitle="Monitor your children's progress"
            />

            {/* Children Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-4 sm:mt-6 mb-8">
                {children.length > 0 ? (
                    children.map((child) => {
                        const childAttendance = childrenAttendance.find(a => a.childId === child.id);
                        return (
                            <div key={child.id} className="bg-card rounded-lg border border-border p-5 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h3 className="font-semibold text-lg">{child.name}</h3>
                                        <p className="text-sm text-muted-foreground">{child.class} - Section {child.section}</p>
                                    </div>
                                    <div className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                        Roll: {child.rollNumber}
                                    </div>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Attendance:</span>
                                        <span className="font-medium">{childAttendance?.percentage || '0%'}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="col-span-full bg-card rounded-lg border-2 border-dashed p-10 text-center">
                        <User className="w-12 h-12 text-muted-foreground mx-auto mb-2 opacity-20" />
                        <p className="text-muted-foreground italic">
                            No children linked to this account yet.
                        </p>
                    </div>
                )}
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-card p-4 rounded-lg border border-border shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <User className="w-5 h-5 text-primary" />
                        <h4 className="font-semibold text-sm">Total Children</h4>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{stats.totalChildren}</p>
                </div>
                <div className="bg-card p-4 rounded-lg border border-border shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <Calendar className="w-5 h-5 text-warning" />
                        <h4 className="font-semibold text-sm">Pending Leave Requests</h4>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{stats.pendingLeaveRequests}</p>
                </div>
                <div className="bg-card p-4 rounded-lg border border-border shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <CreditCard className="w-5 h-5 text-destructive" />
                        <h4 className="font-semibold text-sm">Pending Fees</h4>
                    </div>
                    <p className="text-2xl font-bold text-foreground">₹{feeData?.pending || 0}</p>
                </div>
                <div className="bg-card p-4 rounded-lg border border-border shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <AlertCircle className="w-5 h-5 text-info" />
                        <h4 className="font-semibold text-sm">Upcoming Events</h4>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{stats.upcomingEvents}</p>
                </div>
            </div>

            {/* Leave Requests */}
            {leaveRequests.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-4">Recent Leave Requests</h2>
                    <div className="space-y-3">
                        {leaveRequests.slice(0, 5).map((request) => (
                            <div key={request.id} className="bg-card rounded-lg border border-border p-4 flex items-center justify-between">
                                <div>
                                    <p className="font-medium">{request.childName}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {request.startDate} to {request.endDate}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">{request.reason}</p>
                                </div>
                                <div className={`px-3 py-1 rounded text-xs font-medium ${request.status === 'approved' ? 'bg-green-100 text-green-700' :
                                        request.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                            'bg-yellow-100 text-yellow-700'
                                    }`}>
                                    {request.status.toUpperCase()}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Emergency Contacts */}
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
