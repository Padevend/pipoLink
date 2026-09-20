import { Camera } from "expo-camera";
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
          className="flex-row items-center gap-x-4 p-5 mb-3 rounded-2xl"
        >
          {/* Icône enveloppée (rounded-full) */}
          <View className="bg-white dark:bg-[#222222] h-12 w-12 items-center justify-center rounded-full">
            <Icon size={20} color="#F97316" strokeWidth={2.5} />
          </View>

          {/* Textes explicatifs */}
          <View className="flex-1 justify-center pr-2">
            <Text className="text-sm font-bold tracking-tight text-zinc-950 dark:text-white" numberOfLines={1}>
              {perm.label}
            </Text>
            <Text className="text-[10px] font-semibold text-zinc-400 mt-1 leading-relaxed">
              {perm.desc}
            </Text>
          </View>

          {/* États et Badges à droite */}
          <View className="flex-shrink-0">
            {status === "granted" ? (
              <View className="h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 size={16} color="#10B981" strokeWidth={3} />
              </View>
            ) : status === "denied" ? (
              <View className="rounded-full bg-red-500/10 border border-red-500/20 px-3 py-1">
                <Text className="text-[10px] font-black uppercase tracking-widest text-red-500">Refusé</Text>
              </View>
            ) : (
              <View className={`rounded-full px-3.5 py-1.5 ${
                perm.required 
                  ? 'bg-orange-500/10 border border-orange-500/20' 
                  : 'bg-white dark:bg-[#222222]'
              }`}>
                <Text className={`text-[10px] font-black uppercase tracking-widest ${
                  perm.required ? 'text-orange-500' : 'text-zinc-500 dark:text-zinc-400'
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
      className="flex-1 bg-white dark:bg-[#0A0A0A]" 
      style={{
        paddingBottom: insets.bottom + 24,
        paddingTop: insets.top + 12,
        paddingLeft: insets.left + 24,
        paddingRight: insets.right + 24
      }}
    >
      {/* Zone d'en-tête (Hero) */}
      <Animated.View entering={FadeInUp.delay(0).springify()} className="items-center pt-6 pb-8">
        <View className="h-20 w-20 items-center justify-center rounded-full mb-5 bg-zinc-100 dark:bg-[#1A1A1A]">
          <ShieldCheck size={32} color="#F97316" strokeWidth={2.5} />
        </View>
        <Text className="text-xl font-black tracking-tight text-zinc-950 dark:text-white mb-2 text-center">
          Autorisations requises
        </Text>
        <Text className="text-xs font-bold text-center text-zinc-500 dark:text-zinc-400 leading-relaxed px-2">
          PipoLink requiert ces accès afin de valider vos documents d'étude, téléverser vos fichiers de stockage et sécuriser votre terminal.
        </Text>
      </Animated.View>

      {/* Liste défilante des permissions */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: 4 }}
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
      <View className="py-4 gap-y-3">
        <Pressable
          onPress={handleRequestAll}
          disabled={loading}
          className="h-14 items-center justify-center rounded-full bg-orange-500 active:opacity-80 transition-opacity"
          style={{ opacity: loading ? 0.7 : 1 }}
        >
          <Text className="text-xs font-black uppercase tracking-widest text-white">
            {loading ? "Vérification en cours…" : "Autoriser les accès"}
          </Text>
        </Pressable>

        <Pressable 
          onPress={handleSkip} 
          className="h-14 items-center justify-center rounded-full bg-zinc-100 dark:bg-[#1A1A1A] active:opacity-80 transition-opacity"
        >
          <Text className="text-xs font-black uppercase tracking-widest text-zinc-950 dark:text-white">
            Configurer plus tard
          </Text>
        </Pressable>
      </View>
    </View>
  );
}