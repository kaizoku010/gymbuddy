import React, { useRef, useEffect } from "react";

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
}

interface ShortPlayerProps {
  short: Short;
  isActive: boolean;
  onError?: (id: string, src: string) => void;
  allowSound?: boolean;
}

const ShortPlayer: React.FC<ShortPlayerProps> = ({ short, isActive, onError, allowSound }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.muted = !allowSound;
        videoRef.current.play().catch((error) => {
          // Silent failure for autoplay block
          console.log("Video autoplay prevented:", short.id, error);
        });
      } else {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [isActive, short.id, allowSound]);

  // Log events for debugging
  const handleError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const target = e.target as HTMLVideoElement;
    console.error(`[ShortPlayer] Error loading video id=${short.id}, src=${target.src}`, target.error);
    if (onError) onError(short.id, target.src);
    // No alert
  };
  const handleLoadedData = () => {
    console.log(`[ShortPlayer] Video loaded: id=${short.id}, src=${short.video_url}`);
  };

  return (
    <video
      ref={videoRef}
      src={short.video_url}
      className="w-full h-full object-cover"
      loop
      playsInline
      autoPlay
      muted={!allowSound}
      onError={handleError}
      onLoadedData={handleLoadedData}
      // no alert, just silent error log
    />
  );
};

export default ShortPlayer;
