import { StudentLayout } from '@/layouts/StudentLayout';
import { Card } from '@/components/ui/card';

export function GradesSkeleton() {
    return (
        <StudentLayout>
            <div className="animate-pulse">
                {/* Header Skeleton */}
                <div className="px-4 py-6">
                    <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-64"></div>
                </div>

                <div className="m-4 space-y-6">
                    {/* Stats Cards Skeleton */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[1, 2, 3].map((i) => (
                            <Card key={i} className="p-6">
                                <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
                                <div className="h-8 bg-gray-200 rounded w-16"></div>
                            </Card>
                        ))}
                    </div>

                    {/* Results Table Skeleton */}
                    <Card className="p-6">
                        <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
                        <div className="space-y-3">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex justify-between items-center py-3 border-b">
                                    <div className="flex-1">
                                        <div className="h-5 bg-gray-200 rounded w-48 mb-2"></div>
                                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                                    </div>
                                    <div className="h-8 bg-gray-200 rounded w-16"></div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </StudentLayout>
    );
}
