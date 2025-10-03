import { toast } from '@/hooks/use-toast';

export type SocialPlatform = 'Facebook' | 'LinkedIn' | 'Instagram' | 'TikTok' | 'Twitter/X';

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
  let shouldOpen = true;
  
  switch (platform) {
    case 'Facebook':
      // Copy to clipboard and inform user
      toast({
        title: 'Facebook',
        description: 'Tekst je kopiran! Otvorit će se Facebook - zalijepite sadržaj u novu objavu.',
      });
      url = 'https://www.facebook.com/';
      break;
      
    case 'LinkedIn':
      toast({
        title: 'LinkedIn',
        description: 'Tekst je kopiran! Otvorit će se LinkedIn - zalijepite sadržaj u novu objavu.',
      });
      url = 'https://www.linkedin.com/feed/';
      break;
      
    case 'Twitter/X':
      // Twitter supports pre-filled text through intent URL
      toast({
        title: 'Twitter/X',
        description: 'Otvaram Twitter s vašim sadržajem...',
      });
      url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(content)}`;
      break;
      
    case 'Instagram':
      toast({
        title: 'Instagram',
        description: 'Tekst je kopiran! Otvorit će se Instagram - zalijepite sadržaj u novu objavu.',
      });
      url = 'https://www.instagram.com/';
      break;
      
    case 'TikTok':
      toast({
        title: 'TikTok',
        description: 'Tekst je kopiran! Otvorit će se TikTok - zalijepite sadržaj u novu objavu.',
      });
      url = 'https://www.tiktok.com/';
      break;
      
    default:
      toast({
        title: 'Greška',
        description: 'Nepoznata platforma',
        variant: 'destructive',
      });
      return;
  }
  
  if (shouldOpen) {
    // Open in new tab
    try {
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error(`Error opening ${platform}:`, error);
      // If window.open fails, try direct navigation
      window.location.href = url;
    }
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
    toast({
      title: 'Tekst kopiran',
      description: `Sadržaj za ${platform} je kopiran u clipboard.`,
    });
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    toast({
      title: 'Greška',
      description: 'Nije moguće kopirati tekst u clipboard.',
      variant: 'destructive',
    });
  }
};
