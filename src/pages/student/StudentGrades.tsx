import { useState, useEffect } from 'react';
import { StudentLayout } from '@/layouts/StudentLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Badge } from '@/components/common/Badge';
import { useTranslation } from '@/i18n/TranslationContext';
import { TrendingUp, Award, FileSpreadsheet, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useAuth } from '@/context/AuthContext';
import { GradesSkeleton } from '@/components/skeletons/GradesSkeleton';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function StudentGrades() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [selectedExam, setSelectedExam] = useState<string>('');

    // 1. Fetch Student Profile
    const { data: studentProfile, isLoading: profileLoading } = useQuery({
        queryKey: ['student-profile', user?.email],
        queryFn: async () => {
            if (!user?.email) return null;
            const { data, error } = await supabase
                .from('students')
                .select('*')
                .ilike('email', user.email.trim())
                .maybeSingle();

            if (error) {
                console.error('Profile Fetch Error:', error);
                return null;
            }
            return data;
        },
        enabled: !!user?.email,
    });

    // 2. Fetch Exam Results (Only PUBLISHED)
    const { data: results = [], isLoading: resultsLoading } = useQuery({
        queryKey: ['student-grades-view', studentProfile?.id],
        queryFn: async () => {
            if (!studentProfile?.id) return [];

            const { data, error } = await supabase
                .from('exam_results')
                .select(`
                    *,
                    exam_schedules!exam_id (id, exam_display_name, exam_type),
                    subjects!subject_id (name)
                `)
                .eq('student_id', studentProfile.id)
                .eq('status', 'PUBLISHED');

            if (error) {
                console.error('Error fetching student grades:', error);
                throw error;
            }
            return data || [];
        },
        enabled: !!studentProfile?.id,
    });

    // Group results by exam
    const examsMap = results.reduce((acc: any, result) => {
        const examId = result.exam_id;
        if (!acc[examId]) {
            acc[examId] = {
                id: examId,
                title: result.exam_schedules?.exam_display_name || result.exam_schedules?.exam_type || 'Exam',
                results: [],
                totalMarks: 0,
                obtainedMarks: 0
            };
        }
        acc[examId].results.push({
            course: result.subjects?.name || 'Subject',
            internal: Number(result.internal_marks || 0),
            external: Number(result.external_marks || 0),
            marks: Number(result.total_marks || result.marks_obtained || 0),
            total: Number(result.max_marks || 100),
            grade: result.grade || 'N/A',
            remarks: result.remarks || '-'
        });
        acc[examId].totalMarks += Number(result.max_marks || 100);
        acc[examId].obtainedMarks += Number(result.total_marks || result.marks_obtained || 0);
        return acc;
    }, {});

    const examsList = Object.values(examsMap) as any[];

    // Set default selected exam once data is loaded
    useEffect(() => {
        if (examsList.length > 0 && !selectedExam) {
            setSelectedExam(examsList[0].id);
        }
    }, [examsList, selectedExam]);

    // Real-time subscription for new published results
    useEffect(() => {
        if (!studentProfile?.id) return;

        console.log('📡 Setting up real-time subscription for student:', studentProfile.id);

        const channel = supabase
            .channel('exam_results_realtime')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'exam_results',
                    filter: `student_id=eq.${studentProfile.id}`
                },
                (payload) => {
                    console.log('📬 Real-time update received:', payload);

                    // Check if the result is published
                    if (payload.new && (payload.new as any).status === 'PUBLISHED') {
                        toast.success('New exam results published! 🎉', {
                            description: 'Your grades have been updated.',
                            duration: 5000
                        });

                        // Refresh the grades data
                        queryClient.invalidateQueries({ queryKey: ['student-grades-view'] });
                    }
                }
            )
            .subscribe((status) => {
                console.log('📡 Subscription status:', status);
            });

        // Cleanup subscription on unmount
        return () => {
            console.log('🔌 Cleaning up real-time subscription');
            supabase.removeChannel(channel);
        };
    }, [studentProfile?.id, queryClient]);


    const currentExamData = examsMap[selectedExam];
    const percentage = currentExamData
        ? ((currentExamData.obtainedMarks / currentExamData.totalMarks) * 100).toFixed(1) + '%'
        : '0%';

    const isLoading = profileLoading || resultsLoading;

    if (isLoading) {
        return <GradesSkeleton />;
    }

    return (
        <StudentLayout>
            <PageHeader
                title="Academic Performance"
                subtitle="Track your progress and view detailed subject-wise grades"
            />

            {examsList.length > 0 ? (
                <div className="space-y-4 lg:space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                    {/* Exam Selector & Overview Card */}
                    <Card className="border-border/50 shadow-md bg-gradient-to-br from-card to-secondary/10">
                        <CardHeader className="pb-3 lg:pb-4 px-4 lg:px-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 lg:gap-6">
                                <div className="space-y-1 lg:space-y-1.5">
                                    <CardTitle className="text-base lg:text-lg">Examination Results</CardTitle>
                                    <CardDescription className="text-xs lg:text-sm">Select an exam to view detailed subject-wise performance</CardDescription>
                                </div>

                                <div className="min-w-[200px] lg:min-w-[250px]">
                                    <Select value={selectedExam} onValueChange={setSelectedExam}>
                                        <SelectTrigger className="w-full bg-background/80 backdrop-blur-sm h-11">
                                            <div className="flex items-center gap-2">
                                                <FileSpreadsheet className="w-4 h-4 text-primary" />
                                                <SelectValue placeholder="Select Exam" />
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {examsList.map((exam: any) => (
                                                <SelectItem key={exam.id} value={exam.id}>
                                                    {exam.title}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardHeader>
                    </Card>

                    {/* Performance Overview & Details */}
                    {currentExamData && (
                        <div className="grid gap-4 lg:gap-6 animate-in fade-in zoom-in-95 duration-500 delay-150">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
                                <Card className="bg-primary/5 border-primary/20">
                                    <CardContent className="p-4 lg:p-6 flex items-center gap-3 lg:gap-4">
                                        <div className="p-2 lg:p-3 bg-primary/20 rounded-full">
                                            <Award className="w-5 h-5 lg:w-6 lg:h-6 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-xs lg:text-sm font-medium text-primary/80 uppercase tracking-wider">Aggregate Score</p>
                                            <h3 className="text-2xl lg:text-3xl font-black text-primary tracking-tight">{percentage}</h3>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-4 lg:p-6 flex items-center gap-3 lg:gap-4">
                                        <div className="p-2 lg:p-3 bg-secondary/50 rounded-full">
                                            <TrendingUp className="w-5 h-5 lg:w-6 lg:h-6 text-foreground" />
                                        </div>
                                        <div>
                                            <p className="text-xs lg:text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Marks</p>
                                            <h3 className="text-2xl lg:text-3xl font-bold tracking-tight">
                                                {currentExamData.obtainedMarks} <span className="text-base lg:text-lg text-muted-foreground font-medium">/ {currentExamData.totalMarks}</span>
                                            </h3>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="sm:col-span-2 lg:col-span-1">
                                    <CardContent className="p-4 lg:p-6 flex items-center gap-3 lg:gap-4">
                                        <div className="p-2 lg:p-3 bg-blue-500/10 rounded-full">
                                            <FileSpreadsheet className="w-5 h-5 lg:w-6 lg:h-6 text-blue-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs lg:text-sm font-medium text-muted-foreground uppercase tracking-wider">Subjects</p>
                                            <h3 className="text-2xl lg:text-3xl font-bold tracking-tight">{currentExamData.results.length}</h3>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Detailed Table Card */}
                            <Card className="overflow-hidden border-border/50 shadow-sm">
                                <CardHeader className="bg-muted/30 border-b pb-3 lg:pb-4 px-4 lg:px-6">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-base lg:text-lg flex items-center gap-2">
                                            Subject Breakdown
                                        </CardTitle>
                                        <Badge variant="outline" className="font-mono text-xs">
                                            {currentExamData.title}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <div className="overflow-x-auto scroll-smooth-touch">
                                    <table className="w-full text-xs lg:text-sm min-w-[600px]">
                                        <thead>
                                            <tr className="bg-muted/10 border-b border-border/50">
                                                <th className="py-3 lg:py-4 px-3 lg:px-6 text-left font-semibold text-muted-foreground uppercase text-[10px] lg:text-xs tracking-wider">Subject</th>
                                                <th className="py-3 lg:py-4 px-3 lg:px-6 text-center font-semibold text-muted-foreground uppercase text-[10px] lg:text-xs tracking-wider">Internal</th>
                                                <th className="py-3 lg:py-4 px-3 lg:px-6 text-center font-semibold text-muted-foreground uppercase text-[10px] lg:text-xs tracking-wider">External</th>
                                                <th className="py-3 lg:py-4 px-3 lg:px-6 text-center font-semibold text-muted-foreground uppercase text-[10px] lg:text-xs tracking-wider">Total</th>
                                                <th className="py-3 lg:py-4 px-3 lg:px-6 text-center font-semibold text-muted-foreground uppercase text-[10px] lg:text-xs tracking-wider">Grade</th>
                                                <th className="py-3 lg:py-4 px-3 lg:px-6 text-left font-semibold text-muted-foreground uppercase text-[10px] lg:text-xs tracking-wider">Remarks</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/40">
                                            {currentExamData.results.map((result: any, index: number) => (
                                                <tr key={index} className="hover:bg-muted/30 transition-colors group">
                                                    <td className="py-3 lg:py-4 px-3 lg:px-6 font-medium text-foreground group-hover:text-primary transition-colors">
                                                        {result.course}
                                                    </td>
                                                    <td className="py-3 lg:py-4 px-3 lg:px-6 text-center text-muted-foreground">
                                                        {result.internal} <span className="text-[9px] lg:text-[10px] text-muted-foreground/50">/20</span>
                                                    </td>
                                                    <td className="py-3 lg:py-4 px-3 lg:px-6 text-center text-muted-foreground">
                                                        {result.external} <span className="text-[9px] lg:text-[10px] text-muted-foreground/50">/80</span>
                                                    </td>
                                                    <td className="py-3 lg:py-4 px-3 lg:px-6 text-center">
                                                        <div className="inline-flex items-center justify-center font-bold bg-secondary/30 px-2 lg:px-3 py-1 rounded-md min-w-[2.5rem] lg:min-w-[3rem]">
                                                            {result.marks}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 lg:py-4 px-3 lg:px-6 text-center">
                                                        <Badge
                                                            variant={
                                                                result.grade.startsWith('A') ? 'success' :
                                                                    result.grade.startsWith('B') ? 'info' :
                                                                        result.grade === 'F' ? 'destructive' : 'warning'
                                                            }
                                                            className="shadow-sm text-xs"
                                                        >
                                                            {result.grade}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-3 lg:py-4 px-3 lg:px-6 text-muted-foreground italic text-[10px] lg:text-xs">
                                                        {result.remarks === '-' ? 'Satisfactory' : result.remarks}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center p-12 md:p-24 text-center space-y-6 animate-in fade-in duration-700">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                        <div className="relative bg-background p-6 rounded-full border border-border shadow-sm">
                            <Award className="w-12 h-12 text-muted-foreground/50" />
                        </div>
                    </div>
                    <div className="max-w-md space-y-2">
                        <h3 className="text-2xl font-semibold tracking-tight">No Published Results</h3>
                        <p className="text-muted-foreground">
                            Your exam results have not been published by your class teacher yet. Please check back later.
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => queryClient.invalidateQueries({ queryKey: ['student-grades-view'] })}
                        className="gap-2"
                    >
                        <Loader2 className="w-4 h-4" /> Refresh Status
                    </Button>
                </div>
            )}
        </StudentLayout>
    );
}
