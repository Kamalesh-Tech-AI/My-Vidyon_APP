import { StudentLayout } from '@/layouts/StudentLayout';
import { Card } from '@/components/ui/card';

export function CalendarSkeleton() {
    return (
        <StudentLayout>
            <div className="animate-pulse">
                {/* Header Skeleton */}
                <div className="px-4 py-6">
                    <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-64"></div>
                </div>

                <div className="m-4 space-y-6">
                    {/* Calendar Grid Skeleton */}
                    <Card className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <div className="h-6 bg-gray-200 rounded w-32"></div>
                            <div className="flex gap-2">
                                <div className="h-8 w-8 bg-gray-200 rounded"></div>
                                <div className="h-8 w-8 bg-gray-200 rounded"></div>
                            </div>
                        </div>
                        <div className="grid grid-cols-7 gap-2">
                            {Array.from({ length: 35 }).map((_, i) => (
                                <div key={i} className="h-16 bg-gray-200 rounded"></div>
                            ))}
                        </div>
                    </Card>

                    {/* Events List Skeleton */}
                    <Card className="p-6">
                        <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex gap-4 p-3 border rounded">
                                    <div className="h-12 w-12 bg-gray-200 rounded"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </StudentLayout>
    );
}
