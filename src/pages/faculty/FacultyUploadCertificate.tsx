import { useState, useRef } from 'react';
import { FacultyLayout } from '@/layouts/FacultyLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Upload, FileText, CheckCircle, X } from 'lucide-react';

export function FacultyUploadCertificate() {
    const [formData, setFormData] = useState({
        studentName: '',
        studentEmail: '',
        studentClass: '',
        studentGrade: '',
        category: '',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const validateFile = (file: File): boolean => {
        const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
        const maxSize = 10 * 1024 * 1024; // 10MB

        if (!validTypes.includes(file.type)) {
            toast.error('Invalid file type. Please upload PDF, JPG, or PNG files only.');
            return false;
        }

        if (file.size > maxSize) {
            toast.error('File size exceeds 10MB. Please upload a smaller file.');
            return false;
        }

        return true;
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && validateFile(file)) {
            setUploadedFile(file);
            toast.success(`File "${file.name}" selected`);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const file = e.dataTransfer.files?.[0];
        if (file && validateFile(file)) {
            setUploadedFile(file);
            toast.success(`File "${file.name}" uploaded`);
        }
    };

    const handleRemoveFile = () => {
        setUploadedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        toast.info('File removed');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!uploadedFile) {
            toast.error('Please upload a certificate file');
            return;
        }

        setIsSubmitting(true);

        // Simulate API call and persistent storage
        setTimeout(() => {
            // Create a mock certificate object
            const newCertificate = {
                title: formData.category, // Use category as title
                course: `Class ${formData.studentClass}`,
                issueDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                status: 'available',
                grade: formData.studentGrade,
                studentEmail: formData.studentEmail,
                fileName: uploadedFile.name
            };

            // Get existing certificates or initialize empty array
            const existingCerts = JSON.parse(localStorage.getItem('mockCertificates') || '[]');

            // Add new certificate
            localStorage.setItem('mockCertificates', JSON.stringify([...existingCerts, newCertificate]));

            setIsSubmitting(false);
            setFormData({
                studentName: '',
                studentEmail: '',
                studentClass: '',
                studentGrade: '',
                category: '',
            });
            setUploadedFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            toast.success(`Certificate uploaded for ${formData.studentName}`);
        }, 1500);
    };

    return (
        <FacultyLayout>
            <PageHeader
                title="Upload Certificate"
                subtitle="Issue new certificates to students"
            />

            <div className="max-w-2xl mx-auto dashboard-card">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="studentName">Student Name</Label>
                                <Input
                                    id="studentName"
                                    name="studentName"
                                    placeholder="e.g. John Doe"
                                    value={formData.studentName}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="studentEmail">Student Email ID</Label>
                                <Input
                                    id="studentEmail"
                                    name="studentEmail"
                                    type="email"
                                    placeholder="student@school.edu"
                                    value={formData.studentEmail}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="studentClass">Student Class</Label>
                                <Select
                                    value={formData.studentClass}
                                    onValueChange={(value) => handleSelectChange('studentClass', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Class" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="9">Class 9</SelectItem>
                                        <SelectItem value="10">Class 10</SelectItem>
                                        <SelectItem value="11">Class 11</SelectItem>
                                        <SelectItem value="12">Class 12</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="studentGrade">Student Grade/Section</Label>
                                <Input
                                    id="studentGrade"
                                    name="studentGrade"
                                    placeholder="e.g. A"
                                    value={formData.studentGrade}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="category">Certificate Category</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(value) => handleSelectChange('category', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Academic Excellence">Academic Excellence</SelectItem>
                                    <SelectItem value="Sports Achievement">Sports Achievement</SelectItem>
                                    <SelectItem value="Perfect Attendance">Perfect Attendance</SelectItem>
                                    <SelectItem value="Course Completion">Course Completion</SelectItem>
                                    <SelectItem value="Participation">Participation</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* File Upload with Drag and Drop */}
                        <div className="space-y-2">
                            <Label>Upload Certificate File</Label>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={handleFileChange}
                                className="hidden"
                                id="file-upload"
                            />

                            {!uploadedFile ? (
                                <div
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${isDragging
                                            ? 'border-primary bg-primary/5 scale-[1.02]'
                                            : 'border-border hover:bg-muted/50 hover:border-primary/50'
                                        }`}
                                >
                                    <Upload className={`w-8 h-8 mb-4 transition-colors ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
                                    <p className="text-sm font-medium mb-1">
                                        {isDragging ? 'Drop file here' : 'Click to upload or drag and drop'}
                                    </p>
                                    <p className="text-xs text-muted-foreground">PDF, JPG or PNG (max. 10MB)</p>
                                </div>
                            ) : (
                                <div className="border-2 border-success bg-success/5 rounded-lg p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <FileText className="w-8 h-8 text-success" />
                                        <div>
                                            <p className="text-sm font-medium">{uploadedFile.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {(uploadedFile.size / 1024).toFixed(2)} KB
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleRemoveFile}
                                        className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button type="submit" className="btn-primary min-w-[120px]" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>Posting...</>
                            ) : (
                                <>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Post Certificate
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </FacultyLayout>
    );
}
