import { Platform, Share } from 'react-native';

export async function shareOrCopy(text: string): Promise<'shared' | 'copied' | 'shown'> {
  if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
    const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
    if (nav.share) {
      try {
        await nav.share({ text });
        return 'shared';
      } catch {
        // user cancel or unsupported — fall through
      }
    }
    if (nav.clipboard?.writeText) {
      await nav.clipboard.writeText(text);
      return 'copied';
    }
  }
  try {
    await Share.share({ message: text });
    return 'shared';
  } catch {
    return 'shown';
  }
}
