import { useEffect, useRef, useState } from 'react';
import { Header } from '../components/Header';
import { useI18n } from '../i18n';
import type { DictKey } from '../i18n/dict';
import { getSeoPage } from '../seo/pages';
import { usePageSeo } from '../seo/usePageSeo';
import type { TownSettings } from '../town/scene';
import type { TravelKey } from '../town/scene';
import type { Landmark } from '../town/world';
import type { EventPhase } from '../town/simulation';
import '../styles/city.css';

type SceneHandle = {
  updateSettings: (settings: TownSettings) => void;
  destroy: () => void;
  resetCamera?: () => void;
  rotateCamera?: (azimuth: number, elevation: number) => void;
  zoomCamera?: (factor: number) => void;
  moveCamera: (forward: number, right: number, distance?: number) => void;
  setTravelKey: (key: TravelKey, pressed: boolean) => void;
  focusLandmark: (name: Landmark) => void;
  seekEvent: (age: number) => void;
  repairCity: () => void;
};

type Choice<T extends string> = { value: T; label: DictKey };

const weatherChoices: Choice<TownSettings['weather']>[] = [
  { value: 'clear', label: 'town.weather.clear' },
  { value: 'cloudy', label: 'town.weather.cloudy' },
  { value: 'rain', label: 'town.weather.rain' },
  { value: 'storm', label: 'town.weather.storm' },
  { value: 'lightning', label: 'town.weather.lightning' },
  { value: 'snow', label: 'town.weather.snow' },
  { value: 'fog', label: 'town.weather.fog' },
  { value: 'heat', label: 'town.weather.heat' },
  { value: 'blizzard', label: 'town.weather.blizzard' },
];

const disasterChoices: Choice<TownSettings['disaster']>[] = [
  { value: 'none', label: 'town.disaster.none' },
  { value: 'flood', label: 'town.disaster.flood' },
  { value: 'earthquake', label: 'town.disaster.earthquake' },
  { value: 'wildfire', label: 'town.disaster.wildfire' },
  { value: 'tsunami', label: 'town.disaster.tsunami' },
  { value: 'tornado', label: 'town.disaster.tornado' },
  { value: 'hailstorm', label: 'town.disaster.hailstorm' },
  { value: 'landslide', label: 'town.disaster.landslide' },
  { value: 'drought', label: 'town.disaster.drought' },
];

const landmarks: Choice<Landmark>[] = [
  { value: 'downtown', label: 'town.explore.downtown' },
  { value: 'river', label: 'town.explore.river' },
  { value: 'beach', label: 'town.explore.beach' },
  { value: 'station', label: 'town.explore.station' },
  { value: 'park', label: 'town.explore.park' },
  { value: 'hills', label: 'town.explore.hills' },
];

const travelButtons: Array<{ key: TravelKey; label: DictKey; forward: number; right: number }> = [
  { key: 'w', label: 'town.moveForward', forward: 1, right: 0 },
  { key: 'a', label: 'town.moveLeft', forward: 0, right: -1 },
  { key: 's', label: 'town.moveBack', forward: -1, right: 0 },
  { key: 'd', label: 'town.moveRight', forward: 0, right: 1 },
];

const seasonChoices: Choice<TownSettings['season']>[] = [
  { value: 'spring', label: 'town.season.spring' },
  { value: 'summer', label: 'town.season.summer' },
  { value: 'autumn', label: 'town.season.autumn' },
  { value: 'winter', label: 'town.season.winter' },
];

const climateChoices: Choice<TownSettings['climate']>[] = [
  { value: 'temperate', label: 'town.climate.temperate' },
  { value: 'tropical', label: 'town.climate.tropical' },
  { value: 'arid', label: 'town.climate.arid' },
];

const initialSettings: TownSettings = {
  weather: 'clear',
  disaster: 'none',
  season: 'summer',
  climate: 'temperate',
  hour: 16,
  playing: true,
  speed: 1,
};

