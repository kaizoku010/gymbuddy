
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

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setUsername(profile.username || '');
      setBio(profile.bio || '');
    }
  }, [profile, isOpen]);

  const handleSave = async () => {
    if (!user) return;
    setIsLoading(true);

    const updates = {
      id: user.id,
      full_name: fullName,
      username,
      bio,
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
      toast({
        title: "Profile updated successfully!",
      });
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
