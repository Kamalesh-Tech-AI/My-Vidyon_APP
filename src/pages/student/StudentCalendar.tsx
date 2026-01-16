import { useState, useEffect } from 'react';
import { StudentLayout } from '@/layouts/StudentLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/common/Badge';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Loader2, Clock, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';

interface AcademicEvent {
    id: string;
    title: string;
    date: string;
    start_date: string;
    end_date: string;
    type: string;
    category: string;
    description: string;
    banner_url?: string | null;
}

export function StudentCalendar() {
    const { user } = useAuth();
    const [events, setEvents] = useState<AcademicEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    const [filterState, setFilterState] = useState({
        showHolidays: true,
        showExams: true,
        showCultural: true
    });

    const [currentDate, setCurrentDate] = useState(new Date());
    const [direction, setDirection] = useState<'next' | 'prev'>('next');
    const [isAnimating, setIsAnimating] = useState(false);
    const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<AcademicEvent | null>(null);

    const handleEventClick = (event: AcademicEvent) => {
        setSelectedEvent(event);
        setIsDetailsDialogOpen(true);
    };

    // Fetch Events with Realtime
    useEffect(() => {
        if (!user?.institutionId) return;

        const fetchEvents = async () => {
            try {
                setIsRefreshing(true);
                const { data, error } = await supabase
                    .from('academic_events')
                    .select('*')
                    .eq('institution_id', user.institutionId)
                    .order('start_date', { ascending: true });

                if (error) throw error;

                if (data) {
                    const formattedEvents: AcademicEvent[] = data.map(e => {
                        const start = new Date(e.start_date);
                        const end = new Date(e.end_date);

                        let dateStr = format(start, 'MMM dd, yyyy');
                        if (start.getTime() !== end.getTime()) {
                            dateStr = `${format(start, 'MMM dd')} - ${format(end, 'MMM dd, yyyy')}`;
                        }

                        return {
                            id: e.id,
                            title: e.title,
                            type: e.event_type,
                            category: e.category || 'General',
                            description: e.description || '',
                            date: dateStr,
                            start_date: e.start_date,
                            end_date: e.end_date,
                            banner_url: e.banner_url || null
                        };
                    });
                    setEvents(formattedEvents);
                    setLastUpdated(new Date());
                }
            } catch (err: any) {
                console.error("Error fetching academic events:", err);
                toast.error("Failed to load calendar events");
            } finally {
                setLoading(false);
                setIsRefreshing(false);
            }
        };

        fetchEvents();

        // Realtime Subscription - Listen to institution's calendar changes
        const channel = supabase
            .channel('student_calendar_realtime')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'academic_events', filter: `institution_id=eq.${user.institutionId}` },
                (payload) => {
                    console.log('Calendar event changed:', payload);
                    toast.info('Calendar updated', { duration: 2000 });
                    fetchEvents();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };

    }, [user?.institutionId]);

    const getDaysInMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const handlePrevMonth = () => {
        if (isAnimating) return;
        setIsAnimating(true);
        setDirection('prev');
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
        setTimeout(() => setIsAnimating(false), 300);
    };

    const handleNextMonth = () => {
        if (isAnimating) return;
        setIsAnimating(true);
        setDirection('next');
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
        setTimeout(() => setIsAnimating(false), 300);
    };

    const calendarTransitionStyle = `
        @keyframes smoothSlideNext {
            0% { opacity: 0; transform: translateX(20px); }
            100% { opacity: 1; transform: translateX(0); }
        }
        @keyframes smoothSlidePrev {
            0% { opacity: 0; transform: translateX(-20px); }
            100% { opacity: 1; transform: translateX(0); }
        }
        .animate-slide-next { animation: smoothSlideNext 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards; }
        .animate-slide-prev { animation: smoothSlidePrev 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards; }
    `;

    return (
        <StudentLayout>
            <style>{calendarTransitionStyle}</style>
            <PageHeader
                title="Academic Calendar"
                subtitle={`View school events and schedules • Last updated: ${lastUpdated.toLocaleTimeString()}`}
                actions={
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.location.reload()}
                            disabled={isRefreshing}
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                            {isRefreshing ? 'Refreshing...' : 'Refresh'}
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                    Filter
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>Filter Calendar</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuCheckboxItem
                                    checked={filterState.showHolidays}
                                    onCheckedChange={(checked) => setFilterState(prev => ({ ...prev, showHolidays: checked }))}
                                >
                                    Show Holidays
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem
                                    checked={filterState.showExams}
                                    onCheckedChange={(checked) => setFilterState(prev => ({ ...prev, showExams: checked }))}
                                >
                                    Show Exam Dates
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem
                                    checked={filterState.showCultural}
                                    onCheckedChange={(checked) => setFilterState(prev => ({ ...prev, showCultural: checked }))}
                                >
                                    Show Cultural Events
                                </DropdownMenuCheckboxItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                }
            />

            <div className="space-y-8">
                {/* Calendar Section */}
                <div className="dashboard-card pt-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                            <CalendarIcon className="w-5 h-5 text-primary" />
                            {currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                        </h3>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={handlePrevMonth} disabled={isAnimating}>
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleNextMonth} disabled={isAnimating}>
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="h-[400px] flex items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div
                            key={`${currentDate.toString()}`}
                            className={`grid grid-cols-7 gap-px bg-border overflow-hidden rounded-lg ${direction === 'next' ? 'animate-slide-next' : 'animate-slide-prev'}`}
                        >
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                <div key={day} className="bg-muted p-2 text-center text-xs font-semibold text-muted-foreground">{day}</div>
                            ))}

                            {Array.from({ length: getFirstDayOfMonth(currentDate) }).map((_, i) => (
                                <div key={`empty-${i}`} className="bg-background/50 min-h-[100px] border-t border-r last:border-r-0" />
                            ))}

                            {Array.from({ length: getDaysInMonth(currentDate) }).map((_, i) => {
                                const day = i + 1;
                                const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);

                                const today = new Date();
                                const isToday = day === today.getDate() &&
                                    currentDate.getMonth() === today.getMonth() &&
                                    currentDate.getFullYear() === today.getFullYear();

                                const dayEvents = events.filter(e => {
                                    if (e.type === 'holiday' && !filterState.showHolidays) return false;
                                    if (e.type === 'exam' && !filterState.showExams) return false;
                                    if (e.type === 'cultural' && !filterState.showCultural) return false;

                                    const start = new Date(e.start_date);
                                    const end = new Date(e.end_date);
                                    start.setHours(0, 0, 0, 0);
                                    end.setHours(0, 0, 0, 0);
                                    dateObj.setHours(0, 0, 0, 0);

                                    return dateObj >= start && dateObj <= end;
                                });

                                return (
                                    <div key={`day-${day}`} className={`bg-background min-h-[100px] p-2 border-t border-r last:border-r-0 hover:bg-muted/30 transition-colors ${isToday ? 'bg-primary/5' : ''}`}>
                                        <div className="flex justify-between items-start">
                                            <span className={`text-sm ${isToday ? 'font-bold text-primary' : ''}`}>{day}</span>
                                        </div>
                                        <div className="space-y-1 mt-1">
                                            {dayEvents.map((event, idx) => {
                                                const colorClass = event.type === 'holiday'
                                                    ? 'bg-destructive/10 text-destructive border-destructive/20'
                                                    : event.type === 'exam'
                                                        ? 'bg-orange-100 text-orange-600 border-orange-200'
                                                        : 'bg-primary/10 text-primary border-primary/20';

                                                return (
                                                    <div key={`${event.id}-${idx}`} className={`p-1 text-[10px] rounded truncate border ${colorClass}`} title={event.title}>
                                                        {event.title}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Upcoming Events */}
                <div className="dashboard-card">
                    <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
                        <CalendarIcon className="w-5 h-5 text-primary" />
                        Upcoming Events
                    </h3>

                    {events.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {events.slice(0, 6).map((event) => (
                                <div key={event.id} className="rounded-lg border bg-card overflow-hidden hover:shadow-md transition-all">
                                    {event.banner_url && (
                                        <img src={event.banner_url} alt={event.title} className="w-full h-32 object-cover" />
                                    )}
                                    <div className="p-4 cursor-pointer" onClick={() => handleEventClick(event)}>
                                        <div className="flex items-start justify-between mb-2">
                                            <h4 className="font-semibold text-sm line-clamp-1">{event.title}</h4>
                                            <Badge variant="info" className="text-[10px] uppercase">{event.type}</Badge>
                                        </div>
                                        <div className="text-xs text-muted-foreground flex items-center gap-2 mb-2">
                                            <Clock className="w-3 h-3" />
                                            {event.date}
                                        </div>
                                        {event.description && <p className="text-xs text-muted-foreground line-clamp-2">{event.description}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="border-dashed border-2 bg-muted/30 rounded-lg flex flex-col items-center justify-center h-32 text-muted-foreground">
                            <CalendarIcon className="w-12 h-12 mb-3 opacity-20" />
                            <p>No upcoming events</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Event Details Dialog */}
            <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    {selectedEvent && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="text-xl">{selectedEvent.title}</DialogTitle>
                                <DialogDescription>
                                    {selectedEvent.date}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                {selectedEvent.banner_url && (
                                    <div className="rounded-lg overflow-hidden">
                                        <img
                                            src={selectedEvent.banner_url}
                                            alt={selectedEvent.title}
                                            className="w-full h-64 object-cover"
                                        />
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Type</p>
                                        <Badge variant="info" className="mt-1 uppercase">{selectedEvent.type}</Badge>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Category</p>
                                        <p className="text-sm mt-1">{selectedEvent.category}</p>
                                    </div>
                                </div>
                                {selectedEvent.description && (
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground mb-2">Description</p>
                                        <p className="text-sm">{selectedEvent.description}</p>
                                    </div>
                                )}
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
                                    Close
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </StudentLayout>
    );
}
