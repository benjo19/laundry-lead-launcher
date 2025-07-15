import React, { useState, useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, Image, Globe, Trash2, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface KnowledgeItem {
  id: string;
  title: string;
  content: string | null;
  type: 'pdf' | 'image' | 'website';
  file_path: string | null;
  url: string | null;
  metadata: any;
  created_at: string;
}

const KnowledgeBase = () => {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [websiteTitle, setWebsiteTitle] = useState('');

  useEffect(() => {
    if (user) {
      fetchKnowledgeItems();
    }
  }, [user]);

  const fetchKnowledgeItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_knowledge')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setKnowledgeItems((data || []) as KnowledgeItem[]);
    } catch (error) {
      console.error('Error fetching knowledge items:', error);
      toast({
        title: "Greška",
        description: "Neuspjeh dohvaćanja znanja.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'pdf' | 'image') => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        title: "Greška",
        description: "Fajl je prevelik. Maksimalna veličina je 10MB.",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    if (type === 'pdf' && file.type !== 'application/pdf') {
      toast({
        title: "Greška",
        description: "Molimo uploadajte PDF fajl.",
        variant: "destructive",
      });
      return;
    }

    if (type === 'image' && !file.type.startsWith('image/')) {
      toast({
        title: "Greška",
        description: "Molimo uploadajte sliku.",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);
      console.log('Starting file upload:', file.name, 'type:', type);
      
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      console.log('Uploading to storage path:', filePath);
      
      // Try alternative upload method using createSignedUploadUrl
      const { data: uploadData, error: signedError } = await supabase.storage
        .from('user-documents')
        .createSignedUploadUrl(filePath);

      if (signedError) {
        console.error('Signed URL error:', signedError);
        // Fallback to direct upload
        const { error: uploadError } = await supabase.storage
          .from('user-documents')
          .upload(filePath, file);
        
        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          throw uploadError;
        }
      } else {
        // Use signed URL for upload
        console.log('Using signed URL for upload');
        const formData = new FormData();
        formData.append('file', file);
        
        const uploadResponse = await fetch(uploadData.signedUrl, {
          method: 'POST',
          body: formData,
        });
        
        if (!uploadResponse.ok) {
          throw new Error(`Upload failed: ${uploadResponse.status}`);
        }
      }
      
      console.log('File uploaded to storage successfully');

      // Process file content using edge function
      const { data: processedData, error: processError } = await supabase.functions.invoke('process-document', {
        body: {
          filePath,
          type,
          title: file.name.replace(`.${fileExt}`, '')
        }
      });

      if (processError) throw processError;

      toast({
        title: "Uspjeh",
        description: `${type === 'pdf' ? 'PDF' : 'Slika'} je uspješno uploadana i procesirana.`,
      });

      fetchKnowledgeItems();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Greška",
        description: "Greška pri uploadu fajla.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Reset input
      event.target.value = '';
    }
  };

  const handleWebsiteAdd = async () => {
    if (!websiteUrl || !websiteTitle || !user) return;

    try {
      setUploading(true);

      // Process website using edge function
      const { data: processedData, error: processError } = await supabase.functions.invoke('process-website', {
        body: {
          url: websiteUrl,
          title: websiteTitle
        }
      });

      if (processError) throw processError;

      toast({
        title: "Uspjeh",
        description: "Website je uspješno dodan u knowledge base.",
      });

      setWebsiteUrl('');
      setWebsiteTitle('');
      fetchKnowledgeItems();
    } catch (error) {
      console.error('Error adding website:', error);
      toast({
        title: "Greška",
        description: "Greška pri dodavanju website-a.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const deleteKnowledgeItem = async (item: KnowledgeItem) => {
    try {
      const { error } = await supabase
        .from('user_knowledge')
        .delete()
        .eq('id', item.id);

      if (error) throw error;

      // Delete file from storage if it exists
      if (item.file_path) {
        await supabase.storage
          .from('user-documents')
          .remove([item.file_path]);
      }

      toast({
        title: "Uspjeh",
        description: "Element je obrisan iz knowledge base.",
      });

      fetchKnowledgeItems();
    } catch (error) {
      console.error('Error deleting knowledge item:', error);
      toast({
        title: "Greška",
        description: "Greška pri brisanju elementa.",
        variant: "destructive",
      });
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="h-5 w-5" />;
      case 'image': return <Image className="h-5 w-5" />;
      case 'website': return <Globe className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">AI Knowledge Base</h2>
      </div>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Upload Dokumenata</TabsTrigger>
          <TabsTrigger value="manage">Upravljanje</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* PDF Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  PDF Dokumenti
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Uploadajte PDF fajlove koji će biti procesurani i dodani u AI knowledge base.
                  </p>
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleFileUpload(e, 'pdf')}
                    disabled={uploading}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Image Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Slike
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Uploadajte slike koje će biti analizirane od strane AI-ja.
                  </p>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'image')}
                    disabled={uploading}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Website URL */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Website
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Dodajte website URL koji će biti scrapovan i dodan u knowledge base.
                  </p>
                  <Input
                    placeholder="Naslov"
                    value={websiteTitle}
                    onChange={(e) => setWebsiteTitle(e.target.value)}
                    disabled={uploading}
                  />
                  <Input
                    placeholder="https://example.com"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    disabled={uploading}
                  />
                  <Button 
                    onClick={handleWebsiteAdd}
                    disabled={!websiteUrl || !websiteTitle || uploading}
                    className="w-full"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processiranje...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Dodaj Website
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {uploading && (
            <div className="text-center p-4">
              <Loader2 className="mx-auto h-8 w-8 animate-spin" />
              <p className="mt-2 text-sm text-muted-foreground">Procesiranje dokumenta...</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="manage">
          <div className="space-y-4">
            {loading ? (
              <div className="text-center p-8">
                <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                <p className="mt-2 text-sm text-muted-foreground">Učitavanje...</p>
              </div>
            ) : knowledgeItems.length === 0 ? (
              <div className="text-center p-8">
                <p className="text-muted-foreground">Nema uploadanih dokumenata.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {knowledgeItems.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getIcon(item.type)}
                          <div>
                            <h3 className="font-medium">{item.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {item.type.toUpperCase()} • {new Date(item.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                Pogledaj
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>{item.title}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <strong>Tip:</strong> {item.type.toUpperCase()}
                                </div>
                                {item.url && (
                                  <div>
                                    <strong>URL:</strong> <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{item.url}</a>
                                  </div>
                                )}
                                <div>
                                  <strong>Sadržaj:</strong>
                                  <Textarea
                                    value={item.content || 'Nema procesiranog sadržaja'}
                                    readOnly
                                    className="mt-2 h-40"
                                  />
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteKnowledgeItem(item)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default KnowledgeBase;