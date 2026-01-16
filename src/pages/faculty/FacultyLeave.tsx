import { useState, useEffect } from 'react';
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
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';

interface LeaveRequest extends Record<string, unknown> {
    id: string;
    type: string;
    startDate: string;
    endDate: string;
    reason: string;
    status: string;
}

export function FacultyLeave() {
    const { user } = useAuth();
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        type: '',
        startDate: '',
        endDate: '',
        reason: ''
    });

    // Fetch leave requests from Supabase
    useEffect(() => {
        if (!user?.id || !user?.institutionId) return;

        const fetchLeaveRequests = async () => {
            try {
                const { data, error } = await supabase
                    .from('staff_leaves')
                    .select('*')
                    .eq('staff_id', user.id)
                    .eq('institution_id', user.institutionId)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                if (data) {
                    const formattedLeaves: LeaveRequest[] = data.map((item: any) => ({
                        id: item.id,
                        type: item.leave_type,
                        startDate: format(new Date(item.start_date), 'MMM dd, yyyy'),
                        endDate: format(new Date(item.end_date), 'MMM dd, yyyy'),
                        reason: item.reason || 'No reason provided',
                        status: item.status
                    }));
                    setLeaveRequests(formattedLeaves);
                }
            } catch (err: any) {
                console.error("Error fetching leave requests:", err);
                toast.error("Failed to load leave requests");
            } finally {
                setLoading(false);
            }
        };

        fetchLeaveRequests();

        // Subscribe to real-time updates
        const channel = supabase
            .channel('staff_leaves_changes')
            .on('postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'staff_leaves',
                    filter: `staff_id=eq.${user.id}`
                },
                () => {
                    fetchLeaveRequests();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.id, user?.institutionId]);

    const handleApplyLeave = async () => {
        if (!user?.id || !user?.institutionId) {
            toast.error("User information not available");
            return;
        }

        setIsSubmitting(true);

        try {
            const { error } = await supabase
                .from('staff_leaves')
                .insert({
                    institution_id: user.institutionId,
                    staff_id: user.id,
                    leave_type: formData.type,
                    start_date: formData.startDate,
                    end_date: formData.endDate,
                    reason: formData.reason,
                    status: 'pending'
                });

            if (error) throw error;

            toast.success("Leave application submitted successfully");
            setIsDialogOpen(false);
            setFormData({ type: '', startDate: '', endDate: '', reason: '' });
        } catch (err: any) {
            console.error("Error submitting leave request:", err);
            toast.error("Failed to submit leave request");
        } finally {
            setIsSubmitting(false);
        }
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
                                    disabled={!formData.type || !formData.startDate || !formData.endDate || !formData.reason || isSubmitting}
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
                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <DataTable
                        columns={columns}
                        data={leaveRequests}
                        emptyMessage="No leave requests found. Click 'Apply for Leave' to submit your first request."
                    />
                )}
            </div>
        </FacultyLayout>
    );
}
