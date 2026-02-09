import React from 'react';
import { School, Send, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/common/Badge';

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
    const invoiceNo = `INV-${Math.floor(Math.random() * 100000).toString().padStart(6, '0')}`;
    const invoiceDate = new Date().toLocaleDateString('en-GB');

    return (
        <div className="flex flex-col h-full max-h-[90vh]">
            {/* Header / Branding */}
            <div className="bg-slate-900 text-white p-8">
                <div className="flex justify-between items-start">
                    <div className="flex gap-4 items-center">
                        {institution?.logo_url ? (
                            <div className="w-16 h-16 bg-white rounded-xl p-1 flex items-center justify-center overflow-hidden">
                                <img src={institution.logo_url} alt="Logo" className="w-full h-full object-contain" />
                            </div>
                        ) : (
                            <div className="w-16 h-16 bg-primary/20 rounded-xl flex items-center justify-center">
                                <School className="w-10 h-10 text-white" />
                            </div>
                        )}
                        <div>
                            <h2 className="text-xl font-bold tracking-tight">{institution?.name || 'Institution'}</h2>
                            <p className="text-xs text-slate-400 max-w-[200px] leading-tight mt-1">
                                {institution?.address}, {institution?.city}<br />
                                {institution?.email} | {institution?.phone}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h1 className="text-3xl font-black uppercase tracking-tighter text-blue-500">Invoice</h1>
                        <p className="text-xs text-slate-400 mt-1 uppercase">NO: {invoiceNo}</p>
                        <p className="text-xs text-slate-400 uppercase">DATE: {invoiceDate}</p>
                    </div>
                </div>
            </div>

            <div className="p-8 flex-1 overflow-y-auto">
                {/* Bill To */}
                <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                        <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-3">Bill To Student</h4>
                        <div className="space-y-1">
                            <p className="font-bold text-lg leading-none">{student.name}</p>
                            <p className="text-sm text-slate-600">Roll No: {student.rollNo}</p>
                            <p className="text-sm text-slate-600">{classInfo.className} - Section {classInfo.section}</p>
                            <p className="text-xs text-slate-500 mt-2">{student.address}</p>
                        </div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 shadow-sm">
                        <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-3 text-right">Payment Summary</h4>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600">Total Amount</span>
                                <span className="font-bold">₹{student.fees.total.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600">Amount Paid</span>
                                <span className="font-bold text-green-600">₹{student.fees.paid.toLocaleString()}</span>
                            </div>
                            <div className="border-t border-slate-200 my-2"></div>
                            <div className="flex justify-between text-base">
                                <span className="font-bold">Outstanding</span>
                                <span className="font-bold text-red-600">₹{student.fees.pending.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Detailed Items */}
                <div className="mb-8 overflow-hidden rounded-xl border border-slate-100">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-500">
                                <th className="text-left py-4 px-4">Description</th>
                                <th className="text-right py-4 px-4">Amount Due</th>
                                <th className="text-right py-4 px-4">Amount Paid</th>
                                <th className="text-right py-4 px-4">Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {student.fees.structure && student.fees.structure.map((f: any, idx: number) => (
                                <tr key={idx} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                                    <td className="py-4 px-4 font-medium">{f.category || f.title}</td>
                                    <td className="py-4 px-4 text-right font-medium">₹{f.amount.toLocaleString()}</td>
                                    <td className="py-4 px-4 text-right text-green-600">₹{(f.paid || 0).toLocaleString()}</td>
                                    <td className="py-4 px-4 text-right text-red-600 font-bold">₹{(f.amount - (f.paid || 0)).toLocaleString()}</td>
                                </tr>
                            ))}
                            {(!student.fees.structure || student.fees.structure.length === 0) && (
                                <tr>
                                    <td colSpan={4} className="py-8 text-center text-slate-400 italic">No fee breakdown available</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer / Signature */}
                <div className="mt-12 flex justify-between items-end border-t pt-8 border-slate-100">
                    <div>
                        <p className="text-[10px] text-slate-400 mb-6 max-w-[340px] leading-relaxed">
                            This is a computer-generated invoice and doesn't require a physical signature.
                            VidyOn ERP • Empowering Institutions Everywhere
                        </p>
                        <div className="flex items-center gap-2 opacity-30 grayscale hover:opacity-100 transition-opacity">
                            <School className="w-5 h-5" />
                            <span className="text-sm font-black tracking-tighter uppercase">VidyOn</span>
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="w-40 h-px bg-slate-200 mb-2 mx-auto"></div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Authorized Signatory</p>
                    </div>
                </div>
            </div>

            {/* Print Button Wrapper */}
            <div className="p-6 bg-slate-50 border-t flex gap-4">
                <Button variant="ghost" className="flex-1 h-12 text-slate-600" onClick={onClose}>Close View</Button>
                {onDownload && (
                    <Button className="flex-1 h-12 gap-2 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200" onClick={onDownload}>
                        {isParentView ? <Download className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                        {isParentView ? 'Download Receipt' : 'Send Invoice'}
                    </Button>
                )}
            </div>
        </div>
    );
};
