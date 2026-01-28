import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/common/Badge';
import { CheckCircle2, XCircle } from 'lucide-react';

interface AllSubjectMarksModalProps {
    isOpen: boolean;
    onClose: () => void;
    student: {
        id: string;
        name: string;
        register_number?: string;
        roll_number?: string;
    } | null;
    examResults: any[];
}

export function AllSubjectMarksModal({
    isOpen,
    onClose,
    student,
    examResults
}: AllSubjectMarksModalProps) {
    if (!student) return null;

    const studentResults = examResults.filter(r => r.student_id === student.id);
    const totalMarks = studentResults.reduce((sum, r) => sum + (r.total_marks || 0), 0);
    const maxMarks = studentResults.length * 100;
    const percentage = maxMarks > 0 ? ((totalMarks / maxMarks) * 100).toFixed(2) : '0.00';

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                    <DialogTitle>All Subject Marks</DialogTitle>
                    <DialogDescription>
                        Marks for {student.name} (Roll: {student.register_number || student.roll_number || 'N/A'})
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Student Info */}
                    <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
                        <div className="w-12 h-12 rounded-full bg-muted overflow-hidden">
                            <img
                                src={`https://api.dicebear.com/7.x/initials/svg?seed=${student.name}`}
                                alt={student.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold">{student.name}</p>
                            <p className="text-sm text-muted-foreground">
                                Roll: {student.register_number || student.roll_number || 'N/A'}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-primary">{percentage}%</p>
                            <p className="text-xs text-muted-foreground">
                                {totalMarks.toFixed(1)} / {maxMarks}
                            </p>
                        </div>
                    </div>

                    {/* Marks Table */}
                    {studentResults.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground">
                            <XCircle className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p>No marks have been entered for this student yet.</p>
                        </div>
                    ) : (
                        <div className="border rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead>Subject</TableHead>
                                        <TableHead className="text-center">Internal</TableHead>
                                        <TableHead className="text-center">External</TableHead>
                                        <TableHead className="text-center">Total</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {studentResults.map((result) => {
                                        const subjectName = result.subjects?.name || 'Unknown Subject';
                                        const isSubmitted = result.status === 'SUBMITTED' || result.status === 'APPROVED' || result.status === 'PUBLISHED';

                                        return (
                                            <TableRow key={result.id}>
                                                <TableCell className="font-medium">
                                                    {subjectName}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {result.internal_marks?.toFixed(1) || '0.0'} <span className="text-xs text-muted-foreground">/ 20</span>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {result.external_marks?.toFixed(1) || '0.0'} <span className="text-xs text-muted-foreground">/ 80</span>
                                                </TableCell>
                                                <TableCell className="text-center font-semibold">
                                                    {result.total_marks?.toFixed(1) || '0.0'} <span className="text-xs text-muted-foreground">/ 100</span>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge
                                                        variant={isSubmitted ? 'success' : 'default'}
                                                        className="text-[10px]"
                                                    >
                                                        {result.status || 'DRAFT'}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    {studentResults.length > 0 && (
                        <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-lg">
                            <span className="font-semibold">Overall Total:</span>
                            <div className="text-right">
                                <p className="text-xl font-bold text-primary">{totalMarks.toFixed(1)} / {maxMarks}</p>
                                <p className="text-sm text-muted-foreground">Percentage: {percentage}%</p>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button onClick={onClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
