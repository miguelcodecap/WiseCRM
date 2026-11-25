/**
 * The WiseCRM owl. Its brow forms a "W"; the pupils glance aside on hover.
 */
export function OwlMark({ size = 36 }: { size?: number }) {
  return (
    <svg className="owl" width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <defs>
        <linearGradient id="owl-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#a78bfa" />
          <stop offset="1" stopColor="#6d28d9" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill="url(#owl-bg)" />
      <path d="M8 10.5 L14 15 Q20 12.5 26 15 L32 10.5 L31 22 Q30 32 20 33 Q10 32 9 22 Z" fill="#fff" />
      <path
        d="M10.5 13.6 L15 16.4 L20 13.4 L25 16.4 L29.5 13.6"
        fill="none"
        stroke="#6d28d9"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="15" cy="21.4" r="4.3" fill="#1e1442" />
      <circle cx="25" cy="21.4" r="4.3" fill="#1e1442" />
      <circle className="owl-pupil" cx="16.2" cy="20.2" r="1.6" fill="#fff" />
      <circle className="owl-pupil" cx="26.2" cy="20.2" r="1.6" fill="#fff" />
      <path d="M18.2 26.2 L20 23.6 L21.8 26.2 Z" fill="#fbbf24" />
    </svg>
  );
}

export function Logo() {
  return (
    <div className="brand">
      <OwlMark />
      <div>
        <b>
          Wise<span>CRM</span>
        </b>
        <small>by WiseSource</small>
      </div>
    </div>
  );
}
