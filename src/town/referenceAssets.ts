/** Shared low-poly details for the compact reference-inspired town. */
export type ReferenceBlock = (
  x: number, y: number, z: number, width: number, height: number, depth: number,
  tint: number, key?: string, rotation?: number,
) => void;

export type ReferenceLeaf = (
  x: number, y: number, z: number, width: number, height: number, depth: number, tint: number,
) => void;

export type ReferenceBuildingKind = 'apartment' | 'office' | 'shop' | 'restaurant' | 'grocery' | 'civic' | 'house';
export type ReferenceVehicleKind = 'car' | 'van' | 'motorcycle';
export type ReferencePropKind = 'lamp' | 'bin' | 'bench' | 'table' | 'marketStall' | 'fountain' | 'sign';
export type ReferencePropPlacement = { kind: ReferencePropKind; x: number; z: number; rotation?: number; index?: number };

const walls = [0xe7c79d, 0xf0e8d8, 0xdfbf98, 0xebcda5, 0xe1d7c1, 0xeee3cf];
const roofTints = [0xb77d47, 0xc39a62, 0x5b7890, 0xd19a49, 0x398164];
const windowFrame = 0x366e6c;
const windowGlass = 0x4e9f9e;
const trim = 0xf4eee0;

function frontWindow(block: ReferenceBlock, x: number, y: number, z: number, width: number, height: number, sill = true) {
  block(x, y, z + .07, width + .16, height + .16, .13, windowFrame);
  block(x, y, z + .16, width, height, .08, windowGlass, 'glass');
  block(x, y, z + .21, .045, height - .12, .025, 0xb7d4ca);
  if (sill) block(x, y - height / 2 - .12, z + .25, width + .36, .12, .38, trim);
}

function sideWindow(block: ReferenceBlock, x: number, y: number, z: number, width: number, height: number) {
  block(x + .07, y, z, .13, height + .16, width + .16, windowFrame);
  block(x + .16, y, z, .08, height, width, windowGlass, 'glass');
  block(x + .21, y, z, .025, height - .12, .045, 0xb7d4ca);
  block(x + .24, y - height / 2 - .12, z, .38, .12, width + .36, trim);
}

function rooftop(block: ReferenceBlock, x: number, z: number, w: number, d: number, h: number, index: number) {
  const edge = index % 2 ? 0xd0a579 : 0xb47b48;
  block(x, h + .19, z, w + .48, .36, d + .48, edge, 'roof');
  for (const side of [-1, 1]) {
    block(x + side * (w / 2 - .12), h + .49, z, .25, .48, d + .45, edge, 'roof');
    block(x, h + .49, z + side * (d / 2 - .12), w + .45, .48, .25, edge, 'roof');
  }
  block(x - w * .21, h + .56, z - d * .14, w * .23, .34, d * .22, 0xd9d4c5);
  block(x - w * .21, h + .78, z - d * .14, w * .27, .11, d * .26, 0x8c9895);
  block(x + w * .22, h + .52, z + d * .13, w * .18, .26, d * .18, 0xc3c4b9);
  block(x + w * .22, h + .71, z + d * .13, w * .13, .08, d * .13, 0x808d89);
}

const glyphs: Record<string, readonly string[]> = {
  A: ['010', '101', '111', '101', '101'], B: ['110', '101', '110', '101', '110'],
  C: ['011', '100', '100', '100', '011'], E: ['111', '100', '110', '100', '111'],
  G: ['011', '100', '101', '101', '011'], I: ['111', '010', '010', '010', '111'],
  O: ['010', '101', '101', '101', '010'], R: ['110', '101', '110', '101', '101'],
  S: ['011', '100', '010', '001', '110'], T: ['111', '010', '010', '010', '010'],
  Y: ['101', '101', '010', '010', '010'],
};

function frontSign(block: ReferenceBlock, text: string, x: number, y: number, z: number, availableWidth: number, panel: number) {
  const pixel = Math.min(.19, availableWidth / (text.length * 4 + 2));
  const width = (text.length * 4 - 1) * pixel;
  block(x, y, z, Math.min(availableWidth + .45, width + 1), .98, .24, panel);
  for (let letter = 0; letter < text.length; letter++) {
    const pattern = glyphs[text[letter]];
    if (!pattern) continue;
    for (let row = 0; row < 5; row++) for (let column = 0; column < 3; column++) {
      if (pattern[row][column] === '1') {
        block(x - width / 2 + (letter * 4 + column) * pixel, y + (2 - row) * pixel,
          z + .15, pixel * .68, pixel * .68, .05, trim);
      }
    }
  }
}

