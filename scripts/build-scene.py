from pathlib import Path
import random,json
R=random.Random(1968)
def poly(points,color,stroke='#242e29',width=2):
 return f'<polygon points="{points}" fill="{color}" stroke="{stroke}" stroke-width="{width}" stroke-linejoin="round"/>'
def box(x,y,w,d,h,front='#596b50',side='#364b3c',top='#899178'):
 return poly(f'{x},{y-h} {x+w},{y+w*.5-h} {x+w+d},{y+w*.5-d*.5-h} {x+d},{y-d*.5-h}',top)+poly(f'{x},{y-h} {x+w},{y+w*.5-h} {x+w},{y+w*.5} {x},{y}',front)+poly(f'{x+w},{y+w*.5-h} {x+w+d},{y+w*.5-d*.5-h} {x+w+d},{y+w*.5-d*.5} {x+w},{y+w*.5}',side)
def path(d,c='#313b30',w=3):return f'<path d="{d}" fill="none" stroke="{c}" stroke-width="{w}" stroke-linecap="round"/>'
def ellipse(x,y,rx,ry,c,stroke='#29332b',sw=2):return f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="{c}" stroke="{stroke}" stroke-width="{sw}"/>'
def text(x,y,t,size=10,c='#c8c3a0'):return f'<text x="{x}" y="{y}" fill="{c}" font-size="{size}" font-family="monospace">{t}</text>'
parts={}
parts['desk']=box(-130,0,250,90,130,'#635139','#3d392b','#9b7b4a')
for yy in [-27,-53,-79]:parts['desk']+=path(f'M-120 {yy}l70 35','#a38a5b',3)+path(f'M-104 {yy+8}l22 11','#363e32',3)
parts['desk']+=poly('-25,-54 97,7 97,-34 -25,-95','#32392d')
for i in range(23):
 x=R.randrange(-120,110);y=-130+x*.5+R.randrange(-32,0);parts['desk']+=path(f'M{x} {y}l{R.randrange(5,26)} 8','#bd9b64',1)
parts['desk']+=ellipse(4,-171,11,5,'#dad0b0')+path('M-7-171v22q11 8 22 0v-22','#dad0b0',3)+path('M15-169q16 3 2 15','#dad0b0',3)
parts['lathe']=box(-130,-18,48,55,90)+box(55,75,54,55,90)
parts['lathe']+=box(-143,-35,260,63,32,'#557751','#304d3c','#8e997e')
for y in [-80,-63]:parts['lathe']+=path(f'M-95 {y}l206 103','#bcc1ac',7)+path(f'M-95 {y+7}l206 103','#2d4237',3)
parts['lathe']+=box(-143,-70,57,65,87,'#65845a','#36583e','#84986b')
parts['lathe']+=ellipse(-57,-117,22,31,'#a1aba0')+ellipse(-49,-115,17,27,'#637b70')
parts['lathe']+='<g class="chuck-spin" style="transform-origin:-49px -115px">'+path('M-49-139v48M-65-115h32','#cad0ba',5)+ellipse(-49,-115,6,9,'#263e33')+'</g>'
parts['lathe']+=path('M-43-114l121 61','#c1c2a7',10)
parts['lathe']+=box(66,29,42,44,46,'#618257','#365d41','#8d9e7b')+path('M71-20L54-30','#c0c6b0',8)+ellipse(139,14,12,18,'none','#c0c5aa',4)
parts['lathe']+='<g class="carriage-travel">'+box(-11,0,43,62,23,'#65876b','#374e3e','#9caa94')+box(6,-26,18,30,23,'#7b8f79','#536a56','#b4b8a0')+path('M26-50v-25m-12-7 28 15','#2f3c31',5)+box(-19,20,48,15,26)+ellipse(1,14,15,21,'none','#b9c0a5',4)+path('M1-5v38m-10-29 20 16','#b9c0a5',3)+'</g>'
parts['lathe']+=ellipse(-123,-96,7,9,'#c0bea1')+ellipse(-99,-85,5,7,'#c0bea1')+path('M-129-142l30 14','#bdb38a',5)
for i in range(25):
 x=R.randrange(-140,-90);y=R.randrange(-145,-74)+int((x+140)*.45);parts['lathe']+=f'<rect x="{x}" y="{y}" width="{R.randrange(2,6)}" height="2" fill="#93653f"/>'
