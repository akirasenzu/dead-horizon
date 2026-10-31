// Metres. Surveyed physical heights take priority over procedural estimates.
export const STOREY_HEIGHT=3;
export function buildingMetrics(b){
 const surveyed=b.survey||{},small=['garage','garages','service','roof','shed'].includes(b.k);
 const wall=Number(surveyed.wallHeight),levels=Number(surveyed.levels);
 const height=wall>=2&&wall<=70?wall:levels>=1&&levels<=20?levels*STOREY_HEIGHT:small?3.2:Math.max(6,Math.round((Number(b.h)||6)/STOREY_HEIGHT)*STOREY_HEIGHT);
 return{height:Math.max(3,height,Math.min(4,levels||Math.floor((height+.1)/STOREY_HEIGHT))*STOREY_HEIGHT),levels:Math.max(1,Math.min(4,levels>=1?levels:Math.floor((height+.1)/STOREY_HEIGHT))),roofHeight:surveyed.roofHeight,roofShape:surveyed.roofShape};
}
export function geographicPoint(origin,lon,lat,scale=1.3){return{x:(origin[1]-lon)*111320*Math.cos(origin[0]*Math.PI/180)*scale,z:(lat-origin[0])*111320*scale}}
