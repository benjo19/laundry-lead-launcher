
import React from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ExportButtonProps {
  data: any[];
  filename: string;
  type: 'leads' | 'emails' | 'reminders' | 'posts';
}

const ExportButton = ({ data, filename, type }: ExportButtonProps) => {
  const { toast } = useToast();

  const exportToCSV = () => {
    if (data.length === 0) {
      toast({
        title: "Nema podataka",
        description: "Nema podataka za export.",
        variant: "destructive",
      });
      return;
    }

    const headers = Object.keys(data[0]).filter(key => key !== 'id' && key !== 'user_id');
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header] || '';
          return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
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
      description: `${filename}.csv je preuzet.`,
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

    const headers = Object.keys(data[0]).filter(key => key !== 'id' && key !== 'user_id');
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header] || '';
          return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
        }).join(',')
      )
    ].join('\n');

    const googleSheetsUrl = `https://docs.google.com/spreadsheets/create?usp=drive_web&authuser=0`;
    window.open(googleSheetsUrl, '_blank');
    
    // Copy to clipboard for easy pasting
    navigator.clipboard.writeText(csvContent).then(() => {
      toast({
        title: "Podaci kopirani",
        description: "Podaci su kopirani u clipboard. Zalijepite ih u Google Sheets.",
      });
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="bg-green-50 border-green-200 hover:bg-green-100">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={exportToCSV}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Preuzmi Excel/CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToGoogleSheets}>
          <FileText className="h-4 w-4 mr-2" />
          Otvori Google Sheets
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExportButton;
