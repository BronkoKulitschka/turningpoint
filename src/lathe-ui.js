import { qualityReport } from './machining.js?v=005';
const decimal=(n,d=2)=>n.toLocaleString('de-DE',{minimumFractionDigits:d,maximumFractionDigits:d});
const safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function machineReadout(w,o,j){
 const p=o.piece;if(!p)return '';
 const x=z=>86+z/j.length*390,y=d=>122-d*2.5;
 const top=p.diameters.map((d,i)=>`${86+i*390/p.diameters.length},${y(d)} ${86+(i+1)*390/p.diameters.length},${y(d)}`).join(' ');
 const bottom=[...p.diameters].reverse().map((d,i)=>`${476-i*390/p.diameters.length},${244-y(d)} ${476-(i+1)*390/p.diameters.length},${244-y(d)}`).join(' ');
 const q=qualityReport(o,j),index=Math.min(p.diameters.length-1,Math.floor(p.z/j.length*p.diameters.length));
 const speed=Math.PI*p.diameters[index]*w.settings.rpm/1000;
 const cutting=o.status==='machining'&&!o.paused&&p.feeding!==0;
 return `<svg class="cutaway ${cutting?'is-cutting':''}" viewBox="0 0 560 260" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Werkstückprofil und Werkzeug bei ${decimal(p.z)} Millimetern">
 <defs><linearGradient id="stock-metal" x2="0%" y2="100%"><stop stop-color="#ced6c6"/><stop offset=".4" stop-color="#85988b"/><stop offset=".5" stop-color="#c6cec0"/><stop offset="1" stop-color="#55685f"/></linearGradient></defs>
 <rect x="1" y="1" width="558" height="258" rx="8" fill="#162721" stroke="#566c57" stroke-width="2"/>
 <path d="M20 215H535v27H20z" fill="#435d46"/><path d="M20 222h515M20 233h515" stroke="#b2b99c" stroke-width="2"/>
 <rect x="23" y="55" width="65" height="136" rx="6" fill="#6c7c69" stroke="#1b2820" stroke-width="6"/>
 <rect x="69" y="45" width="20" height="38" fill="#aeb6a1"/><rect x="69" y="163" width="20" height="38" fill="#aeb6a1"/>
 <polygon points="${top} ${bottom}" fill="url(#stock-metal)" stroke="#d2d3b7" stroke-width="1.5"/>
 <path d="M85 ${y(j.diameter)}H490M85 ${244-y(j.diameter)}H490" stroke="#e7ad63" stroke-dasharray="5 5" opacity=".8"/>
 <path d="M90 122H502" stroke="#cdd9c5" stroke-dasharray="8 5" opacity=".3"/>
 <path d="M${x(p.z)} ${y(p.target)}l-9-22h18z" fill="#e5b66b" stroke="#fff0bf"/><rect x="${x(p.z)-10}" y="${y(p.target)-50}" width="20" height="28" fill="#79886f"/>
 <text x="104" y="25" fill="#cfceb3" font-size="11" font-family="monospace">${cutting?'SCHNITT AKTIV':o.status==='machining'&&!o.paused?'SPINDEL AN · VORSCHUB AUS':'SPINDEL AUS'}</text>
 <text x="105" y="207" fill="#e7ad63" font-size="11" font-family="monospace">Soll Ø ${decimal(j.diameter)} ± 0,10 mm · L ${j.length} mm</text>
 <text x="500" y="125" fill="#a5b798" font-size="10" font-family="monospace">Z →</text></svg>
 <div class="machine-dials"><div><small>SCHLITTEN Z</small><strong>${decimal(p.z,1)} <em>mm</em></strong></div><div><small>Ø AM MEISSEL</small><strong>${decimal(p.diameters[index])} <em>mm</em></strong></div><div><small>BELASTUNG</small><strong class="${p.load>80?'dial-hot':''}">${decimal(p.load,0)} <em>%</em></strong></div><div><small>TEMPERATUR</small><strong class="${p.heat>80?'dial-hot':''}">${decimal(p.heat,0)} <em>°C</em></strong></div></div>
 <p class="machine-feedback" role="status">${safe(p.notice)}</p>
 <details class="cut-inspection"><summary>Werkstück & Schnitt beobachten</summary><dl class="shop-facts"><div><dt>Ø min / max</dt><dd>${decimal(q.min)} / ${decimal(q.max)} mm</dd></div><div><dt>Oberfläche Ra · max.</dt><dd>${decimal(q.roughness)} / Soll ≤ 3,20 µm</dd></div><div><dt>Schnittgeschwindigkeit</dt><dd>${decimal(speed,1)} m/min</dd></div><div><dt>Werkzeugverschleiß</dt><dd>${decimal(w.wear,1)} %</dd></div><div><dt>Kühlmittel</dt><dd>${decimal(w.coolant,0)} %</dd></div></dl></details>`;
}
export function latheControls(w,o,j){
 const p=o?.piece,engaged=o?.status==='machining',spinning=engaged&&!o.paused;
 const adjustable=!!p&&['prepared','machining'].includes(o.status)&&!spinning;
 const report=p?qualityReport(o,j):null;
 const btn=(a,t,disabled=false)=>`<button class="shop-button" data-work="${a}" ${disabled?'disabled':''}>${t}</button>`;
 return `${p?`<div id="machine-live">${machineReadout(w,o,j)}</div>`:'<p>Wähle zuerst am Materialständer einen Rohling und lege am Werkzeugwagen das Werkzeug bereit.</p>'}
 ${p?`<div class="handwheel"><label for="tool-target">QUERSCHLITTEN · Ziel-Ø <span>kleiner = tieferer Schnitt</span></label><div class="wheel-input"><span aria-hidden="true">◎</span><input id="tool-target" type="number" inputmode="decimal" min="${j.diameter-1}" max="${j.diameter+4.5}" step="0.05" value="${p.target}" ${adjustable?'':'disabled'}><span>mm</span></div><label for="tool-position">LÄNGSSCHLITTEN · bei stehender Spindel positionieren</label><input id="tool-position" type="range" min="0" max="${j.length}" step="0.25" value="${p.z}" ${adjustable?'':'disabled'}></div>`:''}
 <form id="machine-settings"><div class="settings-pair"><label>Drehzahl<select name="rpm" ${spinning?'disabled':''}>${[300,450,800,1200].map(n=>`<option value="${n}" ${w.settings.rpm===n?'selected':''}>${n} U/min</option>`).join('')}</select></label><label>Vorschub<select name="feed" ${spinning?'disabled':''}>${[.05,.1,.2,.3].map(n=>`<option value="${n}" ${w.settings.feed===n?'selected':''}>${decimal(n)} mm/U</option>`).join('')}</select></label></div><label class="coolant-switch"><input type="checkbox" name="coolant" ${w.settings.coolant?'checked':''} ${spinning?'disabled':''}> Kühlung · verbraucht Flüssigkeit</label><button class="shop-button subtle" type="submit" ${spinning?'disabled':''}>Schnittwerte einstellen</button></form>
 <div class="spindle-controls">${engaged?btn('pause',o.paused?'● Spindel einschalten':'■ Spindel stoppen'):btn('start','● Spindel einschalten',o?.status!=='prepared')}</div>
 <div class="feed-controls" role="group" aria-label="Vorschub: Taste gedrückt halten"><button type="button" data-feed="-1" ${spinning?'':'disabled'}>◀ Z−<small>HALTEN</small></button><button type="button" data-feed="1" ${spinning?'':'disabled'}>Z+ ▶<small>HALTEN</small></button></div>
 <p class="shop-note">Vorschubtaste mit Finger, Maus oder Leertaste halten. Loslassen stoppt den Schlitten. Die Spindel allein trägt nichts ab.</p>
 ${btn('light',w.light?'Arbeitslicht ausschalten':'Arbeitslicht einschalten')}
 ${engaged?btn('finish-cut','Werkstück ausspannen',!o.paused):''}
 ${o?.status==='machined'?'<button class="shop-button" data-station="vise">Zum Entgraten →</button>':''}
 ${o?.status==='deburred'&&o.measured&&!report?.ok?btn('rework','Dasselbe Teil nacharbeiten',report.undersize||p.material!==j.material):''}
 ${p&&o?.status==='deburred'&&o.measured?`<p class="quality ${report.ok?'passed':'failed'}">${report.ok?'Prüfung bestanden.':report.reasons.join(' ')}</p>`:''}
 <details class="machine-help"><summary>Schnittplanung & Versorgung</summary><p>Der Rohling hat 4 mm Durchmesser-Aufmaß; seine Länge ist bereits zugesägt. Teile den Abtrag in Schnitte auf. Die gelbe Linie zeigt das Sollmaß.</p><p>Großer Vorschub bewegt schneller, hinterlässt aber Riefen. Tiefe Schnitte belasten die Maschine. Drehzahl und Werkstoff bestimmen die Wärme. Ein letzter flacher Schnitt mit feinem Vorschub verbessert die Oberfläche.</p><p>HSS arbeitet bei niedrigeren Schnittgeschwindigkeiten. Hartmetall verträgt mehr Geschwindigkeit und verschleißt langsamer; der Wechsel kostet 12 €. Kühlung begrenzt Wärme, kostet aber Nachfüllmittel.</p>${btn('refill-coolant','Kühlmittel auffüllen · 6 €',spinning||w.coolant>=100||w.money<6)}${p?`<label class="scrap-confirm"><input id="confirm-scrap" type="checkbox"> Dieses Werkstück endgültig verwerfen</label><button id="scrap-piece" class="shop-button danger" data-work="scrap-piece" disabled>Als Ausschuss weglegen · Rohling verloren</button>`:''}<p class="shop-note">Vereinfachte Spielsimulation mit beschleunigtem Vorschub. Die Anzeigen sind Spielwerte.</p></details>`;
}
