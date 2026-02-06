import React from 'react';
import { User, ROLE_LABELS } from '@/types/auth';
import { User as UserIcon, School, GraduationCap, Calendar, Hash, ArrowRightLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AccountCardProps {
    user: User;
    isActive: boolean;
    onSwitch: (userId: string) => void;
    className?: string;
}

export function AccountCard({ user, isActive, onSwitch, className }: AccountCardProps) {
    return (
        <div
            onClick={() => !isActive && onSwitch(user.id)}
            className={cn(
                "relative w-full max-w-none md:max-w-[320px] min-h-[380px] md:min-h-[400px] h-auto p-5 md:p-6 rounded-none sm:rounded-3xl cursor-pointer transition-all duration-500 overflow-hidden group mx-0 md:mx-0",
                "border-y sm:border shadow-xl",
                isActive
                    ? "bg-gradient-to-br from-primary/90 to-primary border-primary/20 scale-100"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 scale-100 hover:bg-slate-50 dark:hover:bg-slate-800/50",
                className
            )}
        >
            {/* Background Decor */}
            <div className={cn(
                "absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl transition-opacity duration-500",
                isActive ? "bg-white/20 opacity-100" : "bg-primary/10 opacity-0 group-hover:opacity-100"
            )} />

            {/* Profile Header */}
            <div className="flex flex-col items-center mb-6">
                <div className={cn(
                    "w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center mb-2.5 shadow-lg transition-transform duration-500 group-hover:scale-105 active:scale-95",
                    isActive ? "bg-white text-primary" : "bg-primary text-white"
                )}>
                    {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full rounded-2xl object-cover" />
                    ) : (
                        <UserIcon size={isActive ? 48 : 40} />
                    )}
                </div>
                <h3 className={cn("text-xl md:text-2xl font-bold text-center mb-1", isActive ? "text-white" : "text-slate-800 dark:text-white")}>
                    {user.name}
                </h3>
                <span className={cn(
                    "text-[10px] md:text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest",
                    isActive ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                )}>
                    {ROLE_LABELS[user.role]}
                </span>
            </div>

            {/* Details Grid */}
            <div className="space-y-2 pb-20">
                {/* Institution */}
                <div className="flex items-start gap-3">
                    <School size={16} className={cn("shrink-0 mt-0.5", isActive ? "text-white/70" : "text-slate-400")} />
                    <div>
                        <p className={cn("text-[10px] uppercase tracking-wider font-medium", isActive ? "text-white/50" : "text-slate-400")}>
                            Institution
                        </p>
                        <p className={cn("text-sm font-semibold truncate max-w-[180px]", isActive ? "text-white" : "text-slate-700 dark:text-slate-200")}>
                            {user.institutionName || 'Vidyon Academy'}
                        </p>
                        <p className={cn("text-[10px]", isActive ? "text-white/60" : "text-slate-400")}>
                            Code: {user.institutionCode}
                        </p>
                    </div>
                </div>

                {/* Class Teacher / Student Specific Info */}
                {(user.role === 'student' || user.className) && (
                    <>
                        <div className="flex items-start gap-3">
                            <GraduationCap size={16} className={cn("shrink-0 mt-0.5", isActive ? "text-white/70" : "text-slate-400")} />
                            <div>
                                <p className={cn("text-[10px] uppercase tracking-wider font-medium", isActive ? "text-white/50" : "text-slate-400")}>
                                    {user.role === 'student' ? 'Class & Section' : 'Class Teacher'}
                                </p>
                                <p className={cn("text-sm font-semibold", isActive ? "text-white" : "text-slate-700 dark:text-slate-200")}>
                                    {user.className} {user.section ? `- ${user.section}` : ''}
                                </p>
                            </div>
                        </div>

                        {user.role === 'student' && (
                            <div className="flex items-start gap-3">
                                <Hash size={16} className={cn("shrink-0 mt-0.5", isActive ? "text-white/70" : "text-slate-400")} />
                                <div>
                                    <p className={cn("text-[10px] uppercase tracking-wider font-medium", isActive ? "text-white/50" : "text-slate-400")}>
                                        Student ID
                                    </p>
                                    <p className={cn("text-sm font-semibold", isActive ? "text-white" : "text-slate-700 dark:text-slate-200")}>
                                        {user.studentId}
                                    </p>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Staff Specific Info */}
                {user.role !== 'student' && user.role !== 'parent' && user.role !== 'admin' && user.staffId && (
                    <div className="flex items-start gap-3">
                        <Hash size={16} className={cn("shrink-0 mt-0.5", isActive ? "text-white/70" : "text-slate-400")} />
                        <div>
                            <p className={cn("text-[10px] uppercase tracking-wider font-medium", isActive ? "text-white/50" : "text-slate-400")}>
                                Employee ID
                            </p>
                            <p className={cn("text-sm font-semibold", isActive ? "text-white" : "text-slate-700 dark:text-slate-200")}>
                                {user.staffId}
                            </p>
                        </div>
                    </div>
                )}

                {/* Academic Year */}
                <div className="flex items-start gap-3">
                    <Calendar size={16} className={cn("shrink-0 mt-0.5", isActive ? "text-white/70" : "text-slate-400")} />
                    <div>
                        <p className={cn("text-[10px] uppercase tracking-wider font-medium", isActive ? "text-white/50" : "text-slate-400")}>
                            Academic Year
                        </p>
                        <p className={cn("text-sm font-semibold", isActive ? "text-white" : "text-slate-700 dark:text-slate-200")}>
                            {user.academicYear}
                        </p>
                    </div>
                </div>
            </div>

            {/* Switch Indicator */}
            {!isActive && (
                <div className="absolute inset-x-0 bottom-4 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-2 text-primary font-bold text-sm bg-white px-6 py-2 rounded-full shadow-lg min-h-[40px]">
                        <ArrowRightLeft size={16} />
                        Tap to Switch
                    </div>
                </div>
            )}

            {/* Active Indicator */}
            {isActive && (
                <div className="absolute top-4 right-4">
                    <div className="w-3 h-3 bg-white rounded-full animate-pulse shadow-[0_0_10px_white]" />
                </div>
            )}
        </div>
    );
}
