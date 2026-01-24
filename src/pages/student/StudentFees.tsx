import { StudentLayout } from '@/layouts/StudentLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/TranslationContext';
import { CreditCard, CheckCircle, Clock, AlertCircle, Download, Calendar, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { format, parseISO } from 'date-fns';

export function StudentFees() {
    const { t } = useTranslation();
    const { user } = useAuth();

    // 1. Fetch Student Profile
    const { data: studentProfile, isLoading: profileLoading } = useQuery({
        queryKey: ['student-profile', user?.email],
        queryFn: async () => {
            if (!user?.email) return null;
            const { data, error } = await supabase
                .from('students')
                .select('*')
                .ilike('email', user.email.trim())
                .maybeSingle();

            if (error) {
                console.error('Profile Fetch Error:', error);
                return null;
            }
            return data;
        },
        enabled: !!user?.email,
    });

    // 2. Fetch Fees
    const { data: feesData, isLoading: feesLoading } = useQuery({
        queryKey: ['student-fees-view', studentProfile?.id],
        queryFn: async () => {
            if (!studentProfile?.id) return [];

            const { data, error } = await supabase
                .from('student_fees')
                .select(`
                    *,
                    fee_structures (name)
                `)
                .eq('student_id', studentProfile.id);

            if (error) throw error;
            return data || [];
        },
        enabled: !!studentProfile?.id,
    });

    const isLoading = profileLoading || feesLoading;

    const totalFees = feesData?.reduce((sum, item) => sum + Number(item.amount_due), 0) || 0;
    const paidFees = feesData?.reduce((sum, item) => sum + Number(item.amount_paid || 0), 0) || 0;
    const pendingFees = totalFees - paidFees;

    if (isLoading) {
        return (
            <StudentLayout>
                <PageHeader title={t.nav.fees} subtitle="Loading fee details..." />
                <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>
            </StudentLayout>
        );
    }

    return (
        <StudentLayout>
            <PageHeader
                title={t.nav.fees}
                subtitle={t.dashboard.overview}
            />

            {/* Fee Summary Cards */}
            <div className="stats-grid mb-6 sm:mb-8">
                <div className="dashboard-card p-4 sm:p-6">
                    <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                            <p className="text-xs sm:text-sm text-muted-foreground mb-1">Total Fees</p>
                            <h3 className="text-xl sm:text-2xl font-bold truncate">₹{totalFees.toLocaleString()}</h3>
                        </div>
                        <CreditCard className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground flex-shrink-0" />
                    </div>
                </div>

                <div className="dashboard-card p-4 sm:p-6">
                    <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                            <p className="text-xs sm:text-sm text-muted-foreground mb-1">Paid</p>
                            <h3 className="text-xl sm:text-2xl font-bold text-success truncate">₹{paidFees.toLocaleString()}</h3>
                        </div>
                        <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-success flex-shrink-0" />
                    </div>
                </div>

                <div className="dashboard-card p-4 sm:p-6">
                    <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                            <p className="text-xs sm:text-sm text-muted-foreground mb-1">Pending</p>
                            <h3 className="text-xl sm:text-2xl font-bold text-warning truncate">₹{pendingFees.toLocaleString()}</h3>
                        </div>
                        <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10 text-warning flex-shrink-0" />
                    </div>
                </div>
            </div>

            {/* Fee Structure */}
            <div className="dashboard-card p-4 sm:p-6 mb-6 sm:mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
                    <h3 className="font-semibold text-sm sm:text-base">Fee Breakdown</h3>
                    <Button className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center min-h-[44px]">
                        <CreditCard className="w-4 h-4" />
                        Pay Now
                    </Button>
                </div>

                {feesData && feesData.length > 0 ? (
                    <>
                        {/* Mobile Card View */}
                        <div className="block sm:hidden space-y-3">
                            {feesData.map((fee, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border">
                                    <div className="min-w-0 flex-1">
                                        <p className="font-medium text-sm truncate">{fee.fee_structures?.name || 'Academic Fee'}</p>
                                        <p className="text-lg font-semibold mt-1">₹{Number(fee.amount_due).toLocaleString()}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2 ml-3">
                                        <Badge variant={fee.status === 'paid' ? 'success' : 'warning'}>
                                            {fee.status?.toUpperCase() || 'PENDING'}
                                        </Badge>
                                        <Button variant="outline" size="sm" className="min-h-[36px]">
                                            {fee.status !== 'paid' ? 'Pay' : 'Receipt'}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden sm:block overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                            <table className="w-full min-w-[500px]">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="table-header text-left py-2 sm:py-3 px-2 sm:px-4">Fee Item</th>
                                        <th className="table-header text-right py-2 sm:py-3 px-2 sm:px-4">Amount</th>
                                        <th className="table-header text-center py-2 sm:py-3 px-2 sm:px-4">Status</th>
                                        <th className="table-header text-center py-2 sm:py-3 px-2 sm:px-4">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {feesData.map((fee, index) => (
                                        <tr key={index} className="border-b border-border hover:bg-muted/50">
                                            <td className="table-cell font-medium py-3 sm:py-4 px-2 sm:px-4">{fee.fee_structures?.name || 'Academic Fee'}</td>
                                            <td className="table-cell text-right py-3 sm:py-4 px-2 sm:px-4">₹{Number(fee.amount_due).toLocaleString()}</td>
                                            <td className="table-cell text-center py-3 sm:py-4 px-2 sm:px-4">
                                                <Badge variant={fee.status === 'paid' ? 'success' : 'warning'}>
                                                    {fee.status?.toUpperCase() || 'PENDING'}
                                                </Badge>
                                            </td>
                                            <td className="table-cell text-center py-3 sm:py-4 px-2 sm:px-4">
                                                {fee.status !== 'paid' ? (
                                                    <Button variant="outline" size="sm" className="min-h-[36px]">Pay</Button>
                                                ) : (
                                                    <Button variant="outline" size="sm" className="flex items-center gap-1 mx-auto min-h-[36px]">
                                                        <Download className="w-3 h-3" />
                                                        Receipt
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t-2 border-border font-semibold">
                                        <td className="table-cell py-3 sm:py-4 px-2 sm:px-4">Total</td>
                                        <td className="table-cell text-right py-3 sm:py-4 px-2 sm:px-4">₹{totalFees.toLocaleString()}</td>
                                        <td colSpan={2}></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-10 text-muted-foreground">No fee records found.</div>
                )}
            </div>

            {/* Payment History (Derived from student_fees for now) */}
            <div className="dashboard-card p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-4 sm:mb-6">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    <h3 className="font-semibold text-sm sm:text-base">Payment History</h3>
                </div>

                <div className="space-y-2 sm:space-y-3">
                    {feesData && feesData.filter(f => f.amount_paid > 0).length > 0 ? (
                        feesData.filter(f => f.amount_paid > 0).map((payment, index) => (
                            <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 p-3 sm:p-4 bg-muted/30 rounded-lg">
                                <div className="min-w-0">
                                    <p className="font-medium text-sm truncate">{payment.fee_structures?.name || 'Fee Payment'}</p>
                                    <p className="text-xs sm:text-sm text-muted-foreground">
                                        {payment.last_payment_date ? format(parseISO(payment.last_payment_date), 'MMM dd, yyyy') : 'Recently'}
                                    </p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className="font-semibold text-sm sm:text-base">₹{Number(payment.amount_paid).toLocaleString()}</p>
                                    <Badge variant="success" className="mt-1">Completed</Badge>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 text-muted-foreground">No payment history found.</div>
                    )}
                </div>
            </div>
        </StudentLayout>
    );
}
