import { useState } from 'react';
import { Pressable, Text, TextInput, View, Modal, FlatList } from 'react-native';
import { ChevronDown, Search, X, Phone } from 'lucide-react-native';
import { cn } from '@/shared/utils/cn';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SearchBar } from './search-bar';
import { COUNTRIES } from '../data/avaible-phonCode';

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
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
  label,
  value,
  onChangeE164,
  error,
  dialCode = '+237',
}: PhoneInputProps): JSX.Element {
  const initialCountry = COUNTRIES.find(c => c.code === dialCode) || COUNTRIES[0];

  const [selectedCountry, setSelectedCountry] = useState(initialCountry);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [focused, setFocused] = useState(false);

  const nationalFromValue = value.startsWith(selectedCountry.code)
    ? value.slice(selectedCountry.code.length)
    : value.replace(/^\+\d+/, '');
  const [national, setNational] = useState(digitsOnly(nationalFromValue));

  const handleNationalChange = (raw: string) => {
    const d = digitsOnly(raw).slice(0, 11);
    setNational(d);
    onChangeE164(d ? parseE164(selectedCountry.code, d) : '');
  };

  const handleCountrySelect = (country: typeof COUNTRIES[0]) => {
    setSelectedCountry(country);
    setModalVisible(false);
    setSearchQuery('');
    onChangeE164(national ? parseE164(country.code, national) : '');
  };

  const filteredCountries = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.code.includes(searchQuery)
  );

  return (
    <View className="w-full gap-y-1">
      {label ? (
        <Text className="ml-1 text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          {label}
        </Text>
      ) : null}

      {/* BOÎTIER PRINCIPAL : Cadre Mat Opaque */}
      <View
        className={cn(
          'h-10 flex-row items-center rounded-xl border bg-zinc-50 dark:bg-zinc-900/20',
          focused ? 'border-orange-500' : 'border-zinc-200 dark:border-zinc-800',
          error && 'border-red-500 bg-red-50/10 dark:bg-red-950/5',
        )}
      >
        {/* Déclencheur du Sélecteur d'Indicatif */}
        <Pressable
          onPress={() => setModalVisible(true)}
          className="h-full flex-row items-center justify-center gap-1 border-r border-zinc-200 px-3 dark:border-zinc-800 active:bg-zinc-100 dark:active:bg-zinc-900 rounded-l-xl"
        >
          <Text className="text-xs font-bold text-zinc-900 dark:text-zinc-50">
            {selectedCountry.code}
          </Text>
          <ChevronDown size={12} color="#71717A" />
        </Pressable>

        {/* Champ de saisie numérique formaté */}
        <TextInput
          value={national.replace(/(\d{2})(?=\d)/g, '$1 ').trim()}
          onChangeText={handleNationalChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="6 00 00 00 00"
          placeholderTextColor="#A1A1AA"
          keyboardType="phone-pad"
          className="flex-1 h-full px-3 text-xs font-semibold text-zinc-900 dark:text-zinc-50"
        />
      </View>

      {error ? (
        <Text className="ml-1 text-[11px] font-semibold text-red-600 dark:text-red-400">{error}</Text>
      ) : null}

      {/* ================= MODAL DE SÉLECTION DU PAYS ================= */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50 dark:bg-black/70">
          <SafeAreaView className="max-h-[80%] rounded-t-xl border-t border-zinc-200 bg-white dark:border-zinc-900 dark:bg-zinc-950">

            {/* Header de la Modal : Panneau Mat */}
            <View className="flex-row items-center justify-between border-b border-zinc-100 px-4 py-3 dark:border-zinc-900">
              <View className="flex-row items-center gap-2">
                <Phone size={14} color="#F97316" />
                <Text className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  Choisir un pays
                </Text>
              </View>
              <Pressable
                onPress={() => setModalVisible(false)}
                className="h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 active:bg-zinc-100 dark:active:bg-zinc-800"
              >
                <X size={13} color="#71717A" />
              </Pressable>
            </View>

            {/* Barre de Recherche Interne */}
            <View className="flex pb-3 pt-1">
              <SearchBar
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Rechercher un pays ou un code..."
              />
            </View>

            {/* Liste des Pays Déroulante */}
            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item.code + item.name}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
              renderItem={({ item }) => {
                const isSelected = item.code === selectedCountry.code;
                return (
                  <Pressable
                    onPress={() => handleCountrySelect(item)}
                    className={cn(
                      'flex-row items-center justify-between py-3 border-b border-zinc-100 dark:border-zinc-900/60',
                      isSelected 
                        ? 'bg-orange-50/60 dark:bg-orange-950/10 rounded-lg px-2 -mx-2' 
                        : 'active:bg-zinc-50 dark:active:bg-zinc-900/40'
                    )}
                  >
                    <View className="flex-row items-center gap-3">
                      {/* Structure demandée : "{code} {country}" */}
                      <Text className="text-xs font-bold text-orange-500 w-12">
                        {item.code}
                      </Text>
                      <Text className="text-xs font-semibold text-zinc-900 dark:text-zinc-50">
                        {item.name}
                      </Text>
                    </View>

                    {isSelected && (
                      <View className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                    )}
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                <Text className="text-center text-[11px] text-zinc-400 dark:text-zinc-500 py-8 font-semibold">
                  Aucun pays trouvé pour "{searchQuery}"
                </Text>
              }
            />

          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}