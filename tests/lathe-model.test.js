import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { GLTFLoader } from '../vendor/three/addons/loaders/GLTFLoader.js';
import { Vector3 } from '../vendor/three/three.module.js';
import { bindLathe, pieceGeometry, toolPoint, UNIT, STOCK_X, AXIS_Y } from '../src/lathe-model.js';
import { blankPiece } from '../src/machining.js';

const job={diameter:20,length:60,material:'aluminium'};
const workshop=()=>({cutter:'rough',settings:{rpm:450}});
const order=()=>({status:'machining',paused:false,piece:blankPiece(job)});
async function model(){const bytes=await readFile(new URL('../assets/models/TurningPoint_Leitspindeldrehbank.glb',import.meta.url));return bindLathe((await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'')).scene);}
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);

test('Gelieferte GLB lädt mit allen Bewegungsknoten; Beispielrohling wird ersetzt',async()=>{
 const rig=await model();assert.equal(rig.nodes.Workpiece.visible,false);assert.equal(rig.nodes.HSS_Tool.visible,false);
 const w=workshop(),o=order(),before=JSON.stringify(o);rig.sync(w,o,.02);
 assert.ok(rig.stock.geometry.attributes.position.count>0);assert.equal(JSON.stringify(o),before);
 assert.ok(rig.nodes.Chuck_Rotation.rotation.x>0);rig.dispose();
});
test('Futter stoppt bei Pause; Vorschub und Zustellung bewegen die passenden Achsen',async()=>{
 const rig=await model(),w=workshop(),o=order();rig.sync(w,o,.02);const angle=rig.nodes.Chuck_Rotation.rotation.x;
 o.paused=true;o.piece.z=30;o.piece.depth=1;o.piece.target=22;rig.sync(w,o,.5);
 near(rig.nodes.Chuck_Rotation.rotation.x,angle);near(rig.tool.position.x,STOCK_X+30*UNIT);near(rig.tool.position.z,11*UNIT);
 near(rig.nodes.Carriage_Travel.position.x-.1595,rig.tool.position.x);
 near(rig.nodes.CrossSlide_Travel.position.z-.022,rig.tool.position.z);
 o.piece.operation='face';o.piece.faceReference=66;o.piece.faceDepth=1.2;o.piece.faceR=4;rig.sync(w,o);
 near(rig.tool.position.x,STOCK_X+64.8*UNIT);near(rig.tool.position.z,4*UNIT);rig.dispose();
});
test('3D-Werkstück enthält reales Durchmesserprofil und die gekürzte Stirnfläche',()=>{
 const p=blankPiece(job);p.diameters.fill(20);p.faces.fill(60);const g=pieceGeometry(p);g.computeBoundingBox();
 near(g.boundingBox.min.x,STOCK_X);near(g.boundingBox.max.x,STOCK_X+60*UNIT);
 near(g.boundingBox.max.y-AXIS_Y,10*UNIT);near(g.boundingBox.min.y-AXIS_Y,-10*UNIT);g.dispose();
});
test('Teilweise geplante Stirnfläche bleibt gestuft und zeigt keinen vollständigen Kürzungssprung',()=>{
 const p=blankPiece(job);p.faces.fill(60,6);const g=pieceGeometry(p),a=g.attributes.position;
 const end=STOCK_X+66*UNIT,cut=STOCK_X+60*UNIT;
 let outerAtCut=false,innerAtEnd=false;
 for(let i=0;i<a.count;i++){const r=Math.hypot(a.getY(i)-AXIS_Y,a.getZ(i))/UNIT;
   if(Math.abs(a.getX(i)-end)<1e-6){assert.ok(r<=6.0001);innerAtEnd=true;}
   if(Math.abs(a.getX(i)-cut)<1e-6&&r>6.1)outerAtCut=true;
 }
 assert.ok(outerAtCut&&innerAtEnd);g.dispose();
});
test('Stirnflächennormalen zeigen außen; Geometrie enthält keine ungültigen Koordinaten',()=>{
 const p=blankPiece(job),g=pieceGeometry(p),a=g.attributes.position,n=g.attributes.normal;
 let cap=0;for(let i=0;i<a.count;i++){assert.ok(Number.isFinite(a.getX(i)+a.getY(i)+a.getZ(i)));
 if(Math.abs(a.getX(i)-(STOCK_X+p.stockLength*UNIT))<1e-6&&Math.abs(n.getX(i))>.9){assert.ok(n.getX(i)>0);cap++;}}
 assert.ok(cap>0);g.dispose();
});
test('Messschieber erscheint nur für eine aktuelle aktive Messung bei stehender Spindel',async()=>{
 const rig=await model(),w=workshop(),o=order();o.paused=true;rig.sync(w,o);assert.equal(rig.gauge.visible,false);
 o.piece.probeZ=10;o.piece.reading={z:10,diameter:24,revision:0};rig.sync(w,o);assert.equal(rig.gauge.visible,true);
 near(rig.gauge.position.x,STOCK_X+10*UNIT);o.piece.revision++;rig.sync(w,o);assert.equal(rig.gauge.visible,false);
 o.piece.reading.revision++;o.paused=false;rig.sync(w,o);assert.equal(rig.gauge.visible,false);rig.dispose();
});
test('Meißelwechsel tauscht die Schneidengeometrie; Ausspannen entfernt den Rohling',async()=>{
 const rig=await model(),w=workshop(),o=order();rig.sync(w,o);const rough=rig.tool.geometry;
 w.cutter='finish';rig.sync(w,o);assert.notEqual(rig.tool.geometry,rough);
 assert.ok(toolPoint(o.piece).distanceTo(new Vector3(STOCK_X,AXIS_Y,12*UNIT))<1e-9);
 o.status='machined';rig.sync(w,o);assert.equal(rig.stock.visible,false);assert.equal(rig.tool.visible,false);rig.dispose();
});
