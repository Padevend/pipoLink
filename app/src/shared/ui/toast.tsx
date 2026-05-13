import { View } from 'react-native';

import type { ToastType } from '@/providers';
import { AlertCircle, CheckCheck, Info, InfoIcon } from 'lucide-react-native';

export interface ToastProps {
  type: ToastType;
  message: string;
}

export function Toast({ type, message }: ToastProps): JSX.Element {
  const getMeta = ()=>{
    switch(type){
      case "error":
        return {
          color: '#EF4444',
          icon: AlertCircle
        }
      case "info":
        return {
          color: '#FF7A00',
          icon: Info
        }
      case "success":
        return {
          color: '#22C55E',
          icon: CheckCheck
        }
      case "warning":
        return {
          color: '#EAB308',
          icon: InfoIcon
        }
    }
  }

  return (
    // <View style={{ backgroundColor }} className="rounded-2xl px-4 py-3">
    //   <Text className="text-sm font-medium text-white">{message}</Text>
    // </View>
    <View
      className='rounded-2xl px-4 py-3 min-h-50 flex flex-col'
    >
      
    </View>
  );
}
