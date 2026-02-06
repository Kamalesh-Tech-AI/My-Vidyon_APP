import React, { useCallback, useEffect } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { AccountCard } from './AccountCard';
import { useAuth } from '@/context/AuthContext';
import { Plus, Users, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface AccountSwitcherProps {
    className?: string;
    onSelect?: (user: any) => void;
}

export function AccountSwitcher({ className, onSelect }: AccountSwitcherProps) {
    const { accounts, activeAccountId, switchAccount, isLoading } = useAuth();
    const [emblaRef, emblaApi] = useEmblaCarousel({
        align: 'center',
        containScroll: 'trimSnaps',
        dragFree: false,
        skipSnaps: false,
        loop: true,
        breakpoints: {
            '(min-width: 768px)': { align: 'start' }
        }
    });
    const navigate = useNavigate();

    // Auto-scroll to active account
    useEffect(() => {
        if (emblaApi && activeAccountId) {
            const index = accounts.findIndex(a => a.id === activeAccountId);
            if (index !== -1) {
                emblaApi.scrollTo(index);
            }
        }
    }, [emblaApi, activeAccountId, accounts]);

    const handleAddAccount = useCallback(() => {
        if (onSelect) {
            onSelect(null); // Signal to clear form
        } else {
            navigate('/login', { state: { addingAccount: true } });
        }
    }, [navigate, onSelect]);

    const handleAccountClick = useCallback(async (userId: string) => {
        try {
            await switchAccount(userId);
        } catch (error) {
            console.log('[SWITCHER] Switch failed, possibly no session. Falling back to selection...');
            const account = accounts.find(a => a.id === userId);
            if (account && onSelect) {
                onSelect(account);
            }
        }
    }, [switchAccount, accounts, onSelect]);

    return (
        <div className={cn("w-full max-w-5xl mx-auto py-4 md:py-12 px-0 md:px-4", className)}>
            <div className="flex items-center justify-between mb-4 md:mb-8 px-6 md:px-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/10 rounded-2xl text-primary">
                        <Users size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Profile Switcher</h2>
                        <p className="text-sm text-slate-500">Quickly switch between Siblings/Accounts</p>
                    </div>
                </div>

                <Button
                    onClick={handleAddAccount}
                    variant="outline"
                    className="rounded-2xl border-primary/20 hover:bg-primary/5 text-primary gap-2"
                >
                    <Plus size={18} />
                    Add Account
                </Button>
            </div>

            <div className="relative">
                <div className="overflow-visible pb-12" ref={emblaRef}>
                    <div className="flex gap-0 md:gap-6">
                        {accounts.map((acc) => (
                            <div
                                key={acc.id}
                                className="flex-[0_0_100%] min-w-0 sm:flex-[0_0_70%] md:flex-[0_0_300px] lg:flex-[0_0_320px]"
                            >
                                <AccountCard
                                    user={acc}
                                    isActive={acc.id === activeAccountId}
                                    onSwitch={handleAccountClick}
                                    className="md:rounded-3xl"
                                />
                            </div>
                        ))}

                        {/* Add New Account Card */}
                        <div
                            className="flex-[0_0_100%] min-w-0 sm:flex-[0_0_70%] md:flex-[0_0_300px] lg:flex-[0_0_320px]"
                        >
                            <div
                                onClick={handleAddAccount}
                                className={cn(
                                    "flex flex-col items-center justify-center min-h-[380px] md:min-h-[400px] h-auto rounded-3xl border-2 border-dashed border-primary/20 bg-white/50 dark:bg-slate-900/50 hover:bg-white/70 transition-colors cursor-pointer group",
                                    "p-6 text-center mx-10 md:mx-0 shadow-sm"
                                )}
                            >
                                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                    <Plus size={32} />
                                </div>
                                <div className="text-center">
                                    <p className="font-bold text-slate-700 dark:text-slate-300">Add New Account</p>
                                    <p className="text-xs text-slate-400">Sibling or another profile</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Action Footer */}
            <div className="mt-12 flex justify-center">
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20 shadow-lg flex items-center gap-6">
                    <div className="flex flex-col items-center gap-1 group cursor-pointer" onClick={() => navigate('/')}>
                        <LayoutGrid size={20} className="text-slate-400 group-hover:text-primary transition-colors" />
                        <span className="text-[10px] font-bold text-slate-400 group-hover:text-primary uppercase tracking-tighter">Dashboard</span>
                    </div>
                    <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />
                    <p className="text-xs text-slate-500 font-medium whitespace-nowrap">
                        {accounts.length} Accounts Logged In
                    </p>
                </div>
            </div>
        </div>
    );
}