/** Add one detailed building using scene-owned instanced box batches. Ground is y=0. */
export function addReferenceBuilding(
  block: ReferenceBlock, x: number, z: number, w: number, d: number,
  height: number, kind: ReferenceBuildingKind, index: number,
) {
  const h = kind === 'restaurant' ? Math.min(height, 9.5)
    : kind === 'grocery' ? Math.min(height, 6.2)
      : kind === 'civic' ? Math.min(height, 7)
        : kind === 'house' ? Math.min(height, 7.5) : height;
  const wall = walls[index % walls.length];
  const roof = roofTints[index % roofTints.length];
  const front = z + d / 2;
  const side = x + w / 2;
  block(x, .13, z, w + .8, .26, d + .8, kind === 'restaurant' ? 0xd39b52 : 0xddd5bc);

  if (kind === 'restaurant') {
    block(x, .12, z + d * .12, w + 2.7, .13, d + 3, 0xc88837);
    block(x, h * .43, z - d * .09, w * .87, h * .75, d * .77, 0xd89136);
    block(x, h * .80, z - d * .09, w * .68, h * .47, d * .6, 0xdf9b40);
    block(x, h * 1.06, z - d * .09, w * .68 + .5, .26, d * .6 + .5, 0xba7030, 'roof');
    block(x, h * 1.09, z - d * .09, w * .53, .19, d * .44, 0xecad55, 'roof');
    block(x, h * 1.13, z - d * .09, w * .41, .16, d * .34, 0xbc7934, 'roof');
    block(x, h * .8, front - d * .19, w * .97, .26, .35, 0x9f6032, 'roof');
    for (const side of [-1, 1]) block(x + side * w * .43, 2.2, front + .18,
      .2, 4.3, .2, 0xe9b76f);
    block(x, h * .48, front - d * .1, w * .82, 1.35, .1, 0xe6b05f);
    frontSign(block, 'BISTRO', x, h * .49, front - d * .1 + .18, w * .72, 0xb36d35);
    for (const dx of [-.32, 0, .32]) {
      const wx = x + dx * w;
      frontWindow(block, wx, h * .82, z + d * .21, 1.25, 1.55, false);
      block(wx, h * .81, z + d * .21 + .21, .045, 1.4, .03, trim);
    }
    for (const dx of [-.29, 0, .29]) {
      const tx = x + dx * w;
      const tz = front + 1.05;
      block(tx, .95, tz, .08, 1.45, .08, 0xe9dfc9);
      block(tx, 1.7, tz, 1.23, .1, 1.23, trim);
      for (const sx of [-.7, .7]) block(tx + sx, .45, tz, .46, .64, .44, trim);
    }
    return;
  }

  if (kind === 'grocery') {
    block(x, h / 2 + .2, z, w, h, d, 0xd8bd91);
    block(x, h + .26, z, w + .75, .36, d + .75, 0x496d88, 'roof');
    for (let stripe = -Math.floor(w / 1.15); stripe <= Math.floor(w / 1.15); stripe++) {
      const sx = x + stripe * .54;
      if (Math.abs(sx - x) < w / 2) block(sx, h + .49, z, .08, .07, d + .38, 0x638ba4, 'roof');
    }
    block(x, h + .64, z, w * .24, .18, d + .45, 0x345975, 'roof');
    for (let bay = -2; bay <= 2; bay++) {
      const wx = x + bay * w / 6;
      frontWindow(block, wx, 2, front, w / 7, 2.2, false);
      if (bay !== 0) block(wx, 3.17, front + .65, w / 6.6, .16, 1.25,
        bay % 2 ? trim : 0x496887, 'roof');
    }
    frontSign(block, 'GROCERY', x, h + .06, front + .12, w * .64, 0x68432f);
    for (let crate = 0; crate < 4; crate++) {
      const cx = x - w * .3 + crate * w * .16;
      block(cx, .54, front + 1.2, .8, .62, .72, 0x95643f);
      block(cx, .91, front + 1.2, .65, .14, .58, crate % 2 ? 0x72a94d : 0xd5a141);
    }
    return;
  }

  if (kind === 'civic') {
    block(x, .34, z, w + 1.2, .52, d + 1.2, 0xbab8a3);
    block(x, h * .52, z - d * .13, w * .77, h * .93, d * .72, 0xe4dfc9);
    block(x, h + .17, z - d * .13, w + .45, .36, d + .8, 0x2f715b, 'roof');
    block(x, h + .46, z - d * .13, w * .81, .25, d * .62, 0x3e8064, 'roof');
    block(x, h * .78, front - .6, w * .79, .48, .62, trim);
    for (let c = -2; c <= 2; c++) {
      const cx = x + c * w * .145;
      block(cx, h * .4, front + .24, .43, h * .68, .43, trim);
      block(cx, h * .72, front + .24, .71, .17, .67, 0xd6d0b9);
      block(cx, .53, front + .24, .74, .15, .7, 0xd6d0b9);
    }
    block(x, h * .39, front - .15, w * .52, h * .5, .12, windowFrame);
    block(x, h * .39, front - .03, w * .48, h * .46, .07, windowGlass, 'glass');
    for (let stair = 0; stair < 3; stair++) block(x, .15 + stair * .12,
      front + 2 - stair * .4, w * .79, .18, .6, 0xd9d5c5);
    return;
  }

  block(x, h / 2 + .2, z, w, h, d, wall);
  if (kind === 'office') {
    block(x, h + .2, z, w + .42, .32, d + .42, trim, 'roof');
    block(x, h + .38, z, w * .65, .15, d * .6, 0x56a69b, 'roof');
    const columns = Math.max(3, Math.floor(w / 1.35));
    for (let c = 0; c < columns; c++) {
      const wx = x - w / 2 + (c + .5) * w / columns;
      block(wx, h / 2 + .1, front + .09, w / columns * .65, h - 1.4, .1, windowFrame);
      block(wx, h / 2 + .1, front + .18, w / columns * .55, h - 1.55, .07, windowGlass, 'glass');
      block(wx + w / columns * .36, h / 2 + .1, front + .22, .12, h - 1.25, .2, trim);
    }
    for (let c = 0; c < Math.max(2, Math.floor(d / 1.35)); c++) {
      const wz = z - d / 2 + (c + .5) * d / Math.max(2, Math.floor(d / 1.35));
      block(side + .1, h / 2 + .1, wz, .1, h - 1.4, .72, windowFrame);
      block(side + .18, h / 2 + .1, wz, .07, h - 1.55, .6, windowGlass, 'glass');
    }
    block(x, 1.2, front + .28, w * .25, 2.2, .16, trim);
    return;
  }

  if (kind === 'house') {
    rooftop(block, x, z, w, d, h, index);
    frontWindow(block, x - w * .23, 2.3, front, w * .2, 1.4);
    frontWindow(block, x + w * .23, 2.3, front, w * .2, 1.4);
    block(x, 1.31, front + .12, w * .2, 2.4, .12, 0x79533e);
    sideWindow(block, side, 2.45, z, d * .22, 1.3);
    block(x, 3.5, front + .45, w * .45, .19, .8, roof, 'roof');
    return;
  }

  if (kind === 'shop') {
    rooftop(block, x, z, w, d, h, index);
    block(x, 1.65, front + .13, w * .76, 2.55, .12, windowFrame);
    block(x, 1.65, front + .2, w * .72, 2.42, .1, windowGlass, 'glass');
    block(x, 3.35, front + .74, w * .92, .18, 1.28, roof, 'roof');
    for (let stripe = 0; stripe < 8; stripe++) block(x - w * .4 + stripe * w * .8 / 7,
      3.22, front + 1.21, w * .064, .21, .27, trim, 'roof');
    frontSign(block, 'STORE', x, 4.05, front + .27, w * .68, 0x7e5137);
    for (let floor = 1; floor < Math.max(2, Math.floor((h - 1) / 2.45)); floor++) {
      const y = 1.9 + floor * 2.4;
      for (let c = -1; c <= 1; c++) frontWindow(block, x + c * w * .27, y, front, w * .16, 1.3);
    }
    return;
  }

  // Apartment: warm setbacks, repeated teal glazing, balconies and planters.
  rooftop(block, x, z, w, d, h, index);
  const floors = Math.max(2, Math.floor((h - 1) / 2.45));
  for (let floor = 0; floor < floors; floor++) {
    const y = 1.95 + floor * 2.45;
    block(x, y + 1.05, front + .08, w + .13, .12, .19, 0xc99968);
    for (let c = -1; c <= 1; c++) {
      const wx = x + c * w * .27;
      frontWindow(block, wx, y, front, w * .16, 1.32, false);
      if ((floor + c + index) % 3 !== 0) {
        block(wx, y - .8, front + .51, w * .195, .16, 1.02, 0x95613f);
        block(wx, y - .54, front + .91, w * .19, .39, .13, 0xa46a45);
        block(wx, y - .38, front + .87, w * .14, .13, .17, 0x4d8358);
      }
    }
    for (let c = -1; c <= 1; c++) sideWindow(block, side, y, z + c * d * .26, d * .14, 1.24);
  }
  block(x, 1.2, front + .15, w * .18, 2.1, .12, 0x76523e);
}

