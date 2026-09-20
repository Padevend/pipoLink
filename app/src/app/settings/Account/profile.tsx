import { router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth, useToast } from "@/providers";
import { queryClient } from "@/providers/query-provider";
import { userApi } from "@/shared/api/user";
import { patchCurrentUserAvatar } from "@/shared/lib/query-cache";
import { getStaticUri } from "@/shared/lib/static";
import { AvatarPicker } from "@/shared/ui/avatar-picker";
import { Button } from "@/shared/ui/button";
import { GenderPicker, type GenderId } from "@/shared/ui/gender-picker";
import { Input } from "@/shared/ui/input";
import { LevelPicker } from "@/shared/ui/level-picker";
import { PhoneInput } from "@/shared/ui/phone-input";

export default function ProfileSettingsScreen(): JSX.Element {
  const { t } = useTranslation("common");
  const insets = useSafeAreaInsets();
  
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<GenderId | undefined>();
  const [niveau, setNiveau] = useState<string | undefined>();
  const [filiere, setFiliere] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const p = user.profile;
    setFirstname(p?.firstname ?? "");
    setLastname(p?.lastname ?? "");
    setUsername(user.username ?? "");
    setPhone(p?.phone ?? "");
    setGender(p?.gender as GenderId | undefined);
    setNiveau(p?.niveau ?? undefined);
    setFiliere(p?.filiere ?? "");
    setBio(p?.bio ?? "");
    setAvatarUri(p?.avatarUrl ?? null);
    setLoading(false);
  }, [user]);

  const save = async () => {
    setSaving(true);
    try {
      await userApi.updateProfile({
        firstname,
        lastname,
        phone: phone || undefined,
        gender,
        niveau,
        filiere,
        bio,
      });
      if (avatarUri && !avatarUri.startsWith("/storage")) {
        const { avatarUrl } = await userApi.uploadAvatar(avatarUri);
        patchCurrentUserAvatar(queryClient, avatarUrl);
      }
      await refreshUser();
      showToast({ type: "success", message: t("success") });
    } catch (e) {
      showToast({
        type: "error",
        message: e instanceof Error ? e.message : t("error"),
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-[#0A0A0A]" />
    );

  return (
    <SafeAreaView
      className="flex-1 bg-white dark:bg-[#0A0A0A]"
      edges={["top", "left", "right"]}
    >
      <View className="flex-row items-center px-6 py-4 gap-4">
        <Pressable
          onPress={() => router.back()}
          className="h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-[#1A1A1A] active:opacity-80 transition-opacity"
        >
          <ArrowLeft size={20} color="#F97316" strokeWidth={2.5} />
        </Pressable>

        <View className="flex-1">
          <Text className="text-lg font-black tracking-tight text-zinc-950 dark:text-white">
            Mon profil
          </Text>
          <Text className="text-[10px] font-black uppercase tracking-widest text-orange-500 mt-1">
            Paramètres du compte
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={insets.top}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: Math.max(insets.bottom + 24, 32),
            paddingLeft: 24,
            paddingRight: 24,
            paddingTop: 12,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="items-center mb-10">
            <AvatarPicker uri={getStaticUri(avatarUri as string)} onChange={setAvatarUri} />
          </View>

          <View className="mb-8">
            <Text className="text-sm font-black text-zinc-950 dark:text-white uppercase tracking-wider mb-4">
              Informations personnelles
            </Text>
            <View className="py-6 gap-y-5">
              <Input
                label="Prénom"
                value={firstname}
                onChangeText={setFirstname}
              />
              
              <Input
                label="Nom"
                value={lastname}
                onChangeText={setLastname}
              />
              
              <Input
                label="Nom d'utilisateur"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />

              <PhoneInput
                label="Numéro de téléphone"
                value={phone}
                onChangeE164={setPhone}
                dialCode="+237"
              />

              <GenderPicker value={gender} onChange={setGender} />
            </View>
          </View>

          <View className="mb-8">
            <Text className="text-sm font-black text-zinc-950 dark:text-white uppercase tracking-wider mb-4">
              Cursus académique
            </Text>
            <View className="py-6 gap-y-5">
              <LevelPicker value={niveau} onChange={setNiveau} />

              <Input
                label="Filière / Major"
                value={filiere}
                onChangeText={setFiliere}
              />
            </View>
          </View>

          <View className="mb-10">
            <Text className="text-sm font-black text-zinc-950 dark:text-white uppercase tracking-wider mb-4">
              À propos de vous
            </Text>
            <View className="py-6">
              <Input
                label="Biographie"
                value={bio}
                onChangeText={setBio}
                multiline
              />
            </View>
          </View>

          <Button
            label="Enregistrer les modifications"
            loading={saving}
            onPress={() => void save()}
            size="lg"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}