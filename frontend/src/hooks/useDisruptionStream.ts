import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useDisruptionStore } from '../store/disruptionStore';

export function useDisruptionStream() {
  const { token } = useAuthStore();
  const { addDisruption, updateDisruption } = useDisruptionStore();

  useEffect(() => {
    if (!token) return;

    const url = `/api/v1/disruptions/stream?token=${token}`;
    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.status === 'RESOLVED') {
          updateDisruption(data.id, data);
        } else {
          addDisruption(data);
        }
      } catch (e) {
        console.error('Failed to parse disruption SSE', e);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [token, addDisruption, updateDisruption]);
}
