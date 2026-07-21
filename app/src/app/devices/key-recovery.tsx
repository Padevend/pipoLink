import { router, useLocalSearchParams } from 'expo-router';
import { Activity, Eye, EyeOff, Lock, QrCode, ShieldAlert, ShieldCheck } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useKeyRecovery } from '@/features/auth/hooks/use-key-recovery';
import { AssociateDevicePanel } from '@/features/devices/components/associate-device-panel';
import { useAuth, useToast } from '@/providers';
import { authApi } from '@/shared/api/auth';
import { createKeyBackup, generateIdentityKeys, restoreKeyBackup } from '@/shared/crypto';
import { SECURE_STORAGE_KEYS, SecureStorageService } from '@/shared/lib/storage';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { generateUUID } from '@/shared/utils/uuid';

export default function KeyRecoveryScreen(): JSX.Element {
  const { keyMissing } = useKeyRecovery();
  const { mode: initialMode } = useLocalSearchParams<{ mode: 'qr' | 'password' }>();
  const { signInWithTokens } = useAuth();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();

  const [mode, setMode] = useState<'qr' | 'password'>(initialMode || 'qr');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [lockedUntil, setLockedUntil] = useState<string | null>(null);

  /**
   * Spec §5.4 — Silent key recovery (Cas B).
   *
   * When mode=password and the temporary password is available from login,
   * we auto-trigger the recovery immediately with just a neutral loader.
   * No intermediate UI, no manual password entry needed.
   */
  const [silentRecovery, setSilentRecovery] = useState(true);
  const autoRecoveryAttempted = useRef(false);

  useEffect(() => {
    if (!autoRecoveryAttempted.current) {
      autoRecoveryAttempted.current = true;
      void (async () => {
        const tempPassword = await SecureStorageService.get('temp_login_password');
        if (tempPassword) {
          await handleRecovery(tempPassword);
        } else {
          await checkDevicesAndFallback();
        }
      })();
    }
  }, []);

  const checkDevicesAndFallback = async () => {
    try {
      const { userApi } = require('@/shared/api/user');
      const keys = await userApi.listDevicePublicKeys('me');
      if (keys && keys.length > 0) {
        setMode('qr');
      } else {
        setMode('password');
      }
    } catch (e) {
      setMode('password');
    }
    setSilentRecovery(false);
  };

  const handleRecovery = async (pwdToUse?: string) => {
    const passwordToUse = pwdToUse || password;
    if (!passwordToUse) {
      showToast({ type: 'error', message: 'Veuillez saisir votre mot de passe' });
      return;
    }

    if (lockedUntil && new Date(lockedUntil) > new Date()) {
      const minutesLeft = Math.ceil((new Date(lockedUntil).getTime() - Date.now()) / 60000);
      showToast({ type: 'error', message: `Trop de tentatives. Veuillez réessayer dans ${minutesLeft} minute(s).` });
      return;
    }

    setIsRecovering(true);
    try {
      const backupStr = await SecureStorageService.get('temp_key_backup');
      if (!backupStr) {
        if (!pwdToUse) showToast({ type: 'error', message: 'Aucune sauvegarde de clé trouvée sur le serveur.' });
        setIsRecovering(false);
        await checkDevicesAndFallback();
        return;
      }

      const backup = JSON.parse(backupStr);
      const success = await restoreKeyBackup(passwordToUse, backup.encrypted_key, backup.salt);

      if (!success) {
        const failedRes = await authApi.failedRecovery();
        setAttemptsRemaining(failedRes.attemptsRemaining);
        setLockedUntil(failedRes.lockedUntil);
        
        let errorMsg = `Mot de passe incorrect.`;
        if (failedRes.lockedUntil) {
          errorMsg += ' Trop de tentatives. Votre compte est bloqué pendant 15 minutes.';
        } else {
          errorMsg += ` Tentatives restantes : ${failedRes.attemptsRemaining}`;
        }
        if (!pwdToUse) showToast({ type: 'error', message: errorMsg });
        setIsRecovering(false);
        await checkDevicesAndFallback();
        return;
      }

      // Retrieve the restored E2EE device key pair
      const deviceKeys = await generateIdentityKeys();

      let fingerprint = await SecureStorageService.get(SECURE_STORAGE_KEYS.DEVICE_FINGERPRINT);
      if (!fingerprint) {
        fingerprint = generateUUID();
        await SecureStorageService.set(SECURE_STORAGE_KEYS.DEVICE_FINGERPRINT, fingerprint);
      }

      const completeRes = await authApi.completeRecovery({
        deviceName: `${Platform.OS} device`,
        devicePlatform: Platform.OS,
        deviceFingerprint: fingerprint,
        devicePublicKey: deviceKeys.publicKey,
        deviceKeySignature: deviceKeys.signature,
      });

      await signInWithTokens(
        {
          accessToken: completeRes.tokens.accessToken,
          refreshToken: completeRes.tokens.refreshToken,
          expiresAt: typeof completeRes.tokens.expiresAt === 'string'
            ? completeRes.tokens.expiresAt
            : new Date(completeRes.tokens.expiresAt).getTime(),
          deviceId: completeRes.device.id,
        },
        completeRes.device as any,
      );

      // Clean up temp storage
      await SecureStorageService.remove('temp_login_email');
      await SecureStorageService.remove('temp_login_password');
      await SecureStorageService.remove('temp_key_backup');

      showToast({ type: 'success', message: 'Clés de chiffrement restaurées avec succès.' });
      router.replace('/(tabs)');
    } catch (err: any) {
      if (!pwdToUse) showToast({ type: 'error', message: err.message || 'Erreur lors de la récupération' });
      await checkDevicesAndFallback();
    } finally {
      setIsRecovering(false);
    }
  };

  const handleBypassRecovery = () => {
    Alert.alert(
      "Générer de nouvelles clés ?",
      "Vos anciens messages et conversations chiffrés ne seront plus visibles, car vous ne pourrez plus les déchiffrer. Cette action est irréversible.\n\nVoulez-vous continuer ?",
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Oui, ignorer",
          style: "destructive",
          onPress: async () => {
            setIsRecovering(true);
            try {
              const deviceKeys = await generateIdentityKeys({ forceNew: true });
              let fingerprint = await SecureStorageService.get(SECURE_STORAGE_KEYS.DEVICE_FINGERPRINT);
              if (!fingerprint) {
                fingerprint = generateUUID();
                await SecureStorageService.set(SECURE_STORAGE_KEYS.DEVICE_FINGERPRINT, fingerprint);
              }
              const completeRes = await authApi.completeRecovery({
                deviceName: `${Platform.OS} device`,
                devicePlatform: Platform.OS,
                deviceFingerprint: fingerprint,
                devicePublicKey: deviceKeys.publicKey,
                deviceKeySignature: deviceKeys.signature,
                isBypass: true,
              });
              await signInWithTokens(
                {
                  accessToken: completeRes.tokens.accessToken,
                  refreshToken: completeRes.tokens.refreshToken,
                  expiresAt: typeof completeRes.tokens.expiresAt === 'string'
                    ? completeRes.tokens.expiresAt
                    : new Date(completeRes.tokens.expiresAt).getTime(),
                  deviceId: completeRes.device.id,
                },
                completeRes.device as any,
              );

              // Remplacer la sauvegarde serveur (qui contient les ANCIENNES clés,
              // désormais inutilisables) par une sauvegarde des nouvelles clés,
              // pour que la prochaine récupération par mot de passe fonctionne.
              try {
                const tempPassword = await SecureStorageService.get('temp_login_password');
                if (tempPassword) {
                  const backup = await createKeyBackup(tempPassword);
                  if (backup) await authApi.backupKey(backup);
                }
              } catch {
                // non bloquant : la sauvegarde sera recréée au prochain changement de mot de passe
              }

              await SecureStorageService.remove('temp_login_email');
              await SecureStorageService.remove('temp_login_password');
              await SecureStorageService.remove('temp_key_backup');
              showToast({ type: 'success', message: 'Nouvelles clés générées avec succès.' });
              router.replace('/(tabs)');
            } catch (err: any) {
              showToast({ type: 'error', message: err.message || 'Erreur lors de la génération de clés' });
            } finally {
              setIsRecovering(false);
            }
          },
        },
      ]
    );
  };

  // ─── SILENT LOADER (Spec §5.4) ─────────────────────────────────────
  // When auto-recovering from saved password, show only a neutral loader.
  // No tabs, no password field, no technical detail visible.
  if (silentRecovery || isRecovering) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950" edges={['top', 'left', 'right', 'bottom']}>
        <View className="flex-1 items-center justify-center px-6">
          <ActivityIndicator size="large" color="#F97316" />
          <Text className="mt-6 text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50 text-center">
            Configuration en cours…
          </Text>
          <Text className="mt-2 text-xs font-semibold text-zinc-400 dark:text-zinc-500 text-center px-8">
            Récupération sécurisée de vos données de chiffrement. Veuillez patienter.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─── STANDARD UI (QR or manual password) ────────────────────────────
  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950" edges={['top', 'left', 'right', 'bottom']}>
      {/* HEADER */}
      <View className="flex-row items-center border-b border-zinc-100 bg-white px-4 py-3 dark:border-zinc-900 dark:bg-zinc-950">

        <View className="flex-1 ml-3">
          <Text className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Récupération des clés
          </Text>
          <Text className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mt-0.5">
            Sécurité du protocole
          </Text>
        </View>
      </View>

      <View
        className="flex-1 justify-between p-4"
        style={{
          paddingBottom: insets.bottom + 16,
          paddingLeft: insets.left + 16,
          paddingRight: insets.right + 16
        }}
      >
        <View className="flex-1 justify-start max-w-md w-full mx-auto">
          {/* Status Badge */}
          <View className="items-center mb-6 mt-2">
            <View
              className={`h-12 w-12 items-center justify-center rounded-xl border ${
                keyMissing === true
                  ? 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900'
                  : keyMissing === false
                  ? 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-900'
                  : 'bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-900'
              }`}
            >
              {keyMissing === true ? (
                <ShieldAlert size={18} color="#EF4444" />
              ) : keyMissing === false ? (
                <ShieldCheck size={18} color="#22C55E" />
              ) : (
                <Activity size={18} color="#F97316" />
              )}
            </View>

            <Text className="mt-3 text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {keyMissing === true
                ? 'Clés introuvables'
                : keyMissing === false
                ? 'Clés sécurisées'
                : 'Analyse du coffre-fort'}
            </Text>
          </View>

          {/* Toggle Tabs */}
          <View className="flex-row rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900 mb-6">
            <Pressable
              onPress={() => setMode('qr')}
              className={`flex-1 flex-row items-center justify-center py-2 rounded-md ${
                mode === 'qr' ? 'bg-white dark:bg-zinc-800' : ''
              }`}
            >
              <QrCode size={14} color={mode === 'qr' ? '#F97316' : '#71717A'} />
              <Text
                className={`ml-2 text-xs font-bold ${
                  mode === 'qr' ? 'text-zinc-900 dark:text-zinc-50' : 'text-zinc-500'
                }`}
              >
                Association QR
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setMode('password')}
              className={`flex-1 flex-row items-center justify-center py-2 rounded-md ${
                mode === 'password' ? 'bg-white dark:bg-zinc-800' : ''
              }`}
            >
              <Lock size={14} color={mode === 'password' ? '#F97316' : '#71717A'} />
              <Text
                className={`ml-2 text-xs font-bold ${
                  mode === 'password' ? 'text-zinc-900 dark:text-zinc-50' : 'text-zinc-500'
                }`}
              >
                Par Mot de passe
              </Text>
            </Pressable>
          </View>

          {/* Mode Contents */}
          {mode === 'qr' ? (
            <View className="flex-1">
              <AssociateDevicePanel autoStart />
            </View>
          ) : (
            <View className="gap-y-4">
              <View className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/20">
                <Text className="text-xs font-semibold leading-5 text-zinc-500 dark:text-zinc-400 text-center">
                  Saisissez le mot de passe de votre compte pour déchiffrer la sauvegarde de clé privée stockée sur le serveur.
                </Text>
              </View>

              <View className="relative mt-2">
                <Input
                  label="Mot de passe du compte"
                  placeholder="••••••••"
                  value={password}
                  onChangeText={setPassword}
                  leftIcon={Lock}
                  secureTextEntry={!showPassword}
                  rightIcon={showPassword ? EyeOff : Eye}
                  onRightIconPress={() => setShowPassword(!showPassword)}
                  containerClassName="bg-transparent"
                />
              </View>

              {attemptsRemaining !== null && (
                <Text className="text-center text-xs font-semibold text-red-500">
                  {attemptsRemaining === 0
                    ? 'Compte verrouillé pendant 15 minutes.'
                    : `Nombre de tentatives restantes : ${attemptsRemaining}`}
                </Text>
              )}

              <Button
                label="Déchiffrer et Restaurer"
                onPress={() => handleRecovery()}
                loading={isRecovering}
                disabled={isRecovering}
                className="bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-950 rounded-xl h-11 mt-2"
              />
            </View>
          )}

          <View className="mt-8 items-center pb-4">
            <Pressable onPress={handleBypassRecovery} disabled={isRecovering} className="p-2">
              <Text className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 underline text-center">
                Ignorer la récupération (générer de nouvelles clés)
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}