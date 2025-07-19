import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.9';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { filePath, type, title } = await req.json();
    
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Get user from token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    console.log(`Processing ${type} document:`, { filePath, title, userId: user.id });

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabaseClient.storage
      .from('user-documents')
      .download(filePath);

    if (downloadError) {
      throw new Error(`Failed to download file: ${downloadError.message}`);
    }

    let extractedContent = '';

    if (type === 'pdf') {
      // For PDF processing, we'll use a simple text extraction approach
      // In a real implementation, you might want to use a PDF parsing library
      extractedContent = await extractPDFContent(fileData);
    } else if (type === 'image') {
      // For images, we'll use OpenAI Vision API
      extractedContent = await analyzeImage(fileData);
    }

    // Save to knowledge base
    const { error: insertError } = await supabaseClient
      .from('user_knowledge')
      .insert({
        user_id: user.id,
        title,
        content: extractedContent,
        type,
        file_path: filePath,
        metadata: {
          file_size: fileData.size,
          processed_at: new Date().toISOString()
        }
      });

    if (insertError) {
      throw new Error(`Failed to save to knowledge base: ${insertError.message}`);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      content: extractedContent.substring(0, 200) + '...' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in process-document function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function extractPDFContent(fileData: Blob): Promise<string> {
  try {
    console.log('Starting PDF content extraction');
    
    // Simple text extraction for demonstration
    // In production, you'd use a proper PDF library
    const arrayBuffer = await fileData.arrayBuffer();
    
    // Try to safely decode the content
    let text = '';
    try {
      text = new TextDecoder('utf-8', { fatal: false }).decode(arrayBuffer);
    } catch (decodeError) {
      console.warn('UTF-8 decode failed, trying latin1:', decodeError);
      text = new TextDecoder('latin1').decode(arrayBuffer);
    }
    
    // Clean the text to remove potentially problematic characters
    text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ');
    
    // Extract text between 'stream' and 'endstream' markers (basic PDF text extraction)
    const streamRegex = /stream\s*(.*?)\s*endstream/gs;
    const matches = text.match(streamRegex);
    
    let extractedText = '';
    if (matches && matches.length > 0) {
      extractedText = matches.join(' ').replace(/stream|endstream/g, '').trim();
      // Clean extracted text further
      extractedText = extractedText.replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, ' ').trim();
    }
    
    if (!extractedText || extractedText.length < 10) {
      extractedText = `PDF document uploaded: ${fileData.size} bytes. Basic text extraction was attempted but may be limited due to PDF structure. Document is stored for reference.`;
    }
    
    console.log('PDF extraction completed, extracted length:', extractedText.length);
    return extractedText;
    
  } catch (error) {
    console.error('PDF extraction error:', error);
    return `PDF document uploaded (${fileData.size} bytes). Text extraction failed but document is stored for reference.`;
  }
}

async function analyzeImage(fileData: Blob): Promise<string> {
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
  if (!geminiApiKey) {
    throw new Error('Gemini API key not configured');
  }

  try {
    // Convert image to base64
    const arrayBuffer = await fileData.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const mimeType = fileData.type || 'image/jpeg';

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text: 'Analyze this image and extract all text content, describe what you see, and provide any relevant information that would be useful for a knowledge base. Be detailed and comprehensive.'
            },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.4,
          topK: 32,
          topP: 1,
          maxOutputTokens: 1000,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;

  } catch (error) {
    console.error('Image analysis error:', error);
    return 'Failed to analyze image content';
  }
}