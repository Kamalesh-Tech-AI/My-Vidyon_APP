export function FeeReceiptSkeleton() {
    return (
        <div className="fixed inset-0 bg-white overflow-y-auto animate-pulse">
            {/* Safe Area Spacer */}
            <div className="h-14 w-full bg-white shrink-0 border-b border-gray-100"></div>

            {/* Close Button Skeleton */}
            <div className="fixed top-16 right-3 z-50">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            </div>

            {/* Content */}
            <div className="px-3 sm:px-4 md:px-6 lg:px-8 pb-24 max-w-4xl mx-auto bg-gray-50 pt-4">
                {/* Receipt Container */}
                <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-6">
                    {/* Header Skeleton */}
                    <div className="bg-gray-200 p-4 sm:p-6 md:p-8 h-48"></div>

                    {/* Title Skeleton */}
                    <div className="bg-gray-100 px-4 sm:px-6 md:px-8 py-3 sm:py-4">
                        <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto"></div>
                    </div>

                    {/* Details Skeleton */}
                    <div className="p-4 sm:p-6 md:p-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                            <div className="space-y-3 sm:space-y-4">
                                <div>
                                    <div className="h-3 bg-gray-200 rounded w-1/3 mb-2"></div>
                                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                                </div>
                                <div>
                                    <div className="h-3 bg-gray-200 rounded w-1/3 mb-2"></div>
                                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                                </div>
                                <div>
                                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                                </div>
                            </div>
                            <div className="space-y-3 sm:space-y-4">
                                <div>
                                    <div className="h-3 bg-gray-200 rounded w-1/3 mb-2"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                </div>
                                <div>
                                    <div className="h-3 bg-gray-200 rounded w-1/3 mb-2"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                </div>
                                <div>
                                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                                </div>
                            </div>
                        </div>

                        {/* Amount Skeleton */}
                        <div className="border-t border-b border-gray-200 py-4 sm:py-6 mb-4 sm:mb-6">
                            <div className="flex justify-between items-center mb-3 sm:mb-4">
                                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                            </div>
                        </div>

                        {/* Note Skeleton */}
                        <div className="bg-gray-100 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                            <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                        </div>

                        {/* Signature Skeleton */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 mt-8 sm:mt-12 mb-6 sm:mb-8">
                            <div className="text-center">
                                <div className="h-px bg-gray-200 mb-2"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto"></div>
                            </div>
                            <div className="text-center">
                                <div className="h-px bg-gray-200 mb-2"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto"></div>
                            </div>
                        </div>

                        {/* Watermark Skeleton */}
                        <div className="flex flex-col items-center justify-center gap-1 pt-6 border-t border-gray-200">
                            <div className="h-2 bg-gray-200 rounded w-20 mb-1"></div>
                            <div className="h-6 bg-gray-200 rounded w-32"></div>
                        </div>
                    </div>

                    {/* Footer Skeleton */}
                    <div className="bg-gray-100 px-4 sm:px-6 md:px-8 py-3 sm:py-4 text-center">
                        <div className="h-3 bg-gray-200 rounded w-2/3 mx-auto mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto"></div>
                    </div>
                </div>

                {/* Action Buttons Skeleton */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <div className="flex-1 h-14 bg-gray-200 rounded-xl"></div>
                    <div className="flex-1 h-14 bg-gray-200 rounded-xl"></div>
                </div>
            </div>
        </div>
    );
}
