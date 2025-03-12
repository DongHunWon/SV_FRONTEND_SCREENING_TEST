'use client';

import { useRouter } from 'next/navigation';

export default function Home() {
  const { push } = useRouter();

  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100vw',
        height: '100vh',
      }}
    >
      <h1>🔥 SV Frontend screening test 🔥</h1>

      <div
        style={{
          display: 'flex',
          gap: '1rem',
        }}
      >
        <button onClick={() => push('/bouncing-ball')}>GO 1</button>
        <button onClick={() => push('/road-observer')}>GO 2</button>
      </div>
    </main>
  );
}
