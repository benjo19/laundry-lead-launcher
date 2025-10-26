import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.9';
import * as XLSX from 'https://esm.sh/xlsx@0.18.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExportRequest {
  data: any[];
  filename: string;
  type: 'leads' | 'emails' | 'reminders' | 'posts';
  leads?: any[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Export to Excel request received');

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Authentication error:', userError);
      throw new Error('Unauthorized');
    }

    console.log('User authenticated:', user.id);

    // Parse request body
    const { data, filename, type, leads }: ExportRequest = await req.json();

    if (!data || data.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Nema podataka za export' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${type} export with ${data.length} items`);

    // Transform data based on type
    const transformedData = data.map(item => {
      switch (type) {
        case 'reminders': {
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
            'Email': associatedLead?.email || '',
            'Telefon': associatedLead?.phone || '',
            'Industrija': associatedLead?.industry || '',
            'Lokacija': associatedLead?.location || '',
            'Broj zaposlenika': associatedLead?.employees || '',
            'Website': associatedLead?.website || ''
          };
        }
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
            'Datum dodavanja': item.dateAdded || item.created_at || '',
            'Bilješke': item.notes || ''
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
          return item;
      }
    });

    console.log('Data transformed, creating workbook');

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(transformedData);

    // Set column widths
    const headers = Object.keys(transformedData[0]);
    ws['!cols'] = headers.map(header => {
      // Calculate optimal width based on header and content
      const maxLength = Math.max(
        header.length,
        ...transformedData.map(row => String(row[header] || '').length)
      );
      return { wch: Math.min(maxLength + 2, 50) }; // Max width 50
    });

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Export');

    console.log('Generating Excel file');

    // Generate Excel file as array buffer
    const excelBuffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

    console.log('Excel file generated successfully');

    // Return the file
    return new Response(excelBuffer, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
      },
    });

  } catch (error) {
    console.error('Error in export-to-excel function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: error.toString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
