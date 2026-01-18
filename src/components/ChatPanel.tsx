import React, { useEffect, useState, useRef } from 'react'
import {
  Send,
  User as UserIcon,
  MessageCircle,
  ChevronDown,
} from 'lucide-react'
import { ChatMessage } from '../utils/types'
interface ChatPanelProps {
  messages: ChatMessage[]
  onSendMessage: (text: string) => void
  username: string
  unreadCount: number
  onClearUnread: () => void
  isMobile?: boolean
}
export function ChatPanel({
  messages,
  onSendMessage,
  username,
  unreadCount,
  onClearUnread,
  isMobile = false,
}: ChatPanelProps) {
  const [input, setInput] = useState('')
  const [isExpanded, setIsExpanded] = useState(!isMobile)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const lastMessageRef = useRef<ChatMessage | null>(null)
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    })
  }
  useEffect(() => {
    if (isExpanded) {
      scrollToBottom()
      onClearUnread()
    }
  }, [messages, isExpanded])
  // Show floating preview for new messages on mobile
  useEffect(() => {
    if (isMobile && !isExpanded && messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage !== lastMessageRef.current && !lastMessage.isSystem) {
        lastMessageRef.current = lastMessage
      }
    }
  }, [messages, isMobile, isExpanded])
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    onSendMessage(input)
    setInput('')
  }
  const handleExpand = () => {
    setIsExpanded(true)
    onClearUnread()
  }
  // Mobile: Floating button + bottom sheet
  if (isMobile) {
    return (
      <>
        {/* Floating chat button - ALWAYS visible on mobile */}
        {!isExpanded && (
          <button
            onClick={handleExpand}
            className="fixed bottom-4 right-4 z-50 bg-violet-600 text-white rounded-full p-4 shadow-2xl hover:bg-violet-700 transition-all active:scale-95"
          >
            <div className="relative">
              <MessageCircle size={24} />
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse">
                  {unreadCount}
                </span>
              )}
            </div>
          </button>
        )}

        {/* Bottom sheet */}
        <div
          className={`
            fixed inset-x-0 bottom-0 z-40 bg-zinc-900 border-t border-zinc-800 
            transition-transform duration-300 ease-out
            ${isExpanded ? 'translate-y-0' : 'translate-y-full'}
          `}
          style={{
            height: '60vh',
          }}
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-zinc-800 bg-zinc-900/95 backdrop-blur-sm flex items-center justify-between">
              <h2 className="font-semibold text-zinc-100 flex items-center gap-2">
                <MessageCircle size={18} />
                Chat
              </h2>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <ChevronDown size={20} className="text-zinc-400" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-zinc-500 py-8 text-sm">
                  No messages yet. Say hello!
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.isSystem ? 'items-center' : 'items-start'}`}
                >
                  {msg.isSystem ? (
                    <span className="text-xs text-zinc-500 bg-zinc-800/50 px-2 py-1 rounded-full">
                      {msg.text}
                    </span>
                  ) : (
                    <div className="flex gap-3 max-w-[90%]">
                      <div
                        className={`
                          w-8 h-8 rounded-full flex items-center justify-center shrink-0
                          ${msg.username === username ? 'bg-violet-500/20 text-violet-400' : 'bg-zinc-800 text-zinc-400'}
                        `}
                      >
                        <UserIcon size={14} />
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-baseline gap-2 mb-0.5">
                          <span
                            className={`text-xs font-medium ${msg.username === username ? 'text-violet-400' : 'text-zinc-300'}`}
                          >
                            {msg.username}
                          </span>
                          <span className="text-[10px] text-zinc-600">
                            {new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <div className="text-sm text-zinc-200 bg-zinc-800/50 px-3 py-2 rounded-r-lg rounded-bl-lg">
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={handleSubmit}
              className="p-4 border-t border-zinc-800 bg-zinc-900"
            >
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message..."
                  className="w-full bg-zinc-800 text-zinc-100 rounded-full pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="absolute right-1.5 top-1.5 p-1.5 bg-violet-600 text-white rounded-full hover:bg-violet-700 disabled:opacity-50 disabled:hover:bg-violet-600 transition-colors"
                >
                  <Send size={16} />
                </button>
              </div>
            </form>
          </div>
        </div>
      </>
    )
  }
  // Desktop: Side panel with notification badge
  return (
    <div className="flex flex-col h-full bg-zinc-900 border-l border-zinc-800">
      <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
        <h2 className="font-semibold text-zinc-100 flex items-center gap-2">
          <div className="relative">
            <MessageCircle size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                {unreadCount}
              </span>
            )}
          </div>
          Chat
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
        {messages.length === 0 && (
          <div className="text-center text-zinc-500 py-8 text-sm">
            No messages yet. Say hello!
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.isSystem ? 'items-center' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
          >
            {msg.isSystem ? (
              <span className="text-xs text-zinc-500 bg-zinc-800/50 px-2 py-1 rounded-full my-2">
                {msg.text}
              </span>
            ) : (
              <div className="flex gap-3 max-w-[90%]">
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center shrink-0
                    ${msg.username === username ? 'bg-violet-500/20 text-violet-400' : 'bg-zinc-800 text-zinc-400'}
                  `}
                >
                  <UserIcon size={14} />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span
                      className={`text-xs font-medium ${msg.username === username ? 'text-violet-400' : 'text-zinc-300'}`}
                    >
                      {msg.username}
                    </span>
                    <span className="text-[10px] text-zinc-600">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="text-sm text-zinc-200 bg-zinc-800/50 px-3 py-2 rounded-r-lg rounded-bl-lg">
                    {msg.text}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="p-4 border-t border-zinc-800 bg-zinc-900"
      >
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="w-full bg-zinc-800 text-zinc-100 rounded-full pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="absolute right-1.5 top-1.5 p-1.5 bg-violet-600 text-white rounded-full hover:bg-violet-700 disabled:opacity-50 disabled:hover:bg-violet-600 transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  )
}
