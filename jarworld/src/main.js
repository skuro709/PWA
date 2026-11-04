import {Simulation,MATERIALS} from "./simulation.js";
import {Renderer2D} from "./renderer2d.js";
import {Renderer3D} from "./renderer3d.js";
import {REGIONS,getEnvironment} from "./environment.js";
import {loadSettings,saveSettings,loadWorld,saveWorld} from "./storage.js";
import {makePayload,makeShareUrl,readSharePayload,downloadPayload} from "./sharing.js";

const $=s=>document.querySelector(s);
const sim=new Simulation();
const settings=loadSettings();
let regionId=settings.region||"japan";
let mode=settings.mode||(matchMedia("(max-width:900px)").matches?"2d":"3d");
let material=MATERIALS.sand,brush=3,last=performance.now(),raf=0,deferredPrompt=null;
const r2=new Renderer2D($("#canvas2d")),r3=new Renderer3D($("#canvas3d"));

for(const r of REGIONS){const o=document.createElement("option");o.value=r.id;o.textContent=r.name;$("#regionSelect").append(o)}
$("#regionSelect").value=regionId;

function updateEnvironment(){const e=getEnvironment(regionId);$("#regionLabel").textContent=e.region.name;$("#periodLabel").textContent=e.period[0].toUpperCase()+e.period.slice(1);$("#seasonLabel").textContent=e.season[0].toUpperCase()+e.season.slice(1);return e}
function setMode(next,force=false){
  if(next==="3d"&&!force&&matchMedia("(max-width:900px)").matches){$("#warningDialog").showModal();return}
  mode=next;$("#mode2d").classList.toggle("active",mode==="2d");$("#mode3d").classList.toggle("active",mode==="3d");$("#canvas2d").style.display=mode==="2d"?"block":"none";$("#canvas3d").style.display=mode==="3d"?"block":"none";settings.mode=mode;saveSettings(settings)
}
function markSaved(){saveWorld({version:1,width:sim.width,height:sim.height,world:sim.serialize(),region:regionId});$("#saveStatus").textContent="Saved"}
function paintFromEvent(e){const rect=(mode==="2d"?$("#canvas2d"):$("#canvas3d")).getBoundingClientRect();const x=Math.floor((e.clientX-rect.left)/rect.width*sim.width),y=Math.floor((e.clientY-rect.top)/rect.height*sim.height);sim.paint(x,y,material,brush);$("#saveStatus").textContent="Editing"}
async function initialize(){
  await sim.init();$("#engineLabel").textContent=sim.isWasm?"WebAssembly":"JavaScript fallback";
  const saved=loadWorld();if(saved&&saved.width===sim.width&&saved.height===sim.height)sim.deserialize(saved.world);else sim.reset();
  const shared=readSharePayload();if(shared?.world&&shared.width===sim.width&&shared.height===sim.height){sim.deserialize(shared.world);if(shared.region)regionId=shared.region;settings.region=regionId;saveSettings(settings)}
  updateEnvironment();setMode(mode,true);markSaved();$("#sceneEmpty").hidden=true;
}
$("#brushSize").addEventListener("input",e=>{$("#brushValue").textContent=e.target.value;brush=+e.target.value});
document.querySelectorAll(".material").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll(".material").forEach(x=>x.classList.remove("active"));b.classList.add("active");material=MATERIALS[b.dataset.material]}));
for(const c of [$("#canvas2d"),$("#canvas3d")]){c.addEventListener("pointerdown",e=>{paintFromEvent(e);c.setPointerCapture(e.pointerId)});c.addEventListener("pointermove",e=>{if(e.buttons)paintFromEvent(e)})}
$("#mode2d").onclick=()=>setMode("2d");$("#mode3d").onclick=()=>setMode("3d");
$("#settingsButton").onclick=()=>{$("#regionSelect").value=regionId;$("#settingsDialog").showModal()};
$("#settingsDialog").addEventListener("close",()=>{if($("#settingsDialog").returnValue!=="cancel"){regionId=$("#regionSelect").value;settings.region=regionId;saveSettings(settings);updateEnvironment()}});
$("#resetButton").onclick=()=>{sim.reset();markSaved()};
$("#warningCancel").onclick=()=>$("#warningDialog").close();$("#warningClose").onclick=()=>$("#warningDialog").close();$("#warningConfirm").onclick=()=>{$("#warningDialog").close();setMode("3d",true)};
$("#shareButton").onclick=()=>{$("#shareDialog").showModal();$("#shareMessage").textContent=""};
$("#shareClose").onclick=()=>$("#shareDialog").close();
$("#copyShare").onclick=async()=>{const url=makeShareUrl(makePayload(sim,settings));await navigator.clipboard.writeText(url);$("#shareMessage").textContent="Share link copied."};
$("#nativeShare").onclick=async()=>{const url=makeShareUrl(makePayload(sim,settings));if(navigator.share)await navigator.share({title:"JarWorld",text:"A JarWorld world snapshot",url});else{await navigator.clipboard.writeText(url);$("#shareMessage").textContent="Share link copied."}};
$("#downloadWorld").onclick=()=>downloadPayload(makePayload(sim,settings));
$("#importWorld").addEventListener("change",async e=>{const f=e.target.files[0];if(!f)return;try{const p=JSON.parse(await f.text());if(p.format==="jarworld"&&p.width===sim.width&&p.height===sim.height){sim.deserialize(p.world);if(p.region)regionId=p.region;settings.region=regionId;saveSettings(settings);markSaved();updateEnvironment();$("#shareMessage").textContent="World imported."}else throw new Error()}catch{$("#shareMessage").textContent="The file could not be imported."}e.target.value=""});
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e;$("#installButton").hidden=false});
$("#installButton").onclick=async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();deferredPrompt=null;$("#installButton").hidden=true};
navigator.serviceWorker?.register("./sw.js").catch(()=>{});
function frame(t){const dt=Math.min(.05,(t-last)/1000);last=t;sim.step(dt);const env=updateEnvironment();if(mode==="2d")r2.draw(sim,env);else r3.draw(sim,env);$("#cellCount").textContent=`${sim.active()} cells`;raf=requestAnimationFrame(frame);if(t%5000<20)markSaved()}
initialize().then(()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(frame)});