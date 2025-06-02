
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SocialPostRequest {
  content: string;
  platform: 'facebook' | 'linkedin' | 'instagram';
  user_id: string;
  image_url?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { content, platform, user_id, image_url }: SocialPostRequest = await req.json();

    console.log(`Posting to ${platform} for user:`, user_id);

    // Dobijanje korisničkih postavki za društvene mreže
    const { data: userSettings, error: settingsError } = await supabase
      .from('user_settings')
      .select('social_platforms')
      .eq('user_id', user_id)
      .single();

    if (settingsError || !userSettings?.social_platforms) {
      throw new Error('Social platform settings not configured');
    }

    const socialSettings = userSettings.social_platforms as any;
    const platformConfig = socialSettings[platform];

    if (!platformConfig?.enabled) {
      throw new Error(`${platform} not configured or disabled`);
    }

    let postResult;

    switch (platform) {
      case 'facebook':
        postResult = await postToFacebook(platformConfig, content, image_url);
        break;
      case 'linkedin':
        postResult = await postToLinkedIn(platformConfig, content, image_url);
        break;
      case 'instagram':
        postResult = await postToInstagram(platformConfig, content, image_url);
        break;
      default:
        throw new Error('Unsupported platform');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Posted to ${platform} successfully`,
        post_id: postResult.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error(`Error posting to social media:`, error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to post to social media' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

async function postToFacebook(config: any, content: string, imageUrl?: string) {
  // Validate required Facebook config
  if (!config.access_token || !config.page_id) {
    throw new Error('Facebook configuration incomplete: missing access_token or page_id');
  }

  const url = `https://graph.facebook.com/v18.0/${config.page_id}/feed`;
  
  const postData: any = {
    message: content,
    access_token: config.access_token
  };

  // If there's an image, we need to post it as a photo instead
  if (imageUrl) {
    const photoUrl = `https://graph.facebook.com/v18.0/${config.page_id}/photos`;
    const photoData = {
      message: content,
      url: imageUrl,
      access_token: config.access_token
    };

    const response = await fetch(photoUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(photoData)
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Facebook photo API error:', errorData);
      throw new Error(`Facebook photo API error: ${response.statusText} - ${errorData}`);
    }

    return await response.json();
  } else {
    // Regular text post
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postData)
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Facebook API error:', errorData);
      throw new Error(`Facebook API error: ${response.statusText} - ${errorData}`);
    }

    return await response.json();
  }
}

async function postToLinkedIn(config: any, content: string, imageUrl?: string) {
  const url = 'https://api.linkedin.com/v2/ugcPosts';
  
  const postData = {
    author: `urn:li:organization:${config.company_id}`,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: {
          text: content
        },
        shareMediaCategory: imageUrl ? 'IMAGE' : 'NONE',
        ...(imageUrl && {
          media: [{
            status: 'READY',
            originalUrl: imageUrl
          }]
        })
      }
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(postData)
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('LinkedIn API error:', errorData);
    throw new Error(`LinkedIn API error: ${response.statusText} - ${errorData}`);
  }

  return await response.json();
}

async function postToInstagram(config: any, content: string, imageUrl?: string) {
  // Instagram Business API zahteva da prvo uploadujete sliku, zatim kreirate post
  if (!imageUrl) {
    throw new Error('Instagram posts require an image');
  }

  // Prvi korak: Upload slike
  const mediaUrl = `https://graph.facebook.com/v18.0/${config.account_id}/media`;
  
  const mediaResponse = await fetch(mediaUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image_url: imageUrl,
      caption: content,
      access_token: config.access_token
    })
  });

  if (!mediaResponse.ok) {
    const errorData = await mediaResponse.text();
    console.error('Instagram media upload error:', errorData);
    throw new Error(`Instagram media upload error: ${mediaResponse.statusText} - ${errorData}`);
  }

  const mediaResult = await mediaResponse.json();

  // Drugi korak: Objavljivanje posta
  const publishUrl = `https://graph.facebook.com/v18.0/${config.account_id}/media_publish`;
  
  const publishResponse = await fetch(publishUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      creation_id: mediaResult.id,
      access_token: config.access_token
    })
  });

  if (!publishResponse.ok) {
    const errorData = await publishResponse.text();
    console.error('Instagram publish error:', errorData);
    throw new Error(`Instagram publish error: ${publishResponse.statusText} - ${errorData}`);
  }

  return await publishResponse.json();
}
