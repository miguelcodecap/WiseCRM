'use client';
import { compactMoney } from '@/lib/format';
import { STAGE_COLOR, STAGE_PROBABILITY } from '@/lib/metrics';
import { OPEN_STAGES, type Client } from '@/lib/types';

/**
 * The weighted forecast, drawn. Each open stage is a column whose WIDTH is its
 * pipeline value and whose FILLED HEIGHT is its win probability, so the filled
 * area is exactly that stage's contribution to the forecast.
 */
export function ForecastMosaic({ clients, onSelect }: { clients: Client[]; onSelect?: (stage: string) => void }) {
  const stages = OPEN_STAGES.map((stage) => {
    const value = clients.filter((c) => c.status === stage).reduce((a, c) => a + c.value, 0);
    return { stage, value, p: STAGE_PROBABILITY[stage], weighted: value * STAGE_PROBABILITY[stage] };
  }).filter((s) => s.value > 0);

  if (!stages.length) return <div className="mosaic-empty">Add open deals to see your forecast take shape.</div>;

  return (
    <figure className="mosaic" aria-label="Weighted forecast by stage: width is pipeline value, filled height is win probability">
      <div className="mosaic-cols">
        {stages.map((s) => (
          <button
            key={s.stage}
            className="mosaic-col"
            style={{ flexGrow: s.value }}
            onClick={() => onSelect?.(s.stage)}
            title={`${s.stage}: ${compactMoney(s.value)} × ${Math.round(s.p * 100)}% = ${compactMoney(s.weighted)}`}
          >
            <span className="mosaic-top">
              <b>{s.stage}</b>
              <span>
                {compactMoney(s.value)} × {Math.round(s.p * 100)}%
              </span>
            </span>
            <span className="mosaic-box" style={{ borderColor: STAGE_COLOR[s.stage] }}>
              <span className="mosaic-fill" style={{ height: `${s.p * 100}%`, background: STAGE_COLOR[s.stage] }} />
            </span>
            <span className="mosaic-weighted">{compactMoney(s.weighted)}</span>
          </button>
        ))}
      </div>
      <figcaption>
        <span className="key outline" /> pipeline value <span className="key solid" /> odds of closing = weighted forecast
      </figcaption>
    </figure>
  );
}
