import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { InstitutionLayout } from '@/layouts/InstitutionLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, ArrowLeft, Save, Camera, Upload, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import * as faceapi from 'face-api.js';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

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

    const [image, setImage] = useState<string | null>(null);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);

    const loadModels = async () => {
        try {
            await Promise.all([
                faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
                faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
                faceapi.nets.faceRecognitionNet.loadFromUri('/models')
            ]);
            setModelsLoaded(true);
        } catch (error) {
            console.error('Failed to load face-api models:', error);
        }
    };

    const startCamera = async () => {
        setIsCameraOpen(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (error) {
            toast.error('Could not access camera');
        }
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            if (context) {
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
                context.drawImage(videoRef.current, 0, 0);
                setImage(canvasRef.current.toDataURL('image/jpeg'));
                stopCamera();
            }
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
        setIsCameraOpen(false);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            let imageUrl = null;
            let embedding = null;

            // 1. Generate Embedding if image exists
            if (image) {
                if (!modelsLoaded) await loadModels();
                const img = await faceapi.fetchImage(image);
                const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
                if (detections) {
                    embedding = Array.from(detections.descriptor);
                } else {
                    toast.warning('No face detected in the photo. Verification might not work.');
                }

                // 2. Upload to Supabase Storage
                const fileName = `student_${Date.now()}.jpg`;
                const byteString = atob(image.split(',')[1]);
                const mimeString = image.split(',')[0].split(':')[1].split(';')[0];
                const ab = new ArrayBuffer(byteString.length);
                const ia = new Uint8Array(ab);
                for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
                const blob = new Blob([ab], { type: mimeString });

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('student-photos')
                    .upload(fileName, blob);

                if (uploadError) throw uploadError;
                const { data: { publicUrl } } = supabase.storage.from('student-photos').getPublicUrl(fileName);
                imageUrl = publicUrl;
            }

            // 3. Save Student Record
            const { data: student, error: studentError } = await supabase
                .from('students')
                .insert({
                    name: `${formData.firstName} ${formData.lastName}`,
                    email: formData.email,
                    phone: formData.phone,
                    register_number: formData.admissionNumber,
                    class_name: formData.class,
                    section: formData.section,
                    parent_name: formData.parentName,
                    parent_contact: formData.parentPhone,
                    parent_email: formData.parentEmail,
                    parent_relation: formData.parentRelation,
                    dob: formData.dob,
                    gender: formData.gender,
                    blood_group: formData.bloodGroup,
                    address: formData.address,
                    city: formData.city,
                    zip_code: formData.zipCode,
                    image_url: imageUrl,
                    institution_id: (await supabase.auth.getUser()).data.user?.user_metadata?.institution_id
                })
                .select()
                .single();

            if (studentError) throw studentError;

            // 4. Save Embedding
            if (embedding && student) {
                await supabase.from('face_embeddings').insert({
                    user_id: student.id, // Using student ID for lookup
                    embedding: embedding,
                    label: student.name
                });
            }

            toast.success('Student added successfully!');
            navigate('/institution/users');
        } catch (error: any) {
            console.error('Error adding student:', error);
            toast.error(error.message || 'Failed to add student');
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

                                {/* STUDENT IMAGE SECTION */}
                                <div className="space-y-2 md:col-span-2 border-t pt-4">
                                    <Label>Student Photo (For Camera Verification)</Label>
                                    <div className="flex flex-col items-center gap-4 p-4 border-2 border-dashed rounded-lg">
                                        {image ? (
                                            <div className="relative w-48 aspect-square rounded-lg overflow-hidden shadow-md">
                                                <img src={image} alt="Student" className="w-full h-full object-cover" />
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="icon"
                                                    className="absolute top-2 right-2 rounded-full"
                                                    onClick={() => setImage(null)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ) : isCameraOpen ? (
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="w-64 aspect-video bg-black rounded-lg overflow-hidden relative">
                                                    <video ref={videoRef} autoPlay muted className="w-full h-full object-cover" />
                                                    <canvas ref={canvasRef} className="hidden" />
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button type="button" onClick={capturePhoto} className="bg-institution">Capture</Button>
                                                    <Button type="button" variant="outline" onClick={stopCamera}>Cancel</Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
                                                    <Camera className="w-10 h-10 text-muted-foreground" />
                                                </div>
                                                <p className="text-sm text-muted-foreground">No photo captured</p>
                                                <div className="flex gap-2">
                                                    <Button type="button" variant="outline" onClick={startCamera} className="gap-2">
                                                        <Camera className="w-4 h-4" /> Take Photo
                                                    </Button>
                                                    <div className="relative">
                                                        <Input
                                                            type="file"
                                                            accept="image/*"
                                                            className="hidden"
                                                            id="file-upload"
                                                            onChange={handleFileUpload}
                                                        />
                                                        <Button type="button" variant="outline" onClick={() => document.getElementById('file-upload')?.click()} className="gap-2">
                                                            <Upload className="w-4 h-4" /> Upload File
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
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
                                    <Select
                                        value={formData.class}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, class: value }))}
                                    >
                                        <SelectTrigger id="class">
                                            <SelectValue placeholder="Select Class" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {['LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map((cls) => (
                                                <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="section">Section</Label>
                                    <Select
                                        value={formData.section}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, section: value }))}
                                    >
                                        <SelectTrigger id="section">
                                            <SelectValue placeholder="Select Section" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {['A', 'B', 'C', 'D'].map((sec) => (
                                                <SelectItem key={sec} value={sec}>{sec}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
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
