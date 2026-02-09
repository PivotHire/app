'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { TalentProfile, EnglishProficiency, AvailabilityStatus } from '@prisma/client';
import { updateTalentProfile } from '@/app/actions/profile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const talentSchema = z.object({
    displayName: z.string().min(2, "Display name is required"),
    headline: z.string().optional(),
    yearsOfExp: z.coerce.number().min(0).optional(),
    english: z.nativeEnum(EnglishProficiency).optional(),
    location: z.string().optional(),
    timezone: z.string().optional(),
    primarySkills: z.string().optional(), // We'll handle as comma-separated string for now
    portfolioUrl: z.string().url().optional().or(z.literal('')),
    linkedinUrl: z.string().url().optional().or(z.literal('')),
    desiredHourlyRate: z.coerce.number().min(0).optional(),
    availabilityHrs: z.coerce.number().min(0).optional(),
    availabilityState: z.nativeEnum(AvailabilityStatus).optional(),
});

type TalentFormValues = z.infer<typeof talentSchema>;

interface TalentProfileFormProps {
    initialData?: Partial<TalentProfile> | null;
}

import { formatEnum } from '@/lib/formatters';

export function TalentProfileForm({ initialData }: TalentProfileFormProps) {
    const hasData = !!initialData?.displayName;
    const [isEditing, setIsEditing] = useState(!hasData);
    const [isSaving, setIsSaving] = useState(false);

    const form = useForm({
        resolver: zodResolver(talentSchema),
        defaultValues: {
            displayName: initialData?.displayName || '',
            headline: initialData?.headline || '',
            yearsOfExp: initialData?.yearsOfExp || 0,
            english: initialData?.english || EnglishProficiency.conversational,
            location: initialData?.location || '',
            timezone: initialData?.timezone || '',
            primarySkills: initialData?.primarySkills?.join(', ') || '',
            portfolioUrl: initialData?.portfolioUrl || '',
            linkedinUrl: initialData?.linkedinUrl || '',
            desiredHourlyRate: initialData?.desiredHourlyRate ?? undefined,
            availabilityHrs: initialData?.availabilityHrs ?? undefined,
            availabilityState: initialData?.availabilityState || AvailabilityStatus.actively_looking,
        },
    });

    const { isDirty } = form.formState;

    // Protect against unsaved changes
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

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [isEditing, isDirty]);

    const onSubmit = async (data: TalentFormValues) => {
        setIsSaving(true);
        try {
            // Convert comma-separated skills back to array
            const skillArray = data.primarySkills
                ? data.primarySkills.split(',').map(s => s.trim()).filter(Boolean)
                : [];

            await updateTalentProfile({
                ...data,
                primarySkills: skillArray,
            });
            toast.success('Talent profile updated successfully');
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
    const ViewField = ({ label, value }: { label: string, value?: string | number | null }) => (
        <div className="space-y-1">
            <h4 className="text-sm font-medium leading-none text-muted-foreground">{label}</h4>
            <p className="text-sm font-medium leading-none">{
                value || 'N/A'
            }</p>
        </div>
    );

    return (
        <Card className="w-full relative">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
                <div className="space-y-1.5">
                    <CardTitle>Talent Profile</CardTitle>
                    <CardDescription>Showcase your skills and experience to businesses.</CardDescription>
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
                                <Label htmlFor="displayName">Display Name</Label>
                                <Input id="displayName" {...form.register('displayName')} />
                                {form.formState.errors.displayName && (
                                    <p className="text-sm text-destructive">{form.formState.errors.displayName.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="headline">Headline</Label>
                                <Input id="headline" placeholder="Senior React Developer" {...form.register('headline')} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="yearsOfExp">Years of Exp</Label>
                                <Input id="yearsOfExp" type="number" {...form.register('yearsOfExp')} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="desiredHourlyRate">Hourly Rate ($)</Label>
                                <Input id="desiredHourlyRate" type="number" {...form.register('desiredHourlyRate')} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="availabilityHrs">Hours/Week</Label>
                                <Input id="availabilityHrs" type="number" {...form.register('availabilityHrs')} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="english">English Proficiency</Label>
                            <Select
                                onValueChange={(value) => form.setValue('english', value as EnglishProficiency)}
                                defaultValue={form.getValues('english')}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select level" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {Object.values(EnglishProficiency).map((level) => (
                                            <SelectItem key={level} value={level}>
                                                {formatEnum(level)}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="primarySkills">Skills (comma separated)</Label>
                            <Input id="primarySkills" placeholder="React, Node.js, TypeScript" {...form.register('primarySkills')} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="location">Location</Label>
                                <Input id="location" {...form.register('location')} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="timezone">Timezone</Label>
                                <Input id="timezone" placeholder="UTC-5" {...form.register('timezone')} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="portfolioUrl">Portfolio URL</Label>
                                <Input id="portfolioUrl" placeholder="https://" {...form.register('portfolioUrl')} />
                                {form.formState.errors.portfolioUrl && (
                                    <p className="text-sm text-destructive">{form.formState.errors.portfolioUrl.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                                <Input id="linkedinUrl" placeholder="https://" {...form.register('linkedinUrl')} />
                                {form.formState.errors.linkedinUrl && (
                                    <p className="text-sm text-destructive">{form.formState.errors.linkedinUrl.message}</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="availabilityState">Availability</Label>
                            <Select
                                onValueChange={(value) => form.setValue('availabilityState', value as AvailabilityStatus)}
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
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                        {hasData && (
                            <Button type="button" variant="ghost" onClick={handleCancel} disabled={isSaving}>
                                Cancel
                            </Button>
                        )}
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? 'Saving...' : 'Save Profile'}
                        </Button>
                    </CardFooter>
                </form>
            ) : (
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ViewField label="Display Name" value={initialData?.displayName} />
                        <ViewField label="Headline" value={initialData?.headline} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <ViewField label="Years of Exp" value={initialData?.yearsOfExp?.toString()} />
                        <ViewField label="Hourly Rate" value={initialData?.desiredHourlyRate ? `$${initialData.desiredHourlyRate}` : undefined} />
                        <ViewField label="Availability" value={initialData?.availabilityHrs ? `${initialData.availabilityHrs} hrs/week` : undefined} />
                    </div>
                    <ViewField label="English Proficiency" value={initialData?.english ? formatEnum(initialData.english) : undefined} />
                    <ViewField label="Skills" value={initialData?.primarySkills?.join(', ')} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ViewField label="Location" value={initialData?.location} />
                        <ViewField label="Timezone" value={initialData?.timezone} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ViewField label="Portfolio" value={initialData?.portfolioUrl} />
                        <ViewField label="LinkedIn" value={initialData?.linkedinUrl} />
                    </div>
                    <ViewField label="Status" value={initialData?.availabilityState ? formatEnum(initialData.availabilityState) : undefined} />
                </CardContent>
            )}
        </Card>
    );
}