parts['lathe']+=path('M-75-177v-66l39-25','#24352a',5)+ellipse(-35,-265,8,6,'#788974')+poly('-48,-267 -20,-271 -6,-250 -47,-245','#435a3b')+path('M-44-246l33-5','#edcf7d',4)
parts['storage']=''
for x,y in [(-95,5),(25,65),(83,36)]:parts['storage']+=box(x,y,8,8,280,'#716044','#403e2e','#9c8458')
for y in [-230,-162,-94,-25]:
 parts['storage']+=box(-98,y,125,65,8,'#8c7047','#514a32','#a98c5a')
 for i in range(3):parts['storage']+=box(-84+i*35,y-9+i*17,25,25,30+i*5,'#857246','#554f33','#baa069')
parts['tools']=box(-52,0,82,50,202,'#546b51','#334a3b','#8b9074')
for y in [-165,-138,-110,-82,-39]:parts['tools']+=path(f'M-46 {y}l65 32','#afb199',5)+path(f'M-40 {y+10}l60 30','#273e30',2)
parts['tools']+=box(-29,-205,25,25,22,'#7a6845','#514a33','#9b895f')
parts['rack']=''
for x,y in [(-72,0),(80,77),(133,46)]:parts['rack']+=box(x,y,8,8,160,'#4e5b4e','#2c4034','#9c9f83')
for level in [-115,-65,-15]:
 parts['rack']+=box(-75,level,158,57,7,'#66765e','#3c5140','#8a957b')
 for i in range(5):
  col=['#aab8ac','#7a8986','#baa46b'][i%3]
  parts['rack']+=path(f'M{-57+i*8} {level-13-i*4}l137 69',col,10)+ellipse(80+i*8,level+56-i*4,5,6,col)
parts['cart']=box(-54,0,110,60,78,'#4c7050','#294936','#70886a')+poly('-44,-10 45,34 45,-5 -44,-49','#293d30')+box(-60,-79,122,68,8,'#798762','#3f563c','#8a8e69')
for x,y in [(-44,5),(49,50),(110,21)]:parts['cart']+=ellipse(x,y,8,11,'#29372d')
parts['cart']+=path('M-33-110l62 30','#b2b9a1',5)+box(40,-57,17,17,27,'#9b723f','#604a2b','#b6995b')
parts['vise']=box(-20,0,40,23,16,'#697b78','#354d46','#b3b9a4')+box(-18,-10,12,20,35,'#81918a','#475e51','#b8bcac')+box(10,4,15,20,33,'#81918a','#475e51','#b8bcac')+path('M12-9l35 15m0-10v24','#adb9a5',5)
parts['measure']=poly('-45,-24 22,9 62,-14 -6,-48','#d6c69c')+path('M-31-28l35 18m-32-12 26 13m-27-6 17 8','#8e815d',2)+path('M-7-17l46 23m-38-27v15m30-2v15','#b5bda8',4)
parts['radio']=box(-34,57,64,25,62,'#556c4c','#364b36','#7e8d68')+box(-25,0,46,20,38,'#7f6843','#4a4931','#b39a65')+poly('-19,-30 2,-19 2,-3 -19,-14','#313f32')+ellipse(13,-7,5,7,'#c5b485')+path('M35-34l7-43','#bac0a6',2)
parts['clean']=poly('-23,-2 -18,-47 19,-47 23,-2','#64715e')+ellipse(0,-47,19,8,'#2b3b2e')+path('M29-8l18-118','#ba9860',5)+poly('21,-13 42,-3 42,17 15,4','#a69659')
parts['build']=poly('-32,-85 22,-61 22,7 -32,-20','#998055')+poly('-27,-78 17,-58 17,-2 -27,-23','#b1bb9a')+path('M-19-65l29 13v32l-29-13zm14 7v33m-14-18 27 12','#5c7667',2)
parts['cat']=ellipse(0,0,34,17,'#826e48')+ellipse(0,-9,26,14,'#b5945b')+ellipse(-20,-17,13,11,'#c4a269')+poly('-31,-20 -32,-34 -19,-24 -10,-30 -9,-15','#c4a269')+path('M16-16q30 16 0 18l-13-5','#dec087',7)+path('M-27-17h5m5 2h5','#494c36',2)
# Architectural shell plus worn concrete, repeated bricks and timber.
shell=poly('30,465 425,235 1160,659 765,889','#a39d80')+poly('30,465 765,889 765,903 30,480','#6d7160')+poly('765,889 1160,659 1160,674 765,903','#4f5c4b')
shell+='<g clip-path="url(#floor)">'
for i in range(370):
 x=R.randrange(30,1160);y=R.randrange(245,900);c=R.choice(['#b6af91','#797e68','#646c59','#8b886e']);shell+=f'<rect x="{x}" y="{y}" width="{R.randrange(2,12)}" height="{R.randrange(1,5)}" fill="{c}" opacity=".6"/>'
