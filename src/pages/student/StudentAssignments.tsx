import { supabase } from '@/lib/supabase';
import { StudentLayout } from '@/layouts/StudentLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { AssignmentCard } from '@/components/cards/AssignmentCard';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/TranslationContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useState } from 'react';
import { Upload, Loader2, FileX } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, isAfter, parseISO } from 'date-fns';

export function StudentAssignments() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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

  // 2. Fetch Assignments & Submissions
  const { data: assignmentsData, isLoading: assignmentsLoading } = useQuery({
    queryKey: ['student-assignments-view', studentProfile?.id, studentProfile?.class_id, studentProfile?.section],
    queryFn: async () => {
      if (!studentProfile) return { pending: [], submitted: [], graded: [], overdue: [] };

      // Get all assignments for this class/section
      const { data: assignments, error: assignmentsError } = await supabase
        .from('assignments')
        .select(`
          *,
          subjects:subject_id (name),
          profiles:teacher_id (full_name)
        `)
        .or(`class_id.eq.${studentProfile.class_id},class_name.eq.${studentProfile.class_name}`)
        .filter('institution_id', 'eq', studentProfile.institution_id);

      if (assignmentsError) throw assignmentsError;

      // Get student's submissions
      const { data: submissions, error: submissionsError } = await supabase
        .from('assignment_submissions')
        .select('*')
        .eq('student_id', studentProfile.id);

      if (submissionsError) throw submissionsError;

      const now = new Date();

      const processed = (assignments || []).map(a => {
        const submission = (submissions || []).find(s => s.assignment_id === a.id || s.assignment_id === a.title);
        const dueDate = a.due_date ? parseISO(a.due_date) : null;
        const isOverdue = dueDate ? isAfter(now, dueDate) && !submission : false;

        let status: 'pending' | 'submitted' | 'graded' | 'overdue' = 'pending';
        if (submission) {
          status = submission.status === 'graded' ? 'graded' : 'submitted';
        } else if (isOverdue) {
          status = 'overdue';
        }

        return {
          ...a,
          course: a.subjects?.name || a.subject || 'General',
          instructor: a.profiles?.full_name || 'Faculty',
          dueDate: a.due_date ? format(parseISO(a.due_date), 'MMM dd, yyyy') : 'No Due Date',
          status,
          grade: submission?.grade,
          maxGrade: submission?.max_grade || '100',
          submissionId: submission?.id
        };
      });

      return {
        pending: processed.filter(a => a.status === 'pending'),
        submitted: processed.filter(a => a.status === 'submitted'),
        graded: processed.filter(a => a.status === 'graded'),
        overdue: processed.filter(a => a.status === 'overdue'),
      };
    },
    enabled: !!studentProfile,
  });

  const handleSubmitClick = (assignment: any) => {
    setSelectedAssignment(assignment);
    setSelectedFile(null);
    setIsSubmitOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmitConfirm = async () => {
    if (!selectedFile || !selectedAssignment || !studentProfile) {
      toast.error("Required data missing.");
      return;
    }

    setIsUploading(true);
    try {
      // 1. Upload File
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${studentProfile.id}/${Date.now()}-${selectedAssignment.title.replace(/\s+/g, '-')}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('assignments')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // 2. Insert Submission Record
      const { error: dbError } = await supabase
        .from('assignment_submissions')
        .insert({
          assignment_id: selectedAssignment.id,
          student_id: studentProfile.id,
          student_name: studentProfile.name,
          file_path: fileName,
          file_name: selectedFile.name,
          submitted_at: new Date().toISOString(),
          status: 'submitted'
        });

      if (dbError) throw dbError;

      // 3. Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['student-assignments-view'] });

      toast.success("Assignment submitted successfully!");
      setIsSubmitOpen(false);
    } catch (error: any) {
      console.error('Submission error:', error);
      toast.error(`Failed to submit: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRequestExtension = () => {
    toast.success("Extension request sent to staff!");
  };

  if (profileLoading || assignmentsLoading) {
    return (
      <StudentLayout>
        <PageHeader title={t.nav.assignments} subtitle="Loading your assignments..." />
        <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>
      </StudentLayout>
    );
  }

  const assignments = assignmentsData || { pending: [], submitted: [], graded: [], overdue: [] };

  return (
    <StudentLayout>
      <PageHeader
        title={t.nav.assignments}
        subtitle={t.dashboard.overview}
      />

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="pending">Pending ({assignments.pending.length})</TabsTrigger>
          <TabsTrigger value="submitted">Submitted ({assignments.submitted.length})</TabsTrigger>
          <TabsTrigger value="graded">Graded ({assignments.graded.length})</TabsTrigger>
          <TabsTrigger value="overdue">Overdue ({assignments.overdue.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {assignments.pending.length > 0 ? (
            assignments.pending.map((assignment, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="flex-1">
                  <AssignmentCard {...assignment} />
                </div>
                <Button className="btn-primary" onClick={() => handleSubmitClick(assignment)}>{t.common.submit}</Button>
              </div>
            ))
          ) : (
            <div className="text-center py-10 bg-muted/30 rounded-xl border border-dashed">
              <p className="text-muted-foreground">No pending assignments</p>
            </div>
          )}

          <Dialog open={isSubmitOpen} onOpenChange={setIsSubmitOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Submit Assignment</DialogTitle>
                <DialogDescription>
                  Upload your work for {selectedAssignment?.title}.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="file">Assignment File (Photo/PDF)</Label>
                  <Input
                    id="file"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsSubmitOpen(false)} disabled={isUploading}>Cancel</Button>
                <Button onClick={handleSubmitConfirm} disabled={isUploading}>
                  {isUploading ? 'Uploading...' : 'Submit'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="submitted" className="space-y-4">
          {assignments.submitted.length > 0 ? (
            assignments.submitted.map((assignment, index) => (
              <AssignmentCard key={index} {...assignment} />
            ))
          ) : (
            <div className="text-center py-10 bg-muted/30 rounded-xl border border-dashed">
              <p className="text-muted-foreground">No submitted assignments</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="graded" className="space-y-4">
          {assignments.graded.length > 0 ? (
            assignments.graded.map((assignment, index) => (
              <AssignmentCard key={index} {...assignment} />
            ))
          ) : (
            <div className="text-center py-10 bg-muted/30 rounded-xl border border-dashed">
              <p className="text-muted-foreground">No graded assignments yet</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="overdue" className="space-y-4">
          {assignments.overdue.length > 0 ? (
            assignments.overdue.map((assignment, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="flex-1">
                  <AssignmentCard {...assignment} />
                </div>
                <Button variant="outline" onClick={handleRequestExtension}>Request Extension</Button>
              </div>
            ))
          ) : (
            <div className="text-center py-10 bg-muted/30 rounded-xl border border-dashed">
              <p className="text-muted-foreground">No overdue assignments</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </StudentLayout>
  );
}
