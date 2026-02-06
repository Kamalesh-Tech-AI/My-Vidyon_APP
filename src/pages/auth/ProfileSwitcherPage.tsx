import React from 'react';
import { AccountSwitcher } from '@/components/auth/AccountSwitcher';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function ProfileSwitcherPage() {
    const navigate = useNavigate();
    const { user } = useAuth();

    return (
        <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 flex flex-col overflow-x-hidden">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 pt-safe-top">
                <div className="p-4 md:p-6 flex items-center justify-between container mx-auto">
                    <Button
                        variant="ghost"
                        onClick={() => navigate(-1)}
                        className="rounded-full w-12 h-12 p-0 hover:bg-slate-200 dark:hover:bg-slate-800"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </Button>
                    <div className="flex flex-col items-center">
                        <img src="/my-vidyon-logo.png" alt="Vidyon" className="h-8 md:h-12 w-auto mb-1 object-contain" />
                        <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-[0.2em] text-primary/70">Account Manager</span>
                    </div>
                    <div className="w-12 h-12" /> {/* Spacer */}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col justify-center py-8 md:py-12">
                <div className="text-center mb-4 md:mb-12 px-6 animate-fade-in">
                    <h1 className="text-xl md:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white mb-2">
                        Who's Using Vidyon?
                    </h1>
                    <p className="text-xs md:text-base text-slate-500 max-w-sm mx-auto leading-relaxed">
                        Switch between student profiles or employee accounts
                    </p>
                </div>

                <div className="animate-slide-up">
                    <AccountSwitcher
                        onSelect={(acc) => {
                            navigate('/login', {
                                state: {
                                    email: acc ? acc.email : '',
                                    addingAccount: true
                                }
                            });
                        }}
                    />
                </div>
            </div>

            {/* Footer Branding */}
            <div className="p-6 md:p-8 text-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-t border-slate-200/50 dark:border-slate-800/50 shrink-0">
                <p className="text-[10px] md:text-xs text-slate-400 font-medium">
                    &copy; 2025 Vidyon Academy Management Systems. <br className="md:hidden" /> All rights reserved.
                </p>
            </div>
        </div>
    );
}
