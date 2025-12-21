import { useState } from 'react';
import { FacultyLayout } from '@/layouts/FacultyLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/common/Badge';
import { DataTable } from '@/components/common/DataTable';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Plus, Clock, CheckCircle, Loader2 } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';

const initialLeaveRequests = [
    { id: 1, type: 'Sick Leave', startDate: 'Dec 10, 2025', endDate: 'Dec 11, 2025', reason: 'Fever and flu', status: 'approved' },
    { id: 2, type: 'Casual Leave', startDate: 'Dec 24, 2025', endDate: 'Dec 24, 2025', reason: 'Personal work', status: 'pending' },
    { id: 3, type: 'Medical Leave', startDate: 'Oct 05, 2025', endDate: 'Oct 07, 2025', reason: 'Annual checkup', status: 'approved' },
];

export function FacultyLeave() {
    const [leaveRequests, setLeaveRequests] = useState(initialLeaveRequests);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        type: '',
        startDate: '',
        endDate: '',
        reason: ''
    });

    const handleApplyLeave = () => {
        setIsSubmitting(true);
        setTimeout(() => {
            const newRequest = {
                id: leaveRequests.length + 1,
                type: formData.type,
                startDate: new Date(formData.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                endDate: new Date(formData.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                reason: formData.reason,
                status: 'pending'
            };

            setLeaveRequests([newRequest, ...leaveRequests]);
            setIsSubmitting(false);
            setIsDialogOpen(false);
            setFormData({ name: '', type: '', startDate: '', endDate: '', reason: '' });
            toast.success("Leave application submitted successfully");
        }, 1500);
    };

    const columns = [
        { key: 'type', header: 'Leave Type' },
        { key: 'startDate', header: 'Start Date' },
        { key: 'endDate', header: 'End Date' },
        { key: 'reason', header: 'Reason' },
        {
            key: 'status',
            header: 'Status',
            render: (item: typeof leaveRequests[0]) => (
                <Badge variant={
                    item.status === 'approved' ? 'success' :
                        item.status === 'pending' ? 'warning' : 'destructive'
                }>
                    {item.status.toUpperCase()}
                </Badge>
            )
        }
    ];

    return (
        <FacultyLayout>
            <PageHeader
                title="Leave Requests"
                subtitle="Apply for and track your leave applications"
                actions={
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="btn-primary flex items-center gap-2">
                                <Plus className="w-4 h-4" />
                                Apply for Leave
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Apply for Leave</DialogTitle>
                                <DialogDescription>
                                    Submit a new leave request for approval.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="e.g. Dr. John Doe"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="type">Leave Type</Label>
                                    <Select
                                        value={formData.type}
                                        onValueChange={(value) => setFormData({ ...formData, type: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Sick Leave">Sick Leave</SelectItem>
                                            <SelectItem value="Casual Leave">Casual Leave</SelectItem>
                                            <SelectItem value="Medical Leave">Medical Leave</SelectItem>
                                            <SelectItem value="Unpaid Leave">Unpaid Leave</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="startDate">From Date</Label>
                                        <Input
                                            id="startDate"
                                            type="date"
                                            value={formData.startDate}
                                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="endDate">To Date</Label>
                                        <Input
                                            id="endDate"
                                            type="date"
                                            value={formData.endDate}
                                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="reason">Reason</Label>
                                    <Textarea
                                        id="reason"
                                        placeholder="Briefly explain the reason for leave..."
                                        value={formData.reason}
                                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    type="submit"
                                    onClick={handleApplyLeave}
                                    disabled={!formData.name || !formData.type || !formData.startDate || !formData.endDate || !formData.reason || isSubmitting}
                                >
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Submit Request
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="dashboard-card border-l-4 border-primary">
                    <div className="flex items-center gap-3 mb-2">
                        <Calendar className="w-5 h-5 text-primary" />
                        <h4 className="font-medium">Total Balance</h4>
                    </div>
                    <p className="text-2xl font-bold">12 Days</p>
                </div>
                <div className="dashboard-card border-l-4 border-success">
                    <div className="flex items-center gap-3 mb-2">
                        <CheckCircle className="w-5 h-5 text-success" />
                        <h4 className="font-medium">Approved</h4>
                    </div>
                    <p className="text-2xl font-bold">
                        {leaveRequests.filter(l => l.status === 'approved').length} Days
                    </p>
                </div>
                <div className="dashboard-card border-l-4 border-warning">
                    <div className="flex items-center gap-3 mb-2">
                        <Clock className="w-5 h-5 text-warning" />
                        <h4 className="font-medium">Pending</h4>
                    </div>
                    <p className="text-2xl font-bold">
                        {leaveRequests.filter(l => l.status === 'pending').length} Day
                    </p>
                </div>
            </div>

            <div className="dashboard-card">
                <h3 className="font-semibold mb-6">Leave History</h3>
                <DataTable columns={columns} data={leaveRequests} />
            </div>
        </FacultyLayout>
    );
}
