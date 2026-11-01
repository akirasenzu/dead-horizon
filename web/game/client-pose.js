import {STOREY_HEIGHT} from './building-metrics.js';
export const finitePosition=p=>[p.x,p.y,p.z].every(Number.isFinite);
export function interpolateElevation(position,floor,mix){const n=Number(floor),y=Math.max(0,Number.isFinite(n)?Math.floor(n):0)*STOREY_HEIGHT;position.y=Number.isFinite(position.y)?position.y+(y-position.y)*mix:y;return position.y}
