
import React, { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useBusinessDocuments } from '@/hooks/useBusinessDocuments';
import { Upload, FileText, Trash2, Download, Loader2 } from 'lucide-react';

interface BusinessDocumentsProps {
  profileId?: string | null;
}

const BusinessDocuments: React.FC<BusinessDocumentsProps> = ({ profileId }) => {
  const { 
    documents, 
    isLoading, 
    isUploading, 
    uploadDocument, 
    deleteDocument 
  } = useBusinessDocuments(profileId);
  
  if (!profileId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Poslovni dokumenti
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Odaberite ili spremite profil za upravljanje dokumentima
          </p>
        </CardContent>
      </Card>
    );
  }
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      await uploadDocument(file);
    }

    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeLabel = (type: string): string => {
    const typeMap: { [key: string]: string } = {
      'application/pdf': 'PDF',
      'text/plain': 'TXT',
      'text/csv': 'CSV',
      'application/msword': 'DOC',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
      'application/vnd.ms-excel': 'XLS',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX'
    };
    return typeMap[type] || 'FILE';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Poslovni dokumenti
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Uploadajte dokumente koje AI može koristiti za bolji kontekst (max 10MB po datoteci)
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.txt,.csv,.doc,.docx,.xls,.xlsx"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />
          <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-600 mb-2">
            Povucite datoteke ovdje ili kliknite za upload
          </p>
          <Button 
            variant="outline" 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Upload u tijeku...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Odaberite datoteke
              </>
            )}
          </Button>
          <p className="text-xs text-gray-500 mt-2">
            Podržani formati: PDF, TXT, CSV, DOC, DOCX, XLS, XLSX
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-4">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-600">Učitavam dokumente...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-4">
            <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-600">
              Nema uploadanih dokumenata
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Uploadani dokumenti:</h4>
            {documents.map((doc) => (
              <div 
                key={doc.id} 
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="font-medium text-sm">{doc.name}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Badge variant="secondary" className="text-xs">
                        {getFileTypeLabel(doc.type)}
                      </Badge>
                      <span>{formatFileSize(doc.size)}</span>
                      <span>•</span>
                      <span>{new Date(doc.uploadedAt).toLocaleDateString('hr-HR')}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const popup = window.open(doc.url, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
                      if (!popup) {
                        window.open(doc.url, '_blank');
                      }
                    }}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteDocument(doc.name.split('-').slice(1).join('-'))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BusinessDocuments;
