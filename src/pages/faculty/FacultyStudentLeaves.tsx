import { useState, useEffect } from 'react';
import { FacultyLayout } from '@/layouts/FacultyLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Check, X, Eye, Calendar, User, FileText, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useWebSocketContext } from '@/context/WebSocketContext';

interface LeaveRequest {
    id: string;
    studentName: string;
    rollNo: string;
    class: string;
    reason: string;
    startDate: string;
    endDate: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    description: string;
    studentId: string;
    parentId: string;
}

export function FacultyStudentLeaves() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const { subscribeToTable } = useWebSocketContext();
    const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Fetch Student Leave Requests
    const { data: requests = [], isLoading } = useQuery({
        queryKey: ['faculty-student-leaves', user?.id],
        queryFn: async () => {
            if (!user?.id) return [];

            console.log('[Faculty Leave Debug] Faculty ID:', user.id);
            console.log('[Faculty Leave Debug] Fetching leaves assigned to this faculty');

            // Query leave requests assigned to this faculty member
            const { data: leaves, error } = await supabase
                .from('leave_requests')
                .select(`
                    *,
                    student_id (
                        id,
                        name,
                        register_number,
                        class_name,
                        section
                    )
                `)
                .eq('assigned_class_teacher_id', user.id)
                .order('created_at', { ascending: false });

            console.log('[Faculty Leave Debug] Leave requests fetched:', leaves?.length || 0);
            if (leaves && leaves.length > 0) {
                console.log('[Faculty Leave Debug] Sample leave request:', leaves[0]);
                console.log('[Faculty Leave Debug] All leave statuses:', leaves.map(l => ({ id: l.id, status: l.status, student_id: l.student_id })));
            }

            if (error) {
                console.error('[Faculty Leave Debug] Error fetching leaves:', error);
                throw error;
            }

            return (leaves || []).map(leave => {
                const student = leave.student_id as any;
                return {
                    id: leave.id,
                    studentName: student?.name || 'Unknown',
                    rollNo: student?.register_number || 'N/A',
                    class: `${student?.class_name || 'N/A'}-${student?.section || 'A'}`,
                    reason: leave.reason,
                    startDate: format(new Date(leave.from_date), 'MMM dd, yyyy'),
                    endDate: format(new Date(leave.to_date), 'MMM dd, yyyy'),
                    status: leave.status as any,
                    description: leave.reason,
                    studentId: leave.student_id,
                    parentId: leave.parent_id
                };
            });
        },
        enabled: !!user?.id
    });

    // Real-time Subscription
    useEffect(() => {
        if (!user?.id) return;

        // Subscribe to leave_requests to update list instantly
        const unsubscribe = subscribeToTable('leave_requests', (payload) => {
            console.log('Real-time student leave update:', payload);
            queryClient.invalidateQueries({ queryKey: ['faculty-student-leaves'] });

            if (payload.eventType === 'INSERT') {
                toast.info('New student leave request received');
            }
        });

        return () => {
            unsubscribe();
        };
    }, [user?.id, subscribeToTable, queryClient]);

    const handleAction = async (id: string, status: 'Approved' | 'Rejected') => {
        setProcessingId(id);
        try {
            const { error } = await supabase
                .from('leave_requests')
                .update({ status: status })
                .eq('id', id);

            if (error) throw error;

            toast.success(`Leave request ${status.toLowerCase()}`);

            // Invalidate to refresh list
            queryClient.invalidateQueries({ queryKey: ['faculty-student-leaves'] });

            // Also notify parent (optional, could be done via DB trigger or edge function)
            // Ideally we insert into notifications table for the parent.
            if (selectedRequest?.parentId) {
                // Fetch parent's user_id from parents table to send notification
                const { data: parentData } = await supabase
                    .from('parents')
                    .select('profile_id')
                    .eq('id', selectedRequest.parentId)
                    .single();

                if (parentData?.profile_id) {
                    await supabase
                        .from('notifications')
                        .insert({
                            user_id: parentData.profile_id,
                            title: `Leave Request ${status}`,
                            message: `Your leave request for ${selectedRequest.studentName} has been ${status.toLowerCase()}.`,
                            type: 'leave',
                            read: false
                        });
                }
            }

            setIsDetailsOpen(false);
        } catch (err: any) {
            console.error("Error updating leave:", err);
            toast.error("Failed to update leave request");
        } finally {
            setProcessingId(null);
        }
    };

    const openDetails = (request: LeaveRequest) => {
        setSelectedRequest(request);
        setIsDetailsOpen(true);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Approved': return <Badge variant="success">Approved</Badge>;
            case 'Rejected': return <Badge variant="destructive">Rejected</Badge>;
            default: return <Badge variant="warning">Pending</Badge>;
        }
    };

    // Search state
    const [searchQuery, setSearchQuery] = useState("");

    // Filter requests based on search query
    const filteredRequests = requests.filter(request =>
        request.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.rollNo.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // ... (rest of the component logic)

    return (
        <FacultyLayout>
            <PageHeader
                title="Student Leave Requests"
                subtitle="Manage leave requests from your students"
                actions={
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search students..."
                            className="pl-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                }
            />

            <Card className="p-6">
                {isLoading ? (
                    <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                ) : filteredRequests.length === 0 ? (
                    <div className="text-center p-8 text-muted-foreground">
                        {searchQuery ? "No students found matching your search." : "No pending leave requests found."}
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student</TableHead>
                                <TableHead>Class</TableHead>
                                <TableHead>Dates</TableHead>
                                <TableHead>Reason</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredRequests.map((request) => (
                                <TableRow key={request.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col">
                                            <span>{request.studentName}</span>
                                            <span className="text-xs text-muted-foreground">Roll: {request.rollNo}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{request.class}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-sm">
                                            <Calendar className="w-3 h-3 text-muted-foreground" />
                                            {request.startDate} - {request.endDate}
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-[200px] truncate">{request.reason}</TableCell>
                                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openDetails(request)}
                                            className="gap-2"
                                        >
                                            <Eye className="w-4 h-4" /> View
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </Card>

            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Leave Request Details</DialogTitle>
                        <DialogDescription>Review full details before approving or denying.</DialogDescription>
                    </DialogHeader>

                    {selectedRequest && (
                        <div className="space-y-4 py-4">
                            <div className="flex items-center gap-4 p-4 bg-muted/40 rounded-lg">
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                    <User className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold">{selectedRequest.studentName}</h4>
                                    <p className="text-sm text-muted-foreground">Class: {selectedRequest.class} | Roll: {selectedRequest.rollNo}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="col-span-2 space-y-1">
                                    <span className="text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" /> Duration</span>
                                    <p className="font-medium">{selectedRequest.startDate} — {selectedRequest.endDate}</p>
                                </div>
                                <div className="col-span-2 space-y-1 bg-muted/20 p-3 rounded-md">
                                    <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold flex items-center gap-2"><FileText className="w-3 h-3" /> Reason</span>
                                    <p className="text-sm mt-1">{selectedRequest.description}</p>
                                </div>
                            </div>

                            {selectedRequest.status === 'Pending' && (
                                <div className="flex gap-3 pt-4">
                                    <Button
                                        className="flex-1 bg-success hover:bg-success/90 text-white"
                                        onClick={() => handleAction(selectedRequest.id, 'Approved')}
                                        disabled={!!processingId}
                                    >
                                        {processingId === selectedRequest.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                                        Approve
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        className="flex-1"
                                        onClick={() => handleAction(selectedRequest.id, 'Rejected')}
                                        disabled={!!processingId}
                                    >
                                        {processingId === selectedRequest.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4 mr-2" />}
                                        Reject
                                    </Button>
                                </div>
                            )}

                            {selectedRequest.status !== 'Pending' && (
                                <div className="p-3 text-center bg-muted rounded-md text-sm font-medium">
                                    This request has already been {selectedRequest.status.toLowerCase()}.
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </FacultyLayout>
    );
}
