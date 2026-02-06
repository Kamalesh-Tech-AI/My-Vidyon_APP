import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, BookOpen, FileText, Download, X, Pencil, Trash2 } from 'lucide-react';
import type { ExamEntry } from './ManualEntryForm';

interface ExamScheduleData {
    id: string;
    exam_type: string;
    exam_display_name: string;
    class_id: string;
    section: string;
    academic_year: string;
    entries: ExamEntry[];
}

interface ExamSchedulePreviewProps {
    schedule: ExamScheduleData;
    onClose?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    onDownload?: () => void;
    showActions?: boolean;
}

export function ExamSchedulePreview({
    schedule,
    onClose,
    onEdit,
    onDelete,
    onDownload,
    showActions = true
}: ExamSchedulePreviewProps) {
    // Sort entries by date
    const sortedEntries = [...schedule.entries].sort((a, b) =>
        new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime()
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        <h2 className="text-xl font-semibold">{schedule.exam_display_name} Examination Schedule</h2>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Class {schedule.class_id} {schedule.section} • Academic Year {schedule.academic_year}
                    </p>
                </div>
                {onClose && (
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <X className="w-4 h-4" />
                    </Button>
                )}
            </div>

            {/* Desktop View (Table) */}
            <div className="hidden sm:block border rounded-lg overflow-hidden bg-white">
                <div className="table-responsive-wrapper">
                    <table className="w-full">
                        <thead className="bg-muted border-b text-muted-foreground">
                            <tr>
                                <th className="text-left p-4 font-semibold text-xs uppercase tracking-wider">DATE & DAY</th>
                                <th className="text-left p-4 font-semibold text-xs uppercase tracking-wider">TIME</th>
                                <th className="text-left p-4 font-semibold text-xs uppercase tracking-wider">SUBJECT</th>
                                <th className="text-left p-4 font-semibold text-xs uppercase tracking-wider">SYLLABUS / NOTES</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border bg-white">
                            {sortedEntries.map((entry, index) => (
                                <tr key={entry.id} className="hover:bg-muted/50 transition-colors">
                                    <td className="p-4">
                                        <div className="space-y-1">
                                            <p className="font-medium text-sm">
                                                {format(new Date(entry.exam_date), 'dd MMM yyyy')}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {entry.day_of_week}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2 text-xs">
                                            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                            <span>
                                                {entry.start_time} - {entry.end_time}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-4 min-w-[150px]">
                                        <span className="font-medium text-primary text-sm">
                                            {entry.subject}
                                        </span>
                                    </td>
                                    <td className="p-4 min-w-[200px]">
                                        <div className="flex items-start gap-2">
                                            <BookOpen className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                                            <span className="text-xs text-muted-foreground whitespace-normal">
                                                {entry.syllabus_notes || 'No notes provided'}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile View (Card Stack) */}
            <div className="block sm:hidden space-y-4">
                {sortedEntries.map((entry) => (
                    <div key={entry.id} className="bg-white border rounded-xl p-4 shadow-sm space-y-3">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <p className="text-sm font-bold text-primary">{entry.subject}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>{format(new Date(entry.exam_date), 'dd MMM yyyy')} ({entry.day_of_week})</span>
                                </div>
                            </div>
                            <div className="bg-primary/5 text-primary px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tight">
                                Exam
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-dashed">
                            <div className="space-y-1">
                                <p className="text-[10px] text-muted-foreground uppercase font-semibold">Time</p>
                                <div className="flex items-center gap-1.5 text-xs">
                                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span>{entry.start_time} - {entry.end_time}</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] text-muted-foreground uppercase font-semibold">Syllabus</p>
                                <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                                    <BookOpen className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                    <span className="line-clamp-2">{entry.syllabus_notes || 'No notes'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Summary */}
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>Total Exams: {sortedEntries.length}</span>
                </div>
                {sortedEntries.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                        {format(new Date(sortedEntries[0].exam_date), 'dd MMM')} - {' '}
                        {format(new Date(sortedEntries[sortedEntries.length - 1].exam_date), 'dd MMM yyyy')}
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            {showActions && (
                <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-2">
                        {onEdit && (
                            <Button variant="outline" size="sm" onClick={onEdit}>
                                <Pencil className="w-4 h-4 mr-2" />
                                Edit
                            </Button>
                        )}
                        {onDelete && (
                            <Button variant="outline" size="sm" onClick={onDelete} className="text-destructive hover:text-destructive">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                            </Button>
                        )}
                    </div>
                    {onDownload && (
                        <Button onClick={onDownload}>
                            <Download className="w-4 h-4 mr-2" />
                            Download PDF
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}
