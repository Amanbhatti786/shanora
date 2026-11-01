import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
          borderRadius: '96px',
        }}
      >
        <span
          style={{
            fontSize: '320px',
            fontWeight: 900,
            color: '#ffffff',
            fontFamily: 'sans-serif',
            lineHeight: 1,
            marginTop: '-12px',
          }}
        >
          S
        </span>
      </div>
    ),
    {
      width: 512,
      height: 512,
    }
  );
}

