'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { BusinessProfile, FundingStatus, TeamSize } from '@prisma/client';
import { updateBusinessProfile } from '@/app/actions/profile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { formatEnum } from '@/lib/formatters';
import { Globe, Linkedin } from 'lucide-react';
import { ImageUpload } from '@/components/ui/image-upload';

const businessSchema = z.object({
    contactName: z.string().min(2, { message: "Contact name must be at least 2 characters." }),
    jobTitle: z.string().min(2, { message: "Job title must be at least 2 characters." }),
    companyName: z.string().min(2, { message: "Company name must be at least 2 characters." }),
    website: z.string().optional().or(z.literal('')), // Removed strict .url() to allow easier prefixing
    linkedin: z.string().optional().or(z.literal('')), // Removed strict .url()
    industry: z.string().optional(),
    logoUrl: z.string().optional(),
    fundingStatus: z.nativeEnum(FundingStatus).optional(),
    teamSize: z.nativeEnum(TeamSize).optional(),
    location: z.string().optional(),
    timezone: z.string().optional(),
});

type BusinessFormValues = z.infer<typeof businessSchema>;

interface BusinessProfileFormProps {
    initialData?: Partial<BusinessProfile> | null;
}

export function BusinessProfileForm({ initialData }: BusinessProfileFormProps) {
    const hasData = !!initialData?.companyName;
    const [isEditing, setIsEditing] = useState(!hasData);
    const [isSaving, setIsSaving] = useState(false);

    // Helpers to strip/add LinkedIn prefix
    const cleanLinkedin = (url?: string | null) => {
        if (!url) return '';
        let cleaned = url.replace(/^https?:\/\/(www\.)?linkedin\.com\/company\//i, '');
        cleaned = cleaned.replace(/^linkedin\.com\/company\//i, '');
        // Also clean /in/ just in case legacy data has it
        cleaned = cleaned.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//i, '');
        cleaned = cleaned.replace(/^linkedin\.com\/in\//i, '');
        return cleaned;
    };

    const buildLinkedin = (username?: string) => {
        if (!username) return '';
        if (username.startsWith('http') || username.startsWith('linkedin.com')) return username;
        return `https://linkedin.com/company/${username}`;
    };

    const form = useForm({
        resolver: zodResolver(businessSchema),
        defaultValues: {
            contactName: initialData?.contactName || '',
            jobTitle: initialData?.jobTitle || '',
            companyName: initialData?.companyName || '',
            website: initialData?.website || '',
            linkedin: cleanLinkedin(initialData?.linkedin),
            industry: initialData?.industry || '',
            logoUrl: initialData?.logoUrl || '',
            fundingStatus: initialData?.fundingStatus || undefined,
            teamSize: initialData?.teamSize || undefined,
            location: initialData?.location || '',
            timezone: initialData?.timezone || '',
        },
    });

    const { isDirty } = form.formState;

    // Protect against unsaved changes
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = ''; // Required for Chrome
            }
        };

        if (isEditing && isDirty) {
            window.addEventListener('beforeunload', handleBeforeUnload);
        }

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [isEditing, isDirty]);

    const onSubmit = async (data: BusinessFormValues) => {
        setIsSaving(true);
        try {
            // Re-apply full URL for linkedin
            const payload = {
                ...data,
                linkedin: buildLinkedin(data.linkedin),
            };

            await updateBusinessProfile(payload);
            toast.success('Business profile updated successfully');
            setIsEditing(false);
            form.reset(data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        form.reset();
        if (hasData) {
            setIsEditing(false);
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
                            <div className="flex flex-col sm:flex-row gap-6 justify-between items-start">
                                <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                                    {initialData?.logoUrl ? (
                                        <div className="h-24 w-24 rounded-full overflow-hidden shrink-0 border-2 border-border shadow-sm">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={initialData.logoUrl} alt={`${initialData.companyName} logo`} className="w-full h-full object-cover" />
                                        </div>
                                    ) : (
                                        <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-3xl shrink-0">
                                            {initialData?.companyName?.charAt(0)?.toUpperCase() || 'C'}
                                        </div>
                                    )}
                                    <div className="text-center sm:text-left space-y-2">
                                        <h1 className="text-2xl sm:text-3xl font-bold">{initialData?.companyName}</h1>
                                        <p className="text-muted-foreground text-lg">
                                            {initialData?.industry || 'Industry not set'} {initialData?.location && `• ${initialData.location}`}
                                        </p>
                                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2">
                                            {initialData?.website && (
                                                <a href={initialData.website.startsWith('http') ? initialData.website : `https://${initialData.website}`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline flex items-center gap-1.5">
                                                    <Globe className="w-4 h-4" /> {initialData.website.replace(/^https?:\/\//, '')}
                                                </a>
                                            )}
                                            {initialData?.linkedin && (
                                                <a href={initialData.linkedin.startsWith('http') ? initialData.linkedin : `https://${initialData.linkedin}`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline flex items-center gap-1.5">
                                                    <Linkedin className="w-4 h-4" /> LinkedIn
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <Button onClick={() => setIsEditing(true)} className="shrink-0 mt-4 sm:mt-0 w-full sm:w-auto">
                                    Edit Profile
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-10 pt-8 border-t">
                                <ViewFieldColumn label="Contact Person" value={initialData?.contactName ? `${initialData.contactName}${initialData.jobTitle ? ` (${initialData.jobTitle})` : ''}` : null} />
                                <ViewFieldColumn label="Funding Status" value={initialData?.fundingStatus ? formatEnum(initialData.fundingStatus) : undefined} />
                                <ViewFieldColumn label="Team Size" value={initialData?.teamSize ? formatEnum(initialData.teamSize) : undefined} />
                            </div>
                        </>
                    ) : (
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                <div>
                                    <h2 className="text-xl font-semibold mb-1">Company profile</h2>
                                    <p className="text-sm text-muted-foreground">Update your company photo and details here.</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button variant="outline" type="button" onClick={handleCancel} disabled={isSaving}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={!isDirty || isSaving}>
                                        {isSaving ? 'Saving...' : 'Save changes'}
                                    </Button>
                                </div>
                            </div>

                            <div className="border-t mb-0"></div>

                            <div className="divide-y relative">
                                {/* Public Profile */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6 border-t border-transparent">
                                    <div className="md:col-span-1">
                                        <h3 className="text-sm font-medium">Public profile</h3>
                                        <p className="text-sm text-muted-foreground">This will be displayed on your profile.</p>
                                    </div>
                                    <div className="md:col-span-2 w-full">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="companyName" className="sr-only">Company Name</Label>
                                                <Input id="companyName" placeholder="Company Name" {...form.register('companyName')} />
                                                {form.formState.errors.companyName && (
                                                    <p className="text-sm text-destructive">{form.formState.errors.companyName.message}</p>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="website" className="sr-only">Website</Label>
                                                <div className="flex rounded-md shadow-sm">
                                                    <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground whitespace-nowrap min-w-[120px]">
                                                        <Globe className="w-4 h-4 mr-2" /> Website
                                                    </span>
                                                    <Input id="website" className="rounded-l-none" placeholder="www.example.com" {...form.register('website')} />
                                                </div>
                                                {form.formState.errors.website && (
                                                    <p className="text-sm text-destructive">{form.formState.errors.website.message}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Company Logo */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6">
                                    <div className="md:col-span-1">
                                        <h3 className="text-sm font-medium">Company logo</h3>
                                        <p className="text-sm text-muted-foreground">Update your company logo to display on your profile.</p>
                                    </div>
                                    <div className="md:col-span-2 w-full flex items-center">
                                        <ImageUpload
                                            value={form.watch('logoUrl')}
                                            onChange={(url) => form.setValue('logoUrl', url, { shouldDirty: true })}
                                        />
                                    </div>
                                </div>

                                {/* Contact Information */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6">
                                    <div className="md:col-span-1">
                                        <h3 className="text-sm font-medium">Contact Information</h3>
                                        <p className="text-sm text-muted-foreground">Your personal contact details for notifications.</p>
                                    </div>
                                    <div className="md:col-span-2 w-full">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="contactName">Contact Name</Label>
                                                <Input id="contactName" placeholder="Full Name" {...form.register('contactName')} />
                                                {form.formState.errors.contactName && (
                                                    <p className="text-sm text-destructive">{form.formState.errors.contactName.message}</p>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="jobTitle">Job Title</Label>
                                                <Input id="jobTitle" placeholder="Job Title" {...form.register('jobTitle')} />
                                                {form.formState.errors.jobTitle && (
                                                    <p className="text-sm text-destructive">{form.formState.errors.jobTitle.message}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Company Details */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6">
                                    <div className="md:col-span-1">
                                        <h3 className="text-sm font-medium">Company details</h3>
                                        <p className="text-sm text-muted-foreground">Additional information about your company.</p>
                                    </div>
                                    <div className="md:col-span-2 w-full">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="industry">Industry</Label>
                                                <Input id="industry" placeholder="Industry" {...form.register('industry')} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="location">Location</Label>
                                                <Input id="location" placeholder="Location" {...form.register('location')} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="fundingStatus">Funding Status</Label>
                                                <Select
                                                    onValueChange={(value) => form.setValue('fundingStatus', value as FundingStatus)}
                                                    defaultValue={form.getValues('fundingStatus')}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select status" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectGroup>
                                                            {Object.values(FundingStatus).map((status) => (
                                                                <SelectItem key={status} value={status}>
                                                                    {formatEnum(status)}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectGroup>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="teamSize">Team Size</Label>
                                                <Select
                                                    onValueChange={(value) => form.setValue('teamSize', value as TeamSize)}
                                                    defaultValue={form.getValues('teamSize')}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select size" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectGroup>
                                                            {Object.values(TeamSize).map((size) => (
                                                                <SelectItem key={size} value={size}>
                                                                    {formatEnum(size)}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectGroup>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Social Profiles */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6 border-b">
                                    <div className="md:col-span-1">
                                        <h3 className="text-sm font-medium">Social profiles</h3>
                                        <p className="text-sm text-muted-foreground">Add your social links.</p>
                                    </div>
                                    <div className="md:col-span-2 w-full">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="linkedin" className="sr-only">LinkedIn</Label>
                                                <div className="flex rounded-md shadow-sm">
                                                    <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground whitespace-nowrap min-w-[120px]">
                                                        <Linkedin className="w-4 h-4 mr-2" /> LinkedIn
                                                    </span>
                                                    <Input id="linkedin" className="rounded-l-none" placeholder="company_username" {...form.register('linkedin')} />
                                                </div>
                                                {form.formState.errors.linkedin && (
                                                    <p className="text-sm text-destructive">{form.formState.errors.linkedin.message}</p>
                                                )}
                                            </div>
                                        </div>
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
