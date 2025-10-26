import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthContext } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Trash2, Loader2, User } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export const AccountSettings = () => {
  const { user } = useAuthContext();
  const { t } = useLanguage();
  const { uploadAvatar, deleteAvatar, updateProfile, changePassword, isUploading, isUpdating } = useProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<any>(null);
  const [fullName, setFullName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (data) {
      setProfile(data);
      setFullName(data.full_name || '');
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    const url = await uploadAvatar(file);
    if (url) {
      await loadProfile();
      setPreviewUrl(null);
    }
  };

  const handleDeleteAvatar = async () => {
    const success = await deleteAvatar();
    if (success) {
      await loadProfile();
      setPreviewUrl(null);
    }
  };

  const handleUpdateProfile = async () => {
    if (!fullName.trim()) return;
    const success = await updateProfile(fullName);
    if (success) {
      await loadProfile();
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      return;
    }
    if (newPassword !== confirmPassword) {
      return;
    }

    const success = await changePassword(newPassword);
    if (success) {
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const avatarUrl = previewUrl || profile?.avatar_url;

  return (
    <div className="space-y-6">
      {/* Avatar Section */}
      <Card>
        <CardHeader>
          <CardTitle>{t('profile_picture')}</CardTitle>
          <CardDescription>{t('profile_picture_desc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback>
                <User className="h-12 w-12" />
              </AvatarFallback>
            </Avatar>

            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                variant="outline"
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {t('upload_avatar')}
              </Button>

              {profile?.avatar_url && (
                <Button
                  onClick={handleDeleteAvatar}
                  disabled={isUpdating}
                  variant="outline"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('delete_avatar')}
                </Button>
              )}

              <p className="text-xs text-muted-foreground">
                PNG, JPG, WEBP {t('max')} 2MB
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>{t('basic_info')}</CardTitle>
          <CardDescription>{t('basic_info_desc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t('email')}</Label>
            <Input
              id="email"
              type="email"
              value={user?.email || ''}
              disabled
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">{t('full_name')}</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t('enter_full_name')}
            />
          </div>

          <Button
            onClick={handleUpdateProfile}
            disabled={isUpdating || !fullName.trim()}
          >
            {isUpdating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            {t('save_changes')}
          </Button>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle>{t('change_password')}</CardTitle>
          <CardDescription>{t('change_password_desc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">{t('new_password')}</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={t('enter_new_password')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t('confirm_password')}</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t('confirm_new_password')}
            />
          </div>

          {newPassword && newPassword.length < 6 && (
            <p className="text-sm text-destructive">
              {t('password_min_length')}
            </p>
          )}

          {newPassword && confirmPassword && newPassword !== confirmPassword && (
            <p className="text-sm text-destructive">
              {t('passwords_dont_match')}
            </p>
          )}

          <Button
            onClick={handleChangePassword}
            disabled={
              isUpdating ||
              !newPassword ||
              !confirmPassword ||
              newPassword !== confirmPassword ||
              newPassword.length < 6
            }
          >
            {isUpdating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            {t('change_password')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};