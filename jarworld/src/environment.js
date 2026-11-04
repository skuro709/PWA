export const REGIONS=[
{id:"japan",name:"Japan",offset:9,hemisphere:"north"},{id:"korea",name:"Korea",offset:9,hemisphere:"north"},{id:"china",name:"China",offset:8,hemisphere:"north"},{id:"singapore",name:"Singapore",offset:8,hemisphere:"south"},{id:"australia",name:"Australia",offset:10,hemisphere:"south"},{id:"uk",name:"United Kingdom",offset:0,hemisphere:"north"},{id:"france",name:"France",offset:1,hemisphere:"north"},{id:"germany",name:"Germany",offset:1,hemisphere:"north"},{id:"us-east",name:"US East",offset:-5,hemisphere:"north"},{id:"us-west",name:"US West",offset:-8,hemisphere:"north"},{id:"canada",name:"Canada",offset:-5,hemisphere:"north"},{id:"brazil",name:"Brazil",offset:-3,hemisphere:"south"}
];
export function getEnvironment(regionId,now=new Date()){
  const r=REGIONS.find(x=>x.id===regionId)||REGIONS[0];
  const utc=now.getTime()+now.getTimezoneOffset()*60000;
  const local=new Date(utc+r.offset*3600000),h=local.getHours();
  const period=h>=5&&h<10?"morning":h>=10&&h<17?"day":h>=17&&h<21?"evening":"night";
  const month=local.getMonth()+1;
  const north=[3,4,5].includes(month)?"spring":[6,7,8].includes(month)?"summer":[9,10,11].includes(month)?"autumn":"winter";
  const south={spring:"autumn",summer:"winter",autumn:"spring",winter:"summer"};
  return {region:r,period,season:r.hemisphere==="north"?north:south[north]};
}