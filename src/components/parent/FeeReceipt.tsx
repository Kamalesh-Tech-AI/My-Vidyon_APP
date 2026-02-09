import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, Download, X, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export interface FeeReceiptData {
    id: number;
    student: string;
    type: string;
    amount: string;
    dueDate: string;
    status: string;
    paymentDate?: string;
    invoice: string;
    transactionId?: string;
    institutionName?: string;
    institutionAddress?: string;
    institutionPhone?: string;
    institutionEmail?: string;
}

interface FeeReceiptProps {
    data: FeeReceiptData;
    onClose?: () => void;
}

export function FeeReceipt({ data, onClose }: FeeReceiptProps) {
    const [isDownloading, setIsDownloading] = useState(false);

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPDF = async () => {
        setIsDownloading(true);
        try {
            // Get the receipt container element
            const receiptElement = document.getElementById('receipt-content');
            if (!receiptElement) {
                console.error('Receipt element not found');
                return;
            }

            // Hide action buttons temporarily
            const actionButtons = document.getElementById('action-buttons');
            if (actionButtons) {
                actionButtons.style.display = 'none';
            }

            // Capture the receipt as canvas
            const canvas = await html2canvas(receiptElement, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            // Show action buttons again
            if (actionButtons) {
                actionButtons.style.display = '';
            }

            // Calculate PDF dimensions
            const imgWidth = 210; // A4 width in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            // Create PDF
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgData = canvas.toDataURL('image/png');
            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

            // Download PDF with proper filename
            const filename = `Receipt_${data.invoice}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
            pdf.save(filename);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-white overflow-y-auto" style={{ scrollBehavior: 'smooth' }}>
            {/* Safe Area Spacer for Status Bar - White background with padding */}
            <div className="h-14 w-full bg-white shrink-0 border-b border-gray-100"></div>

            {/* Close Button - Positioned below notification bar */}
            <div className="fixed top-16 right-3 z-50 print:hidden">
                {onClose && (
                    <button
                        onClick={onClose}
                        className="w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center hover:bg-gray-50 transition-all duration-200 border border-gray-200"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5 text-gray-700" />
                    </button>
                )}
            </div>

            {/* Scrollable Content */}
            <div id="receipt-content" className="px-3 sm:px-4 md:px-6 lg:px-8 pb-24 max-w-4xl mx-auto bg-gray-50">
                {/* Receipt Container */}
                <div className="bg-white shadow-lg rounded-lg overflow-hidden print:shadow-none mb-6">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-4 sm:p-6 md:p-8">
                        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                            <div className="w-full sm:flex-1">
                                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                                        <span className="text-xl sm:text-2xl font-bold text-primary">V</span>
                                    </div>
                                    <div className="min-w-0">
                                        <h1 className="text-lg sm:text-2xl md:text-3xl font-bold truncate">
                                            {data.institutionName || 'Vidyon School'}
                                        </h1>
                                        <p className="text-xs sm:text-sm text-white/90">Educational Institution</p>
                                    </div>
                                </div>
                                <div className="text-xs sm:text-sm text-white/90 mt-2 sm:mt-3 space-y-1">
                                    <p className="break-words">{data.institutionAddress || '123 Education Street, City, State - 123456'}</p>
                                    <p>Phone: {data.institutionPhone || '+91 1234567890'}</p>
                                    <p className="break-all">Email: {data.institutionEmail || 'info@vidyon.edu'}</p>
                                </div>
                            </div>
                            <div className="w-full sm:w-auto text-left sm:text-right">
                                <div className="bg-white/20 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-lg inline-block">
                                    <p className="text-xs text-white/80">Receipt No.</p>
                                    <p className="text-base sm:text-lg font-bold break-all">{data.invoice}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Receipt Title */}
                    <div className="bg-gray-50 border-b border-gray-200 px-4 sm:px-6 md:px-8 py-3 sm:py-4">
                        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-center text-gray-800">
                            PAYMENT RECEIPT
                        </h2>
                        <p className="text-center text-xs sm:text-sm text-gray-600 mt-1">
                            This is an official receipt for fee payment
                        </p>
                    </div>

                    {/* Receipt Details */}
                    <div className="p-4 sm:p-6 md:p-8">
                        {/* Student & Payment Info Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                            {/* Left Column */}
                            <div className="space-y-3 sm:space-y-4">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Student Name</p>
                                    <p className="text-sm sm:text-base font-semibold text-gray-900 break-words">{data.student}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Fee Type</p>
                                    <p className="text-sm sm:text-base font-semibold text-gray-900 break-words">{data.type}</p>
                                </div>
                                {data.transactionId && (
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Transaction ID</p>
                                        <p className="text-sm sm:text-base font-mono text-gray-900 break-all">{data.transactionId}</p>
                                    </div>
                                )}
                            </div>

                            {/* Right Column */}
                            <div className="space-y-3 sm:space-y-4">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Payment Date</p>
                                    <p className="text-sm sm:text-base font-semibold text-gray-900">
                                        {data.paymentDate || format(new Date(), 'MMM dd, yyyy')}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Due Date</p>
                                    <p className="text-sm sm:text-base font-semibold text-gray-900">{data.dueDate}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Payment Status</p>
                                    <span className="inline-block px-2 sm:px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs sm:text-sm font-semibold">
                                        {data.status.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Amount Section */}
                        <div className="border-t border-b border-gray-200 py-4 sm:py-6 mb-4 sm:mb-6">
                            <div className="flex justify-between items-center mb-3 sm:mb-4">
                                <span className="text-sm sm:text-base text-gray-700 font-medium">Fee Amount:</span>
                                <span className="text-xl sm:text-2xl font-bold text-gray-900">{data.amount}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm sm:text-base text-gray-700 font-medium">Amount Paid:</span>
                                <span className="text-xl sm:text-2xl font-bold text-green-600">{data.amount}</span>
                            </div>
                        </div>

                        {/* Footer Notes */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                            <p className="text-xs sm:text-sm text-blue-900">
                                <strong>Note:</strong> This is a computer-generated receipt and does not require a signature.
                                Please keep this receipt for your records. For any queries, please contact the accounts department.
                            </p>
                        </div>

                        {/* Signature Section */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 mt-8 sm:mt-12 mb-6 sm:mb-8">
                            <div className="text-center">
                                <div className="border-t border-gray-400 pt-2 inline-block min-w-[150px] sm:min-w-[200px]">
                                    <p className="text-xs sm:text-sm text-gray-600">Received By</p>
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="border-t border-gray-400 pt-2 inline-block min-w-[150px] sm:min-w-[200px]">
                                    <p className="text-xs sm:text-sm text-gray-600">Authorized Signature</p>
                                </div>
                            </div>
                        </div>

                        {/* My Vidyon Watermark */}
                        <div className="flex flex-col items-center justify-center gap-1 pt-6 border-t border-gray-200 opacity-70">
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Powered by</p>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                    <span className="text-lg font-bold text-primary">V</span>
                                </div>
                                <span className="text-xl font-bold text-primary tracking-tight">My Vidyon</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer - Date */}
                    <div className="bg-gray-100 px-4 sm:px-6 md:px-8 py-3 sm:py-4 text-center text-xs text-gray-600">
                        <p className="break-words">Generated on {format(new Date(), 'MMMM dd, yyyy \'at\' hh:mm a')}</p>
                        <p className="mt-1">Thank you for your payment!</p>
                    </div>
                </div>

                {/* Action Buttons - Below Receipt */}
                <div id="action-buttons" className="flex flex-col sm:flex-row gap-3 sm:gap-4 print:hidden">
                    <Button
                        onClick={handlePrint}
                        className="flex-1 flex items-center justify-center gap-3 bg-white border-2 border-primary text-primary hover:bg-primary/5 min-h-[56px] text-base sm:text-lg font-semibold shadow-sm rounded-xl"
                    >
                        <Printer className="w-5 h-5 sm:w-6 sm:h-6" />
                        Print Receipt
                    </Button>
                    <Button
                        onClick={handleDownloadPDF}
                        disabled={isDownloading}
                        className="flex-1 flex items-center justify-center gap-3 bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed min-h-[56px] text-base sm:text-lg font-semibold shadow-lg shadow-primary/20 rounded-xl"
                    >
                        {isDownloading ? (
                            <>
                                <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                                Generating PDF...
                            </>
                        ) : (
                            <>
                                <Download className="w-5 h-5 sm:w-6 sm:h-6" />
                                Download PDF
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    body {
                        margin: 0;
                        padding: 0;
                        background: white;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                    .print\\:shadow-none {
                        box-shadow: none !important;
                    }
                    @page {
                        margin: 0.5cm;
                    }
                }
                
                /* Smooth scrolling */
                html {
                    scroll-behavior: smooth;
                }
                
                /* Ensure white background */
                body {
                    background-color: #f9fafb;
                }
            `}</style>
        </div>
    );
}
