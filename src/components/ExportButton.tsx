
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, FileText, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ExportButtonProps {
  data: any[];
  filename: string;
  type: 'leads' | 'emails' | 'reminders' | 'posts';
  leads?: any[];
}

const ExportButton = ({ data, filename, type, leads }: ExportButtonProps) => {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const getRelevantFields = (item: any, type: string) => {
    switch (type) {
      case 'leads':
        return {
          'Tvrtka': item.company || '',
          'Email': item.email || '',
          'Telefon': item.phone || '',
          'Lokacija': item.location || '',
          'Broj zaposlenika': item.employees || '',
          'Tip poslovanja': item.industry || '',
          'Status': item.status || '',
          'Potencijal': item.potential || '',
          'Datum dodavanja': item.dateAdded || '',
          'Bilješke': item.notes || ''
        };
      case 'reminders':
        // Try to find associated lead by company name
        const associatedLead = leads?.find((lead: any) => 
          lead.company.toLowerCase() === item.company.toLowerCase()
        );
        
        return {
          'Naslov': item.title || '',
          'Opis': item.description || '',
          'Tvrtka': item.company || '',
          'Datum': item.date || '',
          'Vrijeme': item.time || '',
          'Prioritet': item.priority || '',
          'Status': item.status || '',
          // Dodatne informacije iz lead-a (ako postoje)
          'Email': associatedLead?.email || '',
          'Telefon': associatedLead?.phone || '',
          'Industrija': associatedLead?.industry || '',
          'Lokacija': associatedLead?.location || '',
          'Broj zaposlenika': associatedLead?.employees || '',
          'Website': associatedLead?.website || ''
        };
      case 'emails':
        return {
          'Prima': item.to || item.to_email || '',
          'Predmet': item.subject || '',
          'Sadržaj': item.content || '',
          'Template': item.template || '',
          'Status': item.status || '',
          'Datum slanja': item.dateSent || item.sent_at || '',
          'Stopa otvaranja': item.openRate || item.open_rate || '',
          'Stopa klika': item.clickRate || item.click_rate || ''
        };
      case 'posts':
        return {
          'Platforma': item.platform || '',
          'Sadržaj': item.content || '',
          'Tip sadržaja': item.contentType || '',
          'Datum': item.date || '',
          'Status': item.status || '',
          'Planirano vrijeme': item.scheduledTime || '',
          'Engagement': item.engagement || ''
        };
      default:
        // Fallback to original behavior
        const filteredItem = { ...item };
        delete filteredItem.id;
        delete filteredItem.user_id;
        return filteredItem;
    }
  };

  const escapeCSVField = (field: any): string => {
    if (field === null || field === undefined) return '';
    
    const stringValue = String(field);
    
    // Ako polje sadrži: quote, comma, ili newline → mora biti u quotes
    if (stringValue.includes('"') || stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('\r')) {
      // Dupliciraj sve quote znakove (RFC 4180 standard)
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    
    // Za sigurnost, sve stringove stavljamo u quotes
    return `"${stringValue}"`;
  };

  const exportToCSV = () => {
    if (data.length === 0) {
      toast({
        title: "Nema podataka",
        description: "Nema podataka za export.",
        variant: "destructive",
      });
      return;
    }

    // Get the first item to determine headers
    const firstItem = getRelevantFields(data[0], type);
    const headers = Object.keys(firstItem);
    
    // Header row sa pravim escapingom
    const headerRow = headers.map(h => escapeCSVField(h)).join(',');
    
    // Data rows sa pravim escapingom
    const dataRows = data.map(row => {
      const relevantData = getRelevantFields(row, type);
      return headers.map(header => escapeCSVField(relevantData[header])).join(',');
    });
    
    const csvContent = [headerRow, ...dataRows].join('\n');
    
    // UTF-8 BOM za Excel kompatibilnost
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export uspješan",
      description: `${filename}.csv je preuzet. Otvorite u Excelu za najbolji prikaz.`,
    });
  };

  const exportToGoogleSheets = () => {
    if (data.length === 0) {
      toast({
        title: "Nema podataka",
        description: "Nema podataka za export.",
        variant: "destructive",
      });
      return;
    }

    // Get the first item to determine headers
    const firstItem = getRelevantFields(data[0], type);
    const headers = Object.keys(firstItem);
    
    const csvContent = [
      headers.join(','),
      ...data.map(row => {
        const relevantData = getRelevantFields(row, type);
        return headers.map(header => {
          const value = relevantData[header] || '';
          return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
        }).join(',');
      })
    ].join('\n');

    // Create a new Google Sheets document with data
    const sheetsUrl = `https://docs.google.com/spreadsheets/create?usp=drive_web`;
    const newWindow = window.open(sheetsUrl, '_blank');
    
    // Copy data to clipboard for immediate pasting
    navigator.clipboard.writeText(csvContent).then(() => {
      toast({
        title: "Google Sheets otvoren",
        description: "Podaci su kopirani u clipboard. Google Sheets se otvara u novoj kartici - zalijepite podatke (Ctrl+V).",
      });
    }).catch(() => {
      toast({
        title: "Google Sheets otvoren",
        description: "Google Sheets se otvara u novoj kartici. Kopirajte podatke ručno.",
      });
    });
  };

  const exportToExcel = async () => {
    if (data.length === 0) {
      toast({
        title: "Nema podataka",
        description: "Nema podataka za export.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Morate biti prijavljeni za export');
      }

      const { data: responseData, error } = await supabase.functions.invoke('export-to-excel', {
        body: {
          data,
          filename,
          type,
          leads
        },
      });

      if (error) {
        throw error;
      }

      // Response data is already an ArrayBuffer, convert to Blob
      const blob = responseData instanceof Blob 
        ? responseData 
        : new Blob([responseData], { 
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
          });

      // Download file
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.xlsx`;
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export uspješan",
        description: `${filename}.xlsx je preuzet. Profesionalno formatiran Excel file!`,
      });

    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Greška pri exportu",
        description: error.message || "Pokušajte ponovno.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const autoExportToSheets = async () => {
    if (data.length === 0) {
      toast({
        title: "Nema podataka",
        description: "Nema podataka za export.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get the first item to determine headers
      const firstItem = getRelevantFields(data[0], type);
      const headers = Object.keys(firstItem);
      
      const csvContent = [
        headers.join(','),
        ...data.map(row => {
          const relevantData = getRelevantFields(row, type);
          return headers.map(header => {
            const value = relevantData[header] || '';
            return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
          }).join(',');
        })
      ].join('\n');

      // Create a Google Apps Script Web App URL that creates a sheet with the data
      const scriptUrl = 'https://script.google.com/macros/s/AKfycbwGf7kYjGxJ1fGKnwNnkv_xJ4w4j6q0qK5QBjqVgxhvqN9YpKQX4t7YWjhBRvLKQJ_s/exec';
      
      const response = await fetch(scriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `${filename}_${new Date().toISOString().split('T')[0]}`,
          data: csvContent
        })
      });

      // Fallback to manual method
      exportToGoogleSheets();
      
    } catch (error) {
      console.error('Auto export failed, falling back to manual method:', error);
      exportToGoogleSheets();
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="bg-green-50 border-green-200 hover:bg-green-100"
          disabled={isExporting}
        >
          <Download className="h-4 w-4 mr-2" />
          {isExporting ? 'Exportam...' : 'Export'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={exportToExcel} disabled={isExporting}>
          <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
          Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToCSV} disabled={isExporting}>
          <FileText className="h-4 w-4 mr-2 text-blue-600" />
          CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExportButton;
