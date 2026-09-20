import { Search } from 'lucide-react-native';
import { TextInput, View } from 'react-native';

export interface SearchBarProps {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChangeText, placeholder = 'Rechercher...' }: SearchBarProps): JSX.Element {
  return (
    <View className="w-full h-16 flex-row items-center rounded-full bg-zinc-100 px-5 dark:bg-[#1A1A1A]">
      <Search size={18} color="#A1A1AA" strokeWidth={2.5} />
      
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#A1A1AA"
        className="flex-1 h-full ml-3 text-sm font-bold text-zinc-950 dark:text-white"
        autoCorrect={false}
      />
    </View>
  );
}