import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ExamTypeSelector, EXAM_TYPES, type ExamType } from './ExamTypeSelector';
import { ManualEntryForm, type ExamEntry } from './ManualEntryForm';
import { ExamSchedulePreview } from './ExamSchedulePreview';
import { Plus, History, X } from 'lucide-react';
import { format } from 'date-fns';
import Loader from '@/components/common/Loader';

interface ExamScheduleManagerProps {
    classId?: string;
    className?: string;
    section?: string;
}

export function ExamScheduleManager({ classId, className, section }: ExamScheduleManagerProps) {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const [selectedClassName, setSelectedClassName] = useState<string>('');
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [selectedSection, setSelectedSection] = useState<string>('');
    const [selectedExamType, setSelectedExamType] = useState<ExamType | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [historyExamType, setHistoryExamType] = useState<string>('');
    const [historyClass, setHistoryClass] = useState<string>('');
    const [historySchedule, setHistorySchedule] = useState<any>(null);

    // Fetch all classes from the institution
    const { data: classes = [], isLoading: isLoadingClasses } = useQuery({
        queryKey: ['classes', user?.institutionId],
        queryFn: async () => {
            if (!user?.institutionId) return [];

            const { data, error } = await supabase
                .from('classes')
                .select('id, name, sections')
                .order('name');

            if (error) {
                console.error('Error fetching classes:', error);
                return [];
            }

            return data || [];
        },
        enabled: !!user?.institutionId,
    });

    // Filter unique class names
    const uniqueClassNames = Array.from(new Set(classes.map(c => c.name))).sort((a, b) => {
        // Natural sort for class names (e.g., 1st, 2nd, 10th)
        return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    });

    // Available sections for the selected class name
    const availableSections = Array.from(new Set(
        classes
            .filter(c => c.name === selectedClassName)
            .flatMap(c => c.sections || [])
    )).sort();

    // Auto-select class ID based on name and section
    useEffect(() => {
        if (selectedClassName && selectedSection) {
            const cls = classes.find(c =>
                c.name === selectedClassName &&
                Array.isArray(c.sections) &&
                c.sections.includes(selectedSection)
            );
            if (cls) {
                setSelectedClass(cls.id);
            }
        }
    }, [selectedClassName, selectedSection, classes]);

    // Initialize from props
    useEffect(() => {
        if (className && !selectedClassName) {
            setSelectedClassName(className);
        }
        if (section && !selectedSection) {
            setSelectedSection(section);
        }
        if (classId && !selectedClass) {
            setSelectedClass(classId);
        }
    }, [className, section, classId]);

    // Get the selected class details
    const selectedClassData = classes.find(c => c.id === selectedClass);

    // Fetch existing exam schedules with refetch interval for realtime
    const { data: examSchedules = [], isLoading: isLoadingSchedules } = useQuery({
        queryKey: ['exam-schedules', user?.institutionId, selectedClass, selectedSection],
        queryFn: async () => {
            if (!user?.institutionId || !selectedClass || !selectedSection) return [];

            const { data, error } = await supabase
                .from('exam_schedules')
                .select(`
                    *,
                    exam_schedule_entries (*)
                `)
                .eq('institution_id', user.institutionId)
                .eq('class_id', selectedClass)
                .eq('section', selectedSection)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching exam schedules:', error);
                return [];
            }

            return data || [];
        },
        enabled: !!user?.institutionId && !!selectedClass && !!selectedSection,
        refetchInterval: 3000, // Refetch every 3 seconds for realtime effect
    });

    // Fetch all exam schedules for history (all classes)
    const { data: allExamSchedules = [] } = useQuery({
        queryKey: ['all-exam-schedules', user?.institutionId],
        queryFn: async () => {
            if (!user?.institutionId) return [];

            const { data, error } = await supabase
                .from('exam_schedules')
                .select(`
                    *,
                    exam_schedule_entries (*)
                `)
                .eq('institution_id', user.institutionId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching all exam schedules:', error);
                return [];
            }

            return data || [];
        },
        enabled: !!user?.institutionId && showHistory,
    });

    // Realtime subscription for exam schedules
    useEffect(() => {
        if (!user?.institutionId || !selectedClass || !selectedSection) return;

        console.log('Setting up realtime subscription for exam schedules');

        const channel = supabase
            .channel('exam-schedules-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'exam_schedules',
                    filter: `institution_id=eq.${user.institutionId}`
                },
                (payload) => {
                    console.log('Exam schedule changed:', payload);
                    toast.info('Exam schedules updated', { duration: 2000 });
                    queryClient.invalidateQueries({ queryKey: ['exam-schedules'] });
                    queryClient.invalidateQueries({ queryKey: ['all-exam-schedules'] });
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'exam_schedule_entries'
                },
                (payload) => {
                    console.log('Exam schedule entries changed:', payload);
                    queryClient.invalidateQueries({ queryKey: ['exam-schedules'] });
                    queryClient.invalidateQueries({ queryKey: ['all-exam-schedules'] });
                }
            )
            .subscribe();

        return () => {
            console.log('Cleaning up realtime subscription');
            supabase.removeChannel(channel);
        };
    }, [user?.institutionId, selectedClass, selectedSection, queryClient]);

    // Create exam schedule mutation
    const createScheduleMutation = useMutation({
        mutationFn: async (entries: ExamEntry[]) => {
            if (!user?.id || !user?.institutionId || !selectedClass || !selectedSection || !selectedExamType) {
                throw new Error('Missing required data');
            }

            // Get the class name for display
            const classData = classes.find(c => c.id === selectedClass);
            if (!classData) throw new Error('Class not found');

            // 1. Create exam schedule
            const { data: schedule, error: scheduleError } = await supabase
                .from('exam_schedules')
                .insert({
                    institution_id: user.institutionId,
                    class_id: selectedClass,
                    section: selectedSection,
                    exam_type: selectedExamType.value,
                    exam_display_name: selectedExamType.label,
                    academic_year: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
                    created_by: user.id,
                })
                .select()
                .single();

            if (scheduleError) throw scheduleError;

            // 2. Insert exam entries
            const { error: entriesError } = await supabase
                .from('exam_schedule_entries')
                .insert(
                    entries.map(entry => ({
                        exam_schedule_id: schedule.id,
                        exam_date: format(entry.exam_date, 'yyyy-MM-dd'),
                        day_of_week: entry.day_of_week,
                        start_time: entry.start_time,
                        end_time: entry.end_time,
                        subject: entry.subject,
                        syllabus_notes: entry.syllabus_notes,
                    }))
                );

            if (entriesError) throw entriesError;

            return schedule;
        },
        onSuccess: () => {
            toast.success('Exam schedule created successfully');
            queryClient.invalidateQueries({ queryKey: ['exam-schedules'] });
            queryClient.invalidateQueries({ queryKey: ['all-exam-schedules'] });
            setIsCreating(false);
            setSelectedExamType(null);
        },
        onError: (error: any) => {
            console.error('Error creating exam schedule:', error);
            toast.error(error.message || 'Failed to create exam schedule');
        },
    });

    // Delete exam schedule mutation with realtime update
    const deleteScheduleMutation = useMutation({
        mutationFn: async (scheduleId: string) => {
            const { error } = await supabase
                .from('exam_schedules')
                .delete()
                .eq('id', scheduleId);

            if (error) throw error;
        },
        onSuccess: () => {
            toast.success('Exam schedule deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['exam-schedules'] });
            queryClient.invalidateQueries({ queryKey: ['all-exam-schedules'] });
        },
        onError: (error: any) => {
            console.error('Error deleting exam schedule:', error);
            toast.error(error.message || 'Failed to delete exam schedule');
        },
    });

    // PDF Download Handler
    const handleDownloadPDF = (schedule: any) => {
        try {
            const printWindow = window.open('', '', 'height=600,width=800');
            if (!printWindow) {
                toast.error('Please allow popups to download PDF');
                return;
            }

            const entries = schedule.entries.sort((a: any, b: any) =>
                new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime()
            );

            const htmlContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>${schedule.exam_display_name} - Examination Schedule</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
                        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
                        .header h1 { margin: 0; font-size: 24px; color: #000; }
                        .header p { margin: 5px 0; color: #666; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                        th { background-color: #f5f5f5; font-weight: bold; text-transform: uppercase; font-size: 12px; }
                        td { font-size: 14px; }
                        .subject { font-weight: bold; color: #2563eb; }
                        .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
                        @media print { body { padding: 20px; } .no-print { display: none; } }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>${schedule.exam_display_name} Examination Schedule</h1>
                        <p>Class ${schedule.class_id} • Section ${schedule.section}</p>
                        <p>Academic Year ${schedule.academic_year}</p>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Date & Day</th>
                                <th>Time</th>
                                <th>Subject</th>
                                <th>Syllabus / Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${entries.map((entry: any) => `
                                <tr>
                                    <td><strong>${format(new Date(entry.exam_date), 'dd MMM yyyy')}</strong><br><span style="color: #666;">${entry.day_of_week}</span></td>
                                    <td>${entry.start_time} - ${entry.end_time}</td>
                                    <td class="subject">${entry.subject}</td>
                                    <td>${entry.syllabus_notes || 'No notes provided'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <div class="footer">
                        <p>Total Exams: ${entries.length}</p>
                        <p>Generated on ${format(new Date(), 'dd MMM yyyy, HH:mm')}</p>
                    </div>
                    <div class="no-print" style="margin-top: 20px; text-align: center;">
                        <button onclick="window.print()" style="padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">Print / Save as PDF</button>
                        <button onclick="window.close()" style="padding: 10px 20px; background: #666; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px; margin-left: 10px;">Close</button>
                    </div>
                </body>
                </html>
            `;

            printWindow.document.write(htmlContent);
            printWindow.document.close();
            toast.success('PDF preview opened! Click "Print" to save as PDF');
        } catch (error) {
            console.error('Error generating PDF:', error);
            toast.error('Failed to generate PDF');
        }
    };

    const handleExamTypeSelect = (examType: ExamType) => {
        setSelectedExamType(examType);
        setIsCreating(true);
    };

    const handleManualSubmit = async (entries: ExamEntry[]) => {
        setIsSubmitting(true);
        await createScheduleMutation.mutateAsync(entries);
        setIsSubmitting(false);
    };

    const handleCancel = () => {
        setIsCreating(false);
        setSelectedExamType(null);
    };

    const handleDelete = (scheduleId: string) => {
        if (confirm('Are you sure you want to delete this exam schedule?')) {
            deleteScheduleMutation.mutate(scheduleId);
        }
    };

    const handleViewHistory = (schedule: any) => {
        setHistorySchedule(schedule);
    };

    if (isLoadingClasses) {
        return <Loader fullScreen={false} />;
    }

    // Show creation interface (Manual Entry Only)
    if (isCreating && selectedExamType && selectedClass && selectedSection) {
        const classData = classes.find(c => c.id === selectedClass);

        return (
            <Card>
                <CardContent className="p-6">
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-1">
                            Create {selectedExamType.label} Schedule
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            For {classData?.name} - Section {selectedSection}
                        </p>
                    </div>

                    <ManualEntryForm
                        onSubmit={handleManualSubmit}
                        onCancel={handleCancel}
                        isSubmitting={isSubmitting}
                    />
                </CardContent>
            </Card>
        );
    }

    // Show class and section selector
    return (
        <div className="space-y-6">
            {/* Class and Section Selector */}
            <Card>
                <CardContent className="p-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold mb-4">Select Class & Section</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Choose the class and section to create or view exam schedules
                                </p>
                            </div>
                            <Button onClick={() => setShowHistory(true)} variant="outline">
                                <History className="w-4 h-4 mr-2" />
                                History
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Class Selector */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Class</label>
                                <Select
                                    value={selectedClassName}
                                    onValueChange={(val) => {
                                        setSelectedClassName(val);
                                        setSelectedSection('');
                                        setSelectedClass('');
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select class" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {uniqueClassNames.map((name: string) => (
                                            <SelectItem key={name} value={name}>
                                                {name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Section Selector */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Section</label>
                                <Select
                                    value={selectedSection}
                                    onValueChange={setSelectedSection}
                                    disabled={!selectedClassName}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select section" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableSections.map((sec: string) => (
                                            <SelectItem key={sec} value={sec}>
                                                Section {sec}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Existing Schedules or Create New */}
            {selectedClass && selectedSection && (
                <>
                    {isLoadingSchedules ? (
                        <Loader fullScreen={false} />
                    ) : examSchedules.length > 0 ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold">Exam Schedules</h3>
                                <Button onClick={() => setIsCreating(true)} size="sm">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Create New
                                </Button>
                            </div>

                            <div className="grid gap-4">
                                {examSchedules.map((schedule: any) => (
                                    <Card key={schedule.id}>
                                        <CardContent className="p-6">
                                            <ExamSchedulePreview
                                                schedule={{
                                                    id: schedule.id,
                                                    exam_type: schedule.exam_type,
                                                    exam_display_name: schedule.exam_display_name,
                                                    class_id: selectedClassData?.name || '',
                                                    section: schedule.section,
                                                    academic_year: schedule.academic_year,
                                                    entries: schedule.exam_schedule_entries.map((e: any) => ({
                                                        id: e.id,
                                                        exam_date: new Date(e.exam_date),
                                                        day_of_week: e.day_of_week,
                                                        start_time: e.start_time,
                                                        end_time: e.end_time,
                                                        subject: e.subject,
                                                        syllabus_notes: e.syllabus_notes,
                                                    })),
                                                }}
                                                onDelete={() => handleDelete(schedule.id)}
                                                onDownload={() => handleDownloadPDF({
                                                    id: schedule.id,
                                                    exam_type: schedule.exam_type,
                                                    exam_display_name: schedule.exam_display_name,
                                                    class_id: selectedClassData?.name || '',
                                                    section: schedule.section,
                                                    academic_year: schedule.academic_year,
                                                    entries: schedule.exam_schedule_entries.map((e: any) => ({
                                                        id: e.id,
                                                        exam_date: new Date(e.exam_date),
                                                        day_of_week: e.day_of_week,
                                                        start_time: e.start_time,
                                                        end_time: e.end_time,
                                                        subject: e.subject,
                                                        syllabus_notes: e.syllabus_notes,
                                                    })),
                                                })}
                                                showActions={true}
                                            />
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="p-6">
                                <ExamTypeSelector onSelect={handleExamTypeSelect} />
                            </CardContent>
                        </Card>
                    )}
                </>
            )}

            {/* History Dialog */}
            <Dialog open={showHistory} onOpenChange={setShowHistory}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Exam Schedule History</DialogTitle>
                    </DialogHeader>

                    {!historyExamType ? (
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">Select an exam type to view schedules</p>
                            <div className="grid grid-cols-2 gap-3">
                                {EXAM_TYPES.map((examType) => (
                                    <Button
                                        key={examType.value}
                                        variant="outline"
                                        onClick={() => setHistoryExamType(examType.value)}
                                        className="justify-start h-auto p-4"
                                    >
                                        <div className="text-left">
                                            <div className="font-semibold">{examType.label}</div>
                                            <div className="text-xs text-muted-foreground">{examType.description}</div>
                                        </div>
                                    </Button>
                                ))}
                            </div>
                        </div>
                    ) : !historyClass ? (
                        <div className="space-y-4">
                            <Button variant="ghost" onClick={() => setHistoryExamType('')} className="mb-2">
                                ← Back to Exam Types
                            </Button>
                            <p className="text-sm text-muted-foreground">
                                Select a class to view {EXAM_TYPES.find(t => t.value === historyExamType)?.label} schedules
                            </p>
                            <div className="grid grid-cols-3 gap-3">
                                {classes.map((cls: any) => {
                                    const hasSchedule = allExamSchedules.some(
                                        (s: any) => s.exam_type === historyExamType && s.class_id === cls.id
                                    );
                                    return (
                                        <Button
                                            key={cls.id}
                                            variant={hasSchedule ? "default" : "outline"}
                                            onClick={() => {
                                                const schedule = allExamSchedules.find(
                                                    (s: any) => s.exam_type === historyExamType && s.class_id === cls.id
                                                );
                                                if (schedule) {
                                                    setHistoryClass(cls.id);
                                                    handleViewHistory(schedule);
                                                } else {
                                                    toast.info(`No ${EXAM_TYPES.find(t => t.value === historyExamType)?.label} schedule for ${cls.name}`);
                                                }
                                            }}
                                            className="h-auto p-4"
                                        >
                                            {cls.name}
                                        </Button>
                                    );
                                })}
                            </div>
                        </div>
                    ) : historySchedule ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Button variant="ghost" onClick={() => { setHistoryClass(''); setHistorySchedule(null); }}>
                                    ← Back to Classes
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => setShowHistory(false)}>
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                            <ExamSchedulePreview
                                schedule={{
                                    id: historySchedule.id,
                                    exam_type: historySchedule.exam_type,
                                    exam_display_name: historySchedule.exam_display_name,
                                    class_id: classes.find((c: any) => c.id === historySchedule.class_id)?.name || '',
                                    section: historySchedule.section,
                                    academic_year: historySchedule.academic_year,
                                    entries: historySchedule.exam_schedule_entries.map((e: any) => ({
                                        id: e.id,
                                        exam_date: new Date(e.exam_date),
                                        day_of_week: e.day_of_week,
                                        start_time: e.start_time,
                                        end_time: e.end_time,
                                        subject: e.subject,
                                        syllabus_notes: e.syllabus_notes,
                                    })),
                                }}
                                showActions={false}
                            />
                        </div>
                    ) : null}
                </DialogContent>
            </Dialog>
        </div>
    );
}
