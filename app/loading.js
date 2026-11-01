export default function Loading() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#070b14',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '60px 20px 40px 20px',
        zIndex: 99999,
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      {/* Khali space upar balance rakhne ke liye */}
      <div style={{ height: '40px' }}></div>

      {/* Center Facebook Style Branded S-Logo */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 25px rgba(2, 132, 199, 0.4)'
          }}
        >
          <span
            style={{
              color: '#ffffff',
              fontSize: '2.2rem',
              fontWeight: '900',
              lineHeight: 1,
              userSelect: 'none'
            }}
          >
            S
          </span>
        </div>

        {/* Facebook Style 3-Dots Pulse Loading */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
          <span style={dotStyle}></span>
          <span style={{ ...dotStyle, opacity: 0.6 }}></span>
          <span style={{ ...dotStyle, opacity: 0.3 }}></span>
        </div>
      </div>

      {/* Bottom Branding (Bilkul Facebook ki tarha: from Meta) */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px'
        }}
      >
        <span
          style={{
            color: '#64748b',
            fontSize: '0.75rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase'
          }}
        >
          from
        </span>
        <span
          style={{
            color: '#38bdf8',
            fontSize: '1rem',
            fontWeight: '700',
            letterSpacing: '0.08em'
          }}
        >
          SHANORA
        </span>
      </div>
    </div>
  );
}

const dotStyle = {
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  backgroundColor: '#0284c7',
  display: 'inline-block'
};