/** Faceted olive and lime crowns match the reference without unique geometry. */
export function addReferenceTree(block: ReferenceBlock, leaf: ReferenceLeaf, x: number, z: number, scale: number, index: number) {
  const greens = [0x79a928, 0x95b730, 0x6f9c29, 0xa5be44, 0x619638];
  const trunk = .27 * scale;
  block(x, .76 * scale, z, trunk, 1.52 * scale, trunk, 0x705039);
  leaf(x, 2.38 * scale, z, 1.12 * scale, 1.47 * scale, 1.08 * scale, greens[index % greens.length]);
  leaf(x - .13 * scale, 3.06 * scale, z - .08 * scale, .78 * scale, 1.07 * scale, .81 * scale,
    greens[(index + 1) % greens.length]);
}

export type ReferencePart = { x: number; y: number; z: number; w: number; h: number; d: number; tint: number; key?: string };
const bodyColors = [0xbe493b, 0xe7dfcf, 0x4d9ca2, 0xd49b48, 0x678f6f, 0x6d7e96];
const peopleClothes = [0x437b77, 0xc0714c, 0x65596a, 0xd7a447, 0x6c8d45, 0x8c7260];

/** Local vehicle geometry. The moving traffic renderer can reuse this template. */
export function referenceVehicleParts(kind: ReferenceVehicleKind, index: number): ReferencePart[] {
  const paint = bodyColors[index % bodyColors.length];
  if (kind === 'motorcycle') return [
    { x: 0, y: .45, z: 0, w: .45, h: .27, d: 1.13, tint: paint },
    { x: 0, y: .69, z: -.16, w: .42, h: .13, d: .55, tint: 0x3d4142 },
    { x: 0, y: .52, z: .49, w: .6, h: .09, d: .1, tint: 0xc7c7b9 },
    { x: 0, y: .35, z: .52, w: .36, h: .42, d: .2, tint: 0x282c2f },
    { x: 0, y: .35, z: -.52, w: .36, h: .42, d: .2, tint: 0x282c2f },
    { x: 0, y: 1.02, z: -.2, w: .35, h: .55, d: .31, tint: peopleClothes[index % peopleClothes.length] },
    { x: 0, y: 1.43, z: -.1, w: .3, h: .3, d: .3, tint: 0xd6a87e },
  ];
  const long = kind === 'van';
  const length = long ? 3.35 : 2.75;
  const parts: ReferencePart[] = [
    { x: 0, y: .55, z: 0, w: 1.38, h: .55, d: length, tint: paint },
    { x: 0, y: .86, z: -.2, w: 1.12, h: long ? .76 : .49, d: long ? 1.9 : 1.37, tint: paint },
    { x: 0, y: long ? 1.3 : 1.12, z: -.2, w: 1.12, h: .08, d: long ? 1.9 : 1.37, tint: 0xf1e2ce },
    { x: 0, y: 1.03, z: long ? .8 : .51, w: .93, h: .33, d: .08, tint: windowGlass, key: 'glass' },
    { x: .59, y: 1.02, z: -.2, w: .08, h: .31, d: long ? 1.18 : .84, tint: windowGlass, key: 'glass' },
    { x: -.59, y: 1.02, z: -.2, w: .08, h: .31, d: long ? 1.18 : .84, tint: windowGlass, key: 'glass' },
    { x: 0, y: .45, z: length / 2 + .06, w: 1.22, h: .13, d: .13, tint: 0xf0e7d8 },
    { x: 0, y: .45, z: -length / 2 - .06, w: 1.22, h: .13, d: .13, tint: 0xe7ddd0 },
  ];
  for (const side of [-1, 1]) for (const axle of [-1, 1]) {
    parts.push({ x: side * .64, y: .35, z: axle * (long ? 1.06 : .85), w: .2, h: .46, d: .44, tint: 0x262b2d });
    parts.push({ x: side * .76, y: .35, z: axle * (long ? 1.06 : .85), w: .035, h: .19, d: .19, tint: 0x9ca6a1 });
  }
  for (const side of [-1, 1]) {
    parts.push({ x: side * .48, y: .65, z: length / 2 + .1, w: .24, h: .13, d: .05, tint: 0xffe7aa, key: 'light' });
    parts.push({ x: side * .48, y: .65, z: -length / 2 - .1, w: .24, h: .13, d: .05, tint: 0xb6493d });
  }
  return parts;
}

