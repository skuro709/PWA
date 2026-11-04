const KEY="jarworld-final-world";
const SETTINGS="jarworld-final-settings";
export function loadSettings(){try{return JSON.parse(localStorage.getItem(SETTINGS))||{region:"japan",mode:matchMedia("(max-width:900px)").matches?"2d":"3d"}}catch{return{region:"japan",mode:"2d"}}}
export function saveSettings(v){localStorage.setItem(SETTINGS,JSON.stringify(v))}
export function loadWorld(){try{return JSON.parse(localStorage.getItem(KEY))}catch{return null}}
export function saveWorld(world){localStorage.setItem(KEY,JSON.stringify(world))}