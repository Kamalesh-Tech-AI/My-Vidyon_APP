import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { InstitutionLayout } from '@/layouts/InstitutionLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatCard } from '@/components/common/StatCard';
import { DataTable } from '@/components/common/DataTable';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import {
    GraduationCap,
    BookOpen,
    Calendar,
    ClipboardCheck,
    FileText,
    User,
    Phone,
    Mail,
    MapPin,
    ArrowLeft
} from 'lucide-react';

export function InstitutionStudentDetails() {
    const { studentId } = useParams();
    const navigate = useNavigate();

    // Fetch Student Details
    const { data: student, isLoading } = useQuery({
        queryKey: ['institution-student', studentId],
        queryFn: async () => {
            // In a real app, fetch from Supabase
            // const { data } = await supabase.from('students').select('*, parents(*)').eq('id', studentId).single();
            // return data;

            // Simulating delay for mock
            await new Promise(r => setTimeout(r, 500));
            return {
                id: studentId,
                name: 'Kamalesh', // Matching screenshot
                register_number: 'REG-2024-001',
                class_name: '10th',
                section: 'A',
                roll_no: '001',
                email: 'kamalesh@example.com',
                phone: '+91 98765 43210',
                dob: '2008-05-15',
                gender: 'Male',
                address: '123, Gandhi Nagar, Mumbai',
                blood_group: 'B+',
                admission_date: '2024-06-01',
                status: 'Active',
                attendance_percentage: 91,
                parent: {
                    name: 'Rajesh Kumar',
                    relation: 'Father',
                    phone: '+91 98765 43211',
                    email: 'rajesh@example.com'
                },
                academic_history: [
                    { year: '2023-24', class: '9th', percentage: '88%' },
                    { year: '2022-23', class: '8th', percentage: '85%' }
                ]
            };
        },
        enabled: !!studentId
    });

    if (isLoading) {
        return (
            <InstitutionLayout>
                <div className="flex items-center justify-center h-full min-h-[500px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </InstitutionLayout>
        );
    }

    if (!student) {
        return (
            <InstitutionLayout>
                <div className="text-center py-20">
                    <h2 className="text-xl font-semibold">Student Not Found</h2>
                    <Button onClick={() => navigate('/institution/users')} className="mt-4">Back to Users</Button>
                </div>
            </InstitutionLayout>
        );
    }

    return (
        <InstitutionLayout>
            <div className="mb-6">
                <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 pl-0 hover:bg-transparent hover:text-primary">
                    <ArrowLeft className="w-4 h-4" /> Back
                </Button>
                <PageHeader
                    title={student.name}
                    subtitle={`Roll No: ${student.register_number} • Class ${student.class_name} - ${student.section}`}
                    actions={
                        <div className="flex gap-2">
                            <Button variant="outline">Edit Profile</Button>
                            <Button variant="secondary">Download Report</Button>
                        </div>
                    }
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Profile Card */}
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Student Profile</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col items-center py-4">
                                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                                    <User className="w-10 h-10 text-primary" />
                                </div>
                                <h3 className="text-xl font-bold">{student.name}</h3>
                                <Badge variant="success" className="mt-2">{student.status} Student</Badge>
                            </div>

                            <div className="space-y-3 pt-4 border-t">
                                <div className="flex items-center gap-3 text-sm">
                                    <Mail className="w-4 h-4 text-muted-foreground" />
                                    <span>{student.email}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <Phone className="w-4 h-4 text-muted-foreground" />
                                    <span>{student.phone}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <Calendar className="w-4 h-4 text-muted-foreground" />
                                    <span>DOB: {student.dob}</span>
                                </div>
                                <div className="flex items-start gap-3 text-sm">
                                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                                    <span>{student.address}</span>
                                </div>
                            </div>

                            <div className="pt-4 border-t">
                                <h4 className="text-sm font-semibold mb-3">Guardian Details</h4>
                                <div className="space-y-2 text-sm">
                                    <p className="font-medium">{student.parent.name} <span className="text-muted-foreground text-xs">({student.parent.relation})</span></p>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Phone className="w-3 h-3" /> {student.parent.phone}
                                    </div>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Mail className="w-3 h-3" /> {student.parent.email}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Attendance Overview</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-4">
                                <div className="text-4xl font-bold text-primary mb-1">{student.attendance_percentage}%</div>
                                <p className="text-xs text-muted-foreground">Average Attendance</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Details Tabs */}
                <div className="lg:col-span-2">
                    <Tabs defaultValue="academic" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="academic">Academic</TabsTrigger>
                            <TabsTrigger value="attendance">Attendance History</TabsTrigger>
                            <TabsTrigger value="documents">Documents</TabsTrigger>
                        </TabsList>

                        <TabsContent value="academic" className="mt-6 space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <StatCard title="Current Rank" value="5th" icon={GraduationCap} />
                                <StatCard title="Assignments Pending" value="2" icon={BookOpen} iconColor="text-warning" />
                            </div>

                            <Card>
                                <CardHeader><CardTitle>Recent Performance</CardTitle></CardHeader>
                                <CardContent>
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-muted-foreground bg-muted/30">
                                            <tr>
                                                <th className="p-3">Exam</th>
                                                <th className="p-3">Subject</th>
                                                <th className="p-3">Score</th>
                                                <th className="p-3">Grade</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="border-b">
                                                <td className="p-3">Unit Test 1</td>
                                                <td className="p-3">Mathematics</td>
                                                <td className="p-3">45/50</td>
                                                <td className="p-3"><Badge variant="success">A1</Badge></td>
                                            </tr>
                                            <tr className="border-b">
                                                <td className="p-3">Unit Test 1</td>
                                                <td className="p-3">Science</td>
                                                <td className="p-3">42/50</td>
                                                <td className="p-3"><Badge variant="success">A2</Badge></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="attendance" className="mt-6">
                            <Card><CardContent className="p-8 text-center text-muted-foreground">Detailed attendance calendar view coming soon.</CardContent></Card>
                        </TabsContent>

                        <TabsContent value="documents" className="mt-6">
                            <Card><CardContent className="p-8 text-center text-muted-foreground">No documents uploaded yet.</CardContent></Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </InstitutionLayout>
    );
}

export default InstitutionStudentDetails;
