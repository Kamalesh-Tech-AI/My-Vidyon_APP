import React, { useRef, useState } from 'react';
import { School, Send, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/common/Badge';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface InvoiceViewProps {
    student: {
        name: string;
        rollNo: string;
        address?: string;
        fees: {
            total: number;
            paid: number;
            pending: number;
            structure: any[];
        };
    };
    institution: {
        name: string;
        logo_url?: string;
        address?: string;
        city?: string;
        email?: string;
        phone?: string;
    };
    classInfo: {
        className: string;
        section: string;
    };
    onDownload?: () => void;
    onClose: () => void;
    isParentView?: boolean;
}

export const InvoiceView: React.FC<InvoiceViewProps> = ({
    student,
    institution,
    classInfo,
    onDownload,
    onClose,
    isParentView = false
}) => {
    const invoiceRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const invoiceNo = `INV-${Math.floor(Math.random() * 100000).toString().padStart(6, '0')}`;
    const invoiceDate = new Date().toLocaleDateString('en-GB');

    const handleDownloadPDF = async () => {
        if (!invoiceRef.current) return;

        setIsGenerating(true);

        try {
            // Wait a bit for any rendering to complete
            await new Promise(resolve => setTimeout(resolve, 100));

            // Capture the invoice as image with minimal memory usage
            const canvas = await html2canvas(invoiceRef.current, {
                scale: 1.0, // Minimum scale to prevent GPU crashes on mobile
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                imageTimeout: 0,
                removeContainer: true,
                allowTaint: false
            });

            // Create PDF
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const imgWidth = 210; // A4 width in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

            // Generate filename
            const filename = `Receipt_${student.name.replace(/\s+/g, '_')}_${invoiceNo}.pdf`;

            // Trigger download
            pdf.save(filename);

            // Call callback if provided
            if (onDownload) {
                onDownload();
            }
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="flex flex-col h-full lg:max-h-[85vh]">
            {/* Invoice Content */}
            <div ref={invoiceRef} className="flex-1 overflow-y-auto bg-white">
                {/* Header / Branding - Responsive */}
                <div className="bg-slate-900 text-white p-4 sm:p-6 md:p-10">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div className="flex gap-3 sm:gap-4 items-center">
                            {institution?.logo_url ? (
                                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-xl p-1 flex items-center justify-center overflow-hidden flex-shrink-0">
                                    <img src={institution.logo_url} alt="Logo" className="w-full h-full object-contain" />
                                </div>
                            ) : (
                                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <School className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                                </div>
                            )}
                            <div className="min-w-0">
                                <h2 className="text-base sm:text-xl font-bold tracking-tight truncate">{institution?.name || 'Institution'}</h2>
                                <p className="text-[10px] sm:text-xs text-slate-400 leading-tight mt-1 line-clamp-2">
                                    {institution?.address}, {institution?.city}<br />
                                    {institution?.email} | {institution?.phone}
                                </p>
                            </div>
                        </div>
                        <div className="text-left sm:text-right">
                            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter text-blue-500">Invoice</h1>
                            <p className="text-[10px] sm:text-xs text-slate-400 mt-1 uppercase">NO: {invoiceNo}</p>
                            <p className="text-[10px] sm:text-xs text-slate-400 uppercase">DATE: {invoiceDate}</p>
                        </div>
                    </div>
                </div>

                <div className="p-4 sm:p-6 md:p-10 space-y-4 sm:space-y-6 md:space-y-8">
                    {/* Bill To - Responsive Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-6 sm:mb-8">
                        <div>
                            <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-2 sm:mb-3">Bill To Student</h4>
                            <div className="space-y-1">
                                <p className="font-bold text-base sm:text-lg leading-none">{student.name}</p>
                                <p className="text-sm text-slate-600">Roll No: {student.rollNo}</p>
                                <p className="text-sm text-slate-600">{classInfo.className} - Section {classInfo.section}</p>
                                {student.address && <p className="text-xs text-slate-500 mt-2">{student.address}</p>}
                            </div>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-4 sm:p-5 border border-slate-100 shadow-sm">
                            <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-2 sm:mb-3 text-right">Payment Summary</h4>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-xs sm:text-sm gap-2">
                                    <span className="text-slate-600 whitespace-nowrap">Total</span>
                                    <span className="font-bold break-all text-right">₹{student.fees.total.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs sm:text-sm gap-2">
                                    <span className="text-slate-600 whitespace-nowrap">Amount Paid</span>
                                    <span className="font-bold text-green-600 break-all text-right">₹{student.fees.paid.toLocaleString()}</span>
                                </div>
                                <div className="border-t border-slate-200 my-2"></div>
                                <div className="flex justify-between items-center text-sm sm:text-base gap-2">
                                    <span className="font-bold whitespace-nowrap">Outstanding</span>
                                    <span className="font-bold text-red-600 break-all text-right">₹{student.fees.pending.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Detailed Items - Mobile Card Layout */}
                    <div className="mb-6 sm:mb-8 space-y-3">
                        <h4 className="text-xs uppercase font-bold text-slate-400 tracking-widest mb-3">Fee Breakdown</h4>
                        {student.fees.structure && student.fees.structure.map((f: any, idx: number) => (
                            <div key={idx} className="p-4 md:p-6 rounded-lg border border-slate-100 bg-white hover:bg-slate-50/50 transition-colors">
                                <div className="font-semibold text-sm md:text-base mb-3 text-slate-900">{f.category || f.title}</div>
                                <div className="grid grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm">
                                    <div>
                                        <div className="text-slate-500 mb-1">Amount Due</div>
                                        <div className="font-bold">₹{f.amount.toLocaleString()}</div>
                                    </div>
                                    <div>
                                        <div className="text-slate-500 mb-1">Paid</div>
                                        <div className="font-bold text-green-600">₹{(f.paid || 0).toLocaleString()}</div>
                                    </div>
                                    <div>
                                        <div className="text-slate-500 mb-1">Balance</div>
                                        <div className="font-bold text-red-600">₹{(f.amount - (f.paid || 0)).toLocaleString()}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {(!student.fees.structure || student.fees.structure.length === 0) && (
                            <div className="p-8 text-center text-slate-400 italic text-sm border border-slate-100 rounded-lg">
                                No fee breakdown available
                            </div>
                        )}
                    </div>

                    {/* Footer / Signature */}
                    <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-t pt-6 sm:pt-8 border-slate-100">
                        <div>
                            <p className="text-[10px] text-slate-400 mb-4 sm:mb-6 max-w-[340px] leading-relaxed">
                                This is a computer-generated invoice and doesn't require a physical signature.
                                VidyOn ERP • Empowering Institutions Everywhere
                            </p>
                            <div className="flex items-center gap-2 opacity-30 grayscale hover:opacity-100 transition-opacity">
                                <School className="w-4 h-4 sm:w-5 sm:h-5" />
                                <span className="text-xs sm:text-sm font-black tracking-tighter uppercase">VidyOn</span>
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="w-32 sm:w-40 h-px bg-slate-200 mb-2 mx-auto"></div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Authorized Signatory</p>
                        </div>
                    </div>
                </div>
            </div >

            {/* Action Buttons - Sticky on mobile */}
            <div className="p-3 sm:p-4 md:p-6 bg-slate-50 border-t flex gap-2 sm:gap-4 sticky bottom-0 print:hidden">
                <Button
                    variant="ghost"
                    className="flex-1 h-11 sm:h-12 text-sm sm:text-base text-slate-600"
                    onClick={onClose}
                    disabled={isGenerating}
                >
                    Close View
                </Button>
                <Button
                    className="flex-1 h-11 sm:h-12 gap-2 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 text-sm sm:text-base"
                    onClick={handleDownloadPDF}
                    disabled={isGenerating}
                >
                    {isGenerating ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Generating...
                        </>
                    ) : (
                        <>
                            {isParentView ? <Download className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                            {isParentView ? 'Download Receipt' : 'Send Invoice'}
                        </>
                    )}
                </Button>
            </div >
        </div >
    );
};
