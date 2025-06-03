
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface BusinessDocument {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: string;
}

export const useBusinessDocuments = () => {
  const [documents, setDocuments] = useState<BusinessDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadDocuments();
    }
  }, [user]);

  const loadDocuments = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.storage
        .from('business-documents')
        .list(user.id, {
          limit: 100,
          offset: 0,
        });

      if (error) throw error;

      const documentsWithUrls = await Promise.all(
        (data || []).map(async (file) => {
          const { data: urlData } = await supabase.storage
            .from('business-documents')
            .createSignedUrl(`${user.id}/${file.name}`, 3600);

          return {
            id: file.id || file.name,
            name: file.name,
            size: file.metadata?.size || 0,
            type: file.metadata?.mimetype || 'application/octet-stream',
            url: urlData?.signedUrl || '',
            uploadedAt: file.created_at || new Date().toISOString(),
          };
        })
      );

      setDocuments(documentsWithUrls);
    } catch (error) {
      console.error('Error loading documents:', error);
      toast({
        title: "Greška",
        description: "Dogodila se greška pri učitavanju dokumenata.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const uploadDocument = async (file: File): Promise<boolean> => {
    if (!user) return false;

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Datoteka prevelika",
        description: "Maksimalna veličina datoteke je 10MB.",
        variant: "destructive",
      });
      return false;
    }

    // Check file type
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'text/csv',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Nepodržan tip datoteke",
        description: "Podržani formati: PDF, TXT, CSV, DOC, DOCX, XLS, XLSX",
        variant: "destructive",
      });
      return false;
    }

    setIsUploading(true);

    try {
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `${user.id}/${fileName}`;

      const { error } = await supabase.storage
        .from('business-documents')
        .upload(filePath, file);

      if (error) throw error;

      await loadDocuments();
      
      toast({
        title: "Dokument uploadan",
        description: `${file.name} je uspješno uploadan.`,
      });

      return true;
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: "Greška pri uploadu",
        description: "Dogodila se greška pri uploadu dokumenta.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  const deleteDocument = async (documentName: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.storage
        .from('business-documents')
        .remove([`${user.id}/${documentName}`]);

      if (error) throw error;

      await loadDocuments();
      
      toast({
        title: "Dokument obrisan",
        description: "Dokument je uspješno obrisan.",
      });
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: "Greška",
        description: "Dogodila se greška pri brisanju dokumenta.",
        variant: "destructive",
      });
    }
  };

  const getDocumentContent = async (document: BusinessDocument): Promise<string> => {
    try {
      const response = await fetch(document.url);
      const blob = await response.blob();
      
      if (document.type === 'text/plain' || document.type === 'text/csv') {
        return await blob.text();
      } else if (document.type === 'application/pdf') {
        // For PDF, we'll return a placeholder - in production you'd use a PDF parser
        return `[PDF dokument: ${document.name} - sadržaj se može učitati pomoću PDF parser-a]`;
      } else {
        return `[Dokument: ${document.name} - ${document.type}]`;
      }
    } catch (error) {
      console.error('Error reading document content:', error);
      return `[Greška pri čitanju dokumenta: ${document.name}]`;
    }
  };

  return {
    documents,
    isLoading,
    isUploading,
    uploadDocument,
    deleteDocument,
    loadDocuments,
    getDocumentContent,
  };
};
