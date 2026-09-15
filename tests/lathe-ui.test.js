import test from 'node:test';
import assert from 'node:assert/strict';
import {freshWorkshop,act,activeOrder,JOBS,advance} from '../src/workshop-state.js';
import {latheControls,machineReadout,measurementText} from '../src/lathe-ui.js';
function prepared(){const w=freshWorkshop();act(w,'accept','bolt');act(w,'select-material','aluminium');act(w,'prepare');return w;}
test('Maschinenansicht verrät weder Sollkontur noch Live-Durchmesser',()=>{
 const w=prepared(),o=activeOrder(w),html=latheControls(w,o,JOBS[0]);
 assert.doesNotMatch(html,/Ziel-Ø|Soll Ø|Ø AM MEISSEL|Ø min \/ max|20,00|20\.00/);
 assert.match(html,/Noch kein Durchmesser-Messwert/);assert.doesNotMatch(machineReadout(w,o,JOBS[0]),/Ø/);
 assert.ok(html.indexOf('id="machine-live"')<html.indexOf('class="direct-controls"'));
 assert.ok(html.indexOf('id="cut-depth"')<html.indexOf('class="lathe-extras"'));
 assert.ok(html.indexOf('data-work="measure-lathe"')<html.indexOf('class="lathe-extras"'));
});
test('Nur der aktiv ermittelte Messwert wird angezeigt; weiterer Abtrag macht ihn alt',()=>{
 const w=prepared(),o=activeOrder(w);act(w,'measure-lathe');assert.match(measurementText(o.piece),/Ø 24,00 mm bei Z 0,0/);
 assert.match(machineReadout(w,o,JOBS[0]),/class="caliper"/);act(w,'depth',.5);act(w,'start');act(w,'feed',1);advance(w,500);
 assert.match(measurementText(o.piece),/Ø 24,00.*vor weiterem Abtrag/);assert.doesNotMatch(machineReadout(w,o,JOBS[0]),/class="caliper"/);
});
