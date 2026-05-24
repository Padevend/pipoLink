// app/onboarding/permissions.tsx
// Écran de demande de permissions — PipoLink

import { BRAND } from "@/shared/config/brand";
import { Audio } from "expo-av";
import { Camera } from "expo-camera";
import { router } from "expo-router";
import {
    Camera as CameraIcon,
    CheckCircle2,
    Mic,
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

// ─── Types ────────────────────────────────────────────────────────────────────

type PermStatus = "idle" | "granted" | "denied";

interface Permission {
  key:      string;
  label:    string;
  desc:     string;
  required: boolean;
  icon:     React.ElementType;
  color:    string;
  bgClass:  string; // Classes Tailwind adaptatives pour le fond de l'icône
  request:  () => Promise<PermStatus>;
}

// ─── Définitions des Permissions ──────────────────────────────────────────────

const PERMISSIONS: Permission[] = [
  {
    key:      "camera",
    label:    "Caméra",
    desc:     "Scanner des QR codes, photo de profil et documents",
    required: true,
    icon:      CameraIcon,
    color:    "#818cf8",
    bgClass:  "bg-indigo-500/10 dark:bg-indigo-500/20 border-indigo-500/10",
    request:  async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      return status === "granted" ? "granted" : "denied";
    },
  },
  {
    key:      "microphone",
    label:    "Microphone",
    desc:     "Messages vocaux dans les conversations",
    required: false,
    icon:      Mic,
    color:    "#f87171",
    bgClass:  "bg-red-500/10 dark:bg-red-500/20 border-red-500/10",
    request:  async () => {
      const { status } = await Audio.requestPermissionsAsync();
      return status === "granted" ? "granted" : "denied";
    },
  },
];

// ─── Composant PermissionItem ──────────────────────────────────────────────────

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
          className="flex-row items-center gap-x-3.5 p-3.5 mb-2.5 rounded-xl border border-border-light/30 bg-surface-light/40 dark:border-border-dark/10 dark:bg-surface-dark/40 backdrop-blur-md"
        >
          {/* Icône enveloppée */}
          <View className={`h-10 w-10 items-center justify-center rounded-xl border ${perm.bgClass}`}>
            <Icon size={16} color={perm.color} strokeWidth={2} />
          </View>

          {/* Textes explicatifs */}
          <View className="flex-1">
            <Text className="text-[14px] font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">
              {perm.label}
            </Text>
            <Text className="text-[12px] font-medium text-text-secondary-light/40 dark:text-text-secondary-dark/40 mt-0.5 leading-4">
              {perm.desc}
            </Text>
          </View>

          {/* États et Badges à droite */}
          <View className="flex-shrink-0">
            {status === "granted" ? (
              <View className="h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 size={13} className="text-emerald-500 dark:text-emerald-400" strokeWidth={2.5} />
              </View>
            ) : status === "denied" ? (
              <View className="rounded-md bg-red-500/10 border border-red-500/20 px-2 py-0.5">
                <Text className="text-[10px] font-bold text-red-500 dark:text-red-400 uppercase tracking-wide">Refusé</Text>
              </View>
            ) : (
              <View className={`rounded-md px-2 py-0.5 border ${
                perm.required 
                  ? 'bg-indigo-500/10 border-indigo-500/20' 
                  : 'bg-text-secondary-light/5 border-border-light/20 dark:border-border-dark/10'
              }`}>
                <Text className={`text-[10px] font-bold uppercase tracking-wide ${
                  perm.required ? 'text-indigo-500' : 'text-text-secondary-light/40 dark:text-text-secondary-dark/40'
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

// ─── Écran Principal ──────────────────────────────────────────────────────────

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
        "Certaines permissions obligatoires ont été refusées. Vous pouvez les activer manuellement dans Paramètres > Applications > PipoLink.",
        [
          { text: "Plus tard", style: "cancel" },
          { text: "Ouvrir les paramètres", onPress: () => { /* Linking.openSettings() */ } },
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
      className="flex-1 bg-background-light dark:bg-background-dark" 
      style={{ paddingBottom: insets.bottom + 16, paddingTop: insets.top + 8 }}
    >
      {/* Indicateur de progression Onboarding (Step dots) */}
      <View className="flex-row justify-center gap-x-1.5 py-3">
        <View className="w-1.5 h-1.5 rounded-full bg-text-secondary-light/10 dark:bg-text-secondary-dark/10" />
        <View className="h-1.5 rounded-full bg-indigo-500" style={{ width: 18 }} />
        <View className="w-1.5 h-1.5 rounded-full bg-text-secondary-light/10 dark:bg-text-secondary-dark/10" />
      </View>

      {/* Zone d'en-tête (Hero) */}
      <Animated.View entering={FadeInUp.delay(0).springify()} className="items-center px-7 py-5">
        <View className="h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 mb-4.5">
          <ShieldCheck size={26} className="text-indigo-500" strokeWidth={1.8} />
        </View>
        <Text className="text-[18px] font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark mb-1.5">
          Autorisations requises
        </Text>
        <Text className="text-[12px] font-medium text-center text-text-secondary-light/40 dark:text-text-secondary-dark/40 leading-5 px-3">
          PipoLink a besoin de quelques accès pour fonctionner correctement, distribuer vos documents et vous notifier en toute sécurité.
        </Text>
      </Animated.View>

      {/* Ligne de séparation épurée */}
      <View className="h-[0.5px] bg-border-light/20 dark:bg-border-dark/10" />

      {/* Liste défilante des permissions */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16 }}
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

      <View className="h-[0.5px] bg-border-light/20 dark:bg-border-dark/10" />

      {/* Pied de page (Actions de validation) */}
      <View className="px-4 pt-4 gap-y-2">
        <Pressable
          onPress={handleRequestAll}
          disabled={loading}
          className="h-11 items-center justify-center rounded-xl active:scale-[0.99] transition-transform"
          style={{ backgroundColor: BRAND.primary, opacity: loading ? 0.6 : 1 }}
        >
          <Text className="text-[13px] font-bold text-white uppercase tracking-wider">
            {loading ? "Vérification en cours…" : "Autoriser les accès"}
          </Text>
        </Pressable>

        <Pressable 
          onPress={handleSkip} 
          className="h-11 items-center justify-center rounded-xl border border-border-light/40 bg-surface-light dark:border-border-dark/20 dark:bg-surface-dark active:scale-[0.99] transition-transform"
        >
          <Text className="text-[12px] font-bold text-text-secondary-light/60 dark:text-text-secondary-dark/60 uppercase tracking-wide">
            Configurer plus tard
          </Text>
        </Pressable>

        <Text className="text-[10px] font-medium text-center text-text-secondary-light/30 dark:text-text-secondary-dark/30 pt-1 leading-4">
          Vos choix restent modifiables à tout moment.{"\n"}
          <Text className="text-indigo-500/70 font-semibold">Politique de confidentialité</Text>
        </Text>
      </View>
    </View>
  );
}