-- Create storage bucket for user documents
INSERT INTO storage.buckets (id, name, public) VALUES ('user-documents', 'user-documents', false);

-- Create table for user knowledge base
CREATE TABLE public.user_knowledge (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  type TEXT NOT NULL CHECK (type IN ('pdf', 'image', 'website')),
  file_path TEXT,
  url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_knowledge ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own knowledge" 
ON public.user_knowledge 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own knowledge" 
ON public.user_knowledge 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own knowledge" 
ON public.user_knowledge 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own knowledge" 
ON public.user_knowledge 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create storage policies for user documents
CREATE POLICY "Users can view their own documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'user-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'user-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own documents" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'user-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own documents" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'user-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_knowledge_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_knowledge_updated_at
BEFORE UPDATE ON public.user_knowledge
FOR EACH ROW
EXECUTE FUNCTION public.update_knowledge_updated_at();