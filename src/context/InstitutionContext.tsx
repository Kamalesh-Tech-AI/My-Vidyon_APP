import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

// Type definitions
export interface StaffMember {
    id: string;
    name: string;
    classes: string[];
}

export interface Subject {
    id: string;
    name: string;
    code?: string;
    department?: string;
    staff: StaffMember[];
}

// Assignments structure: ClassID (UUID) -> Section (String) -> SubjectID (UUID) -> List of Staff IDs
type AssignmentsMap = Record<string, Record<string, Record<string, string[]>>>;
// Class Teacher structure: ClassID (UUID) -> Section (String) -> TeacherID
type ClassTeacherMap = Record<string, Record<string, string>>;

export interface InstitutionContextType {
    subjects: Subject[];
    allSubjects: { id: string; name: string; code?: string; department?: string }[];
    allStaffMembers: { id: string; name: string; department?: string }[];
    allClasses: { id: string; name: string; section: string }[];

    getAssignedStaff: (classId: string, section: string, subjectId: string) => { id: string; name: string }[];
    assignStaff: (classId: string, section: string, subjectId: string, staffIds: string[]) => Promise<void>;

    getClassTeacher: (classId: string, section: string) => string | undefined;
    assignClassTeacher: (classId: string, section: string, teacherId: string) => Promise<void>;
    classTeachers: ClassTeacherMap;

    // Legacy/Deprecated compatibility
    addStaffToSubject: (subjectId: string, staff: StaffMember) => void;
    removeStaffFromSubject: (subjectId: string, staffId: string) => void;
    refreshData: () => Promise<void>;
}

const InstitutionContext = createContext<InstitutionContextType | undefined>(undefined);

