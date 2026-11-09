import { forwardRef } from 'react'
import type { TeacherSettings } from '../data/types'
import type { Badge } from '../lib/progress'
import { CERT_H, CERT_W, formatDateMs, nameFontSize } from '../lib/certificate'

export interface CertificateData {
  name: string
  className: string
  xp: number
  maxXp: number
  mastery: number
  completedAt: string
  badge: Badge
}

const BADGE_COLORS: Record<Badge['id'], [string, string, string]> = {
  emas: ['#fff3c4', '#f5c542', '#a87a0f'],
  perak: ['#ffffff', '#c9d1e3', '#7d879e'],
  gangsa: ['#ffd9b8', '#cd8a4f', '#7a4a22'],
}

function Star({ x, y, s, c = '#f5c542' }: { x: number; y: number; s: number; c?: string }) {
  return (
    <path
      transform={`translate(${x} ${y}) scale(${s})`}
      d="M0-10l2.9 6.6 7.1.6-5.4 4.7 1.6 7.1L0 5.2l-6.2 3.8 1.6-7.1L-10-2.8l7.1-.6z"
      fill={c}
    />
  )
}

/** Sijil direka pada 1123×794 px (A4 landskap @96dpi). Dieksport ke PNG 3508×2480 & PDF A4. */
export const Certificate = forwardRef<HTMLDivElement, { data: CertificateData; settings: TeacherSettings }>(function Certificate(
  { data, settings },
  ref,
) {
  const [c1, c2, c3] = BADGE_COLORS[data.badge.id]
  return (
    <div
      ref={ref}
      data-testid="certificate"
      style={{
        width: CERT_W,
        height: CERT_H,
        position: 'relative',
        overflow: 'hidden',
        background: 'radial-gradient(ellipse at 50% 0%, #fffdf5 0%, #fbf5e2 60%, #f3e8c6 100%)',
        fontFamily: "'Nunito', sans-serif",
        color: '#1b1640',
      }}
    >
      {/* Bingkai */}
      <svg width={CERT_W} height={CERT_H} style={{ position: 'absolute', inset: 0 }} aria-hidden>
        <defs>
          <linearGradient id="frame" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1d3a8a" />
            <stop offset="50%" stopColor="#3b1e78" />
            <stop offset="100%" stopColor="#1d3a8a" />
          </linearGradient>
          <linearGradient id="goldline" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#c9971c" />
            <stop offset="50%" stopColor="#ffe28a" />
            <stop offset="100%" stopColor="#c9971c" />
          </linearGradient>
        </defs>
        <rect x="14" y="14" width={CERT_W - 28} height={CERT_H - 28} fill="none" stroke="url(#frame)" strokeWidth="14" rx="10" />
        <rect x="34" y="34" width={CERT_W - 68} height={CERT_H - 68} fill="none" stroke="url(#goldline)" strokeWidth="3" rx="6" />
        <rect x="42" y="42" width={CERT_W - 84} height={CERT_H - 84} fill="none" stroke="#c9971c" strokeOpacity="0.5" strokeWidth="1" rx="4" />
        {/* bucu bintang */}
        {[
          [62, 62],
          [CERT_W - 62, 62],
          [62, CERT_H - 62],
          [CERT_W - 62, CERT_H - 62],
        ].map(([x, y]) => (
          <g key={`${x}-${y}`}>
            <circle cx={x} cy={y} r="16" fill="#1d3a8a" />
            <Star x={x} y={y} s={1.2} />
          </g>
        ))}
        {/* buruj hiasan */}
        <g opacity="0.18" stroke="#3b1e78" strokeWidth="1.2" fill="none">
          <polyline points="90,600 140,560 190,610 240,575 280,630" />
          <polyline points={`${CERT_W - 90},600 ${CERT_W - 140},560 ${CERT_W - 190},610 ${CERT_W - 240},575 ${CERT_W - 280},630`} />
        </g>
        {[
          [90, 600], [140, 560], [190, 610], [240, 575], [280, 630],
          [CERT_W - 90, 600], [CERT_W - 140, 560], [CERT_W - 190, 610], [CERT_W - 240, 575], [CERT_W - 280, 630],
        ].map(([x, y]) => (
          <Star key={`s${x}-${y}`} x={x} y={y} s={0.55} c="#c9971c" />
        ))}
      </svg>

      <div
        style={{
          position: 'absolute',
          inset: '70px 90px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        {settings.schoolLogo ? (
          <img src={settings.schoolLogo} alt="" style={{ height: 64, width: 64, objectFit: 'contain', marginBottom: 4 }} />
        ) : null}
        <div style={{ fontFamily: "'Cinzel', serif", fontWeight: 800, fontSize: 26, letterSpacing: 6, color: '#1d3a8a' }} data-testid="cert-school">
          {settings.schoolName}
        </div>
        <div style={{ fontFamily: "'Cinzel', serif", fontWeight: 600, fontSize: 20, letterSpacing: 4, color: '#3b1e78', marginTop: 6 }}>
          {settings.certificate.title}
        </div>
        <div
          style={{
            fontFamily: "'Cinzel', serif",
            fontWeight: 800,
            fontSize: 40,
            marginTop: 8,
            color: '#a87a0f',
            textShadow: '0 1px 0 #ffe28a',
            letterSpacing: 2,
          }}
        >
          {settings.certificate.award}
        </div>
        <div style={{ width: 360, height: 2, background: 'linear-gradient(90deg,transparent,#c9971c,transparent)', margin: '10px 0 12px' }} />
        <div style={{ fontSize: 17, color: '#4a4470' }}>Dengan ini disahkan bahawa</div>
        <div
          data-testid="cert-name"
          style={{
            fontFamily: "'Cinzel', serif",
            fontWeight: 800,
            fontSize: nameFontSize(data.name),
            lineHeight: 1.15,
            color: '#1b1640',
            margin: '8px 0 2px',
            maxWidth: 900,
            wordBreak: 'break-word',
          }}
        >
          {data.name}
        </div>
        <div style={{ fontSize: 19, fontWeight: 700, color: '#3b1e78' }} data-testid="cert-class">
          Kelas: {data.className}
        </div>
        <div style={{ fontSize: 16, color: '#4a4470', marginTop: 10, maxWidth: 760 }}>
          telah berjaya menamatkan permainan <strong>Galaksi Selawat: Misi Tahiyat Akhir</strong> (Pendidikan Islam Tahun 4) dengan
          melengkapkan kesemua 34 cabaran bacaan tahiyat akhir.
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 40, marginTop: 18 }}>
          <div style={{ textAlign: 'center', minWidth: 170 }}>
            <div style={{ fontSize: 13, letterSpacing: 2, color: '#6b6690' }}>MARKAH</div>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 34, fontWeight: 800, color: '#1d3a8a' }} data-testid="cert-xp">
              {data.xp} / {data.maxXp}
            </div>
          </div>
          {/* Lencana */}
          <svg width="120" height="130" viewBox="0 0 120 130" aria-label={data.badge.label}>
            <defs>
              <radialGradient id="medal" cx="40%" cy="35%" r="70%">
                <stop offset="0%" stopColor={c1} />
                <stop offset="60%" stopColor={c2} />
                <stop offset="100%" stopColor={c3} />
              </radialGradient>
            </defs>
            <path d="M38 78 L24 128 L44 118 L54 130 L60 84Z" fill="#1d3a8a" />
            <path d="M82 78 L96 128 L76 118 L66 130 L60 84Z" fill="#3b1e78" />
            <circle cx="60" cy="58" r="48" fill="url(#medal)" stroke={c3} strokeWidth="3" />
            <circle cx="60" cy="58" r="38" fill="none" stroke="#fff" strokeOpacity="0.7" strokeWidth="1.5" strokeDasharray="3 3" />
            <Star x={60} y={58} s={2.6} c="#fff" />
            <Star x={60} y={58} s={2.0} c={c3} />
          </svg>
          <div style={{ textAlign: 'center', minWidth: 170 }}>
            <div style={{ fontSize: 13, letterSpacing: 2, color: '#6b6690' }}>PENGUASAAN</div>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 34, fontWeight: 800, color: '#1d3a8a' }} data-testid="cert-mastery">
              {data.mastery}%
            </div>
          </div>
        </div>
        <div style={{ fontSize: 15, fontWeight: 800, color: c3 === '#a87a0f' ? '#8a6510' : c3, marginTop: 2 }} data-testid="cert-badge">
          {data.badge.label}
        </div>

        <div style={{ marginTop: 'auto', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ textAlign: 'left', fontSize: 14, color: '#4a4470' }}>
            <div style={{ fontSize: 12, letterSpacing: 2, color: '#6b6690' }}>TARIKH TAMAT</div>
            <div style={{ fontWeight: 800, fontSize: 17, color: '#1b1640' }} data-testid="cert-date">
              {formatDateMs(data.completedAt)}
            </div>
          </div>
          <div style={{ fontSize: 12, color: '#6b6690', maxWidth: 300 }}>Galaksi Selawat · Misi Tahiyat Akhir</div>
          <div style={{ textAlign: 'center', fontSize: 14, color: '#4a4470', minWidth: 220 }}>
            <div style={{ borderTop: '1.5px solid #1b1640', paddingTop: 4, fontWeight: 800, color: '#1b1640' }}>
              {settings.certificate.signatureName}
            </div>
            <div style={{ fontSize: 12 }}>{settings.certificate.signatureRole}</div>
          </div>
        </div>
      </div>
    </div>
  )
})
