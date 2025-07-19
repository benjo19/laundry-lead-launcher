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
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
  if (!geminiApiKey) {
    console.warn('Gemini API key not available, falling back to basic extraction');
    return await basicPDFExtraction(fileData);
  }

  try {
    console.log('Starting advanced PDF content extraction with multiple strategies');
    
    // Convert PDF to base64
    const arrayBuffer = await fileData.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    
    console.log('PDF converted to base64, size:', fileData.size);

    // Strategy 1: Direct PDF processing with Gemini 1.5 Pro (more powerful)
    let extractedContent = await tryGeminiPDFExtraction(base64, 'gemini-1.5-pro', geminiApiKey);
    
    if (!extractedContent || extractedContent.length < 100) {
      console.log('Strategy 1 failed or insufficient content, trying Strategy 2...');
      // Strategy 2: Try with Flash model but more detailed prompt
      extractedContent = await tryGeminiPDFExtraction(base64, 'gemini-1.5-flash', geminiApiKey, true);
    }
    
    if (!extractedContent || extractedContent.length < 100) {
      console.log('Strategy 2 failed, trying Strategy 3 (OCR approach)...');
      // Strategy 3: Treat as image OCR (for scanned PDFs)
      extractedContent = await tryGeminiOCRExtraction(base64, geminiApiKey);
    }
    
    if (!extractedContent || extractedContent.length < 50) {
      console.log('All AI strategies failed, falling back to basic extraction...');
      return await basicPDFExtraction(fileData);
    }

    console.log('PDF extraction completed successfully, extracted length:', extractedContent.length);
    return extractedContent;

  } catch (error) {
    console.error('Advanced PDF extraction error:', error);
    console.log('Falling back to basic extraction...');
    return await basicPDFExtraction(fileData);
  }
}

async function tryGeminiPDFExtraction(base64: string, model: string, apiKey: string, detailed: boolean = false): Promise<string | null> {
  try {
    console.log(`Trying PDF extraction with ${model}, detailed: ${detailed}`);
    
    const prompt = detailed 
      ? `Please perform a comprehensive analysis of this PDF document. Extract ALL text content including:
         - Main headings and sections
         - Product specifications and technical details
         - Numbers, measurements, and data
         - Tables and structured information
         - Contact information and company details
         - Any embedded text in images
         - Price lists or catalogs
         - Installation or usage instructions
         
         If the PDF contains images with text, please read and extract that text as well.
         If the PDF appears to be a technical specification, catalog, or manual, please extract all relevant technical information.
         Format the output in a clear, structured way that would be useful for answering questions about this document.`
      : `Extract all text content from this PDF document including technical specifications, product details, and any other relevant information. Be comprehensive and detailed.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: 'application/pdf',
                data: base64
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.1,
          topK: 32,
          topP: 1,
          maxOutputTokens: detailed ? 8000 : 4000,
        }
      }),
    });

    if (!response.ok) {
      console.error(`${model} API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error(`Invalid response from ${model}`);
      return null;
    }
    
    const content = data.candidates[0].content.parts[0].text;
    console.log(`${model} extraction completed, length:`, content.length);
    
    return content;

  } catch (error) {
    console.error(`Error with ${model}:`, error);
    return null;
  }
}

async function tryGeminiOCRExtraction(base64: string, apiKey: string): Promise<string | null> {
  try {
    console.log('Trying OCR approach for PDF (treating as image)');
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            { 
              text: `This is a PDF document that may contain scanned text or images with text. Please perform OCR (Optical Character Recognition) and extract ALL visible text including:
                     - All readable text from any pages
                     - Product names, model numbers, specifications
                     - Technical data, measurements, dimensions
                     - Price information, part numbers
                     - Company information, contact details
                     - Tables, lists, and structured data
                     - Any text in headers, footers, or margins
                     
                     Please be very thorough and extract every piece of readable text you can find. Format it clearly and organized.` 
            },
            {
              inline_data: {
                mime_type: 'image/jpeg', // Try as image for OCR
                data: base64
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.0,
          topK: 32,
          topP: 1,
          maxOutputTokens: 8000,
        }
      }),
    });

    if (!response.ok) {
      console.error(`OCR approach API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('Invalid OCR response');
      return null;
    }
    
    const content = data.candidates[0].content.parts[0].text;
    console.log('OCR extraction completed, length:', content.length);
    
    return content;

  } catch (error) {
    console.error('OCR extraction error:', error);
    return null;
  }
}

async function basicPDFExtraction(fileData: Blob): Promise<string> {
  try {
    console.log('Using basic PDF content extraction');
    
    // Simple text extraction for demonstration
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
    
    console.log('Basic PDF extraction completed, extracted length:', extractedText.length);
    return extractedText;
    
  } catch (error) {
    console.error('Basic PDF extraction error:', error);
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