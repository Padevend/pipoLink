//import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

const authSchema = z.object({
  email: z.string().email('Email invalide').toLowerCase().trim(),
  password: z
    .string()
    .min(8, 'Minimum 8 caractères')
    .regex(/^(?=.*[A-Z])(?=.*\d).+$/, '1 majuscule et 1 chiffre requis'),
});

export type AuthFormValues = z.infer<typeof authSchema>;

export interface AuthFormProps {
  onSubmit: (values: AuthFormValues) => Promise<void>;
  loading?: boolean;
}

export function AuthForm({ onSubmit, loading }: AuthFormProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthFormValues>({
    // resolver: zodResolver(authSchema), // Connecte Zod à Hook Form
    defaultValues: { email: '', password: '' },
  });

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          className="px-6 py-8"
        >
          {/* Header Section */}
          <View className="mb-10 mt-4">
            <Text className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Connexion
            </Text>
            <Text className="mt-2 text-base text-slate-500 dark:text-slate-400">
              Heureux de vous revoir.
            </Text>
          </View>

          {/* Form Fields */}
          <View className="gap-y-6">
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Email"
                  placeholder="nom@exemple.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  error={errors.email?.message}
                />
              )}
            />

            <View className="relative">
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Mot de passe"
                    placeholder="••••••••"
                    secureTextEntry={!isPasswordVisible}
                    autoCapitalize="none"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    error={errors.password?.message}
                  />
                )}
              />
              <Pressable
                onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                className="absolute right-4 top-[42px] active:opacity-60"
              >
                <Text className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                  {isPasswordVisible ? "MASQUER" : "AFFICHER"}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Footer Actions */}
          <View className="mt-auto pt-10">
            <Button
              label="Se connecter"
              loading={loading}
              onPress={handleSubmit(onSubmit)}
              // Style moderne : bords arrondis XXL et ombre légère
              className="h-14 rounded-2xl bg-blue-600  shadow-blue-400 dark:bg-blue-500"
            />

            <Text className="mt-6 text-center text-xs leading-5 text-slate-400 dark:text-slate-500">
              En continuant, vous acceptez nos{" "}
              <Text className="font-medium text-slate-900 underline dark:text-slate-300">
                Conditions
              </Text>{" "}
              et notre{" "}
              <Text className="font-medium text-slate-900 underline dark:text-slate-300">
                Politique de confidentialité
              </Text>.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}