import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get user from auth header
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error('Not authenticated');
    }

    console.log('Processing PDF upload for user:', user.id);

    // Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;

    if (!file) {
      throw new Error('No file provided');
    }

    console.log('File received:', file.name, 'Size:', file.size, 'Type:', file.type);

    // Validate PDF
    if (!file.type.includes('pdf')) {
      throw new Error('File must be a PDF');
    }

    // Generate unique file path
    const timestamp = Date.now();
    const fileName = `${user.id}/${timestamp}_${file.name}`;

    // Upload PDF to storage
    console.log('Uploading PDF to storage:', fileName);
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('user-documents')
      .upload(fileName, file, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    console.log('PDF uploaded successfully:', uploadData.path);

    // Get file bytes for analysis
    const fileBytes = await file.arrayBuffer();
    const uint8Array = new Uint8Array(fileBytes);

    // Basic PDF text extraction
    // Convert PDF bytes to text (simplified extraction)
    const textDecoder = new TextDecoder('utf-8');
    let extractedText = '';
    
    try {
      // Try to extract text content from PDF
      const pdfText = textDecoder.decode(uint8Array);
      
      // Simple regex to extract text between obj and endobj markers
      const textMatches = pdfText.match(/\(([^)]+)\)/g);
      if (textMatches) {
        extractedText = textMatches
          .map(match => match.slice(1, -1))
          .join(' ')
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '\r')
          .replace(/\\\(/g, '(')
          .replace(/\\\)/g, ')')
          .trim();
      }
    } catch (error) {
      console.error('Text extraction error:', error);
      extractedText = 'PDF sadržaj - tekst nije mogao biti ekstraktovan automatski.';
    }

    console.log('Extracted text length:', extractedText.length);

    // Use Lovable AI to analyze and summarize the PDF content
    let analyzedContent = extractedText;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (LOVABLE_API_KEY && extractedText.length > 100) {
      console.log('Analyzing PDF content with AI...');
      try {
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: 'Ti si ekspert za analizu dokumenata. Analiziraj dati PDF sadržaj i pruži strukturiran sažetak sa ključnim informacijama.'
              },
              {
                role: 'user',
                content: `Analiziraj sljedeći PDF sadržaj i ekstraktuj ključne informacije:\n\n${extractedText.substring(0, 10000)}`
              }
            ],
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const aiSummary = aiData.choices[0]?.message?.content;
          if (aiSummary) {
            analyzedContent = `=== AI ANALIZA ===\n${aiSummary}\n\n=== ORIGINALNI SADRŽAJ ===\n${extractedText}`;
            console.log('AI analysis completed');
          }
        }
      } catch (error) {
        console.error('AI analysis error:', error);
        // Continue with original text if AI fails
      }
    }

    // Save to user_knowledge table
    console.log('Saving to user_knowledge table...');
    const { data: knowledgeData, error: knowledgeError } = await supabaseClient
      .from('user_knowledge')
      .insert({
        user_id: user.id,
        title: title || file.name,
        content: analyzedContent,
        type: 'document',
        file_path: uploadData.path,
        metadata: {
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          uploaded_at: new Date().toISOString(),
          pages_analyzed: 'auto',
        },
      })
      .select()
      .single();

    if (knowledgeError) {
      console.error('Knowledge insert error:', knowledgeError);
      throw knowledgeError;
    }

    console.log('PDF analysis completed successfully:', knowledgeData.id);

    return new Response(
      JSON.stringify({
        success: true,
        data: knowledgeData,
        message: 'PDF uspješno analiziran i spremljen',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in analyze-pdf function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
