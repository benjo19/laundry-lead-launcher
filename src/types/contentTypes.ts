
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
