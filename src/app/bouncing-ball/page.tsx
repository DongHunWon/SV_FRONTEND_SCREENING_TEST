'use client';

const BouncingBallPage = () => {
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
