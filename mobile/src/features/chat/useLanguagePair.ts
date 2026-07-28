import { useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { languageMeta, type LanguageMeta } from '../../config/constants';

export type LanguagePairInfo = {
  nativeCode: string;
  targetCode: string;
  level: string;
  native: LanguageMeta;
  target: LanguageMeta;
  label: string;
  subtitle: string;
};

export function useLanguagePair(): LanguagePairInfo {
  const { settings } = useAuth();

  return useMemo(() => {
    const nativeCode = settings?.nativeLanguage ?? 'en';
    const targetCode = settings?.targetLanguage ?? 'es';
    const level = settings?.level ?? 'A1';

    const native = languageMeta(nativeCode);
    const target = languageMeta(targetCode);

    return {
      nativeCode,
      targetCode,
      level,
      native,
      target,
      label: `${native.label} → ${target.label}`,
      subtitle: `${native.label} to ${target.label} • ${level}`,
    };
  }, [settings]);
}
