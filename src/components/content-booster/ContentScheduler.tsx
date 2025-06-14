
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Play, Pause, Trash2, Edit3, CheckCircle } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useToast } from '@/hooks/use-toast';
import { ContentPost } from '@/types';

interface ScheduledPost extends ContentPost {
  scheduledDateTime: string;
  isActive: boolean;
  nextRun?: string;
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    daysOfWeek?: number[];
    dayOfMonth?: number;
  };
}

const ContentScheduler = () => {
  const [scheduledPosts, setScheduledPosts] = useLocalStorage<ScheduledPost[]>('scheduledPosts', []);
  const [posts] = useLocalStorage<ContentPost[]>('contentPosts', []);
  const [selectedPost, setSelectedPost] = useState<string>('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const { toast } = useToast();

  // Simulate scheduler checking for posts to publish
  useEffect(() => {
    const interval = setInterval(() => {
      checkAndPublishScheduledPosts();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [scheduledPosts]);

  const checkAndPublishScheduledPosts = () => {
    const now = new Date();
    const postsToPublish = scheduledPosts.filter(post => {
      if (!post.isActive) return false;
      
      const scheduledDateTime = new Date(post.scheduledDateTime);
      return scheduledDateTime <= now && post.status === 'Scheduled';
    });

    if (postsToPublish.length > 0) {
      postsToPublish.forEach(post => {
        publishScheduledPost(post.id);
      });
    }
  };

  const publishScheduledPost = (postId: number) => {
    setScheduledPosts(prev => prev.map(post => {
      if (post.id === postId) {
        const updatedPost = { ...post, status: 'Published' as const };
        
        // If recurring, schedule next occurrence
        if (post.recurring) {
          const nextDateTime = calculateNextOccurrence(post);
          if (nextDateTime) {
            updatedPost.scheduledDateTime = nextDateTime;
            updatedPost.status = 'Scheduled';
            updatedPost.nextRun = nextDateTime;
          }
        } else {
          updatedPost.isActive = false;
        }
        
        return updatedPost;
      }
      return post;
    }));

    toast({
      title: "Post objavljen",
      description: "Zakazani post je uspješno objavljen!",
    });
  };

  const calculateNextOccurrence = (post: ScheduledPost): string | null => {
    if (!post.recurring) return null;

    const currentDate = new Date(post.scheduledDateTime);
    const nextDate = new Date(currentDate);

    switch (post.recurring.frequency) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        if (post.recurring.dayOfMonth) {
          nextDate.setDate(post.recurring.dayOfMonth);
        }
        break;
    }

    return nextDate.toISOString();
  };

  const schedulePost = () => {
    if (!selectedPost || !scheduledDate || !scheduledTime) {
      toast({
        title: "Nedostaju podaci",
        description: "Molimo odaberite post, datum i vrijeme.",
        variant: "destructive"
      });
      return;
    }

    const post = posts.find(p => p.id.toString() === selectedPost);
    if (!post) return;

    const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
    
    if (scheduledDateTime <= new Date()) {
      toast({
        title: "Neispravno vrijeme",
        description: "Zakazano vrijeme mora biti u budućnosti.",
        variant: "destructive"
      });
      return;
    }

    const scheduledPost: ScheduledPost = {
      ...post,
      id: Date.now(),
      scheduledDateTime: scheduledDateTime.toISOString(),
      isActive: true,
      recurring: isRecurring ? {
        frequency,
        daysOfWeek: frequency === 'weekly' ? selectedDays : undefined,
        dayOfMonth: frequency === 'monthly' ? dayOfMonth : undefined
      } : undefined
    };

    setScheduledPosts([...scheduledPosts, scheduledPost]);
    
    // Reset form
    setSelectedPost('');
    setScheduledDate('');
    setScheduledTime('');
    setIsRecurring(false);
    setSelectedDays([]);

    toast({
      title: "Post zakazan",
      description: `Post je zakazan za ${scheduledDateTime.toLocaleString('hr-HR')}.`,
    });
  };

  const togglePostActive = (postId: number) => {
    setScheduledPosts(prev => prev.map(post => 
      post.id === postId ? { ...post, isActive: !post.isActive } : post
    ));
  };

  const deleteScheduledPost = (postId: number) => {
    setScheduledPosts(prev => prev.filter(post => post.id !== postId));
    toast({
      title: "Raspored obrisan",
      description: "Zakazani post je uspješno obrisan.",
    });
  };

  const getUpcomingPosts = () => {
    const now = new Date();
    return scheduledPosts
      .filter(post => post.isActive && new Date(post.scheduledDateTime) > now)
      .sort((a, b) => new Date(a.scheduledDateTime).getTime() - new Date(b.scheduledDateTime).getTime())
      .slice(0, 5);
  };

  const getRecentlyPublished = () => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return scheduledPosts
      .filter(post => post.status === 'Published' && new Date(post.scheduledDateTime) > oneDayAgo)
      .sort((a, b) => new Date(b.scheduledDateTime).getTime() - new Date(a.scheduledDateTime).getTime())
      .slice(0, 3);
  };

  const weekDays = [
    { value: 1, label: 'Pon' },
    { value: 2, label: 'Uto' },
    { value: 3, label: 'Sri' },
    { value: 4, label: 'Čet' },
    { value: 5, label: 'Pet' },
    { value: 6, label: 'Sub' },
    { value: 0, label: 'Ned' }
  ];

  return (
    <div className="space-y-6">
      {/* Scheduling Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-blue-600" />
            Zakaži Objavu
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Odaberite post</label>
              <Select value={selectedPost} onValueChange={setSelectedPost}>
                <SelectTrigger>
                  <SelectValue placeholder="Odaberite post za zakazivanje" />
                </SelectTrigger>
                <SelectContent>
                  {posts.map(post => (
                    <SelectItem key={post.id} value={post.id.toString()}>
                      <div className="flex items-center">
                        <Badge variant="outline" className="mr-2">
                          {post.platform}
                        </Badge>
                        {post.content.substring(0, 40)}...
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium mb-2">Datum</label>
                <Input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Vrijeme</label>
                <Input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="recurring"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="recurring" className="text-sm font-medium">
              Ponavljajuća objava
            </label>
          </div>

          {isRecurring && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium mb-2">Frekvencija</label>
                <Select value={frequency} onValueChange={(value: 'daily' | 'weekly' | 'monthly') => setFrequency(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Dnevno</SelectItem>
                    <SelectItem value="weekly">Tjedno</SelectItem>
                    <SelectItem value="monthly">Mjesečno</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {frequency === 'weekly' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Dani u tjednu</label>
                  <div className="flex gap-2">
                    {weekDays.map(day => (
                      <Button
                        key={day.value}
                        variant={selectedDays.includes(day.value) ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          if (selectedDays.includes(day.value)) {
                            setSelectedDays(selectedDays.filter(d => d !== day.value));
                          } else {
                            setSelectedDays([...selectedDays, day.value]);
                          }
                        }}
                      >
                        {day.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {frequency === 'monthly' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Dan u mjesecu</label>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={dayOfMonth}
                    onChange={(e) => setDayOfMonth(parseInt(e.target.value))}
                  />
                </div>
              )}
            </div>
          )}

          <Button onClick={schedulePost} className="w-full">
            <Calendar className="h-4 w-4 mr-2" />
            Zakaži Objavu
          </Button>
        </CardContent>
      </Card>

      {/* Upcoming Posts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-orange-600" />
              Nadolazeće Objave ({getUpcomingPosts().length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {getUpcomingPosts().map(post => (
                <div key={post.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{post.platform}</Badge>
                      {post.recurring && (
                        <Badge variant="secondary" className="text-xs">
                          Ponavljajuće
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePostActive(post.id)}
                      >
                        {post.isActive ? (
                          <Pause className="h-4 w-4 text-orange-600" />
                        ) : (
                          <Play className="h-4 w-4 text-green-600" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteScheduledPost(post.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {post.content.substring(0, 100)}...
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      {new Date(post.scheduledDateTime).toLocaleString('hr-HR')}
                    </span>
                    <span className={post.isActive ? 'text-green-600' : 'text-gray-400'}>
                      {post.isActive ? 'Aktivno' : 'Pauzirano'}
                    </span>
                  </div>
                </div>
              ))}
              {getUpcomingPosts().length === 0 && (
                <p className="text-center text-gray-500 py-4">
                  Nema zakazanih objava.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
              Nedavno Objavljeno
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {getRecentlyPublished().map(post => (
                <div key={post.id} className="border rounded-lg p-3 bg-green-50">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline">{post.platform}</Badge>
                    <Badge className="bg-green-100 text-green-800">
                      Objavljeno
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {post.content.substring(0, 100)}...
                  </p>
                  <div className="text-xs text-gray-500">
                    {new Date(post.scheduledDateTime).toLocaleString('hr-HR')}
                  </div>
                </div>
              ))}
              {getRecentlyPublished().length === 0 && (
                <p className="text-center text-gray-500 py-4">
                  Nema nedavno objavljenih postova.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* All Scheduled Posts */}
      <Card>
        <CardHeader>
          <CardTitle>Svi Zakazani Postovi ({scheduledPosts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {scheduledPosts.map(post => (
              <div key={post.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{post.platform}</Badge>
                    <Badge variant={post.status === 'Published' ? 'default' : 'secondary'}>
                      {post.status}
                    </Badge>
                    {post.recurring && (
                      <Badge variant="secondary" className="text-xs">
                        Ponavljajuće ({post.recurring.frequency})
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => togglePostActive(post.id)}
                    >
                      {post.isActive ? (
                        <Pause className="h-4 w-4 text-orange-600" />
                      ) : (
                        <Play className="h-4 w-4 text-green-600" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteScheduledPost(post.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-3">
                  {post.content}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>
                    Zakazano: {new Date(post.scheduledDateTime).toLocaleString('hr-HR')}
                  </span>
                  <span className={post.isActive ? 'text-green-600' : 'text-gray-400'}>
                    {post.isActive ? 'Aktivno' : 'Pauzirano'}
                  </span>
                </div>
              </div>
            ))}
            {scheduledPosts.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                Nema zakazanih postova. Zakazujte svoje objave pomoću forme iznad.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContentScheduler;
