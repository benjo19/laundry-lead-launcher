import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { HardDriveDownload, Loader2 } from 'lucide-react';

interface Props {
  clientId: string;
  onFilePicked: (file: File) => Promise<void>;
  disabled?: boolean;
  label?: string;
  accept?: string; // MIME types comma-separated, default 'application/pdf'
}

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

const loadScript = (src: string): Promise<void> =>
  new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });

const GoogleDrivePicker: React.FC<Props> = ({
  clientId,
  onFilePicked,
  disabled = false,
  label = 'Google Drive',
  accept = 'application/pdf',
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const downloadFile = async (fileId: string, fileName: string, token: string): Promise<File> => {
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) throw new Error(`Google Drive download failed: ${res.status}`);
    const blob = await res.blob();
    return new File([blob], fileName, { type: accept.split(',')[0].trim() });
  };

  const openPicker = useCallback(
    (token: string) => {
      window.gapi.load('picker', () => {
        const view = new window.google.picker.DocsView()
          .setMimeTypes(accept)
          .setMode(window.google.picker.DocsViewMode.LIST);

        const picker = new window.google.picker.PickerBuilder()
          .setOAuthToken(token)
          .setTitle('Odaberi fajl')
          .addView(view)
          .setCallback(async (data: any) => {
            if (data.action === window.google.picker.Action.PICKED) {
              const doc = data.docs[0];
              try {
                setLoading(true);
                const file = await downloadFile(doc.id, doc.name, token);
                await onFilePicked(file);
              } catch (err: any) {
                toast({
                  title: 'Greška pri preuzimanju',
                  description: err?.message || 'Fajl nije mogao biti preuzet iz Google Drivea.',
                  variant: 'destructive',
                });
              } finally {
                setLoading(false);
              }
            }
          })
          .build();

        picker.setVisible(true);
      });
    },
    [accept, onFilePicked, toast]
  );

  const handleClick = useCallback(async () => {
    if (!clientId) {
      toast({
        title: 'Google nije konfiguriran',
        description: 'Unesite Google Client ID u Postavkama → Google Calendar integracija.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      await loadScript('https://apis.google.com/js/api.js');
      await loadScript('https://accounts.google.com/gsi/client');

      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/drive.readonly',
        callback: (resp: any) => {
          if (resp.error) {
            toast({
              title: 'Google autorizacija neuspješna',
              description: resp.error,
              variant: 'destructive',
            });
            setLoading(false);
            return;
          }
          openPicker(resp.access_token);
        },
      });

      setLoading(false);
      // requestAccessToken must be called synchronously from a user gesture
      tokenClient.requestAccessToken({ prompt: '' });
    } catch (err: any) {
      setLoading(false);
      toast({
        title: 'Greška',
        description: err?.message || 'Nije moguće učitati Google API.',
        variant: 'destructive',
      });
    }
  }, [clientId, openPicker, toast]);

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full gap-2"
      onClick={handleClick}
      disabled={disabled || loading}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <HardDriveDownload className="h-4 w-4 text-blue-600" />
      )}
      {loading ? 'Učitavanje...' : label}
    </Button>
  );
};

export default GoogleDrivePicker;
