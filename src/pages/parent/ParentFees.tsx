import React from 'react';
import { ParentLayout } from '@/layouts/ParentLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/ui/button';
import { IndianRupee, CreditCard, CheckCircle, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '@/i18n/TranslationContext';
<<<<<<< HEAD
import { useNavigate } from 'react-router-dom';
import { FeeReceiptData } from '@/components/parent/FeeReceipt';

const feesData = [
    {
        id: 1,
        student: 'Alex Johnson',
        type: 'Annual Tuition Fee',
        amount: '₹ 45,000',
        dueDate: 'Apr 10, 2025',
        status: 'paid',
        paymentDate: 'Apr 05, 2025',
        invoice: 'INV-2025-001',
        transactionId: 'TXN-2025-001-ABC'
    },
    {
        id: 2,
        student: 'Alex Johnson',
        type: 'Transport Fee (Q1)',
        amount: '₹ 8,000',
        dueDate: 'Apr 10, 2025',
        status: 'paid',
        paymentDate: 'Apr 05, 2025',
        invoice: 'INV-2025-002',
        transactionId: 'TXN-2025-002-DEF'
    },
    {
        id: 3,
        student: 'Alex Johnson',
        type: 'Term 2 Tuition Fee',
        amount: '₹ 45,000',
        dueDate: 'Oct 10, 2025',
        status: 'pending',
        invoice: 'INV-2025-056'
    },
    {
        id: 4,
        student: 'Emily Johnson',
        type: 'Annual Tuition Fee',
        amount: '₹ 35,000',
        dueDate: 'Apr 10, 2025',
        status: 'paid',
        paymentDate: 'Apr 02, 2025',
        invoice: 'INV-2025-003',
        transactionId: 'TXN-2025-003-GHI'
    }
];

export function ParentFees() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const handleViewReceipt = (item: typeof feesData[0]) => {
        // Prepare receipt data
        const receiptData: FeeReceiptData = {
            id: item.id,
            student: item.student,
            type: item.type,
            amount: item.amount,
            dueDate: item.dueDate,
            status: item.status,
            paymentDate: item.paymentDate,
            invoice: item.invoice,
            transactionId: item.transactionId,
            institutionName: 'Vidyon School',
            institutionAddress: '123 Education Street, City, State - 123456',
            institutionPhone: '+91 1234567890',
            institutionEmail: 'info@vidyon.edu'
        };

        // Store data in sessionStorage
        sessionStorage.setItem(`receipt_${item.invoice}`, JSON.stringify(receiptData));

        // Navigate to receipt page in same tab (so skeleton loading shows)
        navigate(`/parent/fees/receipt/${item.invoice}`);
=======
import { useAuth } from '@/context/AuthContext';
import { useParentDashboard } from '@/hooks/useParentDashboard';
import { supabase } from '@/lib/supabase';
import { InvoiceView } from '@/components/common/InvoiceView';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';

export function ParentFees() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { feeData, feeRecords, isLoading } = useParentDashboard(user?.id, user?.institutionId);
    const [selectedBill, setSelectedBill] = React.useState<any>(null);
    const [isInvoiceOpen, setIsInvoiceOpen] = React.useState(false);

    const { data: institutionInfo } = useQuery({
        queryKey: ['institution-branding', user?.institutionId],
        queryFn: async () => {
            if (!user?.institutionId) return null;
            const { data, error } = await supabase
                .from('institutions')
                .select('*')
                .eq('institution_id', user.institutionId)
                .single();
            if (error) throw error;
            return data;
        },
        enabled: !!user?.institutionId,
    });

    const handleViewReceipt = (bill: any) => {
        // Map student fee record to InvoiceView requirements
        const studentObj = {
            name: bill.students?.full_name || bill.students?.name || 'Student',
            rollNo: 'N/A', // We might need to fetch this or add to useParentDashboard
            address: bill.students?.address,
            fees: {
                total: bill.amount_due,
                paid: bill.amount_paid,
                pending: bill.amount_due - bill.amount_paid,
                structure: [] // Individual bill breakdown if available
            }
        };

        // If it's a manual bill, parse components
        try {
            const desc = JSON.parse(bill.description);
            if (Array.isArray(desc)) {
                studentObj.fees.structure = desc.map(d => ({
                    category: d.title,
                    amount: parseFloat(d.amount),
                    paid: bill.status === 'paid' ? parseFloat(d.amount) : 0
                }));
            }
        } catch (e) {
            studentObj.fees.structure = [{
                category: bill.description || 'General Fee',
                amount: bill.amount_due,
                paid: bill.amount_paid
            }];
        }

        setSelectedBill({
            student: studentObj,
            classInfo: {
                className: bill.students?.class_name || 'N/A',
                section: bill.students?.section || 'N/A'
            }
        });
        setIsInvoiceOpen(true);
>>>>>>> 8158be10d861fd76636b99ac08538b3a2303f12c
    };

    const handleDownloadReceipt = () => {
        toast.success(t.parent.fees.downloadingReceipt);
    };

    if (isLoading) {
        return (
            <ParentLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </ParentLayout>
        );
    }

    return (
        <>
            <ParentLayout>
                <PageHeader
                    title={t.parent.fees.title}
                    subtitle={t.parent.fees.subtitle}
                />

<<<<<<< HEAD
            {/* Summary Cards - Responsive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                <div className="p-4 sm:p-6 rounded-xl bg-white border border-border shadow-sm">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="p-2 sm:p-3 rounded-full bg-primary/10 text-primary flex-shrink-0">
                            <CreditCard className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs sm:text-sm text-muted-foreground truncate">{t.parent.fees.totalDue}</p>
                            <h3 className="text-xl sm:text-2xl font-bold">₹ 45,000</h3>
                        </div>
                    </div>
                </div>
                <div className="p-4 sm:p-6 rounded-xl bg-white border border-border shadow-sm">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="p-2 sm:p-3 rounded-full bg-success/10 text-success flex-shrink-0">
                            <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs sm:text-sm text-muted-foreground truncate">{t.parent.fees.paidThisYear}</p>
                            <h3 className="text-xl sm:text-2xl font-bold">₹ 88,000</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Fee Records - Responsive Table/Cards */}
            <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-border">
                    <h3 className="font-semibold text-base sm:text-lg">{t.parent.fees.feeRecords}</h3>
                </div>

                {/* Mobile Card View */}
                <div className="block lg:hidden">
                    <div className="divide-y divide-border">
                        {feesData.map((item) => (
                            <div key={item.id} className="p-4 hover:bg-muted/30 transition-colors">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="min-w-0 flex-1">
                                        <p className="font-semibold text-sm mb-1 truncate">{item.student}</p>
                                        <p className="text-sm text-muted-foreground mb-2">{item.type}</p>
                                    </div>
                                    <Badge
                                        variant={item.status === 'paid' ? 'success' : 'warning'}
                                        className="capitalize ml-2 flex-shrink-0"
                                    >
                                        {item.status}
                                    </Badge>
                                </div>
                                <div className="flex justify-between items-center mb-3">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Amount</p>
                                        <p className="font-bold text-base">{item.amount}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-muted-foreground">Due Date</p>
                                        <p className="text-sm">{item.dueDate}</p>
                                    </div>
                                </div>
                                {item.status === 'paid' ? (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleViewReceipt(item)}
                                        className="w-full min-h-[44px] flex items-center justify-center gap-2"
                                    >
                                        <IndianRupee className="w-4 h-4" />
                                        {t.parent.fees.receipt}
                                    </Button>
                                ) : (
                                    <Button
                                        size="sm"
                                        className="w-full min-h-[44px] bg-primary text-white"
                                    >
                                        {t.parent.fees.payNow}
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-muted/50 border-b border-border">
                                <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">{t.parent.fees.student}</th>
                                <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">{t.parent.fees.feeType}</th>
                                <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">{t.parent.fees.amount}</th>
                                <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">{t.parent.fees.dueDate}</th>
                                <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">{t.parent.fees.status}</th>
                                <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">{t.parent.fees.action}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {feesData.map((item) => (
                                <tr key={item.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                                    <td className="py-4 px-4 text-sm font-medium">{item.student}</td>
                                    <td className="py-4 px-4 text-sm">{item.type}</td>
                                    <td className="py-4 px-4 text-sm font-semibold">{item.amount}</td>
                                    <td className="py-4 px-4 text-sm text-muted-foreground">{item.dueDate}</td>
                                    <td className="py-4 px-4">
                                        <Badge variant={item.status === 'paid' ? 'success' : 'warning'} className="capitalize">
                                            {item.status}
                                        </Badge>
                                    </td>
                                    <td className="py-4 px-4">
                                        {item.status === 'paid' ? (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleViewReceipt(item)}
                                                className="min-h-[36px] flex items-center gap-2"
                                            >
                                                <IndianRupee className="w-4 h-4" />
                                                {t.parent.fees.receipt}
                                            </Button>
                                        ) : (
                                            <Button size="sm" className="bg-primary text-white min-h-[36px]">
                                                {t.parent.fees.payNow}
                                            </Button>
                                        )}
                                    </td>
=======
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
                    <div className="p-4 sm:p-6 rounded-xl bg-white border border-border shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-full bg-primary/10 text-primary">
                                <CreditCard className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">{t.parent.fees.totalDue}</p>
                                <h3 className="text-2xl font-bold">₹ {(feeData?.pending || 0).toLocaleString()}</h3>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 sm:p-6 rounded-xl bg-white border border-border shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-full bg-success/10 text-success">
                                <CheckCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">{t.parent.fees.paidThisYear}</p>
                                <h3 className="text-2xl font-bold">₹ {(feeData?.paid || 0).toLocaleString()}</h3>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-border">
                        <h3 className="font-semibold text-lg">{t.parent.fees.feeRecords}</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-muted/50 border-b border-border">
                                    <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">{t.parent.fees.student}</th>
                                    <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">{t.parent.fees.feeType}</th>
                                    <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">{t.parent.fees.amount}</th>
                                    <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">{t.parent.fees.dueDate}</th>
                                    <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">{t.parent.fees.status}</th>
                                    <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">{t.parent.fees.action}</th>
>>>>>>> 8158be10d861fd76636b99ac08538b3a2303f12c
                                </tr>
                            </thead>
                            <tbody>
                                {feeRecords.length > 0 ? (
                                    feeRecords.map((item: any) => {
                                        // Handle manual bill descriptions (JSON string)
                                        let feeType = 'Tuition Fee';
                                        try {
                                            const desc = JSON.parse(item.description);
                                            if (Array.isArray(desc) && desc.length > 0) {
                                                feeType = desc.map(d => d.title).join(', ');
                                            }
                                        } catch (e) {
                                            feeType = item.description || 'General Fee';
                                        }

                                        return (
                                            <tr key={item.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                                                <td className="py-3 px-4 text-sm font-medium">{item.students?.full_name || item.students?.name || 'N/A'}</td>
                                                <td className="py-3 px-4 text-sm max-w-[200px] truncate">{feeType}</td>
                                                <td className="py-3 px-4 text-sm font-semibold">₹ {item.amount_due.toLocaleString()}</td>
                                                <td className="py-3 px-4 text-sm text-muted-foreground">
                                                    {item.due_date ? new Date(item.due_date).toLocaleDateString() : 'N/A'}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <Badge
                                                        variant={item.status === 'paid' ? 'success' : item.status === 'partial' ? 'warning' : 'destructive'}
                                                        className="capitalize"
                                                    >
                                                        {item.status}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 px-4">
                                                    {item.status === 'paid' ? (
                                                        <Button variant="ghost" size="sm" onClick={() => handleViewReceipt(item)}>
                                                            <Download className="w-4 h-4 mr-2" />
                                                            {t.parent.fees.receipt}
                                                        </Button>
                                                    ) : (
                                                        <Button size="sm" className="bg-primary text-white">
                                                            {t.parent.fees.payNow}
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="py-10 text-center text-muted-foreground italic">
                                            No fee records found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </ParentLayout>

            <Dialog open={isInvoiceOpen} onOpenChange={setIsInvoiceOpen}>
                <DialogContent className="max-w-2xl bg-white text-black p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
                    {selectedBill && (
                        <InvoiceView
                            student={selectedBill.student}
                            institution={{
                                name: institutionInfo?.name || 'VidyOn Institution',
                                logo_url: institutionInfo?.logo_url,
                                address: institutionInfo?.address,
                                city: institutionInfo?.city,
                                email: institutionInfo?.email,
                                phone: institutionInfo?.phone
                            }}
                            classInfo={selectedBill.classInfo}
                            onDownload={handleDownloadReceipt}
                            onClose={() => setIsInvoiceOpen(false)}
                            isParentView={true}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
