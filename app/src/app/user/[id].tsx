import { useGetUser } from "@/features/auth/hooks/use-user";
import { useCreateChat } from '@/features/messaging/hooks/use-create-chat';
import InfoRow from "@/features/user/components/info-row";
import { BRAND } from "@/shared/config/brand";
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
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
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

    const createChat = useCreateChat();

    const groupConversations = useMemo(() => {
        if (!user?.conversations) return [];
        return user.conversations.filter((c) => c.type === 'group');
    }, [user?.conversations]);

    const handleStartDiscussion = () => {
        if (!user || createChat.isPending) return;

        const existingPrivateChat = user.conversations.find((c) => c.type === 'private');

        if (existingPrivateChat) {
            router.push(`/chat/${existingPrivateChat.id}`);
        } else {
            createChat.mutate(
                { type: 'private', memberUserIds: [user.id] },
                {
                    onSuccess: (chat: { id: string }) => {
                        router.replace(`/chat/${chat.id}`);
                    },
                }
            );
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
            <SafeAreaView className="flex-1 bg-background-light dark:bg-zinc-950 px-6 justify-center items-center" edges={['top']}>
                <Skeleton className="rounded-full mb-4" width={96} height={96} />
                <Skeleton className="rounded-xl mb-2" width={160} height={20} />
                <Skeleton className="rounded-xl" width={100} height={14} />
            </SafeAreaView>
        );
    }

    if (error || (!user && !isLoading)) {
        return (
            <SafeAreaView className="flex-1 items-center justify-center bg-background-light dark:bg-zinc-950 px-6" edges={['top']}>
                <Text className="text-[14px] font-medium text-text-secondary-light dark:text-zinc-400 text-center">
                    Impossible de charger le profil de ce contact.
                </Text>
                <Pressable onPress={() => refetch()} className="mt-4 px-5 h-10 rounded-xl bg-primary items-center justify-center active:scale-95 transition-transform">
                    <Text className="text-white text-[13px] font-bold uppercase tracking-wider">Réessayer</Text>
                </Pressable>
            </SafeAreaView>
        );
    }

    const displayName = user?.profile?.firstname || user?.profile?.lastname
        ? `${user.profile.firstname ?? ''} ${user.profile.lastname ?? ''}`.trim()
        : user?.username;

    return (
        <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-zinc-950" edges={['top']}>

            {/* HEADER FLOTTANT ÉPURÉ */}
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-neutral-200/50 dark:border-zinc-900 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md z-50">
                <Pressable
                    onPress={() => router.back()}
                    className="h-9 w-9 items-center justify-center rounded-full active:bg-neutral-100 dark:active:bg-zinc-800 transition-colors"
                >
                    <ArrowLeft size={20} color="#64748B" />
                </Pressable>
                <Text className="font-semibold text-neutral-900 dark:text-zinc-100 text-[16px]">
                    Détails du contact
                </Text>
                <View className="w-9" />
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

                {/* EN-TÊTE IMMERSIF (STYLE WHATSAPP PROFILE) */}
                <View className="items-center pt-6 pb-6 bg-white dark:bg-zinc-900 border-b border-neutral-200/40 dark:border-zinc-900/60 shadow-sm shadow-black/[0.02]">
                    <View className="mb-3 shadow-md">
                        <Avatar name={user?.username as string} uri={user?.profile?.avatarUrl ?? undefined} size={150} />
                    </View>

                    <Text className="text-[20px] font-bold tracking-tight text-neutral-900 dark:text-zinc-50 text-center">
                        {displayName}
                    </Text>

                    <Text className="text-[13px] text-neutral-400 dark:text-zinc-500 text-center mt-0.5 font-medium">
                        @{user?.username}
                    </Text>

                    {/* ACTIONS RAPIDES (STYLE ICONES WHATSAPP) */}
                    <View className="flex-row justify-center items-center gap-x-8 mt-6 w-full">
                        <Pressable
                            onPress={handleStartDiscussion}
                            disabled={createChat.isPending}
                            className="items-center justify-center active:scale-95 transition-transform"
                        >
                            <View className="h-11 w-11 rounded-full bg-primary/10 dark:bg-primary/20 items-center justify-center mb-1.5">
                                {createChat.isPending ? (
                                    <ActivityIndicator size="small" color={BRAND.primary} />
                                ) : (
                                    <MessageCircle size={20} color={BRAND.primary} strokeWidth={2.2} />
                                )}
                            </View>
                            <Text className="text-[11px] font-bold text-primary dark:text-emerald-400 uppercase tracking-wide">Discuter</Text>
                        </Pressable>

                        {user?.profile?.phone && (
                            <Pressable
                                className="items-center justify-center opacity-60 active:scale-95 transition-transform"
                                onPress={handlePhonePress}
                            >
                                <View className="h-11 w-11 rounded-full bg-neutral-100 dark:bg-zinc-800 items-center justify-center mb-1.5">
                                    <Phone size={19} className="text-neutral-700 dark:text-zinc-300" strokeWidth={2.2} />
                                </View>
                                <Text className="text-[11px] font-bold text-neutral-600 dark:text-zinc-400 uppercase tracking-wide">Appeler</Text>
                            </Pressable>
                        )}
                    </View>
                </View>

                {/* BLOCS D'INFORMATIONS EN CARDS WHATSAPP */}
                <View className="mt-3 gap-y-3 px-3">

                    {/* CARD ACTU / BIO */}
                    {user?.profile?.bio && (
                        <View className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-neutral-200/30 dark:border-zinc-900/50 shadow-sm shadow-black/[0.01]">
                            <Text className="text-[11px] font-bold text-primary dark:text-emerald-400 uppercase tracking-widest mb-1.5">Actu / Bio</Text>
                            <Text className="text-[14px] leading-5 font-medium text-neutral-800 dark:text-zinc-200">
                                {user.profile.bio}
                            </Text>
                        </View>
                    )}

                    {/* CARD COORDONNÉES ET RÔLE */}
                    <View className="bg-white dark:bg-zinc-900 rounded-2xl border border-neutral-200/30 dark:border-zinc-900/50 shadow-sm shadow-black/[0.01] divide-y divide-neutral-100 dark:divide-zinc-800/60">
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
                            <View className="p-4 flex-row items-center gap-x-3.5 bg-red-500/[0.02] dark:bg-red-500/[0.01]">
                                <View className="h-8 w-8 rounded-lg bg-red-500/10 items-center justify-center">
                                    <ShieldCheck size={16} color="red" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-[12px] font-bold text-red-500 dark:text-red-400 uppercase tracking-wide">Administrateur Officiel</Text>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* CARD UNIVERSITAIRE */}
                    {(user?.profile?.filiere || user?.profile?.niveau) && (
                        <View className="bg-white dark:bg-zinc-900 rounded-2xl border border-neutral-200/30 dark:border-zinc-900/50 shadow-sm shadow-black/[0.01] divide-y divide-neutral-100 dark:divide-zinc-800/60">

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

                    {/* CARD GROUPES EN COMMUN (VRAI LOOK CHAT CELL WHATSAPP) */}
                    <View className="mt-2 gap-y-2">
                        <Text className="text-[12px] font-bold text-neutral-400 dark:text-zinc-500 uppercase tracking-wider pl-2">
                            Groupes en commun ({groupConversations.length})
                        </Text>

                        {groupConversations.length > 0 ? (
                            <View className="bg-white dark:bg-zinc-900 rounded-2xl border border-neutral-200/30 dark:border-zinc-900/50 shadow-sm shadow-black/[0.01] overflow-hidden divide-y divide-neutral-100 dark:divide-zinc-800/60">
                                {groupConversations.map((group) => (
                                    <Pressable
                                        key={group.id}
                                        onPress={() => router.push(`/chat/${group.id}`)}
                                        className="flex-row items-center justify-between p-4 active:bg-neutral-50 dark:active:bg-zinc-800/40 transition-colors"
                                    >
                                        <View className="flex-row items-center gap-x-3.5 flex-1">
                                            <View className="h-9 w-9 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20">
                                                <Users size={16} className="text-primary dark:text-emerald-400" />
                                            </View>
                                            <View className="flex-1">
                                                <Text className="text-[14px] font-bold text-neutral-800 dark:text-zinc-100" numberOfLines={1}>
                                                    {group.name || "Groupe PipoLink"}
                                                </Text>
                                                <Text className="text-[11px] text-neutral-400 dark:text-zinc-500 mt-0.5" numberOfLines={1}>
                                                    Appuyez pour ouvrir la discussion
                                                </Text>
                                            </View>
                                        </View>
                                        <ChevronRight size={16} className="text-neutral-300 dark:text-zinc-600" />
                                    </Pressable>
                                ))}
                            </View>
                        ) : (
                            <View className="rounded-2xl border border-dashed border-neutral-200 dark:border-zinc-800 p-6 items-center justify-center bg-white dark:bg-zinc-900">
                                <Info size={18} className="text-neutral-300 dark:text-zinc-600 mb-2" />
                                <Text className="text-[12px] text-neutral-400 dark:text-zinc-500 text-center font-medium">
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