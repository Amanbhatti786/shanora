export default function Loading() {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#070b14',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px'
      }}
    >
      <div
        style={{
          width: '52px',
          height: '52px',
          borderRadius: '14px',
          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 20px rgba(2, 132, 199, 0.6)'
        }}
      >
        <span
          style={{
            color: '#ffffff',
            fontSize: '1.8rem',
            fontWeight: '900',
            userSelect: 'none'
          }}
        >
          S
        </span>
      </div>

      <p
        style={{
          color: '#94a3b8',
          fontSize: '0.9rem',
          letterSpacing: '0.05em',
          margin: 0
        }}
      >
        Shanora.PK
      </p>
    </div>
  );
      }
