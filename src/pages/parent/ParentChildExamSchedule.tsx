import React, { useState } from 'react';
import { ParentLayout } from '@/layouts/ParentLayout';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useParentDashboard } from '@/hooks/useParentDashboard';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/common/Badge';
import { Calendar, Clock, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

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

export function ParentChildExamSchedule() {
    const { childId } = useParams<{ childId: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();
    const { children } = useParentDashboard(user?.id, user?.institutionId);
    const [selectedExamId, setSelectedExamId] = useState<string>('');

    const child = children.find(c => c.id === childId);

    // Fetch exam schedules for the child
    const { data: examSchedules = [], isLoading: schedulesLoading } = useQuery({
        queryKey: ['exam-schedules', childId],
        queryFn: async () => {
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
        enabled: !!child && !!user?.institutionId,
        refetchInterval: 30000,
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
        refetchInterval: 30000,
    });

    if (!child) {
        return (
            <ParentLayout>
                <div className="p-4 text-center">
                    <p className="text-muted-foreground">Child not found</p>
                </div>
            </ParentLayout>
        );
    }

    return (
        <ParentLayout>
            {/* Header with child info */}
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b">
                <div className="p-4">
                    <button
                        onClick={() => navigate('/parent/exam-schedule')}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-3"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </button>
                    <h1 className="text-2xl font-bold mb-1">{child.name}</h1>
                    <p className="text-sm text-muted-foreground">
                        {child.class} • Student Performance Overview
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 px-4 overflow-x-auto">
                    <button className="pb-3 px-2 text-sm font-medium border-b-2 border-transparent text-muted-foreground hover:text-foreground whitespace-nowrap">
                        Academic
                    </button>
                    <button className="pb-3 px-2 text-sm font-medium border-b-2 border-transparent text-muted-foreground hover:text-foreground whitespace-nowrap">
                        Attendance
                    </button>
                    <button className="pb-3 px-2 text-sm font-medium border-b-2 border-transparent text-muted-foreground hover:text-foreground whitespace-nowrap">
                        Leave Request
                    </button>
                    <button className="pb-3 px-2 text-sm font-medium border-b-2 border-primary text-foreground whitespace-nowrap">
                        Exam Schedule
                    </button>
                    <button className="pb-3 px-2 text-sm font-medium border-b-2 border-transparent text-muted-foreground hover:text-foreground whitespace-nowrap">
                        Certificates
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-6">
                {/* Select Exam Card */}
                <div className="bg-white rounded-lg p-6 shadow-sm border">
                    <h2 className="text-lg font-semibold mb-4">Select Exam</h2>
                    <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                        <SelectTrigger className="bg-primary/5">
                            <SelectValue placeholder="Choose an exam to view schedule" />
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
                    <p className="text-sm text-muted-foreground mt-2">
                        Class: {child.class} - Section {child.section}
                    </p>
                </div>

                {/* Exam Schedule Display */}
                {selectedExamId ? (
                    entriesLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="animate-pulse bg-gray-200 h-24 rounded-lg"></div>
                            ))}
                        </div>
                    ) : examEntries.length === 0 ? (
                        <div className="text-center p-12 bg-muted/30 rounded-lg">
                            <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
                            <p className="text-muted-foreground">No exam schedule entries found</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {examEntries.map((entry) => (
                                <div
                                    key={entry.id}
                                    className="bg-white rounded-lg p-4 shadow-sm border hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-14 h-14 rounded-lg bg-primary/10 flex flex-col items-center justify-center text-primary flex-shrink-0">
                                                    <span className="text-[10px] font-bold uppercase">
                                                        {format(new Date(entry.exam_date), 'MMM')}
                                                    </span>
                                                    <span className="text-lg font-bold leading-none">
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
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground ml-17">
                                                <Clock className="w-4 h-4" />
                                                <span>
                                                    {entry.start_time.substring(0, 5)} - {entry.end_time.substring(0, 5)}
                                                </span>
                                            </div>
                                            {entry.syllabus_notes && (
                                                <div className="mt-3 p-3 bg-muted/50 rounded text-xs">
                                                    <strong>Syllabus:</strong> {entry.syllabus_notes}
                                                </div>
                                            )}
                                        </div>
                                        <Badge variant="outline" className="ml-2 flex-shrink-0">
                                            {new Date(entry.exam_date) > new Date() ? 'Upcoming' : 'Completed'}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                ) : (
                    <div className="text-center p-12 bg-muted/30 rounded-lg">
                        <p className="text-muted-foreground text-sm">
                            Select an exam from the dropdown above to view details
                        </p>
                    </div>
                )}
            </div>
        </ParentLayout>
    );
}
