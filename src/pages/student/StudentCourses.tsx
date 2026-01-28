import { StudentLayout } from '@/layouts/StudentLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { SubjectCard } from '@/components/cards/SubjectCard';
import { useTranslation } from '@/i18n/TranslationContext';
import { useStudentDashboard } from '@/hooks/useStudentDashboard';
import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/skeleton';

export function StudentCourses() {
  const { t } = useTranslation();
  const { user } = useAuth();

  // Fetch Student Profile to get institution_id
  const { data: studentProfile } = useQuery({
    queryKey: ['student-profile', user?.id],
    queryFn: async () => {
      if (!user?.email) return null;
      const { data } = await supabase
        .from('students')
        .select('*')
        .ilike('email', user.email.trim())
        .maybeSingle();
      return data;
    },
    enabled: !!user?.email,
  });

  const { subjects, isLoading } = useStudentDashboard(
    studentProfile?.id,
    studentProfile?.institution_id
  );

  return (
    <StudentLayout>
      <PageHeader
        title={t.nav.courses}
        subtitle={t.dashboard.overview}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[200px] w-full rounded-xl" />
          ))}
        </div>
      ) : subjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {subjects.map((subject: any) => (
            <SubjectCard key={subject.id} {...subject} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No subjects assigned yet.</p>
        </div>
      )}
    </StudentLayout>
  );
}
