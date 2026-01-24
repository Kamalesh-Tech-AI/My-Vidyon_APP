import { useState, useEffect } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { InstitutionCard } from '@/components/cards/InstitutionCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, ChevronDown, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import Loader from '@/components/common/Loader';
import { useMinimumLoadingTime } from '@/hooks/useMinimumLoadingTime';

export function AdminInstitutions() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: institutions = [], isLoading } = useQuery({
    queryKey: ['admin-institutions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('institutions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch counts for each institution
      const institutionsWithCounts = await Promise.all(
        (data || []).map(async (inst) => {
          // Get students count
          const { count: studentsCount } = await supabase
            .from('students')
            .select('id', { count: 'exact', head: true })
            .eq('institution_id', inst.institution_id);

          // Get staff count - check both profiles and staff_details tables
          const [profilesStaffResult, staffDetailsResult] = await Promise.all([
            supabase
              .from('profiles')
              .select('id', { count: 'exact', head: true })
              .eq('institution_id', inst.institution_id)
              .eq('role', 'faculty'),
            supabase
              .from('staff_details')
              .select('id', { count: 'exact', head: true })
              .eq('institution_id', inst.institution_id)
          ]);

          // Use whichever table has more records
          const staffCount = Math.max(
            profilesStaffResult.count || 0,
            staffDetailsResult.count || 0
          );

          return {
            ...inst,
            studentsCount: studentsCount || 0,
            staffCount: staffCount || 0,
          };
        })
      );

      return institutionsWithCounts;
    },
    staleTime: 3 * 60 * 1000, // Data stays fresh for 3 minutes
    gcTime: 10 * 60 * 1000, // Cache persists for 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Use cached data on mount
  });

  // Ensure loader displays for minimum 2 seconds for institutions
  const showLoader = useMinimumLoadingTime(isLoading, 500);

  useEffect(() => {
    const channel = supabase
      .channel('admin-institutions-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'institutions' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-institutions'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-institutions'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-institutions'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'staff_details' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-institutions'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const handleAddInstitution = () => {
    navigate('/admin/add-institution');
  };

  const handleDeleteInstitution = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"? This will move it to the Deleted tab.`)) {
      try {
        const { error } = await supabase
          .from('institutions')
          .update({ status: 'deleted' })
          .eq('id', id);

        if (error) throw error;
        toast.success('Institution moved to Deleted');
        queryClient.invalidateQueries({ queryKey: ['admin-institutions'] });
      } catch (error: any) {
        toast.error('Failed to delete institution: ' + error.message);
      }
    }
  };

  const handleToggleStatus = async (id: string, name: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'inactive' ? 'deactivate' : 'activate';

    if (window.confirm(`Are you sure you want to ${action} "${name}"?`)) {
      try {
        const { error } = await supabase
          .from('institutions')
          .update({ status: newStatus })
          .eq('id', id);

        if (error) throw error;
        toast.success(`Institution ${action}d successfully`);
        queryClient.invalidateQueries({ queryKey: ['admin-institutions'] });
      } catch (error: any) {
        toast.error(`Failed to ${action} institution: ` + error.message);
      }
    }
  };

  const filteredInstitutions = institutions.filter(inst => {
    // Search filter
    return inst.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inst.institution_id.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const activeInstitutions = filteredInstitutions.filter(i => i.status === 'active');
  const inactiveInstitutions = filteredInstitutions.filter(i => i.status === 'inactive');
  const deletedInstitutions = filteredInstitutions.filter(i => i.status === 'deleted');


  return (
    <AdminLayout>
      <PageHeader
        title="Institution Management"
        subtitle="Manage and monitor all registered institutions"
        actions={
          <Button
            className="btn-primary flex items-center gap-2"
            onClick={handleAddInstitution}
          >
            <Plus className="w-4 h-4" />
            Add Institution
          </Button>
        }
      />

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search institutions..."
            className="input-field pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

      </div>

      {showLoader ? (
        <Loader fullScreen={false} />
      ) : (
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="active">Active ({activeInstitutions.length})</TabsTrigger>
            <TabsTrigger value="inactive">Inactive ({inactiveInstitutions.length})</TabsTrigger>
            <TabsTrigger value="deleted">Deleted ({deletedInstitutions.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {activeInstitutions.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/20">
                <p className="text-muted-foreground">No active institutions found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {activeInstitutions.map((inst) => (
                  <InstitutionCard
                    key={inst.id}
                    id={inst.id}
                    name={inst.name}
                    code={inst.institution_id}
                    location={`${inst.city || ''}${inst.state ? `, ${inst.state}` : ''}`}
                    students={inst.studentsCount || 0}
                    faculty={inst.staffCount || 0}
                    status={inst.status as any}
                    type={inst.type}
                    logoUrl={inst.logo_url}
                    onClick={() => navigate(`/admin/institutions/${inst.institution_id}`)}
                    onEdit={() => navigate(`/admin/add-institution?mode=edit&id=${inst.institution_id}`)}
                    onToggleStatus={() => handleToggleStatus(inst.id, inst.name, inst.status)}
                    onDelete={() => handleDeleteInstitution(inst.id, inst.name)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="inactive">
            {inactiveInstitutions.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">No inactive institutions</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {inactiveInstitutions.map((inst) => (
                  <InstitutionCard
                    key={inst.id}
                    id={inst.id}
                    name={inst.name}
                    code={inst.institution_id}
                    location={`${inst.city || ''}${inst.state ? `, ${inst.state}` : ''}`}
                    students={inst.studentsCount || 0}
                    faculty={inst.staffCount || 0}
                    status={inst.status as any}
                    type={inst.type}
                    logoUrl={inst.logo_url}
                    onClick={() => navigate(`/admin/institutions/${inst.institution_id}`)}
                    onEdit={() => navigate(`/admin/add-institution?mode=edit&id=${inst.institution_id}`)}
                    onToggleStatus={() => handleToggleStatus(inst.id, inst.name, inst.status)}
                    onDelete={() => handleDeleteInstitution(inst.id, inst.name)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="deleted">
            {deletedInstitutions.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">No deleted institutions</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {deletedInstitutions.map((inst) => (
                  <InstitutionCard
                    key={inst.id}
                    id={inst.id}
                    name={inst.name}
                    code={inst.institution_id}
                    location={`${inst.city || ''}${inst.state ? `, ${inst.state}` : ''}`}
                    students={inst.studentsCount || 0}
                    faculty={inst.staffCount || 0}
                    status={inst.status as any}
                    type={inst.type}
                    logoUrl={inst.logo_url}
                    onClick={() => navigate(`/admin/institutions/${inst.institution_id}`)}
                    onEdit={() => navigate(`/admin/add-institution?mode=edit&id=${inst.institution_id}`)}
                    onToggleStatus={() => handleToggleStatus(inst.id, inst.name, inst.status)}
                    onDelete={() => handleDeleteInstitution(inst.id, inst.name)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </AdminLayout>
  );
}