export function InstitutionProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [assignments, setAssignments] = useState<AssignmentsMap>({});
    const [classTeachers, setClassTeachers] = useState<ClassTeacherMap>({});
    const [allSubjectsList, setAllSubjectsList] = useState<{ id: string; name: string; code?: string; department?: string }[]>([]);
    const [allStaffMembers, setAllStaffMembers] = useState<{ id: string; name: string; department?: string }[]>([]);
    const [allClasses, setAllClasses] = useState<{ id: string; name: string; section: string }[]>([]);
    const [loading, setLoading] = useState(true);

    const institutionId = user?.institutionId;

    const fetchData = useCallback(async () => {
        if (!institutionId) return;
        setLoading(true);
        try {
            // 1. Fetch Subjects
            const { data: subjectsData } = await supabase
                .from('subjects')
                .select('*')
                .eq('institution_id', institutionId)
                .order('name');
            setAllSubjectsList(subjectsData || []);

            // 2. Fetch Staff (Profiles with roles) & Staff Details (for department)
            const { data: staffProfiles } = await supabase
                .from('profiles')
                .select('id, full_name, role')
                .eq('institution_id', institutionId)
                .in('role', ['faculty', 'teacher', 'admin', 'support']);

            const { data: staffDetails } = await supabase
                .from('staff_details')
                .select('profile_id, department')
                .eq('institution_id', institutionId);

            const staffMap = new Map();
            staffDetails?.forEach((d: any) => staffMap.set(d.profile_id, d.department));

            setAllStaffMembers(staffProfiles?.map(s => ({
                id: s.id,
                name: s.full_name || 'Unknown',
                department: staffMap.get(s.id) || null
            })) || []);

            // 3. Fetch Classes (for Class Teachers and structure)
            // 3. Fetch Classes (via Groups to ensure correct path)
            // The classes table doesn't strictly have institution_id populated in all code paths (like AddInstitution)
            // and uses 'sections' (array) not 'section' (string).
            let fetchedClasses: { id: string; name: string; section: string; classTeacherId?: string }[] = [];

            try {
                const { data: groupsData, error: groupsError } = await supabase
                    .from('groups')
                    .select('id, classes(id, name, sections, class_teacher_id)')
                    .eq('institution_id', institutionId);

                if (groupsError) throw groupsError;

                if (groupsData) {
                    groupsData.forEach(g => {
                        if (g.classes) {
                            (g.classes as any[]).forEach(c => {
                                const sections = Array.isArray(c.sections) ? c.sections : [c.sections]; // Handle array or single
                                sections.forEach((sec: string) => {
                                    if (sec) {
                                        fetchedClasses.push({
                                            id: c.id,
                                            name: c.name,
                                            section: sec,
                                            classTeacherId: c.class_teacher_id
                                        });
                                    }
                                });
                            });
                        }
                    });
                }
            } catch (err) {
                console.error("InstitutionContext: Error fetching classes via groups:", err);
            }

            console.log("InstitutionContext: Processed allClasses:", fetchedClasses);
            setAllClasses(fetchedClasses.map((c) => ({ id: c.id, name: c.name, section: c.section })));

            // Build ClassTeacherMap
            const newClassTeacherMap: ClassTeacherMap = {};
            fetchedClasses.forEach(c => {
                if (c.classTeacherId) {
                    if (!newClassTeacherMap[c.id]) newClassTeacherMap[c.id] = {};
                    newClassTeacherMap[c.id][c.section] = c.classTeacherId;
                }
            });
            setClassTeachers(newClassTeacherMap);

            // 4. Fetch Assignments (Faculty Subjects)
            const { data: assignmentsData } = await supabase
                .from('faculty_subjects')
                .select('*')
                .eq('institution_id', institutionId);

            const newAssignments: AssignmentsMap = {};
            assignmentsData?.forEach(a => {
                if (!newAssignments[a.class_id]) newAssignments[a.class_id] = {};
                if (!newAssignments[a.class_id][a.section]) newAssignments[a.class_id][a.section] = {};

                // Supabase returns one row per faculty assignment, but our map expects array of staffIds
                // But wait, the unique constraint is (faculty, subject, class, section). 
                // So we aggregate staffIds for same (class, section, subject).
                if (!newAssignments[a.class_id][a.section][a.subject_id]) {
                    newAssignments[a.class_id][a.section][a.subject_id] = [];
                }
                newAssignments[a.class_id][a.section][a.subject_id].push(a.faculty_profile_id);
            });
            setAssignments(newAssignments);

        } catch (error) {
            console.error("Error fetching institution data:", error);
            toast.error("Failed to load institution data");
        } finally {
            setLoading(false);
        }
    }, [institutionId]);

    useEffect(() => {
        fetchData();

        // Realtime Subscriptions
        const channel = supabase.channel('institution_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'faculty_subjects' }, fetchData)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'classes' }, fetchData)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'subjects' }, fetchData)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'staff_details' }, fetchData)
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchData]);

    // Derived State: subjects with populated staff
    // This maintains compatibility with the old "Subject" interface
    const subjects: Subject[] = allSubjectsList.map(sub => {
        // Collect all staff assigned to this subject across all classes
        const staffMap: Record<string, StaffMember> = {};

        Object.entries(assignments).forEach(([classId, sections]) => {
            Object.entries(sections).forEach(([sectionId, subjectAssignments]) => {
                const assignedStaffIds = subjectAssignments[sub.id];
                if (assignedStaffIds) {
                    assignedStaffIds.forEach(staffId => {
                        const staffInfo = allStaffMembers.find(s => s.id === staffId);
                        if (staffInfo) {
                            if (!staffMap[staffId]) {
                                staffMap[staffId] = { id: staffId, name: staffInfo.name, classes: [] };
                            }
                            // Find class name
                            const classInfo = allClasses.find(c => c.id === classId && c.section === sectionId);
                            const className = classInfo ? `${classInfo.name} - ${classInfo.section}` : `${classId} - ${sectionId}`;
                            staffMap[staffId].classes.push(className);
                        }
                    });
                }
            });
        });

        return {
            id: sub.id,
            name: sub.name,
            department: sub.department,
            staff: Object.values(staffMap)
        };
    });

    const getAssignedStaff = useCallback((classId: string, section: string, subjectId: string) => {
        if (!assignments[classId]?.[section]?.[subjectId]) return [];
        const staffIds = assignments[classId][section][subjectId];
        return staffIds.map(id => allStaffMembers.find(s => s.id === id)).filter(Boolean) as { id: string; name: string }[];
    }, [assignments, allStaffMembers]);

    const assignStaff = useCallback(async (classId: string, section: string, subjectId: string, staffIds: string[]) => {
        if (!institutionId) return;
        try {
            // First, delete existing assignments for this tuple
            // Note: This is simplified. In a real app, we might handle diffs. 
            // Here we delete all for (class, section, subject) and re-insert.
            // But 'faculty_subjects' logic: id is UUID.

            // Delete old
            const { error: deleteError } = await supabase
                .from('faculty_subjects')
                .delete()
                .match({ institution_id: institutionId, class_id: classId, section: section, subject_id: subjectId });

            if (deleteError) throw deleteError;

            // Insert new
            if (staffIds.length > 0) {
                const toInsert = staffIds.map(fid => ({
                    institution_id: institutionId,
                    class_id: classId,
                    section: section,
                    subject_id: subjectId,
                    faculty_profile_id: fid
                }));
                const { error: insertError } = await supabase.from('faculty_subjects').insert(toInsert);
                if (insertError) throw insertError;
            }

            toast.success("Staff assigned successfully!");
            // Realtime will trigger refresh
        } catch (e: any) {
            console.error("Assign staff error:", e);
            toast.error(e.message || "Failed to assign staff");
        }
    }, [institutionId]);

    const getClassTeacher = useCallback((classId: string, section: string) => {
        return classTeachers[classId]?.[section];
    }, [classTeachers]);

    const assignClassTeacher = useCallback(async (classId: string, section: string, teacherId: string) => {
        if (!institutionId) return;
        try {
            // Update classes table
            // We assume row exists. If not, error.
            // Wait, we query by ID? Yes classId is ID.
            const { error } = await supabase
                .from('classes')
                .update({ class_teacher_id: teacherId })
                .eq('id', classId)
                .eq('section', section); // redundant if id is PK, but safe

            if (error) throw error;
            toast.success("Class teacher assigned!");
        } catch (e: any) {
            console.error("Assign class teacher error:", e);
            toast.error(e.message);
        }
    }, [institutionId]);

    // Deprecated methods
    const addStaffToSubject = useCallback((subjectId: string, staff: StaffMember) => {
        console.warn("addStaffToSubject is deprecated.");
    }, []);

    const removeStaffFromSubject = useCallback((subjectId: string, staffId: string) => {
        console.warn("removeStaffFromSubject is deprecated.");
    }, []);

    const refreshData = async () => {
        await fetchData();
    };

    return (
        <InstitutionContext.Provider value={{
            subjects,
            allSubjects: allSubjectsList,
            allStaffMembers,
            allClasses,
            getAssignedStaff,
            assignStaff,
            getClassTeacher,
            assignClassTeacher,
            classTeachers,
            addStaffToSubject,
            removeStaffFromSubject,
            refreshData
        }}>
            {children}
        </InstitutionContext.Provider>
    );
}

export function useInstitution() {
    const context = useContext(InstitutionContext);
    if (context === undefined) {
        throw new Error('useInstitution must be used within an InstitutionProvider');
    }
    return context;
}
