import { useState, useEffect } from 'react';
import { FacultyLayout } from '@/layouts/FacultyLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import {
    Save,
    CheckCircle,
    Eye,
    ArrowLeft,
    ShieldCheck
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { MarksEntryWizard } from './components/MarksEntryWizard';
import { StudentMarksCard } from './components/StudentMarksCard';
import { MarksEntryModal } from './components/MarksEntryModal';
import { ClassMarksReview } from './components/ClassMarksReview';
import { AllSubjectMarksModal } from './components/AllSubjectMarksModal';

type ViewMode = 'ENTRY' | 'REVIEW' | 'CLASS_TEACHER';
type MarkStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'PUBLISHED';

export function FacultyMarks() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // Selection State
    const [selectedExam, setSelectedExam] = useState<string>('');
    const [selectedSubject, setSelectedSubject] = useState<string>('');
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [selectedSection, setSelectedSection] = useState<string>('');

    // Debug: Track selectedExam changes
    useEffect(() => {
        console.log('selectedExam changed to:', selectedExam, 'Stack:', new Error().stack);
    }, [selectedExam]);

    // UI State
    const [viewMode, setViewMode] = useState<ViewMode>('ENTRY');
    const [showStudents, setShowStudents] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Marks State
    const [marksData, setMarksData] = useState<Record<string, { internal: number, external: number, id?: string, status?: string }>>({});
    const [selectedStudentForMarks, setSelectedStudentForMarks] = useState<any | null>(null);
    const [isMarksModalOpen, setIsMarksModalOpen] = useState(false);

    // Class Teacher Review State
    const [reviewStudent, setReviewStudent] = useState<any | null>(null);
    const [isReviewOpen, setIsReviewOpen] = useState(false);

    // 1. Fetch Exam Types from exam_schedules
    const { data: exams = [] } = useQuery({
        queryKey: ['exam-types-list', user?.institutionId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('exam_schedules')
                .select('exam_type, exam_display_name')
                .eq('institution_id', user?.institutionId);

            if (error) {
                console.error('Error fetching exam types:', error);
                return [];
            }

            // Get unique exam types
            const uniqueExams = data?.reduce((acc: any[], curr) => {
                if (!acc.find(e => e.exam_type === curr.exam_type)) {
                    acc.push({
                        id: curr.exam_type, // Use exam_type as ID
                        name: curr.exam_display_name || curr.exam_type,
                        exam_type: curr.exam_type
                    });
                }
                return acc;
            }, []) || [];

            console.log('Fetched exam types:', uniqueExams);
            return uniqueExams;
        },
        enabled: !!user?.institutionId
    });

    // 2. Fetch Faculty Assignments (Primary source: faculty_subjects table)
    const { data: assignments = [] } = useQuery({
        queryKey: ['faculty-assignments', user?.id],
        queryFn: async () => {
            // First, try with joins
            let { data, error } = await supabase
                .from('faculty_subjects')
                .select(`
                    *,
                    subjects(name),
                    classes(class_name)
                `)
                .eq('faculty_profile_id', user?.id);

            // If join fails (likely classes table doesn't exist), fetch without joins
            if (error) {
                console.warn("Faculty_subjects join failed, fetching without joins:", error.message);

                const { data: basicData, error: basicError } = await supabase
                    .from('faculty_subjects')
                    .select('*')
                    .eq('faculty_profile_id', user?.id);

                if (basicError) {
                    console.error("Error fetching faculty_subjects:", basicError);
                    return [];
                }

                // Manually fetch subject names
                if (basicData && basicData.length > 0) {
                    const subjectIds = basicData.map((a: any) => a.subject_id).filter(Boolean);
                    const { data: subjects } = await supabase
                        .from('subjects')
                        .select('id, name')
                        .in('id', subjectIds);

                    // Map subject names back
                    data = basicData.map((assignment: any) => ({
                        ...assignment,
                        subjects: subjects?.find((s: any) => s.id === assignment.subject_id) || null
                    }));
                } else {
                    data = basicData;
                }
            }

            console.log("Faculty Assignments:", data);
            return data as any[];
        },
        enabled: !!user?.id
    });

    // 3. Fetch Staff Details (Fallback for subjects and class teacher role)
    const { data: staffDetails } = useQuery({
        queryKey: ['staff-details-marks', user?.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('staff_details')
                .select('*')
                .eq('profile_id', user?.id)
                .single();
            if (error) {
                console.error('Staff Details Fetch Error:', error);
                return null;
            }
            console.log("Staff Details:", data);
            return data;
        },
        enabled: !!user?.id
    });

    // 4. Fetch ALL subjects as ultimate fallback
    const { data: allInstitutionSubjects = [] } = useQuery({
        queryKey: ['all-subjects', user?.institutionId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('subjects')
                .select('name, class_name')
                .eq('institution_id', user?.institutionId);

            if (error) {
                console.error("Error fetching all subjects:", error);
                return [];
            }
            console.log("All Institution Subjects:", data);
            return data;
        },
        enabled: !!user?.institutionId
    });

    // 5. Fetch ALL classes for the institution
    const { data: allInstitutionClasses = [] } = useQuery({
        queryKey: ['all-classes', user?.institutionId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('students')
                .select('class_name, section')
                .eq('institution_id', user?.institutionId)
                .eq('is_active', true);

            if (error) {
                console.error("Error fetching all classes:", error);
                return [];
            }

            // Get unique class-section combinations
            const uniqueClasses = data?.reduce((acc: any[], curr) => {
                const exists = acc.find(
                    c => c.class_name === curr.class_name && c.section === curr.section
                );
                if (!exists) {
                    acc.push({
                        class_name: curr.class_name,
                        section: curr.section || 'A'
                    });
                }
                return acc;
            }, []) || [];

            console.log("All Institution Classes:", uniqueClasses);
            return uniqueClasses;
        },
        enabled: !!user?.institutionId
    });

    // 6. Fetch subjects from exam schedule entries based on selected exam, class, and section
    const { data: examScheduleData, isLoading: examSubjectsLoading } = useQuery({
        queryKey: ['exam-schedule-subjects', selectedExam, selectedClass, selectedSection, user?.institutionId],
        queryFn: async () => {
            if (!selectedExam || !selectedClass || !selectedSection) return { subjects: [], examScheduleId: null };

            console.log('🔍 Fetching subjects for:', {
                selectedExam,
                selectedClass,
                selectedSection,
                institutionId: user?.institutionId
            });

            // First, find the exam_schedule matching the criteria
            const { data: examSchedule, error: scheduleError } = await supabase
                .from('exam_schedules')
                .select('id, exam_type, class_id, section, exam_display_name')
                .eq('exam_type', selectedExam)
                .eq('class_id', selectedClass)
                .eq('section', selectedSection)
                .eq('institution_id', user?.institutionId)
                .maybeSingle();

            console.log('📋 Exam schedule query result:', { examSchedule, scheduleError });

            if (scheduleError) {
                console.error('❌ Error fetching exam schedule:', scheduleError);
                return { subjects: [], examScheduleId: null };
            }

            if (!examSchedule) {
                console.log('⚠️ No exam schedule found for:', { selectedExam, selectedClass, selectedSection });
                return { subjects: [], examScheduleId: null };
            }

            console.log('✅ Found exam schedule:', examSchedule);

            // Now fetch the subjects from exam_schedule_entries
            const { data: entries, error: entriesError } = await supabase
                .from('exam_schedule_entries')
                .select('subject, exam_schedule_id')
                .eq('exam_schedule_id', examSchedule.id);

            console.log('📚 Exam schedule entries result:', { entries, entriesError });

            if (entriesError) {
                console.error('❌ Error fetching exam schedule entries:', entriesError);
                return { subjects: [], examScheduleId: examSchedule.id };
            }

            // Get unique subjects
            const uniqueSubjects = Array.from(new Set(entries?.map(e => e.subject) || []));
            console.log('✨ Active subjects from exam schedule entries:', uniqueSubjects);
            return { subjects: uniqueSubjects, examScheduleId: examSchedule.id };
        },
        enabled: !!selectedExam && !!selectedClass && !!selectedSection && !!user?.institutionId
    });

    const examScheduleSubjects = examScheduleData?.subjects || [];
    const examScheduleId = examScheduleData?.examScheduleId;

    // Determine if user is a class teacher
    const isClassTeacher =
        assignments.some((a: any) => a.assignment_type === 'class_teacher') ||
        staffDetails?.role?.toLowerCase().includes('class teacher') ||
        staffDetails?.role?.toLowerCase().includes('class_teacher') ||
        staffDetails?.role?.toLowerCase().includes('admin');

    // Build comprehensive subject list with multiple fallbacks
    const facultySubjects = (() => {
        // Priority 1: From exam_schedule_entries when exam, class, and section are selected
        if (selectedExam && selectedClass && selectedSection && examScheduleSubjects.length > 0) {
            console.log("Using subjects from exam_schedule_entries:", examScheduleSubjects);
            return examScheduleSubjects;
        }

        // Priority 2: From faculty_subjects table
        const assignmentSubjects = assignments
            .filter((a: any) => a.assignment_type === 'subject_staff' && a.subjects?.name)
            .map((a: any) => a.subjects.name);

        if (assignmentSubjects.length > 0) {
            console.log("Using subjects from faculty_subjects:", assignmentSubjects);
            return Array.from(new Set(assignmentSubjects));
        }

        // Priority 3: From staff_details
        let staffSubjects: string[] = [];
        if (staffDetails?.subjects && Array.isArray(staffDetails.subjects)) {
            staffSubjects = [...staffDetails.subjects];
        }
        if (staffDetails?.subject_assigned && !staffSubjects.includes(staffDetails.subject_assigned)) {
            staffSubjects.push(staffDetails.subject_assigned);
        }

        if (staffSubjects.length > 0) {
            console.log("Using subjects from staff_details:", staffSubjects);
            return staffSubjects.filter(Boolean);
        }

        // Priority 4: All institution subjects (fallback for testing/admin)
        const allSubjectNames = Array.from(new Set(
            allInstitutionSubjects.map((s: any) => s.name).filter(Boolean)
        ));

        console.log("Using all institution subjects as fallback:", allSubjectNames);
        return allSubjectNames;
    })();


    // Removed auto-selection logic - user wants fully manual selection workflow

    // 5. Get ALL Classes/Sections from institution (not filtered by assignment)
    const classSections = (() => {
        // Use all classes from the institution context
        const allClasses = allInstitutionClasses.map((cls: any) => ({
            class_name: cls.class_name,
            section: cls.section || 'A'
        }));

        console.log("Using ALL institution classes for manual selection:", allClasses);
        return allClasses;
    })();

    // Add Class Teacher assigned class
    const classTeacherAssignment = assignments.find((a: any) => a.assignment_type === 'class_teacher');
    const teacherClass = classTeacherAssignment?.classes;
    const teacherClassName = Array.isArray(teacherClass) ? teacherClass[0]?.class_name : teacherClass?.class_name;

    // Clear selected subject when exam, class, or section changes
    // This forces the user to select from the exam schedule subjects
    useEffect(() => {
        setSelectedSubject('');
    }, [selectedExam, selectedClass, selectedSection]);

    // Removed auto-selection logic - user wants fully manual selection workflow

    // 6. Fetch Students and existing marks
    const { data: studentsData = [], isLoading: isLoadingStudents, error: studentsError } = useQuery({
        queryKey: ['marks-entry-students', selectedExam, selectedSubject, selectedClass, selectedSection],
        queryFn: async () => {
            if (!selectedExam || !selectedClass) return [];

            try {
                // Fetch students in class
                const { data: students, error: studentError } = await supabase
                    .from('students')
                    .select('id, name, register_number')
                    .eq('class_name', selectedClass)
                    .eq('section', selectedSection || 'A')
                    .eq('institution_id', user?.institutionId)
                    .eq('is_active', true)
                    .order('register_number', { ascending: true });

                if (studentError) {
                    console.error("Error fetching students:", studentError);
                    console.error("Query params:", { selectedClass, selectedSection, institutionId: user?.institutionId });
                    throw studentError;
                }

                // Fetch existing marks
                const subjectId = await getSubjectId(selectedSubject);
                const examId = await getExamId(selectedExam);

                const { data: existingMarks } = await supabase
                    .from('exam_results')
                    .select('*')
                    .eq('exam_id', examId)
                    .eq('subject_id', subjectId)
                    .in('student_id', students.map(s => s.id));

                // Sync marks to local state
                const initialMarks: any = {};
                existingMarks?.forEach(m => {
                    initialMarks[m.student_id] = {
                        id: m.id,
                        internal: Number(m.internal_marks || 0),
                        external: Number(m.external_marks || 0),
                        status: m.status
                    };
                });
                setMarksData(initialMarks);

                return students;
            } catch (error: any) {
                console.error("Error in studentsData query:", error);
                toast.error(error.message || "Failed to load students data");
                throw error;
            }
        },
        enabled: !!selectedExam && !!selectedClass && (viewMode !== 'CLASS_TEACHER'),
        retry: false
    });

    // Derived State for Progress
    const totalStudents = studentsData.length;
    const submittedCount = marksData ? Object.values(marksData).filter(m => m.status === 'SUBMITTED' || m.status === 'APPROVED' || m.status === 'PUBLISHED').length : 0;
    const progress = totalStudents > 0 ? (submittedCount / totalStudents) * 100 : 0;

    // Helper: Get Subject ID from Name
    const getSubjectId = async (name: string) => {
        const { data } = await supabase.from('subjects').select('id').eq('name', name).limit(1).single();
        return data?.id;
    };

    // Helper: Get Exam UUID from exam_type by querying exam_schedules table
    const getExamId = async (examIdentifier: string) => {
        // If it's already a UUID format, return it
        if (examIdentifier.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
            return examIdentifier;
        }

        // Query exam_schedules table by exam_type to get the UUID
        const { data, error } = await supabase
            .from('exam_schedules')
            .select('id')
            .eq('exam_type', examIdentifier)
            .eq('institution_id', user?.institutionId)
            .limit(1)
            .single();

        if (error) {
            console.error('Error fetching exam ID from exam_schedules:', error);
            throw new Error(`Exam schedule not found for type: ${examIdentifier}`);
        }

        return data?.id;
    };

    // --- Handlers ---

    const handleViewStudents = () => {
        setShowStudents(true);
        setViewMode('ENTRY');
    };

    const handleEnterMarks = (student: any) => {
        setSelectedStudentForMarks(student);
        setIsMarksModalOpen(true);
    };

    const handleMarksSubmit = async (studentId: string, marks: { internal: number; external: number; grade: string; remarks: string }) => {
        // Update marks data
        setMarksData(prev => ({
            ...prev,
            [studentId]: {
                ...marks,
                id: prev[studentId]?.id
            }
        }));

        // Save to database
        try {
            await saveMarksMutation.mutateAsync({ studentId, marks });
            setIsMarksModalOpen(false);
            setSelectedStudentForMarks(null);
        } catch (error) {
            console.error('Error saving marks:', error);
        }
    };

    const saveMarksMutation = useMutation({
        mutationFn: async ({ studentId, marks }: { studentId: string; marks: { internal: number; external: number; grade: string; remarks: string } }) => {
            setIsSubmitting(true);

            // Get actual UUIDs
            const subjectId = await getSubjectId(selectedSubject);
            const examId = await getExamId(selectedExam);

            if (!subjectId) {
                throw new Error(`Subject ID not found for: ${selectedSubject}`);
            }

            const existingRecord = marksData[studentId];
            const record: any = {
                exam_id: examId,
                student_id: studentId,
                subject_id: subjectId,
                internal_marks: marks.internal,
                external_marks: marks.external,
                total_marks: marks.internal + marks.external,
                marks_obtained: marks.internal + marks.external,
                max_marks: 100,
                grade: marks.grade,
                remarks: marks.remarks,
                status: 'SUBMITTED',
                staff_id: user?.id,
                class_id: selectedClass,
                section: selectedSection || 'A'
            };

            // Only include id if it exists (for updates)
            if (existingRecord?.id) {
                record.id = existingRecord.id;
            }

            console.log("Upserting record:", record);

            const { data: result, error } = await supabase
                .from('exam_results')
                .upsert([record], { onConflict: 'exam_id,student_id,subject_id' })
                .select()
                .single();

            if (error) {
                console.error("Upsert error:", error);
                console.error("Error details:", JSON.stringify(error, null, 2));
                throw error;
            }

            return result;
        },
        onSuccess: () => {
            toast.success('Marks saved successfully');
            queryClient.invalidateQueries({ queryKey: ['marks-entry-students'] });
            queryClient.invalidateQueries({ queryKey: ['class-marks-review'] });
            setIsSubmitting(false);
        },
        onError: (err: any) => {
            console.error("Save marks error:", err);
            toast.error("Failed to save marks: " + (err.message || 'Unknown error'));
            setIsSubmitting(false);
        }
    });

    // --- Class Teacher Logic ---

    // Determine target class for Class View
    const targetClass = teacherClassName || staffDetails?.class_assigned || selectedClass;
    const targetSection = classTeacherAssignment?.section || staffDetails?.section_assigned || selectedSection;

    // Fetch students for Class Teacher view
    const { data: classTeacherStudents = [] } = useQuery({
        queryKey: ['class-teacher-students', targetClass, targetSection],
        queryFn: async () => {
            if (!targetClass) return [];
            const { data, error } = await supabase
                .from('students')
                .select('*')
                .eq('class_name', targetClass)
                .eq('section', targetSection || 'A')
                .eq('institution_id', user?.institutionId)
                .eq('is_active', true)
                .order('register_number', { ascending: true });

            if (error) {
                console.error("Error fetching class teacher students:", error);
                return [];
            }
            return data || [];
        },
        enabled: viewMode === 'CLASS_TEACHER' && !!targetClass
    });

    // Fetch all results for the class
    const { data: classExamResults = [] } = useQuery({
        queryKey: ['class-marks-review', selectedExam, targetClass, targetSection],
        queryFn: async () => {
            if (!targetClass || !selectedExam) return [];

            const examId = await getExamId(selectedExam);
            if (!examId) return [];

            const { data, error } = await supabase
                .from('exam_results')
                .select(`
                    *,
                    subjects!subject_id(name)
                `)
                .eq('exam_id', examId)
                .eq('class_id', targetClass)
                .eq('section', targetSection || 'A');

            if (error) throw error;
            return data;
        },
        enabled: viewMode === 'CLASS_TEACHER' && !!selectedExam && !!targetClass
    });

    // Class teacher: Publish all results
    const publishAllResultsMutation = useMutation({
        mutationFn: async () => {
            const examId = await getExamId(selectedExam);

            // Update all exam results for this class to PUBLISHED
            const { error: updateError } = await supabase
                .from('exam_results')
                .update({ status: 'PUBLISHED' })
                .eq('exam_id', examId)
                .eq('class_id', targetClass)
                .eq('section', targetSection || 'A');

            if (updateError) throw updateError;

            // Get exam details for notification
            const exam = exams.find(e => e.id === selectedExam);
            const examDisplayName = exam?.name || selectedExam;

            console.log('📢 Starting notification creation for exam:', examDisplayName);
            console.log('👥 Total students to notify:', classTeacherStudents.length);

            // Send notifications to students and parents
            const studentIds = classTeacherStudents.map(s => s.id);

            // Create notifications for students and parents
            const studentNotifications = await Promise.all(
                studentIds.map(async (studentId) => {
                    try {
                        // Get student details including parent info and relation
                        const { data: student, error: studentError } = await supabase
                            .from('students')
                            .select('id, name, email, parent_id, parent_relation')
                            .eq('id', studentId)
                            .single();

                        if (studentError) {
                            console.error('❌ Error fetching student:', studentError);
                            return [];
                        }

                        if (!student) {
                            console.warn('⚠️ Student not found:', studentId);
                            return [];
                        }

                        console.log('👤 Processing student:', student.name, '| Email:', student.email);

                        const notifications = [];

                        // Get student's auth user ID from profiles table via email
                        if (student.email) {
                            const { data: studentProfile, error: profileError } = await supabase
                                .from('profiles')
                                .select('id, email, role')
                                .ilike('email', student.email.trim())
                                .maybeSingle();

                            if (profileError) {
                                console.error('❌ Error fetching student profile:', profileError);
                            } else if (studentProfile?.id) {
                                console.log('✅ Found student profile:', studentProfile.email, '| ID:', studentProfile.id);
                                notifications.push({
                                    user_id: studentProfile.id,
                                    title: 'Exam Results Published',
                                    message: `Your ${examDisplayName} results have been published. Click to view your grades.`,
                                    type: 'exam_result',
                                    action_url: '/student/grades',
                                    read: false
                                });
                            } else {
                                console.warn('⚠️ No profile found for student email:', student.email);
                            }
                        } else {
                            console.warn('⚠️ Student has no email:', student.name);
                        }

                        // Parent notification without redirect
                        if (student?.parent_id) {
                            console.log('👨‍👩‍👧 Found parent ID:', student.parent_id);
                            // Map parent_relation to proper child reference
                            let relation = 'child';
                            if (student.parent_relation) {
                                const rel = student.parent_relation.toLowerCase();
                                if (rel === 'father' || rel === 'mother') {
                                    relation = 'son/daughter';
                                } else if (rel === 'son' || rel === 'daughter') {
                                    relation = rel;
                                } else {
                                    relation = 'child';
                                }
                            }
                            notifications.push({
                                user_id: student.parent_id,
                                title: 'Exam Results Published',
                                message: `Results for ${examDisplayName} for your ${relation} ${student.name} have been published.`,
                                type: 'exam_result',
                                action_url: null,
                                read: false
                            });
                        } else {
                            console.warn('⚠️ No parent_id for student:', student.name);
                        }

                        console.log(`📨 Created ${notifications.length} notification(s) for ${student.name}`);
                        return notifications;
                    } catch (error) {
                        console.error('❌ Error processing student notifications:', error);
                        return [];
                    }
                })
            );

            const allNotifications = studentNotifications.flat().filter(Boolean);
            console.log('📬 Total notifications to insert:', allNotifications.length);
            console.log('📋 Notifications:', JSON.stringify(allNotifications, null, 2));

            if (allNotifications.length > 0) {
                const { data: insertedNotifs, error: notifError } = await supabase
                    .from('notifications')
                    .insert(allNotifications)
                    .select();

                if (notifError) {
                    console.error('❌ Error creating notifications:', notifError);
                    toast.error('Failed to send notifications: ' + notifError.message);
                } else {
                    console.log('✅ Successfully inserted notifications:', insertedNotifs?.length);
                }
            } else {
                console.warn('⚠️ No notifications to send!');
            }
        },
        onSuccess: () => {
            toast.success("Results published successfully! Notifications sent to students and parents.");
            queryClient.invalidateQueries({ queryKey: ['class-marks-review'] });
            setIsReviewOpen(false);
            setReviewStudent(null);
        },
        onError: (err: any) => {
            toast.error("Failed to publish results: " + (err.message || 'Unknown error'));
        }
    });

    // Delete subject mutation (soft delete)
    const deleteSubjectMutation = useMutation({
        mutationFn: async ({ subject, examScheduleId }: { subject: string; examScheduleId: string }) => {
            const { error } = await supabase
                .from('exam_schedule_entries')
                .update({
                    is_active: false,
                    deleted_at: new Date().toISOString(),
                    deleted_by: user?.id
                })
                .eq('exam_schedule_id', examScheduleId)
                .eq('subject', subject);

            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Subject deleted successfully");
            queryClient.invalidateQueries({ queryKey: ['exam-schedule-subjects'] });
        },
        onError: (err: any) => {
            toast.error("Failed to delete subject: " + (err.message || 'Unknown error'));
        }
    });

    // --- Render ---

    return (
        <FacultyLayout>
            <PageHeader
                title="Marks Entry"
                subtitle={viewMode === 'CLASS_TEACHER' ? "Review and approve class performance" : "Enter and manage subject marks"}
                actions={
                    <div className="flex gap-2">
                        <Button
                            variant={viewMode === 'CLASS_TEACHER' ? "default" : "outline"}
                            onClick={() => setViewMode(viewMode === 'CLASS_TEACHER' ? 'ENTRY' : 'CLASS_TEACHER')}
                            className="flex items-center gap-2"
                            disabled={!classTeacherAssignment && !staffDetails?.class_assigned && !selectedClass}
                        >
                            <ShieldCheck className="w-4 h-4" />
                            {viewMode === 'CLASS_TEACHER' ? "Back to Entry" : "Class Marks"}
                        </Button>
                    </div>
                }
            />

            <div className="space-y-6">
                {/* Wizard or Class Teacher View */}
                {viewMode === 'CLASS_TEACHER' ? (
                    <div className="dashboard-card overflow-hidden p-6">
                        <ClassMarksReview
                            students={classTeacherStudents}
                            examResults={classExamResults}
                            onCheckMarks={(student) => {
                                setReviewStudent(student);
                                setIsReviewOpen(true);
                            }}
                            onPublishAll={() => publishAllResultsMutation.mutate()}
                            isPublishing={publishAllResultsMutation.isPending}
                        />
                    </div>
                ) : (
                    <>
                        <MarksEntryWizard
                            exams={exams}
                            selectedExam={selectedExam}
                            onExamChange={(examId) => {
                                console.log('onExamChange called with:', examId, 'from:', new Error().stack);
                                setSelectedExam(examId);
                                setShowStudents(false);
                            }}
                            facultySubjects={facultySubjects}
                            selectedSubject={selectedSubject}
                            onSubjectChange={(subject) => {
                                setSelectedSubject(subject);
                                setShowStudents(false);
                            }}
                            classSections={classSections}
                            selectedClass={selectedClass}
                            onClassChange={(className) => {
                                setSelectedClass(className);
                                setShowStudents(false);
                            }}
                            selectedSection={selectedSection}
                            onSectionChange={(section) => {
                                setSelectedSection(section);
                                setShowStudents(false);
                            }}
                            onViewStudents={handleViewStudents}
                        />

                        {/* Students Grid View */}
                        {showStudents && studentsData.length > 0 && (
                            <div className="dashboard-card p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold">Students - {selectedClass} {selectedSection}</h3>
                                        <p className="text-sm text-muted-foreground">Enter marks for {selectedSubject}</p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowStudents(false)}
                                    >
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Back to Selection
                                    </Button>
                                </div>

                                {isLoadingStudents ? (
                                    <div className="flex justify-center py-20">
                                        <div className="text-center">
                                            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                                            <p className="text-muted-foreground">Loading students...</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {studentsData.map(student => {
                                            const studentMarks = marksData[student.id];
                                            return (
                                                <StudentMarksCard
                                                    key={student.id}
                                                    student={student}
                                                    marksStatus={studentMarks?.status as any}
                                                    onEnterMarks={() => handleEnterMarks(student)}
                                                    onViewStatus={() => {
                                                        // Show status info
                                                        if (studentMarks) {
                                                            toast.info(`Status: ${studentMarks.status || 'Not Started'}`);
                                                        } else {
                                                            toast.info('Status: Not Started');
                                                        }
                                                    }}
                                                />
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {showStudents && studentsData.length === 0 && !isLoadingStudents && (
                            <div className="dashboard-card p-12 text-center">
                                <p className="text-muted-foreground">No students found in this class and section.</p>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Marks Entry Modal */}
            <MarksEntryModal
                isOpen={isMarksModalOpen}
                onClose={() => {
                    setIsMarksModalOpen(false);
                    setSelectedStudentForMarks(null);
                }}
                student={selectedStudentForMarks}
                subject={selectedSubject}
                existingMarks={selectedStudentForMarks ? marksData[selectedStudentForMarks.id] : undefined}
                onSubmit={handleMarksSubmit}
                isSubmitting={isSubmitting}
            />

            {/* All Subject Marks Modal (for class teacher) */}
            <AllSubjectMarksModal
                isOpen={isReviewOpen}
                onClose={() => {
                    setIsReviewOpen(false);
                    setReviewStudent(null);
                }}
                student={reviewStudent}
                examResults={classExamResults}
            />

        </FacultyLayout>
    );

}
