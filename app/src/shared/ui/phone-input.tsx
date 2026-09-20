import { cn } from '@/shared/utils/cn';
import { ChevronDown, Phone, X } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COUNTRIES } from '../data/avaible-phonCode';
import { SearchBar } from './search-bar';

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
    <View className="w-full gap-2">
      {label ? (
        <Text className="text-[11px] font-black uppercase tracking-widest text-zinc-950 dark:text-zinc-300 ml-4">
          {label}
        </Text>
      ) : null}

      {/* BOÎTIER PRINCIPAL : Format chunky et arrondi complet */}
      <View
        className={cn(
          'h-16 flex-row items-center rounded-full border-2 px-3 transition-all',
          focused ? 'border-orange-500 bg-white dark:bg-[#0A0A0A]' : 'border-transparent bg-zinc-100 dark:bg-[#1A1A1A]',
          error && 'border-red-500 bg-red-50 dark:bg-red-950',
        )}
      >
        {/* Sélecteur d'indicatif ultra propre */}
        <Pressable
          onPress={() => setModalVisible(true)}
          className="h-full flex-row items-center justify-center gap-2 border-r-2 border-zinc-200 dark:border-zinc-800 px-4 active:opacity-50"
        >
          <Text className="text-sm font-black text-zinc-950 dark:text-white">
            {selectedCountry.code}
          </Text>
          <ChevronDown size={16} color="#F97316" strokeWidth={3} />
        </Pressable>

        {/* Champ de saisie numérique */}
        <TextInput
          value={national.replace(/(\d{2})(?=)/g, '$1 ').trim()}
          onChangeText={handleNationalChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="6 00 00 00 00"
          placeholderTextColor="#A1A1AA"
          keyboardType="phone-pad"
          className="flex-1 h-full px-4 text-base font-bold text-zinc-950 dark:text-white"
        />
      </View>
      

      {error ? (
        <Text className="text-[10px] font-black uppercase tracking-wider text-red-500 ml-4">{error}</Text>
      ) : null}

      {/* ================= MODAL DE SÉLECTION DU PAYS ================= */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        statusBarTranslucent
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/60">
          <SafeAreaView className="max-h-[85%] rounded-t-[40px] bg-white dark:bg-[#0A0A0A] p-6">

            <View className="flex-row items-center justify-between border-b-2 border-zinc-100 dark:border-[#1A1A1A] pb-6 mb-4">
              <View className="flex-row items-center gap-3">
                <View className="h-10 w-10 items-center justify-center rounded-full bg-orange-500/10">
                  <Phone size={20} color="#F97316" strokeWidth={2.5} />
                </View>
                <Text className="text-xl font-black text-zinc-950 dark:text-white tracking-tight">
                  Choisir un pays
                </Text>
              </View>
              <Pressable
                onPress={() => setModalVisible(false)}
                className="h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-[#1A1A1A] active:opacity-80"
              >
                <X size={20} color="#F97316" strokeWidth={2.5} />
              </Pressable>
            </View>

            <View className="mb-4">
              <SearchBar
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Rechercher un pays ou un code..."
              />
            </View>

            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item.code + item.name}
              contentContainerStyle={{ paddingBottom: 32 }}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = item.code === selectedCountry.code;
                return (
                  <Pressable
                    onPress={() => handleCountrySelect(item)}
                    className={cn(
                      'flex-row items-center justify-between py-4 px-4 my-1 rounded-2xl transition-all',
                      isSelected 
                        ? 'bg-orange-500' 
                        : 'bg-zinc-50 dark:bg-[#1A1A1A] active:opacity-80'
                    )}
                  >
                    <View className="flex-row items-center gap-4">
                      <Text className={cn('text-sm font-black w-12', isSelected ? 'text-white' : 'text-orange-500')}>
                        {item.code}
                      </Text>
                      <Text className={cn('text-sm font-bold', isSelected ? 'text-white' : 'text-zinc-950 dark:text-white')}>
                        {item.name}
                      </Text>
                    </View>

                    {isSelected && (
                      <View className="h-2.5 w-2.5 rounded-full bg-white" />
                    )}
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                <Text className="text-center text-xs font-bold text-zinc-400 py-12 uppercase tracking-widest">
                  Aucun pays trouvé
                </Text>
              }
            />

          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}