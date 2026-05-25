import { Download, X } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    Modal,
    Pressable,
    Text,
    View
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { saveToGallery } from '../lib/file';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface ImageViewerProps {
  visible: boolean;
  uri: string;
  aspectRatio?: number;
  onClose: () => void;
  onDownloadSuccess?: () => void;
  onDownloadError?: (msg: string) => void;
}

export function ImageViewer({
  visible,
  uri,
  aspectRatio = 1,
  onClose,
  onDownloadSuccess,
  onDownloadError,
}: ImageViewerProps) {
  const [downloading, setDownloading] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  // ─── ANIMATED VALUES ────────────────────────────────────────────────────────
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);

  const MIN_SCALE = 1;
  const MAX_SCALE = 5;

  const clampTranslation = (tx: number, ty: number, s: number) => {
    'worklet';
    const maxX = ((SCREEN_W * s) - SCREEN_W) / 2;
    const maxY = ((SCREEN_H * s) - SCREEN_H) / 2;
    return {
      x: Math.min(Math.max(tx, -maxX), maxX),
      y: Math.min(Math.max(ty, -maxY), maxY),
    };
  };

  const resetTransform = () => {
    'worklet';
    scale.value = withSpring(1, { damping: 25, stiffness: 180 });
    translateX.value = withSpring(0, { damping: 25, stiffness: 180 });
    translateY.value = withSpring(0, { damping: 25, stiffness: 180 });
    savedScale.value = 1;
    savedX.value = 0;
    savedY.value = 0;
    runOnJS(setZoomLevel)(1);
  };

  // ─── GESTES TACTILES ────────────────────────────────────────────────────────
  
  // Geste de Pincement (Zoom)
  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      const next = Math.min(Math.max(savedScale.value * e.scale, MIN_SCALE), MAX_SCALE);
      scale.value = next;
      runOnJS(setZoomLevel)(Math.round(next * 10) / 10);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value < 1.05) resetTransform();
    });

  // Geste de Déplacement (Pan)
  const panGesture = Gesture.Pan()
    .minPointers(1)
    .onUpdate((e) => {
      if (scale.value <= 1) return;
      const clamped = clampTranslation(
        savedX.value + e.translationX,
        savedY.value + e.translationY,
        scale.value
      );
      translateX.value = clamped.x;
      translateY.value = clamped.y;
    })
    .onEnd(() => {
      savedX.value = translateX.value;
      savedY.value = translateY.value;
    });

  // Double Tap (Zoom / De-zoom instantané)
  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1.5) {
        resetTransform();
      } else {
        const next = 2.5;
        scale.value = withSpring(next, { damping: 25, stiffness: 180 });
        savedScale.value = next;
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        runOnJS(setZoomLevel)(next);
      }
    });

  // Simple Tap (Fermeture si non zoomé)
  const singleTap = Gesture.Tap()
    .onEnd(() => {
      if (scale.value <= 1.05) runOnJS(onClose)();
    });

  const composed = Gesture.Simultaneous(
    Gesture.Exclusive(doubleTap, singleTap),
    pinchGesture,
    panGesture
  );

  // Styles animés de l'image
  const imageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  // Style animé pour masquer discrètement l'indicateur x1.0
  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: withTiming(scale.value > 1.05 ? 1 : 0, { duration: 150 }),
    transform: [{ scale: withTiming(scale.value > 1.05 ? 1 : 0.8, { duration: 150 }) }]
  }));

  // ─── ACTIONS ────────────────────────────────────────────────────────────────
  const handleClose = useCallback(() => {
    scale.value = 1;
    savedScale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    savedX.value = 0;
    savedY.value = 0;
    setZoomLevel(1);
    onClose();
  }, [onClose]);

  const handleDownload = useCallback(async () => {
    if (downloading) return;
    setDownloading(true);
    const result = await saveToGallery(uri);
    setDownloading(false);
    if (result.success) onDownloadSuccess?.();
    else onDownloadError?.(result.message);
  }, [uri, downloading, onDownloadSuccess, onDownloadError]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <GestureHandlerRootView className="flex-1">
        <View className="flex-1 bg-black justify-center items-center">

          {/* BARRE SUPÉRIEURE FLOUTÉE CONTRASTÉE */}
          <View className="absolute top-0 left-0 right-0 z-50 flex-row items-center justify-between px-5 pt-14 pb-4 bg-gradient-to-b from-black/60 to-transparent">
            {/* Indicateur de grossissement intelligent */}
            <Animated.View style={indicatorStyle} className="px-2.5 py-1 rounded-md bg-white/10 border border-white/5 backdrop-blur-md">
              <Text className="text-white text-[11px] font-bold tracking-wide uppercase">
                {zoomLevel.toFixed(1)}×
              </Text>
            </Animated.View>
            
            {/* Élément de remplissage pour conserver l'alignement si l'indicateur est masqué */}
            <View className="flex-1" />

            {/* Bouton de sortie */}
            <Pressable
              onPress={handleClose}
              className="h-9 w-9 items-center justify-center rounded-full bg-white/10 border border-white/5 backdrop-blur-md active:scale-95 active:bg-white/20 transition-all"
            >
              <X size={16} color="#FFFFFF" strokeWidth={2.5} />
            </Pressable>
          </View>

          {/* ZONE DE DÉTECTION ET AFFICHAGE DE L'IMAGE */}
          <GestureDetector gesture={composed}>
            <View className="w-full h-full justify-center items-center">
              <Animated.View style={imageStyle}>
                <Image
                  source={{ uri }}
                  style={{
                    width: SCREEN_W,
                    aspectRatio,
                  }}
                  resizeMode="contain"
                />
              </Animated.View>
            </View>
          </GestureDetector>

          {/* BARRE DE PIED ACTIONS MINIMALISTE */}
          <View className="absolute bottom-0 left-0 right-0 z-50 pb-12 px-6 bg-gradient-to-t from-black/60 to-transparent items-center">
            <Pressable
              onPress={handleDownload}
              disabled={downloading}
              className="flex-row items-center gap-x-2 px-5 h-10 rounded-xl bg-white text-black border border-white/10 active:scale-[0.98] disabled:opacity-40 transition-transform"
            >
              {downloading ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <Download size={14} color="#000000" strokeWidth={2.5} />
              )}
              <Text className="text-black text-[12px] font-bold uppercase tracking-wider">
                {downloading ? 'Enregistrement…' : 'Enregistrer'}
              </Text>
            </Pressable>
          </View>

        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}