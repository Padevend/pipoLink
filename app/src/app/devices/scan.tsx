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
          className="flex-1 justify-between px-4 py-4"
        >
          {/* BARRE SUPÉRIEURE : Boîte Mat Solide */}
          <View className="flex-row items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 p-2">
            <Pressable
              onPress={() => router.back()}
              className="h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 border border-zinc-700 active:bg-zinc-700"
            >
              <ArrowLeft size={14} color="#FFFFFF" />
            </Pressable>

            <View className="items-center">
              <Text className="text-xs font-bold tracking-tight text-white">
                Approuver un appareil
              </Text>
              <Text className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 mt-0.5">
                Principal uniquement
              </Text>
            </View>

            <View className="w-8" />
          </View>

          {/* CONTENU CENTRAL MAT */}
          <View className="flex-1 items-center justify-center my-4">
            {tab === "scan" ? (
              !permission?.granted ? (
                <View className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 items-center max-w-[280px]">
                  <Text className="text-zinc-300 text-center text-xs font-semibold mb-4 leading-5">
                    L'accès à la caméra est nécessaire pour scanner le QR Code de validation.
                  </Text>
                  <Button
                    label="Autoriser la caméra"
                    size="sm"
                    onPress={() => void requestPermission()}
                    leftIcon={<ShieldCheck size={12} color="#FFFFFF" />}
                    className="rounded-xl bg-orange-500 h-9"
                  />
                </View>
              ) : (
                /* Viseur Géométrique Strict Orange */
                <View className="w-56 h-56 items-center justify-center">
                  <View className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-orange-500 rounded-tl-md" />
                  <View className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-orange-500 rounded-tr-md" />
                  <View className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-orange-500 rounded-bl-md" />
                  <View className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-orange-500 rounded-br-md" />

                  <Text className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest text-center px-4">
                    Alignez le QR Code
                  </Text>
                </View>
              )
            ) : (
              /* Onglet Code Manuel : Panneau Solide Mat */
              <View className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-5">
                <View className="flex-row items-center gap-x-2.5 mb-4">
                  <View className="h-6 w-6 items-center justify-center rounded-md bg-zinc-800 border border-zinc-700">
                    <ShieldCheck size={12} color="#F97316" />
                  </View>
                  <Text className="text-xs font-semibold text-zinc-300 flex-1 leading-5">
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
                  className="mb-4 rounded-xl border border-zinc-800 bg-zinc-950 py-3 text-center text-2xl font-bold tracking-[6px] text-white"
                />

                <Button
                  label="Valider l'association"
                  loading={codeMutation.isPending}
                  disabled={shortCode.length < 4}
                  onPress={() => void handleApproveCode()}
                  className="bg-orange-500 rounded-xl h-11"
                />
              </View>
            )}
          </View>

          {/* COMMUTATEUR D'ONGLETS MAT NOIR/BLANC */}
          <View className="flex-row rounded-xl border border-zinc-800 bg-zinc-900 p-1">
            <Pressable
              onPress={() => setTab("scan")}
              className={cn(
                "flex-row items-center justify-center flex-1 py-2.5 gap-x-2 rounded-lg",
                tab === "scan" ? "bg-white" : "bg-transparent",
              )}
            >
              <QrCode
                size={14}
                color={tab === "scan" ? "#18181B" : "#A1A1AA"}
              />
              <Text
                className={cn(
                  "text-xs font-bold tracking-tight",
                  tab === "scan" ? "text-zinc-900" : "text-zinc-400",
                )}
              >
                Scanner le QR
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setTab("code")}
              className={cn(
                "flex-row items-center justify-center flex-1 py-2.5 gap-x-2 rounded-lg",
                tab === "code" ? "bg-white" : "bg-transparent",
              )}
            >
              <Keyboard
                size={14}
                color={tab === "code" ? "#18181B" : "#A1A1AA"}
              />
              <Text
                className={cn(
                  "text-xs font-bold tracking-tight",
                  tab === "code" ? "text-zinc-900" : "text-zinc-400",
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