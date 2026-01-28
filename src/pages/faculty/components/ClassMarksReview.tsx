import { Button } from '@/components/ui/button';
import { Badge } from '@/components/common/Badge';
import { Eye, CheckCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ClassMarksReviewProps {
    students: any[];
    examResults: any[];
    onCheckMarks: (student: any) => void;
    onPublishAll: () => void;
    isPublishing?: boolean;
}

export function ClassMarksReview({
    students,
    examResults,
    onCheckMarks,
    onPublishAll,
    isPublishing = false
}: ClassMarksReviewProps) {
    // Calculate completion status for each student
    const getStudentCompletionStatus = (studentId: string) => {
        const studentResults = examResults.filter(r => r.student_id === studentId);
        const submittedCount = studentResults.filter(r => r.status === 'SUBMITTED' || r.status === 'APPROVED' || r.status === 'PUBLISHED').length;
        const totalCount = studentResults.length;

        if (totalCount === 0) return { label: 'No Marks', variant: 'default' as const, count: `0/0` };
        if (submittedCount === 0) return { label: 'Pending', variant: 'default' as const, count: `0/${totalCount}` };
        if (submittedCount === totalCount) return { label: 'Complete', variant: 'success' as const, count: `${submittedCount}/${totalCount}` };
        return { label: 'Partial', variant: 'warning' as const, count: `${submittedCount}/${totalCount}` };
    };

    const allComplete = students.every(student => {
        const studentResults = examResults.filter(r => r.student_id === student.id);
        const submittedCount = studentResults.filter(r => r.status === 'SUBMITTED' || r.status === 'APPROVED' || r.status === 'PUBLISHED').length;
        return studentResults.length > 0 && submittedCount === studentResults.length;
    });

    if (students.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <p className="text-lg">No students found in your assigned class</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div>
                    <h3 className="font-semibold text-lg">Class Marks Review</h3>
                    <p className="text-sm text-muted-foreground">
                        Review and approve marks for all students before publishing results
                    </p>
                </div>
                <Button
                    size="lg"
                    onClick={onPublishAll}
                    disabled={!allComplete || isPublishing}
                    className="gap-2"
                >
                    {isPublishing ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Publishing...
                        </>
                    ) : (
                        <>
                            <CheckCircle className="w-4 h-4" />
                            Publish Results
                        </>
                    )}
                </Button>
            </div>

            {!allComplete && (
                <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg text-sm text-warning-foreground">
                    ⚠️ Some students have incomplete marks. All subject marks must be submitted before you can publish results.
                </div>
            )}

            {/* Students List */}
            <ScrollArea className="h-[calc(100vh-400px)]">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pr-4">
                    {students.map((student) => {
                        const status = getStudentCompletionStatus(student.id);
                        return (
                            <div
                                key={student.id}
                                className="group relative border rounded-xl p-5 hover:shadow-lg hover:border-primary/50 transition-all bg-card/50"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-muted overflow-hidden border-2 border-transparent group-hover:border-primary transition-colors">
                                            <img
                                                src={`https://api.dicebear.com/7.x/initials/svg?seed=${student.name}`}
                                                alt={student.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold group-hover:text-primary transition-colors">
                                                {student.name}
                                            </h3>
                                            <p className="text-xs text-muted-foreground">
                                                Roll: {student.register_number || student.roll_number || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <Badge variant={status.variant} className="uppercase text-[10px]">
                                            {status.label}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">{status.count}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        className="flex-1 gap-2 text-xs h-9"
                                        onClick={() => onCheckMarks(student)}
                                    >
                                        <Eye className="w-3.5 h-3.5" />
                                        Check Marks
                                    </Button>

                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-9 w-9 p-0"
                                        title="Status"
                                    >
                                        {status.variant === 'success' ? '✓' : '○'}
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </ScrollArea>
        </div>
    );
}
