import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import {
  ArrowLeft,
  Keyboard,
  QrCode,
  ShieldCheck
} from "lucide-react-native";
import { useCallback, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { useApproveByCode } from "@/features/devices/hooks/use-approve-by-code";
import { useLinkDevice } from "@/features/devices/hooks/use-link-device";
import {
  parseDeviceQrPayload,
  verifyDeviceQrPayloadSignature,
} from "@/features/devices/lib/verify-qr-payload";
import { useToast } from "@/providers";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/utils/cn";

type Tab = "scan" | "code";

export default function DeviceScanScreen() {
  const [tab, setTab] = useState<Tab>("scan");
  const [permission, requestPermission] = useCameraPermissions();
  const [shortCode, setShortCode] = useState("");
  const [scanned, setScanned] = useState(false);
  const linkMutation = useLinkDevice();
  const codeMutation = useApproveByCode();
  const { showToast } = useToast();
  const linkingRef = useRef(false);
  const insets = useSafeAreaInsets();

  const handleLinkQr = useCallback(
    async (raw: string): Promise<void> => {
      const trimmed = raw.trim();
      if (!trimmed || linkingRef.current) return;

      const parsed = parseDeviceQrPayload(trimmed);
      if (!parsed) {
        showToast({ type: "error", message: "QR invalide." });
        return;
      }
      if (!verifyDeviceQrPayloadSignature(parsed)) {
        showToast({ type: "error", message: "Signature invalide." });
        return;
      }

      linkingRef.current = true;
      try {
        await linkMutation.mutateAsync(parsed);
        showToast({
          type: "success",
          message: "Appareil secondaire approuvé.",
        });
        router.replace("/devices");
      } catch (e: unknown) {
        showToast({
          type: "error",
          message: e instanceof Error ? e.message : "Échec de l'approbation.",
        });
        setScanned(false);
        linkingRef.current = false;
      }
    },
    [linkMutation, showToast],
  );

  const handleApproveCode = async () => {
    try {
      await codeMutation.mutateAsync(shortCode);
      showToast({ type: "success", message: "Appareil associé via le code." });
      router.replace("/devices");
    } catch (e: unknown) {
      showToast({
        type: "error",
        message: e instanceof Error ? e.message : "Code invalide ou expiré.",
      });
    }
  };

  return (
    <View className="flex-1 bg-black">
      {/* Caméra arrière-plan */}
      {tab === "scan" && permission?.granted ? (
        <CameraView
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={(event) => {
            if (event.data && !scanned && !linkMutation.isPending) {
              setScanned(true);
              void handleLinkQr(event.data);
            }
          }}
        />
      ) : (
        <View className="absolute inset-0 bg-zinc-950" />
      )}

      {/* Interface utilisateur solide */}
      <SafeAreaView className="flex-1" edges={["top", "bottom", "left", "right"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={insets.top}
          className="flex-1 justify-between px-6 py-6"
        >
          {/* BARRE SUPÉRIEURE : Néo-banque, Plat et Solide */}
          <View className="flex-row items-center justify-between rounded-2xl bg-zinc-900/90 border border-zinc-800 px-4 py-3">
            <Pressable
              onPress={() => router.back()}
              className="h-10 w-10 items-center justify-center rounded-full bg-zinc-800 active:opacity-80 transition-opacity"
            >
              <ArrowLeft size={18} color="#F97316" strokeWidth={2.5} />
            </Pressable>

            <View className="items-center">
              <Text className="text-sm font-black tracking-tight text-white">
                Approuver un appareil
              </Text>
              <Text className="text-[10px] font-black uppercase tracking-widest text-orange-500 mt-0.5">
                Principal uniquement
              </Text>
            </View>

            <View className="w-10" />
          </View>

          {/* CONTENU CENTRAL PLAT */}
          <View className="flex-1 items-center justify-center my-4">
            {tab === "scan" ? (
              !permission?.granted ? (
                <View className="rounded-2xl bg-zinc-900/90 border border-zinc-800 p-6 items-center max-w-xs">
                  <Text className="text-zinc-300 text-center text-xs font-bold leading-relaxed mb-6">
                    L'accès à la caméra est nécessaire pour scanner le QR Code de validation.
                  </Text>
                  <Button
                    label="Autoriser la caméra"
                    size="lg"
                    onPress={() => void requestPermission()}
                    leftIcon={<ShieldCheck size={18} color="#FFFFFF" strokeWidth={2.5} />}
                    className="rounded-full bg-orange-500 h-14 w-full"
                  />
                </View>
              ) : (
                /* Viseur Géométrique Strict Orange */
                <View className="w-64 h-64 items-center justify-center">
                  <View className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-orange-500 rounded-tl-xl" />
                  <View className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-orange-500 rounded-tr-xl" />
                  <View className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-orange-500 rounded-bl-xl" />
                  <View className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-orange-500 rounded-br-xl" />

                  <Text className="text-zinc-400 text-[10px] font-black uppercase tracking-widest text-center px-4">
                    Alignez le QR Code
                  </Text>
                </View>
              )
            ) : (
              /* Onglet Code Manuel : Panneau Solide Mat */
              <View className="w-full rounded-2xl bg-zinc-900/90 border border-zinc-800 p-6">
                <View className="flex-row items-center gap-3 mb-6">
                  <View className="h-10 w-10 items-center justify-center rounded-xl bg-zinc-800">
                    <ShieldCheck size={20} color="#F97316" strokeWidth={2.5} />
                  </View>
                  <Text className="text-xs font-bold text-zinc-300 flex-1 leading-relaxed">
                    Saisissez le code d'authentification émis par votre appareil secondaire.
                  </Text>
                </View>

                <TextInput
                  value={shortCode}
                  onChangeText={(t) =>
                    setShortCode(
                      t
                        .toUpperCase()
                        .replace(/[^A-Z0-9]/g, "")
                        .slice(0, 6),
                    )
                  }
                  placeholder="ABC123"
                  placeholderTextColor="#52525B"
                  autoCapitalize="characters"
                  maxLength={6}
                  className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-950 py-4 text-center text-2xl font-black tracking-[8px] text-white"
                />

                <Button
                  label="Valider l'association"
                  loading={codeMutation.isPending}
                  disabled={shortCode.length < 4}
                  onPress={() => void handleApproveCode()}
                  size="lg"
                  className="bg-orange-500 rounded-full h-14"
                />
              </View>
            )}
          </View>

          {/* COMMUTATEUR D'ONGLETS NÉO-BANQUE (rounded-full) */}
          <View className="flex-row rounded-full bg-zinc-900/90 border border-zinc-800 p-1.5">
            <Pressable
              onPress={() => setTab("scan")}
              className={cn(
                "flex-row items-center justify-center flex-1 py-3.5 gap-x-2.5 rounded-full transition-all",
                tab === "scan" ? "bg-white" : "bg-transparent",
              )}
            >
              <QrCode
                size={16}
                color={tab === "scan" ? "#0A0A0A" : "#A1A1AA"}
                strokeWidth={2.5}
              />
              <Text
                className={cn(
                  "text-xs font-black tracking-tight",
                  tab === "scan" ? "text-zinc-950" : "text-zinc-400",
                )}
              >
                Scanner le QR
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setTab("code")}
              className={cn(
                "flex-row items-center justify-center flex-1 py-3.5 gap-x-2.5 rounded-full transition-all",
                tab === "code" ? "bg-white" : "bg-transparent",
              )}
            >
              <Keyboard
                size={16}
                color={tab === "code" ? "#0A0A0A" : "#A1A1AA"}
                strokeWidth={2.5}
              />
              <Text
                className={cn(
                  "text-xs font-black tracking-tight",
                  tab === "code" ? "text-zinc-950" : "text-zinc-400",
                )}
              >
                Code manuel
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}