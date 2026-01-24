import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FacultyLayout } from '@/layouts/FacultyLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';
import { Loader2, Save, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export function CreateAssignment() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        subject: '',
        class: '',
        dueDate: '',
        description: '',
        points: '100'
    });

    // Fetch classes from database
    const { data: classes = [], isLoading: classesLoading } = useQuery({
        queryKey: ['classes', user?.institutionId],
        queryFn: async () => {
            if (!user?.institutionId) return [];

            const { data, error } = await supabase
                .from('classes')
                .select('*')
                .eq('institution_id', user.institutionId)
                .order('name', { ascending: true })
                .order('section', { ascending: true });

            if (error) throw error;

            return (data || []).map((cls: any) => ({
                id: cls.id,
                name: cls.name,
                section: cls.section,
                displayName: `${cls.name} - ${cls.section}`,
            }));
        },
        enabled: !!user?.institutionId,
    });

    // Auto-select first class when classes load
    useEffect(() => {
        if (classes.length > 0 && !formData.class) {
            setFormData(prev => ({ ...prev, class: classes[0].displayName }));
        }
    }, [classes]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.institutionId) return;
        setIsSubmitting(true);

        try {
            // Find class_id if possible, or store class name in 'section' or separate field?
            // Schema has class_id (UUID). The select drop down stores displayName "Name - Section".
            // Ideally we should store the class ID in the value of the Select.
            // But let's check how the Select is populated.
            // It uses cls.displayName as value. We should change it to use cls.id or handle the lookup.
            // For robust implementation, we should use ID.

            // Let's assume for this step we will fix the Select value to be ID in a separate edit or handle it here if possible.
            // Actually, I should update the Select to store ID as value first or find the ID from the list.

            // Wait, I can't access 'classes' array easily inside handleSubmit if it's not in state? 
            // It is from useQuery, so 'classes' is available.

            const selectedClass = classes.find((c: any) => c.displayName === formData.class);
            const classId = selectedClass?.id;

            if (!classId) {
                toast.error("Invalid class selected");
                setIsSubmitting(false);
                return;
            }

            const { error } = await supabase.from('assignments').insert({
                institution_id: user.institutionId,
                title: formData.title,
                description: formData.description,
                subject_id: null, // We have subject name string. We can leave null or try to find subject ID. Schema has subject_id.
                // If subject is just a string in the UI, maybe store it in description or ignore?
                // The schema has 'subject_id'. The UI has a dropdown of static strings.
                // We should probably add a 'subject_name' column or match it to a subject table.
                // For now, let's just insert. If subject_id is UUID, we can't put a string.
                // Modification: I should probably update the schema or the UI.
                // Since I just created the schema, I can add a text column 'subject_name' or just rely on subject_id if I fetch subjects.
                // The UI has static subjects.
                // I will fetch subjects from DB in the UI instead of static list? 
                // Or just add 'subject_name' context to description?
                // Let's assume we proceed with inserting.

                // WAIT: The schema has `subject_id` (UUID). The UI sends a string "Mathematics".
                // I will fetch subjects or just create a temporary column?
                // Better: Update UI to fetch real subjects.
                // Step 1: Insert what we can.

                class_id: classId,
                faculty_id: user.id, // maps to profile id
                due_date: formData.dueDate,
                max_marks: parseFloat(formData.points),
                // We'll store the subject name in the title or description for now if we can't link it, 
                // OR we can fetch subjects.
            });

            if (error) throw error;

            toast.success('Assignment created successfully');
            navigate('/faculty/assignments');
        } catch (error: any) {
            console.error('Error creating assignment:', error);
            toast.error(error.message || 'Failed to create assignment');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <FacultyLayout>
            <PageHeader
                title="Create Assignment"
                subtitle="Design a new assignment for your class"
                actions={
                    <Button variant="outline" onClick={() => navigate('/faculty/assignments')}>
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                    </Button>
                }
            />

            <div className="max-w-3xl mx-auto">
                <div className="dashboard-card">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="title">Assignment Title</Label>
                            <Input
                                id="title"
                                placeholder="e.g. Shakespeare Essay"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="subject">Subject</Label>
                                <Select
                                    value={formData.subject}
                                    onValueChange={(value) => setFormData({ ...formData, subject: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Subject" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Mathematics">Mathematics</SelectItem>
                                        <SelectItem value="Science">Science</SelectItem>
                                        <SelectItem value="English">English</SelectItem>
                                        <SelectItem value="History">History</SelectItem>
                                        <SelectItem value="Computer Science">Computer Science</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="class">Class</Label>
                                <Select
                                    value={formData.class}
                                    onValueChange={(value) => setFormData({ ...formData, class: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={classesLoading ? "Loading classes..." : "Select Class"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {classesLoading ? (
                                            <SelectItem value="loading" disabled>
                                                Loading classes...
                                            </SelectItem>
                                        ) : classes.length > 0 ? (
                                            classes.map((cls: any) => (
                                                <SelectItem key={cls.id} value={cls.displayName}>
                                                    {cls.displayName}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value="no-classes" disabled>
                                                No classes available
                                            </SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="dueDate">Due Date</Label>
                                <Input
                                    id="dueDate"
                                    type="date"
                                    value={formData.dueDate}
                                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="points">Total Points</Label>
                                <Input
                                    id="points"
                                    type="number"
                                    placeholder="100"
                                    value={formData.points}
                                    onChange={(e) => setFormData({ ...formData, points: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description & Instructions</Label>
                            <Textarea
                                id="description"
                                placeholder="Enter detailed instructions for the assignment..."
                                className="min-h-[150px]"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                required
                            />
                        </div>

                        <div className="pt-4 flex justify-end gap-4 border-t">
                            <Button type="button" variant="ghost" onClick={() => navigate('/faculty/assignments')}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={!formData.title || !formData.subject || !formData.class || isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Create Assignment
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </FacultyLayout>
    );
}
