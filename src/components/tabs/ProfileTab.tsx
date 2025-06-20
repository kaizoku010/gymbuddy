
import React, { useState } from 'react';
import { Settings, MoreHorizontal, Crown, UserPlus, MessageCircle, Heart, MessageSquare } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from '@/components/ui/skeleton';
import { Tables } from '@/integrations/supabase/types';
import EditProfileDialog from '@/components/EditProfileDialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ProfileTabProps {
  onLogout: () => void;
}

type PostWithDetails = Tables<'posts_with_details'>;

const ProfileTab: React.FC<ProfileTabProps> = ({ onLogout }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [isOwnProfile] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Fetch profile data
  const fetchProfile = async () => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    if (error) {
        console.error("Error fetching profile", error);
        throw new Error(error.message);
    }
    return data;
  };

  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: fetchProfile,
    enabled: !!user,
  });

  // Fetch profile stats
  const fetchProfileStats = async () => {
    if (!user) return { posts: 0, followers: 0, following: 0, likes: 0 };

    const { count: postsCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

    const { count: followersCount } = await supabase
        .from('buddies')
        .select('*', { count: 'exact', head: true })
        .eq('buddy_id', user.id);
    
    const { count: followingCount } = await supabase
        .from('buddies')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

    const { data: userPosts, error: userPostsError } = await supabase
        .from('posts_with_details')
        .select('likes_count')
        .eq('user_id', user.id);

    if (userPostsError) {
        console.error("Error fetching user posts for likes count", userPostsError);
    }

    const totalLikes = userPosts ? userPosts.reduce((sum, post) => sum + (post.likes_count || 0), 0) : 0;

    return {
        posts: postsCount || 0,
        followers: followersCount || 0,
        following: followingCount || 0,
        likes: totalLikes,
    };
  };

  const { data: profileStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['profileStats', user?.id],
    queryFn: fetchProfileStats,
    enabled: !!user,
  });

  // Fetch posts
  const fetchPosts = async () => {
    if (!user) return [];
    const { data, error } = await supabase
      .from('posts_with_details')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching posts", error);
        throw new Error(error.message);
    }
    return data as PostWithDetails[];
  };

  const { data: posts, isLoading: isLoadingPosts } = useQuery<PostWithDetails[]>({
    queryKey: ['userPosts', user?.id],
    queryFn: fetchPosts,
    enabled: !!user,
  });

  const tabs = ['Posts', 'Shorts', 'Tagged'];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white px-6 py-4 border-b border-gray-100 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">Profile</h1>
          <div className="flex items-center space-x-4">
            <button className="text-gray-600 hover:text-gray-800">
              <MoreHorizontal className="w-6 h-6" />
            </button>
            <button
              onClick={onLogout}
              className="text-gray-600 hover:text-gray-800"
            >
              <Settings className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Profile Info */}
      <div className="p-6">
        <div className="flex items-start space-x-4 mb-6">
          {/* Profile Picture */}
          <div className="relative">
             {isLoadingProfile ? (
              <Skeleton className="w-24 h-24 rounded-full" />
            ) : (
              <>
                {profile?.avatar_url ? (
                    <Avatar className="w-24 h-24 text-4xl">
                        <AvatarImage src={profile.avatar_url} alt={profile.full_name || 'User avatar'} />
                        <AvatarFallback>
                            {profile.full_name?.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                    </Avatar>
                ) : (
                    <div className="w-24 h-24 bg-gradient-to-br from-gray-800 to-black rounded-full flex items-center justify-center text-white text-3xl font-bold">
                        {profile?.full_name ? profile.full_name.split(' ').map(n => n[0]).join('') : 'U'}
                    </div>
                )}
              </>
            )}
            <div className="absolute -top-1 -right-1 w-8 h-8 bg-black rounded-full flex items-center justify-center">
              <Crown className="w-4 h-4 text-white" />
            </div>
          </div>

          {/* Profile Stats */}
          <div className="flex-1">
            <div className="flex justify-around mb-4">
               {isLoadingStats || !profileStats ? (
                <>
                  <div className="text-center"><Skeleton className="h-6 w-12 mx-auto mb-1" /><Skeleton className="h-4 w-16 mx-auto" /></div>
                  <div className="text-center"><Skeleton className="h-6 w-12 mx-auto mb-1" /><Skeleton className="h-4 w-16 mx-auto" /></div>
                  <div className="text-center"><Skeleton className="h-6 w-12 mx-auto mb-1" /><Skeleton className="h-4 w-16 mx-auto" /></div>
                  <div className="text-center"><Skeleton className="h-6 w-12 mx-auto mb-1" /><Skeleton className="h-4 w-16 mx-auto" /></div>
                </>
              ) : (
                <>
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900">{profileStats.posts.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Posts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900">{profileStats.followers.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Followers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900">{profileStats.following.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Following</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900">{(profileStats.likes / 1000).toFixed(1)}K</div>
                    <div className="text-sm text-gray-600">Likes</div>
                  </div>
                </>
              )}
            </div>

            {/* Action Buttons */}
            {isOwnProfile ? (
              <div className="flex space-x-3">
                <button
                  onClick={() => setIsEditDialogOpen(true)}
                  className="flex-1 bg-gray-100 text-gray-900 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Edit Profile
                </button>
                <button className="flex-1 bg-black text-white py-2 px-4 rounded-lg font-medium hover:bg-neutral-800 transition-colors flex items-center justify-center space-x-2">
                  <Crown className="w-4 h-4" />
                  <span>Premium</span>
                </button>
              </div>
            ) : (
              <div className="flex space-x-3">
                <button className="flex-1 bg-black text-white py-2 px-4 rounded-lg font-medium hover:bg-neutral-800 transition-colors flex items-center justify-center space-x-2">
                  <UserPlus className="w-4 h-4" />
                  <span>Follow</span>
                </button>
                <button className="flex-1 bg-gray-100 text-gray-900 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2">
                  <MessageCircle className="w-4 h-4" />
                  <span>Message</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bio */}
        <div className="mb-6">
          {isLoadingProfile ? (
            <>
              <Skeleton className="h-6 w-40 mb-2" />
              <Skeleton className="h-4 w-60 mb-2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full mt-1" />
              <Skeleton className="h-4 w-3/4 mt-1" />
            </>
          ) : (
            <>
              <h3 className="font-semibold text-gray-900 text-lg mb-1">{profile?.full_name}</h3>
              <div className="flex items-center space-x-2 mb-2">
                <span className="bg-black text-white px-2 py-1 rounded-full text-xs font-medium">PRO MEMBER</span>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                {profile?.bio || 'No bio yet.'}
              </p>
            </>
          )}
        </div>

        {/* Subscription Status */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-gray-900">Premium Member</h4>
              <p className="text-gray-700 text-sm">Unlimited features • Expires Dec 2024</p>
            </div>
            <Crown className="w-8 h-8 text-black" />
          </div>
          <button className="w-full bg-black text-white py-2 rounded-lg font-medium mt-3 hover:bg-neutral-800 transition-colors">
            Manage Subscription
          </button>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="border-t border-gray-200">
        <div className="flex">
          {tabs.map((tab, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(index)}
              className={`flex-1 py-4 text-center font-medium transition-colors ${
                activeTab === index
                  ? 'text-black border-b-2 border-black'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content Grid */}
      <div className="p-3">
        {isLoadingPosts ? (
          <div className="grid grid-cols-3 gap-1">
              {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-lg" />
              ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {posts?.map((post) => (
              <Dialog key={post.id}>
                <DialogTrigger asChild>
                  <div
                    className="aspect-square bg-gray-100 rounded-lg relative overflow-hidden group cursor-pointer"
                  >
                    {post.image_url ? (
                        <img src={post.image_url} alt="post content" className="w-full h-full object-cover" />
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-black flex items-center justify-center p-2">
                            {post.post_type === 'video' ? (
                                <span className="text-4xl text-white opacity-80">🎬</span>
                            ) : (
                                <p className="text-white text-sm text-center line-clamp-4">{post.content}</p>
                            )}
                        </div>
                    )}
                    
                    {post.post_type === 'video' && (
                      <div className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-1">
                        <span className="text-white text-xs">🎬</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                      <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-2">
                        <Heart className="w-4 h-4" />
                        <span className="text-sm font-medium">{post.likes_count || 0}</span>
                      </div>
                    </div>
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                    <div className="bg-black flex items-center justify-center">
                        {post.image_url ? (
                            <img src={post.image_url} alt="post content" className="object-contain max-h-[80vh]" />
                        ) : (
                            <div className="flex items-center justify-center p-8 h-full bg-gradient-to-br from-gray-800 to-black">
                                <p className="text-white text-lg text-center">{post.content}</p>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col p-6">
                        <div className="flex items-center space-x-3 mb-4">
                            <Avatar>
                                <AvatarImage src={post.author_avatar || undefined} />
                                <AvatarFallback>{post.author_name?.charAt(0) || 'A'}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold text-gray-900">{post.author_name}</p>
                            </div>
                        </div>
                        <p className="text-gray-700 text-sm mb-4 border-b pb-4">{post.content}</p>
                        <div className="flex-grow overflow-y-auto">
                            {/* Comments would go here */}
                            <p className="text-gray-500 text-sm text-center py-4">No comments yet.</p>
                        </div>
                        <div className="border-t pt-4">
                          <div className="flex items-center space-x-4 text-gray-600 mb-2">
                              <div className="flex items-center space-x-1">
                                <Heart className="w-5 h-5" />
                                <span>{post.likes_count || 0} likes</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <MessageSquare className="w-5 h-5" />
                                <span>{post.comments_count || 0} comments</span>
                              </div>
                          </div>
                          <p className="text-xs text-gray-400">{new Date(post.created_at || 0).toLocaleDateString()}</p>
                        </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            ))}
          </div>
        )}

        {/* Load More */}
        {posts && posts.length > 0 && (
            <div className="text-center mt-6 pb-20">
            <button className="bg-gray-100 text-gray-700 px-6 py-3 rounded-full font-medium hover:bg-gray-200 transition-colors">
                Load More
            </button>
            </div>
        )}
      </div>

      <EditProfileDialog
        profile={profile}
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />
    </div>
  );
};

export default ProfileTab;
