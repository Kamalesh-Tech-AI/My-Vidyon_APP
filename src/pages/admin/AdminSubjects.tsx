import { useState } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/common/Badge';
import { Plus, Search, BookOpen, User } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';

export function AdminSubjects() {
    const [subjects, setSubjects] = useState([
        { id: 1, name: 'Mathematics', code: 'MAT101', class: 'Grade 10', teacher: 'Mr. R. Sharma', type: 'Core' },
        { id: 2, name: 'Science', code: 'SCI101', class: 'Grade 10', teacher: 'Mrs. K. Verma', type: 'Core' },
        { id: 3, name: 'Social Studies', code: 'SST101', class: 'Grade 10', teacher: 'Mrs. P. Gupta', type: 'Core' },
        { id: 4, name: 'English', code: 'ENG101', class: 'Grade 10', teacher: 'Mr. J. Doe', type: 'Language' },
        { id: 5, name: 'Physics', code: 'PHY121', class: 'Grade 12', teacher: 'Dr. A. Kumar', type: 'Elective' },
        { id: 6, name: 'Chemistry', code: 'CHE121', class: 'Grade 12', teacher: 'Mrs. S. Reddy', type: 'Elective' },
    ]);

    const [newSubject, setNewSubject] = useState({ name: '', code: '', class: '', teacher: '', type: 'Core' });
    const [isAddOpen, setIsAddOpen] = useState(false);

    const handleAddSubject = () => {
        setSubjects([...subjects, { id: Date.now(), ...newSubject }]);
        setIsAddOpen(false);
        setNewSubject({ name: '', code: '', class: '', teacher: '', type: 'Core' });
    };

    return (
        <AdminLayout>
            <PageHeader
                title="Subject Management"
                subtitle="Manage Subjects, Codes, and Teacher Allocations"
                actions={
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button className="btn-primary flex items-center gap-2">
                                <Plus className="w-4 h-4" />
                                Add Subject
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Subject</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Subject Name</Label>
                                    <Input
                                        placeholder="e.g. Mathematics"
                                        value={newSubject.name}
                                        onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Subject Code</Label>
                                    <Input
                                        placeholder="e.g. MAT101"
                                        value={newSubject.code}
                                        onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Class/Grade</Label>
                                    <Input
                                        placeholder="e.g. Grade 10"
                                        value={newSubject.class}
                                        onChange={(e) => setNewSubject({ ...newSubject, class: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Assigned Teacher</Label>
                                    <Input
                                        placeholder="e.g. Mr. Sharma"
                                        value={newSubject.teacher}
                                        onChange={(e) => setNewSubject({ ...newSubject, teacher: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Type</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={newSubject.type}
                                        onChange={(e) => setNewSubject({ ...newSubject, type: e.target.value })}
                                    >
                                        <option value="Core">Core</option>
                                        <option value="Elective">Elective</option>
                                        <option value="Language">Language</option>
                                        <option value="Lab">Lab</option>
                                    </select>
                                </div>
                                <Button className="w-full" onClick={handleAddSubject}>Save Subject</Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                }
            />

            <div className="dashboard-card mb-6">
                <div className="p-4 border-b border-border flex items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input placeholder="Search subjects..." className="pl-10" />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                            <tr>
                                <th className="px-6 py-3">Subject Name</th>
                                <th className="px-6 py-3">Code</th>
                                <th className="px-6 py-3">Class</th>
                                <th className="px-6 py-3">Type</th>
                                <th className="px-6 py-3">Assigned Teacher</th>
                                <th className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {subjects.map((subject) => (
                                <tr key={subject.id} className="border-b border-border hover:bg-muted/20">
                                    <td className="px-6 py-4 font-medium flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                            <BookOpen className="w-4 h-4" />
                                        </div>
                                        {subject.name}
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs">{subject.code}</td>
                                    <td className="px-6 py-4">{subject.class}</td>
                                    <td className="px-6 py-4">
                                        <Badge variant="outline">{subject.type}</Badge>
                                    </td>
                                    <td className="px-6 py-4 flex items-center gap-2">
                                        <User className="w-3 h-3 text-muted-foreground" />
                                        {subject.teacher}
                                    </td>
                                    <td className="px-6 py-4">
                                        <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">Edit</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}
