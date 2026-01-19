import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { generateUUID } from '@/lib/utils';
import { Plus, Upload, X, Loader2, ChevronDown, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { useRef, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import { Camera, Trash2 } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient, useQuery } from '@tanstack/react-query';

// --- SUB-COMPONENTS ---

function AddStudentDialog({ open, onOpenChange, onSuccess, institutionId }: any) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [data, setData] = useState({
        name: '', registerNumber: '', className: '', section: '', dob: '', gender: '',
        parentName: '', parentEmail: '', parentPhone: '', email: '', address: '', password: '', phone: ''
    });
    const [image, setImage] = useState<string | null>(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

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
    const queryClient = useQueryClient();

    // Fetch Classes
    const { data: groups = [] } = useQuery({
        queryKey: ['institution-groups', institutionId],
        queryFn: async () => {
            if (!institutionId) return [];
            const { data, error } = await supabase
                .from('groups')
                .select('id, name, classes(id, name, sections)')
                .eq('institution_id', institutionId);
            if (error) throw error;
            return data || [];
        },
        enabled: !!institutionId && open
    });

    const availableClasses = useMemo(() => {
        return groups.flatMap((g: any) =>
            g.classes.map((c: any) => ({
                id: c.id,
                name: c.name,
                sections: c.sections || []
            }))
        );
    }, [groups]);

    const availableSections = useMemo(() => {
        const selectedClass = availableClasses.find(c => c.name === data.className);
        return selectedClass ? selectedClass.sections : [];
    }, [availableClasses, data.className]);


    const handleSubmit = async () => {
        if (!data.name || !data.email || !data.password || !data.parentEmail || !data.parentPhone) {
            toast.error('Please fill all mandatory fields');
            return;
        }

        setIsSubmitting(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('No active session found. Please log in again.');

            // DEBUG: Log the token explicitly to verify it exists and is attached
            console.log('Using Access Token:', session.access_token ? (session.access_token.substring(0, 10) + '...') : 'NULL');

            // 1. Photo Upload
            let imageUrl = null;

            if (image) {
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

                if (uploadError) throw new Error(`Could not upload photo: ${uploadError.message}. Did you create the 'student-photos' bucket and make it public?`);
                const { data: { publicUrl } } = supabase.storage.from('student-photos').getPublicUrl(fileName);
                imageUrl = publicUrl;
            }

            const { data: responseData, error } = await supabase.functions.invoke('create-user', {
                headers: {
                    Authorization: `Bearer ${session.access_token}`
                },
                body: {
                    email: data.email,
                    password: data.password,
                    role: 'student',
                    full_name: data.name,
                    institution_id: institutionId,
                    parent_email: data.parentEmail,
                    parent_phone: data.parentPhone,
                    parent_name: data.parentName,
                    register_number: data.registerNumber,
                    class_name: data.className,
                    section: data.section,
                    image_url: imageUrl, // Hope Edge function supports this
                    gender: data.gender,
                    address: data.address,
                    date_of_birth: data.dob,
                    phone: (data as any).phone || ""
                }
            });

            if (error) throw error;

            toast.success('Student added successfully');
            // Optimistic update or immediate fetch
            queryClient.invalidateQueries({ queryKey: ['institution-students'] });
            onSuccess();
            onOpenChange(false);
            setData({ name: '', registerNumber: '', className: '', section: '', dob: '', gender: '', parentName: '', parentEmail: '', parentPhone: '', email: '', address: '', password: '', phone: '' });
            setImage(null);
        } catch (error: any) {
            const errorMsg = error.message || 'Failed to add student';
            const errorDetails = error.details || error.hint ? ` (${error.details || error.hint})` : '';
            toast.error(errorMsg + errorDetails);
            console.error('Student creation error:', error);

            if (errorMsg.includes('401') || errorMsg.includes('Unauthorized')) {
                toast.error('Session expired or unauthorized. Please Log Out and Log In again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add Student</DialogTitle>
                    <DialogDescription>Fill in student details.</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                    {/* Inputs with local state 'data' */}
                    <div className="space-y-2">
                        <Label>Student Name *</Label>
                        <Input value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} placeholder="e.g. John Doe" />
                    </div>
                    <div className="space-y-2">
                        <Label>Register Number</Label>
                        <Input value={data.registerNumber} onChange={(e) => setData({ ...data, registerNumber: e.target.value })} placeholder="e.g. REG-2024-001" />
                    </div>
                    <div className="space-y-2">
                        <Label>Class</Label>
                        <Select value={data.className} onValueChange={(val) => setData({ ...data, className: val, section: '' })}>
                            <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
                            <SelectContent>
                                {availableClasses.map((c: any) => (
                                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Section</Label>
                        <Select value={data.section} onValueChange={(val) => setData({ ...data, section: val })} disabled={!data.className}>
                            <SelectTrigger><SelectValue placeholder="Select Section" /></SelectTrigger>
                            <SelectContent>
                                {availableSections.map((sec: string) => (
                                    <SelectItem key={sec} value={sec}>{sec}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Date of Birth</Label>
                        <Input type="date" value={data.dob} onChange={(e) => setData({ ...data, dob: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                        <Label>Gender</Label>
                        <Select value={data.gender} onValueChange={(val) => setData({ ...data, gender: val })}>
                            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Parent Name</Label>
                        <Input value={data.parentName} onChange={(e) => setData({ ...data, parentName: e.target.value })} placeholder="e.g. Robert Doe" />
                    </div>
                    <div className="space-y-2">
                        <Label>Parent Email *</Label>
                        <Input type="email" value={data.parentEmail} onChange={(e) => setData({ ...data, parentEmail: e.target.value })} placeholder="valid@email.com" />
                    </div>
                    <div className="space-y-2">
                        <Label>Parent Phone *</Label>
                        <Input type="tel" value={data.parentPhone} onChange={(e) => setData({ ...data, parentPhone: e.target.value })} placeholder="e.g. 9876543210 (10 digits)" />
                    </div>
                    <div className="space-y-2">
                        <Label>Student Email *</Label>
                        <Input type="email" value={data.email} onChange={(e) => setData({ ...data, email: e.target.value })} placeholder="student@school.com" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label>Address</Label>
                        <Input value={data.address} onChange={(e) => setData({ ...data, address: e.target.value })} placeholder="Full residential address" />
                    </div>
                    <div className="space-y-2">
                        <Label>Student Phone</Label>
                        <Input type="tel" value={(data as any).phone || ''} onChange={(e) => setData({ ...data, phone: e.target.value } as any)} placeholder="e.g. 9876543210" />
                    </div>
                    <div className="space-y-2">
                        <Label>Password *</Label>
                        <Input type="password" value={data.password} onChange={(e) => setData({ ...data, password: e.target.value })} placeholder="Min 6 characters" />
                    </div>

                    {/* PHOTO SECTION */}
                    <div className="space-y-2 md:col-span-2 border-t pt-4">
                        <Label>Student Photo (For Camera Recognition)</Label>
                        <div className="flex flex-col items-center gap-4 p-4 border-2 border-dashed rounded-lg bg-muted/50">
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
                                        <Button type="button" onClick={capturePhoto} className="bg-primary">Capture</Button>
                                        <Button type="button" variant="outline" onClick={stopCamera}>Cancel</Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                                        <Camera className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                    <div className="flex gap-3">
                                        <Button type="button" variant="outline" onClick={startCamera} className="gap-2">
                                            <Camera className="w-4 h-4" /> Take Photo
                                        </Button>
                                        <div className="relative">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                id="dialog-file-upload"
                                                onChange={handleFileUpload}
                                            />
                                            <Button type="button" variant="outline" onClick={() => document.getElementById('dialog-file-upload')?.click()} className="gap-2">
                                                <Upload className="w-4 h-4" /> Upload File
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Add Student
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function AddStaffDialog({ open, onOpenChange, onSuccess, institutionId }: any) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubjectsOpen, setIsSubjectsOpen] = useState(false);
    const [data, setData] = useState({ name: '', staffId: '', role: '', email: '', phone: '', dob: '', password: '', department: '', subjects: [] as string[] });
    const [image, setImage] = useState<string | null>(null);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const queryClient = useQueryClient();

    const startCamera = async () => {
        try {
            setIsCameraActive(true);
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            toast.error("Could not access camera");
            setIsCameraActive(false);
        }
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (context) {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imageData = canvas.toDataURL('image/jpeg');
                setImage(imageData);
                stopCamera();
            }
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setIsCameraActive(false);
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

    const { data: subjectsList = [] } = useQuery({
        queryKey: ['institution-subjects-list', institutionId],
        queryFn: async () => {
            if (!institutionId) return [];
            const { data, error } = await supabase
                .from('subjects')
                .select('id, name, department')
                .eq('institution_id', institutionId);

            if (error) throw error;
            return data || [];
        },
        enabled: !!institutionId && open
    });

    const uniqueDepartments = useMemo(() => {
        return Array.from(new Set(subjectsList.map((s: any) => s.department).filter(Boolean))).sort();
    }, [subjectsList]);

    const availableSubjects = useMemo(() => {
        if (!data.department) return subjectsList.map((s: any) => s.name);
        return subjectsList.filter((s: any) => s.department === data.department).map((s: any) => s.name);
    }, [subjectsList, data.department]);

    const handleSubmit = async () => {
        if (!data.name || !data.email || !data.password || !data.staffId) {
            toast.error('Please fill all mandatory fields');
            return;
        }
        setIsSubmitting(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('No active session found. Please log in again.');

            // Upload photo if exists
            let imageUrl = null;
            if (image) {
                const blob = await fetch(image).then(res => res.blob());
                const fileName = `staff_${Date.now()}.jpg`;
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('student-photos')
                    .upload(fileName, blob);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('student-photos')
                    .getPublicUrl(fileName);
                imageUrl = publicUrl;
            }

            // Use create-user Edge Function for consistency
            const { data: responseData, error } = await supabase.functions.invoke('create-user', {
                headers: {
                    Authorization: `Bearer ${session.access_token}`
                },
                body: {
                    email: data.email,
                    password: data.password,
                    role: 'faculty',
                    full_name: data.name,
                    institution_id: institutionId,
                    staff_id: data.staffId,
                    department: data.department || null,
                    subjects: data.subjects,
                    phone: data.phone || null,
                    date_of_birth: data.dob || null,
                    image_url: imageUrl
                }
            });

            if (error) throw error;

            // Generate face embedding if image exists
            if (imageUrl && responseData?.user?.id) {
                try {
                    await supabase.functions.invoke('generate-face-embedding', {
                        body: { imageUrl, userId: responseData.user.id, label: data.name }
                    });
                } catch (e) {
                    console.warn('Embedding generation failed (non-critical):', e);
                }
            }

            toast.success('Staff member added successfully!');
            await queryClient.invalidateQueries({ queryKey: ['institution-staff', institutionId] });
            onSuccess();
            onOpenChange(false);
            setData({ name: '', staffId: '', role: '', email: '', phone: '', dob: '', password: '', department: '', subjects: [] });
            setImage(null);
        } catch (error: any) {
            console.error('Staff creation error:', error);
            const errorMsg = error.message || 'Failed to create staff';
            toast.error(errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Add Staff</DialogTitle></DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                    {/* Photo Capture Section */}
                    <div className="md:col-span-2 space-y-2">
                        <Label>Staff Photo (for Face Recognition)</Label>
                        <div className="flex flex-col items-center gap-4 p-4 border-2 border-dashed rounded-lg bg-muted/30">
                            {image ? (
                                <div className="relative">
                                    <img src={image} alt="Staff Preview" className="w-32 h-32 object-cover rounded-full border-2 border-primary" />
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                                        onClick={() => setImage(null)}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                            ) : isCameraActive ? (
                                <div className="relative w-full max-w-[300px]">
                                    <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg border shadow-sm" />
                                    <canvas ref={canvasRef} className="hidden" />
                                    <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2">
                                        <Button size="sm" onClick={capturePhoto} className="bg-primary text-white">Capture</Button>
                                        <Button size="sm" variant="secondary" onClick={stopCamera}>Cancel</Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
                                        <Upload className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button onClick={startCamera} variant="outline" type="button">Start Camera</Button>
                                        <Button variant="ghost" type="button" onClick={() => (document.getElementById('staff-image-upload') as HTMLInputElement).click()}>
                                            Upload File
                                        </Button>
                                        <input
                                            id="staff-image-upload"
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleFileUpload}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2"><Label>Name *</Label><Input value={data.name} onChange={e => setData({ ...data, name: e.target.value })} placeholder="e.g. Sarah Smith" /></div>
                    <div className="space-y-2"><Label>Staff ID *</Label><Input value={data.staffId} onChange={e => setData({ ...data, staffId: e.target.value })} placeholder="e.g. STF-2024-005" /></div>
                    <div className="space-y-2">
                        <Label>Role</Label>
                        <Select value={data.role} onValueChange={v => setData({ ...data, role: v })}>
                            <SelectTrigger><SelectValue placeholder="Select Role" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="teacher">Teacher</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="support">Support</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Department</Label>
                        <Select value={data.department} onValueChange={v => setData({ ...data, department: v, subjects: [] })}>
                            <SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger>
                            <SelectContent>
                                {uniqueDepartments.map((dept: any) => (
                                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <Label>Subjects</Label>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setIsSubjectsOpen(!isSubjectsOpen)}
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <span className={data.subjects.length === 0 ? "text-muted-foreground" : ""}>
                                    {data.subjects.length > 0 ? `${data.subjects.length} subjects selected` : "Select subjects..."}
                                </span>
                                <ChevronDown className="h-4 w-4 opacity-50" />
                            </button>

                            {isSubjectsOpen && (
                                <div className="absolute z-50 w-full mt-1 rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95">
                                    <div className="p-2 max-h-60 overflow-y-auto">
                                        {availableSubjects.length === 0 ? (
                                            <p className="text-sm text-muted-foreground p-2">No subjects available {data.department ? `in ${data.department}` : ''}</p>
                                        ) : (
                                            <div className="grid gap-1">
                                                {availableSubjects.map((subName: string) => (
                                                    <div
                                                        key={subName}
                                                        className="flex items-center space-x-2 p-2 hover:bg-accent hover:text-accent-foreground rounded-sm cursor-pointer"
                                                        onClick={() => {
                                                            const newSubs = data.subjects.includes(subName)
                                                                ? data.subjects.filter(s => s !== subName)
                                                                : [...data.subjects, subName];
                                                            setData({ ...data, subjects: newSubs });
                                                        }}
                                                    >
                                                        <div className={`flex h-4 w-4 items-center justify-center rounded-sm border border-primary ${data.subjects.includes(subName) ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible"}`}>
                                                            <Check className="h-4 w-4" />
                                                        </div>
                                                        <span className="text-sm">{subName}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        {data.department && <p className="text-[10px] text-muted-foreground">Showing subjects for {data.department} (change department to filter differently or clear department to see all)</p>}
                    </div>

                    <div className="space-y-2"><Label>Email *</Label><Input type="email" value={data.email} onChange={e => setData({ ...data, email: e.target.value })} placeholder="staff@institution.com" /></div>
                    <div className="space-y-2"><Label>Phone</Label><Input type="tel" value={data.phone} onChange={e => setData({ ...data, phone: e.target.value })} placeholder="e.g. 9876543210" /></div>
                    <div className="space-y-2"><Label>DOB</Label><Input type="date" value={data.dob} onChange={e => setData({ ...data, dob: e.target.value })} /></div>
                    <div className="space-y-2 md:col-span-2"><Label>Password *</Label><Input type="password" value={data.password} onChange={e => setData({ ...data, password: e.target.value })} placeholder="Min 6 characters" /></div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>Add Staff</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function AddParentDialog({ open, onOpenChange, onSuccess, institutionId, students }: any) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [data, setData] = useState({ name: '', email: '', phone: '', password: '', studentIds: [] as string[] });
    const queryClient = useQueryClient();

    // Filter students by matching parent email
    const filteredStudents = useMemo(() => {
        if (!data.email) return students;
        return students.filter((s: any) =>
            s.parent_email?.toLowerCase() === data.email.toLowerCase()
        );
    }, [students, data.email]);

    const handleSubmit = async () => {
        if (!data.name || !data.email || !data.phone || !data.password || data.studentIds.length === 0) {
            toast.error('Please fill all mandatory fields');
            return;
        }
        setIsSubmitting(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('No active session found. Please log in again.');

            const { data: responseData, error } = await supabase.functions.invoke('create-user', {
                headers: {
                    Authorization: `Bearer ${session.access_token}`
                },
                body: {
                    email: data.email,
                    password: data.password,
                    role: 'parent',
                    full_name: data.name,
                    institution_id: institutionId,
                    phone: data.phone,
                    student_id: data.studentIds[0],
                    student_ids: data.studentIds
                }
            });

            if (error) throw error;

            if (responseData?.user?.id && data.studentIds.length > 0) {
                // Link multiple logic (same as before)
                const { data: parentRecord } = await supabase.from('parents').select('id').eq('profile_id', responseData.user.id).single();
                if (parentRecord) {
                    const links = data.studentIds.map(sId => ({ student_id: sId, parent_id: parentRecord.id }));
                    await supabase.from('student_parents').upsert(links, { onConflict: 'student_id,parent_id' });
                }
            }
            toast.success('Parent added');
            queryClient.invalidateQueries({ queryKey: ['institution-parents'] });
            onSuccess();
            onOpenChange(false);
            setData({ name: '', email: '', phone: '', password: '', studentIds: [] });
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl">
                <DialogHeader><DialogTitle>Add Parent</DialogTitle></DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                    <div className="space-y-2"><Label>Name *</Label><Input value={data.name} onChange={e => setData({ ...data, name: e.target.value })} placeholder="e.g. Robert Doe" /></div>
                    <div className="space-y-2"><Label>Email *</Label><Input type="email" value={data.email} onChange={e => setData({ ...data, email: e.target.value })} placeholder="valid@email.com" /></div>
                    <div className="space-y-2"><Label>Phone *</Label><Input type="tel" value={data.phone} onChange={e => setData({ ...data, phone: e.target.value })} placeholder="e.g. 9876543210 (10 digits)" /></div>
                    <div className="space-y-2"><Label>Password *</Label><Input type="password" value={data.password} onChange={e => setData({ ...data, password: e.target.value })} placeholder="Min 6 characters" /></div>
                    <div className="space-y-2 md:col-span-2">
                        <Label>Children * {data.email && `(matching ${data.email})`}</Label>
                        <div className="grid grid-cols-1 gap-2 border rounded-lg p-3 max-h-40 overflow-y-auto bg-card">
                            {filteredStudents.length === 0 ? (
                                <p className="text-xs text-muted-foreground text-center py-2">
                                    {data.email ? 'No students found with this parent email' : 'Enter parent email to see matching students'}
                                </p>
                            ) : (
                                filteredStudents.map((child: any) => (
                                    <div key={child.id} className="flex items-center gap-2">
                                        <input type="checkbox" checked={data.studentIds.includes(child.id)}
                                            onChange={(e) => {
                                                const newIds = e.target.checked ? [...data.studentIds, child.id] : data.studentIds.filter(id => id !== child.id);
                                                setData({ ...data, studentIds: newIds });
                                            }}
                                        />
                                        <span className="text-sm">{child.name}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>Add Parent</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export { AddStudentDialog, AddStaffDialog, AddParentDialog };
