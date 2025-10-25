function resolveBooleanFlag(value: string | undefined, defaultValue: boolean) {
  if (value === undefined) {
    return defaultValue;
  }

  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true;
  }
  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false;
  }
  return defaultValue;
}

export const featureFlags = {
  shareReflection: resolveBooleanFlag(process.env.NEXT_PUBLIC_FEATURE_SHARE_REFLECTIONS, true),
  shareAudioPreview: resolveBooleanFlag(process.env.NEXT_PUBLIC_FEATURE_SHARE_AUDIO, false),
  audioNarration: resolveBooleanFlag(process.env.NEXT_PUBLIC_FEATURE_PASSAGE_AUDIO, false),
};

export type FeatureFlags = typeof featureFlags;
