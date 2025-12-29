import { useState } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Edit } from 'lucide-react';
import { Badge } from '@/components/common/Badge';

export function AdminStructure() {
    const [activeTab, setActiveTab] = useState('classes');

    // Mock Data
    const [boards] = useState([
        { id: 1, name: 'CBSE', type: 'Central', active: true },
        { id: 2, name: 'State Board (Tamil Nadu)', type: 'State', active: true },
    ]);

    const [classes] = useState([
        { id: 1, name: 'Grade 10', sectionCount: 4, active: true },
        { id: 2, name: 'Grade 12', sectionCount: 3, active: true },
        { id: 3, name: 'KG 1', sectionCount: 2, active: true },
    ]);

    const [sections] = useState([
        { id: 1, name: 'A', class: 'Grade 10', teacher: 'Mr. Sharma' },
        { id: 2, name: 'B', class: 'Grade 10', teacher: 'Mrs. Verma' },
    ]);

    return (
        <AdminLayout>
            <PageHeader
                title="School Structure Setup"
                subtitle="Define Board, Medium, Classes, Sections and Subjects"
                actions={
                    <Button className="btn-primary flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Add New
                    </Button>
                }
            />

            <Tabs defaultValue="classes" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
                    <TabsTrigger value="boards">Boards</TabsTrigger>
                    <TabsTrigger value="classes">Classes</TabsTrigger>
                    <TabsTrigger value="sections">Sections</TabsTrigger>
                    <TabsTrigger value="subjects">Subjects</TabsTrigger>
                </TabsList>

                {/* Boards Tab */}
                <TabsContent value="boards" className="mt-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {boards.map((board) => (
                            <div key={board.id} className="dashboard-card p-4 flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-lg">{board.name}</h3>
                                    <p className="text-sm text-muted-foreground">{board.type}</p>
                                    <Badge variant={board.active ? 'success' : 'warning'} className="mt-2">
                                        {board.active ? 'Active' : 'Inactive'}
                                    </Badge>
                                </div>
                                <Button variant="ghost" size="sm"><Edit className="w-4 h-4" /></Button>
                            </div>
                        ))}
                    </div>
                </TabsContent>

                {/* Classes Tab */}
                <TabsContent value="classes" className="mt-6">
                    <div className="dashboard-card">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-3">Class Name</th>
                                    <th className="px-6 py-3">Sections</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {classes.map((cls) => (
                                    <tr key={cls.id} className="border-b border-border hover:bg-muted/20">
                                        <td className="px-6 py-4 font-medium">{cls.name}</td>
                                        <td className="px-6 py-4">{cls.sectionCount}</td>
                                        <td className="px-6 py-4">
                                            <Badge variant="success">Active</Badge>
                                        </td>
                                        <td className="px-6 py-4 flex gap-2">
                                            <Button variant="ghost" size="sm"><Edit className="w-4 h-4" /></Button>
                                            <Button variant="ghost" size="sm" className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </TabsContent>

                {/* Sections Tab */}
                <TabsContent value="sections" className="mt-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {sections.map((section) => (
                            <div key={section.id} className="dashboard-card p-4">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-bold text-lg">{section.class} - {section.name}</h3>
                                    <Button variant="ghost" size="sm"><Edit className="w-4 h-4" /></Button>
                                </div>
                                <p className="text-sm text-muted-foreground">Class Teacher: <span className="font-medium text-foreground">{section.teacher}</span></p>
                            </div>
                        ))}
                    </div>
                </TabsContent>
                <TabsContent value="subjects" className="mt-6">
                    <div className="p-8 text-center text-muted-foreground dashboard-card">
                        <p>Subject Configuration Module - Loading...</p>
                    </div>
                </TabsContent>
            </Tabs>
        </AdminLayout>
    );
}
