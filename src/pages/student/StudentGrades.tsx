import { useState, useEffect } from 'react';
import { StudentLayout } from '@/layouts/StudentLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Badge } from '@/components/common/Badge';
import { useTranslation } from '@/i18n/TranslationContext';
import { TrendingUp, Award, FileSpreadsheet, Loader2 } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function StudentGrades() {
    const { t } = useTranslation();
    const { user } = useAuth();
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

    // 2. Fetch Exam Results
    const { data: results = [], isLoading: resultsLoading } = useQuery({
        queryKey: ['student-grades-view', studentProfile?.id],
        queryFn: async () => {
            if (!studentProfile?.id) return [];

            const { data, error } = await supabase
                .from('exam_results')
                .select(`
                    *,
                    exams:exam_id (id, exam_display_name, exam_type),
                    subjects:subject_id (name)
                `)
                .eq('student_id', studentProfile.id);

            if (error) throw error;
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
                title: result.exams?.exam_display_name || 'Generic Exam',
                results: [],
                totalMarks: 0,
                obtainedMarks: 0
            };
        }
        acc[examId].results.push({
            course: result.subjects?.name || 'Subject',
            marks: Number(result.marks_obtained),
            total: Number(result.max_marks),
            grade: result.grade || 'N/A',
            remarks: result.remarks || '-'
        });
        acc[examId].totalMarks += Number(result.max_marks);
        acc[examId].obtainedMarks += Number(result.marks_obtained);
        return acc;
    }, {});

    const examsList = Object.values(examsMap) as any[];

    // Set default selected exam once data is loaded
    useEffect(() => {
        if (examsList.length > 0 && !selectedExam) {
            setSelectedExam(examsList[0].id);
        }
    }, [examsList, selectedExam]);

    const currentExamData = examsMap[selectedExam];
    const percentage = currentExamData
        ? ((currentExamData.obtainedMarks / currentExamData.totalMarks) * 100).toFixed(1) + '%'
        : '0%';

    const isLoading = profileLoading || resultsLoading;

    if (isLoading) {
        return (
            <StudentLayout>
                <PageHeader title="Exam Results" subtitle="Loading results..." />
                <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>
            </StudentLayout>
        );
    }

    return (
        <StudentLayout>
            <PageHeader
                title="Exam Results"
                subtitle="View your performance across different assessments"
            />

            {examsList.length > 0 ? (
                <>
                    {/* Exam Selector */}
                    <div className="dashboard-card mb-6 p-6">
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                            <div className="flex-1">
                                <Label className="mb-2 block">Select Examination</Label>
                                <Select value={selectedExam} onValueChange={setSelectedExam}>
                                    <SelectTrigger className="w-full md:w-[300px]">
                                        <div className="flex items-center gap-2">
                                            <FileSpreadsheet className="w-4 h-4 text-muted-foreground" />
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
                            {currentExamData && (
                                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg border border-border/50">
                                    <div className="p-2 bg-primary/10 rounded-full">
                                        <Award className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Overall Percentage</p>
                                        <p className="text-2xl font-bold text-primary">{percentage}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Results Table */}
                    {currentExamData && (
                        <div className="dashboard-card">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-semibold text-lg">{currentExamData.title} Result</h3>
                                <Badge variant="outline">
                                    {currentExamData.results.length} Subjects
                                </Badge>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-border">
                                            <th className="table-header text-left">Subject</th>
                                            <th className="table-header text-center">Marks Obtained</th>
                                            <th className="table-header text-center">Total Marks</th>
                                            <th className="table-header text-center">Grade</th>
                                            <th className="table-header text-left">Remarks</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentExamData.results.map((result: any, index: number) => (
                                            <tr key={index} className="border-b border-border hover:bg-muted/50 transition-colors">
                                                <td className="table-cell font-medium">{result.course}</td>
                                                <td className="table-cell text-center font-semibold">{result.marks}</td>
                                                <td className="table-cell text-center text-muted-foreground">{result.total}</td>
                                                <td className="table-cell text-center">
                                                    <Badge variant={result.grade.startsWith('A') ? 'success' : result.grade.startsWith('B') ? 'info' : 'warning'}>
                                                        {result.grade}
                                                    </Badge>
                                                </td>
                                                <td className="table-cell text-muted-foreground text-sm">{result.remarks}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="dashboard-card p-12 text-center">
                    <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                    <p className="text-muted-foreground">No exam results published yet.</p>
                </div>
            )}
        </StudentLayout>
    );
}
