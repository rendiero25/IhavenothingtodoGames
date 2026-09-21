import { describe, expect, it } from 'vitest';
import {
  DICE_KEYS,
  METER_KEYS,
  ORACLE_KEYS,
  PERMIT_KEYS,
  REACTION_KEYS,
  diceKey,
  meterKey,
  oracleKey,
  permitCode,
  permitKey,
  reactionKey,
} from './cabinet';
import { dictionaries } from '../i18n/dict';

describe('Weird Cabinet selectors', () => {
  it('keeps one date and oracle step deterministic', () => {
    expect(oracleKey('2026-09-21', 0)).toBe('weird.oracle.1');
    expect(oracleKey('2026-09-21', 1)).toBe('weird.oracle.3');
    expect(ORACLE_KEYS).toContain(oracleKey('2026-09-21', 2));
  });

  it('keeps dice results local and deterministic per roll', () => {
    expect(diceKey('2026-09-21', 0)).toBe('weird.dice.1');
    expect(diceKey('2026-09-21', 1)).toBe('weird.dice.2');
    expect(DICE_KEYS).toContain(diceKey('2026-09-21', 2));
  });

  it('cycles button reactions from press count', () => {
    expect(reactionKey(0)).toBe('weird.button.0');
    expect(reactionKey(5)).toBe('weird.button.1');
    expect(REACTION_KEYS).toContain(reactionKey(9));
  });

  it('keeps boredom scale inside its six local prompts', () => {
    expect(meterKey(-1)).toBe('weird.meter.0');
    expect(meterKey(3)).toBe('weird.meter.3');
    expect(meterKey(99)).toBe('weird.meter.5');
    expect(METER_KEYS).toContain(meterKey(2));
  });

  it('issues a deterministic fictional permit', () => {
    const date = '2026-09-21';
    const subject = 'menatap tembok';
    expect(PERMIT_KEYS).toContain(permitKey(date, subject, 1));
    expect(permitKey(date, subject, 1)).toBe(permitKey(date, subject, 1));
    expect(permitCode(date, subject, 1)).toMatch(/^GABUT-\d{2}-\d{4}$/);
    expect(permitCode(date, subject, 1)).not.toBe(permitCode(date, subject, 2));
  });

  it('only selects keys with bilingual copy', () => {
    for (const key of [...ORACLE_KEYS, ...DICE_KEYS, ...REACTION_KEYS, ...METER_KEYS, ...PERMIT_KEYS]) {
      expect(dictionaries.id[key as keyof typeof dictionaries.id]).toBeTruthy();
      expect(dictionaries.en[key as keyof typeof dictionaries.en]).toBeTruthy();
    }
  });
});
