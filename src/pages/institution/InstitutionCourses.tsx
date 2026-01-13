import { useState, useEffect } from 'react';
import { InstitutionLayout } from '@/layouts/InstitutionLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/common/Badge';
import { BookOpen, Plus, Search, Filter, Loader2 } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useInstitution } from '@/context/InstitutionContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

// Sub-component for Managing Staff
function ManageStaffDialog({ subject, open, onOpenChange }: { subject: any, open: boolean, onOpenChange: (val: boolean) => void }) {
    const { allClasses, allStaffMembers, assignStaff, getAssignedStaff } = useInstitution();
    const [selectedSection, setSelectedSection] = useState<string>('');
    const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // Filter relevant classes (sections) for this subject's class name
    const relevantClasses = allClasses.filter(c => c.name === subject.class_name);
    // Unique sections
    const sections = Array.from(new Set(relevantClasses.map(c => c.section))).sort();

    // When section changes, load existing assignments
    useEffect(() => {
        if (selectedSection && subject.id) {
            // Find class ID for this section
            const classObj = relevantClasses.find(c => c.section === selectedSection);
            if (classObj) {
                const assigned = getAssignedStaff(classObj.id, selectedSection, subject.id);
                setSelectedStaffIds(assigned.map(s => s.id));
            }
        } else {
            setSelectedStaffIds([]);
        }
    }, [selectedSection, subject, relevantClasses, getAssignedStaff]);

    const handleSave = async () => {
        if (!selectedSection) {
            toast.error("Please select a section");
            return;
        }
        setIsSaving(true);
        try {
            const classObj = relevantClasses.find(c => c.section === selectedSection);
            if (!classObj) throw new Error("Invalid class/section");

            await assignStaff(classObj.id, selectedSection, subject.id, selectedStaffIds);
            onOpenChange(false);
            // Toast handled by assignStaff typically, or add here
            // assignStaff in context already has toast.success
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Manage Staff: {subject.name}</DialogTitle>
                    <DialogDescription>
                        Assign staff for <strong>{subject.class_name}</strong>
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Select Section</Label>
                        <Select value={selectedSection} onValueChange={setSelectedSection}>
                            <SelectTrigger>
                                <SelectValue placeholder="Choose Section" />
                            </SelectTrigger>
                            <SelectContent>
                                {sections.map(sec => (
                                    <SelectItem key={sec} value={sec}>{sec}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedSection && (
                        <div className="space-y-2">
                            <Label>Assign Staff (Multiple)</Label>
                            <div className="border rounded-md p-3 max-h-60 overflow-y-auto space-y-2">
                                {allStaffMembers.length === 0 && <p className="text-sm text-muted-foreground">No staff available.</p>}
                                {allStaffMembers.map(staff => (
                                    <div key={staff.id} className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id={`staff-${staff.id}`}
                                            checked={selectedStaffIds.includes(staff.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedStaffIds([...selectedStaffIds, staff.id]);
                                                } else {
                                                    setSelectedStaffIds(selectedStaffIds.filter(id => id !== staff.id));
                                                }
                                            }}
                                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                        <label htmlFor={`staff-${staff.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                                            {staff.name} {staff.department ? <span className="text-xs text-muted-foreground">({staff.department})</span> : null}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isSaving || !selectedSection}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Assignments
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function InstitutionCourses() {
    const { subjects, allClasses } = useInstitution(); // Contains assignments info & classes
    const { user } = useAuth();
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [managingSubject, setManagingSubject] = useState<any>(null);
    const [newCourse, setNewCourse] = useState({
        name: '',
        className: '', // Replaces code
        department: '',
        instructor: ''
    });
    const [searchQuery, setSearchQuery] = useState('');

    // ... (handleAddCourse remains same) ...
    // Copying handleAddCourse for completeness if Replace needs it, but using diff context effectively requires start/end lines.
    // I will target the Columns definition specifically.

    const handleAddCourse = async () => {
        if (!user?.institutionId) return;
        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('subjects')
                .insert([{
                    institution_id: user.institutionId,
                    name: newCourse.name,
                    code: '',
                    class_name: newCourse.className,
                    department: newCourse.department
                }]);

            if (error) throw error;

            toast.success("Subject added successfully");
            setIsAddDialogOpen(false);
            setNewCourse({ name: '', className: '', department: '', instructor: '' });
        } catch (error: any) {
            console.error('Error adding subject:', error);
            toast.error(error.message || 'Failed to add subject');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Filter subjects based on search
    const filteredSubjects = subjects.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s as any).class_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const columns = [
        { key: 'name', header: 'Subject Name' },
        {
            key: 'class_name',
            header: 'Class',
            render: (item: any) => item.class_name || <span className="text-muted-foreground">-</span>
        },
        { key: 'department', header: 'Department' },
        {
            key: 'instructor',
            header: 'Assigned Staff',
            render: (item: any) => {
                // item is a Subject from context which has .staff array
                if (!item.staff || item.staff.length === 0) return <span className="text-muted-foreground text-xs">Unassigned</span>;
                // Unique staff names
                const uniqueNames = Array.from(new Set(item.staff.map((s: any) => s.name)));
                if (uniqueNames.length > 2) {
                    return <span>{uniqueNames.slice(0, 2).join(', ')} +{uniqueNames.length - 2} more</span>;
                }
                return <span>{uniqueNames.join(', ')}</span>;
            }
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (item: any) => (
                <Button variant="ghost" size="sm" onClick={() => setManagingSubject(item)}>Manage</Button>
            ),
        },
    ];

    return (
        <InstitutionLayout>
            <PageHeader
                title="My Subjects"
                subtitle="Manage subjects and their class associations"
                actions={
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search subjects..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="input-field pl-10 w-64"
                            />
                        </div>
                        <Button variant="outline" className="flex items-center gap-2">
                            <Filter className="w-4 h-4" />
                            Filter
                        </Button>
                        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="flex items-center gap-2">
                                    <Plus className="w-4 h-4" />
                                    Add Subject
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[550px]">
                                <DialogHeader>
                                    <DialogTitle>Add New Subject</DialogTitle>
                                    <DialogDescription>
                                        Create a new subject and link it to a class.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="name" className="text-right">Name</Label>
                                        <Input
                                            id="name"
                                            value={newCourse.name}
                                            onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                                            className="col-span-3"
                                            placeholder="e.g. Mathematics"
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="className" className="text-right">Class</Label>
                                        <div className="col-span-3">
                                            <Select
                                                value={newCourse.className}
                                                onValueChange={(value) => setNewCourse({ ...newCourse, className: value })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Class" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Array.from(new Set(allClasses.map(c => c.name))).sort().map(className => (
                                                        <SelectItem key={className} value={className}>{className}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="department" className="text-right">Department</Label>
                                        <div className="col-span-3">
                                            <Select
                                                value={newCourse.department}
                                                onValueChange={(value) => setNewCourse({ ...newCourse, department: value })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Department" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Mathematics">Mathematics</SelectItem>
                                                    <SelectItem value="Science">Science</SelectItem>
                                                    <SelectItem value="English">English</SelectItem>
                                                    <SelectItem value="Languages">Languages</SelectItem>
                                                    <SelectItem value="Social Studies">Social Studies</SelectItem>
                                                    <SelectItem value="Computer Science">Computer Science</SelectItem>
                                                    <SelectItem value="Arts">Arts</SelectItem>
                                                    <SelectItem value="Physical Education">Physical Education</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit" onClick={handleAddCourse} disabled={!newCourse.name || !newCourse.className || isSubmitting}>
                                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Save Subject
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                }
            />

            <div className="dashboard-card">
                <DataTable columns={columns} data={filteredSubjects} />
            </div>

            {managingSubject && (
                <ManageStaffDialog
                    subject={managingSubject}
                    open={!!managingSubject}
                    onOpenChange={(val) => !val && setManagingSubject(null)}
                />
            )}
        </InstitutionLayout>
    );
}
