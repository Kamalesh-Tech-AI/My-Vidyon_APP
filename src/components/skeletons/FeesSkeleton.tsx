import { StudentLayout } from '@/layouts/StudentLayout';
import { Card } from '@/components/ui/card';

export function FeesSkeleton() {
    return (
        <StudentLayout>
            <div className="animate-pulse">
                {/* Header Skeleton */}
                <div className="px-4 py-6">
                    <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-64"></div>
                </div>

                <div className="m-4 space-y-6">
                    {/* Summary Cards Skeleton */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2].map((i) => (
                            <Card key={i} className="p-6">
                                <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
                                <div className="h-8 bg-gray-200 rounded w-32"></div>
                            </Card>
                        ))}
                    </div>

                    {/* Fee Records Table Skeleton */}
                    <Card className="p-6">
                        <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
                        <div className="space-y-3">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="flex justify-between items-center py-4 border-b">
                                    <div className="flex-1 space-y-2">
                                        <div className="h-5 bg-gray-200 rounded w-48"></div>
                                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                                    </div>
                                    <div className="h-6 bg-gray-200 rounded w-24"></div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </StudentLayout>
    );
}
