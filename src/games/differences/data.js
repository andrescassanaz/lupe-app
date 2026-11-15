// Each side is a complete image. Rectangles bound the only edited pixels (960px reference).
export const SCENES = [
 {id:'garden',name:'Un picnic en el jardín',spots:[
  {label:'El centro de la flor del árbol',rect:[818,173,870,215]},
  {label:'El botón del vestido',rect:[385,662,416,690],source:'garden-button-edited.png'},
  {label:'La servilleta de la canasta',rect:[459,641,552,695]},
  {label:'La taza junto al conejo',rect:[302,738,368,792]},
  {label:'El dibujo de la taza violeta',rect:[637,741,681,786]},
  {label:'Las uvas del plato',rect:[494,752,548,791]},
  {label:'La flor del estanque',rect:[877,714,941,755]},
 ]},
 {id:'beach',name:'Un día en la playa',spots:[
  {label:'El dibujo del balde',rect:[666,702,747,773]},
  {label:'La bandera del velero',rect:[144,73,196,107]},
  {label:'Un rayo del sol',rect:[716,64,780,97]},
  {label:'El botón del zorro',rect:[211,597,244,630]},
  {label:'La bandera de la torre derecha',rect:[563,520,629,568]},
  {label:'El color de la caracola',rect:[36,784,192,917]},
  {label:'La ventana de la torre central',rect:[443,599,489,648]},
 ]},
].map(scene=>({...scene,spots:scene.spots.map(spot=>({...spot,x:(spot.rect[0]+spot.rect[2])/1920,y:(spot.rect[1]+spot.rect[3])/1920,width:(spot.rect[2]-spot.rect[0])/960,height:(spot.rect[3]-spot.rect[1])/960}))}));
export const sceneImage=(id,side=0)=>new URL(`./assets/images/${id}${side?'-changed':''}.png`,import.meta.url).href;
// Resolve nearby touch targets geometrically, so overlapping finger-sized areas do not hide details.
export function spotAt(spots,x,y,pictureSize){
 let nearest=-1,distance=Infinity;
 spots.forEach((spot,i)=>{const dx=Math.abs(x-spot.x),dy=Math.abs(y-spot.y),rx=Math.max(spot.width/2+.012,22/pictureSize),ry=Math.max(spot.height/2+.012,22/pictureSize),d=Math.hypot(dx,dy);if(dx<=rx&&dy<=ry&&d<distance){nearest=i;distance=d;}});
 return nearest;
}
