import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FacultyLayout } from '@/layouts/FacultyLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/ui/button';
import { Plus, Search, FileText, Download, MoreVertical, Edit, XCircle } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';

const initialAssignments = [
    { id: 1, title: 'Algebra Homework', subject: 'Mathematics', class: 'Grade 10-A', dueDate: 'Dec 22, 2025', submissions: '42/45', status: 'active' },
    { id: 2, title: 'Physics Lab Report', subject: 'Science', class: 'Grade 9-B', dueDate: 'Dec 25, 2025', submissions: '12/52', status: 'active' },
    { id: 3, title: 'Shakespeare Essay', subject: 'English', class: 'Grade 10-C', dueDate: 'Dec 18, 2025', submissions: '28/28', status: 'closed' },
    { id: 4, title: 'Geometry Practice', subject: 'Mathematics', class: 'Grade 9-A', dueDate: 'Dec 20, 2025', submissions: '35/40', status: 'active' },
];

export function FacultyAssignments() {
    const navigate = useNavigate();
    const [assignments, setAssignments] = useState(initialAssignments);

    useEffect(() => {
        const storedAssignments = localStorage.getItem('faculty_assignments');
        if (storedAssignments) {
            const parsed = JSON.parse(storedAssignments);
            // Combine initial and stored, removing duplicates if needed (simple concat here)
            // Ideally we'd have a database. For now we just show both or just the stored one if we want full persistence simulation
            // But to keep the "demo" data visible + new data, we concat:
            if (Array.isArray(parsed)) {
                setAssignments([...initialAssignments, ...parsed.map((p: any) => ({
                    ...p,
                    id: p.id || Math.random() // Ensure ID
                }))]);
            }
        }
    }, []);

    const handleCloseAssignment = (id: number) => {
        setAssignments(prev => prev.map(assignment =>
            assignment.id === id ? { ...assignment, status: 'closed' } : assignment
        ));
        toast.success('Assignment closed successfully');
    };

    const handleUpdateAssignment = (id: number) => {
        // Navigate to edit page
        navigate(`/faculty/assignments/edit/${id}`);
    };

    const columns = [
        { key: 'title', header: 'Assignment Title' },
        { key: 'subject', header: 'Subject' },
        { key: 'class', header: 'Class' },
        { key: 'dueDate', header: 'Due Date' },
        { key: 'submissions', header: 'Submissions' },
        {
            key: 'status',
            header: 'Status',
            render: (item: typeof assignments[0]) => (
                <Badge variant={item.status === 'active' ? 'success' : 'outline'}>
                    {item.status.toString().toUpperCase()}
                </Badge>
            ),
        },
        {
            key: 'actions',
            header: '',
            render: (item: typeof assignments[0]) => (
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4" />
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                onClick={() => handleUpdateAssignment(item.id)}
                                className="flex items-center gap-2"
                            >
                                <Edit className="w-4 h-4" />
                                Update
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => handleCloseAssignment(item.id)}
                                disabled={item.status === 'closed'}
                                className="flex items-center gap-2"
                            >
                                <XCircle className="w-4 h-4" />
                                Close
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            ),
        },
    ];

    return (
        <FacultyLayout>
            <PageHeader
                title="Assignments"
                subtitle="Create and manage assignments for your students"
                actions={
                    <Button
                        className="btn-primary flex items-center gap-2"
                        onClick={() => navigate('/faculty/assignments/create')}
                    >
                        <Plus className="w-4 h-4" />
                        Create Assignment
                    </Button>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {[
                    { label: 'Total Active', value: assignments.filter(a => a.status === 'active').length, icon: Plus, color: 'text-primary', bg: 'bg-primary/10' },
                    { label: 'Graded', value: '45', icon: FileText, color: 'text-success', bg: 'bg-success/10' },
                    { label: 'Pending Review', value: '8', icon: Download, color: 'text-warning', bg: 'bg-warning/10' },
                    { label: 'Due Today', value: '2', icon: Search, color: 'text-info', bg: 'bg-info/10' },
                ].map((stat, idx) => (
                    <div key={idx} className="dashboard-card">
                        <div className="flex items-center gap-3 mb-2">
                            <div className={`p-2 rounded-lg ${stat.bg}`}>
                                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                            </div>
                            <h4 className="font-medium">{stat.label}</h4>
                        </div>
                        <p className="text-2xl font-bold">{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="dashboard-card">
                <div className="flex items-center gap-4 mb-6">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search assignments..."
                            className="input-field pl-10"
                        />
                    </div>
                </div>

                <DataTable columns={columns} data={assignments} />
            </div>
        </FacultyLayout>
    );
}
