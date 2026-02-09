import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FeeReceipt, FeeReceiptData } from '@/components/parent/FeeReceipt';
import { FeeReceiptSkeleton } from '@/components/parent/FeeReceiptSkeleton';

export function ParentFeeReceipt() {
    const { invoiceId } = useParams<{ invoiceId: string }>();
    const navigate = useNavigate();
    const [receiptData, setReceiptData] = useState<FeeReceiptData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Show skeleton for at least 300ms for better UX
        const minLoadTime = setTimeout(() => {
            // Try to get data from sessionStorage first
            const storedData = sessionStorage.getItem(`receipt_${invoiceId}`);

            if (storedData) {
                try {
                    const data = JSON.parse(storedData);
                    setReceiptData(data);
                } catch (error) {
                    console.error('Error parsing receipt data:', error);
                }
            }

            setLoading(false);
        }, 300);

        return () => clearTimeout(minLoadTime);
    }, [invoiceId]);

    const handleClose = () => {
        // Navigate back to fees page
        navigate('/parent/fees');
    };

    if (loading) {
        return <FeeReceiptSkeleton />;
    }

    if (!receiptData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center max-w-md mx-auto p-6">
                    <div className="bg-white rounded-lg shadow-lg p-8">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">⚠️</span>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Receipt Not Found</h2>
                        <p className="text-gray-600 mb-6">
                            Unable to load receipt data. Please try again from the fees page.
                        </p>
                        <button
                            onClick={handleClose}
                            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            Go Back to Fees
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <FeeReceipt data={receiptData} onClose={handleClose} />
    );
}
