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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const businessSchema = z.object({
    contactName: z.string().min(2, { message: "Contact name must be at least 2 characters." }),
    jobTitle: z.string().min(2, { message: "Job title must be at least 2 characters." }),
    companyName: z.string().min(2, { message: "Company name must be at least 2 characters." }),
    website: z.string().url().optional().or(z.literal('')),
    linkedin: z.string().url().optional().or(z.literal('')),
    industry: z.string().optional(),
    fundingStatus: z.nativeEnum(FundingStatus).optional(),
    teamSize: z.nativeEnum(TeamSize).optional(),
    location: z.string().optional(),
    timezone: z.string().optional(),
});

type BusinessFormValues = z.infer<typeof businessSchema>;

interface BusinessProfileFormProps {
    initialData?: Partial<BusinessProfile> | null;
}

import { formatEnum } from '@/lib/formatters';

export function BusinessProfileForm({ initialData }: BusinessProfileFormProps) {
    const hasData = !!initialData?.companyName;
    const [isEditing, setIsEditing] = useState(!hasData);
    const [isSaving, setIsSaving] = useState(false);

    const form = useForm({
        resolver: zodResolver(businessSchema),
        defaultValues: {
            contactName: initialData?.contactName || '',
            jobTitle: initialData?.jobTitle || '',
            companyName: initialData?.companyName || '',
            website: initialData?.website || '',
            linkedin: initialData?.linkedin || '',
            industry: initialData?.industry || '',
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
            await updateBusinessProfile(data);
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
        setIsEditing(false);
    };

    // View Mode Component
    const ViewField = ({ label, value }: { label: string, value?: string | null }) => (
        <div className="space-y-1">
            <h4 className="text-sm font-medium leading-none text-muted-foreground">{label}</h4>
            <p className="text-sm font-medium leading-none">{value || 'N/A'}</p>
        </div>
    );

    return (
        <Card className="w-full relative">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
                <div className="space-y-1.5">
                    <CardTitle>Business Profile</CardTitle>
                    <CardDescription>Manage your company details and contact information.</CardDescription>
                </div>
                {!isEditing && hasData && (
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                        Edit Profile
                    </Button>
                )}
            </CardHeader>

            {isEditing ? (
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="contactName">Contact Name</Label>
                                <Input id="contactName" {...form.register('contactName')} />
                                {form.formState.errors.contactName && (
                                    <p className="text-sm text-destructive">{form.formState.errors.contactName.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="jobTitle">Job Title</Label>
                                <Input id="jobTitle" {...form.register('jobTitle')} />
                                {form.formState.errors.jobTitle && (
                                    <p className="text-sm text-destructive">{form.formState.errors.jobTitle.message}</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="companyName">Company Name</Label>
                            <Input id="companyName" {...form.register('companyName')} />
                            {form.formState.errors.companyName && (
                                <p className="text-sm text-destructive">{form.formState.errors.companyName.message}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="industry">Industry</Label>
                                <Input id="industry" {...form.register('industry')} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="location">Location</Label>
                                <Input id="location" {...form.register('location')} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="website">Website</Label>
                                <Input id="website" placeholder="https://" {...form.register('website')} />
                                {form.formState.errors.website && (
                                    <p className="text-sm text-destructive">{form.formState.errors.website.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="linkedin">LinkedIn</Label>
                                <Input id="linkedin" placeholder="https://" {...form.register('linkedin')} />
                                {form.formState.errors.linkedin && (
                                    <p className="text-sm text-destructive">{form.formState.errors.linkedin.message}</p>
                                )}
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
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                        {hasData && (
                            <Button type="button" variant="ghost" onClick={handleCancel} disabled={isSaving}>
                                Cancel
                            </Button>
                        )}
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </CardFooter>
                </form>
            ) : (
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ViewField label="Contact Name" value={initialData?.contactName} />
                        <ViewField label="Job Title" value={initialData?.jobTitle} />
                    </div>
                    <ViewField label="Company Name" value={initialData?.companyName} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ViewField label="Industry" value={initialData?.industry} />
                        <ViewField label="Location" value={initialData?.location} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ViewField label="Website" value={initialData?.website} />
                        <ViewField label="LinkedIn" value={initialData?.linkedin} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ViewField label="Funding Status" value={initialData?.fundingStatus ? formatEnum(initialData.fundingStatus) : undefined} />
                        <ViewField label="Team Size" value={initialData?.teamSize ? formatEnum(initialData.teamSize) : undefined} />
                    </div>
                </CardContent>
            )}
        </Card>
    );
}