shell+='</g>'
shell+=poly('30,465 425,235 425,15 30,245','#a49d81')+poly('425,235 1160,659 1160,409 425,15','#868b75')
shell+='<g clip-path="url(#walls)" opacity=".36" stroke="#5a6656" stroke-width="2">'
for y in range(40,700,28):shell+=f'<path d="M0 {y}H1200"/>'
for row,y in enumerate(range(40,700,28)):
 for x in range(-40+(row%2)*30,1200,60):shell+=f'<path d="M{x} {y}v28"/>'
shell+='</g>'
shell+=poly('20,242 425,6 1170,401 1158,414 425,26 34,255','#5f4e34')+path('M425 23v212M33 254v212M1157 415v242','#5d5037',14)
# Window and warm shaft of sunlight.
shell+='<g transform="translate(0 -48)">'
shell+=poly('110,273 276,177 276,365 110,461','#665c3b')+poly('121,277 265,194 265,357 121,440','#d6bc77')+path('M193 235v164M124 355l140-82','#7f6b42',10)+poly('112,451 278,354 294,363 128,459','#b09a62')
shell+='</g>'
shell+=poly('125,402 266,320 650,546 500,627','#e5c884','none',0).replace('/>',' opacity=".12"/>')
shell+=poly('465,118 755,279 755,394 465,233','#87724d')
for i in range(17):
 x=480+i*15;y=153+i*8.5;shell+=path(f'M{x} {y}v55m-5-61 5 7 5-3','#b2b99e',3)
shell+=box(476,111,230,25,8,'#796044','#474837','#a28d5c')
for i in range(7):shell+=box(486+i*32,103+i*16,19,20,26,'#837043','#4a4c32','#aca063')
shell+=text(795,345,'WAGNER',12,'#c6bd93')
shell+=path('M34 271q60 32 20 70m-18-62 39 31m-37-9 19 26M429 41q54 5 62 46m-45-35 2 32m7-24 24 7','#c5bb9380',1)
# The static objects are separate modules, positioned by persisted layout coordinates.
header='<defs><clipPath id="floor"><polygon points="30,465 425,235 1160,659 765,889"/></clipPath><clipPath id="walls"><polygon points="30,465 425,235 425,15 30,245"/><polygon points="425,235 1160,659 1160,409 425,15"/></clipPath></defs>'
Path('turningpoint-web/src/scene.js').write_text('export const SCENE_DEFS = '+json.dumps(header)+';\nexport const ROOM_SHELL = '+json.dumps(shell)+';\nexport const OBJECT_ART = '+json.dumps(parts)+';\n')
