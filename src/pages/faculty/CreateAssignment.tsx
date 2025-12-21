import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

export function CreateAssignment() {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        subject: '',
        class: '',
        dueDate: '',
        description: '',
        points: '100'
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate API call and save to localStorage
        setTimeout(() => {
            const newAssignment = {
                id: Date.now(),
                ...formData,
                submissions: '0/' + (formData.class === 'Grade 10-A' ? '45' : '40'), // Mock class size
                status: 'active'
            };

            const existingAssignments = JSON.parse(localStorage.getItem('faculty_assignments') || '[]');
            localStorage.setItem('faculty_assignments', JSON.stringify([...existingAssignments, newAssignment]));

            toast.success('Assignment created successfully');
            navigate('/faculty/assignments');
        }, 1000);
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
                                        <SelectValue placeholder="Select Class" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Grade 9-A">Grade 9-A</SelectItem>
                                        <SelectItem value="Grade 9-B">Grade 9-B</SelectItem>
                                        <SelectItem value="Grade 10-A">Grade 10-A</SelectItem>
                                        <SelectItem value="Grade 10-B">Grade 10-B</SelectItem>
                                        <SelectItem value="Grade 11-A">Grade 11-A</SelectItem>
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
