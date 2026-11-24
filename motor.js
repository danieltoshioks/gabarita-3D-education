/* Gabarita PAS · Modelos visuais
   Motor 3D próprio (WebGL 1, sem bibliotecas): superfícies orgânicas, membranas translúcidas,
   corte para ver o interior, clique para dar zoom numa parte e painel com a explicação. */
(function(){
"use strict";
// Open-source standalone mode enabled
const PI = Math.PI;

/* ---------- matemática ---------- */
const I = () => [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
function mul(a,b){const o=new Array(16);for(let i=0;i<4;i++)for(let j=0;j<4;j++){let s=0;for(let k=0;k<4;k++)s+=a[k*4+j]*b[i*4+k];o[i*4+j]=s;}return o;}
const T=(x,y,z)=>{const m=I();m[12]=x;m[13]=y;m[14]=z;return m;};
const S=(x,y,z)=>{const m=I();m[0]=x;m[5]=y===undefined?x:y;m[10]=z===undefined?x:z;return m;};
const Rx=a=>{const c=Math.cos(a),s=Math.sin(a);return [1,0,0,0,0,c,s,0,0,-s,c,0,0,0,0,1];};
const Ry=a=>{const c=Math.cos(a),s=Math.sin(a);return [c,0,-s,0,0,1,0,0,s,0,c,0,0,0,0,1];};
const Rz=a=>{const c=Math.cos(a),s=Math.sin(a);return [c,s,0,0,-s,c,0,0,0,0,1,0,0,0,0,1];};
const M=(...ms)=>ms.reduce((a,b)=>mul(a,b),I());
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],norm=a=>{const l=Math.hypot(a[0],a[1],a[2])||1;return [a[0]/l,a[1]/l,a[2]/l];};
function rnd(s){return function(){s=(s*1664525+1013904223)>>>0;return s/4294967296;};}

/* ---------- geometria (sem GPU: só arrays) ---------- */
function param(nu,nv,f){
 const pos=[],nor=[],idx=[];
 for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){const u=i/nu,v=j/nv,p=f(u,v),e=1e-3;
  const pu=f(Math.min(1,u+e),v),pu0=f(Math.max(0,u-e),v),pv=f(u,Math.min(1,v+e)),pv0=f(u,Math.max(0,v-e));
  const a=[pu[0]-pu0[0],pu[1]-pu0[1],pu[2]-pu0[2]],b=[pv[0]-pv0[0],pv[1]-pv0[1],pv[2]-pv0[2]];
  let n=cross(a,b);const l=Math.hypot(n[0],n[1],n[2]);
  if(l<1e-9){const c=p;n=norm(c);}else n=[n[0]/l,n[1]/l,n[2]/l];
  pos.push(p[0],p[1],p[2]);nor.push(n[0],n[1],n[2]);}
 for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){const a=j*(nu+1)+i,b=a+1,c=a+nu+1,d=c+1;idx.push(a,c,b,b,c,d);}
 return {pos,nor,idx};}
const G={
 param,
 esfera:(r,bump,seed,q)=>param(q||40,q?Math.max(6,Math.round(q*.66)):28,(u,v)=>{const th=u*2*PI,ph=v*PI;let rr=r;if(bump)rr*=1+bump*(Math.sin(th*5+(seed||0))*Math.sin(ph*4+(seed||0)*1.7)*.6+Math.sin(th*11+ph*7+(seed||0))*.4);return [rr*Math.sin(ph)*Math.cos(th),rr*Math.cos(ph),rr*Math.sin(ph)*Math.sin(th)];}),
 elipsoide:(a,b,c,q)=>param(q||40,q?Math.round(q*.66):28,(u,v)=>{const th=u*2*PI,ph=v*PI;return [a*Math.sin(ph)*Math.cos(th),b*Math.cos(ph),c*Math.sin(ph)*Math.sin(th)];}),
 capsula:(r,h,q)=>param(q||32,36,(u,v)=>{const th=u*2*PI;let y,rr;const a=.3,b=.7;if(v<a){const ph=(v/a)*PI/2;y=-h/2-r*Math.cos(ph);rr=r*Math.sin(ph);}else if(v<b){y=-h/2+(v-a)/(b-a)*h;rr=r;}else{const ph=(v-b)/(1-b)*PI/2;y=h/2+r*Math.sin(ph);rr=r*Math.cos(ph);}return [rr*Math.cos(th),y,rr*Math.sin(th)];}),
 toro:(R,r,a0,a1,q)=>param(q||40,14,(u,v)=>{const a=(a0||0)+((a1===undefined?2*PI:a1)-(a0||0))*u,b=v*2*PI;return [(R+r*Math.cos(b))*Math.cos(a),r*Math.sin(b),(R+r*Math.cos(b))*Math.sin(a)];}),
 lamina:(R,w,a0,a1,esp)=>param(46,10,(u,v)=>{const a=a0+(a1-a0)*u,b=v*2*PI;const k=Math.sin(u*PI);const ww=w*(.35+.65*k);return [(R+ww*Math.cos(b))*Math.cos(a),esp*Math.sin(b)*(.4+.6*k),(R+ww*Math.cos(b))*Math.sin(a)];}),
 cilindro:(r,h,q,tampa)=>param(q||24,8,(u,v)=>{const th=u*2*PI;let rr=r,y=(v-.5)*h;if(tampa!==false){if(v<.12){rr=r*v/.12;y=-h/2;}else if(v>.88){rr=r*(1-v)/.12;y=h/2;}else y=((v-.12)/.76-.5)*h;}return [rr*Math.cos(th),y,rr*Math.sin(th)];}),
 cone:(r,h,q)=>param(q||32,10,(u,v)=>{const th=u*2*PI;if(v<.2){const k=v/.2;return [r*k*Math.cos(th),-h/2,r*k*Math.sin(th)];}const k=(v-.2)/.8;return [r*(1-k)*Math.cos(th),-h/2+h*k,r*(1-k)*Math.sin(th)];}),
 tubo:(fn,r,q,qq)=>param(q||120,qq||10,(u,v)=>{const p=fn(u),p2=fn(Math.min(1,u+1e-3)),p0=fn(Math.max(0,u-1e-3));const t=norm(sub(p2,p0));let a=Math.abs(t[1])<.9?[0,1,0]:[1,0,0];const n1=norm(cross(t,a)),n2=cross(t,n1);const b=v*2*PI,rr=typeof r==="function"?r(u):r;return [p[0]+rr*(Math.cos(b)*n1[0]+Math.sin(b)*n2[0]),p[1]+rr*(Math.cos(b)*n1[1]+Math.sin(b)*n2[1]),p[2]+rr*(Math.cos(b)*n1[2]+Math.sin(b)*n2[2])];}),
 caixa:(x,y,z)=>{const pos=[],nor=[],idx=[];const F=[[[1,0,0],[0,1,0],[0,0,1]],[[-1,0,0],[0,1,0],[0,0,-1]],[[0,1,0],[0,0,1],[1,0,0]],[[0,-1,0],[0,0,-1],[1,0,0]],[[0,0,1],[1,0,0],[0,1,0]],[[0,0,-1],[-1,0,0],[0,1,0]]];
  const h=[x/2,y/2,z/2];F.forEach(([n,u,v])=>{const b=pos.length/3;for(const [a,c] of [[-1,-1],[1,-1],[-1,1],[1,1]]){pos.push((n[0]+u[0]*a+v[0]*c)*h[0],(n[1]+u[1]*a+v[1]*c)*h[1],(n[2]+u[2]*a+v[2]*c)*h[2]);nor.push(...n);}idx.push(b,b+1,b+2,b+2,b+1,b+3);});return {pos,nor,idx};},
 // poliedro a partir de faces (lista de vértices por face), sombreado plano
 faces:(fs)=>{const pos=[],nor=[],idx=[];fs.forEach(f=>{const n=norm(cross(sub(f[1],f[0]),sub(f[2],f[0])));const b=pos.length/3;f.forEach(p=>{pos.push(...p);nor.push(...n);});for(let i=1;i<f.length-1;i++)idx.push(b,b+i,b+i+1);});return {pos,nor,idx};},
 terreno:(nx,nz,sx,sz,h)=>param(nx,nz,(u,v)=>{const x=(u-.5)*sx,z=(v-.5)*sz;return [x,h(x,z),z];}),
};

