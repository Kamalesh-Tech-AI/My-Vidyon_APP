import { StudentLayout } from '@/layouts/StudentLayout';
import { Card } from '@/components/ui/card';

export function MaterialsSkeleton() {
    return (
        <StudentLayout>
            <div className="animate-pulse">
                {/* Header Skeleton */}
                <div className="px-4 py-6">
                    <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-64"></div>
                </div>

                <div className="m-4">
                    {/* Material Cards Grid Skeleton */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <Card key={i} className="p-6">
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="h-12 w-12 bg-gray-200 rounded"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-5 bg-gray-200 rounded w-full"></div>
                                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                                </div>
                                <div className="mt-4 flex gap-2">
                                    <div className="h-9 bg-gray-200 rounded flex-1"></div>
                                    <div className="h-9 w-9 bg-gray-200 rounded"></div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </StudentLayout>
    );
}
