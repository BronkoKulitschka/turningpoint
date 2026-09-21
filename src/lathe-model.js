import * as THREE from '../vendor/three/three.module.js';

// Das Asset verwendet Meter, X entlang der Spindel und +Z zum Bediener.
// Werkstücke sind für die Lesbarkeit einheitlich dreifach vergrößert.
export const UNIT = .003, STOCK_X = -.18, AXIS_Y = 1.055;
const SECTORS = 40;
export function toolPoint(p) {
  return new THREE.Vector3(STOCK_X + UNIT * (p.operation === 'face' ? p.faceReference-p.faceDepth : p.z), AXIS_Y,
    UNIT * (p.operation === 'face' ? p.faceR : p.target/2));
}

// Oberfläche des tatsächlich vorhandenen Rotationskörpers. Die Vereinigung
// des axialen Durchmesserprofils und der radialen Planstufen ergibt auch
// teilweise geplante Stirnflächen, ohne Material wieder hinzuzufügen.
export function pieceGeometry(p) {
  const xs = [...new Set([0, ...p.diameters.map((_, i)=>(i+1)*p.stockLength/p.diameters.length), ...p.faces])].sort((a,b)=>a-b);
  const rs = [...new Set([0, ...p.faces.map((_,i)=>(i+1)*p.stockRadius/p.faces.length), ...p.diameters.map(d=>d/2)])].sort((a,b)=>a-b);
  const cells = xs.slice(0,-1).map((x,i)=>rs.slice(0,-1).map((r,k)=>{
    const axial=Math.min(p.diameters.length-1,Math.floor((x+xs[i+1])/2/p.stockLength*p.diameters.length));
    const radial=Math.min(p.faces.length-1,Math.floor((r+rs[k+1])/2/p.stockRadius*p.faces.length));
    return (r+rs[k+1])/2 < p.diameters[axial]/2 && (x+xs[i+1])/2 < p.faces[radial] ? {axial,radial} : null;
  }));
  const positions=[], colors=[];
  const base=new THREE.Color(p.material==='brass'?0xb99a4c:p.material==='c45'?0x829ba4:0xc5d2cf);
  const vertex=(x,r,a)=>[STOCK_X+x*UNIT, AXIS_Y+Math.sin(a)*r*UNIT, Math.cos(a)*r*UNIT];
  const quad=(a,b,c,d,ra,sector)=>{
    const shade=1-Math.min(.3,ra*.012)*(sector%3===0?1:.25);
    for(const v of [a,b,c,a,c,d]){positions.push(...v);colors.push(base.r*shade,base.g*shade,base.b*shade);}
  };
  cells.forEach((row,i)=>row.forEach((cell,k)=>{
    if(!cell)return;
    const x0=xs[i],x1=xs[i+1],r0=rs[k],r1=rs[k+1];
    for(let s=0;s<SECTORS;s++){
      const a=s/SECTORS*Math.PI*2,b=(s+1)/SECTORS*Math.PI*2;
      if(!cells[i+1]?.[k])quad(vertex(x1,r0,b),vertex(x1,r1,b),vertex(x1,r1,a),vertex(x1,r0,a),p.faceSurface[cell.radial],s);
      if(!cells[i-1]?.[k])quad(vertex(x0,r0,a),vertex(x0,r1,a),vertex(x0,r1,b),vertex(x0,r0,b),p.faceSurface[cell.radial],s);
      if(!row[k+1])quad(vertex(x0,r1,a),vertex(x1,r1,a),vertex(x1,r1,b),vertex(x0,r1,b),p.surface[cell.axial],s);
      if(r0>0&&!row[k-1])quad(vertex(x0,r0,b),vertex(x1,r0,b),vertex(x1,r0,a),vertex(x0,r0,a),p.surface[cell.axial],s);
    }
  }));
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.computeVertexNormals();g.computeBoundingSphere();return g;
}

