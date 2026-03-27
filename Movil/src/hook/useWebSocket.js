import { useEffect, useState } from 'react';
import wsService from '../service/websocketService';

const useWebSocket = () => {
  const [status, setStatus] = useState('disconnected');
  const [lastMessage, setLastMessage] = useState(null);

  useEffect(() => {
    const handleEvent = (data) => {
      if (data.type === 'status') {
        setStatus(data.value);
      } else {
        setLastMessage(data);
      }
    };

    wsService.addListener(handleEvent);
    wsService.connect();

    return () => {
      wsService.removeListener(handleEvent);
    };
  }, []);

  const sendMessage = (t, v) => {
    wsService.send({ t, v });
  };

  return { status, lastMessage, sendMessage };
};

export default useWebSocket;
