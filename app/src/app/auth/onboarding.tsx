import { router } from "expo-router";
import { useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark" edges={['top']}>
      
      {/* En-tête Translucide Style Glassmorphism (Remplaçant du LinearGradient - Sans Shadow) */}
      <View className="z-10 border-b border-border-light/20 bg-surface-light/75 px-5 py-4 dark:border-border-dark/10 dark:bg-surface-dark/75 backdrop-blur-xl">
        <View className="flex-row items-center justify-between">
          <AppLogo size="sm" />
        </View>
        <Text className="mt-2 text-[12px] font-medium leading-[18px] text-text-secondary-light/70 dark:text-text-secondary-dark/60">
          Complétez votre profil. Les clés de chiffrement de bout en bout sont générées uniquement sur cet appareil sécurisé.
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
          {/* Zone de Sélection d'Avatar Épurée */}
          <View className="items-center mb-6">
            <AvatarPicker
              label="Photo de profil (optionnel)"
              uri={avatarUri}
              onChange={setAvatarUri}
            />
          </View>

          {/* Formulaire encapsulé en bloc Satiné Verre Unifié */}
          <View className="w-full backdrop-blur-md gap-y-4">
            
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
              size="xl"
              className="rounded-xl h-12"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}