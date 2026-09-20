import { router, useLocalSearchParams } from 'expo-router';
import { Activity, Eye, EyeOff, Lock, QrCode, ShieldAlert, ShieldCheck } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useKeyRecovery } from '@/features/auth/hooks/use-key-recovery';
import { AssociateDevicePanel } from '@/features/devices/components/associate-device-panel';
import { refreshExistingConversationKeys } from '@/features/messaging/lib/refresh-conversation-keys';
import { useAuth, useToast } from '@/providers';
import { authApi } from '@/shared/api/auth';
import { createKeyBackup, generateIdentityKeys, restoreKeyBackup } from '@/shared/crypto';
import { clearCachedChatKeys } from '@/shared/crypto/reset-device';
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

      // Purge stale chat keys from a previous session — the new device
      // will fetch its own ChatMemberKeys from the server on demand.
      await clearCachedChatKeys();

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

              // Purge ALL cached chat keys so ensureChatKeyForChat
              // triggers a bounded key refresh for existing conversations.
              await clearCachedChatKeys();
              await refreshExistingConversationKeys();

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
  if (silentRecovery || isRecovering) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-[#0A0A0A]" edges={['top', 'left', 'right', 'bottom']}>
        <View className="flex-1 items-center justify-center px-6">
          <ActivityIndicator size="large" color="#F97316" />
          <Text className="mt-6 text-base font-black uppercase tracking-widest text-zinc-950 dark:text-white text-center">
            Configuration en cours…
          </Text>
          <Text className="mt-3 text-xs font-bold text-zinc-500 dark:text-zinc-400 text-center px-8 leading-relaxed">
            Récupération sécurisée de vos données de chiffrement. Veuillez patienter.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─── STANDARD UI (QR or manual password) ────────────────────────────
  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#0A0A0A]" edges={['top', 'left', 'right', 'bottom']}>
      
      {/* HEADER : Plat et Solide */}
      <View className="flex-row items-center border-b-2 border-zinc-100 bg-white px-6 py-4 dark:border-[#1A1A1A] dark:bg-[#0A0A0A]">
        <View className="flex-1 justify-center">
          <Text className="text-lg font-black tracking-tight text-zinc-950 dark:text-white" numberOfLines={1}>
            Récupération des clés
          </Text>
          <Text className="text-[10px] font-black uppercase tracking-widest text-orange-500 mt-0.5">
            Sécurité du protocole
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 32,
          paddingBottom: insets.bottom + 32,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="max-w-md w-full mx-auto">
          {/* Status Badge */}
          <View className="items-center mb-8">
            <View
              className={`h-20 w-20 items-center justify-center rounded-full border-2 ${
                keyMissing === true
                  ? 'bg-red-500/10 border-red-500/30'
                  : keyMissing === false
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-orange-500/10 border-orange-500/30'
              }`}
            >
              {keyMissing === true ? (
                <ShieldAlert size={28} color="#EF4444" strokeWidth={2.5} />
              ) : keyMissing === false ? (
                <ShieldCheck size={28} color="#10B981" strokeWidth={2.5} />
              ) : (
                <Activity size={28} color="#F97316" strokeWidth={2.5} />
              )}
            </View>

            <Text className="mt-4 text-lg font-black tracking-tight text-zinc-950 dark:text-white text-center">
              {keyMissing === true
                ? 'Clés introuvables'
                : keyMissing === false
                ? 'Clés sécurisées'
                : 'Analyse du coffre-fort'}
            </Text>
          </View>

          {/* Toggle Tabs (rounded-full) */}
          <View className="flex-row rounded-full bg-zinc-100 p-1.5 dark:bg-[#1A1A1A] mb-8">
            <Pressable
              onPress={() => setMode('qr')}
              className={`flex-1 flex-row items-center justify-center py-3 rounded-full transition-all ${
                mode === 'qr' ? 'bg-white dark:bg-[#222222]' : ''
              }`}
            >
              <QrCode size={16} color={mode === 'qr' ? '#F97316' : '#A1A1AA'} strokeWidth={2.5} />
              <Text
                className={`ml-2 text-xs font-black uppercase tracking-widest ${
                  mode === 'qr' ? 'text-zinc-950 dark:text-white' : 'text-zinc-500'
                }`}
              >
                Association QR
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setMode('password')}
              className={`flex-1 flex-row items-center justify-center py-3 rounded-full transition-all ${
                mode === 'password' ? 'bg-white dark:bg-[#222222]' : ''
              }`}
            >
              <Lock size={16} color={mode === 'password' ? '#F97316' : '#A1A1AA'} strokeWidth={2.5} />
              <Text
                className={`ml-2 text-xs font-black uppercase tracking-widest ${
                  mode === 'password' ? 'text-zinc-950 dark:text-white' : 'text-zinc-500'
                }`}
              >
                Par Mot de passe
              </Text>
            </Pressable>
          </View>

          {/* Mode Contents */}
          {mode === 'qr' ? (
            <View className="w-full">
              <AssociateDevicePanel autoStart />
            </View>
          ) : (
            <View className="gap-y-6">
              <View className="rounded-2xl bg-zinc-100 p-5 dark:bg-[#1A1A1A]">
                <Text className="text-xs font-bold leading-relaxed text-zinc-500 dark:text-zinc-400 text-center">
                  Saisissez le mot de passe de votre compte pour déchiffrer la sauvegarde de clé privée stockée sur le serveur.
                </Text>
              </View>

              <View className="gap-y-2">
                <Text className="text-[11px] font-black uppercase tracking-widest text-zinc-500">
                  Mot de passe du compte
                </Text>
                <Input
                  placeholder="••••••••"
                  placeholderTextColor="#A1A1AA"
                  value={password}
                  onChangeText={setPassword}
                  leftIcon={Lock}
                  secureTextEntry={!showPassword}
                  rightIcon={showPassword ? EyeOff : Eye}
                  onRightIconPress={() => setShowPassword(!showPassword)}
                  containerClassName="bg-zinc-100 border-0 dark:bg-[#1A1A1A] rounded-full h-14 px-5"
                  className="text-sm font-bold text-zinc-950 dark:text-white"
                />
              </View>

              {attemptsRemaining !== null && (
                <Text className="text-center text-xs font-black uppercase tracking-widest text-red-500">
                  {attemptsRemaining === 0
                    ? 'Compte verrouillé pendant 15 minutes.'
                    : `Tentatives restantes : ${attemptsRemaining}`}
                </Text>
              )}

              <Button
                label="Déchiffrer et Restaurer"
                onPress={() => handleRecovery()}
                loading={isRecovering}
                disabled={isRecovering}
                size="lg"
                className="bg-orange-500 text-white rounded-full h-14 active:bg-orange-600 mt-2"
              />
            </View>
          )}

          <View className="mt-10 items-center pb-6">
            <Pressable onPress={handleBypassRecovery} disabled={isRecovering} className="p-2 active:opacity-80">
              <Text className="text-xs font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 text-center underline">
                Ignorer la récupération (générer de nouvelles clés)
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}