/* ---------- página ---------- */
const CSS=`
.mv{--bg:#060A1B;--surface:#0D1430;--surface-2:#141C3D;--ink:#EEF1FB;--ink-2:#B4BCD9;--ink-3:#8C95B8;--line:#1D2750;--line-2:#2C3869;--blue-tx:#93A6FF;--yellow:#FFC928;--on-yellow:#1B1500;--fd:"Jost","Futura","Segoe UI",system-ui,sans-serif;--fb:"Inter",system-ui,-apple-system,"Segoe UI",sans-serif;
 position:relative;height:100%;display:grid;grid-template-columns:minmax(0,1fr) 380px;color:var(--ink);font:16px/1.55 var(--fb);background:var(--bg);color-scheme:dark}
.mv *{box-sizing:border-box}
.mv-cena{position:relative;min-width:0;overflow:hidden;background:radial-gradient(80% 75% at 50% 42%,var(--g1,#18223F) 0%,var(--g2,#0C1226) 50%,#04060E 100%)}
.mv-cena::after{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(120% 100% at 50% 45%,transparent 55%,rgba(0,0,0,.55) 100%)}
.mv canvas{position:absolute;inset:0;display:block;width:100%;height:100%;touch-action:none;cursor:grab}
.mv canvas.arrasta{cursor:grabbing}.mv canvas.sobre{cursor:pointer}
.mv-topo{position:absolute;z-index:3;left:20px;right:20px;top:18px;display:flex;align-items:flex-start;justify-content:space-between;gap:12px;pointer-events:none}
.mv-topo>*{pointer-events:auto}
.mv-tit{display:grid;gap:4px;min-width:0}
.mv-tit a{font:600 13px/1 var(--fb);color:var(--yellow);text-decoration:none}
.mv-tit a:hover{text-decoration:underline}
.mv-tit h1{margin:0;font:700 clamp(24px,3vw,36px)/1.05 var(--fd);letter-spacing:-.03em;color:#fff}
.mv-btns{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}
.mv-bt{appearance:none;border:1px solid rgba(255,255,255,.16);background:rgba(13,20,48,.7);color:var(--ink);font:600 13.5px/1 var(--fb);min-height:40px;padding:0 14px;border-radius:12px;cursor:pointer;-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}
.mv-bt:hover{border-color:rgba(255,255,255,.32)}
.mv-bt[aria-pressed="true"]{background:var(--yellow);color:var(--on-yellow);border-color:var(--yellow)}
.mv-bt:focus-visible,.mv-org:focus-visible{outline:2px solid var(--yellow);outline-offset:2px}
.mv-dica{position:absolute;z-index:3;left:50%;bottom:18px;transform:translateX(-50%);font:500 13px/1.3 var(--fb);color:var(--ink-3);background:rgba(13,20,48,.7);border:1px solid var(--line);padding:9px 14px;border-radius:999px;white-space:nowrap;pointer-events:none;transition:opacity .4s}
.mv-rot{position:absolute;z-index:3;pointer-events:none;transform:translate(-50%,-140%);font:600 12.5px/1 var(--fb);color:#fff;background:rgba(6,10,27,.82);border:1px solid rgba(255,255,255,.18);padding:7px 10px;border-radius:9px;white-space:nowrap;opacity:0;transition:opacity .15s}
.mv-tags{position:absolute;inset:0;z-index:2;pointer-events:none}
.mv-tsvg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}.mv-tl{stroke:rgba(255,255,255,.85);stroke-width:1.5;transition:opacity .25s}.mv-tp{fill:#fff;stroke:rgba(6,10,27,.9);stroke-width:2;transition:opacity .25s}.mv-tagl{cursor:pointer;background:rgba(6,10,27,.86);border-color:rgba(255,255,255,.35)}.mv-tagl.mv-tagsel{font-size:15px;padding:8px 12px;border:1.5px solid #F6C33B;color:#FFE7A3}
.mv-tag{position:absolute;transform:translate(-50%,-50%);font:600 12px/1 var(--fb);color:#fff;background:rgba(6,10,27,.72);border:1px solid rgba(255,255,255,.2);padding:6px 9px;border-radius:8px;white-space:nowrap;transition:opacity .25s}
.mv-painel{position:relative;z-index:2;display:flex;flex-direction:column;min-height:0;min-width:0;background:var(--surface);border-left:1px solid var(--line)}
.mv-info{flex:none;padding:24px 24px 18px;border-bottom:1px solid var(--line);display:grid;gap:10px}
.mv-info .k{display:inline-flex;align-items:center;gap:8px;font:600 12.5px/1 var(--fb);color:var(--ink-3)}
.mv-info .k i{width:12px;height:12px;border-radius:4px;background:var(--c,#888)}
.mv-info h2{margin:0;font:700 28px/1.1 var(--fd);letter-spacing:-.02em;color:#fff}
.mv-info p{margin:0;color:var(--ink-2);font-size:15px}
.mv-info dl{margin:0;display:grid;grid-template-columns:auto 1fr;gap:6px 14px;font-size:14px}
.mv-info dt{color:var(--ink-3)}.mv-info dd{margin:0;color:var(--ink)}
.mv-info .pas{margin-top:4px;padding:12px 14px;border-radius:12px;background:#2B2408;color:#F3E6B8;font-size:14px;line-height:1.5}
.mv-info .pas b{display:block;margin-bottom:3px;font:600 12px/1 var(--fb);color:var(--yellow)}
.mv-lista{flex:1;min-height:0;overflow:auto;padding:12px;display:grid;align-content:start;gap:2px}
.mv-lista p{margin:6px 10px;font:600 12px/1 var(--fb);color:var(--ink-3)}
.mv-org{appearance:none;display:flex;align-items:center;gap:12px;width:100%;min-height:44px;padding:0 12px;border:0;border-radius:12px;background:none;color:var(--ink-2);font:500 14.5px/1.2 var(--fb);text-align:left;cursor:pointer}
.mv-org i{width:12px;height:12px;border-radius:4px;flex:none;background:var(--c)}
.mv-org:hover{background:var(--surface-2);color:var(--ink)}
.mv-org[aria-current="true"]{background:#141E52;color:var(--blue-tx);font-weight:600}
.mv-slider{position:absolute;z-index:3;left:50%;bottom:60px;transform:translateX(-50%);display:flex;align-items:center;gap:12px;padding:10px 16px;border-radius:14px;background:rgba(13,20,48,.8);border:1px solid var(--line);font:500 13px/1 var(--fb);color:var(--ink-2);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}
.mv-slider input{width:min(280px,50vw);accent-color:#FFC928}
@media (max-width:860px){
 .mv{grid-template-columns:minmax(0,1fr);grid-template-rows:minmax(0,1fr) auto}
 .mv-painel{border-left:0;border-top:1px solid var(--line);max-height:46vh}
 .mv-lista{display:flex;flex-wrap:nowrap;overflow-x:auto;overflow-y:hidden;padding:10px 12px;gap:6px;flex:none}
 .mv-lista p{display:none}
 .mv-org{flex:none;width:auto;min-height:38px;border:1px solid var(--line-2);border-radius:999px;font-size:13.5px}
 .mv-info{padding:16px 18px;overflow:auto;border-bottom:0;order:2}
 .mv-info h2{font-size:22px}
 .mv-topo{left:14px;right:14px;top:12px}
 .mv-tit h1{font-size:22px}
 .mv-bt{min-height:34px;padding:0 10px;font-size:12.5px}
 .mv-dica{bottom:10px;font-size:12px}
 .mv-slider{bottom:46px}
}`;
const esc=s=>String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const rgb=c=>`rgb(${c.map(x=>Math.round(x*255)).join(",")})`;

