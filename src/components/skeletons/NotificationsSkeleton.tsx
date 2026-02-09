import { StudentLayout } from '@/layouts/StudentLayout';
import { Card } from '@/components/ui/card';

export function NotificationsSkeleton() {
    return (
        <StudentLayout>
            <div className="animate-pulse">
                {/* Header Skeleton */}
                <div className="px-4 py-6">
                    <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-64"></div>
                </div>

                <div className="m-4 space-y-3">
                    {/* Notification Cards Skeleton */}
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Card key={i} className="p-4">
                            <div className="flex gap-4">
                                <div className="h-10 w-10 bg-gray-200 rounded-full flex-shrink-0"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                                    <div className="h-3 bg-gray-200 rounded w-24 mt-2"></div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </StudentLayout>
    );
}
