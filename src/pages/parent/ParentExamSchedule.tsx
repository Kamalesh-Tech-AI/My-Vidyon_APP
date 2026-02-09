import { ParentLayout } from '@/layouts/ParentLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { useAuth } from '@/context/AuthContext';
import { useParentDashboard } from '@/hooks/useParentDashboard';
import { User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function ParentExamSchedule() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { children } = useParentDashboard(user?.id, user?.institutionId);

    return (
        <ParentLayout>
            <PageHeader
                title="Exam Schedule"
                subtitle="Select a child to view exam schedule"
            />

            <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {children.map((child) => (
                        <div
                            key={child.id}
                            className="bg-white rounded-xl p-6 cursor-pointer hover:shadow-lg transition-all border-2 border-transparent hover:border-primary"
                            onClick={() => navigate(`/parent/child/${child.id}?tab=exam-schedule`)}
                        >
                            <div className="flex flex-col items-center text-center">
                                {child.profilePicture ? (
                                    <img
                                        src={child.profilePicture}
                                        alt={child.name}
                                        className="w-20 h-20 rounded-full object-cover mb-4"
                                    />
                                ) : (
                                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                        <User className="w-10 h-10 text-primary" />
                                    </div>
                                )}
                                <h3 className="font-semibold text-lg mb-1">{child.name}</h3>
                                <p className="text-sm text-muted-foreground mb-1">
                                    {child.class} - Section {child.section}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Roll: {child.rollNumber}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {children.length === 0 && (
                    <div className="text-center p-12 bg-muted/30 rounded-lg">
                        <User className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
                        <p className="text-muted-foreground">No children found</p>
                    </div>
                )}
            </div>
        </ParentLayout>
    );
}
