import { StudentLayout } from '@/layouts/StudentLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';

export function TimetableSkeleton() {
    const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

    return (
        <StudentLayout>
            <div className="animate-pulse">
                {/* Header Skeleton */}
                <div className="px-4 py-6">
                    <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-64"></div>
                </div>

                {/* Tabs Skeleton */}
                <div className="m-4">
                    <div className="flex gap-2 mb-4">
                        <div className="h-10 bg-gray-200 rounded w-32"></div>
                        <div className="h-10 bg-gray-200 rounded w-32"></div>
                        <div className="h-10 bg-gray-200 rounded w-32"></div>
                    </div>

                    {/* Desktop View Skeleton */}
                    <Card className="hidden md:block">
                        <CardContent className="p-0">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr>
                                        <th className="border p-3 bg-gray-100 w-24">
                                            <div className="h-4 bg-gray-200 rounded w-16"></div>
                                        </th>
                                        {PERIODS.map((p) => (
                                            <th key={p} className="border p-3 bg-gray-100">
                                                <div className="h-4 bg-gray-200 rounded w-20 mb-1"></div>
                                                <div className="h-3 bg-gray-200 rounded w-16"></div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {DAYS.map((day) => (
                                        <tr key={day}>
                                            <td className="border p-3 bg-gray-50">
                                                <div className="h-4 bg-gray-200 rounded w-20"></div>
                                            </td>
                                            {PERIODS.map((p) => (
                                                <td key={p} className="border p-2 h-20">
                                                    <div className="space-y-2">
                                                        <div className="h-5 bg-gray-200 rounded"></div>
                                                        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                                                    </div>
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>

                    {/* Mobile View Skeleton */}
                    <div className="block md:hidden space-y-4">
                        {DAYS.slice(0, 5).map((day) => (
                            <Card key={day}>
                                <div className="bg-gray-100 px-4 py-3 border-b">
                                    <div className="h-5 bg-gray-200 rounded w-24"></div>
                                </div>
                                <div className="divide-y">
                                    {[1, 2, 3, 4].map((p) => (
                                        <div key={p} className="p-4 flex gap-4">
                                            <div className="w-16 flex-shrink-0">
                                                <div className="h-3 bg-gray-200 rounded w-12 mb-1"></div>
                                                <div className="h-3 bg-gray-200 rounded w-14"></div>
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </StudentLayout>
    );
}