function cutterGeometry(kind) {
  const shape=new THREE.Shape();
  shape.moveTo(0,0);
  if(kind==='finish'){shape.quadraticCurveTo(.003,-.005,.012,-.008);}
  else shape.lineTo(kind==='face'?0:.015,-.008);
  shape.lineTo(.105,-.008);shape.lineTo(.105,.008);shape.lineTo(.014,.008);shape.closePath();
  const g=new THREE.ExtrudeGeometry(shape,{depth:.014,bevelEnabled:false,steps:1,curveSegments:5});
  // Shape XY -> machine XZ; thickness extends downwards from spindle height.
  g.rotateX(Math.PI/2);return g;
}

export function bindLathe(root) {
  const names=['Chuck_Rotation','LeadScrew_Rotation','Carriage_Travel','CrossSlide_Travel','CarriageHandwheel','CrossFeedHandwheel','Workpiece','HSS_Tool'];
  const nodes=Object.fromEntries(names.map(name=>{const n=root.getObjectByName(name);if(!n)throw Error('Bauteil fehlt: '+name);return [name,n];}));
  nodes.Workpiece.visible=false;nodes.HSS_Tool.visible=false;
  const stock=new THREE.Mesh(new THREE.BufferGeometry(),new THREE.MeshStandardMaterial({vertexColors:true,metalness:.5,roughness:.45,side:THREE.DoubleSide}));
  // Geometrie hat Weltkoordinaten. Rotation um die Spindelmitte.
  const spindle=new THREE.Group();spindle.position.set(0,AXIS_Y,0);root.add(spindle);spindle.add(stock);stock.position.y=-AXIS_Y;
  const tool=new THREE.Mesh(cutterGeometry('rough'),new THREE.MeshStandardMaterial({color:0xd8bc74,metalness:.65,roughness:.3}));root.add(tool);
  const gauge=new THREE.Group();root.add(gauge);
  const gaugeMaterial=new THREE.MeshStandardMaterial({color:0xd0e0de,metalness:.5,roughness:.3});
  const box=(x,y,z)=>new THREE.Mesh(new THREE.BoxGeometry(x,y,z),gaugeMaterial);
  const bar=box(.004,.15,.006),upper=box(.008,.004,.07),lower=box(.008,.004,.07);
  gauge.add(bar,upper,lower);bar.position.z=.057;upper.position.z=lower.position.z=.025;
  let geometryKey='',cutter='',angle=0;
  return {
    root,stock,tool,gauge,nodes,
    sync(w,o,dt=0) {
      const p=o?.piece,clamped=p&&['material','prepared','machining'].includes(o.status);
      stock.visible=!!clamped;tool.visible=!!clamped;gauge.visible=false;
      if(!clamped)return;
      const spinning=o.status==='machining'&&!o.paused;
      // Bewusst verlangsamte Darstellung gegen Stroboskopeffekt; Spiel-RPM unverändert.
      if(spinning)angle=(angle+dt*Math.PI*2*w.settings.rpm/60*.12)%(Math.PI*2);
      nodes.Chuck_Rotation.rotation.x=angle;spindle.rotation.x=angle;
      nodes.LeadScrew_Rotation.rotation.x=p.z*Math.PI/2;
      const point=toolPoint(p);tool.position.copy(point);
      nodes.Carriage_Travel.position.x=point.x+.1595;
      nodes.CrossSlide_Travel.position.z=point.z+.022;
      nodes.CarriageHandwheel.rotation.z=-p.z*Math.PI/5;
      nodes.CrossFeedHandwheel.rotation.z=(p.operation==='face'?p.faceR:p.depth)*Math.PI;
      if(cutter!==w.cutter){tool.geometry.dispose();tool.geometry=cutterGeometry(w.cutter);cutter=w.cutter;}
      const key=JSON.stringify([p.material,p.revision,p.diameters,p.surface,p.faces,p.faceSurface]);
      if(key!==geometryKey){stock.geometry.dispose();stock.geometry=pieceGeometry(p);geometryKey=key;}
      const measured=!spinning&&p.reading&&p.reading.revision===p.revision&&p.reading.z===p.probeZ;
      if(measured){gauge.visible=true;gauge.position.set(STOCK_X+p.probeZ*UNIT,AXIS_Y,0);upper.position.y=p.reading.diameter*UNIT/2+.002;lower.position.y=-upper.position.y;}
    },
    dispose(){root.traverse(o=>{o.geometry?.dispose();const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>m?.dispose());});}
  };
}
