'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

const helpSchema = z.object({
    category: z.enum(['Bug', 'Suggestion', 'Other'], {
        required_error: 'Please select a category.',
    }),
    title: z.string().min(1, 'Title is required.').max(100, 'Title is too long.'),
    description: z.string().min(10, 'Description must be at least 10 characters.'),
});

type HelpFormValues = z.infer<typeof helpSchema>;

interface HelpFormProps {
    userEmail: string;
}

export function HelpForm({ userEmail }: HelpFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<HelpFormValues>({
        resolver: zodResolver(helpSchema),
        defaultValues: {
            category: 'Bug',
            title: '',
            description: '',
        },
    });

    const onSubmit = (data: HelpFormValues) => {
        setIsSubmitting(true);
        try {
            const subject = encodeURIComponent(`[${data.category}] ${data.title}`);
            const body = encodeURIComponent(
                `User Email: ${userEmail}\n\nDescription:\n${data.description}`
            );

            window.location.href = `mailto:core@pivothire.tech?subject=${subject}&body=${body}`;

            toast.success('Opening your email client...');
            form.reset();
        } catch (error) {
            console.error(error);
            toast.error('Something went wrong.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="w-full mx-auto">
            <CardHeader>
                <CardTitle>Contact Support</CardTitle>
                <CardDescription>
                    Submit a bug report, feature idea, or general inquiry. This will open your default email client.
                </CardDescription>
            </CardHeader>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select
                            onValueChange={(val) => form.setValue('category', val as 'Bug' | 'Suggestion' | 'Other')}
                            defaultValue={form.getValues('category')}
                        >
                            <SelectTrigger id="category">
                                <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Bug">Bug Report</SelectItem>
                                <SelectItem value="Suggestion">Suggestion</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                        {form.formState.errors.category && (
                            <p className="text-sm text-destructive">{form.formState.errors.category.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
                            placeholder="Brief summary of the issue"
                            {...form.register('title')}
                        />
                        {form.formState.errors.title && (
                            <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Please provide details..."
                            className="min-h-[150px]"
                            {...form.register('description')}
                        />
                        {form.formState.errors.description && (
                            <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
                        )}
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end mt-4">
                    <Button type="submit" disabled={isSubmitting}>
                        Open Email Client
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
