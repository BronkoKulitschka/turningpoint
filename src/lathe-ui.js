import { qualityReport } from './machining.js?v=006';
const decimal=(n,d=2)=>n.toLocaleString('de-DE',{minimumFractionDigits:d,maximumFractionDigits:d});
const safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function measurementText(p){
 if(!p.reading)return 'Noch kein Messwert. Messstelle wählen und Messschieber anlegen.';
 return `Ø ${decimal(p.reading.diameter)} mm bei Z ${decimal(p.reading.z,1)} mm${p.reading.revision!==p.revision?' · vor weiterem Abtrag gemessen':''}${p.reading.z!==p.probeZ?' · andere Messstelle ausgewählt':''}`;
}
export function machineReadout(w,o,j){
 const p=o.piece;if(!p)return '';
 const x=z=>86+z/j.length*390,y=d=>122-d*2.5;
 const top=p.diameters.map((d,i)=>`${86+i*390/p.diameters.length},${y(d)} ${86+(i+1)*390/p.diameters.length},${y(d)}`).join(' ');
 const bottom=[...p.diameters].reverse().map((d,i)=>`${476-i*390/p.diameters.length},${244-y(d)} ${476-(i+1)*390/p.diameters.length},${244-y(d)}`).join(' ');
 const spinning=o.status==='machining'&&!o.paused;
 const cutting=spinning&&p.feeding!==0&&p.load>0;
 const measured=p.reading&&p.reading.revision===p.revision&&p.reading.z===p.probeZ&&!spinning;
 const caliper=measured?`<g class="caliper" stroke="#c9d1c6" fill="none" stroke-width="4"><path d="M${x(p.probeZ)+15} 38v158"/><path d="M${x(p.probeZ)-14} ${y(p.reading.diameter)-9}h30v9h-30zM${x(p.probeZ)-14} ${244-y(p.reading.diameter)}h30v9h-30z" fill="#708f8e" stroke-width="2"/></g>`:'';
 return `<svg class="cutaway ${cutting?'is-cutting':''}" viewBox="0 0 560 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Werkstück und sichtbarer Meißel bei Längsposition ${decimal(p.z,1)} Millimeter">
 <defs><linearGradient id="stock-metal" x2="0%" y2="100%"><stop stop-color="#ced6c6"/><stop offset=".4" stop-color="#85988b"/><stop offset=".5" stop-color="#c6cec0"/><stop offset="1" stop-color="#55685f"/></linearGradient></defs>
 <rect x="1" y="1" width="558" height="238" rx="8" fill="#162721" stroke="#566c57" stroke-width="2"/>
 <path d="M20 210H535v20H20z" fill="#435d46"/><path d="M20 218h515M20 226h515" stroke="#b2b99c" stroke-width="2"/>
 <rect x="23" y="55" width="65" height="136" rx="6" fill="#6c7c69" stroke="#1b2820" stroke-width="6"/>
 <rect x="69" y="45" width="20" height="38" fill="#aeb6a1"/><rect x="69" y="163" width="20" height="38" fill="#aeb6a1"/>
 <polygon points="${top} ${bottom}" fill="url(#stock-metal)" stroke="#d2d3b7" stroke-width="1.5"/>
 <path d="M90 122H502" stroke="#cdd9c5" stroke-dasharray="8 5" opacity=".3"/>
 <g class="cutting-tool"><path d="M${x(p.z)} ${y(p.target)}l-9-22h18z" fill="#e5b66b" stroke="#fff0bf"/><rect x="${x(p.z)-10}" y="${y(p.target)-50}" width="20" height="28" fill="#79886f"/></g>
 ${cutting?`<path class="cut-chips" d="M${x(p.z)+4} ${y(p.target)-3}q15-22 22-12m-13-9 8-8m-4 31 10-3" fill="none" stroke="#e4ce8c" stroke-width="2"/>`:''}${!spinning&&!measured?`<path d="M${x(p.probeZ)} 42v155" stroke="#81b9bb" stroke-dasharray="3 5" opacity=".65"/>`:''}${caliper}
 <text x="104" y="24" fill="#cfceb3" font-size="11" font-family="monospace">${cutting?'MEISSEL IM SCHNITT':spinning?'SPINDEL AN':'SPINDEL STEHT'}</text>
 <text x="105" y="203" fill="#c7c8aa" font-size="10" font-family="monospace">Z ${decimal(p.z,1)} mm · Last ${decimal(spinning?p.load:0,0)} % · ${decimal(p.heat,0)} °C</text>
 <text x="500" y="125" fill="#a5b798" font-size="10" font-family="monospace">Z →</text></svg>`;
}
export function latheControls(w,o,j){
 const p=o?.piece,engaged=o?.status==='machining',spinning=engaged&&!o.paused;
 const working=!!p&&['prepared','machining'].includes(o.status),adjustable=working&&!spinning;
 const report=p&&o.measured?qualityReport(o,j):null;
 const btn=(a,t,disabled=false)=>`<button class="shop-button" data-work="${a}" ${disabled?'disabled':''}>${t}</button>`;
 if(!p)return '<div class="lathe-extras"><p>Wähle am Materialständer einen Rohling und lege am Wagen das Werkzeug bereit.</p><button class="shop-button" data-station="rack">Zum Materialständer →</button></div>';
 return `<div class="lathe-console">
 <div id="machine-live">${machineReadout(w,o,j)}</div>
 <div class="direct-controls" aria-label="Direkte Drehbankbedienung">
 <div class="drive-row"><button type="button" data-feed="-1" ${spinning?'':'disabled'} aria-label="Vorschub nach links halten">◀ Z− <small>halten</small></button>${engaged?btn('pause',o.paused?'● Spindel an':'■ Spindel aus'):btn('start','● Spindel an',!working)}<button type="button" data-feed="1" ${spinning?'':'disabled'} aria-label="Vorschub nach rechts halten">Z+ ▶ <small>halten</small></button></div>
 <div class="depth-row"><label for="cut-depth">Schnitttiefe <small>mm radial</small></label><input id="cut-depth" type="number" min="0" max="3" step="0.01" inputmode="decimal" value="${p.depth.toFixed(3)}" ${working?'':'disabled'}>${[-.1,-.01,.01,.1].map(n=>`<button data-work="depth-step" data-arg="${n}" ${working?'':'disabled'} aria-label="Schnitttiefe um ${decimal(Math.abs(n))} Millimeter ${n>0?'erhöhen':'verringern'}">${n>0?'+':'−'}${decimal(Math.abs(n))}</button>`).join('')}</div>
 <div class="measure-row"><label for="probe-position">Messstelle Z<input id="probe-position" type="range" min="0" max="${j.length}" step="0.5" value="${p.probeZ}" ${adjustable?'':'disabled'}></label>${btn('measure-lathe','Messschieber anlegen',!adjustable)}</div>
 <output id="lathe-reading" class="lathe-reading" aria-live="polite">${safe(measurementText(p))}</output>
 </div></div>
 <div class="lathe-extras">
 <p id="cut-notice" class="shop-note">${safe(p.notice)}</p>
 <div class="setup-row">${btn('touch','Hier antasten · Zustellung nullen',!adjustable)}<label for="tool-position">Schlitten positionieren · Z<input id="tool-position" type="range" min="0" max="${j.length}" step="0.25" value="${p.z}" ${adjustable?'':'disabled'}></label></div>
 <p class="shop-note">Zum Schneiden Z− oder Z+ halten. Schnitttiefe während der Arbeit mit +/− ändern. Zum Messen die Spindel stoppen. 0,10 mm radial entspricht ungefähr 0,20 mm Durchmesser-Abtrag.</p>
 <form id="machine-settings"><div class="settings-pair"><label>Drehzahl<select name="rpm" ${spinning?'disabled':''}>${[300,450,800,1200].map(n=>`<option value="${n}" ${w.settings.rpm===n?'selected':''}>${n} U/min</option>`).join('')}</select></label><label>Vorschub<select name="feed" ${spinning?'disabled':''}>${[.05,.1,.2,.3].map(n=>`<option value="${n}" ${w.settings.feed===n?'selected':''}>${decimal(n)} mm/U</option>`).join('')}</select></label></div><label class="coolant-switch"><input type="checkbox" name="coolant" ${w.settings.coolant?'checked':''} ${spinning?'disabled':''}> Kühlung einschalten</label><button class="shop-button subtle" type="submit" ${spinning?'disabled':''}>Schnittwerte einstellen</button></form>
 ${engaged?btn('finish-cut','Werkstück ausspannen',!o.paused):''}
 ${o.status==='machined'?'<button class="shop-button" data-station="vise">Zum Entgraten →</button>':''}
 ${['deburred','checked'].includes(o.status)&&report?btn('rework',report.ok?'Für mehr Genauigkeit nacharbeiten':'Dasselbe Teil nacharbeiten',report.undersize||p.material!==j.material):''}
 ${report?`<p class="quality ${report.ok?'passed':'failed'}">${report.ok?'Prüfung bestanden.':report.reasons.join(' ')}</p>`:''}
 <details class="machine-help"><summary>Arbeitsweise & Versorgung</summary><p>Die Zeichnung liegt beim Auftrag am Schreibtisch. An der Maschine gibt es keine Sollkontur. Miss an mehreren Stellen, stelle zu und führe den Meißel über die gewünschte Länge. Ein Messergebnis gilt nur für die gewählte Stelle.</p><p>Die Schnitttiefe bezieht sich auf die zuletzt angetastete Oberfläche. Antasten setzt sie auf null; es trägt nichts ab. Für einen weiteren Schnitt neu antasten oder die Zustellung bewusst erhöhen. Zurückstellen ersetzt kein Material.</p><p>Die Länge ist zugesägt. Maßabweichung, Riefen und falsches Material werden bei der Abnahme geprüft. Innerhalb der Toleranz bringt höhere Genauigkeit bis zu 50 % Bonus auf den Grundlohn.</p><p>Verschleiß: ${decimal(w.wear,1)} % · Kühlmittel: ${decimal(w.coolant,0)} %</p>${btn('refill-coolant','Kühlmittel auffüllen · 6 €',spinning||w.coolant>=100||w.money<6)}${btn('light',w.light?'Arbeitslicht ausschalten':'Arbeitslicht einschalten')}<label class="scrap-confirm"><input id="confirm-scrap" type="checkbox"> Dieses Werkstück endgültig verwerfen</label><button id="scrap-piece" class="shop-button danger" data-work="scrap-piece" disabled>Als Ausschuss weglegen</button><p class="shop-note">Vereinfachte Spielsimulation. Die Messwerte sind Spielwerte.</p></details>
 </div>`;
}
