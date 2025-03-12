'use client';

const BouncingBallPage = () => {
  useEffect(() => {
    let count = 0;
    let lastPressTime = 0;
    let timer: ReturnType<typeof setTimeout> | undefined = undefined;

    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault();

        const now = Date.now();
        if (now - lastPressTime > THRESHOLD) {
          count = 1;
        } else {
          count += 1;
        }
        lastPressTime = now;

        clearTimeout(timer);
        timer = setTimeout(() => {
          if (count === 2) {
            // todo: 실행
          } else if (count === 3) {
            // todo: 초기화
          }
        }, THRESHOLD);
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, []);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <div style={{ position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            left: '100px',
            width: '30px',
            height: '30px',
            backgroundColor: 'red',
            borderRadius: '50%',
          }}
        ></div>
        <div
          style={{
            position: 'absolute',
            top: '500px',
            width: '100%',
            borderTop: '1px solid black',
          }}
        ></div>
      </div>
    </div>
  );
};

export default BouncingBallPage;
