import { Dispatch, SetStateAction } from 'react';
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
        <View className="flex-1 justify-center items-center bg-black/50 px-4">
            {/* Conteneur principal mat et épuré */}
            <View className="w-full max-w-sm rounded-2xl border border-zinc-100 bg-white p-6 dark:border-zinc-900 dark:bg-zinc-900">
                
                <Text className="text-base font-bold text-zinc-900 dark:text-zinc-50 mb-4 text-center">
                    Nouveau lien d'invitation
                </Text>

                <View className="gap-4 mb-6">
                    {/* Champ 1 : Nombre d'utilisations */}
                    <View>
                        <Text className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">
                            Nombre maximal de personnes (optionnel)
                        </Text>
                        <TextInput
                            value={maxUses}
                            onChangeText={setMaxUses}
                            placeholder="Exemple : 5"
                            placeholderTextColor="#A1A1AA"
                            keyboardType="number-pad"
                            className="h-11 rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                        />
                    </View>

                    {/* Champ 2 : Durée de validité */}
                    <View>
                        <Text className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">
                            Durée de validité en heures (optionnel)
                        </Text>
                        <TextInput
                            value={expiresInHours}
                            onChangeText={setExpiresInHours}
                            placeholder="Exemple : 24 (pour 1 jour)"
                            placeholderTextColor="#A1A1AA"
                            keyboardType="number-pad"
                            className="h-11 rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                        />
                    </View>
                </View>

                {/* Actions de validation */}
                <View className="flex-row gap-3">
                    <Pressable
                        onPress={() => setInviteModalVisible(false)}
                        className="flex-1 h-11 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 active:bg-zinc-200 dark:active:bg-zinc-700"
                    >
                        <Text className="text-sm font-bold text-zinc-600 dark:text-zinc-300">
                            Annuler
                        </Text>
                    </Pressable>
                    
                    <Pressable
                        onPress={handleCreateInvite}
                        className="flex-1 h-11 items-center justify-center rounded-xl bg-orange-500 active:bg-orange-600"
                    >
                        <Text className="text-sm font-bold text-white">
                            Créer le lien
                        </Text>
                    </Pressable>
                </View>
            </View>
        </View>
    );
}