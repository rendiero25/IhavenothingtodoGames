import type { AtmosphereStopId } from '../../education/atmosphere';

// Native SVG only: no bitmap downloads, blur filters or animated geometry.
function Cloud({ x, y, scale = 1, id }: { x: number; y: number; scale?: number; id: string }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <path d="M-35 42C-60 34-47 4-25 9C-31-14-5-28 16-17C25-56 79-65 103-32C131-44 157-28 159-4C194-18 228 2 229 29C257 19 280 35 271 52C199 70 24 68-35 42Z" fill={`url(#${id}-cloud)`} />
    <path d="M-12 32C31 51 75 29 112 38S202 43 231 30M17-9C36-30 57-36 78-30" stroke="var(--sky-white)" strokeWidth="4" strokeLinecap="round" opacity=".22" />
  </g>;
}

function Spacecraft({ id, station = false }: { id: string; station?: boolean }) {
  return <g transform="translate(380 350) rotate(-22)"><g className="sky-drift" data-motion="orbit">
    <path d="M-238-7H238V7H-238Z" fill={`url(#${id}-metal)`} />
    <path d="M-221-7L-198 7L-175-7L-152 7L-129-7L-106 7M106-7L129 7L152-7L175 7L198-7L221 7" stroke="oklch(.42 .04 239)" strokeWidth="2" />
    {(station ? [-235, -147, 71, 159] : [-200, 109]).map(x => <g key={x} transform={`translate(${x} -100)`}><path d="M0 0L76-5V195L0 200Z" fill={`url(#${id}-cells)`} stroke="oklch(.7 .035 228)" strokeWidth="1.5" /><path d="M0 100L76 95M0 0L76-5V195" stroke="var(--sky-white)" opacity=".65" /></g>)}
    <g fill={`url(#${id}-metal)`} stroke="oklch(.44 .025 220)" strokeWidth="1.4"><rect x="-66" y="-21" width="132" height="42" rx="12" /><rect x="-21" y="-80" width="42" height="164" rx="15" /><ellipse cy="-80" rx="17" ry="5" fill="var(--sky-white)" /><path d="M-21-55H21M-21-39H21M-21 41H21M-21 60H21M-44-21V21M43-21V21" />{station && <><rect x="25" y="-48" width="54" height="27" rx="8" /><rect x="-74" y="22" width="47" height="29" rx="8" /><path d="M62-49V-73L91-88M-57 52V80" fill="none" stroke="var(--sky-white)" /></>}</g>
    <path d="M-15 85L0 101L15 85" fill="oklch(.73 .09 79)" /><circle cy="-19" r="11" fill="oklch(.18 .04 244)" stroke="var(--sky-white)" strokeWidth="2" /><path d="M-8-25L7-16M-8-18L5-11" stroke="oklch(.53 .07 223)" />
    {!station && <g transform="translate(40 -73)"><path d="M-34-21Q0 28 34-21Q0-7-34-21" fill={`url(#${id}-metal)`} stroke="var(--sky-white)" /><path d="M0-9L10-39M0 3L-19 52" stroke="var(--sky-white)" strokeWidth="2" /></g>}
    <circle className="sky-beacon" cx="22" cy="-81" r="2.5" fill="var(--sky-sun)" />
  </g></g>;
}

function Earth({ id }: { id: string }) {
  return <g transform="translate(390 345)"><circle r="189" fill={`url(#${id}-limb)`} /><g clipPath={`url(#${id}-globe)`}>
    <circle r="173" fill={`url(#${id}-ocean)`} />
    <g className="sky-earth-drift" fill="oklch(.56 .065 159)"><path d="M-157-111L-129-128L-93-136L-75-123L-49-126L-39-107L-13-101L-24-83L-6-72L-18-47L-43-41L-49-16L-70-11L-79-30L-105-42L-110-72L-144-73Z" /><path d="M-65-9L-39 4L-19 14L-14 40L-28 61L-32 90L-46 115L-60 128L-65 108L-77 87L-70 66L-81 43L-91 29L-88 8Z" /><path d="M7-132L35-146L53-131L57-112L44-100L30-113L13-114ZM35-81L56-98L69-87L90-99L116-80L145-86L178-52L172-27L142-22L133-41L104-37L95-13L78-8L66-27L43-37L23-55Z" /><path d="M31-41L58-32L81-7L74 25L59 61L45 75L28 60L19 36L5 16L11-15ZM114 74L142 61L162 79L159 101L137 114L115 103L105 89Z" /><path d="M-184 138Q-75 119 12 152T186 145V195H-185Z" fill="oklch(.9 .025 198)" /></g>
    <g className="sky-cloud-bands" fill="none" stroke="var(--sky-white)" strokeLinecap="round" opacity=".72"><path d="M-161-99Q-117-76-87-86T-13-69M-136-56Q-100-40-68-55M44-118Q98-110 142-83M-140 44Q-111 63-82 60M-36 95Q21 72 72 94T149 98M72 27Q110 14 140 39" strokeWidth="9" /><path d="M-132-107L-78-98M-114-48L-66-45M-29 107Q26 91 52 105M71 43Q114 29 145 49" strokeWidth="3" /></g>
    <circle r="173" fill={`url(#${id}-shadow)`} />
  </g><circle r="173" stroke="oklch(.78 .08 220 / .6)" strokeWidth="2" /></g>;
}

