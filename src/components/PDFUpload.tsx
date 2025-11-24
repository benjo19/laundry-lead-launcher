import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Upload, Loader2, CheckCircle2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface AnalysisResult {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

const PDFUpload = () => {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        toast({
          title: 'Greška',
          description: 'Molimo odaberite PDF fajl',
          variant: 'destructive',
        });
        return;
      }
      if (selectedFile.size > 20 * 1024 * 1024) {
        toast({
          title: 'Greška',
          description: 'Fajl ne smije biti veći od 20MB',
          variant: 'destructive',
        });
        return;
      }
      setFile(selectedFile);
      if (!title) {
        setTitle(selectedFile.name.replace('.pdf', ''));
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: 'Greška',
        description: 'Molimo odaberite PDF fajl',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    setProgress(10);
    setAnalysisResult(null);

    try {
      console.log('Uploading PDF:', file.name);
      
      // Prepare form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);

      setProgress(30);

      // Call edge function
      const { data, error } = await supabase.functions.invoke('analyze-pdf', {
        body: formData,
      });

      setProgress(80);

      if (error) {
        console.error('Upload error:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Upload failed');
      }

      setProgress(100);
      console.log('PDF analyzed successfully:', data.data);

      setAnalysisResult(data.data);

      toast({
        title: 'Uspješno!',
        description: 'PDF je uspješno analiziran i spremljen u bazu znanja',
      });

      // Reset form
      setFile(null);
      setTitle('');
      const fileInput = document.getElementById('pdf-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error) {
      console.error('Error uploading PDF:', error);
      toast({
        title: 'Greška',
        description: error instanceof Error ? error.message : 'Dogodila se greška pri uploadu PDF-a',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Upload i Analiza PDF Dokumenata
          </CardTitle>
          <CardDescription>
            Uploadujte PDF dokumente koji će biti automatski analizirani AI-em i spremljeni u bazu znanja
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Naslov dokumenta</Label>
              <Input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Unesite naslov dokumenta"
                disabled={isUploading}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="pdf-upload">PDF Fajl</Label>
              <div className="mt-1">
                <Input
                  id="pdf-upload"
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  disabled={isUploading}
                  className="cursor-pointer"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Maksimalna veličina: 20MB | Format: PDF
              </p>
            </div>

            {file && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <FileText className="h-4 w-4 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            )}

            {isUploading && progress > 0 && (
              <div className="space-y-2">
                <Progress value={progress} className="w-full" />
                <p className="text-xs text-muted-foreground text-center">
                  {progress < 40 ? 'Upload u toku...' : progress < 85 ? 'Analiziranje PDF-a...' : 'Spremanje u bazu...'}
                </p>
              </div>
            )}

            <Button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analiziranje u toku...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Uploaduj i Analiziraj PDF
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {analysisResult && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900">
              <CheckCircle2 className="h-5 w-5" />
              PDF Uspješno Analiziran
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-green-900">Naslov</Label>
              <p className="text-sm mt-1">{analysisResult.title}</p>
            </div>
            <div>
              <Label className="text-green-900">Ekstraktovani Sadržaj (preview)</Label>
              <div className="mt-1 p-3 bg-white rounded-lg border max-h-60 overflow-y-auto">
                <pre className="text-xs whitespace-pre-wrap">
                  {analysisResult.content.substring(0, 500)}
                  {analysisResult.content.length > 500 && '...'}
                </pre>
              </div>
            </div>
            <div>
              <Label className="text-green-900">Status</Label>
              <p className="text-sm mt-1">
                Spremljeno u bazu znanja • {new Date(analysisResult.created_at).toLocaleString('hr-HR')}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PDFUpload;
