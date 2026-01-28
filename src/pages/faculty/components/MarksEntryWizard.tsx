import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ChevronRight, Check, BookOpen, GraduationCap, School, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MarksEntryWizardProps {
    // Step 1: Exam Type
    exams: any[];
    selectedExam: string;
    onExamChange: (examId: string) => void;

    // Step 2: Subject
    facultySubjects: string[];
    selectedSubject: string;
    onSubjectChange: (subject: string) => void;

    // Step 3: Class
    classSections: { class_name: string; section: string }[];
    selectedClass: string;
    onClassChange: (className: string) => void;

    // Step 4: Section
    selectedSection: string;
    onSectionChange: (section: string) => void;

    // Step 5: View Students
    onViewStudents: () => void;
}

export function MarksEntryWizard({
    exams,
    selectedExam,
    onExamChange,
    facultySubjects,
    selectedSubject,
    onSubjectChange,
    classSections,
    selectedClass,
    onClassChange,
    selectedSection,
    onSectionChange,
    onViewStudents
}: MarksEntryWizardProps) {
    // Determine current step based on selections
    // New order: Exam → Class → Section → Subject → Students
    const getCurrentStep = () => {
        if (!selectedExam) return 1;
        if (!selectedClass) return 2;
        if (!selectedSection) return 3;
        if (!selectedSubject) return 4;
        return 5;
    };

    const currentStep = getCurrentStep();

    // Debug logging
    console.log('Wizard State:', {
        currentStep,
        selectedExam,
        selectedSubject,
        selectedClass,
        selectedSection
    });
    const availableSections = [...new Set(
        classSections
            .filter(cs => cs.class_name === selectedClass)
            .map(cs => cs.section)
    )];

    const steps = [
        { num: 1, label: 'Exam Type', icon: BookOpen, completed: !!selectedExam },
        { num: 2, label: 'Class', icon: School, completed: !!selectedClass },
        { num: 3, label: 'Section', icon: Layers, completed: !!selectedSection },
        { num: 4, label: 'Subject', icon: GraduationCap, completed: !!selectedSubject },
        { num: 5, label: 'Students', icon: Check, completed: false }
    ];

    return (
        <div className="space-y-6">
            {/* Progress Indicator */}
            <div className="dashboard-card p-6">
                <div className="flex items-center justify-between mb-6">
                    {steps.map((step, idx) => (
                        <div key={step.num} className="flex items-center flex-1">
                            <div className="flex flex-col items-center flex-1">
                                <div
                                    className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center transition-all mb-2",
                                        step.completed
                                            ? "bg-success text-white"
                                            : currentStep === step.num
                                                ? "bg-primary text-white ring-4 ring-primary/20"
                                                : "bg-muted text-muted-foreground"
                                    )}
                                >
                                    {step.completed ? (
                                        <Check className="w-5 h-5" />
                                    ) : (
                                        <step.icon className="w-5 h-5" />
                                    )}
                                </div>
                                <span
                                    className={cn(
                                        "text-xs font-medium text-center",
                                        step.completed || currentStep === step.num
                                            ? "text-foreground"
                                            : "text-muted-foreground"
                                    )}
                                >
                                    {step.label}
                                </span>
                            </div>
                            {idx < steps.length - 1 && (
                                <div
                                    className={cn(
                                        "h-0.5 flex-1 mx-2 transition-colors",
                                        step.completed ? "bg-success" : "bg-muted"
                                    )}
                                />
                            )}
                        </div>
                    ))}
                </div>

                {/* Breadcrumb Navigation - Only show when past step 1 */}
                {currentStep > 1 && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                        {selectedExam && (
                            <>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-auto p-1 hover:text-primary"
                                    onClick={() => {
                                        onExamChange('');
                                        onSubjectChange('');
                                        onClassChange('');
                                        onSectionChange('');
                                    }}
                                >
                                    {exams.find(e => e.id === selectedExam)?.name || 'Exam'}
                                </Button>
                                {selectedSubject && <ChevronRight className="w-3 h-3" />}
                            </>
                        )}
                        {selectedSubject && (
                            <>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-auto p-1 hover:text-primary"
                                    onClick={() => {
                                        onSubjectChange('');
                                        onClassChange('');
                                        onSectionChange('');
                                    }}
                                >
                                    {selectedSubject}
                                </Button>
                                {selectedClass && <ChevronRight className="w-3 h-3" />}
                            </>
                        )}
                        {selectedClass && (
                            <>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-auto p-1 hover:text-primary"
                                    onClick={() => {
                                        onClassChange('');
                                        onSectionChange('');
                                    }}
                                >
                                    {selectedClass}
                                </Button>
                                {selectedSection && <ChevronRight className="w-3 h-3" />}
                            </>
                        )}
                        {selectedSection && (
                            <span className="font-semibold text-foreground">Section {selectedSection}</span>
                        )}
                    </div>
                )}
            </div>

            {/* Step Content - Show ONE step at a time */}
            <div className="dashboard-card p-8">
                {/* Step 1: Exam Type */}
                {currentStep === 1 && (
                    <div className="max-w-md mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <BookOpen className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="text-2xl font-semibold mb-2">Select Exam Type</h3>
                            <p className="text-muted-foreground">Choose the examination for which you want to enter marks</p>
                        </div>
                        <div className="space-y-3">
                            <Label className="text-base font-semibold">Exam Type</Label>
                            <Select value={selectedExam} onValueChange={onExamChange}>
                                <SelectTrigger className="h-12 text-base">
                                    <SelectValue placeholder="Select Exam Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {exams.length === 0 ? (
                                        <div className="p-4 text-center text-muted-foreground text-sm">
                                            No exam types available
                                        </div>
                                    ) : (
                                        exams.map(exam => (
                                            <SelectItem key={exam.id} value={exam.id} className="text-base py-3">
                                                {exam.name}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}

                {/* Step 2: Class */}
                {currentStep === 2 && (
                    <div className="max-w-md mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <School className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="text-2xl font-semibold mb-2">Select Class</h3>
                            <p className="text-muted-foreground">Choose the class for marks entry</p>
                        </div>
                        <div className="space-y-3">
                            <Label className="text-base font-semibold">Class</Label>
                            <Select value={selectedClass} onValueChange={onClassChange}>
                                <SelectTrigger className="h-12 text-base">
                                    <SelectValue placeholder="Select Class" />
                                </SelectTrigger>
                                <SelectContent>
                                    {[...new Set(classSections.map(cs => cs.class_name))].map(className => (
                                        <SelectItem key={className} value={className} className="text-base py-3">
                                            {className}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                                onExamChange('');
                                onClassChange('');
                                onSectionChange('');
                                onSubjectChange('');
                            }}
                        >
                            <ChevronRight className="w-4 h-4 mr-2 rotate-180" />
                            Back to Exam Selection
                        </Button>
                    </div>
                )}

                {/* Step 3: Section */}
                {currentStep === 3 && (
                    <div className="max-w-md mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Layers className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="text-2xl font-semibold mb-2">Select Section</h3>
                            <p className="text-muted-foreground">Choose the section to continue</p>
                        </div>
                        <div className="space-y-3">
                            <Label className="text-base font-semibold">Section</Label>
                            <Select value={selectedSection} onValueChange={onSectionChange}>
                                <SelectTrigger className="h-12 text-base">
                                    <SelectValue placeholder="Select Section" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableSections.map(section => (
                                        <SelectItem key={section} value={section} className="text-base py-3">
                                            Section {section}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                                onClassChange('');
                                onSectionChange('');
                                onSubjectChange('');
                            }}
                        >
                            <ChevronRight className="w-4 h-4 mr-2 rotate-180" />
                            Back to Class Selection
                        </Button>
                    </div>
                )}

                {/* Step 4: Subject */}
                {currentStep === 4 && (
                    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <GraduationCap className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="text-2xl font-semibold mb-2">Select Subject</h3>
                            <p className="text-muted-foreground">Choose from exam schedule subjects</p>
                        </div>
                        <div className="space-y-3">
                            <Label className="text-base font-semibold">Subject</Label>
                            {facultySubjects.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                                    No subjects found in exam schedule
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {facultySubjects.map(subject => (
                                        <div
                                            key={subject}
                                            className={cn(
                                                "flex items-center gap-3 p-4 border rounded-lg transition-all cursor-pointer hover:border-primary hover:bg-primary/5",
                                                selectedSubject === subject ? "border-primary bg-primary/10 ring-2 ring-primary/20" : "border-border"
                                            )}
                                            onClick={() => onSubjectChange(subject)}
                                        >
                                            <div className={cn(
                                                "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                                                selectedSubject === subject ? "border-primary bg-primary" : "border-muted-foreground"
                                            )}>
                                                {selectedSubject === subject && (
                                                    <Check className="w-3 h-3 text-white" />
                                                )}
                                            </div>
                                            <span className="font-medium text-base">{subject}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                                onSectionChange('');
                                onSubjectChange('');
                            }}
                        >
                            <ChevronRight className="w-4 h-4 mr-2 rotate-180" />
                            Back to Section Selection
                        </Button>
                    </div>
                )}

                {/* Step 5: View Students Button */}
                {currentStep === 5 && (
                    <div className="max-w-md mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Check className="w-8 h-8 text-success" />
                            </div>
                            <h3 className="text-2xl font-semibold mb-2">Ready to View Students</h3>
                            <p className="text-muted-foreground">All selections complete. Click below to view students</p>
                        </div>

                        <div className="bg-muted/30 rounded-lg p-6 space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-muted-foreground">Exam:</span>
                                <span className="font-semibold">{exams.find(e => e.id === selectedExam)?.name}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-muted-foreground">Subject:</span>
                                <span className="font-semibold">{selectedSubject}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-muted-foreground">Class:</span>
                                <span className="font-semibold">{selectedClass}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-muted-foreground">Section:</span>
                                <span className="font-semibold">{selectedSection}</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Button
                                size="lg"
                                className="w-full h-14 text-lg shadow-lg"
                                onClick={onViewStudents}
                            >
                                View Students <ChevronRight className="ml-2 w-6 h-6" />
                            </Button>

                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => onSectionChange('')}
                            >
                                <ChevronRight className="w-4 h-4 mr-2 rotate-180" />
                                Back to Section Selection
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
