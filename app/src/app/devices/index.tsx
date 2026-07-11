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
        className="flex-1 bg-white dark:bg-zinc-950"
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
        className="flex-1 bg-white dark:bg-zinc-950"
        edges={["top", "left", "right"]}
      >
        {/* HEADER RESTREINT : Panneau Mat Solide */}
        <View className="flex-row items-center border-b border-zinc-100 bg-white px-4 py-3 dark:border-zinc-900 dark:bg-zinc-950">
          <Pressable
            onPress={() => router.back()}
            className="h-8 w-8 items-center justify-center rounded-lg bg-zinc-50 border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 active:bg-zinc-100 dark:active:bg-zinc-800"
          >
            <ArrowLeft size={14} color="#71717A" />
          </Pressable>
          <Text className="flex-1 ml-3 text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Appareils liés
          </Text>
        </View>

        <View className="flex-1 items-center justify-center px-4 pb-12">
          <View className="h-12 w-12 items-center justify-center rounded-xl bg-red-50 border border-red-200 dark:bg-red-950/30 dark:border-red-900 mb-4">
            <ShieldAlert size={20} color="#EF4444" />
          </View>
          <Text className="text-center text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-1">
            Accès restreint
          </Text>
          <Text className="text-center text-xs font-semibold leading-5 text-zinc-400 dark:text-zinc-500">
            Disponible uniquement sur l'appareil principal
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      className="flex-1 bg-white dark:bg-zinc-950"
      edges={["top", "left", "right"]}
    >
      {/* HEADER PRINCIPAL : Panneau Mat Solide */}
      <View className="flex-row items-center justify-between border-b border-zinc-100 bg-white px-4 py-3 dark:border-zinc-900 dark:bg-zinc-950">
        <View className="flex-row items-center flex-1">
          <Pressable
            onPress={() => router.back()}
            className="h-8 w-8 items-center justify-center rounded-lg bg-zinc-50 border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 active:bg-zinc-100 dark:active:bg-zinc-800"
          >
            <ArrowLeft size={14} color="#71717A" />
          </Pressable>
          <Text className="ml-3 text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Appareils liés
          </Text>
        </View>

        {/* Bouton d'action Géométrique Mat */}
        <Pressable
          onPress={() => router.push("/devices/scan")}
          className="h-8 w-8 items-center justify-center rounded-lg bg-zinc-50 border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 active:bg-zinc-100 dark:active:bg-zinc-800"
        >
          <Plus size={14} color="#F97316" />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 20,
          paddingBottom: insets.bottom + 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Description contextuelle discrète en entête */}
        <Text className="mb-5 text-xs font-semibold leading-5 text-zinc-400 dark:text-zinc-500">
          Appareils secondaires (principal uniquement)
        </Text>

        {isLoading ? (
          <View className="py-8">
            <Loader />
          </View>
        ) : (
          <>
            <Text className="mb-2 ml-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Appareils autorisés
            </Text>

            {secondaryDevices.length > 0 ? (
              /* Enveloppe de liste mate unifiée */
              <View className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
                {secondaryDevices.map((device, index) => (
                  <View key={device.id}>
                    {index > 0 && (
                      <View className="mx-4 h-[1px] bg-zinc-150 dark:bg-zinc-900" />
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
              /* État vide soigné et géométrique */
              <View className="items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50/50 py-8 dark:border-zinc-800 dark:bg-zinc-900/20">
                <View className="h-10 w-10 items-center justify-center rounded-lg bg-zinc-50 border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 mb-3">
                  <Laptop size={16} color="#A1A1AA" />
                </View>
                <Text className="text-center text-xs font-semibold text-zinc-400 dark:text-zinc-500">
                  Aucun appareil secondaire lié.
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}