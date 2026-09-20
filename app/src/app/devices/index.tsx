import { router } from "expo-router";
import { ArrowLeft, Laptop, Plus, ShieldAlert } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { DeviceItem } from "@/features/devices/components/device-item";
import { useDevices } from "@/features/devices/hooks/use-devices";
import { useIsPrimaryDevice } from "@/features/devices/hooks/use-is-primary-device";
import { useRemoveDevice } from "@/features/devices/hooks/use-remove-device";
import { Loader } from "@/shared/ui/loader";

export default function DevicesScreen(): JSX.Element {
  const { t } = useTranslation("settings");
  const { data, isLoading } = useDevices();
  const { data: isPrimary, isLoading: checkingPrimary } = useIsPrimaryDevice();
  const removeMutation = useRemoveDevice();
  const insets = useSafeAreaInsets();

  const secondaryDevices = (data ?? []).filter((d) => !d.isPrimary);

  if (checkingPrimary) {
    return (
      <SafeAreaView
        className="flex-1 bg-white dark:bg-[#0A0A0A]"
        edges={["top", "left", "right"]}
      >
        <View className="flex-1 items-center justify-center">
          <Loader />
        </View>
      </SafeAreaView>
    );
  }

  // État d'accès restreint (Appareil non-principal)
  if (!isPrimary) {
    return (
      <SafeAreaView
        className="flex-1 bg-white dark:bg-[#0A0A0A]"
        edges={["top", "left", "right"]}
      >
        {/* HEADER RESTREINT : Plat et Solide */}
        <View className="flex-row items-center border-b-2 border-zinc-100 bg-white px-6 py-4 dark:border-[#1A1A1A] dark:bg-[#0A0A0A]">
          <Pressable
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-[#1A1A1A] active:opacity-80 transition-opacity"
          >
            <ArrowLeft size={18} color="#F97316" strokeWidth={2.5} />
          </Pressable>
          <Text className="flex-1 ml-4 text-lg font-black tracking-tight text-zinc-950 dark:text-white" numberOfLines={1}>
            Appareils liés
          </Text>
        </View>

        <View className="flex-1 items-center justify-center px-8 pb-12">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/30 mb-6">
            <ShieldAlert size={28} color="#EF4444" strokeWidth={2.5} />
          </View>
          <Text className="text-center text-base font-black uppercase tracking-widest text-zinc-950 dark:text-white mb-2">
            Accès restreint
          </Text>
          <Text className="text-center text-xs font-bold leading-relaxed text-zinc-500 dark:text-zinc-400">
            Disponible uniquement sur l'appareil principal
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      className="flex-1 bg-white dark:bg-[#0A0A0A]"
      edges={["top", "left", "right"]}
    >
      {/* HEADER PRINCIPAL : Plat et Solide */}
      <View className="flex-row items-center justify-between border-b-2 border-zinc-100 bg-white px-6 py-4 dark:border-[#1A1A1A] dark:bg-[#0A0A0A]">
        <View className="flex-row items-center flex-1 gap-4">
          <Pressable
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-[#1A1A1A] active:opacity-80 transition-opacity"
          >
            <ArrowLeft size={18} color="#F97316" strokeWidth={2.5} />
          </Pressable>
          
          <View className="flex-1">
            <Text className="text-lg font-black tracking-tight text-zinc-950 dark:text-white" numberOfLines={1}>
              Appareils liés
            </Text>
          </View>
        </View>

        {/* Bouton Scanner (rounded-full) */}
        <Pressable
          onPress={() => router.push("/devices/scan")}
          className="h-10 w-10 items-center justify-center rounded-full bg-orange-500 active:opacity-80"
        >
          <Plus size={18} color="#FFFFFF" strokeWidth={3} />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 24,
          paddingBottom: insets.bottom + 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Description contextuelle */}
        <Text className="mb-6 text-xs font-bold leading-relaxed text-zinc-500 dark:text-zinc-400">
          Appareils secondaires (gestion depuis l'appareil principal uniquement).
        </Text>

        {isLoading ? (
          <View className="py-12 items-center">
            <Loader />
          </View>
        ) : (
          <>
            <Text className="mb-3 text-[11px] font-black uppercase tracking-widest text-zinc-500">
              Appareils autorisés
            </Text>

            {secondaryDevices.length > 0 ? (
              /* Enveloppe de liste (rounded-2xl, fond plein) */
              <View className="overflow-hidden rounded-2xl bg-zinc-100 dark:bg-[#1A1A1A]">
                {secondaryDevices.map((device, index) => (
                  <View key={device.id}>
                    {index > 0 && (
                      <View className="h-[2px] w-full bg-zinc-200 dark:bg-[#222222]" />
                    )}
                    <DeviceItem
                      device={device}
                      onRemove={() =>
                        void removeMutation.mutateAsync(device.id)
                      }
                    />
                  </View>
                ))}
              </View>
            ) : (
              /* État vide (rounded-2xl) */
              <View className="items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 dark:border-[#1A1A1A] bg-zinc-50 dark:bg-[#0A0A0A] py-12 px-6">
                <View className="h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-[#1A1A1A] mb-4">
                  <Laptop size={24} color="#F97316" strokeWidth={2.5} />
                </View>
                <Text className="text-center text-sm font-black uppercase tracking-widest text-zinc-950 dark:text-white">
                  Aucun appareil secondaire
                </Text>
                <Text className="text-center text-xs font-bold text-zinc-400 mt-2">
                  Scannez un QR code pour associer un nouvel appareil.
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}