import { toast } from '@/hooks/use-toast';

export type SocialPlatform = 'Facebook' | 'LinkedIn' | 'Instagram' | 'TikTok' | 'Twitter/X';

/**
 * Detects if user is on mobile device
 */
const isMobile = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

/**
 * Opens the specified social media platform with pre-filled content
 * @param platform - The social media platform to open
 * @param content - The content to pre-fill
 * @param imageUrl - Optional image URL
 */
export const openSocialMedia = async (
  platform: SocialPlatform,
  content: string,
  imageUrl?: string
): Promise<void> => {
  // First, always copy content to clipboard
  await copyToClipboard(content, platform);
  
  let url: string;
  const mobile = isMobile();
  
  switch (platform) {
    case 'Facebook':
      if (mobile) {
        // Try Facebook app first
        url = 'fb://';
        setTimeout(() => {
          // Fallback to mobile web if app not installed
          window.location.href = 'https://m.facebook.com/';
        }, 500);
      } else {
        url = 'https://www.facebook.com/';
      }
      toast({
        title: 'Facebook',
        description: '📋 Tekst je kopiran! Zalijepite ga u novu objavu.',
        duration: 5000,
      });
      break;
      
    case 'LinkedIn':
      if (mobile) {
        url = 'linkedin://';
        setTimeout(() => {
          window.location.href = 'https://www.linkedin.com/feed/';
        }, 500);
      } else {
        url = 'https://www.linkedin.com/feed/';
      }
      toast({
        title: 'LinkedIn',
        description: '📋 Tekst je kopiran! Zalijepite ga u novu objavu.',
        duration: 5000,
      });
      break;
      
    case 'Twitter/X':
      // Twitter supports pre-filled text through intent URL
      if (mobile) {
        url = `twitter://post?message=${encodeURIComponent(content)}`;
        setTimeout(() => {
          // Fallback to web
          window.location.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(content)}`;
        }, 500);
      } else {
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(content)}`;
      }
      toast({
        title: 'Twitter/X',
        description: '✅ Otvaram Twitter s vašim sadržajem...',
        duration: 3000,
      });
      break;
      
    case 'Instagram':
      if (mobile) {
        // Try Instagram app
        url = 'instagram://camera';
        setTimeout(() => {
          // Show instructions since Instagram web is blocked
          toast({
            title: 'Instagram App',
            description: '📋 Tekst je kopiran! Otvorite Instagram app i zalijepite sadržaj.',
            duration: 6000,
          });
        }, 100);
      } else {
        // Desktop - just show instructions
        toast({
          title: 'Instagram',
          description: '📋 Tekst je kopiran! Otvorite Instagram aplikaciju ili web stranicu i zalijepite sadržaj ručno.',
          duration: 6000,
        });
        return; // Don't try to open web as it's blocked
      }
      break;
      
    case 'TikTok':
      if (mobile) {
        url = 'tiktok://';
        setTimeout(() => {
          toast({
            title: 'TikTok App',
            description: '📋 Tekst je kopiran! Zalijepite ga u novu objavu.',
            duration: 5000,
          });
        }, 100);
      } else {
        toast({
          title: 'TikTok',
          description: '📋 Tekst je kopiran! Otvorite TikTok app i zalijepite sadržaj.',
          duration: 6000,
        });
        return;
      }
      break;
      
    default:
      toast({
        title: 'Greška',
        description: 'Nepoznata platforma',
        variant: 'destructive',
      });
      return;
  }
  
  // Open URL
  try {
    window.open(url, '_blank', 'noopener,noreferrer');
  } catch (error) {
    console.error(`Error opening ${platform}:`, error);
    // Silently fail - user already has content in clipboard
  }
};

/**
 * Copies text to clipboard
 * @param text - Text to copy
 * @param platform - Platform name for toast message
 */
const copyToClipboard = async (text: string, platform: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(text);
    // Silent copy - toast will be shown by the platform-specific message
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    toast({
      title: 'Greška',
      description: 'Nije moguće kopirati tekst u clipboard.',
      variant: 'destructive',
    });
  }
};
