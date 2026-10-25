import fs from 'node:fs';
import path from 'node:path';

const htmlPath = path.resolve('..', 'REDI-App-UI-Design (2).html');
const html = fs.readFileSync(htmlPath, 'utf8');
const symbols = [...html.matchAll(/<symbol id="(i-[^"]+)" viewBox="([^"]+)">([\s\S]*?)<\/symbol>/g)];

function parseAttrs(tag) {
  const attrs = {};
  const re = /([a-zA-Z_:][\w:.-]*)(?:=(?:"([^"]*)"|'([^']*)'))?/g;
  let m;
  while ((m = re.exec(tag))) {
    const key = m[1];
    if (key === 'class') continue;
    attrs[key] = m[2] ?? m[3] ?? 'true';
  }
  return attrs;
}

function toJsx(inner) {
  const nodes = [];
  const re =
    /<(path|circle|rect|ellipse|g|line)\b([^>]*)(?:\/>|>([\s\S]*?)<\/\1>)/g;
  let m;
  while ((m = re.exec(inner))) {
    const tag = m[1];
    const attrs = parseAttrs(m[2] || '');
    const children = m[3] ? toJsx(m[3]) : [];
    nodes.push({ tag, attrs, children });
  }
  return nodes;
}

function attrToProps(attrs) {
  const map = {
    'stroke-width': 'strokeWidth',
    'stroke-linecap': 'strokeLinecap',
    'stroke-linejoin': 'strokeLinejoin',
    'stroke-dasharray': 'strokeDasharray',
    'fill-rule': 'fillRule',
    'clip-rule': 'clipRule',
    'fill-opacity': 'fillOpacity',
    'stroke-opacity': 'strokeOpacity',
    'stop-color': 'stopColor',
    'font-family': 'fontFamily',
    'font-size': 'fontSize',
    'font-weight': 'fontWeight',
    'text-anchor': 'textAnchor',
    'class': undefined,
  };
  const out = {};
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class' || k === 'className') continue;
    const key = map[k] ?? k;
    if (!key) continue;
    if (v === 'true') out[key] = true;
    else if (/^-?\d+(\.\d+)?$/.test(v)) out[key] = Number(v);
    else out[key] = v;
  }
  return out;
}

function renderNode(node, indent) {
  const props = attrToProps(node.attrs);
  const propStr = Object.entries(props)
    .map(([k, v]) => {
      if (typeof v === 'number' || typeof v === 'boolean') return `${k}={${v}}`;
      return `${k}="${v}"`;
    })
    .join(' ');
  const Comp = node.tag[0].toUpperCase() + node.tag.slice(1);
  const pad = ' '.repeat(indent);
  if (!node.children.length) {
    return `${pad}<${Comp}${propStr ? ' ' + propStr : ''} />`;
  }
  return `${pad}<${Comp}${propStr ? ' ' + propStr : ''}>\n${node.children
    .map(c => renderNode(c, indent + 2))
    .join('\n')}\n${pad}</${Comp}>`;
}

const registry = {};
for (const [, id, viewBox, inner] of symbols) {
  const name = id.replace(/^i-/, '');
  registry[name] = {
    viewBox,
    nodes: toJsx(inner),
  };
}

const names = Object.keys(registry).sort();
const cases = names
  .map(name => {
    const { viewBox, nodes } = registry[name];
    const body = nodes.map(n => renderNode(n, 8)).join('\n');
    const extra =
      viewBox !== '0 0 24 24' ? `\n        viewBox="${viewBox}"` : '';
    return `    case '${name}':\n      return (\n        <Svg width={size} height={size} viewBox="${viewBox}" fill={fill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}${extra ? '' : ''}>\n${body}\n        </Svg>\n      );`;
  })
  .join('\n');

const file = `/* Auto-generated from REDI-App-UI-Design HTML SVG symbols. Do not edit by hand. */
import React from 'react';
import Svg, { Path, Circle, Rect, Ellipse, G, Line } from 'react-native-svg';
import type { StyleProp, ViewStyle } from 'react-native';

export const ICON_NAMES = ${JSON.stringify(names, null, 2)} as const;

export type IconName = (typeof ICON_NAMES)[number];

export type IconProps = {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  fill?: string;
  filled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Icon({
  name,
  size = 22,
  color = '#1A237E',
  strokeWidth = 2,
  fill = 'none',
  filled,
  style,
}: IconProps) {
  const resolvedFill = filled ? color : fill;
  switch (name) {
${cases}
    default:
      return null;
  }
}
`;

const out = path.resolve('src', 'assets', 'icons', 'Icon.tsx');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, file);
console.log(`Wrote ${names.length} icons to ${out}`);
