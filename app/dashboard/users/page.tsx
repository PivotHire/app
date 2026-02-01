"use client";

import { useEffect, useState } from "react";
import { getUsers, updateUserRole } from "./actions";
import { UserRole } from "@/lib/roles";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function UsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [pendingChange, setPendingChange] = useState<{ userId: string, newRole: UserRole, currentRole: UserRole } | null>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const data = await getUsers();
            setUsers(data);
        } catch (error) {
            console.error("Failed to fetch users", error);
            toast.error("Failed to fetch users");
        } finally {
            setLoading(false);
        }
    };

    const confirmRoleChange = async () => {
        if (!pendingChange) return;
        const { userId, newRole } = pendingChange;

        setPendingChange(null); // Close modal

        // Optimistic update
        const previousUsers = [...users];
        setUsers(users.map(u => u.id === userId ? { ...u, publicMetadata: { ...u.publicMetadata, role: newRole } } : u));

        toast.promise(updateUserRole(userId, newRole), {
            loading: 'Updating role...',
            success: (result) => {
                if (!result.success) {
                    setUsers(previousUsers); // Revert
                    throw new Error("Failed");
                }
                return "Role updated successfully";
            },
            error: "Failed to update role"
        });
    };

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight text-[#242424]">Users Management</h1>
                <div className="text-sm text-gray-500">{users.length} Total Users</div>
            </div>

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Current Role</TableHead>
                            <TableHead>Last Active</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => {
                            const currentRole = user.publicMetadata?.role as UserRole || UserRole.BUSINESS;
                            const email = user.emailAddresses[0]?.emailAddress;
                            const name = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "No Name";

                            return (
                                <TableRow key={user.id}>
                                    <TableCell className="flex items-center gap-3 font-medium">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={user.imageUrl} />
                                            <AvatarFallback>{name[0]}</AvatarFallback>
                                        </Avatar>
                                        <span>{name}</span>
                                    </TableCell>
                                    <TableCell>{email}</TableCell>
                                    <TableCell>
                                        <Select
                                            value={currentRole}
                                            onValueChange={(val) => setPendingChange({ userId: user.id, newRole: val as UserRole, currentRole })}
                                        >
                                            <SelectTrigger className="w-[120px] h-8">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                                                <SelectItem value={UserRole.BUSINESS}>Business</SelectItem>
                                                <SelectItem value={UserRole.TALENT}>Talent</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell className="text-gray-500">
                                        {user.lastSignInAt ? new Date(user.lastSignInAt).toLocaleDateString() : 'Never'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => toast.info(`View Profile for ${name}`)}
                                        >
                                            View Profile
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>

            <AlertDialog open={!!pendingChange} onOpenChange={(open) => !open && setPendingChange(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Change User Role?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to change this user's role from <span className="font-semibold">{pendingChange?.currentRole}</span> to <span className="font-bold text-[#242424]">{pendingChange?.newRole}</span>?
                            This will update their permissions immediately.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmRoleChange} className="bg-[#242424] hover:bg-[#242424]/90">
                            Confirm Change
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
