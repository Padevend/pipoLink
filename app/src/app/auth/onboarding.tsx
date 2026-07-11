import { router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { useOnboarding } from "@/features/auth/hooks/use-onboarding";
import {
  onboardingSchema,
  type OnboardingFormValues,
} from "@/features/auth/lib/onboarding-schema";
import { useAuth, useToast } from "@/providers";
import { AppLogo } from "@/shared/ui/app-logo";
import { AvatarPicker } from "@/shared/ui/avatar-picker";
import { Button } from "@/shared/ui/button";
import { GenderPicker, type GenderId } from "@/shared/ui/gender-picker";
import { Input } from "@/shared/ui/input";
import { LevelPicker } from "@/shared/ui/level-picker";
import { PhoneInput } from "@/shared/ui/phone-input";

export default function OnboardingScreen(): JSX.Element {
  const [firstname, setFirstname] = useState("");
  const insets = useSafeAreaInsets();
  const [lastname, setLastname] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<GenderId | undefined>();
  const [niveau, setNiveau] = useState<string | undefined>();
  const [filiere, setFiliere] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [errors, setErrors] = useState<
    Partial<Record<keyof OnboardingFormValues | "avatar", string>>
  >({});

  const onboarding = useOnboarding();
  const { refreshUser } = useAuth();
  const { showToast } = useToast();

  const handleSubmit = () => {
    const payload = {
      firstname,
      lastname,
      username: username || undefined,
      phone: phone || undefined,
      gender,
      niveau: niveau as OnboardingFormValues["niveau"],
      filiere: filiere || undefined,
      bio: bio || undefined,
    };

    const parsed = onboardingSchema.safeParse(payload);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof OnboardingFormValues, string>> =
        {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof OnboardingFormValues;
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      showToast({
        type: "error",
        message: "Corrigez les champs du formulaire.",
      });
      return;
    }

    setErrors({});
    onboarding.mutate(
      { ...parsed.data, avatarUri },
      {
        onSuccess: async () => {
          await refreshUser();
          router.replace("/(tabs)");
        },
        onError: (e) => {
          showToast({
            type: "error",
            message:
              e instanceof Error ? e.message : "Échec de la configuration.",
          });
        },
      },
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950" edges={['top', 'left', 'right']}>

      {/* HEADER : Panneau Mat Solide */}
      <View className="flex-row items-center border-b border-zinc-100 bg-white px-4 py-3 dark:border-zinc-900 dark:bg-zinc-950">
        <View className="flex-row items-center justify-between">
          <AppLogo size="sm" />
        </View>

        {/* Bloc Titre & Sous-titre Contextuel */}
        <View className="ml-3 flex-1">
          <Text className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50 uppercase">
            Mon Profile
          </Text>
          <Text className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mt-0.5">
            complétez votre profil
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
            paddingTop: 20,
            paddingBottom: insets.bottom + 24,
            paddingLeft: insets.left + 16,
            paddingRight: insets.right + 16
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Zone de Sélection d'Avatar Épurée */}
          <View className="items-center mb-6">
            <AvatarPicker
              label="Photo de profil (optionnel)"
              uri={avatarUri}
              onChange={setAvatarUri}
            />
          </View>

          {/* Formulaire (Structure Mat Intégrée) */}
          <View className="w-full gap-y-4">
            <Input
              label="Prénom *"
              value={firstname}
              onChangeText={setFirstname}
              error={errors.firstname}
              containerClassName="bg-transparent"
              placeholder="Votre prénom"
            />

            <Input
              label="Nom *"
              value={lastname}
              onChangeText={setLastname}
              error={errors.lastname}
              containerClassName="bg-transparent"
              placeholder="Votre nom"
            />

            <Input
              label="Pseudo (optionnel)"
              value={username}
              onChangeText={setUsername}
              error={errors.username}
              autoCapitalize="none"
              containerClassName="bg-transparent"
              placeholder="nom_utilisateur"
            />

            <PhoneInput
              label="Numéro de téléphone (optionnel)"
              value={phone}
              onChangeE164={setPhone}
              error={errors.phone}
              dialCode="+237"
            />

            <View className="w-full pt-1">
              <GenderPicker
                label="Genre (optionnel)"
                value={gender}
                onChange={setGender}
                error={errors.gender}
              />
            </View>

            <View className="w-full">
              <LevelPicker
                label="Niveau académique (optionnel)"
                value={niveau}
                onChange={setNiveau}
                error={errors.niveau}
              />
            </View>

            <Input
              label="Filière d'étude (optionnel)"
              value={filiere}
              onChangeText={setFiliere}
              error={errors.filiere}
              placeholder="Ex. Informatique, Gestion..."
              containerClassName="bg-transparent"
            />

            <Input
              label="Biographie (optionnel)"
              value={bio}
              onChangeText={setBio}
              error={errors.bio}
              placeholder="Quelques mots sur votre parcours…"
              multiline
              containerClassName="bg-transparent min-h-[90px]"
              className="min-h-[70px] py-2"
            />
          </View>

          {/* Validation Finale Équilibrée */}
          <View className="mt-6">
            <Button
              label="Terminer la configuration"
              loading={onboarding.isPending}
              onPress={() => void handleSubmit()}
              className="bg-orange-500 rounded-xl h-11"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}