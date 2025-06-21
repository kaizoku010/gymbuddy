import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share, MoreHorizontal, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRealtime } from '@/hooks/useRealtime';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import BuddyRequestPost from '../BuddyRequestPost';

interface Post {
  id: string;
  content: string;
  image_url?: string;
  video_url?: string;
  post_type: string;
  tags?: string[];
  created_at: string;
  user_id: string;
  author_name?: string;
  author_avatar?: string;
  likes_count?: number;
  comments_count?: number;
  user_has_liked?: boolean;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  post_id: string;
  user_profile?: {
    full_name: string;
    avatar_url?: string;
  };
}

interface FeedTabProps {
  onLogout: () => void;
}

const FeedTab: React.FC<FeedTabProps> = ({ onLogout }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<{ [key: string]: Comment[] }>({});
  const [showComments, setShowComments] = useState<{ [key: string]: boolean }>({});
  const [newComment, setNewComment] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();
  const { toast } = useToast();

  // Real-time subscriptions
  useRealtime({
    table: 'posts',
    onInsert: (payload) => {
      fetchPosts();
    },
    onUpdate: (payload) => {
      fetchPosts();
    },
    onDelete: (payload) => {
      setPosts(prev => prev.filter(p => p.id !== payload.old.id));
    }
  });

  useRealtime({
    table: 'likes',
    onInsert: (payload) => {
      fetchPosts();
    },
    onDelete: (payload) => {
      fetchPosts();
    }
  });

  useRealtime({
    table: 'comments',
    onInsert: (payload) => {
      fetchComments(payload.new.post_id);
      fetchPosts();
    },
    onUpdate: (payload) => {
      fetchComments(payload.new.post_id);
    },
    onDelete: (payload) => {
      fetchComments(payload.old.post_id);
      fetchPosts();
    }
  });

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts_with_details')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Check which posts the current user has liked
      if (user && data) {
        const { data: userLikes } = await supabase
          .from('likes')
          .select('post_id')
          .eq('user_id', user.id);

        const likedPostIds = new Set(userLikes?.map(like => like.post_id) || []);
        
        const postsWithLikeStatus = data.map(post => ({
          ...post,
          user_has_liked: likedPostIds.has(post.id)
        }));

        setPosts(postsWithLikeStatus);
      } else {
        setPosts(data || []);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (postId: string) => {
    try {
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select(`*`)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;

      if (!commentsData || commentsData.length === 0) {
        setComments(prev => ({...prev, [postId]: []}));
        return;
      }
      
      const userIds = [...new Set(commentsData.map(c => c.user_id))];
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);
      
      if (profilesError) throw profilesError;

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

      const commentsWithProfiles: Comment[] = commentsData.map(comment => ({
        ...comment,
        user_profile: profilesMap.has(comment.user_id) ? {
          full_name: profilesMap.get(comment.user_id)?.full_name || 'Anonymous',
          avatar_url: profilesMap.get(comment.user_id)?.avatar_url || undefined,
        } : { full_name: 'Anonymous' }
      }));

      setComments(prev => ({
        ...prev,
        [postId]: commentsWithProfiles
      }));
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const toggleLike = async (postId: string, isLiked: boolean) => {
    if (!user) return;

    try {
      if (isLiked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', postId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('likes')
          .insert({
            user_id: user.id,
            post_id: postId
          });

        if (error) throw error;
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update like",
        variant: "destructive",
      });
    }
  };

  const addComment = async (postId: string) => {
    if (!user || !newComment[postId]?.trim()) return;

    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          user_id: user.id,
          post_id: postId,
          content: newComment[postId].trim()
        });

      if (error) throw error;

      setNewComment(prev => ({ ...prev, [postId]: '' }));
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add comment",
        variant: "destructive",
      });
    }
  };

  const deletePost = async (postId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Post Deleted",
        description: "Your post has been deleted successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete post",
        variant: "destructive",
      });
    }
  };

  const toggleComments = (postId: string) => {
    setShowComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));

    if (!comments[postId]) {
      fetchComments(postId);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-6 py-4 border-b border-gray-100 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">Feed</h1>
          <button
            onClick={onLogout}
            className="text-gray-600 hover:text-gray-800 text-sm"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Posts */}
      <div className="p-4 space-y-6 pb-24 lg:pb-6">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
            <p className="text-gray-600">Be the first to share something with the community!</p>
          </div>
        ) : (
          posts.map((post) => (
            post.post_type === 'buddy_request' ? (
              <BuddyRequestPost
                key={post.id}
                post={post}
                user={user}
                fetchPosts={fetchPosts}
              />
            ) : (
              <div key={post.id} className="bg-white rounded-xl shadow-sm border border-gray-200">
                {/* Post Header */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={post.author_avatar || ''} alt={post.author_name || 'User avatar'} />
                      <AvatarFallback>{post.author_name ? post.author_name.charAt(0).toUpperCase() : '?'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-gray-900">{post.author_name || 'Anonymous'}</h3>
                      <p className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {user?.id === post.user_id && (
                      <button
                        onClick={() => deletePost(post.id)}
                        className="text-gray-400 hover:text-red-500 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <button className="text-gray-400 hover:text-gray-600 p-1">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Post Content */}
                <div className="px-4 pb-3">
                  <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {post.tags.map((tag, index) => (
                        <span key={index} className="bg-gray-200 text-gray-800 px-2 py-1 rounded-full text-sm">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Post Media */}
                {post.image_url && (
                  <div className="px-4 pb-3">
                    <img 
                      src={post.image_url} 
                      alt="Post content" 
                      className="w-full rounded-lg max-h-96 object-cover"
                    />
                  </div>
                )}
                {post.video_url && (
                  <div className="px-4 pb-3">
                    <video
                        src={post.video_url}
                        controls
                        playsInline
                        className="w-full rounded-lg max-h-96 object-cover bg-black"
                    />
                  </div>
                )}

                {/* Post Actions */}
                <div className="px-4 py-3 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      <button
                        onClick={() => toggleLike(post.id, post.user_has_liked || false)}
                        className={`flex items-center space-x-2 transition-colors ${
                          post.user_has_liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                        }`}
                      >
                        <Heart className={`w-5 h-5 ${post.user_has_liked ? 'fill-current' : ''}`} />
                        <span className="text-sm font-medium">{post.likes_count || 0}</span>
                      </button>

                      <button
                        onClick={() => toggleComments(post.id)}
                        className="flex items-center space-x-2 text-gray-500 hover:text-black transition-colors"
                      >
                        <MessageCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">{post.comments_count || 0}</span>
                      </button>

                      <button className="flex items-center space-x-2 text-gray-500 hover:text-black transition-colors">
                        <Share className="w-5 h-5" />
                        <span className="text-sm font-medium">Share</span>
                      </button>
                    </div>
                  </div>

                  {/* Comments Section */}
                  {showComments[post.id] && (
                    <div className="mt-4 space-y-3">
                      {/* Add Comment */}
                      <div className="flex space-x-3">
                        <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white text-sm">
                          {user?.user_metadata?.full_name?.charAt(0) || '?'}
                        </div>
                        <div className="flex-1 flex space-x-2">
                          <input
                            type="text"
                            placeholder="Add a comment..."
                            value={newComment[post.id] || ''}
                            onChange={(e) => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                            onKeyPress={(e) => e.key === 'Enter' && addComment(post.id)}
                            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-black"
                          />
                          <button
                            onClick={() => addComment(post.id)}
                            disabled={!newComment[post.id]?.trim()}
                            className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Post
                          </button>
                        </div>
                      </div>

                      {/* Comments List */}
                      {comments[post.id]?.map((comment) => (
                        <div key={comment.id} className="flex space-x-3">
                          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-white text-sm">
                            {comment.user_profile?.full_name?.charAt(0) || '?'}
                          </div>
                          <div className="flex-1 bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-sm text-gray-900">
                                {comment.user_profile?.full_name || 'Anonymous'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                              </span>
                            </div>
                            <p className="text-sm text-gray-800">{comment.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          ))
        )}
      </div>
    </div>
  );
};

export default FeedTab;
