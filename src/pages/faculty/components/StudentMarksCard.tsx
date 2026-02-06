import { Button } from '@/components/ui/button';
import { Badge } from '@/components/common/Badge';
import { Edit, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StudentMarksCardProps {
    student: {
        id: string;
        name: string;
        register_number: string;
        image_url?: string;
    };
    marksStatus?: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'PUBLISHED';
    onEnterMarks: () => void;
    onViewStatus: () => void;
}

export function StudentMarksCard({
    student,
    marksStatus,
    onEnterMarks,
    onViewStatus
}: StudentMarksCardProps) {
    const getStatusVariant = () => {
        switch (marksStatus) {
            case 'PUBLISHED':
                return 'success';
            case 'APPROVED':
                return 'success';
            case 'SUBMITTED':
                return 'warning';
            case 'DRAFT':
                return 'default';
            default:
                return 'default';
        }
    };

    const getStatusLabel = () => {
        if (!marksStatus) return 'Not Started';
        return marksStatus.charAt(0) + marksStatus.slice(1).toLowerCase();
    };

    return (
        <div className="group relative border rounded-xl p-5 hover:shadow-lg hover:border-primary/50 transition-all bg-card/50">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-muted overflow-hidden border-2 border-transparent group-hover:border-primary transition-colors">
                        <img
                            src={student.image_url || `https://api.dicebear.com/7.x/initials/svg?seed=${student.name}`}
                            alt={student.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                (e.target as any).src = `https://api.dicebear.com/7.x/initials/svg?seed=${student.name}`;
                            }}
                        />
                    </div>
                    <div>
                        <h3 className="font-semibold group-hover:text-primary transition-colors">
                            {student.name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                            Roll: {student.register_number}
                        </p>
                    </div>
                </div>
                <Badge
                    variant={getStatusVariant()}
                    className="uppercase text-[10px]"
                >
                    {getStatusLabel()}
                </Badge>
            </div>

            <div className="flex items-center gap-2">
                <Button
                    size="sm"
                    className="flex-1 gap-2 text-xs h-9"
                    onClick={onEnterMarks}
                >
                    <Edit className="w-3.5 h-3.5" />
                    Enter Marks
                </Button>

                <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-2 text-xs h-9"
                    onClick={onViewStatus}
                >
                    <Eye className="w-3.5 h-3.5" />
                    Status
                </Button>
            </div>
        </div>
    );
}
