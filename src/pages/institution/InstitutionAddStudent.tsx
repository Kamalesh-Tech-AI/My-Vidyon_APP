import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { InstitutionLayout } from '@/layouts/InstitutionLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, ArrowLeft, Save } from 'lucide-react';

export function InstitutionAddStudent() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        // Personal
        firstName: '',
        lastName: '',
        dob: '',
        gender: 'male',
        bloodGroup: '',

        // Contact
        email: '',
        phone: '',
        address: '',
        city: '',
        zipCode: '',

        // Academic
        admissionNumber: '',
        admissionDate: new Date().toISOString().split('T')[0],
        class: '',
        section: '',
        rollNumber: '',

        // Parent
        parentName: '',
        parentRelation: 'Father',
        parentPhone: '',
        parentEmail: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Mock API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log('Submitting Student Data:', formData);
            toast.success('Student added successfully!');
            navigate('/institution/users');
        } catch (error) {
            toast.error('Failed to add student. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <InstitutionLayout>
            <div className="mb-6">
                <Button variant="ghost" onClick={() => navigate('/institution/users')} className="pl-0 gap-2 hover:bg-transparent hover:text-primary">
                    <ArrowLeft className="w-4 h-4" /> Back to Users
                </Button>
                <PageHeader
                    title="Add New Student"
                    subtitle="Register a new student to the institution"
                />
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Tabs defaultValue="personal" className="w-full">
                    <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
                        <TabsTrigger value="personal">Personal</TabsTrigger>
                        <TabsTrigger value="contact">Contact</TabsTrigger>
                        <TabsTrigger value="academic">Academic</TabsTrigger>
                        <TabsTrigger value="parent">Parent</TabsTrigger>
                    </TabsList>

                    {/* PERSONAL DETAILS */}
                    <TabsContent value="personal" className="mt-6">
                        <Card>
                            <CardHeader><CardTitle>Personal Details</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">First Name *</Label>
                                    <Input required id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="John" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Last Name *</Label>
                                    <Input required id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Doe" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="dob">Date of Birth *</Label>
                                    <Input required type="date" id="dob" name="dob" value={formData.dob} onChange={handleChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="gender">Gender</Label>
                                    <select
                                        id="gender"
                                        name="gender"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={formData.gender}
                                        onChange={handleChange}
                                    >
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bloodGroup">Blood Group</Label>
                                    <Input id="bloodGroup" name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} placeholder="O+" />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* CONTACT DETAILS */}
                    <TabsContent value="contact" className="mt-6">
                        <Card>
                            <CardHeader><CardTitle>Contact Information</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input type="email" id="email" name="email" value={formData.email} onChange={handleChange} placeholder="john.doe@example.com" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} placeholder="+91 9876543210" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="address">Address</Label>
                                    <Input id="address" name="address" value={formData.address} onChange={handleChange} placeholder="123 Main St" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="city">City</Label>
                                    <Input id="city" name="city" value={formData.city} onChange={handleChange} placeholder="Mumbai" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="zipCode">Zip/Postal Code</Label>
                                    <Input id="zipCode" name="zipCode" value={formData.zipCode} onChange={handleChange} placeholder="400001" />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ACADEMIC DETAILS */}
                    <TabsContent value="academic" className="mt-6">
                        <Card>
                            <CardHeader><CardTitle>Academic Information</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="admissionNumber">Admission Number *</Label>
                                    <Input required id="admissionNumber" name="admissionNumber" value={formData.admissionNumber} onChange={handleChange} placeholder="ADM-2024-001" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="admissionDate">Admission Date *</Label>
                                    <Input required type="date" id="admissionDate" name="admissionDate" value={formData.admissionDate} onChange={handleChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="class">Class/Grade *</Label>
                                    <Input required id="class" name="class" value={formData.class} onChange={handleChange} placeholder="10" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="section">Section</Label>
                                    <Input id="section" name="section" value={formData.section} onChange={handleChange} placeholder="A" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="rollNumber">Roll Number</Label>
                                    <Input id="rollNumber" name="rollNumber" value={formData.rollNumber} onChange={handleChange} placeholder="05" />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* PARENT DETAILS */}
                    <TabsContent value="parent" className="mt-6">
                        <Card>
                            <CardHeader><CardTitle>Parent/Guardian Details</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="parentName">Parent/Guardian Name *</Label>
                                    <Input required id="parentName" name="parentName" value={formData.parentName} onChange={handleChange} placeholder="Parent Name" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="parentRelation">Relationship *</Label>
                                    <select
                                        id="parentRelation"
                                        name="parentRelation"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={formData.parentRelation}
                                        onChange={handleChange}
                                    >
                                        <option value="Father">Father</option>
                                        <option value="Mother">Mother</option>
                                        <option value="Guardian">Guardian</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="parentPhone">Parent Phone *</Label>
                                    <Input required type="tel" id="parentPhone" name="parentPhone" value={formData.parentPhone} onChange={handleChange} placeholder="+91..." />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="parentEmail">Parent Email</Label>
                                    <Input type="email" id="parentEmail" name="parentEmail" value={formData.parentEmail} onChange={handleChange} placeholder="parent@example.com" />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={() => navigate('/institution/users')}>Cancel</Button>
                    <Button type="submit" disabled={isLoading} className="gap-2">
                        {isLoading ? 'Saving...' : <><Save className="w-4 h-4" /> Save Student</>}
                    </Button>
                </div>
            </form>
        </InstitutionLayout>
    );
}

export default InstitutionAddStudent;
