
export interface ContentGenerationParams {
  platform: string;
  contentType: string;
  industry: string;
  companyName?: string;
  topic?: string;
  additionalContext?: string;
}

export interface GeneratedContent {
  content: string;
}

export interface ContentPost {
  id: number;
  platform: 'LinkedIn' | 'Facebook' | 'Instagram' | 'TikTok' | 'Twitter/X' | 'facebook' | 'instagram' | 'linkedin' | 'twitter';
  content: string;
  contentType?: 'tip' | 'case-study' | 'news' | 'promotional' | 'educational' | 'behind-scenes';
  status: 'Draft' | 'Scheduled' | 'Published';
  date: string;
  createdAt?: string;
  publishedAt?: string;
  scheduledTime?: string;
  scheduledDate?: string;
  engagement?: string;
  imageUrl?: string;
}
