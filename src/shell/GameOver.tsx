import { useMemo, useState } from 'react';
import { Download, Share2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useI18n } from '../i18n';
import { formatDuration, titleKeyFor } from '../core/score';
import { downloadDataUrl, receiptLines, renderReceiptPng, shareReceipt } from '../core/receipt';
import type { ReceiptEntry } from '../core/receipt';
import { ChunkyButton } from '../components/ChunkyButton';

export interface GameOverProps {
  mode: 'free' | 'daily';
  heading: string;
  entries: ReceiptEntry[];
  totalScore: number;
  bestCombo: number;
  levelReached: number;
  durationMs: number;
  dateKey: string;
  sessionBest: boolean;
  primaryLabel: string;
  onPrimary: () => void;
  onHome: () => void;
}

export function GameOver(props: GameOverProps) {
  const { t } = useI18n();
  const [shared, setShared] = useState(false);

  const dataUrl = useMemo(() => {
    const lines = receiptLines({
      mode: props.mode,
      modeLabel: t(props.mode === 'daily' ? 'receipt.mode.daily' : 'receipt.mode.free'),
      dateKey: props.dateKey,
      entries: props.entries,
      total: props.totalScore,
      totalLabel: t('receipt.total'),
      titleText: t(titleKeyFor(props.totalScore)),
      timeWastedLabel: t('receipt.timeWasted'),
      timeWastedText: formatDuration(props.durationMs),
      thanksText: t('receipt.thanks'),
    });
    return renderReceiptPng(lines, `${props.dateKey}:${props.totalScore}`);
  }, [props, t]);

  const filename = `boredom-receipt-${props.dateKey}.png`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto w-full max-w-md px-4 pb-10 text-center"
    >
      <h2 className="mt-2 font-pixel text-3xl tracking-[-0.04em]">{props.heading}</h2>
      {props.sessionBest && (
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em]">{t('over.sessionBest')}</p>
      )}
      <p className="mt-5 font-mono text-4xl tabular-nums">{props.totalScore}</p>
      <div className="mt-5 grid grid-cols-3 border-y border-ink text-sm">
        {(
          [
            [t('over.combo'), `x${props.bestCombo}`],
            [t('over.level'), String(props.levelReached)],
            [t('over.time'), formatDuration(props.durationMs)],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="border-r border-ink/20 py-3 last:border-r-0">
            <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-soft">{label}</p>
            <p className="mt-1 text-base">{value}</p>
          </div>
        ))}
      </div>
      <img
        src={dataUrl}
        alt="Boredom Receipt"
        className="mx-auto mt-6 w-56 border border-ink"
      />
      <div className="flex flex-wrap justify-center gap-3 mt-6">
        <ChunkyButton color="amber" onClick={() => downloadDataUrl(dataUrl, filename)}>
          <span className="inline-flex items-center gap-2">
            <Download size={18} /> {t('over.download')}
          </span>
        </ChunkyButton>
        <ChunkyButton
          color="pink"
          onClick={() => void shareReceipt(dataUrl, filename, 'ihavenothingtodo').then(setShared)}
        >
          <span className="inline-flex items-center gap-2">
            <Share2 size={18} /> {shared ? '✓' : t('over.share')}
          </span>
        </ChunkyButton>
      </div>
      <div className="flex flex-wrap justify-center gap-3 mt-3">
        <ChunkyButton color="coral" size="lg" onClick={props.onPrimary}>
          {props.primaryLabel}
        </ChunkyButton>
        <ChunkyButton color="ink" onClick={props.onHome}>
          {t('over.home')}
        </ChunkyButton>
      </div>
    </motion.div>
  );
}
