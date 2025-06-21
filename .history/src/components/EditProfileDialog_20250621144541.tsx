import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Tables } from '@/integrations/supabase/types';
import { Loader2 } from 'lucide-react';

interface EditProfileDialogProps {
  profile: Tables<'profiles'> | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const EditProfileDialog: React.FC<EditProfileDialogProps> = ({ profile, isOpen, onOpenChange }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [country, setCountry] = useState('');

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setUsername(profile.username || '');
      setBio(profile.bio || '');
      setAvatarUrl(profile.avatar_url || '');
      setCountry(profile.country || '');
    } else {
      // Try to auto-detect country if not set
      fetch('https://ipapi.co/json/')
        .then(res => res.json())
        .then(data => setCountry(data.country_name || ''));
    }
  }, [profile, isOpen]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setAvatarFile(file);
    // Upload to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const filePath = `avatars/${user.id}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
    if (uploadError) {
      toast({ title: 'Error uploading image', description: uploadError.message, variant: 'destructive' });
      return;
    }
    // Get public URL
    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    setAvatarUrl(data.publicUrl);
    toast({ title: 'Profile image uploaded!' });
  };

  const handleSave = async () => {
    if (!user) return;
    setIsLoading(true);

    const updates = {
      id: user.id,
      full_name: fullName,
      username,
      bio,
      avatar_url: avatarUrl,
      country,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('profiles').upsert(updates, {
        onConflict: 'id'
    });

    setIsLoading(false);

    if (error) {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Profile updated successfully!" });
      await queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
      await queryClient.invalidateQueries({ queryKey: ['userPosts', user.id] });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex flex-col items-center">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" className="w-24 h-24 rounded-full object-cover mb-2" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center mb-2 text-gray-400">No Image</div>
            )}
            <input type="file" accept="image/*" onChange={handleAvatarChange} className="text-xs" />
          </div>
          <div>
            <label htmlFor="fullName" className="text-sm font-medium text-gray-700">Full Name</label>
            <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1"/>
          </div>
          <div>
            <label htmlFor="username" className="text-sm font-medium text-gray-700">Username</label>
            <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} className="mt-1"/>
          </div>
          <div>
            <label htmlFor="bio" className="text-sm font-medium text-gray-700">Bio</label>
            <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} className="mt-1"/>
          </div>
          <div>
            <label htmlFor="country" className="text-sm font-medium text-gray-700">Country</label>
            <Input id="country" value={country} onChange={e => setCountry(e.target.value)} className="mt-1" />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileDialog;
