const COLORS={0:null,1:"#d7bb82",2:"#68b8d6",3:"#765844",4:"#d36d3e",5:"#b8d76e",6:"#6cae6c",7:"#777d79",8:"#8b8274"};
export class Renderer2D{
  constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext("2d",{alpha:true});this.dpr=Math.min(devicePixelRatio||1,2)}
  resize(){const r=this.canvas.getBoundingClientRect();this.canvas.width=Math.max(1,Math.floor(r.width*this.dpr));this.canvas.height=Math.max(1,Math.floor(r.height*this.dpr))}
  draw(sim,environment){
    this.resize();
    const {ctx}=this,{width:W,height:H}=sim;ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
    const cw=this.canvas.width/W,ch=this.canvas.height/H;
    const tint=environment.period==="night"?"#06100c":environment.period==="evening"?"#17140e":environment.period==="morning"?"#0d1814":"#0b1713";
    ctx.fillStyle=tint;ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
    const world=sim.world;
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const v=world[y*W+x],c=COLORS[v];if(!c)continue;ctx.fillStyle=c;ctx.fillRect(Math.floor(x*cw),Math.floor(y*ch),Math.ceil(cw)+.3,Math.ceil(ch)+.3)}
    ctx.globalAlpha=.28;ctx.strokeStyle="#dff9ed";ctx.lineWidth=1;for(let x=0;x<W;x+=8){ctx.beginPath();ctx.moveTo(x*cw,0);ctx.lineTo(x*cw,this.canvas.height);ctx.stroke()}ctx.globalAlpha=1;
  }
}