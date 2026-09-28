/* Resolution-independent woodland art, drawn locally without downloaded assets. */
(() => {
  'use strict';
  const TAU = Math.PI * 2;
  const ellipse = (c,x,y,rx,ry,color,rot=0) => { c.fillStyle=color; c.beginPath(); c.ellipse(x,y,rx,ry,rot,0,TAU); c.fill(); };
  const line = (c,x1,y1,x2,y2,color,width=2) => { c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke(); };
  const rect = (c,x,y,w,h,color,r=0) => { c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill(); };
  function pine(c,x,y,h,color) {
    rect(c,x-h*.027,y-h*.72,h*.054,h*.76,color);
    c.fillStyle=color;
    for(let i=0;i<3;i++){const top=y-h+i*h*.22,w=h*(.22+i*.065);c.beginPath();c.moveTo(x,top);c.lineTo(x+w,top+h*.49);c.lineTo(x-w,top+h*.49);c.closePath();c.fill();}
  }
  function mountain(c,points,bottom,color){c.fillStyle=color;c.beginPath();c.moveTo(0,bottom);for(const [x,y]of points)c.lineTo(x,y);c.lineTo(1280,bottom);c.closePath();c.fill();}
  function background(c,s,W) {
    const storm = s.contract?.ambient==='rain' && s.mode!=='menu';
    const amber = s.contract?.ambient==='firefly' && s.mode!=='menu';
    const sky=c.createLinearGradient(0,0,0,620);
    sky.addColorStop(0,storm?'#b2c3c2':amber?'#edd4aa':'#e6e9d1');sky.addColorStop(1,storm?'#dde0ce':'#f8e6bc');c.fillStyle=sky;c.fillRect(0,0,1280,720);
    const sunX=s.mode==='menu'?876:1030;
    ellipse(c,sunX,170,79,79,storm?'#dce0cf':'#f4d69b');
    ellipse(c,sunX,170,94,94,storm?'#dde3d019':'#fff6d025');
    c.save();c.globalAlpha=.55;
    for(let i=0;i<7;i++){const x=((i*231+(s.visualTime||0)*3)%1600)-140,y=65+(i%3)*60;rect(c,x,y,110+(i%2)*35,10,'#fffbed',8);rect(c,x+35,y-8,105,12,'#fffbed',8);}c.restore();
    mountain(c,[[0,367],[104,325],[180,336],[308,227],[367,267],[471,301],[581,247],[731,335],[815,270],[900,214],[965,283],[1086,234],[1190,298],[1280,275]],610,storm?'#9caeaa':'#bbcbb5');
    mountain(c,[[0,416],[143,365],[235,412],[342,337],[457,391],[565,346],[674,370],[756,315],[849,365],[941,352],[1036,390],[1190,332],[1280,372]],640,storm?'#859e96':'#9cb59f');
    c.fillStyle=storm?'#719181':'#7fa28a';c.beginPath();c.moveTo(0,480);c.bezierCurveTo(340,393,459,515,773,440);c.bezierCurveTo(1000,376,1060,474,1280,430);c.lineTo(1280,660);c.lineTo(0,660);c.fill();
    for(let i=0;i<53;i++){const x=i*27+Math.sin(i*7)*12,h=48+Math.sin(i*3.7)*20,y=492+Math.sin(i*.36)*24;pine(c,x,y,h,storm?'#6a8b7e':'#739783');}
    c.fillStyle='#96ac7b';c.beginPath();c.moveTo(0,562);c.bezierCurveTo(230,521,400,585,660,540);c.bezierCurveTo(880,502,1140,561,1280,521);c.lineTo(1280,720);c.lineTo(0,720);c.fill();
    c.strokeStyle='#c7cfac';c.lineWidth=3;c.beginPath();c.moveTo(0,585);c.bezierCurveTo(280,555,610,588,850,565);c.bezierCurveTo(1070,541,1200,560,1280,549);c.stroke();
    for(let x=15;x<1280;x+=55){const y=570+Math.sin(x*.006)*10;rect(c,x,y,4,38,'#c6c5a0',1);line(c,x,y+11,x+54,570+Math.sin((x+55)*.006)*10+11,'#d5d1ad',3);}
    const grass=c.createLinearGradient(0,590,0,720);grass.addColorStop(0,'#91a871');grass.addColorStop(1,'#648654');c.fillStyle=grass;c.fillRect(0,620,1280,100);
    c.fillStyle='#b7b995';c.beginPath();c.moveTo(0,658);c.bezierCurveTo(410,651,760,706,1280,648);c.lineTo(1280,671);c.bezierCurveTo(750,728,400,676,0,680);c.fill();
    for(let i=0;i<170;i++){const x=(i*157.13)%1280,y=607+(i*47.17)%113;c.strokeStyle=i%3?'#718c573e':'#dce0b95c';c.lineWidth=1;c.beginPath();c.moveTo(x,y);c.lineTo(x-3,y-6);c.moveTo(x,y);c.lineTo(x+3,y-8);c.stroke();}
    for(let i=0;i<23;i++){const x=(i*153.7+48)%1280,y=627+(i*7)%25;ellipse(c,x,y,2,2,i%2?'#eee2b0':'#d7d7a9');}
    if(s.mode==='menu'){pine(c,1250,654,210,'#2e5f48');pine(c,1215,660,110,'#3b6d50');pine(c,27,642,105,'#6c915e');}
  }
  function leaves(c,x,y,r,shade,alt,seed=0) {
    for(let i=0;i<5;i++){const angle=i*2.4+seed,rad=r*(.4+(i%2)*.12);ellipse(c,x+Math.cos(angle)*r*.5,y+Math.sin(angle)*r*.32,rad*1.25,rad,i%2?alt:shade,-.2);}
    ellipse(c,x-r*.12,y-r*.19,r*.51,r*.37,alt);
    for(let i=0;i<5;i++){const a=i*2.7+seed;ellipse(c,x+Math.cos(a)*r*.5,y+Math.sin(a)*r*.35,2,1,'#d4d99455',a);}
  }
  function tree(c,t,s,segment,angleFor) {
    const angle=angleFor(t),ux=Math.sin(angle),uy=-Math.cos(angle),px=Math.cos(angle),py=Math.sin(angle);
    const selected=t.id===s.selectedTreeId && s.mode!=='menu';
    ellipse(c,t.x+23,t.baseY+8,t.radius*2.5+Math.abs(angle)*t.height*.26,8,'#244c2e27');
    if(selected&&!t.falling&&!t.fallen){
      const safe=t.safeDirections||[-1,1];
      for(const dir of safe){const end=Math.max(30,Math.min(1250,t.x+dir*t.height)),x=Math.min(t.x,end),w=Math.abs(end-t.x);
        rect(c,x,621,w,17,'#d3e3a545',4);c.save();c.beginPath();c.rect(x,621,w,17);c.clip();for(let p=x-15;p<x+w;p+=18)line(c,p,638,p+15,621,'#e5edbe77',2);c.restore();
        line(c,t.x+dir*45,645,end-dir*12,645,'#eef2b9',2);line(c,end-dir*12,645,end-dir*21,641,'#eef2b9',2);line(c,end-dir*12,645,end-dir*21,649,'#eef2b9',2);
      }
      ellipse(c,t.x,621,t.radius+20,8,'#edf0be50');c.strokeStyle='#fff1b9';c.lineWidth=2;c.beginPath();c.ellipse(t.x,621,t.radius+20,8,0,0,TAU);c.stroke();
    }
    c.save();c.translate(t.x,t.baseY);c.rotate(angle);
    const r=t.radius,h=t.height,curve=t.trunkCurve*h*.08;
    c.fillStyle='#664b32';c.beginPath();c.moveTo(-r*1.14,0);c.quadraticCurveTo(-r*.65+curve,-h*.55,-r*.32,-h);c.lineTo(r*.38,-h);c.quadraticCurveTo(r*.82+curve,-h*.5,r*1.14,0);c.closePath();c.fill();
    c.fillStyle='#97734c';c.beginPath();c.moveTo(-r*.48,0);c.quadraticCurveTo(-r*.32+curve,-h*.5,-r*.12,-h);c.lineTo(r*.32,-h);c.quadraticCurveTo(r*.51+curve,-h*.5,r*.43,0);c.fill();
    c.strokeStyle='#bf94604d';c.lineWidth=1.4;for(let i=0;i<9;i++){const y=-h*(i+.3)/10,x=Math.sin(i*4)*r*.42;line(c,x,y,x+Math.sin(i)*3,y-h*.058,'#c09d714f',1.5);}
    for(let i=0;i<Math.ceil(t.deadness*6);i++){const y=-h*(i+1)/(Math.ceil(t.deadness*6)+1);ellipse(c,r*.17,y,r*.28,r*.5,'#4d3d29');ellipse(c,r*.17,y,r*.13,r*.29,'#84613c');}
    ellipse(c,0,-h,r*.37,r*.11,'#bd9c68');
    if(t.axe?.targetSide&&!t.fallen){const a=t.axe,side=a.targetSide,pct=a.notchHits/a.notchNeed;c.fillStyle='#e7c48a';c.beginPath();c.moveTo(side*r, -16);c.lineTo(side*(r-r*.9*pct),-27);c.lineTo(side*r,-36);c.fill();if(a.backHits){line(c,-side*r,-24,-side*r+side*r*.7*(a.backHits/a.backNeed),-24,'#e9c791',4);}}
    c.restore();
    const cedar=t.species.id==='cedar',poplar=t.species.id==='poplar';
    const shade=cedar?'#315e4b':poplar?'#6c7f42':'#4c7146',alt=cedar?'#63896b':poplar?'#96a259':'#80a263';
    for(let i=0;i<t.branches.length;i++){
      const b=t.branches[i];if(b.cut)continue;const q=segment(t,b),damage=1-(b.hp/b.maxHp);
      c.lineCap='round';line(c,q.x1,q.y1,q.x2,q.y2,damage>.01?'#b47b44':'#785938',b.thickness+2);line(c,q.x1,q.y1,q.x2,q.y2,'#ad8654',Math.max(1,b.thickness*.35));
      const mx=q.x1+(q.x2-q.x1)*.76,my=q.y1+(q.y2-q.y1)*.76;
      line(c,mx,my,mx+px*b.side*13+ux*18,my+py*b.side*13+uy*18,'#785938',Math.max(2,b.thickness*.35));
      const radius=(b.isBig?37:29)*(t.fallen?.7:1);
      leaves(c,q.x2,q.y2-7,radius,b.deadness>.72?'#8b8652':shade,b.deadness>.72?'#aca568':alt,i);
      leaves(c,mx+px*b.side*13+ux*18,my+py*b.side*13+uy*18,18,shade,alt,i+1);
      if(selected&&!t.falling&&!t.fallen&&s.controlMode==='saw'&&b.tier===s.activeTier){
        const x=q.x1+(q.x2-q.x1)*.4,y=q.y1+(q.y2-q.y1)*.4;
        c.strokeStyle='#fff4beaa';c.lineWidth=1.5;c.setLineDash([3,4]);c.beginPath();c.arc(x,y,12,0,TAU);c.stroke();c.setLineDash([]);
        if(damage>.01){rect(c,x-15,y+17,30,4,'#37563a',2);rect(c,x-15,y+17,30*Math.max(0,b.hp/b.maxHp),4,'#eeba68',2);}
      }
      if(b.hitFlash>0){ellipse(c,mx,my,5+b.hitFlash*20,5+b.hitFlash*20,`rgba(255,237,174,${b.hitFlash*2})`);}
    }
    if(!t.fallen)leaves(c,t.x+ux*t.height,t.baseY+uy*t.height-9,t.isBoss?65:45,shade,alt,2);
    if(t.wedge&&!t.fallen){c.fillStyle='#e28e42';c.beginPath();c.moveTo(t.x+t.wedge*(r+2),613);c.lineTo(t.x+t.wedge*(r+22),608);c.lineTo(t.x+t.wedge*(r+22),620);c.fill();}
    if(!t.fallen&&!t.falling&&s.mode!=='menu'){
      const number=s.trees.indexOf(t)+1,y=Math.max(165,t.baseY-t.height-66);
      rect(c,t.x-23,y,46,23,selected?'#234e3e':'#f4f0d6e0',4);c.font='700 10px Avenir Next, sans-serif';c.textAlign='center';c.fillStyle=selected?'#f9edca':'#5f7756';c.fillText(t.isBoss?'GIANT':`0${number}`,t.x,y+15);c.textAlign='left';
    }
  }
  function nick(c,s,W,xOverride=null,yOverride=null,scale=1) {
    const x=xOverride??s.nickX,ground=yOverride??W.groundY,y=ground+s.nickY+(s.showtime.sway||0),phase=s.visualTime||0;
    ellipse(c,x,ground+5,22*scale,5*scale,'#284c302d');
    c.save();c.translate(x,y);c.scale(scale,scale);
    const jump=s.nickY<-.1,walk=s.mode==='playing'?Math.sin(phase*9)*Math.min(1,Math.abs(s.nickX-(s.pointer.x||s.nickX))/70):Math.sin(phase*1.8)*.2;
    c.lineCap='round';line(c,-7,-23,-8-walk*4,-3,'#314943',9);line(c,7,-23,9+walk*4,-3,'#314943',9);
    rect(c,-18-walk*4,-5,15,7,'#433d2c',3);rect(c,4+walk*4,-5,16,7,'#433d2c',3);
    rect(c,-17,-55,34,35,'#c06a3f',6);rect(c,-13,-54,9,31,'#c88953',2);line(c,-12,-40,12,-40,'#924e35',3);line(c,-12,-29,12,-29,'#924e35',2);line(c,5,-50,5,-22,'#843f3066',2);
    rect(c,-14,-27,28,5,'#57452f',1);rect(c,-3,-27,6,5,'#dbb064',1);
    ellipse(c,0,-64,15,17,'#deb183');ellipse(c,13,-63,4,5,'#e6bd8c');
    c.fillStyle='#3e3830';c.beginPath();c.moveTo(-14,-63);c.quadraticCurveTo(-11,-43,2,-43);c.quadraticCurveTo(16,-47,15,-64);c.lineTo(7,-60);c.lineTo(1,-62);c.lineTo(-5,-59);c.closePath();c.fill();
    ellipse(c,4,-66,2,2,'#29352b');line(c,1,-70,7,-70,'#473c2d',2);ellipse(c,12,-59,4,2,'#ce9769');
    rect(c,-19,-79,37,8,'#d8ad61',3);rect(c,-13,-92,25,18,'#e9c67c',5);rect(c,-13,-80,26,4,'#6b5938',1);ellipse(c,-3,-90,9,2,'#f4d796');
    const swing=s.toolSwing>0?Math.sin(s.toolSwing*22)*7:0;
    line(c,-13,-48,-26,-33-(s.showtime.active?Math.sin(phase*13)*6:0),'#c87948',9);ellipse(c,-26,-32,5,5,'#dbac7a');
    line(c,14,-47,26,-33-swing,'#c87948',9);ellipse(c,27,-33-swing,5,5,'#ddb181');
    if(s.showtime.active){
      c.save();c.translate(-25,-36);c.rotate(-.25);ellipse(c,0,6,7,9,'#a75e30');ellipse(c,0,-4,6,7,'#be793b');rect(c,-2,-26,4,23,'#604931',1);line(c,-1,-20,-1,12,'#e2bd7a',1);line(c,-12+Math.sin(phase*13)*4,-6,14+Math.sin(phase*13)*4,-13,'#ebca92',2);c.restore();
    } else {ellipse(c,-26,-29,6,8,'#925d35');rect(c,-28,-50,4,21,'#674e34',1);}
    c.save();c.translate(28,-32-swing);
    if(s.controlMode==='axe'){c.rotate(-.25-swing*.06);rect(c,-2,-40,5,49,'#b5935a',2);c.fillStyle='#c7d0bd';c.beginPath();c.moveTo(1,-39);c.lineTo(19,-45);c.lineTo(22,-27);c.lineTo(1,-30);c.fill();line(c,20,-43,22,-28,'#f0efde',3);}
    else {rect(c,8,-5,34,9,'#bdc7b5',4);line(c,13,-1,36,-1,'#778b7b',1);for(let i=12;i<39;i+=5){rect(c,i,4,2,2,'#657367');}rect(c,-6,-10,21,18,'#dd7643',3);rect(c,-4,-13,14,5,'#425145',2);rect(c,-4,-3,5,6,'#ec9f60',1);}
    c.restore();c.restore();
  }
  function truck(c,x,y) {
    ellipse(c,x+92,y+6,132,13,'#3456382b');
    rect(c,x-5,y-69,137,49,'#cc8b4f',6);rect(c,x+7,y-76,120,9,'#e9b779',3);
    for(let i=0;i<3;i++){rect(c,x+13,y-69+i*14,108,4,'#ac6b37',1);}
    c.fillStyle='#e3ad64';c.beginPath();c.moveTo(x+123,y-24);c.lineTo(x+123,y-106);c.quadraticCurveTo(x+162,y-116,x+189,y-102);c.lineTo(x+217,y-61);c.lineTo(x+240,y-54);c.lineTo(x+241,y-22);c.closePath();c.fill();
    c.fillStyle='#6d9289';c.beginPath();c.moveTo(x+136,y-98);c.lineTo(x+180,y-96);c.lineTo(x+202,y-64);c.lineTo(x+136,y-64);c.fill();line(c,x+168,y-98,x+168,y-64,'#e5be7c',4);line(c,x+139,y-92,x+159,y-69,'#cad9ba88',3);
    rect(c,x-9,y-27,250,12,'#85643c',3);rect(c,x+126,y-53,78,3,'#c99551',1);rect(c,x+139,y-56,12,3,'#5e705a',2);rect(c,x+229,y-48,13,9,'#fff0be',2);
    for(const wx of [x+40,x+194]){ellipse(c,wx,y-9,24,24,'#374538');ellipse(c,wx,y-9,13,13,'#b6bb98');ellipse(c,wx,y-9,7,7,'#6b7d63');}
    c.fillStyle='#527048';c.font='700 11px Avenir Next, sans-serif';c.fillText('NICK’S',x+140,y-32);
    for(let i=0;i<4;i++){const lx=x+12+i*30;rect(c,lx,y-89,100,13,'#8b6539',6);ellipse(c,lx,y-82,7,7,'#d4b478');ellipse(c,lx,y-82,4,4,'#ae894e');}
  }
  function menu(c,s,W,demo,segment,angleFor){
    tree(c,demo,{...s,selectedTreeId:null,trees:[]},segment,angleFor);
    truck(c,785,626);
    nick(c,{...s,nickY:0,controlMode:'saw',showtime:{active:false,sway:0},nickX:756},W,763,637,1.4);
    rect(c,1102,621,6,40,'#765f37',1);rect(c,1058,581,93,43,'#f4e6b6',3);c.font='700 10px Avenir Next,sans-serif';c.fillStyle='#4e704b';c.textAlign='center';c.fillText('CEDAR',1105,598);c.fillText('HOLLOW',1105,612);c.textAlign='left';
    for(let i=0;i<4;i++){ellipse(c,1180+i*16,665-i%2*8,12,7,'#456c46');}
  }
  window.TreeArt = {background,tree,nick,menu};
})();
