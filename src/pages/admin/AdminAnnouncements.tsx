import { useState } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Megaphone, Send, History, Bell, Clock } from 'lucide-react';

export function AdminAnnouncements() {
    const [announcements, setAnnouncements] = useState([
        { id: 1, title: 'Exam Schedule Released', audience: 'All Students', date: 'Oct 24, 2025', content: 'Term 1 exams will commence from Nov 10.' },
        { id: 2, title: 'Staff Meeting', audience: 'All Faculty', date: 'Oct 20, 2025', content: 'Mandatory staff meeting in the main hall at 3 PM.' },
    ]);

    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');
    const [audience, setAudience] = useState('All');

    const handleSend = () => {
        if (!newTitle || !newContent) return;
        const newAnnouncement = {
            id: Date.now(),
            title: newTitle,
            audience: audience,
            date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
            content: newContent
        };
        setAnnouncements([newAnnouncement, ...announcements]);
        setNewTitle('');
        setNewContent('');
    };

    return (
        <AdminLayout>
            <PageHeader
                title="Announcements & Notices"
                subtitle="Broadcast Circulars to Students, Parents, and Staff"
            />

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Create Announcement */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="dashboard-card p-6">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <Megaphone className="w-5 h-5 text-primary" />
                            Create Notice
                        </h3>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Title / Subject</Label>
                                <Input
                                    placeholder="e.g. Holiday Announcement"
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Target Audience</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={audience}
                                    onChange={(e) => setAudience(e.target.value)}
                                >
                                    <option value="All">Everyone (School Wide)</option>
                                    <option value="All Students">All Students</option>
                                    <option value="All Faculty">All Staff</option>
                                    <option value="Parents">Parents</option>
                                    <option value="Grade 10">Grade 10 Only</option>
                                    <option value="Grade 12">Grade 12 Only</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label>Message Content</Label>
                                <Textarea
                                    placeholder="Type your message here..."
                                    className="min-h-[120px]"
                                    value={newContent}
                                    onChange={(e) => setNewContent(e.target.value)}
                                />
                            </div>

                            <Button className="w-full gap-2" onClick={handleSend}>
                                <Send className="w-4 h-4" /> Publish Announcement
                            </Button>
                        </div>
                    </div>
                </div>

                {/* History */}
                <div className="lg:col-span-2">
                    <div className="dashboard-card p-6">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <History className="w-5 h-5 text-muted-foreground" />
                            Recent Broadcasts
                        </h3>

                        <div className="space-y-4">
                            {announcements.map((item) => (
                                <div key={item.id} className="p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-bold text-foreground">{item.title}</h4>
                                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full inline-block mt-1">
                                                {item.audience}
                                            </span>
                                        </div>
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> {item.date}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {item.content}
                                    </p>
                                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-dashed border-border text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1"><Bell className="w-3 h-3" /> Sent via App Notification</span>
                                        <span>•</span>
                                        <span>SMS Delivered</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
