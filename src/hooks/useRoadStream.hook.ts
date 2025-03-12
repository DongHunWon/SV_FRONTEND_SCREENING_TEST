import { useEffect, useState, useCallback } from 'react';
import { Road } from '@/types/road-observer.type';

function useRoadStream(isPaused: boolean) {
  const [road, setRoad] = useState<Road | null>(null);

  const updateRoad = useCallback(
    (roadData: Road) => {
      if (!isPaused) {
        setRoad(roadData);
      }
    },
    [isPaused]
  );

  useEffect(() => {
    let eventSource: EventSource;

    const connectSSE = () => {
      eventSource = new EventSource('/api/road');
      eventSource.onmessage = (event) => {
        const roadData = JSON.parse(event.data);
        updateRoad(roadData);
      };

      eventSource.onerror = (error) => {
        console.error('SSE Error:', error);
        eventSource.close();
        setTimeout(connectSSE, 2000);
      };
    };

    connectSSE();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [updateRoad]);

  return { road, setRoad };
}

export default useRoadStream;
