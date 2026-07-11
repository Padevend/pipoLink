/**
 * Password strength validation using @zxcvbn-ts/core.
 *
 * Why @zxcvbn-ts instead of zxcvbn?
 * - Modular: we only import fr + common dictionaries, keeping bundle ~200KB lighter.
 * - TypeScript-native, compatible with Expo/React Native.
 * - The server uses the classic `zxcvbn` (bundle size irrelevant there).
 *
 * This module is used ONLY for client-side entropy checks.
 * The server performs its own zxcvbn check independently (defense in depth).
 */
import { ZxcvbnFactory, Options } from '@zxcvbn-ts/core';
import * as zxcvbnCommonPackage from '@zxcvbn-ts/language-common';
import * as zxcvbnFrPackage from '@zxcvbn-ts/language-fr';

let _factory: ZxcvbnFactory | null = null;

function getFactory(): ZxcvbnFactory {
  if (_factory) return _factory;
  const options = new Options({
    translations: zxcvbnFrPackage.translations,
    graphs: zxcvbnCommonPackage.adjacencyGraphs,
    dictionary: {
      ...zxcvbnCommonPackage.dictionary,
      ...zxcvbnFrPackage.dictionary,
    },
  });
  _factory = new ZxcvbnFactory(options);
  return _factory;
}

/** Minimum acceptable zxcvbn score (0-4 scale). Scores 0 and 1 are rejected per spec §3. */
const MIN_SCORE = 2;

export interface PasswordStrengthResult {
  /** Score 0-4 (0 = very weak, 4 = very strong) */
  score: number;
  /** Whether the score meets the minimum threshold */
  isStrong: boolean;
  /** User-facing feedback message when password is too weak */
  feedback: string | null;
}

/**
 * Evaluates password entropy via zxcvbn.
 * Composition rules (length, uppercase, digit) are checked separately — this only handles entropy.
 */
export function checkPasswordStrength(password: string): PasswordStrengthResult {
  if (!password || password.length < 4) {
    return { score: 0, isStrong: false, feedback: null };
  }

  const factory = getFactory();
  const result = factory.check(password);

  return {
    score: result.score,
    isStrong: result.score >= MIN_SCORE,
    feedback:
      result.score < MIN_SCORE
        ? 'Ce mot de passe est trop facile à deviner, essayez une combinaison moins courante.'
        : null,
  };
}
