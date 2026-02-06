import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { LanguageSelector } from '@/components/common/LanguageSelector';
import { UserRole, ROLE_LABELS } from '@/types/auth';
import {
  Menu,
  X,
  LogOut,
  ChevronDown,
  GraduationCap,
  Building2,
  Shield,
  Users,
  User as UserIcon,
  MoreHorizontal,
  ArrowRightLeft,
  Search,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { RealtimeNotificationBell } from '@/components/RealtimeNotificationBell';
import { RealtimeStatusIndicator } from '@/components/RealtimeStatusIndicator';
import { useSearch } from '@/context/SearchContext';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface DashboardLayoutProps {
  children: ReactNode;
  navItems: NavItem[];
  roleColor?: string;
}

const roleIcons: Record<UserRole, React.ComponentType<{ className?: string }>> = {
  student: GraduationCap,
  faculty: Users,
  institution: Building2,
  admin: Shield,
  parent: Users,
  accountant: Users,
  canteen_manager: Users,
};

export function DashboardLayout({ children, navItems, roleColor = 'text-primary' }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
  const { searchQuery, setSearchQuery } = useSearch();

  if (!user) return null;

  const isBottomNavRole = ['student', 'faculty', 'parent'].includes(user.role);

  const getSettingsPath = () => {
    switch (user.role) {
      case 'admin': return '/admin/settings';
      case 'institution': return '/institution/settings';
      case 'parent': return '/parent/settings';
      case 'faculty': return '/faculty/settings';
      case 'student': return '/student/settings';
      default: return `/${user.role}`;
    }
  };

  const settingsPath = getSettingsPath();

  // Logic for Bottom Nav Items (Max 4 + More)
  const bottomNavLimit = 4;
  const showMoreOption = navItems.length > bottomNavLimit;
  const primaryBottomNavItems = showMoreOption ? navItems.slice(0, bottomNavLimit) : navItems;
  const moreBottomNavItems = showMoreOption ? navItems.slice(bottomNavLimit) : [];

  return (
    <div className="flex flex-col h-[100dvh] w-full overflow-hidden bg-background">
      {/* Mobile Header (Fixed at top) */}
      <header className="lg:hidden h-24 bg-card border-b border-border z-50 flex items-center justify-between px-6 shrink-0 pt-safe-top shadow-sm">
        {!isBottomNavRole && (
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-3 -ml-2 rounded-xl hover:bg-muted transition-colors"
          >
            {mobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
          </button>
        )}

        {isBottomNavRole && (
          <div className="flex items-center gap-3 overflow-visible">
            <img
              src="/my-vidyon-logo.png"
              alt="Vidyon Logo"
              className="h-10 w-auto transform scale-[2.5] sm:scale-[3.5] origin-left ml-6 sm:ml-10 transition-transform drop-shadow-sm"
            />
          </div>
        )}

        {!isBottomNavRole && (
          <div className="flex items-center gap-3 overflow-visible">
            <img
              src="/my-vidyon-logo.png"
              alt="Vidyon Logo"
              className="h-12 w-auto transform scale-[2.5] sm:scale-[3.5] origin-left ml-6 sm:ml-10 transition-transform drop-shadow-sm"
            />
            <span className="font-bold text-[10px] uppercase tracking-tighter hidden sm:block opacity-60 ml-20">
              {ROLE_LABELS[user.role]}
            </span>
          </div>
        )}

        <div className="flex items-center gap-3">
          <RealtimeStatusIndicator />
          <LanguageSelector />
          <RealtimeNotificationBell />
        </div>
      </header>

      {/* Main Layout Container */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar - Desktop Only */}
        <aside className={cn(
          'bg-sidebar-gradient z-40 transition-all duration-300 flex flex-col h-full border-r border-sidebar-border hidden lg:flex',
          sidebarOpen ? 'w-64' : 'w-20'
        )}>
          <div className="h-32 flex items-center gap-3 px-4 border-b border-sidebar-border bg-sidebar-gradient overflow-hidden flex-shrink-0">
            <img src="/my-vidyon-logo.png" alt="Vidyon Logo" className={cn("h-24 w-auto transition-all", !sidebarOpen && "mx-auto")} />
            {sidebarOpen && (
              <div className="animate-fade-in truncate">
                <span className="text-[10px] text-black font-bold uppercase tracking-wider block opacity-70 leading-none">
                  {ROLE_LABELS[user.role]} Portal
                </span>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
            <nav className="px-4 space-y-1">
              <Link
                to="/profile-switcher"
                className={cn(
                  'nav-link flex-shrink-0 mb-4 bg-primary/5 hover:bg-primary/10 border border-primary/10',
                  !sidebarOpen && 'justify-center px-1'
                )}
              >
                <ArrowRightLeft className="w-5 h-5 flex-shrink-0 text-primary" />
                {sidebarOpen && <span className="animate-fade-in font-bold text-primary">Switch Profile</span>}
              </Link>

              {navItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      'nav-link flex-shrink-0',
                      isActive && 'nav-link-active',
                      !sidebarOpen && 'justify-center px-2'
                    )}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {sidebarOpen && <span className="animate-fade-in">{item.label}</span>}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User Profile */}
          <div className="p-4 border-t border-sidebar-border bg-sidebar-gradient flex-shrink-0">
            <div className={cn('flex items-center gap-3', !sidebarOpen && 'justify-center')}>
              <Link
                to={settingsPath}
                className={cn(
                  'flex items-center gap-3 flex-1 min-w-0 p-2 rounded-lg hover:bg-sidebar-accent transition-colors group',
                  !sidebarOpen && 'justify-center p-0'
                )}
              >
                <div className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors border border-sidebar-border/30 whitespace-nowrap leading-none overflow-hidden">
                  <span className="text-sm font-medium text-sidebar-foreground transition-colors uppercase">
                    {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </span>
                </div>
                {sidebarOpen && (
                  <div className="flex-1 min-w-0 animate-fade-in text-left">
                    <p className="text-sm font-bold text-sidebar-foreground truncate transition-colors">{user.name}</p>
                    <p className="text-xs text-sidebar-muted truncate transition-colors">{user.email}</p>
                  </div>
                )}
              </Link>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  logout();
                }}
                type="button"
                className={cn(
                  'p-2 rounded-lg text-sidebar-muted hover:text-destructive hover:bg-destructive/10 transition-colors',
                  !sidebarOpen && 'hidden'
                )}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Toggle Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="absolute -right-3 top-36 w-6 h-6 bg-card border border-border rounded-full flex items-center justify-center hover:bg-muted transition-colors z-50 shadow-md"
          >
            <ChevronDown className={cn('w-4 h-4 transition-transform', sidebarOpen ? 'rotate-90' : '-rotate-90')} />
          </button>
        </aside>

        {/* Mobile Menu Overlay */}
        {!isBottomNavRole && mobileMenuOpen && (
          <div className="lg:hidden absolute inset-0 z-30 bg-background/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
            <div className="w-64 h-full bg-sidebar-gradient shadow-xl" onClick={e => e.stopPropagation()}>
              <div className="pt-4 p-4 space-y-1 h-full overflow-y-auto">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn('nav-link', isActive && 'nav-link-active')}
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
                <div className="pt-4 border-t border-sidebar-border mt-4">
                  <Link
                    to={settingsPath}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn('nav-link mb-2', location.pathname === settingsPath && 'nav-link-active')}
                  >
                    <UserIcon className="w-5 h-5" />
                    <span>View Profile</span>
                  </Link>
                  <Link
                    to="/profile-switcher"
                    onClick={() => setMobileMenuOpen(false)}
                    className="nav-link bg-primary/10 text-primary"
                  >
                    <ArrowRightLeft className="w-5 h-5" />
                    <span>Switch Profile</span>
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                    }}
                    className="nav-link text-destructive hover:bg-destructive/10 w-full"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 h-full overflow-y-auto overflow-x-hidden scroll-smooth w-full bg-muted/5">
          <header className="hidden lg:flex h-16 bg-card border-b border-border items-center justify-between px-8 sticky top-0 z-30 shadow-sm">
            <div className="flex items-center gap-4">
              {user.role !== 'admin' && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="input-field pl-10 w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              <RealtimeStatusIndicator />
              <LanguageSelector />
              <RealtimeNotificationBell />

              <Link
                to={settingsPath}
                className="flex items-center gap-3 p-1.5 rounded-full border border-border hover:border-primary/50 hover:bg-muted/50 transition-all bg-card shadow-sm pr-4"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs ring-2 ring-primary/20 flex-shrink-0">
                  {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="hidden xl:block text-left">
                  <p className="text-xs font-bold leading-tight">{user.name}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">{ROLE_LABELS[user.role]}</p>
                </div>
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              </Link>
            </div>
          </header>

          <div className="p-4 pb-32 sm:p-6 sm:pb-48 lg:p-10 lg:pb-10 w-full max-w-7xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>

      {/* Bottom Nav for mobile app feel */}
      {isBottomNavRole && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] bg-background/80 backdrop-blur-xl border-t border-border pb-safe transition-all shadow-[0_-8px_30px_rgb(0,0,0,0.12)]">
          <nav className="flex items-center justify-between h-20 px-4 max-w-lg mx-auto">
            {primaryBottomNavItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center flex-1 h-full min-w-0 px-1 gap-1.5 transition-all duration-300",
                    isActive ? "text-primary scale-110" : "text-muted-foreground opacity-70"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-2xl transition-all duration-300",
                    isActive ? "bg-primary/10 shadow-sm ring-1 ring-primary/20" : ""
                  )}>
                    <item.icon className={cn("w-6 h-6", isActive ? "stroke-[2.5px]" : "stroke-2")} />
                  </div>
                  <span className={cn(
                    "text-[9px] font-bold uppercase tracking-widest leading-none truncate w-full text-center transition-all",
                    isActive ? "opacity-100" : "opacity-0 h-0"
                  )}>
                    {item.label}
                  </span>
                </Link>
              );
            })}

            {showMoreOption && (
              <Sheet open={moreMenuOpen} onOpenChange={setMoreMenuOpen}>
                <SheetTrigger asChild>
                  <button className={cn(
                    "flex flex-col items-center justify-center flex-1 h-full min-w-0 px-1 gap-1.5 transition-all duration-300",
                    moreMenuOpen ? "text-primary scale-110" : "text-muted-foreground opacity-70"
                  )}>
                    <div className={cn(
                      "p-2 rounded-2xl transition-all duration-300",
                      moreMenuOpen ? "bg-primary/10 shadow-sm ring-1 ring-primary/20" : ""
                    )}>
                      <MoreHorizontal className={cn("w-6 h-6", moreMenuOpen ? "stroke-[2.5px]" : "stroke-2")} />
                    </div>
                    <span className={cn(
                      "text-[9px] font-bold uppercase tracking-widest leading-none transition-all",
                      moreMenuOpen ? "opacity-100" : "opacity-0 h-0"
                    )}>
                      More
                    </span>
                  </button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[80vh] rounded-t-[2.5rem] px-6 py-8 border-t-4 border-primary/20">
                  <SheetHeader className="text-left mb-8 flex flex-row items-center justify-between">
                    <div>
                      <SheetTitle className="text-2xl font-black italic tracking-tighter">VIDYON</SheetTitle>
                      <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">Application Menu</p>
                    </div>
                  </SheetHeader>
                  <div className="grid grid-cols-3 gap-4">
                    {moreBottomNavItems.map((item) => (
                      <Link
                        key={item.href}
                        to={item.href}
                        onClick={() => setMoreMenuOpen(false)}
                        className={cn(
                          "flex flex-col items-center justify-center p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors gap-2 text-center",
                          location.pathname === item.href && "bg-primary/10 text-primary border border-primary/20"
                        )}
                      >
                        <item.icon className="w-8 h-8" />
                        <span className="text-xs font-medium">{item.label}</span>
                      </Link>
                    ))}

                    <Link
                      to={settingsPath}
                      onClick={() => setMoreMenuOpen(false)}
                      className="flex flex-col items-center justify-center p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors gap-2 text-center"
                    >
                      <UserIcon className="w-8 h-8" />
                      <span className="text-xs font-medium">Profile</span>
                    </Link>
                    <button
                      onClick={() => {
                        setMoreMenuOpen(false);
                        logout();
                      }}
                      className="flex flex-col items-center justify-center p-4 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors gap-2 text-center"
                    >
                      <LogOut className="w-8 h-8" />
                      <span className="text-xs font-medium">Logout</span>
                    </button>
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </nav>
        </div>
      )}
    </div>
  );
}
