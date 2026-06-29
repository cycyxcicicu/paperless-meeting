import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { Client } from '@stomp/stompjs';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface WebSocketContextType {
  connected: boolean;
  subscribe: (topic: string, callback: (message: any) => void) => () => void;
  send: (destination: string, body: any) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);
  const subscriptionsRef = useRef<{ [topic: string]: Set<(message: any) => void> }>({});
  const [guestToken, setGuestToken] = useState<string | null>(() => {
    const searchParams = new URLSearchParams(window.location.search);
    return searchParams.get('guestToken');
  });

  // Listen to URL changes to update guestToken
  useEffect(() => {
    const handleLocationChange = () => {
      const searchParams = new URLSearchParams(window.location.search);
      const token = searchParams.get('guestToken');
      setGuestToken(token);
    };

    window.addEventListener('popstate', handleLocationChange);
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function(...args) {
      originalPushState.apply(this, args);
      handleLocationChange();
    };

    window.history.replaceState = function(...args) {
      originalReplaceState.apply(this, args);
      handleLocationChange();
    };

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, []);

  useEffect(() => {
    if (!user && !guestToken) {
      if (clientRef.current) {
        clientRef.current.deactivate();
        clientRef.current = null;
        setConnected(false);
      }
      return;
    }

    // Determine WebSocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;

    const stompClient = new Client({
      brokerURL: wsUrl,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log('Connected to WebSocket');
        setConnected(true);

        // 1. Subscribe to personal notifications (only if user is logged in)
        if (user) {
          stompClient.subscribe('/user/queue/notifications', (message) => {
            try {
              const payload = JSON.parse(message.body);
              console.log('Received notification:', payload);

              // Display Toast
              if (payload.message) {
                toast.info(payload.message, {
                  duration: 5000
                });
              }

              // Dispatch global event so page components can react to private notification
              const eventName = `ws:notification:${payload.type}`;
              window.dispatchEvent(new CustomEvent(eventName, { detail: payload }));
              window.dispatchEvent(new CustomEvent('ws:notification:any', { detail: payload }));

            } catch (e) {
              console.error('Failed to parse notification payload', e);
            }
          });
        }

        // 2. Re-establish active page subscriptions
        Object.keys(subscriptionsRef.current).forEach((topic) => {
          stompClient.subscribe(topic, (message) => {
            try {
              const payload = JSON.parse(message.body);
              subscriptionsRef.current[topic].forEach((cb) => cb(payload));
            } catch (e) {
              console.error(`Failed to parse message from topic ${topic}`, e);
            }
          });
        });
      },
      onDisconnect: () => {
        console.log('Disconnected from WebSocket');
        setConnected(false);
      },
      onStompError: (frame) => {
        console.error('STOMP Error:', frame.headers['message'], frame.body);
      }
    });

    stompClient.activate();
    clientRef.current = stompClient;

    return () => {
      stompClient.deactivate();
      setConnected(false);
    };
  }, [user, guestToken]);

  const subscribe = (topic: string, callback: (message: any) => void) => {
    // Save callback to active callbacks set
    if (!subscriptionsRef.current[topic]) {
      subscriptionsRef.current[topic] = new Set();
    }
    subscriptionsRef.current[topic].add(callback);

    let stompSub: any = null;
    if (clientRef.current && clientRef.current.connected) {
      stompSub = clientRef.current.subscribe(topic, (message) => {
        try {
          const payload = JSON.parse(message.body);
          callback(payload);
        } catch (e) {
          console.error(`Failed to parse message from topic ${topic}`, e);
        }
      });
    }

    return () => {
      if (subscriptionsRef.current[topic]) {
        subscriptionsRef.current[topic].delete(callback);
        if (subscriptionsRef.current[topic].size === 0) {
          delete subscriptionsRef.current[topic];
        }
      }
      if (stompSub) {
        stompSub.unsubscribe();
      }
    };
  };

  const send = (destination: string, body: any) => {
    if (clientRef.current && clientRef.current.connected) {
      clientRef.current.publish({
        destination,
        body: JSON.stringify(body)
      });
    } else {
      console.warn('STOMP client not connected, message not sent');
    }
  };

  return (
    <WebSocketContext.Provider value={{ connected, subscribe, send }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