export function AtmosphereArt({ scene }: { scene: AtmosphereStopId }) {
  const id = `sky-vector-${scene}`;
  return <div className={`sky-art sky-art--${scene}`} aria-hidden="true">
    {scene === 'ground' && <svg className="sky-sun" viewBox="0 0 320 320" fill="none"><g className="sky-parallax-mid"><circle cx="160" cy="160" r="155" fill={`url(#${id}-sun)`} /><circle cx="160" cy="160" r="55" fill="var(--sky-sun)" /></g></svg>}
    <svg className="sky-environment" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" fill="none">
      <defs>
        <linearGradient id={`${id}-cloud`} x2="0" y2="1"><stop stopColor="oklch(.98 .009 100)" /><stop offset=".5" stopColor="oklch(.88 .025 200)" /><stop offset="1" stopColor="oklch(.64 .055 215)" stopOpacity=".15" /></linearGradient>
        <linearGradient id={`${id}-haze`} x2="0" y2="1"><stop stopColor="var(--sky-ozone)" stopOpacity="0" /><stop offset=".7" stopColor="var(--sky-ozone)" stopOpacity=".18" /><stop offset="1" stopColor="var(--sky-ozone)" stopOpacity="0" /></linearGradient>
        <linearGradient id={`${id}-curtain`} x2=".15" y2="1"><stop stopColor="var(--sky-aurora)" stopOpacity="0" /><stop offset=".55" stopColor="var(--sky-aurora)" stopOpacity=".12" /><stop offset=".86" stopColor="var(--sky-aurora)" stopOpacity=".65" /><stop offset="1" stopColor="var(--sky-aurora)" stopOpacity="0" /></linearGradient>
        <radialGradient id={`${id}-sun`}><stop stopColor="var(--sky-sun)" /><stop offset=".35" stopColor="var(--sky-sun)" stopOpacity=".35" /><stop offset="1" stopColor="var(--sky-sun)" stopOpacity="0" /></radialGradient>
      </defs>
      {!['ground', 'troposphere'].includes(scene) && <g className="sky-parallax-far"><g className="sky-stars" fill="var(--sky-white)">{Array.from({ length: 65 }, (_, i) => <circle key={i} cx={(i * 193 + 37) % 1200} cy={(i * 113 + 19) % 800} r={i % 7 === 0 ? 1.5 : .65} opacity={.15 + (i % 4) * .12} />)}</g></g>}
      {['ground', 'troposphere'].includes(scene) && <g className="sky-parallax-far"><g className="sky-wind" opacity={scene === 'ground' ? .32 : .55}><Cloud x={-160} y={170} scale={1.5} id={id} /><Cloud x={830} y={160} scale={1.7} id={id} /><Cloud x={370} y={680} scale={1.2} id={id} /></g></g>}
      {scene === 'ground' && <>
        <g className="sky-parallax-mid">
          <path d="M-150 724L20 677L112 617L165 637L241 550L320 602L414 527L493 556L582 486L641 422L674 439L706 473L751 520L808 544L875 502L967 589L1079 487L1144 562L1350 672V1050H-150Z" fill="oklch(.5 .055 212)" />
          <path d="M527 546L582 486L641 422L674 439L706 473L749 518L711 500L682 483L662 485L647 457L618 489L605 480L577 514L561 508Z" fill="oklch(.85 .024 200)" />
          <path d="M641 422L646 505L669 544L653 590L724 626L801 641L729 531L706 473L674 439Z" fill="oklch(.34 .04 215)" opacity=".7" />
          <path d="M610 495L579 554L546 578M653 512L631 553L644 594M688 518L715 567L758 591M1033 541L1079 487L1122 535L1089 526L1070 514L1050 549" stroke="oklch(.74 .025 201)" strokeWidth="2" opacity=".55" />
        </g>
        <g className="sky-parallax-near"><path d="M-150 840L-10 727L93 753L181 699L291 674L356 705L453 660L537 686L649 599L717 626L778 673L888 641L1018 706L1128 644L1360 731V1100H-150Z" fill="oklch(.3 .055 194)" /><path d="M-150 821Q106 747 275 782T634 745T988 736T1350 762V1120H-150Z" fill="var(--sky-earth)" />
          {Array.from({ length: 28 }, (_, i) => <g key={i} transform={`translate(${480 + i * 28} ${750 + Math.sin(i * .8) * 22}) scale(${.3 + (i % 5) * .085})`} fill="oklch(.17 .025 187)"><path d="M0-133L-13-97L-8-99L-24-68L-15-73L-37-37L-23-43L-48-4L-8-10L-5 15H5L8-10L48-4L23-43L37-37L15-73L24-68L8-99L13-97Z" /></g>)}
          <path d="M873 768Q844 790 914 825T824 960" stroke="var(--sky-path)" strokeWidth="9" /><g transform="translate(870 746)" fill="var(--sky-white)"><circle cy="-18" r="3.5" /><path d="M-3-13L5-12L7 1L4 8L10 21L6 23L0 11L-6 24L-10 22L-4 6L-5-3L-9 3L-12 1Z" /><path d="M-9-12Q-14-11-12 1L-7 2L-5-11Z" fill="var(--sky-sun)" /><path d="M3-8L12-14L14-12L6-4Z" /></g>
        </g>
      </>}
      {scene === 'troposphere' && <g className="sky-parallax-near"><g className="sky-wind" opacity=".85"><Cloud x={-240} y={625} scale={2.4} id={id} /><Cloud x={960} y={560} scale={2} id={id} /><Cloud x={490} y={790} scale={2.5} id={id} /></g></g>}
      {scene === 'stratosphere' && <g className="sky-parallax-far"><path d="M-200 650Q650 60 1400 500V750Q620 310-200 900Z" fill={`url(#${id}-haze)`} /><path d="M-200 720Q650 150 1400 570" stroke="var(--sky-ozone)" opacity=".15" /></g>}
      {scene === 'thermosphere' && <g className="sky-parallax-far"><g className="sky-aurora">{Array.from({ length: 12 }, (_, i) => <path key={i} d={`M${400 + i * 17}-120C${1020 + i * 15} 130 ${280 + i * 25} 320 ${760 + i * 19} 710L${785 + i * 19} 698C${322 + i * 25} 320 ${1048 + i * 15} 130 ${425 + i * 17}-120Z`} fill={`url(#${id}-curtain)`} />)}</g></g>}
      {['thermosphere', 'exosphere'].includes(scene) && <g className="sky-parallax-mid"><path d="M-180 1100Q580 440 1380 1040" stroke="var(--sky-ozone)" strokeWidth="4" opacity=".3" /><path d="M-180 1113Q580 453 1380 1053" stroke="var(--sky-ozone)" strokeWidth="19" opacity=".07" /></g>}
    </svg>
    {scene !== 'ground' && <svg className="sky-subject" viewBox="0 0 760 700" fill="none">
      <defs>
        <linearGradient id={`${id}-metal`} x2=".2" y2="1"><stop stopColor="oklch(.96 .008 105)" /><stop offset=".3" stopColor="oklch(.88 .015 210)" /><stop offset=".65" stopColor="oklch(.59 .035 234)" /><stop offset="1" stopColor="oklch(.78 .017 211)" /></linearGradient>
        <linearGradient id={`${id}-balloon`}><stop stopColor="oklch(.56 .04 231)" /><stop offset=".42" stopColor="oklch(.98 .012 91)" /><stop offset=".7" stopColor="oklch(.9 .02 190)" /><stop offset="1" stopColor="oklch(.52 .05 224)" /></linearGradient>
        <pattern id={`${id}-cells`} width="13" height="19" patternUnits="userSpaceOnUse"><rect width="13" height="19" fill="oklch(.27 .065 259)" /><path d="M0 0H13V19H0Z" stroke="oklch(.64 .055 233)" strokeWidth=".6" /><path d="M2 3L10 2M2 7L10 6M2 11L10 10M2 15L10 14" stroke="oklch(.42 .07 245)" strokeWidth=".5" /></pattern>
        <linearGradient id={`${id}-trail`} x1="0" y1="1" x2="1" y2="0"><stop stopColor="oklch(.95 .09 85)" /><stop offset=".2" stopColor="oklch(.8 .14 52)" stopOpacity=".6" /><stop offset="1" stopColor="oklch(.72 .12 45)" stopOpacity="0" /></linearGradient>
        <radialGradient id={`${id}-ocean`} cx=".33" cy=".27" r=".8"><stop stopColor="oklch(.6 .12 224)" /><stop offset=".7" stopColor="oklch(.34 .09 245)" /><stop offset="1" stopColor="oklch(.15 .05 258)" /></radialGradient>
        <radialGradient id={`${id}-limb`}><stop offset=".88" stopColor="var(--sky-ozone)" stopOpacity="0" /><stop offset=".92" stopColor="var(--sky-ozone)" stopOpacity=".35" /><stop offset="1" stopColor="var(--sky-ozone)" stopOpacity="0" /></radialGradient>
        <linearGradient id={`${id}-shadow`} x1=".2" y1=".25" x2="1" y2=".7"><stop offset=".3" stopColor="oklch(.08 .02 258)" stopOpacity="0" /><stop offset=".85" stopColor="oklch(.08 .02 258)" stopOpacity=".65" /><stop offset="1" stopColor="oklch(.08 .02 258)" stopOpacity=".95" /></linearGradient>
        <clipPath id={`${id}-globe`}><circle r="173" /></clipPath>
      </defs>
      <g className="sky-parallax-near">
        {scene === 'troposphere' && <g transform="translate(385 340) rotate(-14)"><g className="sky-drift" data-motion="flight"><path d="M-243 3L-427 3M-245 20L-468 20" stroke="var(--sky-white)" strokeWidth="2" opacity=".18" /><path d="M-216-10L-239-67L-217-64L-172-10Z" fill="oklch(.7 .055 212)" /><path d="M-18-4L-81-139L-48-142L75-6Z" fill={`url(#${id}-metal)`} /><path d="M-214-10Q-120-22 167-10Q202-8 226 5Q232 14 207 21L-184 27L-232 14Z" fill={`url(#${id}-metal)`} stroke="oklch(.78 .025 211)" /><path d="M-28 13L-85 145L-48 140L84 11Z" fill={`url(#${id}-metal)`} /><path d="M-207 12L-237 58L-217 55L-163 19Z" fill="oklch(.77 .035 206)" /><path d="M180-7L193-3L205 4L178 3Z" fill="oklch(.2 .04 230)" />{Array.from({ length: 19 }, (_, i) => <rect key={i} x={-134 + i * 15} y={-5} width="5" height="5" rx="2" fill="oklch(.24 .035 235)" />)}<g fill="oklch(.71 .025 213)" stroke="oklch(.38 .025 230)"><path d="M22-60Q57-68 65-58V-45H20Z" /><path d="M21 66Q56 58 63 68V80H20Z" /></g><path d="M-69 120L40 27M-66-116L42-22" stroke="oklch(.5 .035 218)" strokeWidth="1.5" /><circle className="sky-beacon" cx="-78" cy="143" r="2" fill="var(--sky-sun)" /></g></g>}
        {scene === 'stratosphere' && <g className="sky-drift" data-motion="balloon"><path d="M380 385V541" stroke="var(--sky-white)" opacity=".7" /><path d="M380 88C234 88 213 263 311 350Q350 382 371 391H389Q417 377 451 342C543 247 515 88 380 88Z" fill={`url(#${id}-balloon)`} /><path d="M380 88C302 129 286 286 371 391M380 88C458 129 474 286 389 391M380 88V391" stroke="oklch(.64 .022 215)" strokeWidth="1.4" opacity=".48" /><path d="M371 391L380 412L389 391" fill="var(--sky-white)" /><path d="M380 515L354 549H406Z" fill="oklch(.75 .09 80)" /><rect x="360" y="550" width="40" height="35" rx="3" fill={`url(#${id}-metal)`} /><rect x="367" y="556" width="15" height="12" fill="var(--sky-panel)" /><path d="M382 585V615M399 563L427 545" stroke="var(--sky-white)" /><circle cx="382" cy="616" r="3" fill="var(--sky-sun)" /></g>}
        {scene === 'mesosphere' && <g className="sky-meteor"><path d="M195 494L691 33L214 510Z" fill={`url(#${id}-trail)`} opacity=".2" /><path d="M202 497L666 69L209 505Z" fill={`url(#${id}-trail)`} /><path d="M204 498L369 345" stroke="oklch(.96 .07 86)" strokeWidth="4" strokeLinecap="round" /><path d="M192 490L202 484L213 491L210 504L201 510L191 502Z" fill="var(--sky-white)" /><path d="M227 505L273 465M203 475L252 430M247 476L279 445" stroke="var(--sky-sun)" strokeWidth="1.5" opacity=".6" /></g>}
        {scene === 'thermosphere' && <Spacecraft id={id} station />}
        {scene === 'exosphere' && <><g transform="translate(345 305) scale(.32)"><Earth id={id} /></g><Spacecraft id={id} /></>}
        {scene === 'beyond' && <g className="sky-drift" data-motion="earth"><Earth id={id} /></g>}
      </g>
    </svg>}
  </div>;
}
