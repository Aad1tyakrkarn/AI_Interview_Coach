import { useState, useCallback } from 'react';

export function useWebSocket(_namespace: string) {
  const [isConnected, setIsConnected] = useState(false);

  // Stub: would connect to WebSocket using socket.io-client
  // useEffect(() => { ... }, [namespace]);

  const emit = useCallback((_event: string, _data?: unknown) => {
    // Stub: would emit event to socket
    console.log('TODO: implement WebSocket emit');
  }, []);

  const on = useCallback((_event: string, _callback: (data: unknown) => void) => {
    // Stub: would listen for socket event
    console.log('TODO: implement WebSocket on');
  }, []);

  return {
    socket: null,
    isConnected,
    emit,
    on,
  };
}
