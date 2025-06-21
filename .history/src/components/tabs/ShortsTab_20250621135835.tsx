import React, { useState, useEffect } from "react";
import { Heart, MessageCircle, Share, Bookmark, UserPlus, Loader2, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import ShortPlayer from "./ShortPlayer";
import BuddiesSidebar from "./BuddiesSidebar";
import ShortComments from "./ShortComments";

interface ShortsTabProps {
  onLogout: () => void;
}

interface Short {
  id: string;
  description: string;
  video_url: string;
  user: {
    name: string;
    avatar: string;
    isVerified: boolean;
  };
  audio: string;
  likes: number;
  comments: number;
  views: number;
  created_at?: string; // Added created_at property
}

const SHORTS_PER_PAGE = 5;

const ShortsTab: React.FC<ShortsTabProps> = ({ onLogout }) => {
  const [shorts, setShorts] = useState<Short[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [currentVideo, setCurrentVideo] = useState<number>(0);
  const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set());
  const [savedVideos, setSavedVideos] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [api, setApi] = useState<CarouselApi>();
  const [allowSound, setAllowSound] = useState(false);
  const [openComments, setOpenComments] = useState<string | null>(null);

  // Fetch latest shorts/videos from Supabase on mount (always fresh)
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    setShorts([]);
    setCurrentVideo(0);

    const fetchLatestShorts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("posts_with_details")
        .select(`
          id,
          content,
          video_url,
          author_name,
          author_avatar,
          likes_count,
          comments_count,
          views_count,
          created_at
        `)
        .eq("post_type", "video")
        .not("video_url", "is", null)
        .order("created_at", { ascending: false })
        .range(0, SHORTS_PER_PAGE - 1);

      if (error) {
        console.error("Error fetching shorts:", error);
      } else if (data) {
        const formattedShorts: Short[] = data.map((post: any) => ({
          id: post.id,
          user: {
            name: post.author_name || "Anonymous",
            avatar: post.author_avatar || "",
            isVerified: false,
          },
          description: post.content,
          audio: "Original Audio",
          likes: post.likes_count ?? 0,
          comments: post.comments_count ?? 0,
          views: post.views_count ?? 0,
          video_url: post.video_url,
          created_at: post.created_at,
        }));
        setShorts(formattedShorts);
        if (data.length < SHORTS_PER_PAGE) setHasMore(false);
      }
      setLoading(false);
    };
    fetchLatestShorts();
  }, []); // Only on mount

  // Carousel control
  useEffect(() => {
    if (!api) return;
    const handleSelect = () => setCurrentVideo(api.selectedScrollSnap());
    api.on("select", handleSelect);
    handleSelect();

    return () => {
      api.off("select", handleSelect);
    };
  }, [api]);

  const loadMoreShorts = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);

    const from = page * SHORTS_PER_PAGE;
    const to = from + SHORTS_PER_PAGE - 1;

    const { data, error } = await supabase
      .from("posts_with_details")
      .select(`
          id,
          content,
          video_url,
          author_name,
          author_avatar,
          likes_count,
          comments_count,
          views_count,
          created_at
        `)
      .eq("post_type", "video")
      .not("video_url", "is", null)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Error fetching more shorts:", error);
    } else if (data) {
      const formattedShorts: Short[] = data.map((post: any) => ({
        id: post.id,
        user: {
          name: post.author_name || "Anonymous",
          avatar: post.author_avatar || "",
          isVerified: false,
        },
        description: post.content,
        audio: "Original Audio",
        likes: post.likes_count ?? 0,
        comments: post.comments_count ?? 0,
        views: post.views_count ?? 0,
        video_url: post.video_url,
        created_at: post.created_at,
      }));

      setShorts((prev) => [...prev, ...formattedShorts]);
      if (data.length < SHORTS_PER_PAGE) setHasMore(false);
      setPage((prev) => prev + 1);
    }
    setLoadingMore(false);
  };

  // Load more on scroll near end
  useEffect(() => {
    if (shorts.length > 0 && currentVideo >= shorts.length - 2 && hasMore && !loadingMore) {
      loadMoreShorts();
    }
  }, [currentVideo, shorts.length, hasMore, loadingMore]);

  const handleVideoError = (id: string, src: string) => {
    // If video failed to load (e.g. .avi), just log
    console.warn(`Failed to load video: ${src} (id: ${id})`);
  };

  const toggleLike = (videoId: string) => {
    setLikedVideos((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(videoId)) {
        newSet.delete(videoId);
      } else {
        newSet.add(videoId);
      }
      return newSet;
    });
  };

  const toggleSave = (videoId: string) => {
    setSavedVideos((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(videoId)) {
        newSet.delete(videoId);
      } else {
        newSet.add(videoId);
      }
      return newSet;
    });
  };

  // Listen for first user interaction to allow sound
  useEffect(() => {
    const enableSound = () => setAllowSound(true);
    window.addEventListener("pointerdown", enableSound, { once: true });
    return () => window.removeEventListener("pointerdown", enableSound);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  if (!loading && shorts.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-center p-4">
        <div>
          <Video className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No Shorts Yet</h3>
          <p className="text-gray-400">Be the first one to create a short!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black relative overflow-hidden flex">
      {/* Shorts feed */}
      <div className="flex-1 h-full relative">
        <Carousel
          setApi={setApi}
          opts={{
            axis: "y",
            loop: false,
          }}
          orientation="vertical"
          className="h-full w-full"
        >
          <CarouselContent className="h-full -mt-0">
            {shorts.map((short, index) => (
              <CarouselItem key={short.id} className="pt-0 h-full relative">
                {/* Video Background */}
                <div className="absolute inset-0">
                  <ShortPlayer
                    short={short}
                    isActive={index === currentVideo}
                    onError={handleVideoError}
                    allowSound={allowSound && index === currentVideo}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-20 pointer-events-none" />
                </div>

                {/* Video Controls Overlay */}
                <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-end items-end pb-32 pr-4 space-y-6 z-30 pointer-events-auto">
                  {/* Profile */}
                  <div className="flex flex-col items-center">
                    <Avatar className="w-12 h-12 border-2 border-white">
                      <AvatarImage src={short.user.avatar} alt={`@${short.user.name}`} />
                      <AvatarFallback>
                        {short.user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <button className="w-6 h-6 bg-black rounded-full flex items-center justify-center mt-2 border-2 border-white">
                      <UserPlus className="w-3 h-3 text-white" />
                    </button>
                  </div>

                  {/* Like */}
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => toggleLike(short.id)}
                      className="hover:scale-110 transition-transform"
                    >
                      <Heart
                        className={`w-8 h-8 ${
                          likedVideos.has(short.id)
                            ? "fill-red-500 text-red-500"
                            : "text-white"
                        }`}
                      />
                    </button>
                    <span className="text-white text-xs font-medium mt-1">
                      {((short.likes + (likedVideos.has(short.id) ? 1 : 0)) / 1000).toFixed(1)}K
                    </span>
                  </div>

                  {/* Comment */}
                  <div className="flex flex-col items-center">
                    <button
                      className="hover:scale-110 transition-transform"
                      onClick={() => setOpenComments(short.id)}
                    >
                      <MessageCircle className="w-8 h-8 text-white" />
                    </button>
                    <span className="text-white text-xs font-medium mt-1">{short.comments}</span>
                  </div>

                  {/* Views */}
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-white">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12s3.75-7.5 9.75-7.5 9.75 7.5 9.75 7.5-3.75 7.5-9.75 7.5S2.25 12 2.25 12z" />
                        <circle cx="12" cy="12" r="3" fill="white" />
                      </svg>
                    </div>
                    <span className="text-white text-xs font-medium mt-1">{short.views ?? 0}</span>
                  </div>

                  {/* Save */}
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => toggleSave(short.id)}
                      className="hover:scale-110 transition-transform"
                    >
                      <Bookmark
                        className={`w-8 h-8 ${
                          savedVideos.has(short.id)
                            ? "fill-black text-black"
                            : "text-white"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Share */}
                  <div className="flex flex-col items-center">
                    <button className="hover:scale-110 transition-transform">
                      <Share className="w-8 h-8 text-white" />
                    </button>
                  </div>

                  {/* Audio */}
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center animate-spin-slow">
                      <span className="text-white text-xs">🎵</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Info */}
                <div className="absolute bottom-20 left-0 right-0 px-6">
                  <div className="flex items-center space-x-3 mb-3">
                    <h3 className="text-white font-semibold text-lg">
                      @{short.user.name}
                    </h3>
                    {short.user.isVerified && (
                      <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                    {/* Post date */}
                    {short.created_at && (
                      <span className="text-xs text-gray-400 ml-2">
                        {new Date(short.created_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <p className="text-white text-sm leading-relaxed mb-3">
                    {short.description}
                  </p>
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-white text-xs">🎵</span>
                    <span className="text-white text-xs">{short.audio}</span>
                  </div>
                </div>

                {/* Comments Drawer/Modal */}
                {openComments === short.id && (
                  <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black bg-opacity-70">
                    <div className="w-full max-w-md mx-auto bg-gray-900 rounded-t-2xl md:rounded-2xl p-4 relative">
                      <button
                        className="absolute top-2 right-2 text-white text-2xl"
                        onClick={() => setOpenComments(null)}
                        aria-label="Close comments"
                      >
                        &times;
                      </button>
                      <ShortComments postId={short.id} open={true} />
                    </div>
                  </div>
                )}
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 pt-12 pb-4 px-6 bg-gradient-to-b from-black/50 to-transparent">
          <div className="flex items-center justify-between">
            <span className="text-white font-semibold">Shorts</span>
            <button className="text-white">
              <span className="text-xl">🔍</span>
            </button>
          </div>
        </div>
      </div>
      {/* Desktop right sidebar */}
      <BuddiesSidebar />
    </div>
  );
};

export default ShortsTab;
