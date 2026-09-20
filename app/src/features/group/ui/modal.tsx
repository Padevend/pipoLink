import {
    Pressable,
    Text,
    TextInput,
    View,
} from 'react-native';

interface modalsProps {
    maxUses: string;
    setMaxUses: (maxUses: string) => void;
    expiresInHours: string;
    setExpiresInHours: (expiresInHours: string) => void;
    inviteModalVisible: boolean;
    setInviteModalVisible: (inviteModalVisible: boolean) => void;
    handleCreateInvite: () => void;
}

export default function AddLinkModal({
    maxUses,
    setMaxUses,
    expiresInHours,
    setExpiresInHours,
    setInviteModalVisible,
    handleCreateInvite
}: modalsProps) {
    return (
        <View className="flex-1 justify-center items-center bg-black/60 p-6">
            {/* Conteneur principal (Arrondis 2xl, fond plein) */}
            <View className="w-full max-w-sm rounded-2xl bg-white p-6 dark:bg-[#1A1A1A] border-2 border-zinc-100 dark:border-zinc-800">
                
                <Text className="text-base font-black uppercase tracking-widest text-zinc-950 dark:text-white mb-6 text-center">
                    Nouveau lien d'invitation
                </Text>

                <View className="gap-y-5 mb-6">
                    {/* Champ 1 : Nombre d'utilisations */}
                    <View className="gap-y-2">
                        <Text className="text-[11px] font-black uppercase tracking-widest text-zinc-500">
                            Nombre maximal de personnes (optionnel)
                        </Text>
                        <TextInput
                            value={maxUses}
                            onChangeText={setMaxUses}
                            placeholder="Exemple : 5"
                            placeholderTextColor="#A1A1AA"
                            keyboardType="number-pad"
                            className="h-14 rounded-full bg-zinc-100 dark:bg-[#222222] px-6 text-sm font-bold text-zinc-950 dark:text-white border-2 border-transparent"
                        />
                    </View>

                    {/* Champ 2 : Durée de validité */}
                    <View className="gap-y-2">
                        <Text className="text-[11px] font-black uppercase tracking-widest text-zinc-500">
                            Durée de validité en heures (optionnel)
                        </Text>
                        <TextInput
                            value={expiresInHours}
                            onChangeText={setExpiresInHours}
                            placeholder="Exemple : 24 (pour 1 jour)"
                            placeholderTextColor="#A1A1AA"
                            keyboardType="number-pad"
                            className="h-14 rounded-full bg-zinc-100 dark:bg-[#222222] px-6 text-sm font-bold text-zinc-950 dark:text-white border-2 border-transparent"
                        />
                    </View>
                </View>

                {/* Actions de validation (Boutons rounded-full) */}
                <View className="flex-row gap-3">
                    <Pressable
                        onPress={() => setInviteModalVisible(false)}
                        className="flex-1 h-14 items-center justify-center rounded-full bg-zinc-100 dark:bg-[#222222] active:opacity-80"
                    >
                        <Text className="text-xs font-black uppercase tracking-widest text-zinc-950 dark:text-white">
                            Annuler
                        </Text>
                    </Pressable>
                    
                    <Pressable
                        onPress={handleCreateInvite}
                        className="flex-1 h-14 items-center justify-center rounded-full bg-orange-500 active:bg-orange-600"
                    >
                        <Text className="text-xs font-black uppercase tracking-widest text-white">
                            Créer le lien
                        </Text>
                    </Pressable>
                </View>
            </View>
        </View>
    );
}