/* ---------- shaders ---------- */
const VS=`attribute vec3 p;attribute vec3 n;uniform mat4 V,P;uniform vec3 PB,PA;uniform float PK;varying vec3 vn,vw;
void main(){vec3 q=p;if(PK!=0.){vec3 ax=PA-PB;float L=length(ax);ax/=L;float s=dot(p-PB,ax);float k=PK*smoothstep(0.,.35*L,s);vec3 pr=p-PB-ax*s;q=p-pr*k-ax*s*k*.3;}vw=q;vn=n;gl_Position=P*V*vec4(q,1.);}`;
const FS=`precision highp float;varying vec3 vn,vw;uniform vec3 C,E,K,Q,ID,CY1,CY2,FOG;uniform float A,cut,pick,glow,B,D,Fz,AOr,BMP,SPC,EMI,LPon,TX,DM;uniform vec3 LP;uniform vec2 TXA;
float h3(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float vn3(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);
 return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),
            mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){return vn3(p)*.55+vn3(p*2.03)*.28+vn3(p*4.11)*.17;}
void main(){
 if(cut>0.5 && dot(vw-Q,K)>0.0) discard;
 if(pick>0.5){gl_FragColor=vec4(ID,1.);return;}
 vec3 v=normalize(E-vw);
 vec3 n=normalize(vn); bool tras=!gl_FrontFacing; if(dot(n,v)<0.) n=-n;
 vec3 pp=vw*D; float b0=fbm(pp); float e=.08;
 if(BMP>0.){vec3 g=vec3(fbm(pp+vec3(e,0,0))-b0,fbm(pp+vec3(0,e,0))-b0,fbm(pp+vec3(0,0,e))-b0)/e;n=normalize(n-(g-dot(g,n)*n)*BMP);}
 vec3 L1=LPon>.5?normalize(LP-vw):normalize(vec3(.45,.75,.55)),L2=normalize(vec3(-.55,-.25,-.6));
 vec3 alb=C*(1.-BMP*2.+BMP*4.*b0);
 if(TX>.5&&TX<1.5){ // epicárdio: manchas do músculo, vasinhos e gordura
  float m=fbm(vw*4.3+3.); alb=mix(alb,alb*vec3(1.14,.9,.84),smoothstep(.35,.7,m));
  float w1=vn3(vw*3.1+2.)*2.; float r1=1.-abs(2.*vn3(vw*6.5+w1)-1.), r2=1.-abs(2.*vn3(vw*15.+w1*1.7+5.)-1.);
  float ves=max(smoothstep(.92,.985,r1)*.8,smoothstep(.94,.99,r2)*.5);
  alb=mix(alb,vec3(.42,.05,.08),ves);
  float fat=smoothstep(.54,.7,fbm(vw*2.7+11.))*smoothstep(TXA.x,TXA.y,vw.y);
  alb=mix(alb,vec3(.95,.8,.45)*(.82+.36*b0),fat*.9);
 } else if(TX>1.5&&TX<2.5){ // gordura: lóbulos amarelos
  float lb=vn3(vw*34.), l2=vn3(vw*13.+4.);
  alb=C*(.74+.34*lb)*vec3(1.,.9+.14*l2,.72+.4*l2);
 } else if(TX>2.5&&TX<3.5){ // parede de vaso: estrias suaves e vasinhos finos
  float r3=1.-abs(2.*vn3(vw*11.+vn3(vw*4.)*2.)-1.);
  alb=mix(alb*(.9+.2*vn3(vw*vec3(26.,5.,26.))),alb*vec3(.62,.42,.5),smoothstep(.95,.99,r3)*.55);
 } else if(TX>3.5&&TX<4.5){ // endocárdio: trabéculas (cristas claras e fundos escuros)
  float tb=1.-abs(2.*vn3(vw*vec3(9.,5.,9.)+vn3(vw*3.)*1.5)-1.);
  alb=alb*(.62+.6*smoothstep(.35,.95,tb));
 } else if(TX>4.5&&TX<5.5){ // membrana: bicamada granulada com proteínas
  float g1=vn3(vw*D*2.2),g2=vn3(vw*D*.55+7.);
  alb=alb*(.86+.22*g2)+vec3(.10,.08,.06)*smoothstep(.72,.9,g1);
 } else if(TX>5.5&&TX<6.5){ // tecido de órgão: úmido, manchado, com vasinhos
  float m=fbm(vw*TXA.x+3.); alb=mix(alb*.86,alb*vec3(1.12,.95,.9),smoothstep(.3,.75,m));
  float w1=vn3(vw*TXA.y*.4+2.)*2.; float r1=1.-abs(2.*vn3(vw*TXA.y+w1)-1.);
  alb=mix(alb,alb*vec3(.55,.2,.25),smoothstep(.93,.99,r1)*.7);
 } else if(TX>6.5&&TX<7.5){ // osso: marfim poroso
  float po=vn3(vw*60.),pm=fbm(vw*6.);
  alb=vec3(.9,.84,.72)*(.84+.22*pm)*(1.-.22*smoothstep(.78,.92,po));
 } else if(TX>7.5&&TX<8.5){ // clorofila: verde granulado
  float gr=vn3(vw*D*1.6),gm=fbm(vw*D*.35+5.);
  alb=alb*(.7+.5*gm)*(1.-.25*smoothstep(.65,.85,gr))+vec3(.0,.05,0)*gr;
 } else if(TX>8.5&&TX<9.5){ // fibras (celulose, músculo): estrias finas
  float fb=sin((vw.x*.7+vw.y*.25+vw.z*.6)*D*6.+vn3(vw*D*.8)*4.)*.5+.5;
  alb=alb*(.88+.16*fb)*(.92+.14*vn3(vw*D*.4));
 } else if(TX>9.5){ // íris: fibras radiais em volta do eixo z
  float ang=atan(vw.z,vw.y),rr=length(vw.yz);
  float fr2=vn3(vec3(ang*18.,rr*6.,0.))*.6+vn3(vec3(ang*45.,rr*14.,3.))*.4;
  alb=alb*(.55+.8*fr2)+vec3(.25,.18,.05)*smoothstep(.65,.9,fr2);
 }
 vec3 al=pow(alb,vec3(2.2));
 float wrap=.5,nl=dot(n,L1),nv=max(dot(n,v),0.);
 float d1=max((nl+wrap)/(1.+wrap),0.),d2=max((dot(n,L2)+wrap)/(1.+wrap),0.);
 float trans=pow(max(dot(v,-L1),0.),3.)*.3*(1.-LPon);
 if(LPon>.5){wrap=.05;d1=max(nl,0.);d2=0.;}
 float rim=pow(max(dot(n,normalize(vec3(-.35,.25,-1.))),0.),1.4)*(1.-LPon);
 vec3 amb=mix(vec3(.05,.04,.055),vec3(.2,.24,.36),n.y*.5+.5)*(LPon>.5?.35:1.);
 float ao=AOr>0.?mix(.5,1.,clamp(length(vw)/AOr*1.05,0.,1.)):1.;
 ao*=mix(.8,1.,smoothstep(.2,.8,b0));
 float spc=min(SPC,.2);float rough=clamp(.66-spc*2.6,.28,.7); float ex=2./(rough*rough)-2.;
 vec3 hv=normalize(L1+v); float nh=max(dot(n,hv),0.);
 float F=.04+.96*pow(1.-nv,5.);
 float sp=pow(nh,ex)*(ex+8.)/25.13*max(nl,0.)*(.6+.8*b0);
 vec3 rf=reflect(-v,n);
 vec3 env=mix(vec3(.03,.03,.05),vec3(.42,.52,.74),clamp(rf.y*.5+.5,0.,1.))+vec3(1.5,1.35,1.15)*pow(max(dot(rf,normalize(vec3(.5,.8,.4))),0.),22.)+vec3(.35,.5,.9)*pow(max(dot(rf,normalize(vec3(-.7,.3,.5))),0.),9.)*.8;
 float envk=(.05+spc*2.2)*(1.-rough*.6);
 float tt=clamp(1.-abs(nl+.05)*1.7,0.,1.);
 vec3 sss=al*vec3(1.5,.62,.5)*tt*tt*.5*(1.-LPon)*clamp(1.-SPC*6.,0.,1.);
 vec3 lin=al*(d1*vec3(2.15,1.97,1.74)+d2*vec3(.28,.34,.62)+rim*vec3(.32,.4,.55)+amb)*ao+sss+al*trans*1.4+vec3(1.9,1.75,1.55)*sp*(.2+spc*1.6)+env*F*envk*ao+al*pow(1.-nv,3.)*.07;
 lin=lin*1.05; vec3 col=pow(clamp((lin*(2.51*lin+.03))/(lin*(2.43*lin+.59)+.14),0.,1.),vec3(1./2.2)); col=mix(vec3(dot(col,vec3(.299,.587,.114))),col,1.22);
 float fr=pow(1.-nv,3.);
 float a=A;
 if(B>0.5&&B<1.5){
  if(!tras){ a=A*(.18+.82*fr); col=mix(col,vec3(.95,.86,.82),.22); }
  else { float hh=clamp(vw.y*.5+.5,0.,1.); vec3 cy=mix(CY1,CY2,hh)*(.8+.4*b0); col=cy*(.55+.45*d1)+fr*.05; }
 }
 if(B>1.5 && tras){ // corte maciço: o lado de dentro parece uma face cortada
  float l=max(dot(normalize(K),L1)*.5+.6,.35); col=C*(.78+.3*b0)*l;
 }
 col=mix(col,C,EMI);
 if(DM>0.){float gy=dot(col,vec3(.299,.587,.114));col=mix(col,vec3(gy)*vec3(.82,.86,1.)*.42,DM);}
 col+=glow*vec3(.28,.24,.12)*(.35+fr);
 float dist=length(E-vw); col=mix(col,FOG,smoothstep(Fz*.55,Fz*1.6,dist)*.5);
 gl_FragColor=vec4(col,a);
}`;
const PVS=`attribute vec3 p;attribute float s;uniform mat4 V,P;uniform vec3 K,Q;uniform float cut,PS;varying float al;
void main(){vec4 q=V*vec4(p,1.);gl_Position=P*q;float d=-q.z;gl_PointSize=s*PS/d;al=(cut>.5&&dot(p-Q,K)>0.)?0.:clamp(1.2-d*.18,.15,1.);}`;
const PFS=`precision mediump float;varying float al;uniform vec3 PC;void main(){vec2 c=gl_PointCoord-.5;float r=dot(c,c);if(r>.25)discard;gl_FragColor=vec4(PC,al*(.25-r)*1.6);}`;

