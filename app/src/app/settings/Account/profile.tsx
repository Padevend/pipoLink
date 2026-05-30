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
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth, useToast } from "@/providers";
import { queryClient } from "@/providers/query-provider";
import { userApi } from "@/shared/api/user";
import { patchCurrentUserAvatar } from "@/shared/lib/query-cache";
import { AvatarPicker } from "@/shared/ui/avatar-picker";
import { Button } from "@/shared/ui/button";
import { GenderPicker, type GenderId } from "@/shared/ui/gender-picker";
import { Input } from "@/shared/ui/input";
import { LevelPicker } from "@/shared/ui/level-picker";
import { PhoneInput } from "@/shared/ui/phone-input";

export default function ProfileSettingsScreen(): JSX.Element {
  const { t } = useTranslation("common");
  
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
      <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark" />
    );

  return (
    <SafeAreaView
      className="flex-1 bg-background-light dark:bg-background-dark"
      edges={["top"]}
    >
      {/* Header Translucide Style Glassmorphism */}
      <View className="z-10 flex-row items-center border-b border-border-light/20 bg-surface-light/75 px-4 py-3.5 dark:border-border-dark/10 dark:bg-surface-dark/75 backdrop-blur-xl ">
        <Pressable
          onPress={() => router.back()}
          className="h-9 w-9 items-center justify-center active:scale-95 transition-transform"
        >
          <ArrowLeft
            size={20}
            color="#64748B"
          />
        </Pressable>

        <Text className="flex-1 ml-3 text-[17px] font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">
          Profile
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-5"
          contentContainerStyle={{ paddingTop: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Section 1 : Avatar & Identité Critique */}
          <View className="items-center mb-6">
            <View className="rounded-full p-1 backdrop-blur-md">
              <AvatarPicker uri={avatarUri} onChange={setAvatarUri} />
            </View>
          </View>

          {/* Section 2 : Informations Personnelles */}
          <Text className="mb-2.5 ml-3 text-[10px] font-bold uppercase tracking-widest text-text-secondary-light/60 dark:text-text-secondary-dark/60">
            Informations personnelles
          </Text>
          <View className="mb-5 rounded-2xl border border-border-light/40 bg-surface-light/10 p-4 dark:border-border-dark/20 dark:bg-surface-dark/40  gap-3">
            <Input
              label="First name"
              value={firstname}
              onChangeText={setFirstname}
              containerClassName="bg-transparent border-0 px-0"
            />
            <View className="h-[0.5px] bg-border-light/10 dark:bg-border-dark/5" />
            <Input
              label="Last name"
              value={lastname}
              onChangeText={setLastname}
              containerClassName="bg-transparent border-0 px-0"
            />
            <View className="h-[0.5px] bg-border-light/10 dark:bg-border-dark/5" />
            <Input
              label="Username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              containerClassName="bg-transparent border-0 px-0"
            />
            <View className="h-[0.5px] bg-border-light/10 dark:bg-border-dark/5" />

            <View className="gap-1 py-1">
              <Text className="text-[11px] font-bold uppercase tracking-wider text-text-secondary-light/50 dark:text-text-secondary-dark/50">
                Phone number
              </Text>
              <PhoneInput
                value={phone}
                onChangeE164={setPhone}
                dialCode="+237"
              />
            </View>

            <View className="h-[0.5px] bg-border-light/10 dark:bg-border-dark/5" />
            <View className="py-1">
              <GenderPicker value={gender} onChange={setGender} />
            </View>
          </View>

          {/* Section 3 : Parcours Étudiant */}
          <Text className="mb-2.5 ml-3 text-[10px] font-bold uppercase tracking-widest text-text-secondary-light/60 dark:text-text-secondary-dark/60">
            Cursus académique
          </Text>
          <View className="mb-5 rounded-2xl border border-border-light/40 bg-surface-light/10 p-4 dark:border-border-dark/20 dark:bg-surface-dark/40 gap-4">
            <View>
              <LevelPicker value={niveau} onChange={setNiveau} />
            </View>
            <View className="h-[0.5px] bg-border-light/10 dark:bg-border-dark/5" />
            <Input
              label="Major"
              value={filiere}
              onChangeText={setFiliere}
              containerClassName="bg-transparent border-0 px-0"
            />
          </View>

          {/* Section 4 : Biographie */}
          <Text className="mb-2.5 ml-3 text-[10px] font-bold uppercase tracking-widest text-text-secondary-light/60 dark:text-text-secondary-dark/60">
            À propos de vous
          </Text>
          <View className="mb-6 rounded-2xl border border-border-light/40 bg-surface-light/10 p-4 dark:border-border-dark/20 dark:bg-surface-dark/40">
            <Input
              label="Bio"
              value={bio}
              onChangeText={setBio}
              multiline
              containerClassName="bg-transparent border-0 px-0 min-h-[80px]"
              textAlignVertical="top"
            />
          </View>

          {/* Bouton d'Action */}
          <Button
            label="Enregistrer"
            loading={saving}
            onPress={() => void save()}
            className="rounded-2xl h-12 active:scale-[0.98] transition-transform"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
