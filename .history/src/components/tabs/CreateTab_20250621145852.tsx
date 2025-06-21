import React, { useState, useRef } from 'react';
import { Camera, Video, Type, Hash, ArrowLeft, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface CreateTabProps {
  onLogout: () => void;
}

const CreateTab: React.FC<CreateTabProps> = ({ onLogout }) => {
  const [postType, setPostType] = useState<'text' | 'image' | 'video' | 'buddy_request' | null>(null);
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user } = useAuth();
  const { toast } = useToast();

  const workoutCategories = [
    '💪 Strength', '🏃‍♂️ Cardio', '🧘‍♀️ Yoga', '🏋️‍♂️ Weightlifting',
    '🤸‍♀️ CrossFit', '🥊 Boxing', '🏊‍♂️ Swimming', '🚴‍♂️ Cycling'
  ];

  const popularTags = [
    '#ChestDay', '#LegDay', '#BackDay', '#ArmDay', '#Cardio',
    '#Motivation', '#Fitness', '#Gym', '#Workout', '#Gains'
  ];

  const handleTagAdd = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (postType === 'image' && !selectedFile.type.startsWith('image/')) {
        toast({ title: "Invalid file type", description: "Please select an image file.", variant: "destructive" });
        return;
      }
      if (postType === 'video' && !selectedFile.type.startsWith('video/')) {
        toast({ title: "Invalid file type", description: "Please select a video file.", variant: "destructive" });
        return;
      }
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleBack = () => {
    setPostType(null);
    setFile(null);
    setPreviewUrl(null);
  };

  // Add a new handler for buddy request post requirements
  const handlePost = async () => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in to create a post.", variant: "destructive" });
      return;
    }
    if (!content.trim()) {
      toast({ title: "Validation Error", description: "Your post needs some content.", variant: "destructive" });
      return;
    }
    if (!postType) {
      toast({ title: "Validation Error", description: "Please select a post type.", variant: "destructive" });
      return;
    }
    if (postType === 'image' || postType === 'video') {
      if (!file) {
        toast({ title: "Validation Error", description: `Please select a ${postType} to upload.", variant: "destructive" });
        return;
      }
    }
    if (postType === 'buddy_request') {
      if (!file) {
        toast({ title: "Validation Error", description: "Please select an image or video for your buddy request.", variant: "destructive" });
        return;
      }
      if (!(file.type.startsWith('image/') || file.type.startsWith('video/'))) {
        toast({ title: "Invalid file type", description: "Please select an image or video file.", variant: "destructive" });
        return;
      }
    }
    setIsPosting(true);
    try {
      let mediaUrl: string | null = null;
      let isVideo = false;
      if (file && (postType === 'image' || postType === 'video' || postType === 'buddy_request')) {
        toast({ title: "Uploading media..." });
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('posts')
          .upload(fileName, file);
        if (uploadError) {
          throw uploadError;
        }
        const { data: urlData } = supabase.storage
          .from('posts')
          .getPublicUrl(fileName);
        if (!urlData) {
            throw new Error("Could not get public URL for the media.");
        }
        mediaUrl = urlData.publicUrl;
        isVideo = file.type.startsWith('video/');
      }
      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        content: content,
        post_type: postType,
        tags: tags.length > 0 ? tags : null,
        image_url: (postType === 'image' || (postType === 'buddy_request' && !isVideo)) ? mediaUrl : null,
        video_url: (postType === 'video' || (postType === 'buddy_request' && isVideo)) ? mediaUrl : null,
      });
      if (error) throw error;
      toast({
        title: postType === 'buddy_request' ? 'Buddy Request Posted!' : 'Post Created!',
        description: postType === 'buddy_request' ? 'Your gym buddy request is now live.' : 'Your post has been successfully shared.',
      });
      setPostType(null);
      setContent('');
      setTags([]);
      setCurrentTag('');
      setFile(null);
      setPreviewUrl(null);
    } catch (error: any) {
      toast({
        title: 'Error creating post',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsPosting(false);
    }
  };

  if (postType) {
    return (
      <div className="min-h-screen bg-white">
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept={
          postType === 'image' ? 'image/*' :
          postType === 'video' ? 'video/*' :
          postType === 'buddy_request' ? 'image/*,video/*' : undefined
        } />
        {/* Header */}
        <div className="bg-white px-6 py-4 border-b border-gray-100 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              className="flex items-center space-x-2 text-gray-600"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
            <h1 className="text-lg font-semibold">Create Post</h1>
            <button
              onClick={handlePost}
              disabled={isPosting}
              className="bg-orange-500 text-white px-6 py-2 rounded-full font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPosting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Media Preview */}
          {(postType === 'image' || postType === 'video') && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="bg-gray-100 rounded-2xl p-4 mb-6 text-center border-2 border-dashed border-gray-300 cursor-pointer flex items-center justify-center min-h-[200px] hover:border-orange-400 transition-colors"
            >
              {previewUrl ? (
                postType === 'image' ? (
                  <img src={previewUrl} alt="Preview" className="max-w-full max-h-96 object-contain rounded-lg" />
                ) : (
                  <video src={previewUrl} controls className="max-w-full max-h-96 object-contain rounded-lg" />
                )
              ) : (
                <div className="text-center">
                  {postType === 'image' ? (
                    <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  ) : (
                    <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  )}
                  <p className="text-gray-500 font-medium">Tap to add {postType}</p>
                  <p className="text-gray-400 text-sm">{postType === 'video' ? 'Max 60 seconds' : 'or drag and drop'}</p>
                </div>
              )}
            </div>
          )}

          {/* Caption */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Caption</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your fitness journey..."
              className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
              rows={4}
            />
          </div>

          {/* Category Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Workout Category</label>
            <div className="grid grid-cols-2 gap-3">
              {workoutCategories.map((category, index) => (
                <button
                  key={index}
                  className="p-3 border border-gray-300 rounded-xl text-left hover:border-orange-500 hover:bg-orange-50 transition-colors"
                >
                  <span className="text-sm font-medium">{category}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Tags</label>
            
            {/* Tag Input */}
            <div className="flex space-x-2 mb-4">
              <div className="flex-1 relative">
                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleTagAdd()}
                  placeholder="Add a tag"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <button
                onClick={handleTagAdd}
                className="bg-orange-500 text-white px-6 py-3 rounded-xl font-medium"
              >
                Add
              </button>
            </div>

            {/* Popular Tags */}
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Popular tags:</p>
              <div className="flex flex-wrap gap-2">
                {popularTags.map((tag, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      if (!tags.includes(tag)) setTags([...tags, tag]);
                    }}
                    className={
                      tags.includes(tag)
                        ? 'px-3 py-1 rounded-full text-sm transition-colors bg-orange-500 text-white'
                        : 'px-3 py-1 rounded-full text-sm transition-colors bg-gray-100 text-gray-600 hover:bg-orange-100'
                    }
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Tags */}
            {tags.length > 0 && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Selected tags:</p>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <div
                      key={index}
                      className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm flex items-center space-x-2"
                    >
                      <span>{tag}</span>
                      <button
                        onClick={() => removeTag(tag)}
                        className="text-white hover:text-orange-200"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white px-6 py-4 border-b border-gray-100 sticky top-0 z-10">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-orange-500">Create</h1>
          <p className="text-gray-600 text-sm">Share your fitness journey</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="space-y-4">
          {/* Text Post */}
          <button
            onClick={() => setPostType('text')}
            className="w-full bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-2xl p-6 text-left hover:from-orange-100 hover:to-orange-200 transition-all duration-200"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                <Type className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">Text Post</h3>
                <p className="text-gray-600">Share your thoughts and motivation</p>
              </div>
            </div>
          </button>
          {/* Photo Post */}
          <button
            onClick={() => setPostType('image')}
            className="w-full bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-6 text-left hover:from-blue-100 hover:to-blue-200 transition-all duration-200"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">Photo Post</h3>
                <p className="text-gray-600">Show off your workout progress</p>
              </div>
            </div>
          </button>
          {/* Video Post */}
          <button
            onClick={() => setPostType('video')}
            className="w-full bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-2xl p-6 text-left hover:from-purple-100 hover:to-purple-200 transition-all duration-200"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                <Video className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">Short Video</h3>
                <p className="text-gray-600">Create engaging workout content</p>
              </div>
            </div>
          </button>
          {/* Buddy Request Post */}
          <button
            onClick={() => setPostType('buddy_request')}
            className="w-full bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-2xl p-6 text-left hover:from-green-100 hover:to-green-200 transition-all duration-200"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">Request a Gym Buddy</h3>
                <p className="text-gray-600">Post a request to find a workout partner</p>
              </div>
            </div>
          </button>
        </div>

        {/* Tips */}
        <div className="mt-8 bg-gray-50 rounded-2xl p-6">
          <h3 className="font-semibold text-gray-900 mb-4">💡 Tips for great content</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Use good lighting for photos and videos</li>
            <li>• Add relevant tags to reach more people</li>
            <li>• Share your workout tips and motivation</li>
            <li>• Engage with your gym buddy community</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CreateTab;
