
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Trash2, Clock, Share2 } from 'lucide-react';
import { ContentPost } from '@/types';
import { platforms } from './constants';
import { openSocialMedia, SocialPlatform } from '@/utils/socialMediaUtils';

interface PostsListProps {
  posts: ContentPost[];
  onDeletePost: (postId: number) => void;
}

const PostsList: React.FC<PostsListProps> = ({ posts, onDeletePost }) => {
  const getPlatformIcon = (platformName: string) => {
    const platformData = platforms.find(p => p.label === platformName);
    if (!platformData) return FileText;
    return platformData.icon;
  };

  const getPlatformColor = (platformName: string) => {
    const platformData = platforms.find(p => p.label === platformName);
    return platformData?.color || 'text-gray-600';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Objave i Raspored</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {posts.map((post) => {
            const Icon = getPlatformIcon(post.platform);
            const colorClass = getPlatformColor(post.platform);
            return (
              <div key={post.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <Icon className={`h-4 w-4 mr-2 ${colorClass}`} />
                    <span className="font-medium text-slate-900">{post.platform}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={post.status === 'Published' ? 'default' : 'secondary'}>
                      {post.status}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openSocialMedia(post.platform as SocialPlatform, post.content, post.imageUrl)}
                      className="text-blue-600 hover:text-blue-700"
                      title="Objavi na društvenoj mreži"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDeletePost(post.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <p className="text-sm text-slate-700 mb-3 line-clamp-3">{post.content}</p>
                
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span>{post.date}</span>
                  <div className="flex items-center">
                    {post.status === 'Scheduled' && post.scheduledTime && (
                      <div className="flex items-center mr-2">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>{post.scheduledTime}</span>
                      </div>
                    )}
                    <span>{post.engagement || (post.status === 'Scheduled' ? 'Zakazano' : 'Objavljeno')}</span>
                  </div>
                </div>
              </div>
            );
          })}
          {posts.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              Nema kreiranog sadržaja.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PostsList;
