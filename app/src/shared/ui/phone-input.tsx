import { useState } from 'react';
import { Pressable, Text, TextInput, View, Modal, FlatList } from 'react-native';
import { ChevronDown, Search, X, Phone } from 'lucide-react-native';
import { cn } from '@/shared/utils/cn';
import { BRAND } from '@/shared/config/brand';
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
  dialCode?: string; // Indicatif par défaut (Ex: +237)
}

export function PhoneInput({
  label = 'Numéro de téléphone',
  value,
  onChangeE164,
  error,
  dialCode = '+237',
}: PhoneInputProps): JSX.Element {
  // Retrouver l'objet pays initial basé sur le dialCode passé en prop
  const initialCountry = COUNTRIES.find(c => c.code === dialCode) || COUNTRIES[0];

  const [selectedCountry, setSelectedCountry] = useState(initialCountry);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [focused, setFocused] = useState(false);

  // Extraction de la partie nationale
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
    // Recalculer instantanément la valeur E164 avec le nouvel indicatif
    onChangeE164(national ? parseE164(country.code, national) : '');
  };

  // Filtrage de la liste de recherche
  const filteredCountries = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.code.includes(searchQuery)
  );

  return (
    <View className="w-full gap-y-1.5">
      {label ? (
        <Text className="ml-1 text-[13px] font-semibold text-text-secondary-light dark:text-text-secondary-dark">
          {label}
        </Text>
      ) : null}

      {/* Boîtier principal d'entrée (Style Satiné - Sans Shadow) */}
      <View
        className={cn(
          'h-12 flex-row items-center rounded-xl border bg-surface-light/40 dark:bg-surface-dark/30 transition-all',
          focused ? 'border-primary/60' : 'border-border-light/40 dark:border-border-dark/20',
          error && 'border-red-500/50 bg-red-50/10 dark:bg-red-950/5',
        )}
      >
        {/* Déclencheur du Sélecteur d'Indicatif */}
        <Pressable
          onPress={() => setModalVisible(true)}
          className="h-full flex-row items-center justify-center gap-1 border-r border-border-light/40 px-3.5 dark:border-border-dark/20 active:bg-slate-100/50 dark:active:bg-slate-800/40 rounded-l-xl"
        >
          <Text className="text-[14px] font-bold text-text-primary-light dark:text-text-primary-dark">
            {selectedCountry.code}
          </Text>
          <ChevronDown size={14} color="#64748B" />
        </Pressable>

        {/* Champ de saisie numérique formaté par paires (00 00 00...) */}
        <TextInput
          value={national.replace(/(\d{2})(?=\d)/g, '$1 ').trim()}
          onChangeText={handleNationalChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="6 00 00 00 00"
          placeholderTextColor="#94A3B8"
          keyboardType="phone-pad"
          className="flex-1 h-full px-4 text-[14px] font-semibold text-text-primary-light dark:text-text-primary-dark"
        />
      </View>

      {error ? (
        <Text className="ml-1 text-[11px] font-medium text-red-500 dark:text-red-400">{error}</Text>
      ) : null}

      {/* ================= MODAL DE SÉLECTION DU PAYS ================= */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/40 dark:bg-black/60 backdrop-blur-sm">
          <SafeAreaView className="max-h-[80%] rounded-t-[24px] border-t border-border-light/40 bg-background-light dark:border-border-dark/20 dark:bg-background-dark">

            {/* Header de la Modal */}
            <View className="flex-row items-center justify-between border-b border-border-light/40 px-5 py-4 dark:border-border-dark/20">
              <View className="flex-row items-center gap-2">
                <Phone size={16} color={BRAND.primary} />
                <Text className="text-[16px] font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">
                  Choisir un pays
                </Text>
              </View>
              <Pressable
                onPress={() => setModalVisible(false)}
                className="h-7 w-7 items-center justify-center rounded-full bg-surface-light dark:bg-surface-dark"
              >
                <X size={15} color="#64748B" />
              </Pressable>
            </View>

            {/* Barre de Recherche Interne (Style Glassmorphic) */}
            <View className="flex pb-5">
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
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
              renderItem={({ item }) => {
                const isSelected = item.code === selectedCountry.code;
                return (
                  <Pressable
                    onPress={() => handleCountrySelect(item)}
                    className={cn(
                      'flex-row items-center justify-between py-3.5 border-b border-border-light/20 dark:border-border-dark/10 active:opacity-60',
                      isSelected && 'bg-primary/5 dark:bg-primary/5 rounded-lg px-2 -mx-2'
                    )}
                  >
                    <View className="flex-row items-center gap-4">
                      {/* Structure demandée : "{code}  {country}" */}
                      <Text className="text-[14px] font-bold text-primary w-14" style={{ color: BRAND.primary }}>
                        {item.code}
                      </Text>
                      <Text className="text-[14px] font-medium text-text-primary-light dark:text-text-primary-dark">
                        {item.name}
                      </Text>
                    </View>

                    {isSelected && (
                      <View className="h-2 w-2 rounded-full bg-primary" style={{ backgroundColor: BRAND.primary }} />
                    )}
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                <Text className="text-center text-[13px] text-text-secondary-light/50 dark:text-text-secondary-dark/50 py-8 font-medium">
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