export const LEVELS=[{count:6,cols:3,rows:2},{count:12,cols:4,rows:3},{count:20,cols:5,rows:4}];
export function edges(row,col,rows,cols){return {top:row===0?0:((row-1+col)%2?-1:1)*-1,right:col===cols-1?0:((row+col)%2?1:-1),bottom:row===rows-1?0:((row+col)%2?-1:1),left:col===0?0:((row+col-1)%2?1:-1)*-1};}
export function shuffledIds(count,random=Math.random){const result=Array.from({length:count},(_,i)=>i);for(let i=count-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}return result;}
export function canPlace(selected,slot,placed){return Number.isInteger(selected)&&selected===slot&&!placed.includes(slot);}
// Clockwise edges share opposite tabs with their neighboring piece.
export function piecePath(width,height,shape,pad){
 const path=new Path2D();path.moveTo(pad,pad);
 function edge(ax,ay,bx,by,sign){const dx=bx-ax,dy=by-ay;const point=(t,n)=>[pad+ax+dx*t+dy*n*sign,pad+ay+dy*t-dx*n*sign];const line=(t,n=0)=>path.lineTo(...point(t,n));const curve=(a,b,c,d,e,f)=>path.bezierCurveTo(...point(a,b),...point(c,d),...point(e,f));
 if(!sign){line(1);return;}line(.36);curve(.44,0,.44,.04,.40,.08);curve(.26,.28,.74,.28,.60,.08);curve(.56,.04,.56,0,.64,0);line(1);}
 edge(0,0,width,0,shape.top);edge(width,0,width,height,shape.right);edge(width,height,0,height,shape.bottom);edge(0,height,0,0,shape.left);path.closePath();return path;
}
// Keep a grabbable part of the piece on the table; normalized positions survive resizing.
export function dropPosition(x,y,width,height,pieceWidth,pieceHeight){
 const clamp=(value,size,piece)=>Math.max(Math.min(24,piece/2,size/2),Math.min(size-Math.min(24,piece/2,size/2),value))/size;
 return {x:clamp(x,width,pieceWidth),y:clamp(y,height,pieceHeight)};
}
export function snapsToSlot(x,y,slot){return Math.abs(x-slot.left-slot.width/2)<=slot.width*.32&&Math.abs(y-slot.top-slot.height/2)<=slot.height*.32;}
