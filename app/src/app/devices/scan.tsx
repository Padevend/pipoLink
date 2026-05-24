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
import { SafeAreaView } from "react-native-safe-area-context";

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
      router.replace("/devices" as any);
    } catch (e: unknown) {
      showToast({
        type: "error",
        message: e instanceof Error ? e.message : "Code invalide ou expiré.",
      });
    }
  };

  return (
    <View className="flex-1 bg-black">
      {/* Caméra en arrière-plan plein écran (Full Cover) */}
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
        <View className="absolute inset-0 bg-slate-950" />
      )}

      {/* Superposition des contrôles UI */}
      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 justify-between px-6 py-4"
        >
          {/* BARRE SUPÉRIEURE TRANSLUCIDE */}
          <View className="flex-row items-center justify-between rounded-2xl border border-white/10 bg-black/40 p-2 backdrop-blur-md">
            <Pressable
              onPress={() => router.back()}
              className="h-9 w-9 items-center justify-center active:scale-95 transition-transform"
            >
              <ArrowLeft size={20} color="#FFFFFF" />
            </Pressable>

            <View className="items-center">
              <Text className="text-[14px] font-bold tracking-tight text-white">
                Approuver un appareil
              </Text>
              <Text className="text-[9px] font-bold uppercase tracking-wider text-white/50 mt-0.5">
                Principal uniquement
              </Text>
            </View>

            <View className="w-9" />
          </View>

          <View className="flex-1 items-center justify-center my-6">
            {tab === "scan" ? (
              !permission?.granted ? (
                <View className="rounded-2xl border border-white/10 bg-black/60 p-6 items-center max-w-[280px] backdrop-blur-md">
                  <Text className="text-white text-center text-xs font-medium mb-4 leading-[18px]">
                    L'accès à la caméra est nécessaire pour scanner le QR Code
                    de validation.
                  </Text>
                  <Button
                    label="Autoriser la caméra"
                    size="sm"
                    onPress={() => void requestPermission()}
                    leftIcon={<ShieldCheck size={14} color="#FFFFFF" />}
                    className="rounded-xl text-center"
                  />
                </View>
              ) : (
                /* Viseur cyber-minimaliste */
                <View className="w-64 h-64 items-center justify-center">
                  {/* Les 4 coins du viseur */}
                  <View className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-xl" />
                  <View className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-xl" />
                  <View className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-xl" />
                  <View className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-xl" />

                  {/* Animation discrète ou texte indicateur */}
                  <Text className="text-white/40 text-[11px] font-bold uppercase tracking-widest text-center px-4">
                    Alignez le QR Code
                  </Text>
                </View>
              )
            ) : (
              /* Onglet 2 : Boîte de Saisie de Code Invisible/Translucide */
              <View className="w-full rounded-3xl border border-white/10 bg-black/60 p-6 backdrop-blur-md">
                <View className="flex-row items-center gap-2.5 mb-4">
                  <View className="h-7 w-7 items-center justify-center rounded-lg bg-white/10 border border-white/10">
                    <ShieldCheck size={14} color="#FFFFFF" />
                  </View>
                  <Text className="text-[13px] font-medium text-white/80 flex-1 leading-[18px]">
                    Saisissez le code d'authentification émis par votre appareil
                    secondaire.
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
                  placeholderTextColor="rgba(255,255,255,0.15)"
                  autoCapitalize="characters"
                  maxLength={6}
                  className="mb-5 rounded-2xl border border-white/10 bg-white/5 py-4 text-center text-3xl font-bold tracking-[8px] text-white"
                />

                <Button
                  label="Valider l'association"
                  size="lg"
                  loading={codeMutation.isPending}
                  disabled={shortCode.length < 4}
                  onPress={() => void handleApproveCode()}
                  className="rounded-xl h-12"
                />
              </View>
            )}
          </View>

          {/* COMMUTATEUR D'ONGLETS INFÉRIEUR TRANSPARENT */}
          <View className="flex-row rounded-2xl border border-white/10 bg-black/40 p-1.5 backdrop-blur-md">
            <Pressable
              onPress={() => setTab("scan")}
              className={cn(
                "flex-row items-center justify-center flex-1 py-3.5 gap-2 rounded-xl transition-all active:scale-[0.98]",
                tab === "scan" ? "bg-white " : "bg-transparent",
              )}
            >
              <QrCode
                size={16}
                color={tab === "scan" ? "#000000" : "#FFFFFF"}
              />
              <Text
                className={cn(
                  "text-[13px] font-bold tracking-tight",
                  tab === "scan" ? "text-black" : "text-white",
                )}
              >
                Scanner le QR
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setTab("code")}
              className={cn(
                "flex-row items-center justify-center flex-1 py-3.5 gap-2 rounded-xl transition-all active:scale-[0.98]",
                tab === "code" ? "bg-white " : "bg-transparent",
              )}
            >
              <Keyboard
                size={16}
                color={tab === "code" ? "#000000" : "#FFFFFF"}
              />
              <Text
                className={cn(
                  "text-[13px] font-bold tracking-tight",
                  tab === "code" ? "text-black" : "text-white",
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
