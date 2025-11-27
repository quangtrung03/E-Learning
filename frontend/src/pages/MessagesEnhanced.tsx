import { useState, useEffect, useRef } from 'react';
import { messageAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useSocket } from '../context/SocketContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Paperclip, Send, Image as ImageIcon, File, Download, X } from 'lucide-react';
import axios from 'axios';

interface Message {
  _id: string;
  content: string;
  sender: {
    _id: string;
    name: string;
    avatar?: string;
  };
  type?: string;
  fileUrl?: string;
  fileName?: string;
  createdAt: Date;
  isRead: boolean;
}

interface Conversation {
  _id: string;
  participants: Array<{
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  }>;
  lastMessage?: Message;
  lastMessageAt: Date;
  unreadCount: Map<string, number>;
}

const Messages = () => {
  const { user } = useAuth();
  const toast = useToast();
  const { socket, isConnected, onlineUsers } = useSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation._id);
      markAsRead(selectedConversation._id);
      
      // Join conversation room for real-time updates
      if (socket) {
        socket.emit('conversation:join', selectedConversation._id);
      }
    }

    return () => {
      if (selectedConversation && socket) {
        socket.emit('conversation:leave', selectedConversation._id);
      }
    };
  }, [selectedConversation, socket]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Listen for new messages
    socket.on('message:received', (data) => {
      const { message, conversationId } = data;
      
      if (selectedConversation?._id === conversationId) {
        setMessages(prev => [...prev, message]);
        scrollToBottom();
      }
      
      // Update conversation list
      setConversations(prev =>
        prev.map(conv =>
          conv._id === conversationId
            ? { ...conv, lastMessage: message, lastMessageAt: new Date() }
            : conv
        )
      );
    });

    // Listen for typing indicators
    socket.on('user:typing', ({ conversationId, userId, userName, isTyping }) => {
      if (selectedConversation?._id === conversationId && userId !== user?._id) {
        setTypingUsers(prev => {
          const updated = new Set(prev);
          if (isTyping) {
            updated.add(userName || userId);
          } else {
            updated.delete(userName || userId);
          }
          return updated;
        });
      }
    });

    return () => {
      socket.off('message:received');
      socket.off('user:typing');
    };
  }, [socket, selectedConversation, user]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await messageAPI.getConversations();
      if (response.data.success) {
        setConversations(response.data.data.conversations || []);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.showToast({ type: 'error', title: 'Không thể tải danh sách tin nhắn' });
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      setMessagesLoading(true);
      const response = await messageAPI.getMessages(conversationId, { limit: 100 });
      if (response.data.success) {
        setMessages(response.data.data.messages || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setMessagesLoading(false);
    }
  };

  const markAsRead = async (conversationId: string) => {
    try {
      await messageAPI.markAsRead(conversationId);
      setConversations(prev =>
        prev.map(conv =>
          conv._id === conversationId
            ? { ...conv, unreadCount: new Map() }
            : conv
        )
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleTyping = () => {
    if (!socket || !selectedConversation) return;

    socket.emit('typing:start', {
      conversationId: selectedConversation._id,
      userId: user?._id,
      userName: user?.name
    });

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing:stop', {
        conversationId: selectedConversation._id,
        userId: user?._id
      });
    }, 2000);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.showToast({ type: 'error', title: 'File quá lớn. Giới hạn 10MB' });
      return;
    }

    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const handleUploadFile = async (): Promise<{ fileUrl: string; fileName: string; fileType: string } | null> => {
    if (!selectedFile) return null;

    try {
      setUploadingFile(true);
      const formData = new FormData();
      formData.append('file', selectedFile);

      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/messages/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          },
          onUploadProgress: (progressEvent) => {
            const progress = progressEvent.total
              ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
              : 0;
            setUploadProgress(progress);
          }
        }
      );

      if (response.data.success) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.showToast({ type: 'error', title: 'Không thể tải file lên' });
      return null;
    } finally {
      setUploadingFile(false);
      setUploadProgress(0);
    }
  };

  const handleSendMessage = async () => {
    if ((!messageInput.trim() && !selectedFile) || !selectedConversation) return;

    try {
      setSending(true);

      let fileData = null;
      if (selectedFile) {
        fileData = await handleUploadFile();
        if (!fileData) {
          setSending(false);
          return;
        }
      }

      const messageData = {
        content: messageInput.trim() || `[File: ${fileData?.fileName}]`,
        type: fileData?.fileType || 'text',
        fileUrl: fileData?.fileUrl,
        fileName: fileData?.fileName
      };

      const response = await messageAPI.sendMessage(selectedConversation._id, messageData.content, messageData.type);
      
      if (response.data.success) {
        const newMessage = response.data.data.message;
        setMessages(prev => [...prev, newMessage]);
        setMessageInput('');
        setSelectedFile(null);
        setFilePreview(null);
        
        // Emit socket event
        if (socket) {
          socket.emit('message:send', {
            conversationId: selectedConversation._id,
            message: newMessage
          });
        }
        
        // Update conversation list
        setConversations(prev =>
          prev.map(conv =>
            conv._id === selectedConversation._id
              ? { ...conv, lastMessage: newMessage, lastMessageAt: new Date() }
              : conv
          )
        );

        scrollToBottom();
      }
    } catch (error: any) {
      toast.showToast({ type: 'error', title: error.response?.data?.message || 'Không thể gửi tin nhắn' });
    } finally {
      setSending(false);
    }
  };

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find(p => p._id !== user?._id);
  };

  const getUnreadCount = (conversation: Conversation) => {
    return conversation.unreadCount?.get?.(user?._id || '') || 0;
  };

  const isUserOnline = (userId: string) => {
    return onlineUsers.has(userId);
  };

  const renderMessage = (message: Message) => {
    const isOwn = message.sender._id === user?._id;
    const hasFile = message.type !== 'text' && message.fileUrl;

    return (
      <div key={message._id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
        <div className={`flex gap-2 max-w-[70%] ${isOwn ? 'flex-row-reverse' : ''}`}>
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-gray-600 text-sm">
              {message.sender.name?.charAt(0) || 'U'}
            </span>
          </div>
          <div>
            <div
              className={`rounded-lg px-4 py-2 ${
                isOwn
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-900'
              }`}
            >
              {hasFile && message.type === 'image' && (
                <img
                  src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${message.fileUrl}`}
                  alt={message.fileName}
                  className="max-w-full rounded mb-2 max-h-64 object-cover"
                />
              )}
              {hasFile && message.type === 'file' && (
                <a
                  href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${message.fileUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 mb-2 ${isOwn ? 'text-white' : 'text-primary-600'}`}
                >
                  <File className="w-4 h-4" />
                  <span className="text-sm underline">{message.fileName}</span>
                  <Download className="w-4 h-4" />
                </a>
              )}
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
            </div>
            <p className={`text-xs text-gray-500 mt-1 ${isOwn ? 'text-right' : ''}`}>
              {new Date(message.createdAt).toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải tin nhắn...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-custom py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">💬 Tin nhắn</h1>
            {isConnected && (
              <p className="text-sm text-green-600 mt-1">● Online - Thời gian thực</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <Card className="lg:col-span-1 p-4 overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Cuộc trò chuyện</h2>
            
            {conversations.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl text-gray-300 mb-4">💬</div>
                <p className="text-gray-600">Chưa có cuộc trò chuyện nào</p>
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.map((conversation) => {
                  const otherUser = getOtherParticipant(conversation);
                  const unreadCount = getUnreadCount(conversation);
                  const online = isUserOnline(otherUser?._id || '');

                  return (
                    <div
                      key={conversation._id}
                      onClick={() => setSelectedConversation(conversation)}
                      className={`p-3 rounded-lg cursor-pointer transition-all ${
                        selectedConversation?._id === conversation._id
                          ? 'bg-primary-50 border-2 border-primary-500'
                          : 'bg-white border-2 border-transparent hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative">
                          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-primary-600 font-semibold text-lg">
                              {otherUser?.name?.charAt(0) || 'U'}
                            </span>
                          </div>
                          {online && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {otherUser?.name || 'Người dùng'}
                            </h3>
                            {unreadCount > 0 && (
                              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 ml-2">
                                {unreadCount}
                              </span>
                            )}
                          </div>
                          {conversation.lastMessage && (
                            <p className="text-sm text-gray-600 truncate">
                              {conversation.lastMessage.content}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(conversation.lastMessageAt).toLocaleString('vi-VN')}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Messages Area */}
          <Card className="lg:col-span-2 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-primary-600 font-semibold">
                          {getOtherParticipant(selectedConversation)?.name?.charAt(0) || 'U'}
                        </span>
                      </div>
                      {isUserOnline(getOtherParticipant(selectedConversation)?._id || '') && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {getOtherParticipant(selectedConversation)?.name || 'Người dùng'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {isUserOnline(getOtherParticipant(selectedConversation)?._id || '') ? (
                          <span className="text-green-600">● Đang hoạt động</span>
                        ) : (
                          getOtherParticipant(selectedConversation)?.email
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messagesLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-600">Chưa có tin nhắn nào</p>
                      <p className="text-sm text-gray-500 mt-2">Hãy bắt đầu cuộc trò chuyện!</p>
                    </div>
                  ) : (
                    <>
                      {messages.map(renderMessage)}
                      {typingUsers.size > 0 && (
                        <div className="flex gap-2 items-center text-sm text-gray-500 italic">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                          </div>
                          <span>{Array.from(typingUsers)[0]} đang nhập...</span>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {/* File Preview */}
                {selectedFile && (
                  <div className="px-4 py-2 bg-gray-100 border-t border-gray-200">
                    <div className="flex items-center gap-3">
                      {filePreview ? (
                        <img src={filePreview} alt="Preview" className="w-16 h-16 object-cover rounded" />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                          <File className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{selectedFile.name}</p>
                        <p className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                        {uploadProgress > 0 && (
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                            <div className="bg-primary-600 h-1.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setSelectedFile(null);
                          setFilePreview(null);
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200">
                  <div className="flex gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={sending || uploadingFile}
                      className="p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Đính kèm file"
                    >
                      {selectedFile ? <ImageIcon className="w-5 h-5" /> : <Paperclip className="w-5 h-5" />}
                    </button>
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => {
                        setMessageInput(e.target.value);
                        handleTyping();
                      }}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                      placeholder="Nhập tin nhắn..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      disabled={sending || uploadingFile}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={sending || uploadingFile || (!messageInput.trim() && !selectedFile)}
                    >
                      {sending || uploadingFile ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <Send className="w-5 h-5 mr-1" />
                          Gửi
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center p-12">
                <div>
                  <div className="text-6xl text-gray-300 mb-4">💬</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Chọn một cuộc trò chuyện
                  </h3>
                  <p className="text-gray-600">
                    Chọn một cuộc trò chuyện từ danh sách bên trái để bắt đầu nhắn tin
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Messages;
