import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
  cancelAnimation,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import {
  Download,
  Pause,
  Play,
  RotateCcw,
  Check,
  LockKeyhole,
} from 'lucide-react-native';
import { cn } from '@/shared/utils/cn';
import type { AttachmentDownloadStatus } from '@/shared/api/types';

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface AttachmentProgressCircleProps {
  /** Download progress 0.0 → 1.0 */
  progress: number;
  /** Current download lifecycle status */
  status: AttachmentDownloadStatus | 'idle';
  /** Circle diameter in pixels (default 52) */
  size?: number;
  /** Whether the message is from the current user (affects colour) */
  isMine?: boolean;
  /** Tap handler — semantics depend on status (download / pause / resume / retry) */
  onPress: () => void;
  /** Optional additional className for the outer container */
  className?: string;
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const STROKE_WIDTH = 3;
// Brand orange
const COLOR_ACTIVE = '#FF7A00';
// Success green
const COLOR_DONE = '#22C55E';
// Error red
const COLOR_FAILED = '#EF4444';
// Neutral grey
const COLOR_PAUSED = '#94A3B8';
// White (for isMine bubbles)
const COLOR_MINE = '#FFFFFF';

// ─── HELPER: SVG ARC ─────────────────────────────────────────────────────────

/**
 * Converts a progress ratio (0.0–1.0) into an SVG arc path.
 * Draws a circular arc starting at the top (12 o'clock) and sweeping clockwise.
 */
function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
): string {
  const toRad = (deg: number) => (Math.PI * deg) / 180;
  const startX = cx + r * Math.cos(toRad(startAngle - 90));
  const startY = cy + r * Math.sin(toRad(startAngle - 90));
  const endX = cx + r * Math.cos(toRad(endAngle - 90));
  const endY = cy + r * Math.sin(toRad(endAngle - 90));
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${startX} ${startY} A ${r} ${r} 0 ${largeArc} 1 ${endX} ${endY}`;
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export function AttachmentProgressCircle({
  progress,
  status,
  size = 52,
  isMine = false,
  onPress,
  className,
}: AttachmentProgressCircleProps) {
  const radius = (size - STROKE_WIDTH * 2) / 2;
  const cx = size / 2;
  const cy = size / 2;

  // ── Shared animation values ──────────────────────────────────────────────
  const spinValue = useSharedValue(0);
  const pulseValue = useSharedValue(1);
  const scaleValue = useSharedValue(1);

  // Spin animation — used during 'decrypting' state
  useEffect(() => {
    if (status === 'decrypting' || status === 'queued') {
      spinValue.value = withRepeat(
        withTiming(1, { duration: 1000, easing: Easing.linear }),
        -1,
        false,
      );
    } else {
      cancelAnimation(spinValue);
      spinValue.value = 0;
    }
  }, [status]);

  // Pulse animation — used during 'queued' state
  useEffect(() => {
    if (status === 'queued') {
      pulseValue.value = withRepeat(
        withTiming(1.15, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    } else {
      cancelAnimation(pulseValue);
      pulseValue.value = 1;
    }
  }, [status]);

  // Scale pop when completed
  useEffect(() => {
    if (status === 'completed') {
      scaleValue.value = withSpring(1.1, { damping: 5 }, () => {
        scaleValue.value = withSpring(1);
      });
    }
  }, [status]);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(spinValue.value, [0, 1], [0, 360])}deg` }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseValue.value }],
  }));

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
  }));

  // ── Derived visual properties by status ──────────────────────────────────
  const ringColor = isMine ? COLOR_MINE : (() => {
    switch (status) {
      case 'completed':  return COLOR_DONE;
      case 'failed':     return COLOR_FAILED;
      case 'paused':     return COLOR_PAUSED;
      case 'cancelled':  return COLOR_PAUSED;
      default:           return COLOR_ACTIVE;
    }
  })();

  const arcEndAngle = Math.round(progress * 360);

  // ── Icon selection ────────────────────────────────────────────────────────
  const iconColor = isMine ? 'white' : ringColor;
  const iconSize = Math.round(size * 0.35);

  function renderIcon() {
    switch (status) {
      case 'idle':
        return <Download size={iconSize} color={iconColor} strokeWidth={2.5} />;
      case 'queued':
        return <Download size={iconSize} color={iconColor} strokeWidth={2.5} />;
      case 'downloading':
        return <Pause size={iconSize} color={iconColor} strokeWidth={2.5} />;
      case 'paused':
        return <Play size={iconSize} color={iconColor} strokeWidth={2.5} />;
      case 'decrypting':
        return <LockKeyhole size={iconSize} color={iconColor} strokeWidth={2.5} />;
      case 'completed':
        return <Check size={iconSize} color={iconColor} strokeWidth={3} />;
      case 'failed':
        return <RotateCcw size={iconSize} color={iconColor} strokeWidth={2.5} />;
      case 'cancelled':
        return <Download size={iconSize} color={iconColor} strokeWidth={2.5} />;
    }
  }

  // ── Background circle opacity ─────────────────────────────────────────────
  const bgOpacity = isMine ? 0.2 : 0.08;

  return (
    <Animated.View style={[pulseStyle, scaleStyle]} className={cn('items-center justify-center', className)}>
      <Pressable
        onPress={onPress}
        hitSlop={8}
        className="items-center justify-center active:opacity-70"
        style={{ width: size, height: size }}
      >
        {/* SVG ring layer */}
        <Animated.View
          style={[
            { position: 'absolute', width: size, height: size },
            (status === 'decrypting' || status === 'queued') ? spinStyle : undefined,
          ]}
        >
          <Svg width={size} height={size}>
            {/* Background track circle */}
            <Circle
              cx={cx}
              cy={cy}
              r={radius}
              stroke={ringColor}
              strokeWidth={STROKE_WIDTH}
              strokeOpacity={bgOpacity * 5}
              fill="none"
            />

            {/* Progress arc (only during downloading / decrypting) */}
            {(status === 'downloading' || status === 'decrypting' || status === 'paused') && arcEndAngle > 0 && (
              <Path
                d={describeArc(cx, cy, radius, 0, Math.min(arcEndAngle, 359.9))}
                stroke={ringColor}
                strokeWidth={STROKE_WIDTH}
                strokeLinecap="round"
                fill="none"
              />
            )}

            {/* Full circle for completed / failed (ring always full) */}
            {(status === 'completed' || status === 'failed') && (
              <Circle
                cx={cx}
                cy={cy}
                r={radius}
                stroke={ringColor}
                strokeWidth={STROKE_WIDTH}
                fill="none"
              />
            )}

            {/* Indeterminate 120° arc for queued/decrypting spin */}
            {(status === 'queued' || status === 'decrypting') && (
              <Path
                d={describeArc(cx, cy, radius, 0, 120)}
                stroke={ringColor}
                strokeWidth={STROKE_WIDTH}
                strokeLinecap="round"
                fill="none"
              />
            )}
          </Svg>
        </Animated.View>

        {/* Central background fill */}
        <View
          style={{
            width: size - STROKE_WIDTH * 4,
            height: size - STROKE_WIDTH * 4,
            borderRadius: size,
            backgroundColor: ringColor,
            opacity: bgOpacity,
            position: 'absolute',
          }}
        />

        {/* Icon */}
        {renderIcon()}
      </Pressable>
    </Animated.View>
  );
}
