import { router } from "expo-router";
import { ArrowLeft, Laptop, Plus, ShieldAlert } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { DeviceItem } from "@/features/devices/components/device-item";
import { useDevices } from "@/features/devices/hooks/use-devices";
import { useIsPrimaryDevice } from "@/features/devices/hooks/use-is-primary-device";
import { useRemoveDevice } from "@/features/devices/hooks/use-remove-device";
import { BRAND } from "@/shared/config/brand";
import { Loader } from "@/shared/ui/loader";

export default function DevicesScreen(): JSX.Element {
  const { t } = useTranslation("settings");
  const { data, isLoading } = useDevices();
  const { data: isPrimary, isLoading: checkingPrimary } = useIsPrimaryDevice();
  const removeMutation = useRemoveDevice();

  const secondaryDevices = (data ?? []).filter((d) => !d.isPrimary);

  if (checkingPrimary) {
    return (
      <SafeAreaView
        className="flex-1 bg-background-light dark:bg-background-dark"
        edges={["top"]}
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
        className="flex-1 bg-background-light dark:bg-background-dark"
        edges={["top"]}
      >
        {/* Header Translucide Minimal */}
        <View className="z-10 flex-row items-center border-b border-border-light/20 bg-surface-light/75 px-4 py-3.5 dark:border-border-dark/10 dark:bg-surface-dark/75 backdrop-blur-xl ">
          <Pressable
            onPress={() => router.back()}
            className="h-9 w-9 items-center justify-center active:scale-95 transition-transform"
          >
            <ArrowLeft
              size={20}
              className="text-text-primary-light dark:text-text-primary-dark"
            />
          </Pressable>
          <Text className="flex-1 ml-3 text-[17px] font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">
            {t("linkedDevices")}
          </Text>
        </View>

        <View className="flex-1 items-center justify-center px-8 pb-12">
          <View className="h-14 w-14 items-center justify-center rounded-2xl bg-error/10 border border-error/10 mb-4 ">
            <ShieldAlert size={24} color="#EF4444" />
          </View>
          <Text className="text-center text-[15px] font-semibold tracking-tight text-text-primary-light dark:text-text-primary-dark mb-2">
            Accès restreint
          </Text>
          <Text className="text-center text-xs leading-[20px] text-text-secondary-light/70 dark:text-text-secondary-dark/70">
            {t("primaryOnly")}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      className="flex-1 bg-background-light dark:bg-background-dark"
      edges={["top"]}
    >
      {/* Header Translucide complet Style Glassmorphism */}
      <View className="z-10 flex-row items-center justify-between border-b border-border-light/20 bg-surface-light/75 px-4 py-3.5 dark:border-border-dark/10 dark:bg-surface-dark/75 backdrop-blur-xl ">
        <View className="flex-row items-center flex-1">
          <Pressable
            onPress={() => router.back()}
            className="h-9 w-9 items-center justify-center rounded-full active:scale-95 transition-transform"
          >
            <ArrowLeft size={20} color="#64748B" />
          </Pressable>
          <Text className="ml-3 text-[17px] font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">
            {t("linkedDevices")}
          </Text>
        </View>

        <Pressable
          onPress={() => router.push("/devices/scan")}
          className="h-9 w-9 items-center justify-center rounded-full bg-primary/10 border border-primary/10 active:scale-95 transition-transform "
        >
          <Plus size={18} color={BRAND.primary} />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Description contextuelle discrète en entête */}
        <Text className="mb-6 px-1 text-xs leading-[18px] text-text-secondary-light/70 dark:text-text-secondary-dark/70">
          {t("linkedDevicesDesc")}
        </Text>

        {isLoading ? (
          <View className="py-8">
            <Loader />
          </View>
        ) : (
          <>
            <Text className="mb-2.5 ml-3 text-[10px] font-bold uppercase tracking-widest text-text-secondary-light/60 dark:text-text-secondary-dark/60">
              Appareils autorisés
            </Text>

            {secondaryDevices.length > 0 ? (
              /* Enveloppe de liste satinée et contiguë */
              <View className="overflow-hidden rounded-2xl border border-border-light/40 bg-surface-light/50 dark:border-border-dark/20 dark:bg-surface-dark/40 backdrop-blur-md ">
                {secondaryDevices.map((device, index) => (
                  <View key={device.id}>
                    {index > 0 && (
                      <View className="mx-4 h-[0.5px] bg-border-light/10 dark:bg-border-dark/5" />
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
              /* État vide soigné */
              <View className="items-center justify-center rounded-2xl border border-border-light/40 bg-surface-light/30 py-10 dark:border-border-dark/10 dark:bg-surface-dark/20 backdrop-blur-sm">
                <View className="h-11 w-11 items-center justify-center rounded-xl bg-text-secondary-light/5 border border-border-light/10 mb-3 ">
                  <Laptop size={18} color="#64748B" />
                </View>
                <Text className="text-center text-xs font-medium text-text-secondary-light/60 dark:text-text-secondary-dark/60">
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
