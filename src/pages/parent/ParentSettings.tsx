import { ParentLayout } from '@/layouts/ParentLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { User, Lock, Phone, Mail, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '@/i18n/TranslationContext';
import { useParentDashboard } from '@/hooks/useParentDashboard';
import { useNavigate } from 'react-router-dom';

export function ParentSettings() {
    const { user, logout } = useAuth();
    const { t } = useTranslation();
    const navigate = useNavigate();

    // Fetch real data
    const { children } = useParentDashboard(user?.id, user?.institutionId);

    const handlePasswordChange = (e: React.FormEvent) => {
        e.preventDefault();
        toast.success(t.parent.settings.passwordSuccess);
    };

    if (!user) return null;

    return (
        <ParentLayout>
            <PageHeader
                title={t.parent.settings.title}
                subtitle={t.parent.settings.subtitle}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Card */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
                        <div className="bg-primary/10 h-32 relative">
                            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                                <div className="w-24 h-24 rounded-full bg-white p-1 border border-border">
                                    <div className="w-full h-full rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
                                        {user.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="pt-12 pb-6 px-6 text-center">
                            <h3 className="font-bold text-xl mb-1">{user.name}</h3>
                            <p className="text-muted-foreground text-sm mb-4">{t.parent.settings.parentAccount}</p>
                            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-6">
                                <Mail className="w-4 h-4" />
                                {user.email}
                            </div>
                            <Button variant="outline" className="w-full text-destructive hover:bg-destructive/10 border-destructive/50" onClick={logout}>
                                <LogOut className="w-4 h-4 mr-2" />
                                {t.parent.settings.logout}
                            </Button>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
                        <h4 className="font-semibold mb-4">{t.parent.settings.linkedChildren}</h4>
                        <div className="space-y-3">
                            {children.length > 0 ? (
                                children.map((child) => (
                                    <div
                                        key={child.id}
                                        className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors"
                                        onClick={() => navigate(`/parent/child/${child.id}`)}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                                            {child.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">{child.name}</p>
                                            <p className="text-xs text-muted-foreground">{child.class} - {child.section}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    No children linked yet.
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Settings Forms */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
                        <h3 className="font-semibold text-lg mb-6 flex items-center gap-2">
                            <User className="w-5 h-5 text-primary" />
                            {t.parent.settings.personalInfo}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>{t.parent.settings.fullName}</Label>
                                <Input value={user.name} disabled />
                            </div>
                            <div className="space-y-2">
                                <Label>{t.parent.settings.email}</Label>
                                <Input value={user.email} disabled />
                            </div>
                            <div className="space-y-2">
                                <Label>{t.parent.settings.phone}</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input className="pl-10" defaultValue={user.phone || 'Not Provided'} disabled />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>{t.parent.settings.address}</Label>
                                <Input defaultValue={user.address || 'Not Provided'} disabled />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
                        <h3 className="font-semibold text-lg mb-6 flex items-center gap-2">
                            <Lock className="w-5 h-5 text-primary" />
                            {t.parent.settings.security}
                        </h3>
                        <form onSubmit={handlePasswordChange} className="space-y-4">
                            <div className="space-y-2">
                                <Label>{t.parent.settings.currentPassword}</Label>
                                <Input type="password" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>{t.parent.settings.newPassword}</Label>
                                    <Input type="password" />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t.parent.settings.confirmPassword}</Label>
                                    <Input type="password" />
                                </div>
                            </div>
                            <div className="mt-4 flex justify-end">
                                <Button type="submit">{t.parent.settings.updatePassword}</Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </ParentLayout>
    );
}
