import { getUserProfile } from '@/app/actions/profile';
import { UserRole } from '@prisma/client';
import { BusinessProfileForm } from './_components/BusinessProfileForm';
import { TalentProfileForm } from './_components/TalentProfileForm';

export default async function ProfilePage() {
    const user = await getUserProfile();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
                    <p className="text-muted-foreground">
                        Manage your {user.role.toLowerCase()} profile information.
                    </p>
                </div>
            </div>

            <div className="py-6">
                {user.role === UserRole.business ? (
                    <BusinessProfileForm initialData={user.businessProfile} />
                ) : (
                    <TalentProfileForm initialData={user.talentProfile} />
                )}
            </div>
        </div>
    );
}
