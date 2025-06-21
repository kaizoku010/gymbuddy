import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface BuddyRequestPostProps {
  post: any;
  fetchPosts?: () => Promise<void>;
}

const BuddyRequestPost: React.FC<BuddyRequestPostProps> = ({ post, fetchPosts }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pickups, setPickups] = useState<any[]>([]);
  const [loadingPickups, setLoadingPickups] = useState(false);

  const fetchPickups = async () => {
    setLoadingPickups(true);
    const { data } = await supabase
      .from('buddy_request_pickups')
      .select('user_id, profiles:user_id(full_name, username, avatar_url)')
      .eq('post_id', post.id);
    setPickups(data || []);
    setLoadingPickups(false);
  };

  useEffect(() => {
    fetchPickups();
    // eslint-disable-next-line
  }, [post.id]);

  const handlePickup = async () => {
    try {
      if (pickups.some(p => p.user_id === user.id)) {
        toast({ title: 'Already Picked Up', description: 'You have already picked up this request.' });
        return;
      }
      if (pickups.length >= 5) {
        toast({ title: 'Limit Reached', description: 'This request already has 5 pickups.' });
        return;
      }
      const { error } = await supabase
        .from('buddy_request_pickups')
        .insert({ post_id: post.id, user_id: user.id });
      if (error) throw error;
      toast({ title: 'Picked up!', description: 'You have picked up this request.' });
      fetchPickups();
      if (fetchPosts) await fetchPosts();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const handleSelectBuddy = async (selectedUserId: string) => {
    try {
      const { error } = await supabase
        .from('posts')
        .update({ selected_buddy_id: selectedUserId })
        .eq('id', post.id);
      if (error) throw error;
      toast({ title: 'Buddy Selected!', description: 'You have selected your gym buddy.' });
      fetchPickups();
      if (fetchPosts) await fetchPosts();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold text-gray-900">Buddy Request</div>
        {post.selected_buddy_id && <span className="text-green-600 font-medium">Buddy Selected</span>}
      </div>
      <div className="mb-2 text-gray-700">{post.content}</div>
      {/* Pickup Button */}
      {user && post.user_id !== user.id && !post.selected_buddy_id && pickups.length < 5 && !pickups.some(p => p.user_id === user.id) && (
        <button onClick={handlePickup} className="bg-green-500 text-white px-4 py-2 rounded-lg mb-2">Pick Up Request</button>
      )}
      {/* Pickups List for Owner */}
      {user && post.user_id === user.id && (
        <div className="mt-2">
          <div className="font-medium mb-1">Pickups:</div>
          {loadingPickups ? (
            <div>Loading...</div>
          ) : (
            pickups.length === 0 ? <div className="text-gray-400">No pickups yet.</div> :
            pickups.map(p => (
              <div key={p.user_id} className="flex items-center space-x-2 mb-1">
                <img src={p.profiles?.avatar_url} alt="" className="w-8 h-8 rounded-full" />
                <span>{p.profiles?.full_name} (@{p.profiles?.username})</span>
                <button
                  onClick={() => handleSelectBuddy(p.user_id)}
                  className={
                    'bg-orange-500 text-white px-2 py-1 rounded' + (post.selected_buddy_id === p.user_id ? ' opacity-50' : '')
                  }
                  disabled={post.selected_buddy_id === p.user_id}
                >
                  {post.selected_buddy_id === p.user_id ? 'Selected' : 'Select'}
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default BuddyRequestPost;
