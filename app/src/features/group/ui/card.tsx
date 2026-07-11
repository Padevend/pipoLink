import {
    Pressable,
    Text,
    View,
} from 'react-native';
import {
    Copy,
    Trash2,
} from 'lucide-react-native';

interface modalprops {
    invite: any;
    handleCopyLink: (token: string) => void;
    handleRevokeLink: (id: string) => void;
}

export default function InviationLinkCard({
    invite,
    handleCopyLink,
    handleRevokeLink,
}: modalprops) {
    return (
        <View
            key={invite.id}
            className="flex-row items-center justify-between border border-zinc-100 bg-white p-3 rounded-xl dark:border-zinc-800 dark:bg-zinc-900"
        >
            <View className="flex-1 pr-3">
                {/* Libellé plus accueillant qu'un hash informatique */}
                <Text className="text-xs font-bold text-zinc-800 dark:text-zinc-200" numberOfLines={1}>
                    Lien d'accès • {invite.token.substring(0, 6)}...
                </Text>
                
                {/* Statistiques et date d'expiration */}
                <View className="flex-row items-center gap-1.5 mt-1">
                    <Text className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                        {invite.uses}{invite.max_uses ? ` / ${invite.max_uses}` : ''} util.
                    </Text>
                    
                    {invite.expires_at && (
                        <>
                            <Text className="text-[11px] text-zinc-300 dark:text-zinc-700">•</Text>
                            <Text className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                                {new Date(invite.expires_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                            </Text>
                        </>
                    )}
                </View>
            </View>

            {/* Actions tactiles épurées */}
            <View className="flex-row items-center gap-1.5">
                {/* Copier : Bouton d'action principal */}
                <Pressable
                    onPress={() => handleCopyLink(invite.token)}
                    className="h-8 px-3 flex-row items-center gap-1.5 rounded-lg bg-orange-500 active:bg-orange-600"
                >
                    <Copy size={12} color="#FFFFFF" strokeWidth={2.5} />
                    <Text className="text-[11px] font-bold text-white">Copier</Text>
                </Pressable>
                
                {/* Supprimer : Teinte destructive subtile sans effet hover web inutile */}
                <Pressable
                    onPress={() => handleRevokeLink(invite.id)}
                    className="h-8 w-8 items-center justify-center rounded-lg bg-zinc-50 dark:bg-zinc-800 active:bg-red-50 dark:active:bg-red-950/30"
                >
                    <Trash2 size={13} color="#EF4444" />
                </Pressable>
            </View>
        </View>
    );
}