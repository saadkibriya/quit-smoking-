import React from 'react';
import { GlassCard } from '../home/GlassCard';
import {
  FAP_COMMUNITY_CAVEATS,
  FAP_COMMUNITY_TIPS,
  FAP_DOCTOR_TAKE,
  FAP_EVIDENCE_LABEL,
  FAP_RECOVERY_TIMELINE,
  getFapStage,
} from '../../content/fapRecovery';
import { maskDiscreet } from '../../content/discreet';

/**
 * "What happens after you stop" for the porn/fap tracker: the sourced timeline,
 * then the community tactics, then what the evidence will not promise.
 * Rendered on the fap home and inside the fap settings block.
 */
export const FapRecoveryTimeline: React.FC<{ cleanHours: number }> = ({ cleanHours }) => {
  const current = getFapStage(cleanHours);

  return (
    <div className="space-y-2">
      {FAP_RECOVERY_TIMELINE.map((stage) => {
        const reached = cleanHours >= stage.hours;
        const isCurrent = current?.id === stage.id;
        return (
          <GlassCard key={stage.id} padding="p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className="mt-[3px] h-2 w-2 flex-none rounded-full"
                  style={{ background: reached ? 'var(--green)' : 'var(--chip)' }}
                  aria-hidden="true"
                />
                <span
                  className="home-body text-[12px] font-extrabold"
                  style={{ color: 'var(--ink)' }}
                >
                  {stage.timeLabel}
                </span>
              </div>
              <div className="flex flex-none items-center gap-1">
                {isCurrent && (
                  <span
                    className="home-label rounded-full px-2 py-0.5 text-[9px]"
                    style={{ background: 'rgba(34,197,94,0.12)', color: 'var(--green)' }}
                  >
                    You are here
                  </span>
                )}
                <span
                  className="home-label rounded-full px-2 py-0.5 text-[9px]"
                  style={{ background: 'var(--chip)', color: 'var(--muted)' }}
                >
                  {FAP_EVIDENCE_LABEL[stage.evidence]}
                </span>
              </div>
            </div>

            <p className="home-body mt-1.5 text-[12px] leading-snug">
              {maskDiscreet(stage.whatHappens)}
            </p>
            <p
              className="home-body mt-1.5 border-l pl-2 text-[11px] leading-snug"
              style={{ borderColor: 'var(--chip)', color: 'var(--muted)' }}
            >
              <span className="font-extrabold">Doctor: </span>
              {maskDiscreet(stage.doctorNote)}
            </p>
            <span
              className="home-label mt-1.5 block text-[9px]"
              style={{ color: 'var(--muted)', letterSpacing: '0.06em' }}
            >
              {maskDiscreet(stage.source)}
            </span>
          </GlassCard>
        );
      })}
    </div>
  );
};

export const FapCommunityTips: React.FC = () => (
  <div className="space-y-2">
    {FAP_COMMUNITY_TIPS.map((item) => (
      <GlassCard key={item.tip} padding="p-4">
        <div className="flex items-start justify-between gap-2">
          <span className="home-body text-[12px] font-extrabold" style={{ color: 'var(--ink)' }}>
            {maskDiscreet(item.tip)}
          </span>
          <span
            className="home-label flex-none rounded-full px-2 py-0.5 text-[9px]"
            style={{ background: 'var(--chip)', color: 'var(--muted)' }}
          >
            {maskDiscreet(item.source)}
          </span>
        </div>
        <p className="home-body mt-1 text-[12px] leading-snug">{maskDiscreet(item.detail)}</p>
      </GlassCard>
    ))}

    <GlassCard padding="p-4">
      <span className="home-label" style={{ color: 'var(--muted)' }}>
        What the same threads say did not work
      </span>
      <div className="mt-2 space-y-2">
        {FAP_COMMUNITY_CAVEATS.map((caveat) => (
          <div key={caveat.claim}>
            <span className="home-body text-[11px] font-extrabold" style={{ color: 'var(--ink)' }}>
              {maskDiscreet(caveat.claim)}
            </span>
            <p className="home-body text-[11px] leading-snug">{maskDiscreet(caveat.reality)}</p>
            <span className="home-label text-[9px]" style={{ color: 'var(--muted)' }}>
              {maskDiscreet(caveat.source)}
            </span>
          </div>
        ))}
      </div>
    </GlassCard>
  </div>
);

export const FapDoctorTake: React.FC = () => (
  <div className="space-y-2">
    {FAP_DOCTOR_TAKE.map((item) => (
      <GlassCard key={item.title} padding="p-4">
        <span className="home-body text-[12px] font-extrabold" style={{ color: 'var(--ink)' }}>
          {maskDiscreet(item.title)}
        </span>
        <p className="home-body mt-1 text-[12px] leading-snug">{maskDiscreet(item.body)}</p>
      </GlassCard>
    ))}
  </div>
);
