import { useGetUser } from "@/features/auth/hooks/use-user";
import InfoRow from "@/features/user/components/info-row";
import { Avatar } from "@/shared/ui/avatar";
import { Skeleton } from "@/shared/ui/skeleton";
import * as Linking from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';
import {
    ArrowLeft,
    BookOpen,
    ChevronRight,
    GraduationCap,
    Info,
    Mail,
    MessageCircle,
    Phone,
    ShieldCheck,
    Users
} from 'lucide-react-native';
import { useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── INTERFACES ET TYPAGE STRICT ─────────────────────────────────────────────
interface Conversation {
    id: string;
    type: 'private' | 'group';
    name: string | null;
}

interface UserProfile {
    firstname: string | null;
    lastname: string | null;
    phone: string | null;
    gender: 'M' | 'F' | string;
    niveau: string | null;
    filiere: string | null;
    bio: string | null;
    avatarUrl: string | null;
}

interface User {
    id: string;
    username: string;
    matricule: string;
    email: string;
    role: 'admin' | 'user' | string;
    profile: UserProfile;
    conversations: Conversation[];
}

export default function UserInfoScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { data: user, isLoading, error, refetch } = useGetUser(id || '') as {
        data: User | undefined;
        isLoading: boolean;
        error: any;
        refetch: () => void;
    };

    const groupConversations = useMemo(() => {
        if (!user?.conversations) return [];
        return user.conversations.filter((c) => c.type === 'group');
    }, [user?.conversations]);

    const handleStartDiscussion = () => {
        if (!user) return;
        const existingPrivateChat = user.conversations.find((c) => c.type === 'private');
        if (existingPrivateChat) {
            router.push(`/chat/${existingPrivateChat.id}`);
        } else {
            router.push(`/chat/${user.id}`);
        }
    };

    const handlePhonePress = () => {
        if (user?.profile?.phone) {
            const phoneNumber = user.profile.phone.replace(/\s+/g, '');
            const url = `tel:${phoneNumber}`;
            Linking.openURL(url).catch((err) => {
                console.error('Failed to open dialer:', err);
            });
        }
    };

    if (isLoading) {
        return (
            <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950 px-6 justify-center items-center" edges={['top']}>
                <Skeleton className="rounded-full mb-4" width={96} height={96} />
                <Skeleton className="rounded-xl mb-2" width={160} height={20} />
                <Skeleton className="rounded-xl" width={100} height={14} />
            </SafeAreaView>
        );
    }

    if (error || (!user && !isLoading)) {
        return (
            <SafeAreaView className="flex-1 items-center justify-center bg-white dark:bg-zinc-950 px-6" edges={['top']}>
                <Text className="text-sm font-medium text-zinc-500 dark:text-zinc-400 text-center">
                    Impossible de charger le profil de ce contact.
                </Text>
                <Pressable 
                    onPress={() => refetch()} 
                    className="mt-4 px-5 h-11 rounded-xl bg-orange-500 items-center justify-center active:bg-orange-600"
                >
                    <Text className="text-white text-xs font-bold uppercase tracking-wider">Réessayer</Text>
                </Pressable>
            </SafeAreaView>
        );
    }

    const displayName = user?.profile?.firstname || user?.profile?.lastname
        ? `${user.profile.firstname ?? ''} ${user.profile.lastname ?? ''}`.trim()
        : user?.username;

    return (
        <SafeAreaView className="flex-1 bg-zinc-50 dark:bg-zinc-950" edges={['top']}>

            {/* HEADER MAT ET ÉPURÉ */}
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950">
                <Pressable
                    onPress={() => router.back()}
                    className="h-8 w-8 items-center justify-center rounded-lg bg-zinc-50 dark:bg-zinc-900 active:bg-zinc-100 dark:active:bg-zinc-800"
                >
                    <ArrowLeft size={18} color="#71717A" />
                </Pressable>
                <Text className="font-bold text-zinc-900 dark:text-zinc-50 text-sm">
                    Détails du contact
                </Text>
                <View className="w-8" />
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

                {/* EN-TÊTE IMMERSIF MATE */}
                <View className="items-center pt-6 pb-6 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-900/60">
                    <View className="mb-4">
                        <Avatar name={user?.username as string} uri={user?.profile?.avatarUrl ?? undefined} size={120} role={user?.role as any} />
                    </View>

                    <Text className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50 text-center">
                        {displayName}
                    </Text>

                    <Text className="text-xs text-zinc-400 dark:text-zinc-500 text-center mt-0.5 font-medium">
                        @{user?.username}
                    </Text>

                    {/* ACTIONS RAPIDES MATES */}
                    <View className="flex-row justify-center items-center gap-x-6 mt-6 w-full">
                        <Pressable
                            onPress={handleStartDiscussion}
                            className="items-center justify-center active:opacity-90"
                        >
                            <View className="h-11 w-28 rounded-xl bg-orange-500 flex-row items-center justify-center gap-x-2 px-2">
                                <MessageCircle size={16} color="#FFFFFF" strokeWidth={2.2} />
                                <Text className="text-xs font-bold text-white uppercase tracking-wide">Discuter</Text>
                            </View>
                        </Pressable>

                        {user?.profile?.phone && (
                            <Pressable
                                className="items-center justify-center active:opacity-90"
                                onPress={handlePhonePress}
                            >
                                <View className="h-11 w-28 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex-row items-center justify-center gap-x-2 px-2">
                                    <Phone size={16} color="#71717A" strokeWidth={2.2} />
                                    <Text className="text-xs font-bold text-zinc-600 dark:text-zinc-300 uppercase tracking-wide">Appeler</Text>
                                </View>
                            </Pressable>
                        )}
                    </View>
                </View>

                {/* BLOCS D'INFORMATIONS MATES EN CARDS */}
                <View className="mt-4 gap-y-4 px-4">

                    {/* CARD ACTU / BIO */}
                    {user?.profile?.bio && (
                        <View className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-100 dark:border-zinc-900">
                            <Text className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-1.5">Actu / Bio</Text>
                            <Text className="text-xs leading-5 font-medium text-zinc-700 dark:text-zinc-300">
                                {user.profile.bio}
                            </Text>
                        </View>
                    )}

                    {/* CARD COORDONNÉES ET RÔLE */}
                    <View className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-900 overflow-hidden divide-y divide-zinc-50 dark:divide-zinc-800/60">
                        <InfoRow
                            Icon={Mail}
                            title="Adresse e-mail"
                            value={user?.email ?? "Non renseigné"}
                        />

                        {user?.profile?.phone && (
                            <InfoRow
                                Icon={Phone}
                                title="Téléphone"
                                value={user.profile.phone}
                            />
                        )}

                        {user?.role === 'admin' && (
                            <View className="p-4 flex-row items-center gap-x-3 bg-red-50/20 dark:bg-red-950/10">
                                <View className="h-8 w-8 rounded-lg bg-red-100/60 dark:bg-red-950/40 items-center justify-center">
                                    <ShieldCheck size={16} color="#EF4444" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-[11px] font-bold text-red-500 dark:text-red-400 uppercase tracking-wide">Administrateur Officiel</Text>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* CARD UNIVERSITAIRE */}
                    {(user?.profile?.filiere || user?.profile?.niveau) && (
                        <View className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-900 overflow-hidden divide-y divide-zinc-50 dark:divide-zinc-800/60">
                            {user.profile.filiere && (
                                <InfoRow
                                    Icon={BookOpen}
                                    title="Filière d'étude"
                                    value={user.profile.filiere}
                                />
                            )}
                            {user.profile.niveau && (
                                <InfoRow
                                    Icon={GraduationCap}
                                    title="Niveau académique"
                                    value={`Année ${user.profile.niveau}`}
                                />
                            )}
                        </View>
                    )}

                    {/* CARD GROUPES EN COMMUN */}
                    <View className="mt-1 gap-y-2">
                        <Text className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider pl-1">
                            Groupes en commun ({groupConversations.length})
                        </Text>

                        {groupConversations.length > 0 ? (
                            <View className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-900 overflow-hidden divide-y divide-zinc-50 dark:divide-zinc-800/60">
                                {groupConversations.map((group) => (
                                    <Pressable
                                        key={group.id}
                                        onPress={() => router.push(`/chat/${group.id}`)}
                                        className="flex-row items-center justify-between p-4 active:bg-zinc-50 dark:active:bg-zinc-800/40"
                                    >
                                        <View className="flex-row items-center gap-x-3 flex-1">
                                            <View className="h-8 w-8 items-center justify-center rounded-lg bg-zinc-50 dark:bg-zinc-800">
                                                <Users size={16} color="#71717A" />
                                            </View>
                                            <View className="flex-1">
                                                <Text className="text-xs font-bold text-zinc-800 dark:text-zinc-100" numberOfLines={1}>
                                                    {group.name || "Groupe PipoLink"}
                                                </Text>
                                                <Text className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5" numberOfLines={1}>
                                                    Appuyez pour ouvrir la discussion
                                                </Text>
                                            </View>
                                        </View>
                                        <ChevronRight size={14} color="#A1A1AA" />
                                    </Pressable>
                                ))}
                            </View>
                        ) : (
                            <View className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 p-6 items-center justify-center bg-white dark:bg-zinc-900">
                                <Info size={16} color="#A1A1AA" className="mb-1.5" />
                                <Text className="text-[11px] text-zinc-400 dark:text-zinc-500 text-center font-medium">
                                    Aucun espace de discussion de groupe partagé.
                                </Text>
                            </View>
                        )}
                    </View>

                </View>
            </ScrollView>
        </SafeAreaView>
    );
}