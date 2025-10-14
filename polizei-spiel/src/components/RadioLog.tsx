import React, { useEffect, useRef, useState } from 'react';
// import { getRandomAcknowledgement } from '../constants/radioMessages';

export interface RadioMessage {
  id: number;
  timestamp: string;
  vehicleCallsign?: string;
  message: string;
  type: 'outgoing' | 'incoming' | 'system';
  priority?: 'low' | 'medium' | 'high';
  requiresResponse?: boolean;
  vehicleId?: number;
}

interface RadioLogProps {
  messages: RadioMessage[];
  onRespond?: (messageId: number) => void;
}

const RadioLog: React.FC<RadioLogProps> = ({ messages, onRespond }) => {
  const logRef = useRef<HTMLDivElement>(null);
  const [typingMessage, setTypingMessage] = useState<number | null>(null);

  // Auto-scroll zum neuesten Eintrag
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [messages]);

  // Typing-Effekt für neue Nachrichten
  useEffect(() => {
    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      if (latestMessage.type === 'incoming') {
        setTypingMessage(latestMessage.id);
        setTimeout(() => {
          setTypingMessage(null);
        }, Math.min(latestMessage.message.length * 30, 2000));
      }
    }
  }, [messages]);

  return (
    <div className="radio-log-container">
      <div className="radio-log-messages-minimal" ref={logRef}>
        {messages.length === 0 ? (
          <div className="empty-state-modern">
            <div className="empty-state-icon">📻</div>
            <div className="empty-state-title">Kein Funkverkehr</div>
            <div className="empty-state-subtitle">Funkstille</div>
          </div>
        ) : (
          messages.slice(-5).map((message) => (
            <div key={message.id} className={`radio-msg-minimal ${message.type}`}>
              <span className="radio-time-minimal">{message.timestamp}</span>
              {message.vehicleCallsign && (
                <span className="radio-callsign-minimal">{message.vehicleCallsign}</span>
              )}
              <span className="radio-text-minimal">
                {message.message}
                {typingMessage === message.id && <span className="cursor-blink">|</span>}
              </span>
              {message.requiresResponse && onRespond && (
                <button
                  className="radio-confirm-btn-minimal"
                  onClick={() => onRespond(message.id)}
                  title="J"
                >
                  ✓
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RadioLog;
