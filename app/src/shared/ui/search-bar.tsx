import { Search } from 'lucide-react-native';
import { TextInput, View } from 'react-native';

export interface SearchBarProps {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChangeText, placeholder = 'Rechercher...' }: SearchBarProps): JSX.Element {
  return (
    <View className="w-full flex-row items-center rounded-xl border border-zinc-200 bg-white px-3 dark:border-zinc-800 dark:bg-zinc-950">
      {/* Petite icône de loupe pour indiquer clairement la zone de recherche */}
      <Search size={14} color="#A1A1AA" />
      
      {/* Zone de saisie de texte */}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#A1A1AA"
        className="flex-1 h-full ml-2.5 text-xs font-semibold text-zinc-900 dark:text-zinc-50 py-5"
        autoCorrect={false}
      />
    </View>
  );
}