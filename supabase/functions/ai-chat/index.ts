import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

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
    const { message, language = 'sr' } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const systemPrompt = language === 'en' 
      ? `You are a helpful assistant for a marketing automation application. 
         The app helps users manage leads, send emails, set reminders, create content, and view analytics.
         
         Main features:
         - Lead Hunter: Find and manage potential clients
         - Lead Discovery: Discover new leads via Google Maps
         - Email Generator: Create and send personalized emails
         - CRM Reminder: Set and manage reminders for follow-ups
         - Content Booster: Create social media content
         - Analytics: View campaign performance
         - Settings: Configure integrations (Make.com, email providers, AI settings)
         
         Answer questions about how to use these features. Be concise and helpful.
         If the user asks about something unrelated to the app, politely redirect them to app-related topics.`
      : `Ti si pomoćnik za aplikaciju za marketing automatizaciju. 
         Aplikacija pomaže korisnicima da upravljaju leadovima, šalju emailove, postavljaju podsetnike, kreiraju sadržaj i prate analitiku.
         
         Glavne funkcionalnosti:
         - Lead Hunter: Pronalaženje i upravljanje potencijalnim klijentima
         - Lead Discovery: Otkrivanje novih leadova preko Google Maps
         - Email Generator: Kreiranje i slanje personalizovanih emailova
         - CRM Reminder: Postavljanje i upravljanje podsetnicima
         - Content Booster: Kreiranje sadržaja za društvene mreže
         - Analytics: Pregled performansi kampanja
         - Settings: Konfiguracija integracija (Make.com, email provajderi, AI podešavanja)
         
         Odgovori na pitanja o tome kako da koriste ove funkcionalnosti. Budi koncizan i koristan.
         Ako korisnik pita o nečemu što nije povezano sa aplikacijom, ljubazno ih preusmeri na teme vezane za aplikaciju.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: systemPrompt }
            ]
          },
          {
            parts: [
              { text: message }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 1,
          topP: 1,
          maxOutputTokens: 500,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API error:', errorData);
      return new Response(
        JSON.stringify({ error: 'Failed to get AI response' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const data = await response.json();
    console.log('Gemini response:', JSON.stringify(data, null, 2));

    if (!data.candidates || data.candidates.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No response from AI' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const aiResponse = data.candidates[0].content.parts[0].text;

    return new Response(
      JSON.stringify({ response: aiResponse }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in ai-chat function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});