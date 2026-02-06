import { ParentLayout } from '@/layouts/ParentLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/ui/button';
import { Download, CreditCard, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '@/i18n/TranslationContext';

const feesData = [
    {
        id: 1,
        student: 'Alex Johnson',
        type: 'Annual Tuition Fee',
        amount: '₹ 45,000',
        dueDate: 'Apr 10, 2025',
        status: 'paid',
        paymentDate: 'Apr 05, 2025',
        invoice: 'INV-2025-001'
    },
    {
        id: 2,
        student: 'Alex Johnson',
        type: 'Transport Fee (Q1)',
        amount: '₹ 8,000',
        dueDate: 'Apr 10, 2025',
        status: 'paid',
        paymentDate: 'Apr 05, 2025',
        invoice: 'INV-2025-002'
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
        invoice: 'INV-2025-003'
    }
];

export function ParentFees() {
    const { t } = useTranslation();

    const handleDownload = (invoice: string) => {
        toast.success(`${t.parent.fees.downloadingReceipt} ${invoice}...`);
    };

    return (
        <ParentLayout>
            <PageHeader
                title={t.parent.fees.title}
                subtitle={t.parent.fees.subtitle}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
                <div className="p-4 sm:p-6 rounded-xl bg-white border border-border shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-primary/10 text-primary">
                            <CreditCard className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">{t.parent.fees.totalDue}</p>
                            <h3 className="text-2xl font-bold">₹ 45,000</h3>
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
                            <h3 className="text-2xl font-bold">₹ 88,000</h3>
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
                            </tr>
                        </thead>
                        <tbody>
                            {feesData.map((item) => (
                                <tr key={item.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                                    <td className="py-3 px-4 text-sm font-medium">{item.student}</td>
                                    <td className="py-3 px-4 text-sm">{item.type}</td>
                                    <td className="py-3 px-4 text-sm font-semibold">{item.amount}</td>
                                    <td className="py-3 px-4 text-sm text-muted-foreground">{item.dueDate}</td>
                                    <td className="py-3 px-4">
                                        <Badge variant={item.status === 'paid' ? 'success' : 'warning'} className="capitalize">
                                            {item.status}
                                        </Badge>
                                    </td>
                                    <td className="py-3 px-4">
                                        {item.status === 'paid' ? (
                                            <Button variant="ghost" size="sm" onClick={() => handleDownload(item.invoice)}>
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
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </ParentLayout>
    );
}
