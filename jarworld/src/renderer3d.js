export class Renderer3D{
  constructor(canvas){
    this.canvas=canvas;this.gl=canvas.getContext("webgl",{alpha:true,antialias:true});
    this.angle=.35;this.pitch=.12;this.distance=3.2;this.drag=null;
    if(this.gl)this.init();
    canvas.addEventListener("pointerdown",e=>{this.drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId)});
    canvas.addEventListener("pointermove",e=>{if(!this.drag)return;this.angle+=(e.clientX-this.drag.x)*.008;this.pitch=Math.max(-.8,Math.min(.8,this.pitch+(e.clientY-this.drag.y)*.006));this.drag={x:e.clientX,y:e.clientY}});
    canvas.addEventListener("pointerup",()=>this.drag=null);
    canvas.addEventListener("wheel",e=>{e.preventDefault();this.distance=Math.max(2.1,Math.min(5,e.deltaY>0?this.distance+.15:this.distance-.15))},{passive:false});
  }
  init(){
    const gl=this.gl;
    const vs=`attribute vec3 p;attribute vec3 c;uniform mat4 m;varying vec3 v;void main(){v=c;gl_Position=m*vec4(p,1.);}`;
    const fs=`precision mediump float;varying vec3 v;void main(){gl_FragColor=vec4(v,.92);}`;
    const compile=(t,s)=>{const sh=gl.createShader(t);gl.shaderSource(sh,s);gl.compileShader(sh);return sh};
    const p=gl.createProgram();gl.attachShader(p,compile(gl.VERTEX_SHADER,vs));gl.attachShader(p,compile(gl.FRAGMENT_SHADER,fs));gl.linkProgram(p);this.program=p;
    this.pos=gl.getAttribLocation(p,"p");this.col=gl.getAttribLocation(p,"c");this.mat=gl.getUniformLocation(p,"m");
    this.buf=gl.createBuffer();
  }
  resize(){const r=this.canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);this.canvas.width=Math.max(1,r.width*d);this.canvas.height=Math.max(1,r.height*d);this.gl.viewport(0,0,this.canvas.width,this.canvas.height)}
  cube(x,y,z,s,c,out){
    const a=x-s,b=y-s,d=z-s,e=x+s,f=y+s,g=z+s;
    const vs=[[a,b,d],[e,b,d],[e,f,d],[a,f,d],[a,b,g],[e,b,g],[e,f,g],[a,f,g]];
    const idx=[0,1,2,0,2,3,4,6,5,4,7,6,0,4,5,0,5,1,3,2,6,3,6,7,1,5,6,1,6,2,0,3,7,0,7,4];
    for(let i=0;i<idx.length;i++){out.p.push(...vs[idx[i]]);out.c.push(...c)}
  }
  draw(sim,environment){
    if(!this.gl)return;
    this.resize();const gl=this.gl;gl.clearColor(.01,.03,.025,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);
    const data={p:[],c:[]},W=sim.width,H=sim.height,world=sim.world,step=Math.max(2,Math.floor(W/32));
    const colors={1:[.78,.63,.36],2:[.25,.65,.8],3:[.35,.24,.16],4:[.78,.25,.1],5:[.6,.75,.3],6:[.28,.58,.3],7:[.42,.45,.44],8:[.42,.38,.32]};
    for(let y=0;y<H;y+=step)for(let x=0;x<W;x+=step){const v=world[y*W+x],c=colors[v];if(!c)continue;const xx=(x/W-.5)*1.55,yy=(.5-y/H)*1.85,zz=0;this.cube(xx,yy,zz,.035,c,data)}
    const glass=[];this.cube(0,0,0,.84,[.34,.72,.62],glass);data.p.push(...glass.p);data.c.push(...glass.c);
    const vp=perspective(1.0,this.canvas.width/this.canvas.height,.05,20),view=lookAt([Math.sin(this.angle)*this.distance,Math.sin(this.pitch)*this.distance*.6,Math.cos(this.angle)*this.distance],[0,0,0],[0,1,0]),m=multiply(vp,view);
    gl.useProgram(this.program);gl.uniformMatrix4fv(this.mat,false,m);gl.bindBuffer(gl.ARRAY_BUFFER,this.buf);
    const inter=new Float32Array(data.p.length+data.c.length);let n=0;for(let i=0;i<data.p.length/3;i++){inter[n++]=data.p[i*3];inter[n++]=data.p[i*3+1];inter[n++]=data.p[i*3+2];inter[n++]=data.c[i*3];inter[n++]=data.c[i*3+1];inter[n++]=data.c[i*3+2]}
    gl.bufferData(gl.ARRAY_BUFFER,inter,gl.DYNAMIC_DRAW);gl.enableVertexAttribArray(this.pos);gl.vertexAttribPointer(this.pos,3,gl.FLOAT,false,24,0);gl.enableVertexAttribArray(this.col);gl.vertexAttribPointer(this.col,3,gl.FLOAT,false,24,12);gl.drawArrays(gl.TRIANGLES,0,data.p.length/3);
  }
}
function perspective(fovy,aspect,near,far){const f=1/Math.tan(fovy/2),nf=1/(near-far);return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)*nf,-1,0,0,2*far*near*nf,0])}
function lookAt(e,c,u){let z=norm(sub(e,c)),x=norm(cross(u,z)),y=cross(z,x);return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,e),-dot(y,e),-dot(z,e),1])}
function multiply(a,b){const o=new Float32Array(16);for(let r=0;r<4;r++)for(let c=0;c<4;c++)o[c+r*4]=a[r*4]*b[c]+a[r*4+1]*b[c+4]+a[r*4+2]*b[c+8]+a[r*4+3]*b[c+12];return o}
function sub(a,b){return[a[0]-b[0],a[1]-b[1],a[2]-b[2]]}function dot(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]}function cross(a,b){return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]}function norm(a){const n=Math.hypot(...a)||1;return a.map(v=>v/n)}