/** Local person geometry; colors alternate, so crowds stay legible at distance. */
export function referencePersonParts(index: number): ReferencePart[] {
  const shirt = peopleClothes[index % peopleClothes.length];
  const skin = [0xe5bd92, 0xb9835b, 0xd09b72, 0xf0d0a2][index % 4];
  return [
    { x: 0, y: 1.19, z: 0, w: .35, h: .62, d: .28, tint: shirt },
    { x: 0, y: 1.69, z: 0, w: .28, h: .29, d: .27, tint: skin },
    { x: 0, y: 1.86, z: -.025, w: .29, h: .1, d: .29, tint: index % 3 ? 0x55463b : 0x303e45 },
    { x: -.25, y: 1.17, z: 0, w: .12, h: .54, d: .14, tint: skin },
    { x: .25, y: 1.17, z: 0, w: .12, h: .54, d: .14, tint: skin },
    { x: -.105, y: .51, z: 0, w: .13, h: .55, d: .16, tint: 0x4c5555 },
    { x: .105, y: .51, z: 0, w: .13, h: .55, d: .16, tint: 0x4c5555 },
    { x: -.105, y: .2, z: .07, w: .18, h: .11, d: .3, tint: 0x3e3e3b },
    { x: .105, y: .2, z: .07, w: .18, h: .11, d: .3, tint: 0x3e3e3b },
  ];
}

