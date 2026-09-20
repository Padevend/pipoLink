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
            <SafeAreaView className="flex-1 bg-white dark:bg-[#0A0A0A] px-6 justify-center items-center" edges={['top']}>
                <Skeleton className="rounded-full mb-4" width={112} height={112} />
                <Skeleton className="rounded-2xl mb-2" width={180} height={24} />
                <Skeleton className="rounded-xl" width={120} height={16} />
            </SafeAreaView>
        );
    }

    if (error || (!user && !isLoading)) {
        return (
            <SafeAreaView className="flex-1 items-center justify-center bg-white dark:bg-[#0A0A0A] px-8" edges={['top']}>
                <Text className="text-xs font-bold uppercase tracking-wider text-zinc-400 text-center">
                    Impossible de charger le profil de ce contact.
                </Text>
                <Pressable 
                    onPress={() => refetch()} 
                    className="mt-6 px-8 h-14 rounded-full bg-orange-500 items-center justify-center active:opacity-80"
                >
                    <Text className="text-white text-xs font-black uppercase tracking-widest">Réessayer</Text>
                </Pressable>
            </SafeAreaView>
        );
    }

    const displayName = user?.profile?.firstname || user?.profile?.lastname
        ? `${user.profile.firstname ?? ''} ${user.profile.lastname ?? ''}`.trim()
        : user?.username;

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-[#0A0A0A]" edges={['top']}>

            {/* Header Néo-banque plat */}
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-900 bg-white dark:bg-[#0A0A0A]">
                <Pressable
                    onPress={() => router.back()}
                    className="h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-[#1A1A1A] active:opacity-80"
                >
                    <ArrowLeft size={18} color="#F97316" strokeWidth={2.5} />
                </Pressable>
                <Text className="font-bold text-zinc-950 dark:text-white text-sm">
                    Détails du contact
                </Text>
                <View className="w-10" />
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

                {/* EN-TÊTE PROFIL */}
                <View className="items-center pt-8 pb-6 px-6 bg-white dark:bg-[#0A0A0A] border-b border-zinc-100 dark:border-zinc-900">
                    <View className="mb-4">
                        <Avatar name={user?.username as string} uri={user?.profile?.avatarUrl ?? undefined} size={112} role={user?.role as any} />
                    </View>

                    <Text className="text-xl font-black tracking-tight text-zinc-950 dark:text-white text-center">
                        {displayName}
                    </Text>

                    <Text className="text-xs text-zinc-400 dark:text-zinc-500 text-center mt-1 font-bold uppercase tracking-wider">
                        @{user?.username}
                    </Text>

                    {/* ACTIONS RAPIDES : Boutons en rounded-full */}
                    <View className="flex-row justify-center items-center gap-x-4 mt-6 w-full">
                        <Pressable
                            onPress={handleStartDiscussion}
                            className="flex-1 h-12 rounded-full bg-orange-500 flex-row items-center justify-center gap-x-2 active:opacity-80"
                        >
                            <MessageCircle size={18} color="#FFFFFF" strokeWidth={2.5} />
                            <Text className="text-xs font-black text-white uppercase tracking-wider">Discuter</Text>
                        </Pressable>

                        {user?.profile?.phone && (
                            <Pressable
                                className="flex-1 h-12 rounded-full bg-zinc-100 dark:bg-[#1A1A1A] flex-row items-center justify-center gap-x-2 active:opacity-80"
                                onPress={handlePhonePress}
                            >
                                <Phone size={18} color="#F97316" strokeWidth={2.5} />
                                <Text className="text-xs font-black text-zinc-950 dark:text-white uppercase tracking-wider">Appeler</Text>
                            </Pressable>
                        )}
                    </View>
                </View>

                {/* CONTENU EN BLOCS PLATS (Pas rounded-full pour les cards) */}
                <View className="mt-6 gap-y-4 px-6">

                    {/* CARD ACTU / BIO */}
                    {user?.profile?.bio && (
                        <View className="bg-zinc-100 dark:bg-[#1A1A1A] rounded-2xl p-5 ">
                            <Text className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-2">Actu / Bio</Text>
                            <Text className="text-xs leading-relaxed font-semibold text-zinc-700 dark:text-zinc-300">
                                {user.profile.bio}
                            </Text>
                        </View>
                    )}

                    {/* CARD COORDONNÉES ET RÔLE */}
                    <View className="bg-zinc-100 dark:bg-[#1A1A1A] rounded-2xl overflow-hidden divide-y divide-zinc-200 dark:divide-zinc-800/60">
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
                            <View className="p-4 flex-row items-center gap-x-3 ">
                                <View className="h-9 w-9 rounded-xl bg-red-500/20 items-center justify-center">
                                    <ShieldCheck size={18} color="#EF4444" strokeWidth={2.5} />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-[11px] font-black text-red-500 uppercase tracking-wider">Administrateur Officiel</Text>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* CARD UNIVERSITAIRE */}
                    {(user?.profile?.filiere || user?.profile?.niveau) && (
                        <View className="bg-zinc-100 dark:bg-[#1A1A1A] rounded-2xl overflow-hidden divide-y divide-zinc-200 dark:divide-zinc-800/60">
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
                    <View className="mt-2 gap-y-3">
                        <Text className="text-[11px] font-black text-zinc-400 uppercase tracking-widest ml-1">
                            Groupes en commun ({groupConversations.length})
                        </Text>

                        {groupConversations.length > 0 ? (
                            <View className="bg-zinc-100 dark:bg-[#1A1A1A] rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden divide-y divide-zinc-200 dark:divide-zinc-800/60">
                                {groupConversations.map((group) => (
                                    <Pressable
                                        key={group.id}
                                        onPress={() => router.push(`/chat/${group.id}`)}
                                        className="flex-row items-center justify-between p-4 active:opacity-80"
                                    >
                                        <View className="flex-row items-center gap-x-3 flex-1">
                                            <View className="h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-[#0A0A0A]">
                                                <Users size={18} color="#F97316" strokeWidth={2.5} />
                                            </View>
                                            <View className="flex-1">
                                                <Text className="text-xs font-bold text-zinc-950 dark:text-white" numberOfLines={1}>
                                                    {group.name || "Groupe PipoLink"}
                                                </Text>
                                                <Text className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-0.5" numberOfLines={1}>
                                                    Ouvrir la discussion
                                                </Text>
                                            </View>
                                        </View>
                                        <ChevronRight size={16} color="#F97316" strokeWidth={2.5} />
                                    </Pressable>
                                ))}
                            </View>
                        ) : (
                            <View className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 p-8 items-center justify-center bg-zinc-100 dark:bg-[#1A1A1A]">
                                <Info size={20} color="#F97316" strokeWidth={2.5} className="mb-2" />
                                <Text className="text-xs font-bold text-zinc-400 text-center uppercase tracking-wider">
                                    Aucun groupe partagé.
                                </Text>
                            </View>
                        )}
                    </View>

                </View>
            </ScrollView>
        </SafeAreaView>
    );
}