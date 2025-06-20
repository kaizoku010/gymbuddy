
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Buddy = {
  id: string;
  full_name: string;
  username: string;
  bio: string;
  avatar_url: string;
  distance: number;
};

const BuddiesSidebar: React.FC = () => {
  const [buddies, setBuddies] = useState<Buddy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      // You may want to implement distance query in the backend for production
      const { data, error } = await supabase
        .from("nearby_users")
        .select(
          `
            nearby_user_id,
            full_name,
            username,
            bio,
            avatar_url,
            distance
          `
        )
        .order("distance", { ascending: true })
        .limit(10);

      if (!error && data) {
        const mapped = data.map((u: any) => ({
          id: u.nearby_user_id ?? "",
          full_name: u.full_name ?? "",
          username: u.username ?? "",
          bio: u.bio ?? "",
          avatar_url: u.avatar_url ?? "",
          distance: u.distance ?? null,
        }));
        setBuddies(mapped);
      }
      setLoading(false);
    })();
  }, []);

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
