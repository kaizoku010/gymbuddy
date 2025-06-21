import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ShortCommentsProps {
  postId: string;
}

interface Comment {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
}

const ShortComments: React.FC<ShortCommentsProps> = ({ postId }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchComments = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("comments")
        .select("id, content, user_id, created_at")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });
      if (!error && data) setComments(data);
      setLoading(false);
    };
    fetchComments();
  }, [postId]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("comments")
      .insert({ content: newComment, post_id: postId, user_id: user.id })
      .select();
    if (!error && data && data[0]) {
      setComments((prev) => [...prev, data[0]]);
      setNewComment("");
    }
    setLoading(false);
  };

  return (
    <div className="bg-black bg-opacity-80 rounded-lg p-4 max-h-80 overflow-y-auto">
      <h4 className="text-white font-semibold mb-2">Comments</h4>
      <form onSubmit={handleAddComment} className="flex gap-2 mb-2">
        <input
          className="flex-1 rounded px-2 py-1 text-black"
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          disabled={loading}
        />
        <button type="submit" className="bg-blue-500 text-white px-3 py-1 rounded" disabled={loading}>
          Post
        </button>
      </form>
      <div className="space-y-2">
        {comments.map((c) => (
          <div key={c.id} className="text-white text-sm bg-gray-900 rounded p-2">
            <span>{c.content}</span>
            <span className="block text-xs text-gray-400 mt-1">{new Date(c.created_at).toLocaleString()}</span>
          </div>
        ))}
        {comments.length === 0 && <div className="text-gray-400 text-sm">No comments yet.</div>}
      </div>
    </div>
  );
};

export default ShortComments;