function placeParts(block: ReferenceBlock, x: number, z: number, rotation: number, parts: readonly ReferencePart[]) {
  const cos = Math.cos(rotation), sin = Math.sin(rotation);
  for (const part of parts) {
    block(x + part.x * cos + part.z * sin, part.y, z - part.x * sin + part.z * cos,
      part.w, part.h, part.d, part.tint, part.key, rotation);
  }
}

export function addReferenceVehicle(block: ReferenceBlock, x: number, z: number, rotation: number, kind: ReferenceVehicleKind, index: number) {
  placeParts(block, x, z, rotation, referenceVehicleParts(kind, index));
}

export function addReferencePerson(block: ReferenceBlock, x: number, z: number, rotation: number, index: number) {
  placeParts(block, x, z, rotation, referencePersonParts(index));
}

function addProp(block: ReferenceBlock, { kind, x, z, rotation = 0, index = 0 }: ReferencePropPlacement) {
  if (kind === 'lamp') {
    block(x, 1.8, z, .13, 3.6, .13, 0x7a8986);
    block(x, 3.58, z, .36, .12, .36, 0x4a625f);
    block(x, 3.77, z, .27, .31, .27, 0xfff0c9, 'light');
    block(x, 3.99, z, .43, .12, .43, 0x4a625f);
  } else if (kind === 'bin') {
    block(x, .48, z, .53, .85, .48, index % 2 ? 0x314b4b : 0x747e43);
    block(x, .95, z, .63, .12, .57, 0x343f3e);
  } else if (kind === 'bench') {
    block(x, .54, z, 1.65, .18, .52, 0xb97946, 'solid', rotation);
    block(x, .91, z - .22, 1.65, .56, .12, 0xa06841, 'solid', rotation);
    for (const side of [-1, 1]) block(x + side * .64, .3, z, .12, .55, .48, 0x616c63);
  } else if (kind === 'table') {
    block(x, .88, z, 1.14, .12, 1.14, trim, 'solid', rotation);
    block(x, .46, z, .13, .82, .13, 0xc5b8a1);
    for (const side of [-1, 1]) {
      block(x + side * .88, .47, z, .55, .1, .53, trim);
      block(x + side * .88, .29, z, .1, .42, .1, 0xb9b3a3);
    }
  } else if (kind === 'marketStall') {
    block(x, .79, z, 2.35, .19, 1.2, 0xb47f4c);
    for (const side of [-1, 1]) for (const end of [-1, 1]) block(x + side * 1.02, 1.42, z + end * .48, .1, 2.78, .1, 0x9d7655);
    block(x, 2.87, z, 2.6, .22, 1.45, index % 2 ? 0x4d8b87 : 0xf0e6cc, 'roof');
    for (let stripe = -2; stripe <= 2; stripe++) block(x + stripe * .5, 2.74, z + .66,
      .23, .3, .2, index % 2 ? trim : 0x4d8b87, 'roof');
    for (let crate = -1; crate <= 1; crate++) block(x + crate * .62, 1.03, z, .47, .22, .6,
      crate % 2 ? 0x6c9a49 : 0xd5a54e);
  } else if (kind === 'fountain') {
    block(x, .15, z, 3.6, .28, 3.6, 0xe8e3d4);
    block(x, .32, z, 3.14, .08, 3.14, 0x64b6bb, 'glass');
    block(x, .56, z, .35, .65, .35, 0xe8e3d4);
    block(x, .96, z, .78, .15, .78, trim);
  } else if (kind === 'sign') {
    block(x, 1.26, z, .12, 2.45, .12, 0x7b8780);
    block(x, 2.35, z, .9, .44, .12, index % 2 ? 0x65958b : 0xb36f48, 'solid', rotation);
    block(x, 2.35, z + .08, .55, .06, .025, trim, 'solid', rotation);
  }
}

