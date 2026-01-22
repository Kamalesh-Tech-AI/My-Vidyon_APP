import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Calendar, Clock } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { StudentLayout } from '@/layouts/StudentLayout';
import { Badge } from '@/components/common/Badge';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StudentExamScheduleView } from '@/components/exam-schedule/StudentExamScheduleView';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

interface TimetableSlot {
    id: string;
    day_of_week: string;
    period_index: number;
    start_time: string;
    end_time: string;
    subject_id?: string;
    faculty_id?: string;
    class_id?: string;
    section?: string;
    room_number?: string;
    is_break?: boolean;
    break_name?: string;
    subjects?: { name: string };
    profiles?: { full_name: string };
}


export function StudentTimetable() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [studentInfo, setStudentInfo] = useState<{ class_name: string; section: string; class_id: string } | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Fetch student's class and section info
    useEffect(() => {
        const fetchStudentInfo = async () => {
            if (!user?.email || !user?.institutionId) {
                console.log('[STUDENT] Missing user details:', { email: user?.email, institutionId: user?.institutionId });
                return;
            }

            console.log('[STUDENT] Fetching student info case-insensitively for:', user.email, 'with institutionId:', user.institutionId);
            setError(null);

            try {
                // Try to get student's class and section from students table
                // Using ilike for case-insensitivity and adding institution_id filter
                const { data: studentData, error: studentError, status } = await supabase
                    .from('students')
                    .select('class_name, section, institution_id')
                    .ilike('email', user.email)
                    .eq('institution_id', user.institutionId)
                    .maybeSingle();

                console.log('[STUDENT] Query status:', status);
                if (studentError) {
                    console.error('[STUDENT] Error fetching student data:', studentError);
                    setError(`Database error: ${studentError.message} (Code: ${studentError.code})`);
                    return;
                }

                if (!studentData) {
                    console.log(`[STUDENT] Query returned NO data for email: ${user.email} and inst: ${user.institutionId}`);
                    // Fallback check: try without institution_id just to see if it's the culprit
                    const { data: fallbackData } = await supabase
                        .from('students')
                        .select('institution_id')
                        .ilike('email', user.email)
                        .maybeSingle();

                    if (fallbackData) {
                        console.log('[STUDENT] FALLBACK: Found student but institution_id mismatch. Auth ID:', user.institutionId, 'DB ID:', fallbackData.institution_id);
                        setError(`Institution ID mismatch. Please contact admin. (Auth: ${user.institutionId}, DB: ${fallbackData.institution_id})`);
                    } else {
                        setError('Your student profile is not set up yet. Please contact your institution admin.');
                    }
                    return;
                }

                console.log('[STUDENT] Student profile found:', studentData);

                // Validate data
                if (!studentData.class_name || !studentData.section) {
                    console.error('[STUDENT] Incomplete student data:', studentData);
                    setError('Your class or section is not set. Please contact your institution admin.');
                    return;
                }


                // Get class ID - filtering by name and institution_id through groups table
                // Using limit(1) to handle multiple classes with same name in different groups
                const { data: classDataArray, error: classError } = await supabase
                    .from('classes')
                    .select('id, groups!inner(institution_id)')
                    .eq('name', studentData.class_name)
                    .eq('groups.institution_id', user.institutionId)
                    .limit(1);

                if (classError) {
                    console.error('[STUDENT] Error fetching class data:', classError);
                    setError(`Error looking up class: ${classError.message}`);
                    return;
                }

                const classData = classDataArray?.[0];

                if (!classData) {
                    console.log('[STUDENT] No class found for name:', studentData.class_name, 'in institution:', user.institutionId);
                    setError(`Class "${studentData.class_name}" not found in the system.`);
                    return;
                }

                console.log('[STUDENT] Resolved Class ID:', classData.id);

                setStudentInfo({
                    class_name: studentData.class_name,
                    section: studentData.section,
                    class_id: classData.id
                });
            } catch (err) {
                console.error('[STUDENT] Unexpected error during profile lookup:', err);
                setError('An unexpected error occurred. Please try again later.');
            }
        };

        fetchStudentInfo();
    }, [user?.email, user?.institutionId]);

    // Store config ID for real-time subscriptions
    const [configId, setConfigId] = useState<string | null>(null);

    // Fetch timetable slots for student's class and section
    const { data: timetableSlots = [], isLoading, refetch } = useQuery({
        queryKey: ['student-timetable', studentInfo?.class_id, studentInfo?.section],
        queryFn: async () => {
            if (!studentInfo?.class_id || !studentInfo?.section) {
                console.log('[STUDENT] No student info available yet');
                return [];
            }

            console.log('[STUDENT] Fetching timetable for class:', studentInfo.class_name, 'Section:', studentInfo.section);

            // Optimized single query with join through timetable_configs
            const { data: slotsData, error: slotsError } = await supabase
                .from('timetable_slots')
                .select(`
                    *,
                    subjects:subject_id (name),
                    profiles:faculty_id (full_name),
                    timetable_configs!inner (
                        id,
                        class_id,
                        section
                    )
                `)
                .eq('timetable_configs.class_id', studentInfo.class_id)
                .eq('timetable_configs.section', studentInfo.section)
                .order('day_of_week')
                .order('period_index');

            if (slotsError) {
                console.error('[STUDENT] Error fetching timetable slots:', slotsError);
                throw slotsError;
            }

            // Store config_id for real-time subscriptions
            if (slotsData && slotsData.length > 0) {
                const firstSlot = slotsData[0] as any;
                if (firstSlot.timetable_configs?.id) {
                    setConfigId(firstSlot.timetable_configs.id);
                    console.log('[STUDENT] Config ID for subscriptions:', firstSlot.timetable_configs.id);
                }
            }

            console.log('[STUDENT] Fetched timetable slots:', slotsData?.length || 0, 'slots');

            return slotsData || [];
        },
        enabled: !!studentInfo?.class_id && !!studentInfo?.section,
        staleTime: 30 * 1000, // Consider data stale after 30 seconds
        gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    });

    // Real-time subscriptions using Supabase Realtime
    useEffect(() => {
        if (!configId) {
            console.log('[STUDENT] No config ID yet, skipping real-time setup');
            return;
        }

        console.log('[STUDENT] Setting up real-time subscriptions for config:', configId);

        const channel = supabase
            .channel(`student-timetable-${configId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'timetable_slots',
                    filter: `config_id=eq.${configId}`,
                },
                (payload) => {
                    console.log('[STUDENT] Real-time: Timetable slot changed:', payload);
                    queryClient.invalidateQueries({ queryKey: ['student-timetable'] });
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'timetable_configs',
                    filter: `id=eq.${configId}`,
                },
                (payload) => {
                    console.log('[STUDENT] Real-time: Timetable config changed:', payload);
                    queryClient.invalidateQueries({ queryKey: ['student-timetable'] });
                }
            )
            .subscribe((status) => {
                console.log('[STUDENT] Subscription status:', status);
            });

        return () => {
            console.log('[STUDENT] Cleaning up real-time subscriptions');
            supabase.removeChannel(channel);
        };
    }, [configId, queryClient]);

    // Convert array to object for easier lookup
    const timetableData: { [key: string]: TimetableSlot } = {};
    timetableSlots.forEach((slot: any) => {
        const key = `${slot.day_of_week}-${slot.period_index}`;
        timetableData[key] = slot;
    });

    // Show error state
    if (error) {
        return (
            <StudentLayout>
                <PageHeader title="My Timetable" subtitle="View your weekly class schedule" />
                <Card className="m-4">
                    <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                        <Calendar className="w-12 h-12 mb-4 text-destructive" />
                        <h2 className="text-xl font-semibold mb-2 text-destructive">Error Loading Timetable</h2>
                        <p className="text-muted-foreground">{error}</p>
                        <p className="text-sm text-muted-foreground mt-4">
                            If this problem persists, please contact your institution administrator.
                        </p>
                    </CardContent>
                </Card>
            </StudentLayout>
        );
    }

    if (isLoading || !studentInfo) {
        return (
            <StudentLayout>
                <PageHeader title="My Timetable" subtitle="View your weekly class schedule" />
                <div className="flex justify-center p-10">
                    <Loader2 className="animate-spin w-8 h-8" />
                </div>
            </StudentLayout>
        );
    }

    return (
        <StudentLayout>
            <PageHeader
                title="My Timetable"
                subtitle={`${studentInfo.class_name} - Section ${studentInfo.section}`}
            />

            <Tabs defaultValue="timetable" className="m-4">
                <TabsList>
                    <TabsTrigger value="timetable">My Timetable</TabsTrigger>
                    <TabsTrigger value="exam-schedule">Exam Schedule</TabsTrigger>
                </TabsList>

                <TabsContent value="timetable">
                    <Card>
                        <CardContent className="p-0 overflow-x-auto">
                            <table className="w-full border-collapse min-w-[1000px]">
                                <thead>
                                    <tr>
                                        <th className="border p-4 bg-muted/50 w-32 font-bold text-left sticky left-0">Day</th>
                                        {PERIODS.map((p) => (
                                            <th key={p} className="border p-3 bg-muted/50 text-sm font-medium text-left">
                                                Period {p}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {DAYS.map((day) => (
                                        <tr key={day}>
                                            <td className="border p-4 font-semibold bg-muted/10 sticky left-0">{day}</td>
                                            {PERIODS.map((period) => {
                                                const key = `${day}-${period}`;
                                                const slot = timetableData[key];
                                                return (
                                                    <td
                                                        key={period}
                                                        className="border p-2 min-w-[140px] h-[100px] align-top"
                                                    >
                                                        {slot?.subject_id ? (
                                                            <div className="space-y-1 p-1">
                                                                <Badge variant="default" className="w-full justify-start line-clamp-1 bg-primary/10 text-primary border-0 mb-1">
                                                                    {slot.subjects?.name || 'Subject'}
                                                                </Badge>
                                                                {slot.profiles?.full_name && (
                                                                    <div className="text-xs font-medium pl-1">
                                                                        {slot.profiles.full_name}
                                                                    </div>
                                                                )}
                                                                {slot.room_number && (
                                                                    <div className="text-[10px] text-muted-foreground pl-1">
                                                                        Room: {slot.room_number}
                                                                    </div>
                                                                )}
                                                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground pl-1">
                                                                    <Clock className="w-3 h-3" />
                                                                    {slot.start_time} - {slot.end_time}
                                                                </div>
                                                            </div>
                                                        ) : slot?.is_break ? (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <Badge className="text-xs bg-secondary text-secondary-foreground">
                                                                    {slot.break_name || 'Break'}
                                                                </Badge>
                                                            </div>
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-muted-foreground/20 text-xs">
                                                                -
                                                            </div>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>

                    {timetableSlots.length === 0 && (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                                <Calendar className="w-12 h-12 mb-4" />
                                <h2 className="text-xl font-semibold mb-2">No Timetable Published</h2>
                                <p>Your class teacher hasn't published the timetable yet.</p>
                                <p className="text-sm mt-2">Class: {studentInfo.class_name} - Section {studentInfo.section}</p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="exam-schedule">
                    <StudentExamScheduleView />
                </TabsContent>
            </Tabs>
        </StudentLayout>
    );
}
