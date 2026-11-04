#include "simulation.hpp"
#include <algorithm>
#include <cstdint>
#include <vector>

namespace {
int W=0,H=0;
std::vector<std::uint8_t> world;
std::vector<std::uint8_t> nextWorld;
std::uint32_t rngState=0x9e3779b9u;

enum Cell : std::uint8_t { EMPTY=0,SAND=1,WATER=2,SOIL=3,LAVA=4,SEED=5,PLANT=6,ROCK=7,ASH=8 };

std::uint32_t rnd(){rngState^=rngState<<13;rngState^=rngState>>17;rngState^=rngState<<5;return rngState;}

bool inside(int x,int y){return x>=0&&x<W&&y>=0&&y<H;}
std::uint8_t at(int x,int y){return inside(x,y)?world[y*W+x]:ROCK;}
void put(int x,int y,std::uint8_t v){if(inside(x,y))nextWorld[y*W+x]=v;}

void movePowder(int x,int y,std::uint8_t type){
    int i=y*W+x;
    if(world[i]!=type)return;
    if(y+1<H && world[(y+1)*W+x]==EMPTY){put(x,y,EMPTY);put(x,y+1,type);return;}
    int dir=(rnd()&1)?1:-1;
    if(y+1<H && x+dir>=0 && x+dir<W && world[(y+1)*W+x+dir]==EMPTY){put(x,y,EMPTY);put(x+dir,y+1,type);return;}
    if(type==SAND && y+1<H && world[(y+1)*W+x]==WATER){put(x,y,WATER);put(x,y+1,SAND);return;}
    if(type==LAVA){
        for(int dx=-1;dx<=1;dx+=2) if(inside(x+dx,y)&&world[y*W+x+dx]==WATER){put(x,y,ROCK);put(x+dx,y,ROCK);return;}
    }
}
void moveWater(int x,int y){
    int i=y*W+x;if(world[i]!=WATER)return;
    if(y+1<H && world[(y+1)*W+x]==EMPTY){put(x,y,EMPTY);put(x,y+1,WATER);return;}
    int d=(rnd()&1)?1:-1;
    for(int n=0;n<2;n++,d=-d) if(x+d>=0&&x+d<W&&world[y*W+x+d]==EMPTY){put(x,y,EMPTY);put(x+d,y,WATER);return;}
}
void grow(){
    if((rnd()%24)!=0)return;
    for(int y=H-2;y>1;y--) for(int x=1;x<W-1;x++){
        if(world[y*W+x]!=SEED)continue;
        bool soil=false;
        for(int dx=-1;dx<=1;dx++) if(world[(y+1)*W+x+dx]==SOIL){soil=true;break;}
        if(!soil)continue;
        world[y*W+x]=PLANT;
        if(y>1)world[(y-1)*W+x]=PLANT;
    }
}
}

extern "C" {
void jw_init(int width,int height){
    W=std::max(8,width);H=std::max(8,height);
    world.assign(W*H,EMPTY);nextWorld=world;jw_reset();
}
void jw_reset(){
    if(W<=0||H<=0)return;
    std::fill(world.begin(),world.end(),EMPTY);
    for(int y=H-8;y<H;y++)for(int x=0;x<W;x++)world[y*W+x]=SOIL;
    for(int y=H-16;y<H-8;y++)for(int x=W/4;x<3*W/4;x++) if((rnd()%5)<3)world[y*W+x]=SAND;
    for(int x=W/2-2;x<W/2+3;x++)world[(H-9)*W+x]=SEED;
    for(int x=3;x<W-3;x++)if((rnd()%80)==0)world[(H-9)*W+x]=ROCK;
}
void jw_step(float){
    if(W<=0||H<=0)return;
    nextWorld=world;
    for(int y=H-1;y>=0;y--)for(int x=0;x<W;x++){
        switch(world[y*W+x]){
            case SAND: case LAVA: movePowder(x,y,world[y*W+x]); break;
            case WATER: moveWater(x,y); break;
            case ASH: movePowder(x,y,ASH); break;
            default: break;
        }
    }
    world.swap(nextWorld);
    grow();
    for(int y=1;y<H-1;y++)for(int x=1;x<W-1;x++) if(world[y*W+x]==PLANT && (rnd()%140)==0){
        if(world[(y+1)*W+x]==WATER) world[(y+1)*W+x]=SOIL;
    }
}
void jw_paint(int x,int y,int material,int radius){
    if(W<=0||H<=0)return;
    for(int yy=y-radius;yy<=y+radius;yy++)for(int xx=x-radius;xx<=x+radius;xx++){
        if(!inside(xx,yy))continue;
        int dx=xx-x,dy=yy-y;if(dx*dx+dy*dy>radius*radius)continue;
        world[yy*W+xx]=static_cast<std::uint8_t>(std::clamp(material,0,8));
    }
}
std::uint8_t* jw_world(){return world.data();}
int jw_width(){return W;}
int jw_height(){return H;}
int jw_active_count(){int n=0;for(auto v:world)if(v!=EMPTY)n++;return n;}
}