export function addReferenceProps(block: ReferenceBlock, placements: readonly ReferencePropPlacement[]) {
  for (const placement of placements) addProp(block, placement);
}

/** Small public park within a roughly 30 × 16 block, centered at x,z. */
export function addReferencePark(block: ReferenceBlock, x: number, z: number) {
  block(x, .09, z, 29.2, .13, 15.4, 0x80a546);
  // Pale turquoise water with a stepped, chamfered concrete rim.
  block(x + 3.5, .22, z + .35, 7.7, .16, 5.4, 0xe8e5d8);
  block(x + 3.5, .3, z + .35, 6.9, .06, 4.7, 0x76c9ca, 'glass');
  for (const side of [-1, 1]) {
    block(x + 3.5 + side * 3.67, .45, z + .35, .31, .38, 4.9, trim);
    block(x + 3.5, .45, z + .35 + side * 2.46, 7.3, .38, .3, trim);
  }
  block(x + 3.5, .75, z + .35, .18, .9, .18, trim);
  block(x + 3.5, 1.25, z + .35, .5, .1, .5, 0xbef0e5, 'glass');
  addReferenceProps(block, [
    { kind: 'table', x: x + 11, z: z - 3.2 },
    { kind: 'table', x: x + 10.7, z: z + 3.2 },
    { kind: 'table', x: x - .6, z: z + 3.35 },
    { kind: 'bench', x: x - 3, z: z - 3.5 },
    { kind: 'bench', x: x + 3.3, z: z + 4.7 },
    { kind: 'lamp', x: x - 13, z: z - 5.4 },
    { kind: 'lamp', x: x + 13, z: z + 5.4 },
    { kind: 'bin', x: x + 12.8, z: z - 4.4 },
    { kind: 'bin', x: x - 2.6, z: z + 5.2, index: 1 },
  ]);
  // Reference scene's tiny service van on the lawn.
  addReferenceVehicle(block, x - 9.1, z - .2, .31, 'van', 1);
}
