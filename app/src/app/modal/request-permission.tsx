import { Camera } from "expo-camera";
import * as FileSystem from "expo-file-system/legacy";
import { router } from "expo-router";
import {
  Camera as CameraIcon,
  CheckCircle2,
  FolderOpen,
  ShieldCheck
} from "lucide-react-native";
import React, { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  View
} from "react-native";
import Animated, {
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Types
type PermStatus = "idle" | "granted" | "denied";

interface Permission {
  key:      string;
  label:    string;
  desc:     string;
  required: boolean;
  icon:     React.ElementType;
  request:  () => Promise<PermStatus>;
}

// Définitions des Permissions
const PERMISSIONS: Permission[] = [
  {
    key:      "camera",
    label:    "Caméra",
    desc:     "Scanner des QR codes, photos de profil et pièces jointes",
    required: true,
    icon:      CameraIcon,
    request:  async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      return status === "granted" ? "granted" : "denied";
    },
  },
  {
    key:      "files",
    label:    "Espace de stockage",
    desc:     "Autoriser l'application à enregistrer et lire les documents partagés",
    required: true,
    icon:      FolderOpen,
    request:  async () => {
      return "granted";
    },
  },
];

// Composant PermissionItem
function PermissionItem({
  perm,
  status,
  index,
}: {
  perm: Permission;
  status: PermStatus;
  index: number;
}) {
  const Icon = perm.icon;
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePressIn = () => { scale.value = withTiming(0.98, { duration: 100 }); };
  const handlePressOut = () => { scale.value = withSpring(1); };

  return (
    <Animated.View entering={FadeInUp.delay(index * 60).springify()}>
      <Animated.View style={animStyle}>
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          className="flex-row items-center gap-x-3.5 p-4 mb-3 rounded-2xl border border-zinc-100 bg-white dark:border-zinc-900 dark:bg-zinc-900"
        >
          {/* Icône enveloppée */}
          <View className="bg-zinc-50 dark:bg-zinc-800 h-10 w-10 items-center justify-center rounded-xl">
            <Icon size={16} color="#71717A" strokeWidth={2} />
          </View>

          {/* Textes explicatifs */}
          <View className="flex-1">
            <Text className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
              {perm.label}
            </Text>
            <Text className="text-xs font-medium text-zinc-400 dark:text-zinc-500 mt-0.5 leading-4">
              {perm.desc}
            </Text>
          </View>

          {/* États et Badges à droite */}
          <View className="flex-shrink-0">
            {status === "granted" ? (
              <View className="h-6 w-6 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/20">
                <CheckCircle2 size={14} color="#10B981" strokeWidth={2.5} />
              </View>
            ) : status === "denied" ? (
              <View className="rounded-lg bg-red-50 border border-red-100 dark:bg-red-950/20 dark:border-red-900/30 px-2 py-0.5">
                <Text className="text-[10px] font-bold text-red-500 dark:text-red-400 uppercase tracking-wide">Refusé</Text>
              </View>
            ) : (
              <View className={`rounded-lg px-2 py-0.5 border ${
                perm.required 
                  ? 'bg-orange-50 border-orange-100 dark:bg-orange-950/20 dark:border-orange-900/30' 
                  : 'bg-zinc-50 border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700'
              }`}>
                <Text className={`text-[10px] font-bold uppercase tracking-wide ${
                  perm.required ? 'text-orange-500' : 'text-zinc-400 dark:text-zinc-500'
                }`}>
                  {perm.required ? "Requis" : "Optionnel"}
                </Text>
              </View>
            )}
          </View>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

// Écran Principal
export default function PermissionsScreen() {
  const insets = useSafeAreaInsets();
  const [statuses, setStatuses] = useState<Record<string, PermStatus>>(
    Object.fromEntries(PERMISSIONS.map(p => [p.key, "idle"]))
  );
  const [loading, setLoading] = useState(false);

  const allRequiredGranted = PERMISSIONS
    .filter(p => p.required)
    .every(p => statuses[p.key] === "granted");

  const handleRequestAll = async () => {
    setLoading(true);
    const next = { ...statuses };

    for (const perm of PERMISSIONS) {
      if (next[perm.key] === "granted") continue;
      try {
        next[perm.key] = await perm.request();
      } catch {
        next[perm.key] = "denied";
      }
      setStatuses({ ...next });
      await new Promise(r => setTimeout(r, 350));
    }

    setLoading(false);

    const requiredDenied = PERMISSIONS
      .filter(p => p.required)
      .some(p => next[p.key] === "denied");

    if (requiredDenied) {
      Alert.alert(
        "Permissions nécessaires",
        "Pour pouvoir échanger et stocker vos cours et documents sur PipoLink, l'accès à la caméra et au stockage est indispensable.",
        [
          { text: "Plus tard", style: "cancel" },
          { text: "Ouvrir les paramètres", onPress: () => {} },
        ]
      );
    } else {
      router.replace("/(tabs)");
    }
  };

  const handleSkip = () => {
    if (!allRequiredGranted) {
      Alert.alert(
        "Continuer sans permissions ?",
        "Certaines fonctionnalités clés de PipoLink ne seront pas disponibles tant que les accès requis ne seront pas accordés.",
        [
          { text: "Annuler", style: "cancel" },
          { text: "Continuer", onPress: () => router.replace("/(tabs)") },
        ]
      );
    } else {
      router.replace("/(tabs)");
    }
  };

  return (
    <View 
      className="flex-1 bg-zinc-50 dark:bg-zinc-950" 
      style={{ paddingBottom: insets.bottom + 16, paddingTop: insets.top + 8 }}
    >
      {/* Zone d'en-tête (Hero) */}
      <Animated.View entering={FadeInUp.delay(0).springify()} className="items-center px-7 pt-6 pb-6">
        <View className="h-14 w-14 items-center justify-center rounded-xl mb-4 bg-white border border-zinc-100 dark:bg-zinc-900 dark:border-zinc-800">
          <ShieldCheck size={24} color="#F97316" strokeWidth={1.8} />
        </View>
        <Text className="text-base font-bold text-zinc-900 dark:text-zinc-50 mb-1.5">
          Autorisations requises
        </Text>
        <Text className="text-xs font-medium text-center text-zinc-400 dark:text-zinc-500 leading-5 px-3">
          PipoLink requiert ces accès afin de valider vos documents d'étude, téléverser vos fichiers de stockage et sécuriser votre terminal.
        </Text>
      </Animated.View>

      {/* Liste défilante des permissions */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4 }}
        showsVerticalScrollIndicator={false}
      >
        {PERMISSIONS.map((perm, i) => (
          <PermissionItem
            key={perm.key}
            perm={perm}
            status={statuses[perm.key]}
            index={i}
          />
        ))}
      </ScrollView>

      {/* Pied de page (Actions de validation) */}
      <View className="px-4 py-4 gap-y-2.5">
        <Pressable
          onPress={handleRequestAll}
          disabled={loading}
          className="h-11 items-center justify-center rounded-xl bg-orange-500 active:bg-orange-600"
          style={{ opacity: loading ? 0.7 : 1 }}
        >
          <Text className="text-xs font-bold text-white uppercase tracking-wider">
            {loading ? "Vérification en cours…" : "Autoriser les accès"}
          </Text>
        </Pressable>

        <Pressable 
          onPress={handleSkip} 
          className="h-11 items-center justify-center rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 active:bg-zinc-50 dark:active:bg-zinc-800"
        >
          <Text className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
            Configurer plus tard
          </Text>
        </Pressable>
      </View>
    </View>
  );
}