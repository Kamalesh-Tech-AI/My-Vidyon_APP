import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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
import { Send } from 'lucide-react';
import { useState, useEffect } from 'react';

interface MarksEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    student: {
        id: string;
        name: string;
        register_number: string;
    } | null;
    subject: string;
    existingMarks?: {
        internal: number;
        external: number;
        grade?: string;
        remarks?: string;
    };
    onSubmit: (studentId: string, marks: { internal: number; external: number; grade: string; remarks: string }) => void;
    isSubmitting?: boolean;
}

export function MarksEntryModal({
    isOpen,
    onClose,
    student,
    subject,
    existingMarks,
    onSubmit,
    isSubmitting = false
}: MarksEntryModalProps) {
    const [internal, setInternal] = useState<string>('');
    const [external, setExternal] = useState<string>('');
    const [grade, setGrade] = useState<string>('');
    const [remarks, setRemarks] = useState<string>('');
    const [errors, setErrors] = useState<{ internal?: string; external?: string }>({});

    useEffect(() => {
        if (isOpen && existingMarks) {
            setInternal(existingMarks.internal.toString());
            setExternal(existingMarks.external.toString());
            setGrade(existingMarks.grade || '');
            setRemarks(existingMarks.remarks || '');
        } else if (isOpen) {
            setInternal('');
            setExternal('');
            setGrade('');
            setRemarks('');
        }
        setErrors({});
    }, [isOpen, existingMarks]);

    const validateMarks = () => {
        const newErrors: { internal?: string; external?: string } = {};
        const internalNum = parseFloat(internal);
        const externalNum = parseFloat(external);

        if (internal === '' || isNaN(internalNum)) {
            newErrors.internal = 'Required';
        } else if (internalNum < 0 || internalNum > 20) {
            newErrors.internal = 'Must be between 0-20';
        }

        if (external === '' || isNaN(externalNum)) {
            newErrors.external = 'Required';
        } else if (externalNum < 0 || externalNum > 80) {
            newErrors.external = 'Must be between 0-80';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (validateMarks() && student) {
            onSubmit(student.id, {
                internal: parseFloat(internal),
                external: parseFloat(external),
                grade: grade || calculateGrade(total),
                remarks: remarks || 'Good'
            });
        }
    };

    // Auto-calculate grade based on total marks
    const calculateGrade = (totalMarks: number): string => {
        if (totalMarks >= 90) return 'A+';
        if (totalMarks >= 80) return 'A';
        if (totalMarks >= 70) return 'B+';
        if (totalMarks >= 60) return 'B';
        if (totalMarks >= 50) return 'C';
        if (totalMarks >= 40) return 'D';
        return 'F';
    };

    const total = (parseFloat(internal) || 0) + (parseFloat(external) || 0);

    if (!student) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Enter Marks - {subject}</DialogTitle>
                    <DialogDescription>
                        Enter marks for {student.name} (Roll: {student.register_number})
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Student Info */}
                    <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
                        <div className="w-12 h-12 rounded-full bg-muted overflow-hidden">
                            <img
                                src={`https://api.dicebear.com/7.x/initials/svg?seed=${student.name}`}
                                alt={student.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div>
                            <p className="font-semibold">{student.name}</p>
                            <p className="text-sm text-muted-foreground">Roll: {student.register_number}</p>
                        </div>
                    </div>

                    {/* Marks Input */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="internal">
                                Internal Marks <span className="text-xs text-muted-foreground">(Max: 20)</span>
                            </Label>
                            <Input
                                id="internal"
                                type="number"
                                min="0"
                                max="20"
                                step="0.5"
                                value={internal}
                                onChange={(e) => setInternal(e.target.value)}
                                className={errors.internal ? 'border-destructive' : ''}
                                placeholder="0.0"
                            />
                            {errors.internal && (
                                <p className="text-xs text-destructive">{errors.internal}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="external">
                                External Marks <span className="text-xs text-muted-foreground">(Max: 80)</span>
                            </Label>
                            <Input
                                id="external"
                                type="number"
                                min="0"
                                max="80"
                                step="0.5"
                                value={external}
                                onChange={(e) => setExternal(e.target.value)}
                                className={errors.external ? 'border-destructive' : ''}
                                placeholder="0.0"
                            />
                            {errors.external && (
                                <p className="text-xs text-destructive">{errors.external}</p>
                            )}
                        </div>
                    </div>

                    {/* Total Display */}
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                        <div className="flex items-center justify-between">
                            <span className="font-semibold">Total Marks:</span>
                            <span className="text-2xl font-bold text-primary">{total.toFixed(1)} / 100</span>
                        </div>
                    </div>

                    {/* Grade and Remarks */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="grade">Grade</Label>
                            <Select value={grade || calculateGrade(total)} onValueChange={setGrade}>
                                <SelectTrigger id="grade">
                                    <SelectValue placeholder="Auto" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="A+">A+</SelectItem>
                                    <SelectItem value="A">A</SelectItem>
                                    <SelectItem value="B+">B+</SelectItem>
                                    <SelectItem value="B">B</SelectItem>
                                    <SelectItem value="C">C</SelectItem>
                                    <SelectItem value="D">D</SelectItem>
                                    <SelectItem value="F">F</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">Auto-calculated</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="remarks">Remarks</Label>
                            <Textarea
                                id="remarks"
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                placeholder="Good, Excellent, Needs improvement..."
                                className="resize-none h-[42px]"
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        <Send className="w-4 h-4 mr-2" />
                        {isSubmitting ? (existingMarks ? 'Updating...' : 'Sending...') : (existingMarks ? 'Update' : 'Send')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
