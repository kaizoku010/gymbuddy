import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from '@/hooks/useAuth';

type Buddy = {
  id: string;
  full_name: string;
  username: string;
  bio: string;
  avatar_url: string;
  distance: number;
};

const BuddiesSidebar: React.FC = () => {
  const { user } = useAuth();
  const [buddies, setBuddies] = useState<Buddy[]>([]);
  const [loading, setLoading] = useState(true);
  const [userCountry, setUserCountry] = useState<string | null>(null);

  useEffect(() => {
    // Fetch current user's country
    const fetchUserCountry = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('country')
        .eq('id', user.id)
        .single();
      if (!error && data) setUserCountry(data.country || null);
    };
    fetchUserCountry();
  }, [user]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      let query = supabase
        .from('profiles')
        .select('id, full_name, username, bio, avatar_url, country');
      if (userCountry) {
        query = query.eq('country', userCountry);
      }
      // Exclude self
      if (user) {
        query = query.neq('id', user.id);
      }
      const { data, error } = await query.limit(20);
      if (!error && data) {
        const mapped = data.map((u: any) => ({
          id: u.id ?? '',
          full_name: u.full_name ?? '',
          username: u.username ?? '',
          bio: u.bio ?? '',
          avatar_url: u.avatar_url ?? '',
          distance: null, // No distance, just country match
        }));
        setBuddies(mapped);
      }
      setLoading(false);
    })();
  }, [userCountry, user]);

  return (
    <aside className="hidden lg:flex flex-col w-80 border-l border-gray-800 bg-black/90 min-h-screen pt-20 px-6 space-y-3">
      <div className="text-white text-lg font-bold mb-2">Buddies Near You</div>
      {loading ? (
        <div className="text-gray-400">Loading...</div>
      ) : buddies.length === 0 ? (
        <div className="text-gray-500">No nearby buddies found.</div>
      ) : (
        <ul className="space-y-4">
          {buddies.map((b) => (
            <li key={b.id} className="flex items-center gap-4 bg-zinc-900 rounded-lg px-4 py-3">
              <Avatar>
                <AvatarImage src={b.avatar_url} alt={b.full_name || b.username} />
                <AvatarFallback>{(b.full_name || b.username || "U").charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-white font-medium">{b.full_name || b.username}</span>
                {b.distance !== null && (
                  <span className="text-xs text-gray-400">{b.distance.toFixed(2)} km away</span>
                )}
                <span className="text-xs text-gray-400">{b.bio}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
};

export default BuddiesSidebar;
