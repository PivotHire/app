import { currentUser } from '@clerk/nextjs/server';
import { HelpForm } from './_components/HelpForm';
import { redirect } from 'next/navigation';

export default async function HelpPage() {
    const user = await currentUser();

    if (!user) {
        redirect('/sign-in');
    }

    const email = user.emailAddresses[0]?.emailAddress || 'No email found';

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Help Center</h1>
                <p className="text-muted-foreground">
                    Have questions or feedback? We're here to help.
                </p>
            </div>

            <div className="py-6">
                <HelpForm userEmail={email} />
            </div>
        </div>
    );
}
