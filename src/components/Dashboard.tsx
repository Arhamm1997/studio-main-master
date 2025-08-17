// src/components/Dashboard.tsx - ENHANCED WITH ULTRA-FAST REAL-TIME UPDATES
'use client';

import type { Analytics, Campaign, Contact, EmailRecord } from '@/lib/types';
import { useState, useTransition, useRef, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { addContact, sendCampaign, updateCampaign, deleteContacts, cleanContacts, addContacts, cleanEmailRecords } from '@/app/actions';
import { CircleUser, Mail, Users, BarChart, Send, PlusCircle, Loader2, Rocket, CheckCircle2, XCircle, Trash2, Sparkles, Upload, Eye, Clock, Activity, Zap, Timer, AlertCircle, TestTube } from 'lucide-react';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

// Enhanced Analytics Card with ultra-real-time indicators
function AnalyticsCard({ analytics }: { analytics: Analytics }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BarChart className="w-6 h-6" />
                    🔴 ULTRA-LIVE Campaign Analytics
                </CardTitle>
                <CardDescription>Real-time overview with exact timestamps and instant 1-second updates.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="p-4 rounded-lg bg-secondary">
                        <Users className="w-6 h-6 mx-auto mb-2 text-primary" />
                        <p className="text-2xl font-bold">{analytics.total}</p>
                        <p className="text-sm text-muted-foreground">Total Contacts</p>
                    </div>
                    <div className="p-4 rounded-lg bg-secondary">
                        <Send className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                        <p className="text-2xl font-bold">{analytics.sent}</p>
                        <p className="text-sm text-muted-foreground">Sent</p>
                    </div>
                    <div className="p-4 rounded-lg bg-secondary relative">
                        <Eye className="w-6 h-6 mx-auto mb-2 text-green-500" />
                        <p className="text-2xl font-bold animate-pulse">{analytics.opened}</p>
                        <p className="text-sm text-muted-foreground">Opened (Live)</p>
                        <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                    </div>
                    <div className="p-4 rounded-lg bg-secondary">
                        <Rocket className="w-6 h-6 mx-auto mb-2 text-violet-500" />
                        <p className="text-2xl font-bold">{analytics.openRate}%</p>
                        <p className="text-sm text-muted-foreground">Open Rate</p>
                    </div>
                </div>
                <div className="mt-4 space-y-2">
                    <div>
                        <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium text-muted-foreground">Sent Progress</span>
                            <span className="text-sm font-medium">{analytics.sent} / {analytics.total}</span>
                        </div>
                        <Progress value={analytics.sentRate} />
                    </div>
                    {analytics.opened > 0 && (
                        <div>
                            <div className="flex justify-between mb-1">
                                <span className="text-sm font-medium text-muted-foreground">Open Progress</span>
                                <span className="text-sm font-medium">{analytics.opened} / {analytics.sent}</span>
                            </div>
                            <Progress value={analytics.openRate} className="bg-green-100" />
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function AddContactDialog({ onAdd }: { onAdd: (contact: Omit<Contact, 'id'>) => void }) {
    const [isPending, startTransition] = useTransition();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const handleAdd = () => {
        startTransition(() => {
            onAdd({ firstName, lastName, email, status: 'Pending', sentTimestamp: null, openTimestamp: null });
            setIsOpen(false);
            setFirstName('');
            setLastName('');
            setEmail('');
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Contact
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Contact</DialogTitle>
                    <DialogDescription>Enter the details for the new contact.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input id="firstName" value={firstName} onChange={e => setFirstName(e.target.value)} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input id="lastName" value={lastName} onChange={e => setLastName(e.target.value)} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                    <Button onClick={handleAdd} disabled={isPending || !email}>
                        {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...</> : 'Add Contact'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ENHANCED Contacts Table with ultra-precise timestamps
function ContactsTable({ 
    contacts, 
    onAddContact, 
    onAddContacts,
    onDeleteContacts,
    onCleanContacts,
}: { 
    contacts: Contact[], 
    onAddContact: (contact: Omit<Contact, 'id'>) => void,
    onAddContacts: (contacts: Omit<Contact, 'id'>[]) => void,
    onDeleteContacts: (ids: string[]) => void,
    onCleanContacts: (ids: string[]) => void,
}) {
    const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
    const [isPending, startTransition] = useTransition();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isAllSelected = contacts.length > 0 && selectedContactIds.length === contacts.length;

    const handleSelectAll = (checked: boolean) => {
        setSelectedContactIds(checked ? contacts.map(c => c.id) : []);
    };

    const handleSelectOne = (contactId: string, checked: boolean) => {
        setSelectedContactIds(prev =>
            checked ? [...prev, contactId] : prev.filter(id => id !== contactId)
        );
    };
    
    const handleDelete = () => {
        startTransition(() => {
            onDeleteContacts(selectedContactIds);
            setSelectedContactIds([]);
        });
    };
    
    const handleClean = () => {
        startTransition(() => {
            onCleanContacts(selectedContactIds);
            setSelectedContactIds([]);
        });
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };
    
    const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result;
            if (typeof text !== 'string') return;
            
            const lines = text.split('\n').filter(line => line.trim() !== '');
            const header = lines[0].split(',').map(h => h.trim());
            const emailIndex = header.findIndex(h => h.toLowerCase() === 'email');
            const firstNameIndex = header.findIndex(h => h.toLowerCase() === 'firstname' || h.toLowerCase() === 'first name');
            const lastNameIndex = header.findIndex(h => h.toLowerCase() === 'lastname' || h.toLowerCase() === 'last name');
            
            if (emailIndex === -1) {
                console.error("CSV must have an 'email' column.");
                return;
            }

            const newContacts = lines.slice(1).map(line => {
                const values = line.split(',');
                return {
                    email: values[emailIndex]?.trim() || '',
                    firstName: values[firstNameIndex]?.trim() || '',
                    lastName: values[lastNameIndex]?.trim() || '',
                };
            }).filter(c => c.email);
            
            startTransition(() => {
                onAddContacts(newContacts);
            });
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    // ENHANCED status pill with ULTRA-precise timing
    const StatusPill = ({ contact }: { contact: Contact }) => {
        const baseClasses = "px-2 py-1 text-xs font-medium rounded-full inline-flex items-center gap-1.5";
        
        // Calculate ultra-precise time differences
        const now = Date.now();
        const isInstantOpen = contact.openTimestamp && 
            new Date(contact.openTimestamp).getTime() > (now - 5000); // Last 5 seconds
        const isVeryRecentOpen = contact.openTimestamp && 
            new Date(contact.openTimestamp).getTime() > (now - 30000); // Last 30 seconds
        const isRecentOpen = contact.openTimestamp && 
            new Date(contact.openTimestamp).getTime() > (now - 60000); // Last minute
        
        if (contact.status === 'Sent') {
            return (
                <div className={`${baseClasses} bg-blue-100 text-blue-800`}>
                    <CheckCircle2 className="w-3 h-3" />
                    Sent
                </div>
            );
        }
        
        if (contact.status === 'Opened') {
            return (
                <div className={`${baseClasses} ${
                    isInstantOpen ? 'bg-red-100 text-red-800 animate-bounce ring-2 ring-red-400' : 
                    isVeryRecentOpen ? 'bg-orange-100 text-orange-800 animate-pulse ring-2 ring-orange-300' : 
                    isRecentOpen ? 'bg-green-100 text-green-800 ring-2 ring-green-300' : 
                    'bg-green-100 text-green-800'
                }`}>
                    <Eye className="w-3 h-3" />
                    {isInstantOpen ? '🔥 JUST NOW!' : 
                     isVeryRecentOpen ? '⚡ Very Recent' : 
                     isRecentOpen ? 'Recently Opened' : 'Opened'}
                </div>
            );
        }
        
        if (contact.status === 'Error') {
            return (
                <div className={`${baseClasses} bg-red-100 text-red-800`}>
                    <XCircle className="w-3 h-3" />
                    Error
                </div>
            );
        }
        
        return (
            <div className={`${baseClasses} bg-yellow-100 text-yellow-800`}>
                <Clock className="w-3 h-3" />
                Pending
            </div>
        );
    };

    // ULTRA-PRECISE timestamp formatting
    const formatUltraPreciseTime = (timestamp: string | null) => {
        if (!timestamp) return '—';
        
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffSeconds = Math.floor(diffMs / 1000);
        const diffMinutes = Math.floor(diffSeconds / 60);
        
        // Ultra-precise timing display
        if (diffSeconds < 3) {
            return (
                <span className="text-red-600 font-bold animate-pulse">
                    <Zap className="w-3 h-3 inline mr-1" />
                    RIGHT NOW! ({format(date, 'HH:mm:ss.SSS')})
                </span>
            );
        } else if (diffSeconds < 10) {
            return (
                <span className="text-red-600 font-bold">
                    <Timer className="w-3 h-3 inline mr-1" />
                    {diffSeconds}s ago ({format(date, 'HH:mm:ss')})
                </span>
            );
        } else if (diffSeconds < 60) {
            return (
                <span className="text-orange-600 font-medium">
                    {diffSeconds}s ago ({format(date, 'HH:mm:ss')})
                </span>
            );
        } else if (diffMinutes < 60) {
            return (
                <span className="text-green-600 font-medium">
                    {diffMinutes}m ago ({format(date, 'HH:mm:ss')})
                </span>
            );
        } else {
            return (
                <span className="text-gray-600">
                    {format(date, 'MMM d, HH:mm:ss')}
                </span>
            );
        }
    };
    
    return (
        <Card>
            <CardHeader className="flex flex-row items-start justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <CircleUser className="w-6 h-6" />
                        Contacts
                        <Badge className="ml-2 bg-primary/20 text-primary">
                            {contacts.length}
                        </Badge>
                    </CardTitle>
                    <CardDescription>Manage recipients with ultra-real-time status and exact open timestamps.</CardDescription>
                </div>
                <div className="flex gap-2">
                    <input type="file" ref={fileInputRef} onChange={handleFileImport} accept=".csv" className="hidden" />
                    <Button variant="outline" onClick={handleImportClick}><Upload className="mr-2 h-4 w-4" />Import CSV</Button>
                    <AddContactDialog onAdd={onAddContact} />
                </div>
            </CardHeader>
            <CardContent>
                 {selectedContactIds.length > 0 && (
                    <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-secondary">
                        <p className="text-sm font-medium">{selectedContactIds.length} selected</p>
                        <Button variant="outline" size="sm" onClick={handleClean} disabled={isPending}><Sparkles className="mr-2 h-4 w-4" />Clean</Button>
                        <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isPending}><Trash2 className="mr-2 h-4 w-4" />Delete</Button>
                    </div>
                 )}
                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader className="bg-secondary">
                            <TableRow>
                                <TableHead className="w-[50px]"><Checkbox checked={isAllSelected} onCheckedChange={handleSelectAll} /></TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Sent Time</TableHead>
                                <TableHead>Open Time</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {contacts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                        No contacts yet. Add one or import a CSV to get started!
                                    </TableCell>
                                </TableRow>
                            ) : contacts.map(contact => {
                                const now = Date.now();
                                const isInstantOpen = contact.openTimestamp && 
                                    new Date(contact.openTimestamp).getTime() > (now - 5000); // Last 5 seconds
                                const isVeryRecentOpen = contact.openTimestamp && 
                                    new Date(contact.openTimestamp).getTime() > (now - 30000); // Last 30 seconds
                                
                                return (
                                    <TableRow 
                                        key={contact.id} 
                                        data-state={selectedContactIds.includes(contact.id) && "selected"}
                                        className={
                                            isInstantOpen ? 'bg-red-50 border-2 border-red-400 animate-pulse' :
                                            isVeryRecentOpen ? 'bg-orange-50 border-2 border-orange-300 animate-pulse' : 
                                            contact.status === 'Opened' ? 'bg-green-50 border border-green-200' : ''
                                        }
                                    >
                                        <TableCell><Checkbox checked={selectedContactIds.includes(contact.id)} onCheckedChange={(checked) => handleSelectOne(contact.id, !!checked)} /></TableCell>
                                        <TableCell className="font-medium">{contact.firstName} {contact.lastName}</TableCell>
                                        <TableCell className="text-muted-foreground">{contact.email}</TableCell>
                                        <TableCell><StatusPill contact={contact} /></TableCell>
                                        <TableCell>
                                            {contact.sentTimestamp ? (
                                                <span className="text-blue-600">
                                                    {format(parseISO(contact.sentTimestamp), 'MMM d, HH:mm:ss')}
                                                </span>
                                            ) : '—'}
                                        </TableCell>
                                        <TableCell>
                                            {formatUltraPreciseTime(contact.openTimestamp)}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}

// ENHANCED EMAIL RECORDS TABLE with ultra-precise timestamps
function EmailRecordsTable({ emailRecords, onCleanRecords }: { 
    emailRecords: EmailRecord[]; 
    onCleanRecords: () => void;
}) {
    const [isClearing, setIsClearing] = useState(false);

    const handleCleanRecords = async () => {
        setIsClearing(true);
        try {
            await onCleanRecords();
        } finally {
            setIsClearing(false);
        }
    };

    // Ultra-precise email timestamp formatting
    const formatEmailTime = (timestamp: string | null) => {
        if (!timestamp) return '—';
        
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffSeconds = Math.floor(diffMs / 1000);
        const diffMinutes = Math.floor(diffSeconds / 60);
        
        if (diffSeconds < 5) {
            return (
                <span className="text-red-600 font-bold animate-pulse">
                    <Timer className="w-3 h-3 inline mr-1" />
                    Just now!
                </span>
            );
        } else if (diffSeconds < 60) {
            return (
                <span className="text-orange-600 font-medium">
                    {diffSeconds}s ago
                </span>
            );
        } else if (diffMinutes < 60) {
            return (
                <span className="text-green-600 font-medium">
                    {diffMinutes}m ago
                </span>
            );
        } else {
            return format(date, 'MMM d, HH:mm:ss');
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-start justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="w-6 h-6" />
                        Email Records
                        {emailRecords.length > 0 && (
                            <Badge className="ml-2 bg-primary/20 text-primary">
                                {emailRecords.length}
                            </Badge>
                        )}
                    </CardTitle>
                    <CardDescription>
                        Complete history with ultra-precise timestamps and real-time tracking status.
                    </CardDescription>
                </div>
                {emailRecords.length > 0 && (
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleCleanRecords}
                        disabled={isClearing}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                        {isClearing ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Trash2 className="w-4 h-4 mr-2" />
                        )}
                        Clear All Records
                    </Button>
                )}
            </CardHeader>
            <CardContent>
                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader className="bg-secondary">
                            <TableRow>
                                <TableHead>Contact</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Subject</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Sent At</TableHead>
                                <TableHead>Opened At</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {emailRecords.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                        No email records yet. Send a campaign to see records here!
                                    </TableCell>
                                </TableRow>
                            ) : emailRecords.map(record => {
                                const isInstantOpen = record.openedAt && 
                                    new Date(record.openedAt).getTime() > (Date.now() - 5000); // Last 5 seconds
                                const isVeryRecentOpen = record.openedAt && 
                                    new Date(record.openedAt).getTime() > (Date.now() - 30000); // Last 30 seconds
                                
                                return (
                                    <TableRow 
                                        key={record.id}
                                        className={
                                            isInstantOpen ? 'bg-red-50 border-2 border-red-400 animate-pulse' :
                                            isVeryRecentOpen ? 'bg-orange-50 border border-orange-300' :
                                            record.status === 'Opened' ? 'bg-green-50 border border-green-200' : ''
                                        }
                                    >
                                        <TableCell className="font-medium">{record.contactName}</TableCell>
                                        <TableCell className="text-muted-foreground">{record.contactEmail}</TableCell>
                                        <TableCell className="max-w-[200px] truncate">{record.subject}</TableCell>
                                        <TableCell>
                                            {record.status === 'Opened' ? (
                                                <Badge className={`bg-green-100 text-green-800 ${
                                                    isInstantOpen ? 'animate-pulse ring-2 ring-red-400 bg-red-100 text-red-800' : 
                                                    isVeryRecentOpen ? 'animate-pulse ring-2 ring-orange-300' : ''
                                                }`}>
                                                    <Eye className="w-3 h-3 mr-1" />
                                                    {isInstantOpen ? '🔥 Just Opened!' : 
                                                     isVeryRecentOpen ? '⚡ Recently!' : 'Opened'}
                                                </Badge>
                                            ) : record.status === 'Sent' ? (
                                                <Badge className="bg-blue-100 text-blue-800">
                                                    <Send className="w-3 h-3 mr-1" />
                                                    Sent
                                                </Badge>
                                            ) : (
                                                <Badge variant="destructive">
                                                    <XCircle className="w-3 h-3 mr-1" />
                                                    Error
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-blue-600">
                                                {format(parseISO(record.sentAt), 'MMM d, HH:mm:ss')}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {formatEmailTime(record.openedAt)}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}

function CampaignProgress({ isActive, stats }: { 
  isActive: boolean; 
  stats?: { sent: number; total: number; } 
}) {
  if (!isActive) return null;

  const progress = stats ? (stats.sent / stats.total) * 100 : 0;
  
  return (
    <Card className="mb-4 border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <Loader2 className="w-5 h-5 animate-spin" />
          Sending Campaign...
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{stats?.sent || 0} / {stats?.total || 0} emails sent</span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-blue-600">
            Emails are being sent in parallel batches for faster delivery
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard({ 
    initialCampaign, 
    initialContacts, 
    initialAnalytics,
    initialEmailRecords = []
}: { 
    initialCampaign: Campaign, 
    initialContacts: Contact[], 
    initialAnalytics: Analytics,
    initialEmailRecords?: EmailRecord[]
}) {
    const router = useRouter();
    const { toast } = useToast();
    const [isSending, startSendingTransition] = useTransition();

    const campaign = useMemo(() => initialCampaign, [initialCampaign]);
    const contacts = useMemo(() => initialContacts, [initialContacts]);
    const analytics = useMemo(() => initialAnalytics, [initialAnalytics]);
    const emailRecords = useMemo(() => initialEmailRecords, [initialEmailRecords]);

    // 🔥 ULTRA-FAST refresh interval - every 1 second for instant updates
    useEffect(() => {
        const interval = setInterval(() => {
            console.log('🔴 ULTRA-FAST refresh - checking for instant status updates...');
            refreshData();
        }, 1000); // 1 second for ultra-real-time effect

        return () => clearInterval(interval);
    }, []);

    const refreshData = () => {
        router.refresh();
    };

    // Clean email records function
    const handleCleanEmailRecords = async () => {
        try {
            const result = await cleanEmailRecords();
            if (result.success) {
                toast({
                    title: "Records Cleared",
                    description: result.message,
                    className: "bg-green-100 text-green-900 border-green-200",
                });
                refreshData();
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: result.message,
                });
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to clear email records.",
            });
        }
    };
    
    const handleSaveCampaign = async (data: Campaign) => {
        const result = await updateCampaign(data);
        if (result.success) {
            toast({
                title: "Success!",
                description: result.message,
                className: "bg-green-100 text-green-900 border-green-200",
            });
            refreshData();
        }
    };
    
    const handleAddContact = async (contactData: Omit<Contact, 'id'>) => {
        const result = await addContact(contactData);
        if (result.success) {
             toast({
                title: "Contact Added",
                description: `${contactData.firstName} has been added to your list.`,
            });
            refreshData();
        }
    };
    
    const handleAddContacts = async (contactsData: Omit<Contact, 'id'>[]) => {
        const result = await addContacts(contactsData);
        if (result.success) {
             toast({
                title: "Import Successful",
                description: result.message,
            });
            refreshData();
        }
    };

    const handleDeleteContacts = async (ids: string[]) => {
        const result = await deleteContacts(ids);
        if (result.success) {
             toast({
                title: "Contacts Deleted",
                description: result.message,
            });
            refreshData();
        }
    };
    
    const handleCleanContacts = async (ids: string[]) => {
        const result = await cleanContacts(ids);
        if (result.success) {
             toast({
                title: "Contacts Cleaned",
                description: result.message,
            });
            refreshData();
        }
    };

    const handleSendCampaign = () => {
        startSendingTransition(async () => {
            const result = await sendCampaign();
            if (result.success) {
                toast({
                    title: "Campaign Sent!",
                    description: result.message,
                    className: "bg-green-100 text-green-900 border-green-200",
                });
                // Force refresh after campaign
                setTimeout(() => refreshData(), 1000);
            } else {
                toast({
                    variant: "destructive",
                    title: "Campaign Failed",
                    description: result.message,
                });
            }
        });
    };

    // ULTRA-PRECISE real-time tracking indicators
    const now = Date.now();
    const instantOpens = contacts.filter(c => 
        c.openTimestamp && 
        new Date(c.openTimestamp).getTime() > (now - 5000) // Last 5 seconds
    );
    
    const liveOpens = contacts.filter(c => 
        c.openTimestamp && 
        new Date(c.openTimestamp).getTime() > (now - 30000) // Last 30 seconds
    );

    const recentOpens = contacts.filter(c => 
        c.openTimestamp && 
        new Date(c.openTimestamp).getTime() > (now - 60000) // Last minute
    );

    return (
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 bg-background">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-headline">🔴 ULTRA-LIVE Email Tracking Dashboard</h1>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <span>Real-time email tracking with exact timestamps and instant 1-second updates.</span>
                        
                        {instantOpens.length > 0 && (
                            <div className="flex items-center gap-1 text-red-600 font-bold animate-bounce">
                                <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                                <span className="text-sm">🔥 INSTANT: {instantOpens.length} just opened!</span>
                            </div>
                        )}
                        
                        {liveOpens.length > 0 && instantOpens.length === 0 && (
                            <div className="flex items-center gap-1 text-orange-600 font-medium animate-pulse">
                                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                <span className="text-sm">⚡ {liveOpens.length} live opens</span>
                            </div>
                        )}
                        
                        {recentOpens.length > 0 && liveOpens.length === 0 && (
                            <div className="flex items-center gap-1 text-green-600 font-medium">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-sm">📊 {recentOpens.length} recent opens</span>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/test-tracking">
                        <Button variant="outline" size="sm">
                            <TestTube className="w-4 h-4 mr-2" />
                            Test Tracking
                        </Button>
                    </Link>
                    <div className="text-xs text-right text-muted-foreground">
                        <p>🔴 ULTRA refresh: 1s</p>
                        <p>📊 Exact timestamps</p>
                        <p>⚡ Instant detection</p>
                    </div>
                    <Button size="lg" onClick={handleSendCampaign} disabled={isSending}>
                        {isSending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending Campaign...</> : <><Send className="mr-2 h-4 w-4" /> Send Campaign</>}
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:gap-8">
                <AnalyticsCard analytics={analytics} />

                <Tabs defaultValue="campaign-editor" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="campaign-editor">Campaign Editor</TabsTrigger>
                        <TabsTrigger value="contacts">
                            Contacts
                            {instantOpens.length > 0 && (
                                <Badge className="ml-2 bg-red-500 text-white animate-pulse">
                                    🔥 INSTANT
                                </Badge>
                            )}
                            {liveOpens.length > 0 && instantOpens.length === 0 && (
                                <Badge className="ml-2 bg-orange-500 text-white animate-pulse">
                                    ⚡ LIVE
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="email-records">
                            Email Records
                            {emailRecords.length > 0 && (
                                <Badge className="ml-2 bg-primary/20 text-primary">
                                    {emailRecords.length}
                                </Badge>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="campaign-editor" className="pt-4">
                        <CampaignEditor campaign={campaign} onSave={handleSaveCampaign} />
                    </TabsContent>

                    <TabsContent value="contacts" className="pt-4">
                        <ContactsTable 
                            contacts={contacts} 
                            onAddContact={handleAddContact}
                            onAddContacts={handleAddContacts}
                            onDeleteContacts={handleDeleteContacts}
                            onCleanContacts={handleCleanContacts}
                        />
                    </TabsContent>

                    <TabsContent value="email-records" className="pt-4">
                        <EmailRecordsTable 
                            emailRecords={emailRecords} 
                            onCleanRecords={handleCleanEmailRecords}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </main>
    );
}

function CampaignEditor({ campaign, onSave }: { campaign: Campaign, onSave: (data: Campaign) => void }) {
    const [isPending, startTransition] = useTransition();
    const [subject, setSubject] = useState(campaign.subject);
    const [body, setBody] = useState(campaign.body);

    const handleSave = () => {
        startTransition(() => {
            onSave({ ...campaign, subject, body });
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Campaign Editor</CardTitle>
                <CardDescription>
                    Craft your email content and settings. Use {'{{firstName}}'} and {'{{lastName}}'} for personalization.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="subject">Subject</Label>
                        <Input 
                            id="subject" 
                            value={subject} 
                            onChange={e => setSubject(e.target.value)} 
                            placeholder="e.g. An important message for {{firstName}}" 
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            Use {'{{firstName}}'} and {'{{lastName}}'} for personalization.
                        </p>
                    </div>
                    <div>
                        <Label htmlFor="body">Body</Label>
                        <Textarea 
                            id="body" 
                            value={body} 
                            onChange={e => setBody(e.target.value)} 
                            rows={10} 
                            placeholder="e.g. Dear {{firstName}}," 
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            Available variables: {'{{firstName}}'}, {'{{lastName}}'}, {'{{fullName}}'}, {'{{teamLeadName}}'}, {'{{date}}'}
                        </p>
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                 <Button onClick={handleSave} disabled={isPending}>
                    {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Campaign'}
                 </Button>
            </CardFooter>
        </Card>
    );
}