function hourLabel(hour: number) {
  const totalMinutes = Math.round(hour * 60);
  return `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`;
}

function ChoiceGroup<T extends string>({
  title,
  choices,
  value,
  onChange,
  t,
}: {
  title: string;
  choices: Choice<T>[];
  value: T;
  onChange: (value: T) => void;
  t: (key: DictKey) => string;
}) {
  return (
    <fieldset className="city-choice-group">
      <legend className="city-control-label">{title}</legend>
      <div className="city-choice-list">
        {choices.map((choice) => (
          <button
            key={choice.value}
            type="button"
            aria-pressed={value === choice.value}
            className="city-choice"
            onClick={() => onChange(choice.value)}
          >
            {t(choice.label)}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export default function City() {
  const { locale, t } = useI18n();
  usePageSeo(getSeoPage('/city'), locale);
  const [settings, setSettings] = useState<TownSettings>(() => ({
    ...initialSettings,
    playing: !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  }));
  const [controlsOpen, setControlsOpen] = useState(false);
  const [hasDamage, setHasDamage] = useState(false);
  const [eventPhase, setEventPhase] = useState<EventPhase>('calm');
  const [sceneState, setSceneState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [viewportHeight, setViewportHeight] = useState(() => window.innerHeight);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<SceneHandle | null>(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    const resize = () => setViewportHeight(window.innerHeight);
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    let cancelled = false;
    import('../town/scene').then(({ createTownScene }) => {
      if (cancelled || !canvasRef.current) return;
      try {
        const scene = createTownScene(canvasRef.current, settingsRef.current, setEventPhase);
        if (cancelled) {
          scene.destroy();
          return;
        }
        sceneRef.current = scene;
        setSceneState('ready');
      } catch {
        setSceneState('error');
      }
    }).catch(() => {
      if (!cancelled) setSceneState('error');
    });
    return () => {
      cancelled = true;
      sceneRef.current?.destroy();
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    sceneRef.current?.updateSettings(settings);
  }, [settings]);

  useEffect(() => {
    if (!settings.playing) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      setSettings((current) => ({ ...current, hour: (current.hour + 0.25) % 24 }));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [settings.playing]);

  useEffect(() => {
    if (!controlsOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setControlsOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [controlsOpen]);

  const activityKey: DictKey = hasDamage && (settings.disaster === 'none' || eventPhase === 'aftermath')
    ? 'town.activity.recovery'
    : settings.disaster !== 'none'
    ? 'town.activity.shelter'
    : ['rain', 'storm', 'snow', 'heat', 'blizzard'].includes(settings.weather)
      ? 'town.activity.weather'
      : settings.hour >= 6 && settings.hour < 21
        ? 'town.activity.busy'
        : 'town.activity.quiet';

  return (
    <div className="flex flex-col overflow-x-hidden bg-paper text-ink">
      <Header wide />
      <main className="city-stage" data-night={Math.max(0, Math.sin((settings.hour - 5.5) / 13 * Math.PI)) <= .15} style={{ height: Math.max(510, viewportHeight - 57) }} aria-label={t('town.eyebrow')}>
        <canvas ref={canvasRef} className="city-canvas" tabIndex={0} role="img" aria-label={t('town.viewport')} aria-describedby="city-navigation-hint" />
        <div className="city-tilt city-tilt-top" aria-hidden="true" />
        <div className="city-tilt city-tilt-bottom" aria-hidden="true" />

        <div className="city-intro">
          <p className="city-kicker">{t('town.eyebrow')}</p>
          <h1>{t('town.title')}</h1>
          <p className="city-intro-copy">{t('town.intro')}</p>
        </div>

        <div className="city-status" aria-live="polite">
          <span className="city-status-dot" aria-hidden="true" />
          <span>{t('town.live')}</span>
          <strong>{hourLabel(settings.hour)}</strong>
        </div>

        {sceneState !== 'ready' && (
          <p className="city-scene-message" role={sceneState === 'error' ? 'alert' : 'status'}>
            {t(sceneState === 'error' ? 'town.error' : 'town.loading')}
          </p>
        )}

        <div className="city-bottom-bar">
          <button
            type="button"
            className="city-main-button"
            aria-expanded={controlsOpen}
            aria-controls={controlsOpen ? 'city-controls' : undefined}
            onClick={() => setControlsOpen((open) => !open)}
          >
            <span aria-hidden="true">{controlsOpen ? '−' : '+'}</span>
            {t(controlsOpen ? 'town.closeControls' : 'town.controls')}
          </button>
          <div className="city-activity">
            <span>{t('town.activity')}</span>
            <strong>{t(activityKey)}</strong>
          </div>
          <p id="city-navigation-hint" className="city-gesture">{t('town.gesture')}</p>
        </div>

        <div className="city-navigation" role="group" aria-label={t('town.camera')}>
          <div className="city-travel-pad">
            {travelButtons.map(({ key, label, forward, right }) => (
              <button
                key={key}
                type="button"
                className={`city-travel-button city-travel-${key}`}
                aria-label={t(label)}
                onPointerDown={(event) => {
                  if (event.button !== 0) return;
                  event.currentTarget.setPointerCapture(event.pointerId);
                  sceneRef.current?.moveCamera(forward, right, 1.2);
                  sceneRef.current?.setTravelKey(key, true);
                }}
                onPointerUp={() => sceneRef.current?.setTravelKey(key, false)}
                onPointerCancel={() => sceneRef.current?.setTravelKey(key, false)}
                onLostPointerCapture={() => sceneRef.current?.setTravelKey(key, false)}
                onBlur={() => sceneRef.current?.setTravelKey(key, false)}
                onClick={(event) => { if (event.detail === 0) sceneRef.current?.moveCamera(forward, right); }}
              >{key.toUpperCase()}</button>
            ))}
          </div>
          <div className="city-orbit-pad">
            <button type="button" aria-label={t('town.orbitLeft')} onClick={() => sceneRef.current?.rotateCamera?.(-.3, 0)}>↶</button>
            <button type="button" aria-label={t('town.orbitRight')} onClick={() => sceneRef.current?.rotateCamera?.(.3, 0)}>↷</button>
          </div>
        </div>

        {controlsOpen && (
          <section id="city-controls" className="city-controls" aria-label={t('town.controls')}>
            <div className="city-controls-head">
              <div>
                <p className="city-kicker">{t('town.now')}</p>
                <h2>{t('town.controls')}</h2>
              </div>
              <button type="button" className="city-icon-button" aria-label={t('town.closeControls')} onClick={() => setControlsOpen(false)}>×</button>
            </div>

            <div className="city-time-control">
              <label className="city-control-label" htmlFor="city-time">{t('town.time')} <strong>{hourLabel(settings.hour)}</strong></label>
              <input
                id="city-time"
                type="range"
                min="0"
                max="23.75"
                step="0.25"
                value={settings.hour}
                onChange={(event) => setSettings((current) => ({ ...current, hour: Number(event.target.value), playing: false }))}
              />
              <button
                type="button"
                className="city-time-button"
                onClick={() => setSettings((current) => ({ ...current, playing: !current.playing }))}
              >
                {t(settings.playing ? 'town.pause' : 'town.play')}
              </button>
              <p className="city-simulation-note">{t('town.timeNote')}</p>
            </div>

            <fieldset className="city-choice-group">
              <legend className="city-control-label">{t('town.camera')}</legend>
              <div className="city-choice-list">
                <button type="button" className="city-choice city-camera-button" aria-label={t('town.orbitLeft')} onClick={() => sceneRef.current?.rotateCamera?.(-0.16, 0)}><span aria-hidden="true">←</span></button>
                <button type="button" className="city-choice city-camera-button" aria-label={t('town.orbitRight')} onClick={() => sceneRef.current?.rotateCamera?.(0.16, 0)}><span aria-hidden="true">→</span></button>
                <button type="button" className="city-choice city-camera-button" aria-label={t('town.zoomIn')} onClick={() => sceneRef.current?.zoomCamera?.(1.15)}><span aria-hidden="true">+</span></button>
                <button type="button" className="city-choice city-camera-button" aria-label={t('town.zoomOut')} onClick={() => sceneRef.current?.zoomCamera?.(1 / 1.15)}><span aria-hidden="true">−</span></button>
              </div>
            </fieldset>
            <p className="city-simulation-note">{t('town.gesture')}</p>

            <fieldset className="city-choice-group">
              <legend className="city-control-label">{t('town.explore')}</legend>
              <div className="city-choice-list">
                {landmarks.map(({ value, label }) => <button key={value} type="button" className="city-choice" onClick={() => sceneRef.current?.focusLandmark(value)}>{t(label)}</button>)}
              </div>
            </fieldset>
            <div className="city-choice-group">
              <label className="city-control-label" htmlFor="city-speed">{t('town.speed')} <strong>{settings.speed}×</strong></label>
              <input id="city-speed" className="city-speed" type="range" min="0.25" max="3" step="0.25" value={settings.speed} onChange={(event) => setSettings(current => ({ ...current, speed: Number(event.target.value) }))} />
            </div>

            <ChoiceGroup title={t('town.weather')} choices={weatherChoices} value={settings.weather} onChange={(weather) => setSettings((current) => ({ ...current, weather }))} t={t} />
            <ChoiceGroup title={t('town.disaster')} choices={disasterChoices} value={settings.disaster} onChange={(disaster) => {
              if (disaster !== 'none') setHasDamage(true);
              setSettings((current) => ({ ...current, disaster }));
            }} t={t} />
            <p className="city-simulation-note">{t('town.eventNote')}</p>
            {settings.disaster !== 'none' && <p className="city-simulation-note" role="status">{t(`town.phase.${eventPhase === 'calm' ? 'onset' : eventPhase}`)}</p>}
            {settings.disaster !== 'none' && (
              <fieldset className="city-choice-group">
                <legend className="city-control-label">{t('town.eventPreview')}</legend>
                <div className="city-choice-list">
                  <button type="button" className="city-choice" onClick={() => sceneRef.current?.seekEvent(1)}>{t('town.eventStart')}</button>
                  <button type="button" className="city-choice" onClick={() => sceneRef.current?.seekEvent(settings.disaster === 'earthquake' ? 4 : 24)}>{t('town.eventPeak')}</button>
                  <button type="button" className="city-choice" onClick={() => sceneRef.current?.seekEvent(90)}>{t('town.eventLater')}</button>
                </div>
              </fieldset>
            )}
            {hasDamage && <button type="button" className="city-reset-button" onClick={() => {
              sceneRef.current?.repairCity();
              setSettings(current => ({ ...current, disaster: 'none' })); setHasDamage(false);
            }}>{t('town.repair')}</button>}
            <ChoiceGroup title={t('town.season')} choices={seasonChoices} value={settings.season} onChange={(season) => setSettings((current) => ({ ...current, season }))} t={t} />
            <ChoiceGroup title={t('town.climate')} choices={climateChoices} value={settings.climate} onChange={(climate) => setSettings((current) => ({ ...current, climate }))} t={t} />

            <button
              type="button"
              className="city-reset-button"
              onClick={() => {
                setSettings({ ...initialSettings, playing: !window.matchMedia('(prefers-reduced-motion: reduce)').matches });
                sceneRef.current?.repairCity(); setHasDamage(false);
                sceneRef.current?.resetCamera?.();
              }}
            >
              {t('town.reset')}
            </button>
            <p className="city-simulation-note">{t('town.visualNote')}</p>
          </section>
        )}
      </main>
    </div>
  );
}
