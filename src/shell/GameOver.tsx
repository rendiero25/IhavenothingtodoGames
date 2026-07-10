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
      className="mx-auto w-full max-w-md px-4 pb-10 text-center"
    >
      <h2 className="font-display text-4xl mt-2">{props.heading}</h2>
      {props.sessionBest && (
        <p className="font-display text-teal text-lg mt-1">{t('over.sessionBest')}</p>
      )}
      <p className="font-pixel text-3xl text-coral mt-4">{props.totalScore}</p>
      <div className="grid grid-cols-3 gap-2 mt-5 text-sm">
        {(
          [
            [t('over.combo'), `x${props.bestCombo}`],
            [t('over.level'), String(props.levelReached)],
            [t('over.time'), formatDuration(props.durationMs)],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="rounded-xl border-[3px] border-ink bg-paper py-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink-soft">{label}</p>
            <p className="font-display text-lg">{value}</p>
          </div>
        ))}
      </div>
      <motion.img
        src={dataUrl}
        alt="Boredom Receipt"
        initial={{ rotate: -2 }}
        animate={{ rotate: 2 }}
        transition={{ repeat: Infinity, repeatType: 'reverse', duration: 2.2 }}
        className="mx-auto mt-6 w-56 border-[3px] border-ink shadow-[0_6px_0_0_var(--color-ink)]"
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
