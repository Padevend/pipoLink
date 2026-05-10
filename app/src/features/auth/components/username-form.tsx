import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Text, View } from 'react-native';
import { z } from 'zod';

import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

const usernameSchema = z.object({
  username: z.string().min(3, 'Username trop court'),
  password: z.string().min(8, 'Mot de passe trop court'),
});

type UsernameFormValues = z.infer<typeof usernameSchema>;

export interface UsernameFormProps {
  onSubmit: (values: UsernameFormValues) => Promise<void>;
  loading?: boolean;
}

export function UsernameForm({ onSubmit, loading }: UsernameFormProps): JSX.Element {
  const { control, handleSubmit } = useForm<UsernameFormValues>({
    defaultValues: { username: '', password: '' },
  });
  const [error, setError] = useState('');

  const submit = handleSubmit(async (values) => {
    const parsed = usernameSchema.safeParse(values);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Erreur');
      return;
    }

    setError('');
    await onSubmit(parsed.data);
  });

  return (
    <View className="gap-4">
      <Controller
        control={control}
        name="username"
        render={({ field: { value, onChange } }) => <Input label="Nom d’utilisateur" value={value} onChangeText={onChange} />}
      />
      <Controller
        control={control}
        name="password"
        render={({ field: { value, onChange } }) => <Input label="Mot de passe" secureTextEntry value={value} onChangeText={onChange} />}
      />
      {error ? <Text className="text-sm text-red-500">{error}</Text> : null}
      <Button label="Se connecter" loading={loading} onPress={() => void submit()} />
    </View>
  );
}