/* =====================================================================
   Modelo(cfg)
   cfg: titulo, area, voltar, partes[{id,n,c,f,pas,dl}], geral{k,t,f,pas}, constroi(api),
        foco{id:[alvo,dist,dir?]}, casca, cortaveis[], abre{id:ponto}, detalhe{id:freq},
        relevo{id:força}, brilho{id}, dist, alvo, pitch, aoRaio, fundo[g1,g2], citoplasma[c1,c2],
        pontos{n,raio,cor,tam,evita}, botoes{corte,gira}, etiquetas[{id,p,t}], anima(t,api), slider{...}
   ===================================================================== */
window.MV_ETAPAS=(ids,nomes,montar,grupo,rot,ini)=>{const st={k:ini||0,sy:false};
 const sinc=k=>{const i=document.querySelector(".mv-slider input");if(i){i.value=k;document.querySelector(".mv-sv").textContent=nomes[k];}};
 return {st,slider:{rot:rot||"Etapa",min:0,max:ids.length-1,passo:1,valor:st.k,fmt:v=>nomes[v],muda(v,A){if(v===st.k&&!A.foca)return;st.k=v;A.refaz(grupo,()=>montar(A));if(A.foca){st.sy=true;A.foca(ids[v]);st.sy=false;}}},
  aoFocar(o,A){if(!o||st.sy)return;const k=ids.indexOf(o.id);if(k<0)return;st.k=k;A.refaz(grupo,()=>montar(A));sinc(k);}};};
