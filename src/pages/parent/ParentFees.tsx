import React from 'react';
import { ParentLayout } from '@/layouts/ParentLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/ui/button';
import { IndianRupee, CreditCard, CheckCircle, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '@/i18n/TranslationContext';
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
    };

    return (
        <ParentLayout>
            <PageHeader
                title={t.nav.fees}
                subtitle="View and manage fee payments"
            />

            <div className="m-4 space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="dashboard-card">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-primary/10 rounded-lg">
                                <IndianRupee className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Fees</p>
                                <p className="text-2xl font-bold">₹ 1,33,000</p>
                            </div>
                        </div>
                    </div>

                    <div className="dashboard-card">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Paid</p>
                                <p className="text-2xl font-bold text-green-600">₹ 88,000</p>
                            </div>
                        </div>
                    </div>

                    <div className="dashboard-card">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-orange-100 rounded-lg">
                                <CreditCard className="w-6 h-6 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Pending</p>
                                <p className="text-2xl font-bold text-orange-600">₹ 45,000</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Fee Records */}
                <div className="dashboard-card">
                    <h3 className="text-lg font-semibold mb-4">Fee Records</h3>
                    <div className="space-y-3">
                        {feesData.map((item) => (
                            <div
                                key={item.id}
                                className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-4"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-medium">{item.type}</h4>
                                        {item.status === 'paid' ? (
                                            <Badge variant="success">Paid</Badge>
                                        ) : (
                                            <Badge variant="warning">Pending</Badge>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {item.student} • Due: {item.dueDate}
                                    </p>
                                    {item.paymentDate && (
                                        <p className="text-sm text-muted-foreground">
                                            Paid on: {item.paymentDate}
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="text-xl font-bold">{item.amount}</p>
                                        {item.invoice && (
                                            <p className="text-xs text-muted-foreground">
                                                {item.invoice}
                                            </p>
                                        )}
                                    </div>

                                    {item.status === 'paid' && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleViewReceipt(item)}
                                        >
                                            <Receipt className="w-4 h-4 mr-2" />
                                            Receipt
                                        </Button>
                                    )}

                                    {item.status === 'pending' && (
                                        <Button size="sm">
                                            Pay Now
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Payment Instructions */}
                <div className="dashboard-card bg-primary/5 border-primary/20">
                    <h3 className="text-lg font-semibold mb-2">Payment Instructions</h3>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Payments can be made online or at the school office</li>
                        <li>Late payment charges may apply after the due date</li>
                        <li>Keep your transaction ID for future reference</li>
                        <li>Download receipts for your records</li>
                    </ul>
                </div>
            </div>
        </ParentLayout>
    );
}
