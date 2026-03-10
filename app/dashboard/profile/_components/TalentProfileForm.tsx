'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { TalentProfile, AvailabilityStatus } from '@prisma/client';
import { updateTalentProfile } from '@/app/actions/profile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { formatEnum } from '@/lib/formatters';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus, Trash2, Globe, Github, Linkedin, ExternalLink, Info } from 'lucide-react';

const talentSchema = z.object({
    displayName: z.string().min(2, "Name must be at least 2 characters."),
    headline: z.string().optional(),
    yearsOfExp: z.coerce.number().min(0).optional(),
    languages: z.array(z.string()),
    location: z.string().optional(),
    timezone: z.string().optional(),
    availableTimeslots: z.any().optional(),
    primaryArea: z.string().optional(),
    otherSkills: z.string().optional(),
    desiredHourlyRate: z.coerce.number().min(0).optional(),
    availabilityState: z.nativeEnum(AvailabilityStatus).optional(),
    websiteUrl: z.string().optional().or(z.literal('')),
    linkedinUrl: z.string().optional().or(z.literal('')),
    githubUrl: z.string().optional().or(z.literal('')),
    portfolios: z.array(z.object({
        url: z.string().url("Must be a valid URL").or(z.literal('')),
        title: z.string().optional(),
        description: z.string().optional(),
        image: z.string().optional(),
    })).optional()
});

type TalentFormValues = z.infer<typeof talentSchema>;

interface TalentProfileFormProps {
    initialData?: Partial<TalentProfile> | null;
}

const PRIMARY_AREAS: Record<string, string> = {
    'frontend': 'Frontend Development',
    'backend': 'Backend Development',
    'fullstack': 'Fullstack Development',
    'design': 'UI/UX Design',
    'pm': 'Product Management',
    'data': 'Data Science / ML',
};

const PROVINCES = [
    "Anhui", "Beijing", "Chongqing", "Fujian", "Gansu", "Guangdong", "Guangxi", "Guizhou", "Hainan", "Hebei", "Heilongjiang", "Henan", "Hong Kong", "Hubei", "Hunan", "Inner Mongolia", "Jiangsu", "Jiangxi", "Jilin", "Liaoning", "Macau", "Ningxia", "Qinghai", "Shaanxi", "Shandong", "Shanghai", "Shanxi", "Sichuan", "Taiwan", "Tianjin", "Tibet", "Xinjiang", "Yunnan"
];

