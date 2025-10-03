import { toast } from '@/hooks/use-toast';

export type SocialPlatform = 'Facebook' | 'LinkedIn' | 'Instagram' | 'TikTok' | 'Twitter/X';

/**
 * Opens the specified social media platform with pre-filled content
 * @param platform - The social media platform to open
 * @param content - The content to pre-fill
 * @param imageUrl - Optional image URL
 */
export const openSocialMedia = (
  platform: SocialPlatform,
  content: string,
  imageUrl?: string
): void => {
  let url: string;
  
  switch (platform) {
    case 'Facebook':
      // Facebook doesn't support pre-filled text via URL for security reasons
      // We can only share a URL, so we'll open the Facebook sharing dialog
      url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(content)}`;
      break;
      
    case 'LinkedIn':
      // LinkedIn share URL with text
      // Note: LinkedIn deprecated pre-filled text, so we'll open the share page
      url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`;
      // Copy content to clipboard for user to paste
      copyToClipboard(content, 'LinkedIn');
      break;
      
    case 'Twitter/X':
      // Twitter/X intent URL with pre-filled text
      url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(content)}`;
      if (imageUrl) {
        url += `&url=${encodeURIComponent(imageUrl)}`;
      }
      break;
      
    case 'Instagram':
      // Instagram doesn't have a web posting API
      // Best we can do is copy content and open Instagram web
      copyToClipboard(content, 'Instagram');
      url = 'https://www.instagram.com/';
      toast({
        title: 'Instagram',
        description: 'Tekst je kopiran. Otvorit će se Instagram - zalijepite sadržaj ručno.',
      });
      break;
      
    case 'TikTok':
      // TikTok doesn't have a web posting API
      // Copy content and open TikTok web
      copyToClipboard(content, 'TikTok');
      url = 'https://www.tiktok.com/';
      toast({
        title: 'TikTok',
        description: 'Tekst je kopiran. Otvorit će se TikTok - zalijepite sadržaj ručno.',
      });
      break;
      
    default:
      toast({
        title: 'Greška',
        description: 'Nepoznata platforma',
        variant: 'destructive',
      });
      return;
  }
  
  // Try to open in new window/tab
  try {
    const socialWindow = window.open(url, '_blank', 'noopener,noreferrer');
    
    // Check if popup was blocked
    setTimeout(() => {
      if (!socialWindow || socialWindow.closed || typeof socialWindow.closed === 'undefined') {
        // Popup blocked - use direct navigation as fallback
        toast({
          title: `Otvaranje ${platform}...`,
          description: 'Preusmjeravam vas na platformu',
        });
        window.location.href = url;
      }
    }, 100);
  } catch (error) {
    console.error(`Error opening ${platform}:`, error);
    window.location.href = url;
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
