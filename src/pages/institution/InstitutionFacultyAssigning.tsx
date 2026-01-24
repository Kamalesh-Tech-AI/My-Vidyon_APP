import { useState, useEffect, useRef } from 'react';
import { InstitutionLayout } from '@/layouts/InstitutionLayout';
import { useInstitution } from '@/context/InstitutionContext';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { UserCheck, Plus, X, GraduationCap, Upload, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/common/Badge';
import * as XLSX from 'xlsx';

interface StaffAssignment {
    id: string; // internal id for UI list key
    staffName: string;
    staffId: string;
}

export function InstitutionFacultyAssigning() {
    // Dynamic data from context
    // Dynamic data from context
    const { allClasses, allSubjects, allStaffMembers, getAssignedStaff, assignStaff, getClassTeacher, assignClassTeacher, classTeachers } = useInstitution();

    // State Variables
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [selectedSection, setSelectedSection] = useState<string>('');
    const [selectedClassTeacher, setSelectedClassTeacher] = useState<string>('');
    const [selectedSubject, setSelectedSubject] = useState<string>('');
    const [subjectStaff, setSubjectStaff] = useState<StaffAssignment[]>([]);

    // Compute unique class names and sections from allClasses
    // allClasses = [{id, name, section}, ...]
    // uniqueClasses = ['Grade 1', 'Grade 2'...]
    const uniqueClasses = Array.from(new Set(allClasses.map(c => c.name))).sort((a, b) => {
        const order = ['LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];
        const indexA = order.findIndex(o => a.startsWith(o)); // simple match
        const indexB = order.findIndex(o => b.startsWith(o));

        // precise match preferred
        const exactIndexA = order.indexOf(a);
        const exactIndexB = order.indexOf(b);

        if (exactIndexA !== -1 && exactIndexB !== -1) return exactIndexA - exactIndexB;
        if (exactIndexA !== -1) return -1;
        if (exactIndexB !== -1) return 1;

        // Fallback to numeric extraction if possible
        const numA = parseInt(a.replace(/\D/g, ''));
        const numB = parseInt(b.replace(/\D/g, ''));
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;

        return a.localeCompare(b);
    });

    // Derived sections for selected class
    const [availableSections, setAvailableSections] = useState<string[]>([]);

    useEffect(() => {
        if (selectedClass) {
            const sections = allClasses
                .filter(c => c.name === selectedClass)
                .map(c => c.section)
                .sort();
            setAvailableSections(sections);
            // Reset section if not in new list
            if (selectedSection && !sections.includes(selectedSection)) {
                setSelectedSection('');
            }
        } else {
            setAvailableSections([]);
        }
    }, [selectedClass, allClasses]);

    // Load Class Teacher when Class/Section changes
    useEffect(() => {
        if (selectedClass && selectedSection) {
            // Find the class ID for this combination to be precise, or just use name/section if context expects that.
            // assignStaff/getClassTeacher expect name/section strings as per context definition? 
            // Wait, looking at context in previous turn: 
            // const getClassTeacher = (classId: string, section: string) 
            // It expects classId (UUID) and section.
            // But here we are selecting 'class Name'. We need to find the UUID.
            const classObj = allClasses.find(c => c.name === selectedClass && c.section === selectedSection);
            const classId = classObj ? classObj.id : '';

            if (classId) {
                const ctId = getClassTeacher(classId, selectedSection);
                setSelectedClassTeacher(ctId || '');
            }
        } else {
            setSelectedClassTeacher('');
        }
    }, [selectedClass, selectedSection, getClassTeacher]);

    // Load existing Subject assignments when Subject (or Class/Section) changes
    useEffect(() => {
        if (selectedClass && selectedSection && selectedSubject) {
            const classObj = allClasses.find(c => c.name === selectedClass && c.section === selectedSection);
            const classId = classObj ? classObj.id : '';

            if (classId) {
                const assigned = getAssignedStaff(classId, selectedSection, selectedSubject);

                // Map to UI format
                const uiStaff = assigned.map(s => ({
                    id: Math.random().toString(36).substr(2, 9),
                    staffId: s.id,
                    staffName: s.name
                }));

                setSubjectStaff(uiStaff);
            } else {
                setSubjectStaff([]);
            }
        } else {
            setSubjectStaff([]);
        }
    }, [selectedClass, selectedSection, selectedSubject, getAssignedStaff, allClasses]);

    const handleAddStaff = () => {
        if (selectedSubject) {
            const newStaff: StaffAssignment = {
                id: Date.now().toString(),
                staffName: '',
                staffId: ''
            };
            setSubjectStaff([...subjectStaff, newStaff]);
        } else {
            toast.error("Please select a subject first.");
        }
    };

    const handleRemoveStaff = (id: string) => {
        setSubjectStaff(subjectStaff.filter(s => s.id !== id));
    };

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleBulkUpdate = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

                const newAssignments: StaffAssignment[] = [];
                let skipCount = 0;

                // Skip header if it exists
                const startRow = (jsonData[0]?.[0]?.toString().toLowerCase().includes('name') ||
                    jsonData[0]?.[0]?.toString().toLowerCase().includes('staff') ||
                    jsonData[0]?.[0]?.toString().toLowerCase().includes('id')) ? 1 : 0;

                for (let i = startRow; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    if (!row || row.length === 0) continue;

                    const input = row[0]?.toString().trim();
                    if (!input) continue;

                    // Try to find staff by ID or Name
                    const staff = allStaffMembers.find(s =>
                        s.id.toLowerCase() === input.toLowerCase() ||
                        s.name.toLowerCase() === input.toLowerCase()
                    );

                    if (staff) {
                        // Avoid duplicates in the current list
                        if (!subjectStaff.some(s => s.staffId === staff.id) && !newAssignments.some(s => s.staffId === staff.id)) {
                            newAssignments.push({
                                id: (Date.now() + i).toString(),
                                staffId: staff.id,
                                staffName: staff.name
                            });
                        }
                    } else {
                        skipCount++;
                    }
                }

                if (newAssignments.length > 0) {
                    setSubjectStaff(prev => [...prev, ...newAssignments]);
                    toast.success(`Successfully added ${newAssignments.length} staff members.`);
                }

                if (skipCount > 0) {
                    toast.warning(`${skipCount} names in the file didn't match our staff records.`);
                }

                if (newAssignments.length === 0 && skipCount === 0) {
                    toast.info("The file appears to be empty or in an incorrect format.");
                }

            } catch (error) {
                console.error("Bulk update error:", error);
                toast.error("Format error: Please ensure you upload a valid Excel or CSV file.");
            }
        };
        reader.readAsArrayBuffer(file);

        // Reset file input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleStaffChange = (id: string, staffId: string) => {
        const selectedStaff = allStaffMembers.find(s => s.id === staffId);
        if (selectedStaff) {
            setSubjectStaff(subjectStaff.map(s =>
                s.id === id
                    ? { ...s, staffId: selectedStaff.id, staffName: selectedStaff.name }
                    : s
            ));
        }
    };

    const handleSubmit = () => {
        if (selectedClass && selectedSection) {
            let hasErrors = false;

            // validate Class Teacher (optional? usually required)
            // if required:
            if (!selectedClassTeacher) {
                toast.error("Please select a Class Teacher.");
                hasErrors = true;
            }

            // Save Class Teacher
            if (selectedClassTeacher) {
                const classObj = allClasses.find(c => c.name === selectedClass && c.section === selectedSection);
                if (classObj) assignClassTeacher(classObj.id, selectedSection, selectedClassTeacher);
            }

            // Save Subject Staff
            if (selectedSubject) {
                // Validate subject staff 
                if (subjectStaff.length > 0 && subjectStaff.some(s => !s.staffId)) {
                    toast.error("Please select a staff member for all subject assignment rows.");
                    hasErrors = true;
                }

                if (!hasErrors) {
                    const classObj = allClasses.find(c => c.name === selectedClass && c.section === selectedSection);
                    if (classObj) {
                        const staffIds = subjectStaff.map(s => s.staffId).filter(Boolean);
                        assignStaff(classObj.id, selectedSection, selectedSubject, staffIds);
                    }
                }
            } else {
                // If no subject is selected, we only saved Class Teacher, which is valid.
                if (!hasErrors) toast.success("Class Teacher saved!");
            }

            if (!hasErrors && selectedSubject) {
                // The assignStaff function triggered a toast internally in previous step, so we might get partial double toast if we add one here.
                // let's rely on assignStaff toast or context toast. 
                // Actually I removed toast from assignClassTeacher to avoid spam.
                // Let's just toast "Assignments Saved" once if everything is good.
                // But assignStaff has toast inside it... I should probably remove it from context or just live with "Subject staff assigned" + "Class teacher saved"
                // Let's refine context later if needed.
            }

        } else {
            toast.error('Please select Class and Section');
        }
    };

    return (
        <InstitutionLayout>
            <PageHeader
                title="Faculty Assigning"
                subtitle="Assign teachers to classes, sections, and subjects"
            />

            <div className="dashboard-card p-6">

                {/* Unified Form */}
                <div className="space-y-8">

                    {/* 1. Class Selection Row */}
                    <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                            <UserCheck className="w-5 h-5 text-primary" />
                            Class & Section Selection
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="class">Select Class *</Label>
                                <Select value={selectedClass} onValueChange={setSelectedClass}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Choose class" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {uniqueClasses.map((cls) => (
                                            <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="section">Select Section *</Label>
                                <Select value={selectedSection} onValueChange={setSelectedSection}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choose section" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableSections.map((sec) => (
                                            <SelectItem key={sec} value={sec}>{sec}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <div className="border-t pt-6"></div>

                    {/* 2. Class Teacher Assignment */}
                    {selectedClass && selectedSection && (
                        <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
                            <h3 className="text-md font-semibold flex items-center gap-2 mb-3 text-primary">
                                <GraduationCap className="w-5 h-5" />
                                Class Teacher Assignment
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="classTeacher">Assign Class Teacher (One per class) *</Label>
                                    <Select value={selectedClassTeacher} onValueChange={setSelectedClassTeacher}>
                                        <SelectTrigger className="bg-background">
                                            <SelectValue placeholder="Choose Class Teacher" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(() => {
                                                // Calculate assigned teachers across all classes
                                                const assignedTeacherIds = new Set<string>();
                                                if (classTeachers) { // classTeachers is from context
                                                    Object.entries(classTeachers).forEach(([cId, sections]) => {
                                                        Object.entries(sections).forEach(([sec, tId]) => {
                                                            // Don't count the current class/section's teacher as "unavailable" for itself
                                                            // We need the ID of the current selected class.
                                                            // We derive classId from Name+Section logic elsewhere, but simpler:
                                                            // If tId is the *current value* (selectedClassTeacher), keep it.
                                                            // Actually, simpler: Collect ALL. Then filter.
                                                            assignedTeacherIds.add(String(tId));
                                                        });
                                                    });
                                                }

                                                const currentlyAssignedToThisClass = selectedClassTeacher;

                                                const availableStaff = allStaffMembers.filter(staff => {
                                                    // Allow if not assigned anywhere OR if assigned to THIS class (aka is the current val)
                                                    // Note: We need to know if the assignment in `assignedTeacherIds` belongs to THIS class or another.
                                                    // The set doesn't tell us source.
                                                    // Better approach: Re-calculate set of "Other Class Teachers".
                                                    return true;
                                                }).filter(staff => {
                                                    // Check if staff is assigned to ANY OTHER class
                                                    // Iterate classTeachers map
                                                    let isAssignedElsewhere = false;
                                                    if (classTeachers) {
                                                        Object.entries(classTeachers).forEach(([cId, sections]) => {
                                                            Object.entries(sections).forEach(([sec, tId]) => {
                                                                if (tId === staff.id) {
                                                                    // Found an assignment. Is it THIS class?
                                                                    const clsObj = allClasses.find(c => c.id === cId && c.section === sec);
                                                                    if (clsObj) {
                                                                        if (clsObj.name === selectedClass && clsObj.section === selectedSection) {
                                                                            // Assigned to this class (ok)
                                                                        } else {
                                                                            isAssignedElsewhere = true;
                                                                        }
                                                                    } else {
                                                                        // Fallback: If we can't match class ID, assume it's elsewhere to be safe? 
                                                                        // Or if we don't have the class ID in allClasses?
                                                                        // Let's rely on checking if tId === selectedClassTeacher (from state)
                                                                        // But state might be unsaved.
                                                                        // Let's rely on the fact that if they are in the map for *another* ID, they are busy.
                                                                        // We need the current Class ID.
                                                                        const currentClassObj = allClasses.find(c => c.name === selectedClass && c.section === selectedSection);
                                                                        if (currentClassObj && cId !== currentClassObj.id) {
                                                                            isAssignedElsewhere = true;
                                                                        }
                                                                        // If IDs match but section different?
                                                                        if (currentClassObj && cId === currentClassObj.id && sec !== selectedSection) {
                                                                            isAssignedElsewhere = true;
                                                                        }
                                                                    }
                                                                }
                                                            });
                                                        });
                                                    }
                                                    return !isAssignedElsewhere;
                                                });

                                                return availableStaff.map((staff) => (
                                                    <SelectItem key={staff.id} value={staff.id}>{staff.name}</SelectItem>
                                                ));
                                            })()}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Only staff not assigned as Class Teacher elsewhere are shown.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 3. Subject Staff Assignment */}
                    {selectedClass && selectedSection && (
                        <div>
                            <h3 className="text-md font-semibold flex items-center gap-2 mb-3">
                                <UserCheck className="w-5 h-5 text-primary" />
                                Subject Staff Assignment
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <Label htmlFor="subject">Select Subject to Assign *</Label>
                                    <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Choose subject" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {allSubjects.map((sub) => (
                                                <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {selectedSubject && (
                                <div className="space-y-4 border rounded-lg p-4 bg-muted/10">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-base">Teachers for {allSubjects.find(s => s.id === selectedSubject)?.name}</Label>
                                        <div className="flex gap-2">
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handleBulkUpdate}
                                                accept=".csv, .xlsx, .xls"
                                                className="hidden"
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="flex items-center gap-2 border-primary/50 text-primary hover:bg-primary/5 shadow-sm"
                                            >
                                                <Upload className="w-4 h-4" />
                                                Bulk Update
                                            </Button>
                                            <Button
                                                type="button"
                                                size="sm"
                                                onClick={handleAddStaff}
                                                className="flex items-center gap-2"
                                            >
                                                <Plus className="w-4 h-4" />
                                                Add Staff
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="bg-primary/5 border border-primary/10 rounded-md p-2 flex items-start gap-2 text-[10px] text-muted-foreground shadow-inner">
                                        <FileText className="w-3 h-3 mt-0.5 text-primary" />
                                        <div>
                                            <p className="font-semibold text-primary/80">Bulk Update Format:</p>
                                            <p>Upload a .csv or .xlsx with a single column containing <strong>Staff Names</strong> or <strong>IDs</strong>.</p>
                                        </div>
                                    </div>

                                    {subjectStaff.length === 0 ? (
                                        <div className="p-6 border-2 border-dashed rounded-lg text-center text-muted-foreground bg-background">
                                            <p>No staff assigned to {allSubjects.find(s => s.id === selectedSubject)?.name} yet.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {subjectStaff.map((staff) => (
                                                <div key={staff.id} className="flex items-center gap-3 p-3 bg-background border rounded-lg shadow-sm">
                                                    <div className="flex-1">
                                                        <Select
                                                            value={staff.staffId}
                                                            onValueChange={(value) => handleStaffChange(staff.id, value)}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select a teacher" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {allStaffMembers.map((member) => (
                                                                    <SelectItem key={member.id} value={member.id}>
                                                                        {member.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleRemoveStaff(staff.id)}
                                                    >
                                                        <X className="w-4 h-4 text-destructive" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Preview Section - Only show if we have data */}
                    {(selectedClassTeacher || subjectStaff.length > 0) && selectedClass && selectedSection && (
                        <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                            <p className="text-sm font-medium mb-2 text-blue-900">Current Session Preview:</p>
                            <div className="flex flex-col gap-2">
                                {selectedClassTeacher && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold uppercase text-muted-foreground w-24">Class Teacher:</span>
                                        <Badge variant="outline" className="bg-white">
                                            {allStaffMembers.find(s => s.id === selectedClassTeacher)?.name}
                                        </Badge>
                                    </div>
                                )}
                                {selectedSubject && subjectStaff.length > 0 && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold uppercase text-muted-foreground w-24">{allSubjects.find(s => s.id === selectedSubject)?.name}:</span>
                                        <div className="flex flex-wrap gap-1">
                                            {subjectStaff.map(s => (
                                                <Badge key={s.id} variant="success">
                                                    {s.staffName}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                </div>

                {/* Submit Button */}
                <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
                    <Button type="button" variant="outline" onClick={() => window.history.back()}>
                        Cancel
                    </Button>
                    <Button type="button" onClick={handleSubmit}>
                        Save All Assignments
                    </Button>
                </div>
            </div>
        </InstitutionLayout >
    );
}