// Inline Timeslot Selector
function TimeslotSelector({ value, onChange }: { value: any, onChange: (v: any) => void }) {
    const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const BLOCKS = [
        { id: 'morning', label: '9am - 12pm' },
        { id: 'afternoon', label: '12pm - 5pm' },
        { id: 'evening', label: '5pm - 9pm' },
        { id: 'night', label: '9pm - 12am' }
    ];

    const toggleSlot = (day: string, blockId: string) => {
        const current = value || {};
        const daySlots = current[day] || [];
        const newDaySlots = daySlots.includes(blockId)
            ? daySlots.filter((id: string) => id !== blockId)
            : [...daySlots, blockId];
        onChange({ ...current, [day]: newDaySlots });
    };

    return (
        <div className="border rounded-md overflow-x-auto">
            <table className="w-full text-sm text-center min-w-[500px] table-fixed">
                <thead>
                    <tr className="bg-muted text-muted-foreground">
                        <th className="p-3 border-b border-r font-medium w-32 text-center">Time</th>
                        {DAYS.map(day => <th key={day} className="p-3 border-b font-medium">{day}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {BLOCKS.map((block, i) => (
                        <tr key={block.id} className={i !== BLOCKS.length - 1 ? "border-b" : ""}>
                            <td className="p-3 border-r text-muted-foreground font-medium text-xs text-center">{block.label}</td>
                            {DAYS.map(day => {
                                const isSelected = (value?.[day] || []).includes(block.id);
                                return (
                                    <td
                                        key={day}
                                        className={`p-2 cursor-pointer transition-colors ${isSelected ? 'bg-primary/20' : 'hover:bg-muted/30'}`}
                                        onClick={() => toggleSlot(day, block.id)}
                                    >
                                        <div className={`h-8 w-full flex items-center justify-center rounded-sm ${isSelected ? 'bg-primary' : 'bg-transparent border border-muted-foreground/30'}`} />
                                    </td>
                                )
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

// Portfolio Card display
function PortfolioCard({ p }: { p: any }) {
    return (
        <a href={p.url} target="_blank" rel="noopener noreferrer" className="block w-full border rounded-lg overflow-hidden hover:border-primary transition group relative bg-card h-full flex flex-col">
            {p.image ? (
                <div className="w-full h-32 bg-muted relative shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.image} alt={p.title || 'Portfolio'} className="object-cover w-full h-full" />
                </div>
            ) : (
                <div className="w-full h-32 bg-muted/50 flex items-center justify-center shrink-0">
                    <Globe className="h-8 w-8 text-muted-foreground/50" />
                </div>
            )}
            <div className="p-3 flex-1 flex flex-col">
                <h4 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">{p.title || p.url}</h4>
                {p.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.description}</p>}
                <div className="mt-auto pt-3 flex items-center gap-1 text-xs font-medium text-primary">
                    <ExternalLink className="h-3 w-3 shrink-0" />
                    <span className="truncate">{p.url.replace(/^https?:\/\//, '')}</span>
                </div>
            </div>
        </a>
    )
}

export function TalentProfileForm({ initialData }: TalentProfileFormProps) {
    const hasData = !!initialData?.displayName;
    const [isEditing, setIsEditing] = useState(!hasData);
    const [isSaving, setIsSaving] = useState(false);

    // URL Helpers
    const cleanLinkedin = (url?: string | null) => {
        if (!url) return '';
        let cleaned = url.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//i, '');
        cleaned = cleaned.replace(/^linkedin\.com\/in\//i, '');
        return cleaned;
    };

    const buildLinkedin = (username?: string) => {
        if (!username) return '';
        if (username.startsWith('http') || username.startsWith('linkedin.com')) return username;
        return `https://linkedin.com/in/${username}`;
    };

    const cleanGithub = (url?: string | null) => {
        if (!url) return '';
        let cleaned = url.replace(/^https?:\/\/(www\.)?github\.com\//i, '');
        cleaned = cleaned.replace(/^github\.com\//i, '');
        return cleaned;
    };

    const buildGithub = (username?: string) => {
        if (!username) return '';
        if (username.startsWith('http') || username.startsWith('github.com')) return username;
        return `https://github.com/${username}`;
    };

    const form = useForm<TalentFormValues>({
        resolver: zodResolver(talentSchema) as any,
        defaultValues: {
            displayName: initialData?.displayName || '',
            headline: initialData?.headline || '',
            yearsOfExp: initialData?.yearsOfExp || 0,
            languages: initialData?.languages || ['ENG'],
            location: initialData?.location || '',
            timezone: initialData?.timezone || '',
            availableTimeslots: initialData?.availableTimeslots || {},
            primaryArea: initialData?.primaryArea || '',
            otherSkills: initialData?.otherSkills?.join(', ') || '',
            desiredHourlyRate: initialData?.desiredHourlyRate ?? undefined,
            availabilityState: initialData?.availabilityState || AvailabilityStatus.open_to_hire,
            websiteUrl: initialData?.websiteUrl || '',
            linkedinUrl: cleanLinkedin(initialData?.linkedinUrl),
            githubUrl: cleanGithub(initialData?.githubUrl),
            portfolios: (Array.isArray(initialData?.portfolios) ? initialData.portfolios : []) as any
        },
    });

    const { isDirty } = form.formState;

    const { fields: portfolios, append: appendPortfolio, remove: removePortfolio, update: updatePortfolio } = useFieldArray({
        control: form.control,
        name: "portfolios"
    });

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        if (isEditing && isDirty) {
            window.addEventListener('beforeunload', handleBeforeUnload);
        }

        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isEditing, isDirty]);

    const onSubmit = async (data: TalentFormValues) => {
        setIsSaving(true);
        try {
            const skillArray = data.otherSkills
                ? data.otherSkills.split(',').map(s => s.trim()).filter(Boolean)
                : [];

            // Clean empty portfolios
            const validPortfolios = (data.portfolios || []).filter(p => p.url && p.url.trim() !== '');

            await updateTalentProfile({
                ...data,
                linkedinUrl: buildLinkedin(data.linkedinUrl),
                githubUrl: buildGithub(data.githubUrl),
                otherSkills: skillArray,
                portfolios: validPortfolios
            });
            toast.success('Talent profile updated successfully');
            setIsEditing(false);

            // Re-sync form state to prevent dirty prompt
            form.reset({
                ...data,
                portfolios: validPortfolios
            });
        } catch (error) {
            console.error(error);
            toast.error('Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        form.reset();
        if (hasData) setIsEditing(false);
    };

    const handleFetchOg = async (index: number) => {
        const url = form.getValues(`portfolios.${index}.url`);
        if (!url || !url.startsWith('http')) {
            toast.error('Please enter a valid URL (http:// or https://)');
            return;
        }
        const toastId = toast.loading('Fetching details...');
        try {
            const res = await fetch(`/api/og?url=${encodeURIComponent(url)}`);
            if (!res.ok) throw new Error('Failed');
            const data = await res.json();
            const current = form.getValues(`portfolios.${index}`);
            if (!current) return;
            updatePortfolio(index, {
                ...current,
                url: current.url || url,
                title: data.title || current.title || '',
                description: data.description || current.description || '',
                image: data.image || current.image || '',
            });
            toast.success('Details fetched', { id: toastId });
        } catch (err) {
            toast.error('Failed to fetch details', { id: toastId });
        }
    };

    const ViewFieldColumn = ({ label, value, isLink }: { label: string, value?: string | null, isLink?: boolean }) => (
        <div className="space-y-1">
            <h4 className="text-sm font-medium leading-none text-muted-foreground">{label}</h4>
            {isLink && value ? (
                <a href={value.startsWith('http') ? value : `https://${value}`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium leading-none text-primary hover:underline block break-all">
                    {value.replace(/^https?:\/\//, '')}
                </a>
            ) : (
                <p className="text-sm font-medium leading-none">{value || '-'}</p>
            )}
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="bg-card text-card-foreground rounded-xl border shadow-sm">
                <div className="p-6 sm:p-10">
                    {!isEditing ? (
                        <>
                            {/* View Mode */}
                            <div className="flex flex-col sm:flex-row gap-6 justify-between items-start">
                                <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start w-full">
                                    <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-3xl shrink-0">
                                        {initialData?.displayName?.charAt(0)?.toUpperCase() || 'T'}
                                    </div>
                                    <div className="text-center sm:text-left space-y-2 flex-1">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between w-full">
                                            <h1 className="text-2xl sm:text-3xl font-bold">{initialData?.displayName || 'Unnamed Talent'}</h1>
                                            {initialData?.availabilityState && (
                                                <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                                                    {formatEnum(initialData.availabilityState)}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-muted-foreground text-lg">
                                            {initialData?.headline || 'Headline not set'} {initialData?.location && `• ${initialData.location}, China`}
                                        </p>
                                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2">
                                            {initialData?.websiteUrl && (
                                                <a href={initialData.websiteUrl.startsWith('http') ? initialData.websiteUrl : `https://${initialData.websiteUrl}`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline flex items-center gap-1.5">
                                                    <Globe className="w-4 h-4" /> Website
                                                </a>
                                            )}
                                            {initialData?.linkedinUrl && (
                                                <a href={initialData.linkedinUrl.startsWith('http') ? initialData.linkedinUrl : `https://${initialData.linkedinUrl}`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline flex items-center gap-1.5">
                                                    <Linkedin className="w-4 h-4" /> LinkedIn
                                                </a>
                                            )}
                                            {initialData?.githubUrl && (
                                                <a href={initialData.githubUrl.startsWith('http') ? initialData.githubUrl : `https://${initialData.githubUrl}`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline flex items-center gap-1.5">
                                                    <Github className="w-4 h-4" /> GitHub
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <Button onClick={() => setIsEditing(true)} className="shrink-0 mt-4 sm:mt-0 w-full sm:w-auto">
                                    Edit Profile
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-10 pt-8 border-t">
                                <ViewFieldColumn label="Primary Area" value={initialData?.primaryArea ? PRIMARY_AREAS[initialData.primaryArea] || initialData.primaryArea : undefined} />
                                <ViewFieldColumn label="Years of Exp" value={initialData?.yearsOfExp?.toString()} />
                                <ViewFieldColumn label="Hourly Rate" value={initialData?.desiredHourlyRate ? `$${initialData.desiredHourlyRate}/hr` : null} />
                                <ViewFieldColumn label="Languages" value={initialData?.languages?.join(', ')} />
                            </div>

                            {initialData?.otherSkills?.length ? (
                                <div className="mt-8">
                                    <h4 className="text-sm font-medium leading-none text-muted-foreground mb-3">Other Skills</h4>
                                    <div className="flex gap-2 flex-wrap">
                                        {initialData.otherSkills.map((skill: string) => (
                                            <span key={skill} className="px-2.5 py-1 bg-muted/50 border text-xs rounded-md">{skill}</span>
                                        ))}
                                    </div>
                                </div>
                            ) : null}

                            {/* Portfolios Section */}
                            {(initialData?.portfolios as any[])?.length > 0 && (
                                <div className="mt-10 pt-8 border-t">
                                    <h3 className="text-lg font-semibold mb-4">Portfolios & Case Studies</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {(initialData?.portfolios as any[]).map((p, i) => (
                                            <PortfolioCard key={i} p={p} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <form onSubmit={form.handleSubmit(onSubmit as any)}>
                            {/* Header Actions */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                <div>
                                    <h2 className="text-xl font-semibold mb-1">Talent profile</h2>
                                    <p className="text-sm text-muted-foreground">Update your details and portfolio here.</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    {hasData && (
                                        <Button variant="outline" type="button" onClick={handleCancel} disabled={isSaving}>
                                            Cancel
                                        </Button>
                                    )}
                                    <Button type="submit" disabled={!isDirty || isSaving}>
                                        {isSaving ? 'Saving...' : 'Save changes'}
                                    </Button>
                                </div>
                            </div>

                            <div className="divide-y relative border-t">
                                {/* Public Profile */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6 border-t border-transparent">
                                    <div className="md:col-span-1">
                                        <h3 className="text-sm font-medium">Public profile</h3>
                                        <p className="text-sm text-muted-foreground">This will be displayed on your profile card.</p>
                                    </div>
                                    <div className="md:col-span-2 w-full">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="displayName">Display Name</Label>
                                                <Input id="displayName" placeholder="Name" {...form.register('displayName')} />
                                                {form.formState.errors.displayName && (
                                                    <p className="text-sm text-destructive">{form.formState.errors.displayName.message}</p>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="headline">Headline</Label>
                                                <Input id="headline" placeholder="e.g. Senior Backend Engineer" {...form.register('headline')} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Skills */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6">
                                    <div className="md:col-span-1">
                                        <h3 className="text-sm font-medium">Skills & Expertise</h3>
                                        <p className="text-sm text-muted-foreground">What you excel at.</p>
                                    </div>
                                    <div className="md:col-span-2 w-full space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="primaryArea">Primary Area</Label>
                                                <Select
                                                    onValueChange={(value) => form.setValue('primaryArea', value, { shouldDirty: true })}
                                                    defaultValue={form.getValues('primaryArea') || undefined}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select primary area" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectGroup>
                                                            {Object.entries(PRIMARY_AREAS).map(([value, label]) => (
                                                                <SelectItem key={value} value={value}>{label}</SelectItem>
                                                            ))}
                                                        </SelectGroup>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="yearsOfExp">Years of Experience</Label>
                                                <Input id="yearsOfExp" type="number" min="0" {...form.register('yearsOfExp')} />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="otherSkills">Other Skills (comma separated)</Label>
                                            <Input id="otherSkills" placeholder="React, Node.js, AWS..." {...form.register('otherSkills')} />
                                        </div>
                                        <div className="space-y-2 pt-2">
                                            <Label>Languages</Label>
                                            <div className="flex gap-6 mt-2">
                                                <div className="flex items-center space-x-2 bg-muted/40 px-3 py-2 rounded-lg border">
                                                    <Checkbox
                                                        id="lang-eng"
                                                        checked={(form.watch('languages') || []).includes('ENG')}
                                                        onCheckedChange={(checked: boolean | string) => {
                                                            const current = form.getValues('languages');
                                                            if (checked) form.setValue('languages', Array.from(new Set([...current, 'ENG'])), { shouldDirty: true });
                                                            else form.setValue('languages', current.filter(l => l !== 'ENG'), { shouldDirty: true });
                                                        }}
                                                    />
                                                    <Label htmlFor="lang-eng" className="font-medium cursor-pointer">English</Label>
                                                </div>
                                                <div className="flex items-center space-x-2 bg-muted/40 px-3 py-2 rounded-lg border">
                                                    <Checkbox
                                                        id="lang-cn"
                                                        checked={(form.watch('languages') || []).includes('CN')}
                                                        onCheckedChange={(checked: boolean | string) => {
                                                            const current = form.getValues('languages');
                                                            if (checked) form.setValue('languages', Array.from(new Set([...current, 'CN'])), { shouldDirty: true });
                                                            else form.setValue('languages', current.filter(l => l !== 'CN'), { shouldDirty: true });
                                                        }}
                                                    />
                                                    <Label htmlFor="lang-cn" className="font-medium cursor-pointer">Chinese (CN)</Label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Location & Availability */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6">
                                    <div className="md:col-span-1">
                                        <h3 className="text-sm font-medium">Location & Availability</h3>
                                        <p className="text-sm text-muted-foreground">Manage your working hours and rate.</p>
                                    </div>
                                    <div className="md:col-span-2 w-full space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="location">Location (Province)</Label>
                                                <Select
                                                    onValueChange={(value) => form.setValue('location', value, { shouldDirty: true })}
                                                    defaultValue={form.getValues('location') || undefined}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select province" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectGroup>
                                                            {PROVINCES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                                        </SelectGroup>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="timezone">Timezone</Label>
                                                <Select
                                                    onValueChange={(value) => form.setValue('timezone', value, { shouldDirty: true })}
                                                    defaultValue={form.getValues('timezone') || undefined}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select timezone" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectGroup>
                                                            <SelectItem value="Beijing Time (UTC+8)">Beijing Time (UTC+8)</SelectItem>
                                                        </SelectGroup>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="desiredHourlyRate">Desired Hourly Rate ($)</Label>
                                                <Input id="desiredHourlyRate" type="number" min="0" placeholder="e.g. 50" {...form.register('desiredHourlyRate')} />
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <Label htmlFor="availabilityState">Availability Status</Label>
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                                                            </TooltipTrigger>
                                                            <TooltipContent side="top" className="max-w-[250px]">
                                                                <p className="text-sm">When successfully matched through &quot;Open to Hire&quot;, PivotHire collects a standard headhunting fee from the employer upon you joining their company.</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </div>
                                                <Select
                                                    onValueChange={(value) => form.setValue('availabilityState', value as AvailabilityStatus, { shouldDirty: true })}
                                                    defaultValue={form.getValues('availabilityState')}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select status" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectGroup>
                                                            {Object.values(AvailabilityStatus).map((status) => (
                                                                <SelectItem key={status} value={status}>
                                                                    {formatEnum(status)}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectGroup>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="space-y-3 pt-4">
                                            <div>
                                                <Label>Available Timeslots</Label>
                                                <p className="text-xs text-muted-foreground mb-2 mt-1">Select the blocks where you are generally available based on your local timezone.</p>
                                            </div>
                                            <TimeslotSelector
                                                value={form.watch('availableTimeslots')}
                                                onChange={(val) => form.setValue('availableTimeslots', val, { shouldDirty: true })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Social Links */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6">
                                    <div className="md:col-span-1">
                                        <h3 className="text-sm font-medium">Social Links</h3>
                                        <p className="text-sm text-muted-foreground">Links to your professional profiles.</p>
                                    </div>
                                    <div className="md:col-span-2 w-full">
                                        <div className="grid grid-cols-1 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="websiteUrl" className="sr-only">Website</Label>
                                                <div className="flex rounded-md shadow-sm">
                                                    <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground whitespace-nowrap">
                                                        https://
                                                    </span>
                                                    <Input id="websiteUrl" className="rounded-l-none" placeholder="www.example.com" {...form.register('websiteUrl')} />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="linkedinUrl" className="sr-only">LinkedIn</Label>
                                                <div className="flex rounded-md shadow-sm">
                                                    <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground whitespace-nowrap">
                                                        linkedin.com/in/
                                                    </span>
                                                    <Input id="linkedinUrl" className="rounded-l-none" placeholder="username" {...form.register('linkedinUrl')} />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="githubUrl" className="sr-only">GitHub</Label>
                                                <div className="flex rounded-md shadow-sm">
                                                    <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground whitespace-nowrap">
                                                        github.com/
                                                    </span>
                                                    <Input id="githubUrl" className="rounded-l-none" placeholder="username" {...form.register('githubUrl')} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Portfolios */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6 mb-4">
                                    <div className="md:col-span-1">
                                        <h3 className="text-sm font-medium">Portfolios</h3>
                                        <p className="text-sm text-muted-foreground">Add links to your past projects and case studies.</p>
                                    </div>
                                    <div className="md:col-span-2 w-full space-y-4">
                                        {portfolios.map((field, index) => (
                                            <div key={field.id} className="p-4 border rounded-md space-y-3 relative bg-muted/20">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute top-2 right-2 text-muted-foreground hover:text-destructive h-8 w-8"
                                                    onClick={() => removePortfolio(index)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>

                                                <div className="space-y-2 pr-10">
                                                    <Label>Portfolio URL</Label>
                                                    <div className="flex gap-2">
                                                        <Input
                                                            placeholder="https://..."
                                                            {...form.register(`portfolios.${index}.url`)}
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="secondary"
                                                            onClick={() => handleFetchOg(index)}
                                                            className="shrink-0"
                                                        >
                                                            Fetch Data
                                                        </Button>
                                                    </div>
                                                    {form.formState.errors.portfolios?.[index]?.url && (
                                                        <p className="text-xs text-destructive">{form.formState.errors.portfolios[index]?.url?.message}</p>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label>Title</Label>
                                                        <Input placeholder="Project Title" {...form.register(`portfolios.${index}.title`)} />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Description</Label>
                                                        <Input placeholder="Short description" {...form.register(`portfolios.${index}.description`)} />
                                                    </div>
                                                </div>
                                                <div className="space-y-2 hidden">
                                                    <Input type="hidden" {...form.register(`portfolios.${index}.image`)} />
                                                </div>

                                                {form.watch(`portfolios.${index}.image`) && (
                                                    <div className="mt-2 h-24 w-32 relative bg-muted rounded overflow-hidden border">
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img src={form.watch(`portfolios.${index}.image`)} alt="preview" className="object-cover w-full h-full" />
                                                    </div>
                                                )}
                                            </div>
                                        ))}

                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full border-dashed py-8 mt-2"
                                            onClick={() => appendPortfolio({ url: '', title: '', description: '', image: '' })}
                                        >
                                            <Plus className="mr-2 h-4 w-4" /> Add Project Link
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
