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
      <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950" />
    );

  return (
    <SafeAreaView
      className="flex-1 bg-white dark:bg-zinc-950"
      edges={["top"]}
    >
      {/* HEADER : Panneau Mat Solide */}
      <View className="flex-row items-center border-b border-zinc-100 bg-white px-4 py-3 dark:border-zinc-900 dark:bg-zinc-950">
        <Pressable
          onPress={() => router.back()}
          className="h-8 w-8 items-center justify-center rounded-lg bg-zinc-50 border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 active:bg-zinc-100 dark:active:bg-zinc-800"
        >
          <ArrowLeft size={14} color="#71717A" />
        </Pressable>

        <Text className="flex-1 ml-3 text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Profile
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-4"
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Section 1 : Sélecteur d'Avatar Maté */}
          <View className="items-center mb-5">
            <View className="rounded-full p-0.5">
              <AvatarPicker uri={avatarUri} onChange={setAvatarUri} />
            </View>
          </View>

          {/* Section 2 : Informations Personnelles */}
          <Text className="mb-2 ml-3 text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Informations personnelles
          </Text>
          <View className="mb-5 rounded-xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-900 dark:bg-zinc-900/20 gap-10">
            <Input
              label="Nom"
              value={firstname}
              onChangeText={setFirstname}
              containerClassName="bg-transparent border-0 px-0 h-10"
              className="text-xs text-zinc-900 dark:text-zinc-50"
            />
            
            <Input
              label="Prenom"
              value={lastname}
              onChangeText={setLastname}
              containerClassName="bg-transparent border-0 px-0 h-10"
              className="text-xs text-zinc-900 dark:text-zinc-50"
            />
            
            <Input
              label="Nom d'utilisateur"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              containerClassName="bg-transparent border-0 px-0 h-10"
              className="text-xs text-zinc-900 dark:text-zinc-50"
            />

            <View className="gap-1 py-0.5">
              <Text className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Numero de Telephone
              </Text>
              <PhoneInput
                value={phone}
                onChangeE164={setPhone}
                dialCode="+237"
              />
            </View>

            <View className="">
              <GenderPicker value={gender} onChange={setGender} />
            </View>
          </View>

          {/* Section 3 : Parcours Étudiant */}
          <Text className="mb-2 ml-3 text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Cursus académique
          </Text>
          <View className="mb-5 rounded-xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-900 dark:bg-zinc-900/20 gap-3">
            <View className="py-0.5">
              <LevelPicker value={niveau} onChange={setNiveau} />
            </View>
            <View className="mx-0 h-[1px] bg-zinc-100 dark:bg-zinc-900" />
            <Input
              label="Major"
              value={filiere}
              onChangeText={setFiliere}
              containerClassName="bg-transparent border-0 px-0 h-10"
              className="text-xs text-zinc-900 dark:text-zinc-50"
            />
          </View>

          {/* Section 4 : Biographie */}
          <Text className="mb-2 ml-3 text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            À propos de vous
          </Text>
          <View className="mb-6 rounded-xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-900 dark:bg-zinc-900/20">
            <Input
              label="Bio"
              value={bio}
              onChangeText={setBio}
              multiline
              containerClassName="bg-transparent border-0 px-0 min-h-[72px]"
              className="text-xs text-zinc-900 dark:text-zinc-50"
              textAlignVertical="top"
            />
          </View>

          {/* BOUTON D'ACTION : Orange Mat Solide */}
          <Button
            label="Enregistrer"
            loading={saving}
            onPress={() => void save()}
            className="rounded-xl h-11 bg-orange-500 active:bg-orange-600"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}