
import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ContentForm from './content-booster/ContentForm';
import PostsList from './content-booster/PostsList';
import { useContentBooster } from './content-booster/useContentBooster';

const ContentBooster = () => {
  const {
    content,
    setContent,
    contentType,
    setContentType,
    industry,
    setIndustry,
    companyName,
    setCompanyName,
    topic,
    setTopic,
    additionalContext,
    setAdditionalContext,
    scheduledTime,
    setScheduledTime,
    scheduledDate,
    setScheduledDate,
    isGenerating,
    apiKey,
    setApiKey,
    aiProvider,
    setAiProvider,
    contentFormat,
    setContentFormat,
    generatedImageUrl,
    platform,
    setPlatform,
    posts,
    generateContent,
    publishNow,
    schedulePost,
    deletePost,
    isAIConfigured,
    businessProfile,
    canGenerateImages,
    profiles,
    selectedProfileId,
    setSelectedProfileId,
  } = useContentBooster();

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Content Booster</h2>
          <p className="text-slate-600">Generirajte i planirajte sadržaj za društvene mreže pomoću AI-a</p>
          <p className="text-sm text-slate-500 mt-1">
            💡 Postavite vaš AI i poslovni profil u Postavkama za najbolje rezultate
          </p>
        </div>
        <div className="flex space-x-2">
          <span className="text-sm text-slate-600">
            Objavljeno: {posts.filter(p => p.status === 'Published').length} | 
            Zakazano: {posts.filter(p => p.status === 'Scheduled').length}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ContentForm
        content={content}
        setContent={setContent}
        contentType={contentType}
          setContentType={setContentType}
          industry={industry}
          setIndustry={setIndustry}
          companyName={companyName}
          setCompanyName={setCompanyName}
          topic={topic}
          setTopic={setTopic}
          additionalContext={additionalContext}
          setAdditionalContext={setAdditionalContext}
          scheduledTime={scheduledTime}
          setScheduledTime={setScheduledTime}
          scheduledDate={scheduledDate}
          setScheduledDate={setScheduledDate}
          isGenerating={isGenerating}
          apiKey={apiKey}
          setApiKey={setApiKey}
          aiProvider={aiProvider}
          setAiProvider={setAiProvider}
          contentFormat={contentFormat}
          setContentFormat={setContentFormat}
          generatedImageUrl={generatedImageUrl}
          canGenerateImages={canGenerateImages}
          onGenerateContent={generateContent}
          onPublishNow={publishNow}
          onSchedulePost={schedulePost}
          isAIConfigured={() => Boolean(isAIConfigured())}
          businessProfile={businessProfile}
          platform={platform}
          setPlatform={setPlatform}
          profiles={profiles}
          selectedProfileId={selectedProfileId}
          setSelectedProfileId={setSelectedProfileId}
        />

        <PostsList
          posts={posts}
          onDeletePost={deletePost}
        />
      </div>
    </div>
  );
};

export default ContentBooster;
