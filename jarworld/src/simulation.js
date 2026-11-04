import { loadWasm } from "./wasm/loader.js";

export const MATERIALS = Object.freeze({
  erase:0,sand:1,water:2,soil:3,lava:4,seed:5,plant:6,rock:7,ash:8
});

const W = 96;
const H = 128;

class JsFallback {
  constructor(){this.width=W;this.height=H;this.world=new Uint8Array(W*H);this.reset()}
  reset(){
    this.world.fill(0);
    for(let y=this.height-8;y<this.height;y++)this.world.fill(MATERIALS.soil,y*this.width,(y+1)*this.width);
    for(let y=this.height-16;y<this.height-8;y++)for(let x=Math.floor(this.width*.24);x<Math.floor(this.width*.76);x++)if(Math.random()<.55)this.world[y*this.width+x]=MATERIALS.sand;
    for(let x=Math.floor(this.width/2)-2;x<=Math.floor(this.width/2)+2;x++)this.world[(this.height-9)*this.width+x]=MATERIALS.seed;
  }
  step(){
    for(let y=this.height-1;y>=0;y--)for(let x=0;x<this.width;x++){
      const i=y*this.width+x,v=this.world[i];
      if(v===MATERIALS.sand||v===MATERIALS.lava||v===MATERIALS.ash){
        if(y+1<this.height&&this.world[i+this.width]===0){this.world[i+this.width]=v;this.world[i]=0}
      }else if(v===MATERIALS.water&&y+1<this.height&&this.world[i+this.width]===0){this.world[i+this.width]=v;this.world[i]=0}
    }
  }
  paint(x,y,m,r){for(let yy=y-r;yy<=y+r;yy++)for(let xx=x-r;xx<=x+r;xx++){if(xx<0||yy<0||xx>=this.width||yy>=this.height)continue;if((xx-x)**2+(yy-y)**2<=r*r)this.world[yy*this.width+xx]=m}}
  active(){let n=0;for(const v of this.world)if(v)n++;return n}
  serialize(){return Array.from(this.world)}
  deserialize(a){if(Array.isArray(a)&&a.length===this.world.length)this.world.set(a)}
}

export class Simulation {
  constructor(){this.engine=null;this.ready=false;this.isWasm=false}
  async init(){
    try{
      const m=await loadWasm();
      m._jw_init(W,H);
      this.engine=m;
      this.isWasm=true;
    }catch{
      this.engine=new JsFallback();
      this.isWasm=false;
    }
    this.ready=true;
  }
  get width(){return this.isWasm?this.engine._jw_width():this.engine.width}
  get height(){return this.isWasm?this.engine._jw_height():this.engine.height}
  get world(){
    if(!this.isWasm)return this.engine.world;
    const ptr=this.engine._jw_world();
    return this.engine.HEAPU8.subarray(ptr,ptr+this.width*this.height);
  }
  reset(){this.isWasm?this.engine._jw_reset():this.engine.reset()}
  step(dt=.016){this.isWasm?this.engine._jw_step(dt):this.engine.step(dt)}
  paint(x,y,m,r){this.isWasm?this.engine._jw_paint(x,y,m,r):this.engine.paint(x,y,m,r)}
  active(){return this.isWasm?this.engine._jw_active_count():this.engine.active()}
  serialize(){return Array.from(this.world)}
  deserialize(a){if(!Array.isArray(a)||a.length!==this.width*this.height)return false;if(this.isWasm){const w=this.world;w.set(a)}else this.engine.deserialize(a);return true}
}