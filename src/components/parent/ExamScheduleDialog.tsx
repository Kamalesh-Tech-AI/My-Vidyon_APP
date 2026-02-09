import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/common/Badge';
import { Calendar, Clock, BookOpen, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

interface ExamScheduleDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: any[];
}

interface ExamSchedule {
    id: string;
    exam_type: string;
    exam_display_name: string;
    academic_year: string;
}

interface ExamEntry {
    id: string;
    exam_date: string;
    day_of_week: string;
    start_time: string;
    end_time: string;
    subject: string;
    syllabus_notes: string;
}

export function ExamScheduleDialog({ open, onOpenChange, children }: ExamScheduleDialogProps) {
    const { user } = useAuth();
    const [selectedChildId, setSelectedChildId] = useState<string>('');
    const [selectedExamId, setSelectedExamId] = useState<string>('');

    // Fetch exam schedules for selected child
    const { data: examSchedules = [], isLoading: schedulesLoading } = useQuery({
        queryKey: ['exam-schedules', selectedChildId],
        queryFn: async () => {
            if (!selectedChildId) return [];

            const child = children.find(c => c.id === selectedChildId);
            if (!child) return [];

            const { data, error } = await supabase
                .from('exam_schedules')
                .select('*')
                .eq('institution_id', user?.institutionId)
                .eq('class_id', child.classId)
                .eq('section', child.section)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching exam schedules:', error);
                return [];
            }

            return data as ExamSchedule[];
        },
        enabled: !!selectedChildId && !!user?.institutionId,
        refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
    });

    // Fetch exam entries for selected exam
    const { data: examEntries = [], isLoading: entriesLoading } = useQuery({
        queryKey: ['exam-entries', selectedExamId],
        queryFn: async () => {
            if (!selectedExamId) return [];

            const { data, error } = await supabase
                .from('exam_schedule_entries')
                .select('*')
                .eq('exam_schedule_id', selectedExamId)
                .order('exam_date', { ascending: true })
                .order('start_time', { ascending: true });

            if (error) {
                console.error('Error fetching exam entries:', error);
                return [];
            }

            return data as ExamEntry[];
        },
        enabled: !!selectedExamId,
        refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
    });

    const selectedChild = children.find(c => c.id === selectedChildId);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5" />
                        Exam Schedule
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Step 1: Select Child */}
                    {!selectedChildId ? (
                        <div>
                            <h3 className="text-sm font-medium mb-4">Select a child to view exam schedule</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {children.map((child) => (
                                    <div
                                        key={child.id}
                                        className="p-4 cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary rounded-lg bg-card"
                                        onClick={() => setSelectedChildId(child.id)}
                                    >
                                        <div className="flex items-center gap-4">
                                            {child.profilePicture ? (
                                                <img
                                                    src={child.profilePicture}
                                                    alt={child.name}
                                                    className="w-16 h-16 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <User className="w-8 h-8 text-primary" />
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-lg">{child.name}</h4>
                                                <p className="text-sm text-muted-foreground">
                                                    {child.class} - Section {child.section}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Roll: {child.rollNumber}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Selected Child Info */}
                            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    {selectedChild?.profilePicture ? (
                                        <img
                                            src={selectedChild.profilePicture}
                                            alt={selectedChild.name}
                                            className="w-12 h-12 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                            <User className="w-6 h-6 text-primary" />
                                        </div>
                                    )}
                                    <div>
                                        <h4 className="font-semibold">{selectedChild?.name}</h4>
                                        <p className="text-sm text-muted-foreground">
                                            {selectedChild?.class} - Section {selectedChild?.section}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setSelectedChildId('');
                                        setSelectedExamId('');
                                    }}
                                    className="text-sm text-primary hover:underline"
                                >
                                    Change Child
                                </button>
                            </div>

                            {/* Step 2: Select Exam Type */}
                            <div>
                                <label className="text-sm font-medium mb-2 block">Select Exam Type</label>
                                <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choose an exam type..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {schedulesLoading ? (
                                            <div className="p-2 text-center text-sm text-muted-foreground">
                                                Loading exam types...
                                            </div>
                                        ) : examSchedules.length === 0 ? (
                                            <div className="p-2 text-center text-sm text-muted-foreground">
                                                No exam schedules available
                                            </div>
                                        ) : (
                                            examSchedules.map((schedule) => (
                                                <SelectItem key={schedule.id} value={schedule.id}>
                                                    {schedule.exam_display_name} ({schedule.academic_year})
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Step 3: Display Exam Schedule */}
                            {selectedExamId && (
                                <div>
                                    <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        Exam Schedule
                                    </h3>
                                    {entriesLoading ? (
                                        <div className="space-y-3">
                                            {[1, 2, 3].map((i) => (
                                                <div key={i} className="animate-pulse">
                                                    <div className="h-20 bg-gray-200 rounded"></div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : examEntries.length === 0 ? (
                                        <div className="text-center p-8 bg-muted/30 rounded-lg">
                                            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-2 opacity-20" />
                                            <p className="text-muted-foreground">No exam schedule entries found</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {examEntries.map((entry) => (
                                                <div key={entry.id} className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <div className="w-12 h-12 rounded-lg bg-primary/10 flex flex-col items-center justify-center text-primary">
                                                                    <span className="text-[8px] font-bold uppercase">
                                                                        {format(new Date(entry.exam_date), 'MMM')}
                                                                    </span>
                                                                    <span className="text-sm font-bold leading-none">
                                                                        {format(new Date(entry.exam_date), 'd')}
                                                                    </span>
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-semibold text-base">{entry.subject}</h4>
                                                                    <p className="text-sm text-muted-foreground">
                                                                        {entry.day_of_week}, {format(new Date(entry.exam_date), 'MMM d, yyyy')}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-4 text-sm text-muted-foreground ml-15">
                                                                <div className="flex items-center gap-1">
                                                                    <Clock className="w-4 h-4" />
                                                                    <span>
                                                                        {entry.start_time.substring(0, 5)} - {entry.end_time.substring(0, 5)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            {entry.syllabus_notes && (
                                                                <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                                                                    <strong>Syllabus:</strong> {entry.syllabus_notes}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <Badge variant="outline" className="ml-2">
                                                            {new Date(entry.exam_date) > new Date() ? 'Upcoming' : 'Completed'}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
