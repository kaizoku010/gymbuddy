import React, { useState, useEffect, useRef } from 'react';
import { Send, Search, Phone, Video, MoreVertical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRealtime } from '@/hooks/useRealtime';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  read_at?: string;
}

interface ChatUser {
  id: string;
  full_name: string;
  username: string;
  avatar_url?: string;
  last_message?: string;
  last_message_time?: string;
  unread_count?: number;
}

const ChatTab: React.FC = () => {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Real-time subscription for messages
  useRealtime({
    table: 'messages',
    onInsert: (payload) => {
      if (payload.new.sender_id === selectedChat || payload.new.receiver_id === user?.id) {
        fetchMessages(selectedChat!);
        fetchChatUsers();
      }
    },
    onUpdate: (payload) => {
      if (payload.new.sender_id === selectedChat || payload.new.receiver_id === user?.id) {
        fetchMessages(selectedChat!);
      }
    }
  });

  const fetchChatUsers = async () => {
    if (!user) return;

    try {
      setLoading(true);
      // Get all buddy relationships for the current user
      const { data: buddyRelations, error: buddyError } = await supabase
        .from('buddies')
        .select('user_id, buddy_id')
        .or(`user_id.eq.${user.id},buddy_id.eq.${user.id}`);
      
      if (buddyError) throw buddyError;

      const buddyIds = new Set<string>();
      if (buddyRelations) {
        buddyRelations.forEach(rel => {
          if (rel.user_id === user.id) buddyIds.add(rel.buddy_id);
          else if (rel.buddy_id === user.id) buddyIds.add(rel.user_id);
        });
      }

      if (buddyIds.size === 0) {
        setChatUsers([]);
        setLoading(false);
        return;
      }

      // Fetch profiles for all buddies
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .in('id', Array.from(buddyIds));

      if (profilesError) throw profilesError;
      
      const users: ChatUser[] = profiles ? profiles.map(profile => ({
        id: profile.id,
        full_name: profile.full_name || 'Unknown User',
        username: profile.username || 'unknown',
        avatar_url: profile.avatar_url || undefined
      })) : [];

      // Get last messages for each user
      for (const chatUser of users) {
        const { data: lastMessage } = await supabase
          .from('messages')
          .select('content, created_at')
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${chatUser.id}),and(sender_id.eq.${chatUser.id},receiver_id.eq.${user.id})`)
          .order('created_at', { ascending: false })
          .limit(1);

        if (lastMessage && lastMessage.length > 0) {
          chatUser.last_message = lastMessage[0].content;
          chatUser.last_message_time = lastMessage[0].created_at;
        }

        // Get unread count
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('sender_id', chatUser.id)
          .eq('receiver_id', user.id)
          .is('read_at', null);

        chatUser.unread_count = count || 0;
      }

      setChatUsers(users);
    } catch (error) {
      console.error('Error fetching chat users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (otherUserId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);

      // Mark messages as read
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('sender_id', otherUserId)
        .eq('receiver_id', user.id)
        .is('read_at', null);

    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!user || !selectedChat || !newMessage.trim()) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: selectedChat,
          content: newMessage.trim()
        });

      if (error) throw error;

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (user) {
      fetchChatUsers();
    }
  }, [user]);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat);
    }
  }, [selectedChat, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const filteredUsers = chatUsers.filter(user =>
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedUser = chatUsers.find(u => u.id === selectedChat);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Chat List Sidebar */}
      <div className={`w-full lg:w-80 bg-white border-r border-gray-200 flex flex-col ${selectedChat ? 'hidden lg:flex' : 'flex'}`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900 mb-4">Messages</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
        </div>

        {/* Chat List */}
        <ScrollArea className="flex-1">
          {loading ? (
            <div className="p-4 text-center">
              <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <p>No conversations yet</p>
              <p className="text-sm mt-1">Start by adding some buddies!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredUsers.map((chatUser) => (
                <button
                  key={chatUser.id}
                  onClick={() => setSelectedChat(chatUser.id)}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                    selectedChat === chatUser.id ? 'bg-orange-50 border-r-2 border-orange-500' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white font-medium">
                        {chatUser.full_name.charAt(0)}
                      </div>
                      {chatUser.unread_count && chatUser.unread_count > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">
                          {chatUser.unread_count}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900 truncate">{chatUser.full_name}</h3>
                        {chatUser.last_message_time && (
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(chatUser.last_message_time), { addSuffix: true })}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate mt-1">
                        {chatUser.last_message || 'Start a conversation...'}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Chat Window */}
      <div className={`flex-1 flex flex-col ${selectedChat ? 'flex' : 'hidden lg:flex'}`}>
        {selectedChat && selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setSelectedChat(null)}
                  className="lg:hidden text-gray-600 hover:text-gray-800 mr-2"
                >
                  ←
                </button>
                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-medium">
                  {selectedUser.full_name.charAt(0)}
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">{selectedUser.full_name}</h2>
                  <p className="text-sm text-gray-600">@{selectedUser.username}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg">
                  <Phone className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg">
                  <Video className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                        message.sender_id === user?.id
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-200 text-gray-900'
                      }`}
                    >
                      <p>{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.sender_id === user?.id ? 'text-orange-200' : 'text-gray-500'
                      }`}>
                        {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  className="flex-1 border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="bg-orange-500 text-white p-2 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
              <p className="text-gray-600">Choose a buddy to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatTab;
