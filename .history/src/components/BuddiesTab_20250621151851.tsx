import React, { useState, useEffect } from 'react';
import { MapPin, UserPlus, MessageCircle, Search, Loader2, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from '@/hooks/useLocation';
import { useRealtime } from '@/hooks/useRealtime';
import { useToast } from '@/hooks/use-toast';

interface NearbyUser {
  nearby_user_id: string;
  full_name: string;
  username: string;
  avatar_url: string;
  bio: string;
  distance_km: number;
  country?: string;
  city?: string;
}

interface BuddyRequest {
  id: string;
  user_id: string;
  buddy_id: string;
  status: string;
  created_at: string;
  user_profile?: {
    full_name: string;
    username: string;
    avatar_url: string;
  };
  buddy_profile?: {
    full_name: string;
    username: string;
    avatar_url: string;
  };
}

const BuddiesTab: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [buddyRequests, setBuddyRequests] = useState<BuddyRequest[]>([]);
  const [buddies, setBuddies] = useState<BuddyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<NearbyUser | null>(null);

  const { user } = useAuth();
  const { location, isLoading: locationLoading, getCurrentLocation } = useLocation();
  const { toast } = useToast();

  const tabs = ['Nearby', 'Requests', 'My Buddies'];

  // Real-time subscription for buddy requests
  useRealtime({
    table: 'buddies',
    onInsert: (payload) => {
      if (payload.new.buddy_id === user?.id) {
        fetchBuddyRequests();
      }
    },
    onUpdate: (payload) => {
      if (payload.new.user_id === user?.id || payload.new.buddy_id === user?.id) {
        fetchBuddyRequests();
        fetchBuddies();
      }
    },
    onDelete: (payload) => {
      if ((payload.old as any).user_id === user?.id || (payload.old as any).buddy_id === user?.id) {
        fetchBuddyRequests();
        fetchBuddies();
      }
    }
  });

  const fetchNearbyUsers = async () => {
    if (!user || !location) return;

    // Fetch current user's country/city
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('country, city')
      .eq('id', user.id)
      .single();
    const userCountry = userProfile?.country;
    const userCity = userProfile?.city;

    try {
      const { data, error } = await (supabase.rpc as any)('get_nearby_users', {
        current_user_id: user.id,
        user_latitude: location.latitude,
        user_longitude: location.longitude,
      });

      if (error) {
        console.error('Error fetching nearby users:', error);
        toast({
          title: "Could not find nearby users",
          description: "There may be an issue with the location service. Please try updating your location.",
          variant: "destructive",
        });
        setNearbyUsers([]);
        return;
      }
      // Loosened filtering: match if either city or country matches, and exclude self
      let filtered = (data || []).filter((u: any) => {
        if (u.nearby_user_id === user.id) return false;
        if (userCity && u.city && u.city === userCity && u.country === userCountry) return true;
        if (userCountry && u.country && u.country === userCountry) return true;
        return false;
      });
      filtered.sort((a: any, b: any) => a.distance_km - b.distance_km);
      setNearbyUsers(filtered);
    } catch (error) {
      console.error('Error fetching nearby users:', error);
    }
  };

  const fetchBuddyRequests = async () => {
    if (!user) return;

    try {
      const { data, error } = await (supabase as any)
        .from('buddies')
        .select(`
          *,
          user_profile:user_id(full_name, username, avatar_url)
        `)
        .eq('buddy_id', user.id)
        .eq('status', 'pending');

      if (error) throw error;
      setBuddyRequests(data || []);
    } catch (error) {
      console.error('Error fetching buddy requests:', error);
    }
  };

  const fetchBuddies = async () => {
    if (!user) return;

    try {
      const { data, error } = await (supabase as any)
        .from('buddies')
        .select(`
          *,
          user_profile:user_id(full_name, username, avatar_url),
          buddy_profile:buddy_id(full_name, username, avatar_url)
        `)
        .or(`user_id.eq.${user.id},buddy_id.eq.${user.id}`)
        .eq('status', 'accepted');

      if (error) throw error;
      setBuddies(data || []);
    } catch (error) {
      console.error('Error fetching buddies:', error);
    }
  };

  const sendBuddyRequest = async (buddyId: string) => {
    if (!user) return;

    try {
      const { error } = await (supabase as any)
        .from('buddies')
        .insert({
          user_id: user.id,
          buddy_id: buddyId,
          status: 'pending'
        });

      if (error) throw error;
      
      toast({
        title: "Buddy Request Sent",
        description: "Your buddy request has been sent successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send buddy request",
        variant: "destructive",
      });
    }
  };

  const respondToBuddyRequest = async (requestId: string, action: 'accepted' | 'blocked') => {
    try {
      const { error } = await (supabase as any)
        .from('buddies')
        .update({ status: action })
        .eq('id', requestId);

      if (error) throw error;
      
      toast({
        title: action === 'accepted' ? "Buddy Request Accepted" : "Request Declined",
        description: `You have ${action} the buddy request.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to respond to buddy request",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (user) {
      fetchBuddyRequests();
      fetchBuddies();
    }
  }, [user]);

  useEffect(() => {
    if (location && user) {
      fetchNearbyUsers();
    }
  }, [location, user]);

  useEffect(() => {
    setLoading(false);
  }, [nearbyUsers, buddyRequests, buddies]);

  const filteredNearbyUsers = nearbyUsers.filter(u => 
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-6 py-4 border-b border-gray-100 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-gray-900">Find Buddies</h1>
          <button
            onClick={getCurrentLocation}
            disabled={locationLoading}
            className="flex items-center space-x-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            {locationLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <MapPin className="w-4 h-4" />
            )}
            <span>Update Location</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {tabs.map((tab, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(index)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === index
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab}
              {index === 1 && buddyRequests.length > 0 && (
                <span className="ml-2 bg-orange-500 text-white text-xs rounded-full px-2 py-1">
                  {buddyRequests.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 0 && (
          <div>
            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search nearby users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            {!location && (
              <div className="text-center py-8">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Location Required</h3>
                <p className="text-gray-600 mb-4">Enable location access to find nearby workout buddies</p>
                <button
                  onClick={getCurrentLocation}
                  className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Enable Location
                </button>
              </div>
            )}

            {location && filteredNearbyUsers.length === 0 && !locationLoading && (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Nearby Users</h3>
                <p className="text-gray-600">No users found in your area. Try refreshing your location.</p>
              </div>
            )}

            <div className="grid gap-4">
              {filteredNearbyUsers.map((user) => (
                <div key={user.nearby_user_id} className="bg-white p-4 rounded-xl border border-gray-200 cursor-pointer hover:shadow-md transition"
                  onClick={() => setSelectedProfile(user)}>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white text-lg">
                      {user.full_name?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{user.full_name}</h3>
                      <p className="text-sm text-gray-600">@{user.username}</p>
                      <p className="text-sm text-orange-600">{user.distance_km.toFixed(1)} km away</p>
                      {(user.city || user.country) && (
                        <p className="text-xs text-gray-500">
                          {[user.city, user.country].filter(Boolean).join(', ')}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); sendBuddyRequest(user.nearby_user_id); }}
                      className="bg-orange-500 text-white p-2 rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      <UserPlus className="w-5 h-5" />
                    </button>
                  </div>
                  {user.bio && (
                    <p className="mt-3 text-sm text-gray-700">{user.bio}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 1 && (
          <div className="space-y-4">
            {buddyRequests.length === 0 ? (
              <div className="text-center py-8">
                <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Requests</h3>
                <p className="text-gray-600">You don't have any pending buddy requests.</p>
              </div>
            ) : (
              buddyRequests.map((request) => (
                <div key={request.id} className="bg-white p-4 rounded-xl border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white text-lg">
                        {request.user_profile?.full_name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{request.user_profile?.full_name}</h3>
                        <p className="text-sm text-gray-600">@{request.user_profile?.username}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => respondToBuddyRequest(request.id, 'accepted')}
                        className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => respondToBuddyRequest(request.id, 'blocked')}
                        className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 2 && (
          <div className="space-y-4">
            {buddies.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Buddies Yet</h3>
                <p className="text-gray-600">Start connecting with nearby users to build your buddy network.</p>
              </div>
            ) : (
              buddies.map((buddy) => {
                const buddyProfile = buddy.user_id === user?.id ? buddy.buddy_profile : buddy.user_profile;
                return (
                  <div key={buddy.id} className="bg-white p-4 rounded-xl border border-gray-200 cursor-pointer hover:shadow-md transition"
                    onClick={() => setSelectedProfile({
                      nearby_user_id: buddyProfile?.username || '',
                      full_name: buddyProfile?.full_name || '',
                      username: buddyProfile?.username || '',
                      avatar_url: buddyProfile?.avatar_url || '',
                      bio: '',
                      distance_km: 0,
                      country: '',
                      city: ''
                    })}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white text-lg">
                          {buddyProfile?.full_name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{buddyProfile?.full_name}</h3>
                          <p className="text-sm text-gray-600">@{buddyProfile?.username}</p>
                        </div>
                      </div>
                      <button className="bg-orange-500 text-white p-2 rounded-lg hover:bg-orange-600 transition-colors">
                        <MessageCircle className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Profile Dialog */}
      {selectedProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl p-8 max-w-sm w-full relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={() => setSelectedProfile(null)}>&times;</button>
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center text-white text-3xl mb-4">
                {selectedProfile.full_name?.charAt(0) || '?'}
              </div>
              <h2 className="text-xl font-bold mb-1">{selectedProfile.full_name}</h2>
              <p className="text-gray-600 mb-2">@{selectedProfile.username}</p>
              {(selectedProfile.city || selectedProfile.country) && (
                <p className="text-xs text-gray-500 mb-2">{[selectedProfile.city, selectedProfile.country].filter(Boolean).join(', ')}</p>
              )}
              {selectedProfile.bio && <p className="text-sm text-gray-700 mb-2">{selectedProfile.bio}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuddiesTab;
