import { useState } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/common/Badge';
import { CheckCircle, XCircle, FileText, Clock, User } from 'lucide-react';

export function AdminApprovals() {
    const [leaveRequests, setLeaveRequests] = useState([
        { id: 1, name: 'Mr. Rajesh Kumar', role: 'Teacher', type: 'Sick Leave', dates: '24 Oct - 25 Oct', reason: 'High fever', status: 'Pending' },
        { id: 2, name: 'Anita Singh', role: 'Student (10-A)', type: 'Medical Leave', dates: '24 Oct', reason: 'Dental appointment', status: 'Pending' },
    ]);

    const handleAction = (id: number, action: 'Approved' | 'Rejected') => {
        setLeaveRequests(leaveRequests.map(req => req.id === id ? { ...req, status: action } : req));
    };

    return (
        <AdminLayout>
            <PageHeader
                title="Approvals & Requests"
                subtitle="Manage Leaves, Marks Entry, and Administrative Requests"
            />

            <Tabs defaultValue="leaves" className="w-full">
                <TabsList className="grid w-full grid-cols-3 lg:w-[600px] mb-6">
                    <TabsTrigger value="leaves">Leave Requests</TabsTrigger>
                    <TabsTrigger value="marks">Marks Entry</TabsTrigger>
                    <TabsTrigger value="bonafide">Bonafide / Certificates</TabsTrigger>
                </TabsList>

                {/* Leave Requests */}
                <TabsContent value="leaves">
                    <div className="space-y-4">
                        {leaveRequests.length === 0 && <p className="text-center text-muted-foreground py-10">No pending leave requests.</p>}
                        {leaveRequests.map((req) => (
                            <div key={req.id} className="dashboard-card p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center text-warning shrink-0">
                                        <Clock className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold">{req.name} <span className="text-xs font-normal text-muted-foreground">({req.role})</span></h4>
                                        <p className="text-sm font-medium">{req.type} • {req.dates}</p>
                                        <p className="text-xs text-muted-foreground mt-1">Reason: {req.reason}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                    {req.status === 'Pending' ? (
                                        <>
                                            <Button variant="outline" className="flex-1 sm:flex-none border-success text-success hover:bg-success/10" onClick={() => handleAction(req.id, 'Approved')}>
                                                <CheckCircle className="w-4 h-4 mr-2" /> Approve
                                            </Button>
                                            <Button variant="outline" className="flex-1 sm:flex-none border-destructive text-destructive hover:bg-destructive/10" onClick={() => handleAction(req.id, 'Rejected')}>
                                                <XCircle className="w-4 h-4 mr-2" /> Reject
                                            </Button>
                                        </>
                                    ) : (
                                        <Badge variant={req.status === 'Approved' ? 'success' : 'destructive'}>{req.status}</Badge>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </TabsContent>

                {/* Marks Entry */}
                <TabsContent value="marks">
                    <div className="dashboard-card p-6 text-center">
                        <div className="flex flex-col items-center justify-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                                <FileText className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <h3 className="font-semibold text-lg">No Pending Marks Approvals</h3>
                            <p className="text-muted-foreground text-sm max-w-sm">All marks entered by faculty have been verified and published. New submissions will appear here.</p>
                        </div>
                    </div>
                </TabsContent>

                {/* Bonafide */}
                <TabsContent value="bonafide">
                    <div className="dashboard-card p-4">
                        <div className="flex justify-between items-center border-b border-border pb-4 mb-4">
                            <div className="flex gap-3 items-center">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                    <User className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold">Rahul Verma (Grade 12)</h4>
                                    <p className="text-xs text-muted-foreground">Bonafide Certificate Request</p>
                                </div>
                            </div>
                            <Button size="sm">Generate & Sign</Button>
                        </div>
                        <div className="flex justify-between items-center">
                            <div className="flex gap-3 items-center">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                    <User className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold">Sneha Gupta (Grade 10)</h4>
                                    <p className="text-xs text-muted-foreground">Transfer Certificate (TC) Application</p>
                                </div>
                            </div>
                            <Button size="sm" variant="outline">View Details</Button>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </AdminLayout>
    );
}