window.Modelo3D=function(cfg){
 const raiz=document.createElement("div");raiz.className="mv";
 if(!document.getElementById("mv-css")){const st=document.createElement("style");st.id="mv-css";st.textContent=CSS;document.head.appendChild(st);}
 const B=cfg.botoes||{};
 raiz.innerHTML=`<div class="mv-cena" style="${cfg.fundo?`--g1:${cfg.fundo[0]};--g2:${cfg.fundo[1]}`:""}"><canvas aria-label="Modelo 3D: ${esc(cfg.titulo)}. Use a lista para escolher uma parte."></canvas><div class="mv-tags"></div>
  <div class="mv-topo"><div class="mv-tit">${cfg.voltar?`<a href="${esc(cfg.voltar)}">← ${esc(cfg.area)}</a>`:`<a>${esc(cfg.area)}</a>`}<h1>${esc(cfg.titulo)}</h1></div>
  <div class="mv-btns">${B.corte===false?"":`<button class="mv-bt" data-b="corte" aria-pressed="${cfg.corteInicial===false?"false":"true"}" type="button">Corte</button>`}${B.gira===false?"":`<button class="mv-bt" data-b="gira" aria-pressed="true" type="button">Girar</button>`}${cfg.extraBotoes||""}<button class="mv-bt" data-b="geral" type="button">Visão geral</button></div></div>
  <span class="mv-rot"></span><span class="mv-dica">${esc(cfg.dica||"Arraste para girar · toque numa parte para ver de perto")}</span>${cfg.slider?`<label class="mv-slider">${esc(cfg.slider.rot)}<input type="range" min="${cfg.slider.min}" max="${cfg.slider.max}" step="${cfg.slider.passo||1}" value="${cfg.slider.valor}"><b class="mv-sv"></b></label>`:""}</div>
  <aside class="mv-painel" aria-label="Partes do modelo"><div class="mv-info" aria-live="polite"></div><div class="mv-lista"><p>${esc(cfg.rotLista||"Partes")}</p></div></aside>`;
 (cfg.alvoEl||document.body).appendChild(raiz);
 /* dentro do site (iframe): "voltar" fecha a janela do modelo em vez de navegar */
 if(window.parent!==window){const v=raiz.querySelector(".mv-tit a");if(v){v.textContent="← Voltar aos modelos";v.addEventListener("click",e=>{e.preventDefault();parent.postMessage({mv:"fechar"},"*");});}}
 addEventListener("keydown",e=>{if(e.key==="Escape"&&window.parent!==window)parent.postMessage({mv:"fechar"},"*");});
 const cv=raiz.querySelector("canvas"),$=s=>raiz.querySelector(s);
 const gl=cv.getContext("webgl",{antialias:true});
 if(!gl){$(".mv-dica").textContent="Seu navegador não conseguiu abrir o modelo 3D.";return;}
 function sh(t,s){const x=gl.createShader(t);gl.shaderSource(x,s);gl.compileShader(x);if(!gl.getShaderParameter(x,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(x));return x;}
 function prog(v,f){const p=gl.createProgram();gl.attachShader(p,sh(gl.VERTEX_SHADER,v));gl.attachShader(p,sh(gl.FRAGMENT_SHADER,f));gl.linkProgram(p);return p;}
 const pr=prog(VS,FS);gl.useProgram(pr);
 const U={};["V","P","C","E","K","Q","A","cut","pick","ID","glow","B","D","Fz","AOr","BMP","SPC","CY1","CY2","FOG","EMI","LP","LPon","TX","TXA","PB","PA","PK","DM"].forEach(k=>U[k]=gl.getUniformLocation(pr,k));
 const aP=gl.getAttribLocation(pr,"p"),aN=gl.getAttribLocation(pr,"n");
 gl.enable(gl.DEPTH_TEST);gl.getExtension("OES_element_index_uint");
 const PARTES=cfg.partes,BY={};PARTES.forEach((o,i)=>{o.i=i;o.id3=[(i+1)/255,0,0];BY[o.id]=o;});
 const corteSet=new Set(cfg.cortaveis||[]);
 /* montagem */
 const grupos={},dinamicos=[];
 function add(g,Mx,id,ex){ex=ex||{};const o=BY[id];if(!o)throw new Error("parte "+id);const c=ex.c||o.c,cut=ex.cut===undefined?(corteSet.has(id)?1:0):ex.cut;
  const key=id+"|"+c.join(",")+"|"+cut+"|"+(ex.nocut?1:0)+"|"+(ex.grupo||"")+"|"+(ex.mat?JSON.stringify(ex.mat):"");
  const Gp=grupos[key]||(grupos[key]={pos:[],nor:[],idx:[],org:o,c,cut,nocut:!!ex.nocut,solido:!!ex.solido,emi:ex.emi||0,a:ex.a===undefined?1:ex.a,grupo:ex.grupo||"",mat:ex.mat||null});
  const base=Gp.pos.length/3;
  for(let i=0;i<g.pos.length;i+=3){const x=g.pos[i],y=g.pos[i+1],z=g.pos[i+2];Gp.pos.push(Mx[0]*x+Mx[4]*y+Mx[8]*z+Mx[12],Mx[1]*x+Mx[5]*y+Mx[9]*z+Mx[13],Mx[2]*x+Mx[6]*y+Mx[10]*z+Mx[14]);
   const a=g.nor[i],b=g.nor[i+1],d=g.nor[i+2];const nx=Mx[0]*a+Mx[4]*b+Mx[8]*d,ny=Mx[1]*a+Mx[5]*b+Mx[9]*d,nz=Mx[2]*a+Mx[6]*b+Mx[10]*d,l=Math.hypot(nx,ny,nz)||1;Gp.nor.push(nx/l,ny/l,nz/l);}
  for(let i=0;i<g.idx.length;i++)Gp.idx.push(g.idx[i]+base);}
 function malha(G0){const b1=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b1);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(G0.pos),gl.STATIC_DRAW);
  const b2=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b2);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(G0.nor),gl.STATIC_DRAW);
  const b3=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,b3);const big=G0.pos.length/3>65535;gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,big?new Uint32Array(G0.idx):new Uint16Array(G0.idx),gl.STATIC_DRAW);
  return {b1,b2,b3,n:G0.idx.length,t:big?gl.UNSIGNED_INT:gl.UNSIGNED_SHORT};}
 const api=Object.assign({},G,{add,I,T,S,Rx,Ry,Rz,M,mul,rnd,PI,norm,cross,sub,dot,BY});
 /* ajudantes: matriz que alinha o eixo y a uma direção, linha, seta, tubo por pontos, rotação em torno de um eixo */
 api.alinha=d=>{d=norm(d);const up=Math.abs(d[1])<.9?[0,1,0]:[1,0,0],e1=norm(cross(up,d)),e3=cross(e1,d);return [e1[0],e1[1],e1[2],0,d[0],d[1],d[2],0,e3[0],e3[1],e3[2],0,0,0,0,1];};
 api.linha=(a,b,r,id,o,q)=>add(G.tubo(u=>[a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u,a[2]+(b[2]-a[2])*u],r,2,q||10),T(0,0,0),id,o);
 api.seta=(a,b,r,id,o)=>{const d=sub(b,a),L=Math.hypot(...d),u=d.map(x=>x/L),h=Math.min(L*.45,r*6),c=b.map((x,i)=>x-u[i]*h);api.linha(a,c,r,id,o);add(G.cone(r*2.6,h,18),M(T(...c.map((x,i)=>x+u[i]*h/2)),api.alinha(u)),id,o);};
 api.poli=(P,r,id,o,q)=>{if(P.length<2)return;const L=[0];for(let i=1;i<P.length;i++)L.push(L[i-1]+Math.hypot(...sub(P[i],P[i-1])));const tot=L[L.length-1]||1;
  add(G.tubo(u=>{const s=u*tot;let i=1;while(i<P.length-1&&L[i]<s)i++;const f=(s-L[i-1])/((L[i]-L[i-1])||1);return P[i-1].map((v,k)=>v+(P[i][k]-v)*f);},r,Math.min(400,P.length*3),q||8),T(0,0,0),id,o);};
 api.gira=(p,a,u,ang)=>{u=norm(u);const v=sub(p,a),c=Math.cos(ang),s=Math.sin(ang),k=dot(u,v),x=cross(u,v);return [0,1,2].map(i=>a[i]+v[i]*c+x[i]*s+u[i]*k*(1-c));};
 cfg.constroi(api);
 const objs=Object.values(grupos).map(g=>({m:malha(g),org:g.org,c:g.c,cut:g.cut,nocut:g.nocut,solido:g.solido,emi:g.emi,a:g.a,grupo:g.grupo,mat:g.mat,vis:true}));
 // caixa de cada parte, para aproximar a câmera quando a parte não tem foco definido
 Object.values(grupos).forEach(g=>{const b=g.org.bb||(g.org.bb=[1e9,1e9,1e9,-1e9,-1e9,-1e9]);for(let i=0;i<g.pos.length;i+=3)for(let k=0;k<3;k++){const v=g.pos[i+k];if(v<b[k])b[k]=v;if(v>b[k+3])b[k+3]=v;}});
 api.objs=objs;api.grupo=n=>objs.filter(o=>o.grupo===n);
 /* pontos */
 let PT=null;
 if(cfg.pontos){const P0=cfg.pontos,r=rnd(77),pts=[],sz=[];for(let i=0;i<(P0.n||1200);i++){const rr=Math.cbrt(r())*(P0.raio||.93),a=r()*2*PI,b=Math.acos(2*r()-1);const p=[rr*Math.sin(b)*Math.cos(a),rr*Math.cos(b),rr*Math.sin(b)*Math.sin(a)];if(P0.evita&&P0.evita(p))continue;pts.push(...p);sz.push(.3+r()*.9);}
  const pp=prog(PVS,PFS);PT={pp,n:pts.length/3,b1:gl.createBuffer(),b2:gl.createBuffer(),U:{},a:gl.getAttribLocation(pp,"p"),s:gl.getAttribLocation(pp,"s")};
  ["V","P","K","Q","cut","PS","PC"].forEach(k=>PT.U[k]=gl.getUniformLocation(pp,k));
  gl.bindBuffer(gl.ARRAY_BUFFER,PT.b1);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(pts),gl.STATIC_DRAW);gl.bindBuffer(gl.ARRAY_BUFFER,PT.b2);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(sz),gl.STATIC_DRAW);}
 /* câmera */
 const ini={yaw:cfg.yaw===undefined?-.6:cfg.yaw,pitch:cfg.pitch===undefined?.28:cfg.pitch,dist:cfg.dist||3.1,tgt:(cfg.alvo||[0,0,0]).slice()};
 const cam=JSON.parse(JSON.stringify(ini)),alvo=JSON.parse(JSON.stringify(ini));
 let gira=cfg.giraInicial!==false,corte=cfg.corteInicial!==false,sel=null,sobre=null;const TESTE=location.hash.includes("teste");
 if(window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches)gira=false;
 const persp=(f,a,n,fa)=>{const t=1/Math.tan(f/2);return [t/a,0,0,0,0,t,0,0,0,0,(fa+n)/(n-fa),-1,0,0,2*fa*n/(n-fa),0];};
 const lookAt=(e,c)=>{const z=norm(sub(e,c)),x=norm(cross([0,1,0],z)),y=cross(z,x);return [x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,e),-dot(y,e),-dot(z,e),1];};
 const eye=c=>[c.tgt[0]+c.dist*Math.cos(c.pitch)*Math.sin(c.yaw),c.tgt[1]+c.dist*Math.sin(c.pitch),c.tgt[2]+c.dist*Math.cos(c.pitch)*Math.cos(c.yaw)];
 let W=0,H=0,dpr=1,Vm=null,Pm=null;
 function tam(){dpr=Math.min(2,window.devicePixelRatio||1);const r=cv.getBoundingClientRect();W=Math.max(1,Math.round(r.width*dpr));H=Math.max(1,Math.round(r.height*dpr));if(cv.width!==W||cv.height!==H){cv.width=W;cv.height=H;}}
 const det=cfg.detalhe||{},rel=cfg.relevo||{},esp=cfg.brilho||{},tex=cfg.textura||{},pul=cfg.pulso||null;
 const CY=cfg.citoplasma||[[.30,.20,.24],[.55,.40,.42]],FOG=cfg.nevoa||[.05,.06,.11];
 function desenha(pick){
  gl.viewport(0,0,W,H);gl.clearColor(0,0,0,pick?1:0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  const E=eye(cam);Vm=lookAt(E,cam.tgt);Pm=persp(cfg.fov||.75,W/H,.01,60);
  const kd=norm(sub(E,cfg.centroCorte||[0,0,0]));let kn=norm([kd[0],kd[1]*(cfg.corteY===undefined?.3:cfg.corteY),kd[2]]);if(cfg.corteAng){const c=Math.cos(cfg.corteAng),s=Math.sin(cfg.corteAng);kn=norm([kn[0]*c+kn[2]*s,kn[1],-kn[0]*s+kn[2]*c]);}
  gl.useProgram(pr);
  gl.uniformMatrix4fv(U.V,false,Vm);gl.uniformMatrix4fv(U.P,false,Pm);gl.uniform3fv(U.E,E);gl.uniform3fv(U.K,kn);gl.uniform1f(U.pick,pick?1:0);
  gl.uniform3fv(U.CY1,CY[0]);gl.uniform3fv(U.CY2,CY[1]);gl.uniform3fv(U.FOG,FOG);gl.uniform1f(U.Fz,cam.dist);gl.uniform1f(U.AOr,cfg.aoRaio===undefined?1:cfg.aoRaio);gl.uniform1f(U.LPon,0);
  gl.uniform2fv(U.TXA,cfg.texturaAltura||[9,10]);if(pul){gl.uniform3fv(U.PB,pul.base);gl.uniform3fv(U.PA,pul.apice);}
  const t=performance.now()/1000;
  const um=(o,alpha)=>{
   if(!o.vis)return;if(pick&&(cfg.semPick||[]).includes(o.org.id))return;
   gl.bindBuffer(gl.ARRAY_BUFFER,o.m.b1);gl.vertexAttribPointer(aP,3,gl.FLOAT,false,0,0);gl.enableVertexAttribArray(aP);
   gl.bindBuffer(gl.ARRAY_BUFFER,o.m.b2);gl.vertexAttribPointer(aN,3,gl.FLOAT,false,0,0);gl.enableVertexAttribArray(aN);
   gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,o.m.b3);
   let c=o.c;const ativo=sel&&sel===o.org,apaga=sel&&!ativo&&o.org.id!==cfg.casca&&!(cfg.semApagar||[]).includes(o.org.id);
   if(apaga&&!pick&&!cfg.apagaForte){const m=(c[0]+c[1]+c[2])/3;c=c.map(x=>(x*.4+m*.6)*.6);}
   gl.uniform1f(U.DM,apaga&&!pick&&cfg.apagaForte?cfg.apagaForte:0);
   gl.uniform3fv(U.C,c);gl.uniform3fv(U.ID,o.org.id3);gl.uniform1f(U.A,alpha);
   const abre=sel&&ativo&&!o.nocut&&cfg.abre&&cfg.abre[o.org.id];
   gl.uniform1f(U.cut,(corte&&(o.cut||abre))?1:0);
   gl.uniform3fv(U.Q,abre?cfg.abre[o.org.id]:((cfg.planos||{})[o.org.id]||[0,0,0]));
   gl.uniform1f(U.B,o.org.id===cfg.casca?1:(o.solido?2:0));
   const mt=o.mat||{};
   gl.uniform1f(U.D,mt.det||det[o.org.id]||22);gl.uniform1f(U.BMP,mt.rel!==undefined?mt.rel:(rel[o.org.id]===undefined?(cfg.relevoPadrao===undefined?.09:cfg.relevoPadrao):rel[o.org.id]));
   gl.uniform1f(U.SPC,mt.esp!==undefined?mt.esp:(esp[o.org.id]===undefined?.08:esp[o.org.id]));gl.uniform1f(U.EMI,o.emi||0);
   gl.uniform1f(U.TX,o.emi?0:(mt.tx!==undefined?mt.tx:(tex[o.org.id]||0)));gl.uniform1f(U.PK,pul&&pul.ids.includes(o.org.id)?pul.f(t):0);
   if(cfg.luzPonto&&!o.emi){gl.uniform1f(U.LPon,1);gl.uniform3fv(U.LP,cfg.luzPonto);}else gl.uniform1f(U.LPon,0);
   gl.uniform1f(U.glow,!pick&&(ativo||(sobre===o.org&&!sel))?(.6+.4*Math.sin(t*4)):0);
   gl.drawElements(gl.TRIANGLES,o.m.n,o.m.t,0);};
  gl.disable(gl.BLEND);
  const casca=objs.filter(o=>o.org.id===cfg.casca),trans=objs.filter(o=>o.a<1&&o.org.id!==cfg.casca);
  objs.forEach(o=>{if(o.org.id!==cfg.casca&&o.a>=1)um(o,1);});
  if(PT&&!pick){gl.useProgram(PT.pp);gl.uniformMatrix4fv(PT.U.V,false,Vm);gl.uniformMatrix4fv(PT.U.P,false,Pm);gl.uniform3fv(PT.U.K,kn);gl.uniform3fv(PT.U.Q,[0,0,0]);gl.uniform1f(PT.U.cut,corte&&cfg.casca?1:0);gl.uniform1f(PT.U.PS,(cfg.pontos.tam||90)*dpr);gl.uniform3fv(PT.U.PC,cfg.pontos.cor||[.92,.82,.8]);
   gl.disableVertexAttribArray(aN);gl.bindBuffer(gl.ARRAY_BUFFER,PT.b1);gl.vertexAttribPointer(PT.a,3,gl.FLOAT,false,0,0);gl.enableVertexAttribArray(PT.a);gl.bindBuffer(gl.ARRAY_BUFFER,PT.b2);gl.vertexAttribPointer(PT.s,1,gl.FLOAT,false,0,0);gl.enableVertexAttribArray(PT.s);
   gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);gl.depthMask(false);gl.drawArrays(gl.POINTS,0,PT.n);gl.depthMask(true);gl.disable(gl.BLEND);gl.disableVertexAttribArray(PT.s);gl.useProgram(pr);gl.enableVertexAttribArray(aN);}
  if(pick){casca.forEach(o=>um(o,1));trans.forEach(o=>um(o,1));}
  else{gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);
   trans.forEach(o=>um(o,o.a));
   gl.enable(gl.CULL_FACE);casca.forEach(o=>{gl.cullFace(gl.FRONT);um(o,corte?.95:.35);gl.cullFace(gl.BACK);um(o,corte?.95:.28);});gl.disable(gl.CULL_FACE);gl.depthMask(true);gl.disable(gl.BLEND);}
 }
 /* etiquetas presas a pontos 3D */
 const LN=!!cfg.etiquetasLinha,NS="http://www.w3.org/2000/svg";let svgT=null;
 if(LN){svgT=document.createElementNS(NS,"svg");svgT.setAttribute("class","mv-tsvg");$(".mv-tags").appendChild(svgT);}
 const selTag=LN?(()=>{const e={t:"",p:[0,0,0],sel:1};return e;})():null;if(LN)cfg.etiquetas=(cfg.etiquetas||[]).concat([selTag]);
 const tags=(cfg.etiquetas||[]).map(e=>{const s=document.createElement("span");s.className="mv-tag"+(LN?" mv-tagl":"")+(e.sel?" mv-tagsel":"");s.textContent=e.t;$(".mv-tags").appendChild(s);
  let ln=null,pt=null;if(LN){ln=document.createElementNS(NS,"line");ln.setAttribute("class","mv-tl");pt=document.createElementNS(NS,"circle");pt.setAttribute("r","4.5");pt.setAttribute("class","mv-tp");svgT.appendChild(ln);svgT.appendChild(pt);
   if(e.id){s.addEventListener("click",ev=>{ev.stopPropagation();const o=BY[e.id];if(o&&typeof foca==="function")foca(o);});}}
  return {e,s,ln,pt};});
 function projeta(p){const v=[Vm[0]*p[0]+Vm[4]*p[1]+Vm[8]*p[2]+Vm[12],Vm[1]*p[0]+Vm[5]*p[1]+Vm[9]*p[2]+Vm[13],Vm[2]*p[0]+Vm[6]*p[1]+Vm[10]*p[2]+Vm[14]];if(v[2]>-.01)return null;const x=Pm[0]*v[0]/-v[2],y=Pm[5]*v[1]/-v[2];return [(x*.5+.5)*W/dpr,(.5-y*.5)*H/dpr];}
 function pintaTags(){
  const C=LN?projeta(sel?cam.tgt:(cfg.centroEtiquetas||cam.tgt)):null,E=LN?eye(cam):null,ve=LN?norm(sub(E,cam.tgt)):null,Wc=W/dpr,Hc=H/dpr;
  if(selTag){selTag.on=!!sel;if(selTag.on){const a=(cfg.ancora||{})[sel.id]||((cfg.foco||{})[sel.id]||[])[0]||cam.tgt;selTag.p=a;const sp=tags[tags.length-1].s;if(sp.textContent!==sel.n)sp.textContent=sel.n;}}
  tags.forEach(({e,s,ln,pt})=>{const q=typeof e.p==="function"?e.p():e.p,p=projeta(q);let vis=p&&(e.sel?selTag.on:(!sel&&(e.quando?e.quando():true)));
  if(!p){s.style.opacity=0;if(ln){ln.style.opacity=0;pt.style.opacity=0;}return;}
  if(!LN){s.style.left=p[0]+"px";s.style.top=p[1]+"px";s.style.opacity=vis?1:0;return;}
  const atras=dot(sub(q,cam.tgt),ve)<-(cfg.etiquetaAtras===undefined?.12:cfg.etiquetaAtras);if(atras&&!sel)vis=false;
  let dx=p[0]-C[0],dy=p[1]-C[1];const l=Math.hypot(dx,dy);if(l<24){dx=.35;dy=-1;}const l2=Math.hypot(dx,dy)||1;dx/=l2;dy/=l2;if(e.dir){dx=e.dir[0];dy=e.dir[1];}
  const D=e.dist||cfg.etiquetaDist||58,w=s.offsetWidth||60,h=s.offsetHeight||24;
  let lx=p[0]+dx*D,ly=p[1]+dy*D;lx=Math.max(w/2+6,Math.min(Wc-w/2-6,lx));ly=Math.max(h/2+6,Math.min(Hc-h/2-6,ly));
  s.style.left=lx+"px";s.style.top=ly+"px";s.style.opacity=vis?1:0;s.style.pointerEvents=vis&&e.id?"auto":"none";
  const ex=lx-Math.sign(lx-p[0])*Math.min(Math.abs(lx-p[0]),w/2),ey=Math.abs(lx-p[0])<w/2?ly-Math.sign(ly-p[1])*h/2:ly;
  ln.setAttribute("x1",p[0]);ln.setAttribute("y1",p[1]);ln.setAttribute("x2",ex);ln.setAttribute("y2",ey);pt.setAttribute("cx",p[0]);pt.setAttribute("cy",p[1]);
  ln.style.opacity=vis?1:0;pt.style.opacity=vis?1:0;});}
 let t0=performance.now();
 function quadro(){
  tam();
  if(gira&&!arr&&!sel)alvo.yaw+=cfg.giro||.0016;
  const k=.09;cam.yaw+=(alvo.yaw-cam.yaw)*k;cam.pitch+=(alvo.pitch-cam.pitch)*k;cam.dist+=(alvo.dist-cam.dist)*k;for(let i=0;i<3;i++)cam.tgt[i]+=(alvo.tgt[i]-cam.tgt[i])*k;
  if(cfg.anima)cfg.anima((performance.now()-t0)/1000,api);
  desenha(false);pintaTags();if(!TESTE)requestAnimationFrame(quadro);
 }
 function escolhe(x,y){const r=cv.getBoundingClientRect();const px=Math.round((x-r.left)*dpr),py=Math.round(H-(y-r.top)*dpr);desenha(true);const b=new Uint8Array(4);gl.readPixels(px,py,1,1,gl.RGBA,gl.UNSIGNED_BYTE,b);desenha(false);return b[0]>0&&b[0]<=PARTES.length?PARTES[b[0]-1]:null;}
 /* reconstrução de malhas que mudam (ex.: estações do ano) */
 api.refaz=(nome,fn)=>{Object.keys(grupos).forEach(k=>{if(grupos[k].grupo===nome)delete grupos[k];});fn();const novos=Object.values(grupos).filter(g=>g.grupo===nome);
  for(let i=objs.length-1;i>=0;i--)if(objs[i].grupo===nome)objs.splice(i,1);novos.forEach(g=>objs.push({m:malha(g),org:g.org,c:g.c,cut:g.cut,nocut:g.nocut,solido:g.solido,emi:g.emi,a:g.a,grupo:g.grupo,mat:g.mat,vis:true}));};
 /* interação */
 let arr=null,mov=0,toques=new Map(),pinca=0;
 cv.addEventListener("pointerdown",e=>{toques.set(e.pointerId,[e.clientX,e.clientY]);arr={x:e.clientX,y:e.clientY};mov=0;cv.setPointerCapture(e.pointerId);cv.classList.add("arrasta");$(".mv-dica").style.opacity=0;if(toques.size===2){const [a,b]=[...toques.values()];pinca=Math.hypot(a[0]-b[0],a[1]-b[1]);}});
 cv.addEventListener("pointermove",e=>{
  if(toques.has(e.pointerId))toques.set(e.pointerId,[e.clientX,e.clientY]);
  if(toques.size===2){const [a,b]=[...toques.values()];const d=Math.hypot(a[0]-b[0],a[1]-b[1]);if(pinca){alvo.dist=Math.max(cfg.distMin||.25,Math.min(cfg.distMax||6,alvo.dist*pinca/d));}pinca=d;mov+=10;return;}
  if(arr){const dx=e.clientX-arr.x,dy=e.clientY-arr.y;mov+=Math.abs(dx)+Math.abs(dy);alvo.yaw-=dx*.008;alvo.pitch=Math.max(-1.35,Math.min(1.35,alvo.pitch+dy*.006));arr={x:e.clientX,y:e.clientY};return;}
  if(e.pointerType==="mouse"){const o=escolhe(e.clientX,e.clientY);sobre=o;cv.classList.toggle("sobre",!!o);const rt=$(".mv-rot");if(o){const r=cv.getBoundingClientRect();rt.textContent=o.n;rt.style.left=(e.clientX-r.left)+"px";rt.style.top=(e.clientY-r.top)+"px";rt.style.opacity=1;}else rt.style.opacity=0;}});
 const fim=e=>{toques.delete(e.pointerId);if(toques.size<2)pinca=0;cv.classList.remove("arrasta");const foi=arr;arr=null;if(foi&&mov<6&&e.type==="pointerup"){const o=escolhe(e.clientX,e.clientY);if(o)foca(o);else if(sel)geral();}};
 cv.addEventListener("pointerup",fim);cv.addEventListener("pointercancel",fim);
 cv.addEventListener("pointerleave",()=>{sobre=null;$(".mv-rot").style.opacity=0;});
 cv.addEventListener("wheel",e=>{e.preventDefault();alvo.dist=Math.max(cfg.distMin||.25,Math.min(cfg.distMax||6,alvo.dist*(1+e.deltaY*.001)));},{passive:false});
 function distBase(){const r=cv.getBoundingClientRect(),a=r.width/Math.max(1,r.height);return a<1?ini.dist/Math.max(.55,a)*.92:ini.dist;}
 function foca(o){
  sel=o;let f=(cfg.foco||{})[o.id];if(!f&&o.bb&&o.bb[0]<1e8){const b=o.bb,c=[(b[0]+b[3])/2,(b[1]+b[4])/2,(b[2]+b[5])/2],d=Math.max(b[3]-b[0],b[4]-b[1],b[5]-b[2]);f=[c,Math.max(.8,d*3.2),[0,.25,1]];}
  if(f){alvo.tgt=f[0].slice();alvo.dist=f[1]*(distBase()/ini.dist);const d=f[2]||f[0];if(Math.hypot(d[0],d[2])>.05)alvo.yaw=Math.atan2(d[0],d[2]);alvo.pitch=f[3]!==undefined?f[3]:Math.max(-.6,Math.min(.6,Math.atan2(d[1],Math.hypot(d[0],d[2]))*.6+.12));while(alvo.yaw-cam.yaw>PI)alvo.yaw-=2*PI;while(alvo.yaw-cam.yaw<-PI)alvo.yaw+=2*PI;}
  if(cfg.aoFocar)cfg.aoFocar(o,api);
  pinta();}
 function geral(){sel=null;alvo.tgt=ini.tgt.slice();alvo.dist=distBase();alvo.pitch=ini.pitch;if(cfg.aoFocar)cfg.aoFocar(null,api);pinta();}
 function pinta(){
  const o=sel,inf=$(".mv-info"),g=cfg.geral;
  const dl=x=>x&&x.length?`<dl>${x.map(([a,b])=>`<dt>${esc(a)}</dt><dd>${esc(b)}</dd>`).join("")}</dl>`:"";
  if(!o)inf.innerHTML=`<span class="k"><i style="--c:#FFC928"></i>${esc(g.k||"Visão geral")}</span><h2>${esc(g.t||cfg.titulo)}</h2><p>${esc(g.f)}</p>${dl(g.dl)}${g.pas?`<div class="pas"><b>No PAS</b>${esc(g.pas)}</div>`:""}`;
  else inf.innerHTML=`<span class="k"><i style="--c:${rgb(o.c)}"></i>${esc(cfg.rotParte||"Parte")}</span><h2>${esc(o.n)}</h2><p>${esc(o.f)}</p>${dl(o.dl)}${o.pas?`<div class="pas"><b>Como costuma cair</b>${esc(o.pas)}</div>`:""}`;
  raiz.querySelectorAll(".mv-org").forEach(b=>b.setAttribute("aria-current",String(!!o&&b.dataset.id===o.id)));}
 const lista=$(".mv-lista");
 PARTES.filter(o=>!o.oculto).forEach(o=>{const b=document.createElement("button");b.type="button";b.className="mv-org";b.dataset.id=o.id;b.style.setProperty("--c",rgb(o.c));b.innerHTML=`<i></i>${esc(o.n)}`;b.addEventListener("click",()=>sel===o?geral():foca(o));lista.appendChild(b);});
 raiz.addEventListener("click",e=>{const b=e.target.closest(".mv-bt");if(!b)return;const k=b.dataset.b;
  if(k==="corte"){corte=!corte;b.setAttribute("aria-pressed",corte);}else if(k==="gira"){gira=!gira;b.setAttribute("aria-pressed",gira);}else if(k==="geral")geral();else if(cfg.aoBotao)cfg.aoBotao(k,b,api);});
 if(!gira){const b=raiz.querySelector('[data-b="gira"]');if(b)b.setAttribute("aria-pressed","false");}
 addEventListener("keydown",e=>{if(e.key==="Escape")geral();});
 if(cfg.slider){const inp=raiz.querySelector(".mv-slider input"),sv=raiz.querySelector(".mv-sv");const up=()=>{sv.textContent=cfg.slider.fmt?cfg.slider.fmt(+inp.value):inp.value;cfg.slider.muda(+inp.value,api);};inp.addEventListener("input",up);up();}
 api.foca=id=>foca(BY[id]);api.geral=geral;api.pinta=pinta;api.sel=()=>sel;api.corte=()=>corte;api.poeCorte=v=>{corte=!!v;const b=raiz.querySelector('[data-b="corte"]');if(b)b.setAttribute("aria-pressed",corte);};
 pinta();alvo.dist=cam.dist=distBase();quadro();
 window.__mv={quadro:()=>{tam();desenha(false);pintaTags();},foca:(id,snap)=>{foca(BY[id]);if(snap){Object.assign(cam,JSON.parse(JSON.stringify(alvo)));}},geral:()=>{geral();Object.assign(cam,JSON.parse(JSON.stringify(alvo)));},api,cam,alvo,corte:v=>{corte=v;},sel:id=>{sel=id?BY[id]:null;},q:()=>{Object.assign(cam,JSON.parse(JSON.stringify(alvo)));tam();desenha(false);pintaTags();}};
 return api;
};
})();
