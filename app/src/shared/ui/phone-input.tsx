import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { cn } from '@/shared/utils/cn';

const DEFAULT_DIAL = '+225';

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

/** Formate visuellement : +225 07 12 34 56 78 */
export function formatPhoneDisplay(dialCode: string, national: string): string {
  const d = digitsOnly(national);
  const parts: string[] = [];
  for (let i = 0; i < d.length; i += 2) {
    parts.push(d.slice(i, i + 2));
  }
  return `${dialCode}${parts.length ? ' ' + parts.join(' ') : ''}`.trim();
}

export function parseE164(dialCode: string, national: string): string {
  return `${dialCode}${digitsOnly(national)}`;
}

interface PhoneInputProps {
  label?: string;
  value: string;
  onChangeE164: (e164: string) => void;
  error?: string;
  dialCode?: string;
}

export function PhoneInput({
  label = 'Téléphone',
  value,
  onChangeE164,
  error,
  dialCode = DEFAULT_DIAL,
}: PhoneInputProps): JSX.Element {
  const nationalFromValue = value.startsWith(dialCode) ? value.slice(dialCode.length) : value.replace(/^\+\d+/, '');
  const [national, setNational] = useState(digitsOnly(nationalFromValue));
  const [focused, setFocused] = useState(false);

  const handleNationalChange = (raw: string) => {
    const d = digitsOnly(raw).slice(0, 12);
    setNational(d);
    onChangeE164(d ? parseE164(dialCode, d) : '');
  };

  return (
    <View className="w-full gap-2">
      {label ? (
        <Text className="ml-1 text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark">
          {label}
        </Text>
      ) : null}
      <View
        className={cn(
          'h-14 flex-row items-center overflow-hidden rounded-2xl bg-surface-light dark:bg-surface-dark',
          focused && 'border border-primary/40',
          error && 'bg-error/5',
        )}
      >
        <Pressable className="h-full justify-center border-r border-border-light px-4 dark:border-border-dark">
          <Text className="text-base font-bold text-primary">{dialCode}</Text>
        </Pressable>
        <TextInput
          value={national.replace(/(\d{2})(?=\d)/g, '$1 ').trim()}
          onChangeText={handleNationalChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="07 12 34 56 78"
          placeholderTextColor="#94A3B8"
          keyboardType="phone-pad"
          className="flex-1 px-4 text-base text-text-primary-light dark:text-text-primary-dark"
        />
      </View>
      {error ? <Text className="ml-2 text-xs font-medium text-error">{error}</Text> : null}
    </View>
  );
}
