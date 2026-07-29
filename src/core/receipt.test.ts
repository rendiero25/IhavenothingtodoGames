import { describe, expect, it } from 'vitest';
import { receiptLines } from './receipt';
import type { ReceiptData } from './receipt';

const data: ReceiptData = {
  mode: 'free',
  modeLabel: 'MAIN BEBAS',
  dateKey: '2026-07-09',
  entries: [{ name: 'Tap Panic', score: 1234 }],
  total: 1234,
  totalLabel: 'TOTAL',
  titleText: 'Gabut Profesional',
  timeWastedLabel: 'WAKTU TERBUANG',
  timeWastedText: '2:34',
  thanksText: 'TERIMA KASIH SUDAH GABUT DI SINI',
};

describe('receiptLines', () => {
  it('memuat header, entri, total, gelar, tanggal', () => {
    const lines = receiptLines(data);
    const joined = lines.join('\n');
    expect(joined).toContain('IHAVENOTHINGTODO');
    expect(joined).toContain('MAIN BEBAS');
    expect(joined).toContain('Tap Panic');
    expect(joined).toContain('1234');
    expect(joined).toContain('Gabut Profesional');
    expect(joined).toContain('2026-07-09');
    expect(joined).toContain('2:34');
  });
  it('semua baris <= 32 karakter', () => {
    for (const line of receiptLines(data)) expect(line.length).toBeLessThanOrEqual(32);
  });
  it('mode daily memuat semua entri', () => {
    const daily: ReceiptData = {
      ...data,
      mode: 'daily',
      modeLabel: 'DAILY GAUNTLET',
      entries: [
        { name: 'Tap Panic', score: 100 },
        { name: 'Simon', score: 200 },
      ],
      total: 300,
    };
    const joined = receiptLines(daily).join('\n');
    expect(joined).toContain('Simon');
    expect(joined).toContain('300');
  });
});
