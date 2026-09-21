import { hashString } from '../core/rng';

export const ORACLE_KEYS = ['weird.oracle.0', 'weird.oracle.1', 'weird.oracle.2', 'weird.oracle.3'] as const;
export const DICE_KEYS = ['weird.dice.0', 'weird.dice.1', 'weird.dice.2', 'weird.dice.3'] as const;
export const REACTION_KEYS = ['weird.button.0', 'weird.button.1', 'weird.button.2', 'weird.button.3'] as const;
export const METER_KEYS = ['weird.meter.0', 'weird.meter.1', 'weird.meter.2', 'weird.meter.3', 'weird.meter.4', 'weird.meter.5'] as const;
export const PERMIT_KEYS = ['weird.permit.0', 'weird.permit.1', 'weird.permit.2', 'weird.permit.3'] as const;

function seededKey<T extends readonly string[]>(keys: T, value: string): T[number] {
  return keys[hashString(value) % keys.length];
}

export function oracleKey(dateKey: string, step: number) {
  return seededKey(ORACLE_KEYS, `${dateKey}:${step}`);
}

export function diceKey(dateKey: string, roll: number) {
  return seededKey(DICE_KEYS, `${dateKey}:dice:${roll}`);
}

export function reactionKey(presses: number) {
  return REACTION_KEYS[presses % REACTION_KEYS.length];
}

export function meterKey(level: number) {
  return METER_KEYS[Math.max(0, Math.min(METER_KEYS.length - 1, Math.round(level)))];
}

function permitSeed(dateKey: string, subject: string, issue: number) {
  return `${dateKey}:permit:${subject.trim().toLowerCase()}:${issue}`;
}

export function permitKey(dateKey: string, subject: string, issue: number) {
  return seededKey(PERMIT_KEYS, permitSeed(dateKey, subject, issue));
}

export function permitCode(dateKey: string, subject: string, issue: number) {
  return `GABUT-${String(issue).padStart(2, '0')}-${String(hashString(permitSeed(dateKey, subject, issue)) % 10000).padStart(4, '0')}`;
}
