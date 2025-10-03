
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Clock, Play, Pause, Trash2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { ContentPost } from '@/types/contentTypes';

interface ScheduledPost extends ContentPost {
  scheduledDate: string;
  scheduledTime: string;
  recurring?: 'daily' | 'weekly' | 'monthly';
  isPaused?: boolean;
}

const ContentScheduler = () => {
  const { toast } = useToast();
  const [scheduledPosts, setScheduledPosts] = useLocalStorage<ScheduledPost[]>('scheduledPosts', []);
  const [publishedPosts, setPublishedPosts] = useLocalStorage<ContentPost[]>('publishedPosts', []);
  
  const [newPost, setNewPost] = useState({
    content: '',
    platform: 'facebook' as const,
    scheduledDate: '',
    scheduledTime: '',
    recurring: undefined as 'daily' | 'weekly' | 'monthly' | undefined
  });

  // Auto-publish scheduled posts
  useEffect(() => {
    const checkScheduledPosts = () => {
      const now = new Date();
      const currentDateTime = now.toISOString();

      scheduledPosts.forEach(post => {
        if (post.isPaused) return;

        const postDateTime = new Date(`${post.scheduledDate}T${post.scheduledTime}`).toISOString();
        
        if (postDateTime <= currentDateTime && post.status === 'Scheduled') {
          publishScheduledPost(post);
        }
      });
    };

    const interval = setInterval(checkScheduledPosts, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [scheduledPosts]);

  const publishScheduledPost = (post: ScheduledPost) => {
    // Create published post
    const publishedPost: ContentPost = {
      ...post,
      status: 'Published' as const,
      publishedAt: new Date().toISOString()
    };

    setPublishedPosts(prev => [...prev, publishedPost]);

    // Handle recurring posts
    if (post.recurring) {
      const nextDate = getNextRecurringDate(post.scheduledDate, post.recurring);
      const updatedPost: ScheduledPost = {
        ...post,
        id: Date.now(),
        scheduledDate: nextDate,
        createdAt: new Date().toISOString()
      };
      
      setScheduledPosts(prev => 
        prev.map(p => p.id === post.id ? updatedPost : p)
      );
    } else {
      // Remove one-time posts
      setScheduledPosts(prev => prev.filter(p => p.id !== post.id));
    }

    toast({
      title: "Post objavljen",
      description: `Post je automatski objavljen na ${post.platform}.`,
    });
  };

  const getNextRecurringDate = (currentDate: string, recurring: 'daily' | 'weekly' | 'monthly'): string => {
    const date = new Date(currentDate);
    
    switch (recurring) {
      case 'daily':
        date.setDate(date.getDate() + 1);
        break;
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
    }
    
    return date.toISOString().split('T')[0];
  };

  const schedulePost = () => {
    if (!newPost.content || !newPost.scheduledDate || !newPost.scheduledTime) {
      toast({
        title: "Greška",
        description: "Molimo unesite sadržaj, datum i vrijeme objave.",
        variant: "destructive"
      });
      return;
    }

    const scheduledPost: ScheduledPost = {
      id: Date.now(),
      content: newPost.content,
      platform: newPost.platform,
      status: 'Scheduled' as const,
      date: new Date().toISOString().split('T')[0],
      scheduledDate: newPost.scheduledDate,
      scheduledTime: newPost.scheduledTime,
      recurring: newPost.recurring,
      createdAt: new Date().toISOString(),
      isPaused: false
    };

    setScheduledPosts(prev => [...prev, scheduledPost]);
    
    setNewPost({
      content: '',
      platform: 'facebook',
      scheduledDate: '',
      scheduledTime: '',
      recurring: undefined
    });

    toast({
      title: "Post zakazan",
      description: `Post je zakazan za ${newPost.scheduledDate} u ${newPost.scheduledTime}.`,
    });
  };

  const togglePausePost = (postId: number) => {
    setScheduledPosts(prev =>
      prev.map(post =>
        post.id === postId ? { ...post, isPaused: !post.isPaused } : post
      )
    );
  };

  const deleteScheduledPost = (postId: number) => {
    setScheduledPosts(prev => prev.filter(post => post.id !== postId));
    toast({
      title: "Post obrisan",
      description: "Zakazani post je obrisan.",
    });
  };

  const upcomingPosts = scheduledPosts.filter(post => {
    const postDateTime = new Date(`${post.scheduledDate}T${post.scheduledTime}`);
    return postDateTime > new Date();
  });

  const recentlyPublished = publishedPosts
    .sort((a, b) => new Date(b.publishedAt || '').getTime() - new Date(a.publishedAt || '').getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Schedule New Post */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            Zakaži novi post
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="content">Sadržaj posta</Label>
            <Textarea
              id="content"
              placeholder="Unesite sadržaj vašeg posta..."
              value={newPost.content}
              onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="platform">Platforma</Label>
              <Select value={newPost.platform} onValueChange={(value: any) => setNewPost(prev => ({ ...prev, platform: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="twitter">Twitter</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="scheduledDate">Datum objave</Label>
              <Input
                id="scheduledDate"
                type="date"
                value={newPost.scheduledDate}
                onChange={(e) => setNewPost(prev => ({ ...prev, scheduledDate: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <Label htmlFor="scheduledTime">Vrijeme objave</Label>
              <Input
                id="scheduledTime"
                type="time"
                value={newPost.scheduledTime}
                onChange={(e) => setNewPost(prev => ({ ...prev, scheduledTime: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="recurring">Ponavljanje (opcionalno)</Label>
            <Select value={newPost.recurring || ''} onValueChange={(value: any) => setNewPost(prev => ({ ...prev, recurring: value || undefined }))}>
              <SelectTrigger>
                <SelectValue placeholder="Odaberite ponavljanje" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Bez ponavljanja</SelectItem>
                <SelectItem value="daily">Dnevno</SelectItem>
                <SelectItem value="weekly">Tjedno</SelectItem>
                <SelectItem value="monthly">Mjesečno</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={schedulePost} className="w-full">
            <Calendar className="h-4 w-4 mr-2" />
            Zakaži post
          </Button>
        </CardContent>
      </Card>

      {/* Upcoming Posts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Nadolazeći postovi ({upcomingPosts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingPosts.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Nema zakazanih postova</p>
          ) : (
            <div className="space-y-3">
              {upcomingPosts.map((post) => (
                <div key={post.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{post.content.substring(0, 100)}...</p>
                    <p className="text-sm text-gray-500">
                      {post.platform} • {post.scheduledDate} u {post.scheduledTime}
                      {post.recurring && ` • Ponavlja se ${post.recurring}`}
                      {post.isPaused && ' • PAUZIRAN'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => togglePausePost(post.id)}
                    >
                      {post.isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteScheduledPost(post.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recently Published */}
      {recentlyPublished.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Nedavno objavljeno</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentlyPublished.map((post) => (
                <div key={post.id} className="p-3 border rounded-lg">
                  <p className="font-medium">{post.content.substring(0, 100)}...</p>
                  <p className="text-sm text-gray-500">
                    {post.platform} • Objavljeno: {new Date(post.publishedAt || '').toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ContentScheduler;
