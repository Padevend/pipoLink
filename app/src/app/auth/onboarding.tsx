import { router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
  Pressable,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, ArrowRight, Check } from "lucide-react-native";

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

const TOTAL_STEPS = 5;

export default function OnboardingScreen(): JSX.Element {
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState(1);

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

  const handleNext = () => {
    if (currentStep === 2 && (!firstname || !lastname)) {
      setErrors({
        ...errors,
        firstname: !firstname ? 'Prénom requis' : undefined,
        lastname: !lastname ? 'Nom requis' : undefined,
      });
      showToast({ type: 'error', message: 'Veuillez remplir les champs obligatoires.' });
      return;
    }

    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    } else {
      router.back();
    }
  };

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
      const fieldErrors: Partial<Record<keyof OnboardingFormValues, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof OnboardingFormValues;
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      showToast({
        type: "error",
        message: "Corrigez les champs du formulaire.",
      });
      if (fieldErrors.firstname || fieldErrors.lastname || fieldErrors.username) {
        setCurrentStep(2);
      } else if (fieldErrors.gender) {
        setCurrentStep(3);
      } else if (fieldErrors.niveau || fieldErrors.filiere) {
        setCurrentStep(4);
      } else {
        setCurrentStep(5);
      }
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
    <SafeAreaView className="flex-1 bg-white dark:bg-[#0A0A0A]" edges={['top', 'left', 'right']}>
      <View className="flex-row items-center px-6 py-4 gap-4">
        <Pressable 
          onPress={handlePrev}
          className="h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-[#1A1A1A] active:opacity-80 transition-opacity"
        >
          <ArrowLeft size={20} color="#F97316" strokeWidth={2.5} />
        </Pressable>
        
        <View className="flex-1">
          <Text className="text-lg font-black tracking-tight text-zinc-950 dark:text-white">
            Configuration
          </Text>
          <Text className="text-[10px] font-black uppercase tracking-widest text-orange-500 mt-1">
            Étape {currentStep} sur {TOTAL_STEPS}
          </Text>
        </View>

        <AppLogo size="sm" />
      </View>

      <View className="px-6 pt-2 pb-4 flex-row gap-2">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => {
          const stepNum = i + 1;
          const isActive = stepNum <= currentStep;
          return (
            <View
              key={i}
              className={`flex-1 h-2 rounded-full transition-all ${
                isActive ? 'bg-orange-500' : 'bg-zinc-100 dark:bg-[#1A1A1A]'
              }`}
            />
          );
        })}
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
          {currentStep === 1 && (
            <View className="flex-1 justify-between">
              <View className="items-center">
                <View className="w-full mb-8">
                  <Text className="text-4xl font-black tracking-tighter text-zinc-950 dark:text-white leading-[42px]">
                    Photo de profil
                  </Text>
                  <Text className="text-sm font-bold leading-6 text-zinc-500 dark:text-zinc-400 mt-3">
                    Personnalisez votre compte avec une photo claire pour vos interactions académiques.
                  </Text>
                </View>

                <View className="my-8">
                  <AvatarPicker
                    label="Votre Avatar"
                    uri={avatarUri}
                    onChange={setAvatarUri}
                  />
                </View>
              </View>

              <View className="mt-8">
                <Button
                  label="Continuer"
                  onPress={handleNext}
                  size="lg"
                  rightIcon={<ArrowRight size={16} color="#FFFFFF" strokeWidth={3} />}
                />
              </View>
            </View>
          )}

          {currentStep === 2 && (
            <View className="flex-1 justify-between">
              <View>
                <View className="w-full mb-8">
                  <Text className="text-4xl font-black tracking-tighter text-zinc-950 dark:text-white leading-[42px]">
                    Informations{"\n"}personnelles
                  </Text>
                  <Text className="text-sm font-bold leading-6 text-zinc-500 dark:text-zinc-400 mt-3">
                    Renseignez vos informations d'identité officielles.
                  </Text>
                </View>

                <View className="w-full gap-y-6">
                  <Input
                    label="Prénom *"
                    value={firstname}
                    onChangeText={setFirstname}
                    error={errors.firstname}
                    placeholder="Votre prénom"
                  />

                  <Input
                    label="Nom *"
                    value={lastname}
                    onChangeText={setLastname}
                    error={errors.lastname}
                    placeholder="Votre nom"
                  />

                  <Input
                    label="Pseudo (optionnel)"
                    value={username}
                    onChangeText={setUsername}
                    error={errors.username}
                    autoCapitalize="none"
                    placeholder="nom_utilisateur"
                  />
                </View>
              </View>

              <View className="mt-10 flex-row gap-4">
                <Button
                  label="Précédent"
                  variant="secondary"
                  onPress={handlePrev}
                  size="lg"
                  className="flex-1"
                />
                <Button
                  label="Continuer"
                  onPress={handleNext}
                  size="lg"
                  className="flex-1"
                  rightIcon={<ArrowRight size={16} color="#FFFFFF" strokeWidth={3} />}
                />
              </View>
            </View>
          )}

          {currentStep === 3 && (
            <View className="flex-1 justify-between">
              <View>
                <View className="w-full mb-8">
                  <Text className="text-4xl font-black tracking-tighter text-zinc-950 dark:text-white leading-[42px]">
                    Genre
                  </Text>
                  <Text className="text-sm font-bold leading-6 text-zinc-500 dark:text-zinc-400 mt-3">
                    Sélectionnez votre dénomination de genre.
                  </Text>
                </View>

                <View className="w-full">
                  <GenderPicker
                    label="Dénomination"
                    value={gender}
                    onChange={setGender}
                    error={errors.gender}
                  />
                </View>
              </View>

              <View className="mt-10 flex-row gap-4">
                <Button
                  label="Précédent"
                  variant="secondary"
                  onPress={handlePrev}
                  size="lg"
                  className="flex-1"
                />
                <Button
                  label="Continuer"
                  onPress={handleNext}
                  size="lg"
                  className="flex-1"
                  rightIcon={<ArrowRight size={16} color="#FFFFFF" strokeWidth={3} />}
                />
              </View>
            </View>
          )}

          {currentStep === 4 && (
            <View className="flex-1 justify-between">
              <View>
                <View className="w-full mb-8">
                  <Text className="text-4xl font-black tracking-tighter text-zinc-950 dark:text-white leading-[42px]">
                    Parcours{"\n"}académique
                  </Text>
                  <Text className="text-sm font-bold leading-6 text-zinc-500 dark:text-zinc-400 mt-3">
                    Précisez votre niveau et votre domaine d'étude.
                  </Text>
                </View>

                <View className="w-full gap-y-6">
                  <LevelPicker
                    label="Niveau académique"
                    value={niveau}
                    onChange={setNiveau}
                    error={errors.niveau}
                  />

                  <Input
                    label="Filière d'étude"
                    value={filiere}
                    onChangeText={setFiliere}
                    error={errors.filiere}
                    placeholder="Ex. Informatique, Génie Civil..."
                  />
                </View>
              </View>

              <View className="mt-10 flex-row gap-4">
                <Button
                  label="Précédent"
                  variant="secondary"
                  onPress={handlePrev}
                  size="lg"
                  className="flex-1"
                />
                <Button
                  label="Continuer"
                  onPress={handleNext}
                  size="lg"
                  className="flex-1"
                  rightIcon={<ArrowRight size={16} color="#FFFFFF" strokeWidth={3} />}
                />
              </View>
            </View>
          )}

          {currentStep === 5 && (
            <View className="flex-1 justify-between">
              <View>
                <View className="w-full mb-8">
                  <Text className="text-4xl font-black tracking-tighter text-zinc-950 dark:text-white leading-[42px]">
                    Contact & Bio
                  </Text>
                  <Text className="text-sm font-bold leading-6 text-zinc-500 dark:text-zinc-400 mt-3">
                    Dernière étape pour finaliser votre profil et accéder à vos services.
                  </Text>
                </View>

                <View className="w-full gap-y-6">
                  <PhoneInput
                    label="Numéro de téléphone"
                    value={phone}
                    onChangeE164={setPhone}
                    error={errors.phone}
                    dialCode="+237"
                  />

                  <Input
                    label="Biographie"
                    value={bio}
                    onChangeText={setBio}
                    error={errors.bio}
                    placeholder="Quelques mots sur votre parcours…"
                    multiline
                  />
                </View>
              </View>

              <View className="mt-10 flex-row gap-4">
                <Button
                  label="Précédent"
                  variant="secondary"
                  onPress={handlePrev}
                  size="lg"
                  className="flex-1"
                />
                <Button
                  label="Terminer"
                  onPress={handleSubmit}
                  loading={onboarding.isPending}
                  size="lg"
                  className="flex-1"
                  rightIcon={!onboarding.isPending ? <Check size={16} color="#FFFFFF" strokeWidth={3} /> : undefined}
                />
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}