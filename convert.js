/* ME-Tech Calcshot: categories, from unit, number, to unit, swap */
(function(){
"use strict";
var $=function(i){return document.getElementById(i)};
var host=$("v-conv");if(!host)return;
var KEY="metech_convert_v2";
var ST={og:-1,per:{},ex:{sub:"CH4",cm:"",lhv:"",rho:"",patm:"1013.25",u:"",pf:"",ph:"3",t:"",pa:"1013.25",xw:"",o2m:"",o2r:"",sfoc:"",pg:"1.01325",tg:"15",ptot:"1.01325",cyc:"1"},q:""};
try{var s0=JSON.parse(localStorage.getItem(KEY)||"{}");if(s0&&typeof s0==="object"){ST.per=s0.per||{};if(typeof s0.og==="number")ST.og=s0.og;for(var k0 in (s0.ex||{}))ST.ex[k0]=s0.ex[k0]}}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify({og:ST.og,per:ST.per,ex:ST.ex}))}catch(e){}}
function esc(t){return String(t==null?"":t).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}

/* ---------- constants (defined values) ---------- */
var G=9.80665,LB=0.45359237,IN=0.0254,FT=0.3048,GAL=3.785411784e-3,UKGAL=4.54609e-3,BTU=1055.05585262,
    HPI=745.69987158227022,PS=75*G,BBL=0.158987294928,KCAL=4186.8,R=8.314462618;
function vm(T){return R*T/101325} /* m3/mol of an ideal gas at 1.01325 bar */
/* standard atmosphere (ISA), troposphere */
var ISA_P0=1013.25,ISA_A=0.0065/288.15,ISA_N=5.25588;
/* humid air: Magnus formula (Sonntag 1990), valid -45 to 60 degC */
var MW=18.01528,MA=28.9647;
function es(T){return 6.112*Math.exp(17.62*T/(243.12+T))}
function dewOf(e){var l=Math.log(e/6.112);return 243.12*l/(17.62-l)}

/* ---------- unit helpers ---------- */
function L(id,label,f){return {id:id,label:label,needs:[],to:function(v){return v*f},from:function(b){return b/f}}}
function N(id,label,needs,to,from){return {id:id,label:label,needs:needs,to:to,from:from}}
var ATOM={H:1.008,C:12.011,N:14.007,O:15.999,S:32.06,Ar:39.948,He:4.0026};
var SUB=[
 {id:"CH4",name:"Methane, CH4",f:{C:1,H:4}},{id:"C2H6",name:"Ethane, C2H6",f:{C:2,H:6}},{id:"C3H8",name:"Propane, C3H8",f:{C:3,H:8}},
 {id:"C4H10",name:"Butane, C4H10",f:{C:4,H:10}},{id:"CH3OH",name:"Methanol, CH3OH",f:{C:1,H:4,O:1}},
 {id:"NO",name:"Nitric oxide, NO",f:{N:1,O:1}},{id:"NO2",name:"Nitrogen dioxide, NO2",f:{N:1,O:2}},{id:"N2O",name:"Nitrous oxide, N2O",f:{N:2,O:1}},
 {id:"CO",name:"Carbon monoxide, CO",f:{C:1,O:1}},{id:"CO2",name:"Carbon dioxide, CO2",f:{C:1,O:2}},
 {id:"SO2",name:"Sulphur dioxide, SO2",f:{S:1,O:2}},{id:"O2",name:"Oxygen, O2",f:{O:2}},{id:"N2",name:"Nitrogen, N2",f:{N:2}},
 {id:"H2",name:"Hydrogen, H2",f:{H:2}},{id:"H2O",name:"Water, H2O",f:{H:2,O:1}},{id:"NH3",name:"Ammonia, NH3",f:{N:1,H:3}},
 {id:"H2S",name:"Hydrogen sulphide, H2S",f:{H:2,S:1}},{id:"Ar",name:"Argon, Ar",f:{Ar:1}}
];
function molar(f){var m=0;for(var a in f)m+=ATOM[a]*f[a];return m}
function subById(id){for(var i=0;i<SUB.length;i++)if(SUB[i].id===id)return SUB[i];return null}
function mgm3(T){return N("mg"+Math.round(T-273.15),"mg/m³ at "+Math.round(T-273.15)+" °C, 1.01325 bar"+(T===273.15?" (Nm³)":"")+" (needs substance)",["M"],
  function(v,c){return v*vm(T)*1000/c.M},function(b,c){return b*c.M/(vm(T)*1000)})}
/* gauge / absolute pressure: base = Pa absolute */
function gauge(id,label,f){return N(id,label,["patm"],function(v,c){return v*f+c.patm},function(b,c){return (b-c.patm)/f})}

/* extra input fields shown above the From box */
var EXF={
 sub:[{t:"sub"}],
 fuel:[{k:"lhv",label:"Heating value, LHV (MJ/kg)",ph:"from the fuel analysis"},{k:"rho",label:"Density (kg/m³)",ph:"for volume, for example at 15 °C"}],
 gauge:[{k:"patm",label:"Atmospheric pressure (mbar)",ph:"1013.25 is the standard atmosphere"}],
 elec:[{k:"ph",label:"Phases",t:"sel",opts:[["3","Three phase"],["1","Single phase"]]},{k:"u",label:"Voltage between lines (V)",ph:"for example 400"},{k:"pf",label:"Power factor, cos φ (0 to 1)",ph:"for example 0.8"}],
 humid:[{k:"t",label:"Air temperature (°C)",ph:"between -45 and 60"},{k:"pa",label:"Air pressure (hPa)",ph:"1013.25 is the standard atmosphere"}],
 basis:[{k:"xw",label:"Water vapour in the gas (% by volume)",ph:"for wet basis"},{k:"o2m",label:"Measured O₂ (% dry)",ph:"for reference O₂"},{k:"o2r",label:"Reference O₂ (%)",ph:"for example 15"}],
 gasv:[{t:"sub"},{k:"pg",label:"Pressure (bar, absolute)",ph:"1.01325 is the standard atmosphere"},{k:"tg",label:"Temperature (\u00b0C)",ph:"for example 15"}],
 dalton:[{k:"ptot",label:"Total pressure (bar, absolute)",ph:"1.01325 is the standard atmosphere"}],
 eff:[{k:"lhv",label:"Heating value, LHV (MJ/kg)",ph:"from the fuel analysis"}],
 sfoc:[{k:"sfoc",label:"SFOC (g/kWh)",ph:"fuel used per kWh"},{k:"lhv",label:"Heating value, LHV (MJ/kg)",ph:"only for g per MJ of fuel"}]
};
var NOTE={
 sub:"Molar masses are calculated from standard atomic weights. Gas volumes assume an ideal gas at 1.01325 bar.",
 gauge:"Gauge pressure is measured above the atmosphere, absolute pressure from zero. The standard atmosphere is already filled in, replace it with the reading from your barometer.",
 elec:"Power P = √3 · U · I · cos φ for three phase, P = U · I · cos φ for single phase. kW is active power, kVA is apparent power.",
 humid:"Magnus formula (Sonntag 1990), valid between -45 and 60 °C, accurate to a few tenths of a degree. Humidity ratio uses water 18.015 and dry air 28.965 g/mol.",
 basis:"Same quantity in all units, only the basis changes. Reference O₂ correction: C ref = C meas · (21 − O₂ ref) / (21 − O₂ meas), with O₂ in % dry. Wet basis: C wet = C dry · (1 − water fraction).",
 gasv:"Ideal gas, n = p \u00b7 V / (R \u00b7 T). The conversion also works for flows, for example m\u00b3/h to Nm\u00b3/h, because the time cancels.",
 dalton:"Dalton's law: partial pressure = mole fraction \u00b7 total pressure. Mole fraction and volume fraction are the same for an ideal gas.",
 eff:"Efficiency = 3600 / (SFOC \u00b7 LHV), with SFOC in g/kWh and LHV in MJ/kg. Fuel energy per kWh = SFOC \u00b7 LHV.",
 sfoc:"g/kg fuel = g/kWh · 1000 / SFOC. g per MJ of fuel energy = g/kg fuel / LHV."
};

/* ---------- categories ---------- */
var CATS=[
 {id:"power",g:0,name:"Power",sym:"kW",def:["kW","PS"],units:[L("W","W",1),L("kW","kW",1e3),L("MW","MW",1e6),L("PS","PS, hk (metric hp, 735.499 W)",PS),L("hpm","hp (mechanical, 745.700 W)",HPI),L("hpe","hp (electric, 746 W)",746),L("btuh","BTU/h",BTU/3600),L("kcalh","kcal/h (IT)",KCAL/3600),L("TR","TR (ton of refrigeration, 12 000 BTU/h)",12000*BTU/3600)]},
 {id:"elec",g:0,name:"Electrical: kW, kVA, A",sym:"kVA",ex:"elec",def:["kW","A"],units:[
   L("W","W (active)",1),L("kW","kW (active)",1e3),
   N("kVA","kVA (apparent)",["pf"],function(v,c){return v*1e3*c.pf},function(b,c){return b/(1e3*c.pf)}),
   N("kVAr","kVAr (reactive)",["pf"],function(v,c){return v*1e3*c.pf/Math.sqrt(1-c.pf*c.pf)},function(b,c){return b*Math.sqrt(1-c.pf*c.pf)/(1e3*c.pf)}),
   N("A","A (line current)",["u","pf"],function(v,c){return v*(c.ph===1?1:Math.sqrt(3))*c.u*c.pf},function(b,c){return b/((c.ph===1?1:Math.sqrt(3))*c.u*c.pf)})]},
 {id:"volt",g:0,name:"Voltage",sym:"V",def:["V","kV"],units:[L("uV","\u00b5V",1e-6),L("mV","mV",1e-3),L("V","V",1),L("kV","kV",1e3),L("MV","MV",1e6)]},
 {id:"amp",g:0,name:"Current",sym:"A",def:["A","mA"],units:[L("uA","\u00b5A",1e-6),L("mA","mA",1e-3),L("A","A",1),L("kA","kA",1e3)]},
 {id:"fflow",g:1,name:"Fuel flow, SFOC and power",sym:"kg/h",hint:"fuel flow = SFOC x power",custom:"rel",units:[],def:[]},
 {id:"effuel",g:1,name:"Efficiency from fuel flow",sym:"\u03b7",hint:"power, efficiency, fuel flow, LHV",custom:"rel",units:[],def:[]},
 {id:"qfuel",g:1,name:"Fuel power (heat input)",sym:"kW",hint:"kW from fuel flow and LHV",custom:"rel",units:[],def:[]},
 {id:"sout",g:1,name:"Specific output",sym:"kW/L",hint:"kW per litre of swept volume",custom:"rel",units:[],def:[]},
 {id:"pcyl",g:1,name:"Power per cylinder",sym:"kW/cyl",custom:"rel",units:[],def:[]},
 {id:"pmi",g:1,name:"Mean pressures: indicated and effective",sym:"p\u1d62",hint:"mechanical efficiency, friction",custom:"rel",units:[],def:[]},
 {id:"ceps",g:1,name:"Compression ratio",sym:"\u03b5",hint:"swept and clearance volume",custom:"two",units:[],def:[]},
 {id:"sbr",g:1,name:"Stroke to bore ratio",sym:"S/D",custom:"rel",units:[],def:[]},
 {id:"gen",g:1,name:"Generator: shaft and electric power",sym:"gen",hint:"shaft kW from voltage, current, cos \u03c6",custom:"rel",units:[],def:[]},
 {id:"dual",g:1,name:"Dual fuel: energy share",sym:"pilot %",hint:"pilot fuel and gas by energy",custom:"dual",units:[],def:[]},
 {id:"voyage",g:3,name:"Fuel for a voyage",sym:"t",hint:"consumption, distance, speed",custom:"rel",units:[],def:[]},
 {id:"fpnm",g:3,name:"Fuel per nautical mile",sym:"kg/nm",custom:"rel",units:[],def:[]},
 {id:"slip",g:3,name:"Propeller slip and ship speed",sym:"slip",hint:"speed, rpm, pitch",custom:"rel",units:[],def:[]},
 {id:"adm",g:3,name:"Admiralty coefficient",sym:"C",hint:"displacement, speed, power",custom:"rel",units:[],def:[]},
 {id:"bunker",g:4,name:"Bunker: volume, mass, weight in air",sym:"t",hint:"1.1 kg/m\u00b3 factor as in the fuel report",custom:"two",units:[],def:[]},
 {id:"load",g:1,name:"Engine load (% of rated power)",sym:"load %",hint:"actual power, rated power, load, also above 100 %",custom:"rel",units:[],def:[]},
 {id:"motor",g:2,name:"Electric motor: kW, A, cos \u03c6, efficiency",sym:"cos \u03c6",hint:"nameplate: power, voltage, current",custom:"rel",units:[],def:[]},
 {id:"pf",g:2,name:"Power factor: kW, kVA, cos \u03c6",sym:"kW/kVA",hint:"cos \u03c6, phase angle, reactive power",custom:"rel",units:[],def:[]},
 {id:"pipe",g:2,name:"Flow velocity in a pipe",sym:"v",hint:"flow, diameter and speed",custom:"rel",units:[],def:[]},
 {id:"hydro",g:2,name:"Liquid column and pressure",sym:"\u03c1gh",hint:"tank level and pressure",custom:"rel",units:[],def:[]},
 {id:"fpress",g:2,name:"Force from pressure",sym:"F=pA",hint:"force, pressure and area",custom:"rel",units:[],def:[]},
 {id:"circ",g:2,name:"Circle: diameter, area, circumference",sym:"\u03c0D",custom:"circ",units:[],def:[]},
 {id:"pme",g:1,name:"Engine: power and mean pressure",sym:"p\u2098\u2091",hint:"2-stroke and 4-stroke",custom:"rel",units:[],def:[]},
 {id:"ptq",g:1,name:"Power, torque and speed",sym:"M\u00b7\u03c9",hint:"kW, kNm, rpm",custom:"rel",units:[],def:[]},
 {id:"edata",g:1,name:"Engine data",sym:"c\u2098",hint:"displacement, piston speed, firing interval",custom:"edata",units:[],def:[]},
 {id:"heat",g:2,name:"Heat flow",sym:"Q",hint:"kW from flow and temperature rise",custom:"rel",units:[],def:[]},
 {id:"pump",g:2,name:"Pump and fan power",sym:"P\u2095",hint:"flow, pressure rise, efficiency",custom:"rel",units:[],def:[]},
 {id:"aff",g:2,name:"Affinity laws",sym:"n\u00b3",hint:"flow, head, power and speed",custom:"rel",units:[],def:[]},
 {id:"ohm",g:2,name:"Ohm's law: U, I, R, P",sym:"U·I",hint:"voltage, current, resistance, power",custom:"ohm",def:[],units:[]},
 {id:"torque",g:0,name:"Torque",sym:"N·m",def:["Nm","kgfm"],units:[L("Nm","N·m",1),L("kNm","kN·m",1e3),L("kgfm","kgf·m",G),L("lbfft","lbf·ft",LB*G*FT),L("lbfin","lbf·in",LB*G*IN)]},
 {id:"rot",g:0,name:"Rotation",sym:"rpm",def:["rpm","rads"],units:[L("Hz","Hz (1/s)",1),L("rpm","rpm",1/60),L("rads","rad/s",1/(2*Math.PI)),L("degs","degrees/s",1/360)]},
 {id:"press",g:0,name:"Pressure",sym:"bar",def:["bar","psi"],units:[L("Pa","Pa",1),L("hPa","hPa",100),L("kPa","kPa",1e3),L("MPa","MPa",1e6),L("bar","bar",1e5),L("mbar","mbar",100),L("psi","psi",LB*G/(IN*IN)),L("atm","atm",101325),L("Torr","Torr",101325/760),L("mmHg","mmHg",133.322387415),L("inHg","inHg",3386.389),L("mmH2O","mm water column",G),L("mWC","m water column",G*1000),L("inH2O","in water column",249.08891),L("kgfcm2","kgf/cm²",98066.5)]},
 {id:"gauge",g:0,name:"Gauge and absolute pressure",sym:"bar g",hint:"bar(g), bar(a), vacuum",ex:"gauge",def:["barg","bara"],units:[
   gauge("barg","bar (gauge)",1e5),L("bara","bar (absolute)",1e5),gauge("kPag","kPa (gauge)",1e3),L("kPaa","kPa (absolute)",1e3),
   gauge("psig","psi (gauge)",LB*G/(IN*IN)),L("psia","psi (absolute)",LB*G/(IN*IN)),L("mbara","mbar (absolute)",100),L("mmHga","mmHg (absolute)",133.322387415),
   N("vacmbar","vacuum, mbar below atmosphere",["patm"],function(v,c){return c.patm-v*100},function(b,c){return (c.patm-b)/100}),
   N("vacpct","vacuum, % (0 = atmosphere, 100 = perfect vacuum)",["patm"],function(v,c){return c.patm*(1-v/100)},function(b,c){return (1-b/c.patm)*100})]},
 {id:"alt",g:0,name:"Altitude and air pressure",sym:"hPa",hint:"standard atmosphere (ISA)",def:["m","hPa"],units:[
   N("m","m (altitude)",[],function(v){return v},function(b){return b}),
   N("ft","ft (altitude)",[],function(v){return v*FT},function(b){return b/FT}),
   N("hPa","hPa = mbar (air pressure)",[],function(v){return (1-Math.pow(v/ISA_P0,1/ISA_N))/ISA_A},function(b){return ISA_P0*Math.pow(1-ISA_A*b,ISA_N)}),
   N("kPaA","kPa (air pressure)",[],function(v){return (1-Math.pow(v*10/ISA_P0,1/ISA_N))/ISA_A},function(b){return ISA_P0*Math.pow(1-ISA_A*b,ISA_N)/10}),
   N("mmHgA","mmHg (air pressure)",[],function(v){return (1-Math.pow(v*133.322387415/100/ISA_P0,1/ISA_N))/ISA_A},function(b){return ISA_P0*Math.pow(1-ISA_A*b,ISA_N)*100/133.322387415}),
   N("inHgA","inHg (air pressure)",[],function(v){return (1-Math.pow(v*3386.389/100/ISA_P0,1/ISA_N))/ISA_A},function(b){return ISA_P0*Math.pow(1-ISA_A*b,ISA_N)*100/3386.389})],
   range:[0,11000],rangeNote:"Standard atmosphere (ISA): valid from 0 to 11 000 m."},
 {id:"humid",g:0,name:"Dew point and humidity",sym:"°C dew",hint:"dew point, RH, g/m³, g/kg",ex:"humid",def:["rh","dew"],units:[
   N("rh","relative humidity, %",["t"],function(v,c){return v/100*es(c.t)},function(b,c){return b/es(c.t)*100}),
   N("dew","dew point, °C",[],function(v){return es(v)},function(b){return dewOf(b)}),
   N("e","water vapour pressure, hPa",[],function(v){return v},function(b){return b}),
   N("ah","absolute humidity, g/m³",["t"],function(v,c){return v*(c.t+273.15)/(100*MW/R)},function(b,c){return b*100*MW/R/(c.t+273.15)}),
   N("x","humidity ratio, g water per kg dry air",["pa"],function(v,c){var r=v/1000;return c.pa*r/(MW/MA+r)},function(b,c){return 1000*(MW/MA)*b/(c.pa-b)})]},
 {id:"temp",g:0,name:"Temperature",sym:"°C",def:["C","F"],units:[
   N("C","°C (Celsius)",[],function(v){return v+273.15},function(b){return b-273.15}),
   N("F","°F (Fahrenheit)",[],function(v){return (v-32)*5/9+273.15},function(b){return (b-273.15)*9/5+32}),
   N("K","K (Kelvin)",[],function(v){return v},function(b){return b}),
   N("Ra","°R (Rankine)",[],function(v){return v*5/9},function(b){return b*9/5})]},
 {id:"flowv",g:0,name:"Flow (volume)",sym:"m³/h",def:["m3h","Lmin"],units:[L("m3s","m³/s",1),L("m3h","m³/h",1/3600),L("Ls","L/s",1e-3),L("Lmin","L/min",1e-3/60),L("Lh","L/h",1e-3/3600),L("galmin","US gal/min",GAL/60),L("ukgalmin","UK gal/min",UKGAL/60),L("ft3min","ft³/min",FT*FT*FT/60),L("bblh","US barrel/h",BBL/3600)]},
 {id:"flowm",g:0,name:"Flow (mass)",sym:"kg/h",def:["kgh","th"],units:[L("kgs","kg/s",1),L("kgh","kg/h",1/3600),L("th","t/h",1000/3600),L("tday","t/day",1000/86400),L("gs","g/s",1e-3),L("lbh","lb/h",LB/3600)]},
 {id:"force",g:0,name:"Force",sym:"N",def:["kN","tf"],units:[L("N","N",1),L("kN","kN",1e3),L("kgf","kgf",G),L("tf","tonne-force",1000*G),L("lbf","lbf",LB*G)]},

 {id:"energy",g:4,name:"Energy",sym:"kWh",def:["kWh","MJ"],units:[L("J","J",1),L("kJ","kJ",1e3),L("MJ","MJ",1e6),L("GJ","GJ",1e9),L("Wh","Wh",3600),L("kWh","kWh",3.6e6),L("MWh","MWh",3.6e9),L("kcal","kcal (IT, 4.1868 kJ)",KCAL),L("kcalth","kcal (thermochemical, 4.184 kJ)",4184),L("BTU","BTU (IT)",BTU)]},
 {id:"spen",g:4,name:"Specific energy",hint:"heating value, MJ/kg",sym:"MJ/kg",def:["MJkg","kWhkg"],units:[L("Jkg","J/kg",1),L("kJkg","kJ/kg",1e3),L("MJkg","MJ/kg",1e6),L("kWhkg","kWh/kg",3.6e6),L("kcalkg","kcal/kg (IT)",KCAL),L("BTUlb","BTU/lb (IT)",2326)]},
 {id:"fuel",g:4,name:"Fuel: mass, energy, volume",sym:"LHV",ex:"fuel",def:["kg","MJ"],units:[
   L("kg","kg",1),L("t","t (tonne)",1000),L("lb","lb",LB),
   N("m3","m³ (needs density)",["rho"],function(v,c){return v*c.rho},function(b,c){return b/c.rho}),
   N("L","L (needs density)",["rho"],function(v,c){return v*c.rho/1000},function(b,c){return b*1000/c.rho}),
   N("gal","US gal (needs density)",["rho"],function(v,c){return v*GAL*c.rho},function(b,c){return b/(GAL*c.rho)}),
   N("MJ","MJ (needs heating value)",["lhv"],function(v,c){return v/c.lhv},function(b,c){return b*c.lhv}),
   N("GJ","GJ (needs heating value)",["lhv"],function(v,c){return v*1000/c.lhv},function(b,c){return b*c.lhv/1000}),
   N("kWh","kWh (needs heating value)",["lhv"],function(v,c){return v*3.6/c.lhv},function(b,c){return b*c.lhv/3.6}),
   N("MWh","MWh (needs heating value)",["lhv"],function(v,c){return v*3600/c.lhv},function(b,c){return b*c.lhv/3600})]},
 {id:"sfoc",g:4,name:"Specific consumption and emission",hint:"SFOC, g/kWh, g/MJ",sym:"g/kWh",def:["gkWh","gPSh"],units:[L("gkWh","g/kWh",1),L("kgMWh","kg/MWh",1),L("gMJ","g/MJ (per MJ of work)",3.6),L("gPSh","g/PSh (metric hp)",1/(PS*3600/3.6e6)),L("lbhph","lb/hph (mechanical hp)",LB*1000/(HPI*3600/3.6e6))]},
 {id:"kvis",g:4,name:"Viscosity (kinematic)",sym:"cSt",def:["cSt","m2s"],units:[L("m2s","m²/s",1),L("cSt","mm²/s = cSt",1e-6),L("St","St (stokes)",1e-4),L("ft2s","ft²/s",FT*FT)]},
 {id:"dvis",g:4,name:"Viscosity (dynamic)",sym:"cP",def:["mPas","Pas"],units:[L("Pas","Pa·s",1),L("mPas","mPa·s = cP",1e-3),L("P","P (poise)",0.1),L("lbfts","lb/(ft·s)",LB/FT)]},
 {id:"dens",g:4,name:"Density",sym:"kg/m³",def:["kgm3","gcm3"],units:[L("kgm3","kg/m³",1),L("gcm3","g/cm³ = kg/L = t/m³",1000),L("gL","g/L",1),L("lbft3","lb/ft³",LB/(FT*FT*FT)),L("lbgal","lb/US gal",LB/GAL)]},

 {id:"mole",g:5,name:"Mole and gas",sym:"mol",ex:"sub",def:["kg","mol"],units:[
   L("mol","mol",1),L("mmol","mmol",1e-3),L("kmol","kmol",1e3),L("lbmol","lb-mol",LB*1000),
   N("mg","mg (needs substance)",["M"],function(v,c){return v/1000/c.M},function(b,c){return b*c.M*1000}),
   N("g","g (needs substance)",["M"],function(v,c){return v/c.M},function(b,c){return b*c.M}),
   N("kg","kg (needs substance)",["M"],function(v,c){return v*1000/c.M},function(b,c){return b*c.M/1000}),
   N("tm","t (needs substance)",["M"],function(v,c){return v*1e6/c.M},function(b,c){return b*c.M/1e6}),
   L("Nm3","Nm³ at 0 °C, 1.01325 bar",1/vm(273.15)),
   L("Sm3","m³ at 15 °C, 1.01325 bar",1/vm(288.15)),
   L("m320","m³ at 20 °C, 1.01325 bar",1/vm(293.15))]},
 {id:"gasv",g:5,name:"Gas: volume, mol, mass at p and T",sym:"pV=nRT",ex:"gasv",hint:"actual m\u00b3 to Nm\u00b3, mol, kg",def:["m3pt","Nm3"],units:[
   L("mol","mol",1),L("kmol","kmol",1e3),
   N("kg","kg (needs substance)",["M"],function(v,c){return v*1000/c.M},function(b,c){return b*c.M/1000}),
   N("m3pt","m\u00b3 at your pressure and temperature",["pg","tg"],function(v,c){return v*c.pg/(R*c.tg)},function(b,c){return b*R*c.tg/c.pg}),
   L("Nm3","Nm\u00b3 at 0 \u00b0C, 1.01325 bar",1/vm(273.15)),L("Sm3","m\u00b3 at 15 \u00b0C, 1.01325 bar",1/vm(288.15)),L("m320","m\u00b3 at 20 \u00b0C, 1.01325 bar",1/vm(293.15))]},
 {id:"dalton",g:5,name:"Partial pressure (Dalton)",sym:"p\u1d62",ex:"dalton",hint:"fraction, ppm and partial pressure",def:["pct","kPa"],units:[
   L("frac","fraction (0 to 1)",1),L("pct","% (by volume)",0.01),L("ppm","ppm (by volume)",1e-6),
   N("bar","bar (partial pressure)",["ptot"],function(v,c){return v*1e5/c.ptot},function(b,c){return b*c.ptot/1e5}),
   N("kPa","kPa (partial pressure)",["ptot"],function(v,c){return v*1e3/c.ptot},function(b,c){return b*c.ptot/1e3}),
   N("mbar","mbar (partial pressure)",["ptot"],function(v,c){return v*100/c.ptot},function(b,c){return b*c.ptot/100})]},
 {id:"eff",g:4,name:"Efficiency and SFOC",sym:"\u03b7",ex:"eff",hint:"SFOC, efficiency, kJ/kWh",def:["gkWh","effp"],units:[
   L("gkWh","g/kWh (SFOC)",1),
   N("effp","efficiency, %",["lhv"],function(v,c){return 3600/((v/100)*c.lhv)},function(b,c){return 100*3600/(b*c.lhv)}),
   N("kJkWh","kJ of fuel per kWh",["lhv"],function(v,c){return v/c.lhv},function(b,c){return b*c.lhv}),
   N("MJkWh","MJ of fuel per kWh",["lhv"],function(v,c){return v*1000/c.lhv},function(b,c){return b*c.lhv/1000})]},
 {id:"mfrac",g:4,name:"Concentration by mass",sym:"% m/m",hint:"ppm m/m = mg/kg, % m/m, g/kg",def:["pctm","ppmm"],units:[
   L("frac","fraction (0 to 1)",1),L("pctm","% m/m",0.01),L("gkg","g/kg",1e-3),L("ppmm","ppm m/m = mg/kg = \u00b5g/g",1e-6),L("ppbm","ppb m/m = \u00b5g/kg",1e-9)]},
 {id:"epv",g:4,name:"Energy per volume",sym:"MJ/L",hint:"MJ/m\u00b3, MJ/L, kWh/L, BTU/ft\u00b3",def:["MJL","kWhL"],units:[
   L("Jm3","J/m\u00b3",1),L("kJm3","kJ/m\u00b3",1e3),L("MJm3","MJ/m\u00b3",1e6),L("GJm3","GJ/m\u00b3",1e9),L("MJL","MJ/L",1e9),L("kWhm3","kWh/m\u00b3",3.6e6),L("kWhL","kWh/L",3.6e9),L("BTUft3","BTU/ft\u00b3 (IT)",BTU/(FT*FT*FT)),L("kcalm3","kcal/m\u00b3 (IT)",KCAL)]},
 {id:"htc",g:4,name:"Heat transfer coefficient",sym:"W/m\u00b2K",hint:"W/(m\u00b2\u00b7K), kcal/(h\u00b7m\u00b2\u00b7\u00b0C), BTU",def:["Wm2K","BTUh"],units:[
   L("Wm2K","W/(m\u00b2\u00b7K)",1),L("kWm2K","kW/(m\u00b2\u00b7K)",1e3),L("kcalh","kcal/(h\u00b7m\u00b2\u00b7\u00b0C) (IT)",KCAL/3600),L("BTUh","BTU/(h\u00b7ft\u00b2\u00b7\u00b0F) (IT)",BTU/3600/(FT*FT)/(5/9))]},
 {id:"tcond",g:4,name:"Thermal conductivity",sym:"W/mK",hint:"W/(m\u00b7K), kcal/(h\u00b7m\u00b7\u00b0C), BTU",def:["WmK","BTUhft"],units:[
   L("WmK","W/(m\u00b7K)",1),L("kcalhm","kcal/(h\u00b7m\u00b7\u00b0C) (IT)",KCAL/3600),L("BTUhft","BTU/(h\u00b7ft\u00b7\u00b0F) (IT)",BTU/3600/FT/(5/9)),L("BTUin","BTU\u00b7in/(h\u00b7ft\u00b2\u00b7\u00b0F) (IT)",BTU/3600*IN/(FT*FT)/(5/9))]},
 {id:"cp",g:4,name:"Specific heat",sym:"kJ/kgK",hint:"kJ/(kg\u00b7K), kcal/(kg\u00b7\u00b0C), BTU/(lb\u00b7\u00b0F)",def:["kJkgK","kcalkgC"],units:[
   L("JkgK","J/(kg\u00b7K)",1),L("kJkgK","kJ/(kg\u00b7K)",1e3),L("kcalkgC","kcal/(kg\u00b7\u00b0C) (IT)",KCAL),L("BTUlbF","BTU/(lb\u00b7\u00b0F) (IT)",BTU/LB/(5/9))]},
 {id:"hflux",g:4,name:"Heat flux",sym:"W/m\u00b2",hint:"W/m\u00b2, kW/m\u00b2, kcal/(h\u00b7m\u00b2), BTU",def:["Wm2","BTUhft2"],units:[
   L("Wm2","W/m\u00b2",1),L("kWm2","kW/m\u00b2",1e3),L("kcalhm2","kcal/(h\u00b7m\u00b2) (IT)",KCAL/3600),L("BTUhft2","BTU/(h\u00b7ft\u00b2) (IT)",BTU/3600/(FT*FT))]},
 {id:"conc",g:5,name:"Concentration: ppm, %, mg/m³",sym:"ppm",ex:"sub",def:["ppm","mg0"],units:[
   L("ppb","ppb (by volume)",1e-3),L("ppm","ppm (by volume)",1),L("pct","% (by volume)",1e4),
   mgm3(273.15),mgm3(288.15),mgm3(293.15),mgm3(298.15)]},
 {id:"basis",g:5,name:"Gas basis: dry, wet, reference O₂",sym:"O₂",hint:"wet and dry, O2 correction",ex:"basis",def:["d","r"],units:[
   N("d","dry gas, as measured",[],function(v){return v},function(b){return b}),
   N("w","wet gas (needs water vapour)",["xw"],function(v,c){return v/(1-c.xw/100)},function(b,c){return b*(1-c.xw/100)}),
   N("r","dry, at reference O₂ (needs both O₂ values)",["o2m","o2r"],function(v,c){return v*(21-c.o2m)/(21-c.o2r)},function(b,c){return b*(21-c.o2r)/(21-c.o2m)})]},
 {id:"emis",g:5,name:"Emission: g/kWh and g/kg fuel",sym:"g/kg",hint:"needs your SFOC",ex:"sfoc",def:["gkWh","gkgf"],units:[
   L("gkWh","g/kWh",1),
   N("gkgf","g per kg fuel (needs SFOC)",["sfoc"],function(v,c){return v*c.sfoc/1000},function(b,c){return b*1000/c.sfoc}),
   N("gMJf","g per MJ of fuel energy (needs SFOC and LHV)",["sfoc","lhv"],function(v,c){return v*c.sfoc/1000*c.lhv},function(b,c){return b*1000/c.sfoc/c.lhv})]},

 {id:"mass",g:6,name:"Mass",sym:"kg",def:["kg","lb"],units:[L("mg","mg",1e-6),L("g","g",1e-3),L("kg","kg",1),L("t","t (tonne)",1000),L("lb","lb",LB),L("oz","oz",LB/16),L("lt","long ton (UK)",1016.0469088),L("st","short ton (US)",907.18474)]},
 {id:"len",g:6,name:"Length",sym:"m",def:["m","ft"],units:[L("mm","mm",1e-3),L("cm","cm",1e-2),L("m","m",1),L("km","km",1e3),L("in","inch",IN),L("ft","foot",FT),L("yd","yard",0.9144),L("mi","mile",1609.344),L("nm","nautical mile",1852),L("cab","cable (0.1 nautical mile)",185.2),L("fm","fathom",1.8288)]},
 {id:"area",g:6,name:"Area",sym:"m²",def:["m2","ft2"],units:[L("mm2","mm²",1e-6),L("cm2","cm²",1e-4),L("m2","m²",1),L("ha","hectare",1e4),L("km2","km²",1e6),L("in2","in²",IN*IN),L("ft2","ft²",FT*FT)]},
 {id:"vol",g:6,name:"Volume",sym:"L",def:["L","galus"],units:[L("mL","mL",1e-6),L("L","L",1e-3),L("m3","m³",1),L("in3","in³",IN*IN*IN),L("ft3","ft³",FT*FT*FT),L("galus","US gal",GAL),L("galuk","UK gal",UKGAL),L("bbl","US oil barrel (42 gal)",BBL)]},
 {id:"speed",g:6,name:"Speed",sym:"kn",def:["kn","kmh"],units:[L("ms","m/s",1),L("kmh","km/h",1/3.6),L("kn","knot",1852/3600),L("mph","mph",0.44704),L("fts","ft/s",FT)]},
 {id:"angle",g:6,name:"Angle",sym:"\u00b0",def:["deg","rad"],units:[L("deg","degree",1),L("rad","radian",180/Math.PI),L("mrad","milliradian",180/Math.PI/1000),L("min","arc minute",1/60),L("sec","arc second",1/3600),L("gon","gon (grad)",0.9),L("turn","full turn",360)]},
 {id:"time",g:6,name:"Time",sym:"h",def:["h","min"],units:[L("s","s",1),L("min","min",60),L("h","h",3600),L("day","day",86400),L("wk","week",604800)]}
];
var GROUPS=["Engine and machinery","Engine calculations","Machinery and electrical","Ship and propulsion","Fuel, energy and heat","Gas","Basic"];
function catById(id){for(var i=0;i<CATS.length;i++)if(CATS[i].id===id)return CATS[i];return null}
function unitById(c,id){for(var i=0;i<c.units.length;i++)if(c.units[i].id===id)return c.units[i];return c.units[0]}

/* ---------- maths ---------- */
function num(t){t=String(t==null?"":t).replace(/\s/g,"").replace(",",".");if(t===""||t==="-"||t==="."||t==="-.")return NaN;var x=Number(t);return isFinite(x)?x:NaN}
function ctx(){
  var e=ST.ex,M=NaN;
  if(e.sub==="custom")M=num(e.cm);else{var sp=subById(e.sub);M=sp?molar(sp.f):NaN}
  return {M:M,lhv:num(e.lhv),rho:num(e.rho),patm:num(e.patm)*100,u:num(e.u),pf:num(e.pf),ph:Number(e.ph),
          pg:num(e.pg)*1e5,tg:num(e.tg)+273.15,ptot:num(e.ptot)*1e5,t:num(e.t),pa:num(e.pa),xw:num(e.xw),o2m:num(e.o2m),o2r:num(e.o2r),sfoc:num(e.sfoc)};
}
var NEEDOK={
 M:function(x){return x>0},lhv:function(x){return x>0},rho:function(x){return x>0},patm:function(x){return x>0},u:function(x){return x>0},
 pf:function(x){return x>0&&x<=1},t:function(x){return isFinite(x)&&x>=-45&&x<=60},pa:function(x){return x>0},
 pg:function(x){return x>0},tg:function(x){return x>0},ptot:function(x){return x>0},
 xw:function(x){return x>=0&&x<100},o2m:function(x){return x>=0&&x<21},o2r:function(x){return x>=0&&x<21},sfoc:function(x){return x>0}
};
var MISSNAME={M:"a substance",lhv:"the heating value (LHV, MJ/kg)",rho:"the density (kg/m³)",patm:"the atmospheric pressure (mbar)",u:"the voltage (V)",
  pf:"the power factor (0 to 1)",t:"the air temperature (-45 to 60 °C)",pa:"the air pressure (hPa)",xw:"the water vapour (0 to 100 %)",
  o2m:"the measured O₂ (0 to 21 %)",o2r:"the reference O₂ (0 to 21 %)",sfoc:"the SFOC (g/kWh)",pg:"the pressure (bar, absolute)",tg:"the temperature (above -273 \u00b0C)",ptot:"the total pressure (bar, absolute)"};
function conv(c,fu,tu,v,cx){
  var miss=[];
  fu.needs.concat(tu.needs).forEach(function(n){if(!NEEDOK[n](cx[n])&&miss.indexOf(n)<0)miss.push(n)});
  if(miss.length)return {miss:miss};
  if(c.range){
    var b0=fu.to(v,cx);
    if(!(b0>=c.range[0]&&b0<=c.range[1]))return {bad:c.rangeNote};
  }
  var val=tu.from(fu.to(v,cx),cx);
  if(!isFinite(val))return {bad:"The result is outside what the formula can give."};
  return {val:val};
}
function fmt(x){
  if(!isFinite(x))return "";
  if(x===0)return "0";
  var a=Math.abs(x);
  if(a>=1e12||a<1e-6)return x.toExponential(6).replace(/\.?0+e/,"e");
  return String(Number(x.toPrecision(10)));
}
function raw(x){return String(Number(x.toPrecision(12)))}

/* ---------- style ---------- */
var css=document.createElement("style");
css.textContent=".cgrid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px}"
+".tile{display:flex;flex-direction:column;align-items:flex-start;gap:2px;text-align:left;border:1px solid var(--line);background:#fff;border-radius:3px;padding:12px;min-height:92px;cursor:pointer}"
+".tile:active{background:#f4faff}.tile .sy{font-weight:700;font-size:22px;color:var(--sky);line-height:1.1;margin-bottom:6px}"
+".tile b{color:var(--navy);font-size:15px;line-height:1.2}.tile i{font-style:normal;font-size:12px;color:var(--muted);line-height:1.3}"
+".gh{display:flex;align-items:center;justify-content:space-between;width:100%;gap:10px;margin-top:12px;padding:16px 14px;border:1px solid var(--line);border-radius:3px;background:#fff;text-align:left;cursor:pointer}"
+".gh .gt{font-size:16px;font-weight:700;color:var(--navy)}.gh .gs{display:block;font-size:12px;font-weight:400;color:var(--muted);margin-top:2px}"
+".gh svg{width:22px;height:22px;stroke:var(--sky);fill:none;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round;transition:transform .15s;flex:0 0 auto}"
+".gh.on{background:var(--navy);border-color:var(--navy)}.gh.on .gt{color:#fff}.gh.on .gs{color:#a8cdeb}.gh.on svg{transform:rotate(180deg);stroke:#fff}"
+".cback{display:inline-flex;align-items:center;gap:6px;border:0;background:none;color:var(--blue);font-weight:600;font-size:15px;padding:6px 0;margin-bottom:6px}"
+".cback svg{width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}"
+".cbox{background:#fff;border:1px solid var(--line);border-radius:3px;padding:14px;margin-top:12px}"
+".cbox .lb{font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:6px}"
+".cin{display:flex;gap:8px}.cin input{flex:1;min-width:0;font-size:28px;font-weight:600;color:var(--navy);padding:8px 10px}"
+".pm{flex:0 0 52px;border:1px solid var(--line);background:var(--soft);border-radius:3px;font-size:20px;color:var(--navy)}"
+".cbox select{margin-top:10px;font-size:16px}"
+".res{font-size:30px;font-weight:700;color:var(--navy);word-break:break-all;min-height:46px;display:flex;align-items:center;padding:4px 2px}"
+".res.ph{font-size:16px;font-weight:500;color:var(--muted)}"
+".swp{display:flex;justify-content:center;margin:-6px 0;position:relative;z-index:2}"
+".swp button{width:52px;height:52px;border-radius:50%;border:2px solid #fff;background:var(--navy);color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(10,42,74,.3)}"
+".swp svg{width:24px;height:24px;stroke:#fff;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}"
+".fline{font-size:13px;color:var(--muted);margin-top:10px}"
+".alr{margin-top:14px}.alr .row2{display:flex;justify-content:space-between;gap:12px;padding:10px 4px;border-bottom:1px solid var(--line);cursor:pointer;font-size:15px}"
+".alr .row2.on{background:#f4faff;font-weight:600}.alr .row2 span:last-child{color:var(--navy);font-weight:600;text-align:right;word-break:break-all}"
+".seg{display:flex;border:1px solid var(--line);border-radius:3px;overflow:hidden;margin-top:10px}.seg button{flex:1;border:0;background:#fff;color:var(--navy);padding:13px 8px;font-weight:600;font-size:15px}.seg button.on{background:var(--navy);color:#fff}"
+".mcal{font-size:13px;color:var(--muted);margin-top:8px}";
document.head.appendChild(css);

/* ---------- views ---------- */
function toast(m){var t=$("toast");if(!t)return;t.textContent=m;t.className="toast on";clearTimeout(toast.t);toast.t=setTimeout(function(){t.className="toast"},2200)}
var CUR=null;
function home(){
  CUR=null;
  var q=ST.q.trim().toLowerCase(),h='<div class="wrap"><div class="eyebrow">Convert</div><h1>What do you want to convert?</h1>'
   +'<div class="sub">Tap a group, pick a converter, type a number and choose the units. The arrow button turns it around.</div>'
   +'<div style="margin-top:12px"><input type="search" id="cq" placeholder="Search, for example psi or knot" value="'+esc(ST.q)+'"></div>';
  var any=false;
  GROUPS.forEach(function(gn,gi){
    var tiles="",n=0;
    CATS.forEach(function(c){
      if(c.g!==gi)return;
      if(q){var hay=(c.name+" "+(c.hint||"")+" "+c.units.map(function(u){return u.label}).join(" ")).toLowerCase();if(hay.indexOf(q)<0)return}
      n++;
      var ex=c.units.slice(0,4).map(function(u){return u.label.split(" ")[0].replace(/[,(]$/,"")}).join(", ");
      tiles+='<button class="tile" data-c="'+c.id+'"><span class="sy">'+esc(c.sym)+'</span><b>'+esc(c.name)+'</b><i>'+esc(c.hint||ex)+'</i></button>';
    });
    if(!n)return;
    any=true;
    var open_=q?true:ST.og===gi;
    h+='<button class="gh'+(open_?" on":"")+'" data-g="'+gi+'"><span class="gt">'+gn+'<span class="gs">'+n+(n===1?" converter":" converters")+'</span></span><svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></button>';
    if(open_&&gi===1)h+='<div class="seg" id="engsel"><button type="button" data-c="1" class="'+(ST.ex.cyc!=="2"?"on":"")+'">Two-stroke</button><button type="button" data-c="2" class="'+(ST.ex.cyc==="2"?"on":"")+'">Four-stroke</button></div><div class="mcal" style="margin:6px 2px 0">The engine type is used where it matters: power and mean pressure, firing interval and firing frequency.</div>';
    if(open_)h+='<div class="cgrid">'+tiles+'</div>';
  });
  if(!any)h+='<div class="empty">Nothing matches. Try another word.</div>';
  host.innerHTML=h+'</div>';
  $("cq").oninput=function(){ST.q=this.value;var p=this.selectionStart;home();var el=$("cq");el.focus();try{el.setSelectionRange(p,p)}catch(e){}};
  host.querySelectorAll(".tile").forEach(function(b){b.onclick=function(){open(b.getAttribute("data-c"))}});
  host.querySelectorAll("#engsel button").forEach(function(b){b.onclick=function(){ST.ex.cyc=b.getAttribute("data-c");save();home()}});
  host.querySelectorAll(".gh").forEach(function(b){b.onclick=function(){var g=Number(b.getAttribute("data-g"));ST.og=(ST.og===g&&!ST.q.trim())?-1:g;save();home()}});
}
function exHtml(c){
  if(!c.ex)return "";
  var h='<div class="cbox"><div class="lb">'+(c.ex==="sub"?"Substance":"Your values")+'</div>';
  EXF[c.ex].forEach(function(f,i){
    if(f.t==="sub"){
      h+='<select id="xs">'+SUB.map(function(s){return '<option value="'+s.id+'"'+(ST.ex.sub===s.id?" selected":"")+'>'+esc(s.name)+'</option>'}).join("")+'<option value="custom"'+(ST.ex.sub==="custom"?" selected":"")+'>Other (type the molar mass)</option></select>'
       +'<div id="xcm" style="display:'+(ST.ex.sub==="custom"?"block":"none")+';margin-top:10px"><input type="text" inputmode="decimal" id="xcmv" placeholder="Molar mass in g/mol" value="'+esc(ST.ex.cm)+'"></div><div class="mcal" id="xm"></div>';
    }else if(f.t==="sel"){
      h+='<label class="f" for="x_'+f.k+'"'+(i===0?' style="margin-top:0"':'')+'>'+esc(f.label)+'</label><select id="x_'+f.k+'" style="margin-top:0">'+f.opts.map(function(o){return '<option value="'+o[0]+'"'+(String(ST.ex[f.k])===o[0]?" selected":"")+'>'+esc(o[1])+'</option>'}).join("")+'</select>';
    }else{
      h+='<label class="f" for="x_'+f.k+'"'+(i===0?' style="margin-top:0"':'')+'>'+esc(f.label)+'</label><input type="text" inputmode="decimal" id="x_'+f.k+'" placeholder="'+esc(f.ph||"")+'" value="'+esc(ST.ex[f.k])+'">';
    }
  });
  if(NOTE[c.ex])h+='<div class="mcal">'+esc(NOTE[c.ex])+'</div>';
  return h+'</div>';
}
function open(id){
  var c=catById(id);if(!c)return;
  if(c.custom==='ohm'){CUR=null;return openOhm(c)}
  if(c.custom==='rel'){CUR=null;return openRel(c)}
  if(c.custom==='edata'){CUR=null;return openEdata(c)}
  if(c.custom==='circ'){CUR=null;return openCirc(c)}
  if(c.custom==='two'){CUR=null;return openTwo(c)}
  if(c.custom==='dual'){CUR=null;return openDual(c)}
  CUR=c;
  var p=ST.per[id]||(ST.per[id]={f:c.def[0],t:c.def[1],v:""});
  if(unitById(c,p.f).id!==p.f)p.f=c.def[0];
  if(unitById(c,p.t).id!==p.t)p.t=c.def[1];
  var opts=function(sel){return c.units.map(function(u){return '<option value="'+u.id+'"'+(u.id===sel?" selected":"")+'>'+esc(u.label)+'</option>'}).join("")};
  var h='<div class="wrap"><button class="cback" id="cb"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>All groups</button>'
   +'<div class="eyebrow">Convert</div><h1>'+esc(c.name)+'</h1>'+exHtml(c)
   +'<div class="cbox"><div class="lb">From</div><div class="cin"><input type="text" inputmode="decimal" id="vin" autocomplete="off" placeholder="0" value="'+esc(p.v)+'"><button class="pm" id="pm" aria-label="Plus or minus">+/−</button></div><select id="sf">'+opts(p.f)+'</select></div>'
   +'<div class="swp"><button id="sw" aria-label="Swap"><svg viewBox="0 0 24 24"><path d="M7 4v16M7 4L3 8M7 4l4 4M17 20V4M17 20l-4-4M17 20l4-4"/></svg></button></div>'
   +'<div class="cbox"><div class="lb">To</div><div class="res ph" id="res">Type a number</div><select id="st">'+opts(p.t)+'</select>'
   +'<div class="row" style="margin-top:12px"><button class="btn sec" id="cp">Copy result</button><button class="btn sec" id="al">Show in all units</button></div><div class="fline" id="fl"></div></div>'
   +'<div id="alr" class="alr" style="display:none"></div></div>';
  host.innerHTML=h;
  $("cb").onclick=home;
  $("vin").oninput=function(){p.v=this.value;save();upd()};
  $("pm").onclick=function(){var t=$("vin").value.trim();$("vin").value=t.charAt(0)==="-"?t.slice(1):(t?"-"+t:"-");p.v=$("vin").value;save();upd();$("vin").focus()};
  $("sf").onchange=function(){p.f=this.value;save();upd()};
  $("st").onchange=function(){p.t=this.value;save();upd()};
  $("sw").onclick=function(){
    var r=result();var f=p.f;p.f=p.t;p.t=f;
    if(r&&r.val!==undefined&&isFinite(r.val))p.v=raw(r.val);
    save();open(id);
  };
  $("cp").onclick=function(){
    var r=result();if(!r||r.val===undefined){toast("Nothing to copy yet");return}
    var t=raw(r.val);
    if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(t).then(function(){toast("Copied "+t)},function(){toast("Could not copy")});
    else{var ta=document.createElement("textarea");ta.value=t;document.body.appendChild(ta);ta.select();try{document.execCommand("copy");toast("Copied "+t)}catch(e){toast("Could not copy")}document.body.removeChild(ta)}
  };
  $("al").onclick=function(){var a=$("alr");a.style.display=a.style.display==="none"?"block":"none";upd()};
  if(c.ex){
    EXF[c.ex].forEach(function(f){
      if(f.t==="sub"){
        $("xs").onchange=function(){ST.ex.sub=this.value;$("xcm").style.display=this.value==="custom"?"block":"none";save();upd()};
        $("xcmv").oninput=function(){ST.ex.cm=this.value;save();upd()};
      }else{
        var el=$("x_"+f.k);
        el[f.t==="sel"?"onchange":"oninput"]=function(){ST.ex[f.k]=this.value;save();upd()};
      }
    });
  }
  upd();
  window.scrollTo(0,0);
}
var OHM={ord:[],v:{U:"",I:"",R:"",P:""},u:{U:1,I:1,R:1,P:1}};
var OHMF=[
 {k:"U",name:"Voltage U",opts:[["0.001","mV"],["1","V"],["1000","kV"]]},
 {k:"I",name:"Current I",opts:[["0.001","mA"],["1","A"],["1000","kA"]]},
 {k:"R",name:"Resistance R",opts:[["0.001","m\u03a9"],["1","\u03a9"],["1000","k\u03a9"],["1000000","M\u03a9"]]},
 {k:"P",name:"Power P",opts:[["0.001","mW"],["1","W"],["1000","kW"],["1000000","MW"]]}
];
function ohmSolve(a,x,b,y){ /* two known values in base units, returns all four */
  var k=[a,b].sort().join(""),r={U:NaN,I:NaN,R:NaN,P:NaN};r[a]=x;r[b]=y;
  var m={};m[a]=x;m[b]=y;
  if(k==="IU"){r.R=m.U/m.I;r.P=m.U*m.I}
  else if(k==="RU"){r.I=m.U/m.R;r.P=m.U*m.U/m.R}
  else if(k==="PU"){r.I=m.P/m.U;r.R=m.U*m.U/m.P}
  else if(k==="IR"){r.U=m.I*m.R;r.P=m.I*m.I*m.R}
  else if(k==="IP"){r.U=m.P/m.I;r.R=m.P/(m.I*m.I)}
  else if(k==="PR"){r.U=Math.sqrt(m.P*m.R);r.I=Math.sqrt(m.P/m.R)}
  return r;
}
var OHMFORM={IU:"R = U / I,  P = U \u00b7 I",RU:"I = U / R,  P = U\u00b2 / R",PU:"I = P / U,  R = U\u00b2 / P",IR:"U = I \u00b7 R,  P = I\u00b2 \u00b7 R",IP:"U = P / I,  R = P / I\u00b2",PR:"U = \u221a(P \u00b7 R),  I = \u221a(P / R)"};
function ohmCalc(){
  var known=OHM.ord.filter(function(k){return !isNaN(num(OHM.v[k]))}).slice(-2);
  var out={},msg="Type any two of the four values.",form="";
  if(known.length===2){
    var a=known[0],b=known[1],x=num(OHM.v[a])*OHM.u[a],y=num(OHM.v[b])*OHM.u[b];
    if(!(x>0)||!(y>0))msg="Use values above zero.";
    else{var r=ohmSolve(a,x,b,y);out=r;msg="";form=OHMFORM[[a,b].sort().join("")]}
  }
  OHMF.forEach(function(f){
    var el=$("o_"+f.k);if(!el)return;
    var isIn=known.indexOf(f.k)>=0;
    el.classList.toggle("calc",!isIn&&out[f.k]!==undefined);
    if(!isIn){el.value=out[f.k]!==undefined&&isFinite(out[f.k])?fmt(out[f.k]/OHM.u[f.k]):""}
  });
  $("o_msg").textContent=msg;$("o_form").textContent=form?"Formulas used: "+form:"";
}
function openOhm(c){
  var h='<div class="wrap"><button class="cback" id="cb"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>All groups</button>'
   +'<div class="eyebrow">Convert</div><h1>'+esc(c.name)+'</h1><div class="sub">Type any two values. The other two are calculated. Change a calculated value to make it one of your two.</div>';
  OHMF.forEach(function(f){
    h+='<div class="cbox"><div class="lb">'+f.name+'</div><div class="cin"><input type="text" inputmode="decimal" id="o_'+f.k+'" placeholder="?" value="'+esc(OHM.v[f.k])+'" autocomplete="off"></div>'
      +'<select id="ou_'+f.k+'">'+f.opts.map(function(o){return '<option value="'+o[0]+'"'+(Number(o[0])===OHM.u[f.k]?" selected":"")+'>'+o[1]+'</option>'}).join("")+'</select></div>';
  });
  h+='<div class="cbox"><div class="res ph" id="o_msg"></div><div class="fline" id="o_form"></div><div class="mcal">Direct current or single phase with a resistive load. For three phase, use Electrical: kW, kVA, A.</div>'
   +'<div class="row" style="margin-top:12px"><button class="btn sec" id="o_clr">Clear all</button></div></div></div>';
  host.innerHTML=h;
  $("cb").onclick=home;
  OHMF.forEach(function(f){
    $("o_"+f.k).oninput=function(){
      OHM.v[f.k]=this.value;
      OHM.ord=OHM.ord.filter(function(x){return x!==f.k});OHM.ord.push(f.k);
      OHM.ord=OHM.ord.slice(-2);
      /* a cleared field is no longer one of the two known values */
      if(isNaN(num(this.value)))OHM.ord=OHM.ord.filter(function(x){return x!==f.k});
      ohmCalc();
    };
    $("ou_"+f.k).onchange=function(){OHM.u[f.k]=Number(this.value);ohmCalc()};
  });
  $("o_clr").onclick=function(){OHM.ord=[];OHM.v={U:"",I:"",R:"",P:""};OHMF.forEach(function(f){$("o_"+f.k).value=""});ohmCalc()};
  css2();ohmCalc();window.scrollTo(0,0);
}
function css2(){if(document.getElementById("ohmcss"))return;var c=document.createElement("style");c.id="ohmcss";c.textContent="input.calc{background:#f4faff;border-color:var(--sky);color:var(--blue)}";document.head.appendChild(c)}
/* ---------- relation calculators: one variable follows from the others ---------- */
var CYC=[["1","Two-stroke (k = 1)"],["2","Four-stroke (k = 2)"]];
var RELS={
 pme:{note:"P = p\u2098\u2091 \u00b7 V \u00b7 n / (600 \u00b7 k), with P in kW, p\u2098\u2091 in bar, V = total swept volume in litres, n in rpm. k = 1 for two-stroke and k = 2 for four-stroke, so the same engine gives half the power as a four-stroke.",
  sel:{k:"cyc",opts:CYC,def:"1"},K:function(sel){return 1/(600*Number(sel))},
  vars:[{k:"P",name:"Brake power P",e:1,u:[["1","kW"],["1000","MW"],["0.001","W"],["0.73549875","PS (metric hp)"],["0.74569987158227","hp (mechanical)"]]},
        {k:"p",name:"Mean effective pressure p\u2098\u2091",e:-1,u:[["1","bar"],["10","MPa"],["0.01","kPa"]]},
        {k:"V",name:"Total swept volume V (all cylinders)",e:-1,u:[["1","L"],["1000","m\u00b3"]]},
        {k:"n",name:"Engine speed n",e:-1,u:[["1","rpm"],["60","Hz"]]}]},
 ptq:{note:"P = M \u00b7 \u03c9 = M \u00b7 2\u03c0 \u00b7 n / 60. The same for two-stroke and four-stroke.",
  K:function(){return 2*Math.PI/60},
  vars:[{k:"P",name:"Power P",e:1,u:[["1","kW"],["1000","MW"],["0.001","W"],["0.73549875","PS (metric hp)"],["0.74569987158227","hp (mechanical)"]]},
        {k:"M",name:"Torque M",e:-1,u:[["1","kN\u00b7m"],["0.001","N\u00b7m"],["0.00980665","kgf\u00b7m"]]},
        {k:"n",name:"Speed n",e:-1,u:[["1","rpm"],["60","Hz"],["9.549296585513721","rad/s"]]}]},
 heat:{note:"Q = m \u00b7 c \u00b7 \u0394T, with Q in kW, m in kg/s, c in kJ/(kg\u00b7K) and \u0394T in K (or \u00b0C, the same difference). The default 4.18 is a typical value for fresh water, change it for other media.",
  K:function(){return 1},
  vars:[{k:"Q",name:"Heat flow Q",e:1,u:[["1","kW"],["0.001","W"],["1000","MW"]]},
        {k:"m",name:"Mass flow m",e:-1,u:[["1","kg/s"],["0.000277777777778","kg/h"],["0.277777777778","t/h"]]},
        {k:"c",name:"Specific heat c",e:-1,def:"4.18",u:[["1","kJ/(kg\u00b7K)"]]},
        {k:"d",name:"Temperature rise \u0394T",e:-1,u:[["1","K"],["1","\u00b0C (difference)"]]}]},
 pump:{note:"P = Q \u00b7 \u0394p / \u03b7 (shaft power), with the pressure rise \u0394p and the total efficiency \u03b7. Use the hydraulic power by setting \u03b7 to 100 %.",
  K:function(){return 100},
  vars:[{k:"P",name:"Shaft power P",e:1,u:[["1","kW"],["0.001","W"],["1000","MW"]]},
        {k:"Q",name:"Flow Q",e:-1,u:[["0.000277777777778","m\u00b3/h"],["1","m\u00b3/s"],["0.0000166666666667","L/min"],["0.001","L/s"],["0.0000630901964","US gal/min"]]},
        {k:"p",name:"Pressure rise \u0394p",e:-1,u:[["1","bar"],["0.01","kPa"],["10","MPa"],["0.0689475729317","psi"]]},
        {k:"h",name:"Efficiency \u03b7",e:1,u:[["1","fraction (0 to 1)"],["0.01","%"]]}]},
 aff:{note:"Pump and fan affinity laws: X2 = X1 \u00b7 (n2 / n1)^k. Flow k = 1, head or pressure k = 2, power k = 3. Valid for the same pump or fan and system with little change in efficiency.",
  sel:{k:"law",opts:[["1","Flow (k = 1)"],["2","Head or pressure (k = 2)"],["3","Power (k = 3)"]],def:"3"},K:function(){return 1},
  expSel:true,
  vars:[{k:"n1",name:"Speed n1",e:"k",u:[["1","rpm"]]},{k:"n2",name:"Speed n2",e:"-k",u:[["1","rpm"]]},
        {k:"x1",name:"Value at speed 1",e:-1,u:[["1","same unit in and out"]]},{k:"x2",name:"Value at speed 2",e:1,u:[["1","same unit in and out"]]}]}
};
RELS.load={note:"Load = actual power / rated power. The rated power is the one you compare with, for example MCR or NCR. There is no upper limit, a load above 100 % is shown as an overload.",K:function(){return 1},
  extra:function(b){
    if(!(b.P>0&&b.R>0))return "";
    var l=b.P/b.R*100;
    if(l>100.0000001)return "Overload: "+fmt(l-100)+" % above the rated power, "+fmt(b.P-b.R)+" kW over.";
    if(l<99.9999999)return "Margin to the rated power: "+fmt(b.R-b.P)+" kW ("+fmt(100-l)+" % of the rated power).";
    return "Exactly at the rated power.";
  },
  vars:[{k:"P",name:"Actual power P",e:1,u:[["1","kW"],["0.001","W"],["1000","MW"],["0.73549875","PS (metric hp)"],["0.74569987158227","hp (mechanical)"]]},
        {k:"R",name:"Rated power (MCR or NCR)",e:-1,u:[["1","kW"],["0.001","W"],["1000","MW"],["0.73549875","PS (metric hp)"],["0.74569987158227","hp (mechanical)"]]},
        {k:"L",name:"Load",e:-1,u:[["0.01","%"],["1","fraction (1 = 100 %)"]]}]};
var LHVU=[["1","MJ/kg"],["0.001","kJ/kg"],["3.6","kWh/kg"],["0.002326","BTU/lb (IT)"]];
var MFU=[["1","kg/h"],["1000","t/h"],["3600","kg/s"],["41.6666666667","t/day"]];
var PU=[["1","kW"],["0.001","W"],["1000","MW"],["0.73549875","PS (metric hp)"],["0.74569987158227","hp (mechanical)"]];
RELS.fflow={note:"Fuel flow = SFOC \u00b7 P / 1000 (kg/h from g/kWh and kW). Use it to find the power from a measured fuel flow, or the SFOC from fuel flow and power.",K:function(){return 0.001},
  vars:[{k:"m",name:"Fuel flow",e:1,u:MFU},{k:"s",name:"SFOC",e:-1,u:[["1","g/kWh"],["1.359621617","g/PSh (metric hp)"],["3.6","g/MJ"]]},{k:"P",name:"Brake power P",e:-1,u:PU}]};
RELS.effuel={note:"P = \u03b7 \u00b7 m \u00b7 LHV / 3.6, with P in kW, m in kg/h and LHV in MJ/kg. \u03b7 is the brake efficiency.",K:function(){return 1/3.6},
  vars:[{k:"P",name:"Brake power P",e:1,u:PU},{k:"h",name:"Efficiency \u03b7",e:-1,max:1,u:[["0.01","%"],["1","fraction (0 to 1)"]]},{k:"m",name:"Fuel flow m",e:-1,u:MFU},{k:"L",name:"Heating value, LHV",e:-1,u:LHVU}]};
RELS.qfuel={note:"Heat input Q = m \u00b7 LHV / 3.6, with Q in kW, m in kg/h and LHV in MJ/kg.",K:function(){return 1/3.6},
  vars:[{k:"Q",name:"Heat input Q",e:1,u:[["1","kW"],["0.001","W"],["1000","MW"]]},{k:"m",name:"Fuel flow m",e:-1,u:MFU},{k:"L",name:"Heating value, LHV",e:-1,u:LHVU}]};
RELS.sout={note:"Specific output = brake power / total swept volume.",K:function(){return 1},
  vars:[{k:"P",name:"Brake power P",e:1,u:PU},{k:"o",name:"Specific output",e:-1,u:[["1","kW/L"],["0.001","kW/m\u00b3"],["0.73549875","PS/L"]]},{k:"V",name:"Total swept volume V",e:-1,u:[["1","L"],["1000","m\u00b3"]]}]};
RELS.pcyl={note:"Power per cylinder = brake power / number of cylinders.",K:function(){return 1},
  vars:[{k:"P",name:"Total brake power P",e:1,u:PU},{k:"c",name:"Power per cylinder",e:-1,u:PU},{k:"z",name:"Number of cylinders",e:-1,u:[["1","cylinders"]]}]};
RELS.pmi={note:"p_me = p_mi \u00b7 \u03b7_m. The friction mean pressure is p_mi \u2212 p_me. The same for two-stroke and four-stroke.",K:function(){return 1},
  extra:function(b){return (b.p>0&&b.i>0)?"Friction mean pressure = "+fmt(b.i-b.p)+" bar.":""},
  vars:[{k:"p",name:"Effective mean pressure p_me",e:1,u:[["1","bar"],["10","MPa"],["0.01","kPa"]]},{k:"i",name:"Indicated mean pressure p_mi",e:-1,u:[["1","bar"],["10","MPa"],["0.01","kPa"]]},{k:"m",name:"Mechanical efficiency \u03b7_m",e:-1,max:1,u:[["0.01","%"],["1","fraction (0 to 1)"]]}]};
RELS.sbr={note:"Stroke to bore ratio = S / D.",K:function(){return 1},
  vars:[{k:"S",name:"Stroke S",e:1,u:[["0.001","mm"],["0.01","cm"],["1","m"],["0.0254","in"]]},{k:"D",name:"Bore D",e:-1,u:[["0.001","mm"],["0.01","cm"],["1","m"],["0.0254","in"]]},{k:"r",name:"Ratio S / D",e:-1,u:[["1","(number)"]]}]};
RELS.gen={note:"Shaft power P = \u221a3 \u00b7 U \u00b7 I \u00b7 cos \u03c6 / \u03b7 for three phase (P in kW), the electric output divided by the generator efficiency. Single phase: without \u221a3.",
  sel:{k:"ph",label:"Phases",opts:[["3","Three phase"],["1","Single phase"]],def:"3"},K:function(sel){return (sel==="3"?Math.sqrt(3):1)/1000},
  vars:[{k:"P",name:"Shaft power P",e:1,u:PU},{k:"U",name:"Voltage between lines U",e:-1,u:[["1","V"],["1000","kV"]]},{k:"I",name:"Current I",e:-1,u:[["1","A"],["0.001","mA"],["1000","kA"]]},
        {k:"c",name:"Power factor cos \u03c6",e:-1,max:1,u:[["1","(0 to 1)"]]},{k:"h",name:"Generator efficiency \u03b7",e:1,max:1,u:[["0.01","%"],["1","fraction (0 to 1)"]]}]};
RELS.voyage={note:"Fuel = consumption \u00b7 distance / speed, with the consumption in t per hour, the distance in nautical miles and the speed in knots.",K:function(){return 1},
  vars:[{k:"F",name:"Fuel for the voyage",e:1,u:[["1","t"],["0.001","kg"]]},{k:"c",name:"Consumption",e:-1,u:[["1","t/h"],["0.001","kg/h"],["0.0416666666667","t/day"]]},
        {k:"d",name:"Distance",e:-1,u:[["1","nautical miles"],["0.539956803","km"],["0.868976242","miles"]]},{k:"v",name:"Speed",e:1,u:[["1","knots"],["0.539956803","km/h"],["1.943844492","m/s"],["0.868976242","mph"]]}]};
RELS.fpnm={note:"Fuel per nautical mile = consumption / speed, with the consumption in kg per hour and the speed in knots.",K:function(){return 1},
  vars:[{k:"f",name:"Fuel per nautical mile",e:1,u:[["1","kg/nm"],["1000","t/nm"]]},{k:"c",name:"Consumption",e:-1,u:[["1","kg/h"],["1000","t/h"],["41.6666666667","t/day"]]},
        {k:"v",name:"Speed",e:1,u:[["1","knots"],["0.539956803","km/h"],["1.943844492","m/s"]]}]};
RELS.slip={note:"V = n \u00b7 p \u00b7 f, where f = 1 \u2212 slip. With the ship speed this gives the apparent slip. A negative slip means f is above 1.",K:function(){return 1},
  extra:function(b){return (b.f>0)?"Apparent slip = "+fmt((1-b.f)*100)+" %.":""},
  vars:[{k:"V",name:"Ship speed V",e:1,u:[["0.514444444444","knots"],["1","m/s"],["0.277777777778","km/h"]]},{k:"n",name:"Propeller speed n",e:-1,u:[["0.0166666666667","rpm"],["1","Hz"]]},
        {k:"p",name:"Propeller pitch p",e:-1,u:[["1","m"],["0.001","mm"],["0.3048","ft"],["0.0254","in"]]},{k:"f",name:"Speed factor f = 1 \u2212 slip",e:-1,u:[["1","(number, 0.95 is 5 % slip)"]]}]};
RELS.adm={note:"Admiralty coefficient C = \u0394^(2/3) \u00b7 V\u00b3 / P, with the displacement \u0394 in tonnes, the speed V in knots and the power P in kW.",K:function(){return 1},
  vars:[{k:"C",name:"Admiralty coefficient C",e:1,u:[["1","(number)"]]},{k:"D",name:"Displacement \u0394",e:-2/3,u:[["1","t"],["0.001","kg"]]},
        {k:"V",name:"Speed V",e:-3,u:[["1","knots"],["0.539956803","km/h"]]},{k:"P",name:"Power P",e:1,u:PU}]};
var KW=[["1","kW"],["0.001","W"],["1000","MW"],["0.73549875","PS (metric hp)"],["0.74569987158227","hp (mechanical)"]];
RELS.motor={note:"Shaft power P = \u221a3 \u00b7 U \u00b7 I \u00b7 cos \u03c6 \u00b7 \u03b7 for three phase, P = U \u00b7 I \u00b7 cos \u03c6 \u00b7 \u03b7 for single phase (P in kW, U in V, I in A, divided by 1000). cos \u03c6 and \u03b7 cannot be above 1. The nameplate values are for rated load, they change with the load.",
  sel:{k:"ph",label:"Phases",opts:[["3","Three phase"],["1","Single phase"]],def:"3"},K:function(sel){return (sel==="3"?Math.sqrt(3):1)/1000},
  vars:[{k:"P",name:"Shaft power P",e:1,u:KW},
        {k:"U",name:"Voltage between lines U",e:-1,u:[["1","V"],["1000","kV"]]},
        {k:"I",name:"Current I",e:-1,u:[["1","A"],["0.001","mA"],["1000","kA"]]},
        {k:"c",name:"Power factor cos \u03c6",e:-1,max:1,u:[["1","(0 to 1)"]]},
        {k:"h",name:"Efficiency \u03b7",e:-1,max:1,u:[["1","fraction (0 to 1)"],["0.01","%"]]}]};
RELS.pf={note:"cos \u03c6 = P / S, with active power P in kW and apparent power S in kVA. The phase angle is \u03c6 = arccos(cos \u03c6) and the reactive power is Q = S \u00b7 sin \u03c6.",K:function(){return 1},
  extra:function(b){
    if(!(b.P>0&&b.S>0&&b.c>0&&b.c<=1.0000001))return "";
    var c=Math.min(1,b.c),phi=Math.acos(c);
    return "Phase angle \u03c6 = "+fmt(phi*180/Math.PI)+" degrees. Reactive power Q = "+fmt(b.S*Math.sin(phi))+" kVAr.";
  },
  vars:[{k:"P",name:"Active power P",e:1,u:[["1","kW"],["0.001","W"],["1000","MW"]]},
        {k:"S",name:"Apparent power S",e:-1,u:[["1","kVA"],["0.001","VA"],["1000","MVA"]]},
        {k:"c",name:"Power factor cos \u03c6",e:-1,max:1,u:[["1","(0 to 1)"]]}]};
RELS.pipe={note:"Q = v \u00b7 A, with the pipe area A = \u03c0/4 \u00b7 D\u00b2 (full pipe, inside diameter).",K:function(){return Math.PI/4},
  vars:[{k:"Q",name:"Flow Q",e:1,u:[["0.000277777777778","m\u00b3/h"],["1","m\u00b3/s"],["0.0000166666666667","L/min"],["0.001","L/s"],["0.0000630901964","US gal/min"]]},
        {k:"v",name:"Flow velocity v",e:-1,u:[["1","m/s"],["0.3048","ft/s"],["0.277777777778","km/h"]]},
        {k:"D",name:"Inside diameter D",e:-2,u:[["0.001","mm"],["0.01","cm"],["1","m"],["0.0254","in"]]}]};
RELS.hydro={note:"p = \u03c1 \u00b7 g \u00b7 h, with g = 9.80665 m/s\u00b2. This is the pressure from the liquid column itself (gauge pressure). Fresh water is about 1000 kg/m\u00b3, take the density from your own data for oils and fuels.",K:function(){return 9.80665},
  vars:[{k:"p",name:"Pressure p",e:1,u:[["100000","bar"],["1000","kPa"],["100","mbar"],["1","Pa"],["1000000","MPa"],["6894.757293168","psi"]]},
        {k:"r",name:"Density \u03c1",e:-1,u:[["1","kg/m\u00b3"],["1000","g/cm\u00b3 = kg/L"]]},
        {k:"h",name:"Height of the liquid h",e:-1,u:[["1","m"],["0.001","mm"],["0.01","cm"],["0.3048","ft"]]}]};
RELS.fpress={note:"F = p \u00b7 A. Use gauge pressure for the force that the pressure adds on a surface.",K:function(){return 1},
  vars:[{k:"F",name:"Force F",e:1,u:[["1000","kN"],["1","N"],["9.80665","kgf"],["4.4482216152605","lbf"],["9806.65","tonne-force"]]},
        {k:"p",name:"Pressure p",e:-1,u:[["100000","bar"],["1000","kPa"],["1","Pa"],["1000000","MPa"],["6894.757293168","psi"]]},
        {k:"A",name:"Area A",e:-1,u:[["0.0001","cm\u00b2"],["1","m\u00b2"],["0.000001","mm\u00b2"],["0.00064516","in\u00b2"]]}]};
var REL={};
function relState(id){
  var d=RELS[id],st=REL[id];
  if(st)return st;
  st=REL[id]={ord:[],v:{},u:{},sel:d.sel?d.sel.def:""};
  d.vars.forEach(function(f){st.v[f.k]=f.def||"";st.u[f.k]=Number(f.u[0][0]);if(f.def)st.ord.push(f.k)});
  return st;
}
function expOf(d,f,st){var e=f.e;if(e==="k")return Number(st.sel);if(e==="-k")return -Number(st.sel);return e}
function relCalc(c){
  var d=RELS[c.id],st=relState(c.id),n=d.vars.length;
  var good=st.ord.filter(function(k){return num(st.v[k])>0}).slice(-(n-1));
  var msg="Type "+(n-1)+" of the "+n+" values.",form="",unk=null;
  if($("r_ex"))$("r_ex").textContent="";
  d.vars.forEach(function(f){var el=$("r_"+f.k);if(el)el.classList.remove("calc")});
  if(good.length===n-1){
    unk=d.vars.filter(function(f){return good.indexOf(f.k)<0})[0];
    var sum=0;
    d.vars.forEach(function(f){if(f===unk)return;sum+=expOf(d,f,st)*Math.log(num(st.v[f.k])*st.u[f.k])});
    var lnK=Math.log(d.K(st.sel)),eu=expOf(d,unk,st),val=Math.exp((lnK-sum)/eu);
    var el=$("r_"+unk.k);
    var over=d.vars.some(function(f){var b=f===unk?val:num(st.v[f.k])*st.u[f.k];return f.max&&b>f.max*(1+1e-9)&&(f===unk||good.indexOf(f.k)>=0)});
    if(over){el.value="";msg="That gives a value above 1 for cos \u03c6 or efficiency. Check the numbers."}
    else if(isFinite(val)){el.value=fmt(val/st.u[unk.k]);el.classList.add("calc");msg="";
      if(d.extra){var bm={};d.vars.forEach(function(f){bm[f.k]=f===unk?val:num(st.v[f.k])*st.u[f.k]});$("r_ex").textContent=d.extra(bm)}}
    else{el.value="";msg="The result is outside what the formula can give."}
  }else if(st.ord.some(function(k){return !(num(st.v[k])>0)&&st.v[k]!==""})){msg="Use values above zero."}
  d.vars.forEach(function(f){var el=$("r_"+f.k);if(el&&f!==unk&&good.indexOf(f.k)<0)el.value=st.v[f.k]===""?"":st.v[f.k]});
  $("r_msg").textContent=msg;
}
function openRel(c){
  var d=RELS[c.id],st=relState(c.id);
  if(d.sel&&d.sel.k==="cyc")st.sel=ST.ex.cyc||"1";
  var h='<div class="wrap"><button class="cback" id="cb"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>All groups</button>'
   +'<div class="eyebrow">Calculate</div><h1>'+esc(c.name)+'</h1><div class="sub">Type all values but one. The last one is calculated. Change a calculated value to make it one of yours.</div>';
  if(d.sel)h+='<div class="cbox"><div class="lb">'+(d.sel.label||(c.id==="aff"?"Which law":"Engine type"))+'</div><select id="r_sel" style="margin-top:0">'+d.sel.opts.map(function(o){return '<option value="'+o[0]+'"'+(String(st.sel)===o[0]?" selected":"")+'>'+esc(o[1])+'</option>'}).join("")+'</select></div>';
  d.vars.forEach(function(f){
    h+='<div class="cbox"><div class="lb">'+esc(f.name)+'</div><div class="cin"><input type="text" inputmode="decimal" id="r_'+f.k+'" placeholder="?" value="'+esc(st.v[f.k])+'" autocomplete="off"></div>'
      +'<select id="ru_'+f.k+'">'+f.u.map(function(o){return '<option value="'+o[0]+'"'+(Number(o[0])===st.u[f.k]?" selected":"")+'>'+esc(o[1])+'</option>'}).join("")+'</select></div>';
  });
  h+='<div class="cbox"><div class="res ph" id="r_msg"></div><div class="fline" id="r_ex"></div><div class="mcal">'+esc(d.note)+'</div><div class="row" style="margin-top:12px"><button class="btn sec" id="r_clr">Clear all</button></div></div></div>';
  host.innerHTML=h;css2();
  $("cb").onclick=home;
  if(d.sel)$("r_sel").onchange=function(){st.sel=this.value;if(d.sel.k==="cyc"){ST.ex.cyc=this.value;save()}relCalc(c)};
  d.vars.forEach(function(f){
    $("r_"+f.k).oninput=function(){
      st.v[f.k]=this.value;
      st.ord=st.ord.filter(function(x){return x!==f.k});st.ord.push(f.k);
      if(this.value.trim()==="")st.ord=st.ord.filter(function(x){return x!==f.k});
      relCalc(c);
    };
    $("ru_"+f.k).onchange=function(){st.u[f.k]=Number(this.value);relCalc(c)};
  });
  $("r_clr").onclick=function(){delete REL[c.id];openRel(c)};
  relCalc(c);window.scrollTo(0,0);
}
/* ---------- two known values give the rest ---------- */
var TWO={
 ceps:{note:"\u03b5 = 1 + V_swept / V_clearance. The compression ratio is the total cylinder volume at bottom dead centre divided by the clearance volume at top dead centre.",
  vars:[{k:"S",name:"Swept volume per cylinder",u:[["1","L"],["0.001","cm\u00b3"],["1000","m\u00b3"]]},{k:"C",name:"Clearance volume",u:[["1","L"],["0.001","cm\u00b3"],["1000","m\u00b3"]]},{k:"E",name:"Compression ratio \u03b5",u:[["1","(number)"]]}],
  solve:function(a,x,b,y){var m={};m[a]=x;m[b]=y;var r={S:m.S,C:m.C,E:m.E};
    if(m.S!==undefined&&m.C!==undefined)r.E=1+m.S/m.C;
    else if(m.S!==undefined&&m.E!==undefined){if(!(m.E>1))return null;r.C=m.S/(m.E-1)}
    else{if(!(m.E>1))return null;r.S=(m.E-1)*m.C}
    return r}},
 bunker:{note:"Mass = V \u00b7 \u03c1 / 1000 (in vacuum). Weight in air = V \u00b7 (\u03c1 \u2212 1.1) / 1000, with the weight factor 1.1 kg/m\u00b3 (ASTM D1250-80 table 56) that your fuel analysis report uses. \u03c1 is the density at 15 \u00b0C.",
  vars:[{k:"V",name:"Volume",u:[["1","m\u00b3"],["0.001","L"]]},{k:"R",name:"Density \u03c1 at 15 \u00b0C",u:[["1","kg/m\u00b3"],["1000","g/cm\u00b3 = kg/L"]]},
        {k:"M",name:"Mass (in vacuum)",u:[["1","t"],["0.001","kg"]]},{k:"A",name:"Weight in air",u:[["1","t"],["0.001","kg"]]}],
  solve:function(a,x,b,y){var m={};m[a]=x;m[b]=y;var F=1.1,k=[a,b].sort().join(""),V,R,M,A;
    if(k==="RV"){V=m.V;R=m.R}
    else if(k==="MV"){V=m.V;R=m.M*1000/V}
    else if(k==="AV"){V=m.V;R=m.A*1000/V+F}
    else if(k==="MR"){R=m.R;V=m.M*1000/R}
    else if(k==="AR"){R=m.R;V=m.A*1000/(R-F)}
    else if(k==="AM"){V=(m.M-m.A)*1000/F;R=m.M*1000/V}
    if(!(V>0)||!(R>F))return null;
    return {V:V,R:R,M:V*R/1000,A:V*(R-F)/1000}}}
};
var TW={};
function twoState(id){var st=TW[id];if(st)return st;st=TW[id]={ord:[],v:{},u:{}};TWO[id].vars.forEach(function(f){st.v[f.k]="";st.u[f.k]=Number(f.u[0][0])});return st}
function twoCalc(c){
  var d=TWO[c.id],st=twoState(c.id),good=st.ord.filter(function(k){return num(st.v[k])>0}).slice(-2),msg="Type any two of the "+d.vars.length+" values.";
  d.vars.forEach(function(f){var el=$("t_"+f.k);if(el)el.classList.remove("calc")});
  if(good.length===2){
    var a=good[0],b=good[1],r=d.solve(a,num(st.v[a])*st.u[a],b,num(st.v[b])*st.u[b]);
    if(!r){msg="These two values do not fit together."}
    else{msg="";d.vars.forEach(function(f){if(good.indexOf(f.k)>=0)return;var el=$("t_"+f.k);el.value=fmt(r[f.k]/st.u[f.k]);el.classList.add("calc")})}
  }
  $("t_msg").textContent=msg;
}
function openTwo(c){
  var d=TWO[c.id],st=twoState(c.id);
  var h='<div class="wrap"><button class="cback" id="cb"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>All groups</button>'
   +'<div class="eyebrow">Calculate</div><h1>'+esc(c.name)+'</h1><div class="sub">Type any two values. The others are calculated. Change a calculated value to make it one of your two.</div>';
  d.vars.forEach(function(f){
    h+='<div class="cbox"><div class="lb">'+esc(f.name)+'</div><div class="cin"><input type="text" inputmode="decimal" id="t_'+f.k+'" placeholder="?" value="'+esc(st.v[f.k])+'" autocomplete="off"></div>'
      +'<select id="tu_'+f.k+'">'+f.u.map(function(o){return '<option value="'+o[0]+'"'+(Number(o[0])===st.u[f.k]?" selected":"")+'>'+esc(o[1])+'</option>'}).join("")+'</select></div>';
  });
  h+='<div class="cbox"><div class="res ph" id="t_msg"></div><div class="mcal">'+esc(d.note)+'</div><div class="row" style="margin-top:12px"><button class="btn sec" id="t_clr">Clear all</button></div></div></div>';
  host.innerHTML=h;css2();
  $("cb").onclick=home;
  d.vars.forEach(function(f){
    $("t_"+f.k).oninput=function(){st.v[f.k]=this.value;st.ord=st.ord.filter(function(x){return x!==f.k});st.ord.push(f.k);if(this.value.trim()==="")st.ord=st.ord.filter(function(x){return x!==f.k});twoCalc(c)};
    $("tu_"+f.k).onchange=function(){st.u[f.k]=Number(this.value);twoCalc(c)};
  });
  $("t_clr").onclick=function(){delete TW[c.id];openTwo(c)};
  twoCalc(c);window.scrollTo(0,0);
}
/* ---------- dual fuel energy share ---------- */
var DU={mp:"",lp:"",mg:"",lg:""};
function openDual(c){
  var h='<div class="wrap"><button class="cback" id="cb"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>All groups</button>'
   +'<div class="eyebrow">Calculate</div><h1>'+esc(c.name)+'</h1><div class="sub">Type the pilot fuel and the gas, as mass and heating value. The energy share is calculated.</div>'
   +'<div class="cbox"><div class="lb">Pilot fuel</div><label class="f" for="d_mp" style="margin-top:0">Mass (kg)</label><input type="text" inputmode="decimal" id="d_mp" value="'+esc(DU.mp)+'"><label class="f" for="d_lp">Heating value, LHV (MJ/kg)</label><input type="text" inputmode="decimal" id="d_lp" value="'+esc(DU.lp)+'"></div>'
   +'<div class="cbox"><div class="lb">Gas</div><label class="f" for="d_mg" style="margin-top:0">Mass (kg)</label><input type="text" inputmode="decimal" id="d_mg" value="'+esc(DU.mg)+'"><label class="f" for="d_lg">Heating value, LHV (MJ/kg)</label><input type="text" inputmode="decimal" id="d_lg" value="'+esc(DU.lg)+'"></div>'
   +'<div class="cbox"><div class="lb">Result</div><div id="d_out"></div><div class="mcal">Energy = mass \u00b7 LHV. Pilot share = pilot energy / (pilot energy + gas energy). Take the heating values from your own fuel and gas data.</div></div></div>';
  host.innerHTML=h;
  $("cb").onclick=home;
  ["mp","lp","mg","lg"].forEach(function(k){$("d_"+k).oninput=function(){DU[k]=this.value;duCalc()}});
  duCalc();window.scrollTo(0,0);
}
function duRows(){
  var mp=num(DU.mp),lp=num(DU.lp),mg=num(DU.mg),lg=num(DU.lg),r=[];
  if(mp>=0&&lp>0)r.push(["Pilot fuel energy",fmt(mp*lp)+" MJ"]);
  if(mg>=0&&lg>0)r.push(["Gas energy",fmt(mg*lg)+" MJ"]);
  if(mp>=0&&lp>0&&mg>=0&&lg>0){var ep=mp*lp,eg=mg*lg,t=ep+eg;if(t>0){r.push(["Total energy",fmt(t)+" MJ"]);r.push(["Pilot share",fmt(ep/t*100)+" %"]);r.push(["Gas share",fmt(eg/t*100)+" %"])}}
  return r;
}
function duCalc(){var rows=duRows();$("d_out").innerHTML=rows.length?rows.map(function(r){return '<div class="row2" style="cursor:default"><span>'+esc(r[0])+'</span><span>'+esc(r[1])+'</span></div>'}).join(""):'<div class="res ph">Type some values</div>'}
/* ---------- circle: type any one value ---------- */
var CI={ord:[],v:{D:"",A:"",C:""},u:{D:0.001,A:0.0001,C:0.001}};
var CIF=[{k:"D",name:"Diameter D",u:[["0.001","mm"],["0.01","cm"],["1","m"],["0.0254","in"],["0.3048","ft"]]},
         {k:"A",name:"Area A",u:[["0.0001","cm\u00b2"],["1","m\u00b2"],["0.000001","mm\u00b2"],["0.00064516","in\u00b2"],["0.09290304","ft\u00b2"]]},
         {k:"C",name:"Circumference C",u:[["0.001","mm"],["0.01","cm"],["1","m"],["0.0254","in"],["0.3048","ft"]]}];
function ciSolve(k,x){ /* x in SI (m or m2); returns D, A, C in SI */
  var D=k==="D"?x:(k==="A"?Math.sqrt(4*x/Math.PI):x/Math.PI);
  return {D:D,A:Math.PI/4*D*D,C:Math.PI*D};
}
function ciCalc(){
  var k=CI.ord.filter(function(q){return num(CI.v[q])>0}).slice(-1)[0],out=null;
  if(k)out=ciSolve(k,num(CI.v[k])*CI.u[k]);
  CIF.forEach(function(f){
    var el=$("c_"+f.k);el.classList.toggle("calc",!!k&&f.k!==k);
    if(k&&f.k!==k)el.value=fmt(out[f.k]/CI.u[f.k]);
    else if(!k&&CI.v[f.k]==="")el.value="";
  });
  $("c_msg").textContent=k?"":"Type any one of the three values.";
}
function openCirc(c){
  var h='<div class="wrap"><button class="cback" id="cb"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>All groups</button>'
   +'<div class="eyebrow">Calculate</div><h1>'+esc(c.name)+'</h1><div class="sub">Type any one value. The other two are calculated.</div>';
  CIF.forEach(function(f){
    h+='<div class="cbox"><div class="lb">'+f.name+'</div><div class="cin"><input type="text" inputmode="decimal" id="c_'+f.k+'" placeholder="?" value="'+esc(CI.v[f.k])+'" autocomplete="off"></div>'
      +'<select id="cu_'+f.k+'">'+f.u.map(function(o){return '<option value="'+o[0]+'"'+(Number(o[0])===CI.u[f.k]?" selected":"")+'>'+esc(o[1])+'</option>'}).join("")+'</select></div>';
  });
  h+='<div class="cbox"><div class="res ph" id="c_msg"></div><div class="mcal">A = \u03c0/4 \u00b7 D\u00b2 and C = \u03c0 \u00b7 D.</div><div class="row" style="margin-top:12px"><button class="btn sec" id="c_clr">Clear all</button></div></div></div>';
  host.innerHTML=h;css2();
  $("cb").onclick=home;
  CIF.forEach(function(f){
    $("c_"+f.k).oninput=function(){
      CI.v[f.k]=this.value;CI.ord=CI.ord.filter(function(x){return x!==f.k});CI.ord.push(f.k);
      if(this.value.trim()==="")CI.ord=CI.ord.filter(function(x){return x!==f.k});
      ciCalc();
    };
    $("cu_"+f.k).onchange=function(){CI.u[f.k]=Number(this.value);ciCalc()};
  });
  $("c_clr").onclick=function(){CI.ord=[];CI.v={D:"",A:"",C:""};CIF.forEach(function(f){$("c_"+f.k).value=""});ciCalc()};
  ciCalc();window.scrollTo(0,0);
}
/* ---------- engine data ---------- */
var ED={D:"",S:"",z:"",n:""};
function openEdata(c){
  var h='<div class="wrap"><button class="cback" id="cb"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>All groups</button>'
   +'<div class="eyebrow">Calculate</div><h1>'+esc(c.name)+'</h1><div class="sub">Type the engine data. Everything that can be calculated is shown.</div>'
   +'<div class="cbox"><div class="lb">Engine type</div><select id="e_cyc" style="margin-top:0">'+CYC.map(function(o){return '<option value="'+o[0]+'"'+(ST.ex.cyc===o[0]?" selected":"")+'>'+esc(o[1])+'</option>'}).join("")+'</select>'
   +'<label class="f" for="e_D">Bore D (mm)</label><input type="text" inputmode="decimal" id="e_D" value="'+esc(ED.D)+'">'
   +'<label class="f" for="e_S">Stroke S (mm)</label><input type="text" inputmode="decimal" id="e_S" value="'+esc(ED.S)+'">'
   +'<label class="f" for="e_z">Number of cylinders</label><input type="text" inputmode="numeric" id="e_z" value="'+esc(ED.z)+'">'
   +'<label class="f" for="e_n">Speed n (rpm)</label><input type="text" inputmode="decimal" id="e_n" value="'+esc(ED.n)+'"></div>'
   +'<div class="cbox"><div class="lb">Result</div><div id="e_out"></div><div class="mcal">Swept volume = \u03c0/4 \u00b7 D\u00b2 \u00b7 S. Mean piston speed = 2 \u00b7 S \u00b7 n / 60. Firing interval = 360\u00b0 \u00b7 k / z and firing frequency = z \u00b7 n / (60 \u00b7 k), with k = 1 for two-stroke and k = 2 for four-stroke.</div></div></div>';
  host.innerHTML=h;
  $("cb").onclick=home;
  ["D","S","z","n"].forEach(function(k){$("e_"+k).oninput=function(){ED[k]=this.value;edCalc()}});
  $("e_cyc").onchange=function(){ST.ex.cyc=this.value;save();edCalc()};
  edCalc();window.scrollTo(0,0);
}
function edRows(){
  var D=num(ED.D),S=num(ED.S),z=num(ED.z),n=num(ED.n),k=Number(ST.ex.cyc||1),rows=[];
  if(D>0&&S>0){var vs=Math.PI/4*D*D*S*1e-6; /* mm3 -> L */ rows.push(["Swept volume per cylinder",fmt(vs)+" L"]);if(z>0)rows.push(["Total swept volume",fmt(vs*z)+" L"])}
  if(S>0&&n>0)rows.push(["Mean piston speed",fmt(2*S/1000*n/60)+" m/s"]);
  if(z>0){rows.push(["Firing interval",fmt(360*k/z)+" degrees crank angle"]);if(n>0)rows.push(["Firing frequency (engine)",fmt(z*n/(60*k))+" per second"])}
  if(n>0)rows.push(["Power strokes per cylinder",fmt(n/k)+" per minute"]);
  return rows;
}
function edCalc(){
  var rows=edRows();
  $("e_out").innerHTML=rows.length?rows.map(function(r){return '<div class="row2" style="cursor:default"><span>'+esc(r[0])+'</span><span>'+esc(r[1])+'</span></div>'}).join(""):'<div class="res ph">Type some values</div>';
}
function result(){
  if(!CUR)return null;
  var p=ST.per[CUR.id],v=num(p.v);if(isNaN(v))return null;
  return conv(CUR,unitById(CUR,p.f),unitById(CUR,p.t),v,ctx());
}
function upd(){
  var c=CUR;if(!c)return;
  var p=ST.per[c.id],fu=unitById(c,p.f),tu=unitById(c,p.t),cx=ctx(),v=num(p.v),res=$("res");
  if(c.ex==="sub"){var e=$("xm");if(e)e.textContent=cx.M>0?"Molar mass used: "+fmt(cx.M)+" g/mol. "+NOTE.sub:"Type a molar mass in g/mol."}
  var r=isNaN(v)?null:conv(c,fu,tu,v,cx);
  if(!r){res.className="res ph";res.textContent="Type a number"}
  else if(r.miss){res.className="res ph";res.textContent="Fill in "+r.miss.map(function(n){return MISSNAME[n]}).join(" and ")}
  else if(r.bad){res.className="res ph";res.textContent=r.bad}
  else{res.className="res";res.textContent=fmt(r.val)}
  var one=c.range?null:conv(c,fu,tu,1,cx);
  $("fl").textContent=one&&one.val!==undefined?"1 "+fu.label.split(" (")[0].split(" =")[0]+" = "+fmt(one.val)+" "+tu.label.split(" (")[0].split(" =")[0]:(c.rangeNote||"");
  var a=$("alr");
  if(a&&a.style.display!=="none"){
    if(isNaN(v)){a.innerHTML='<div class="sub">Type a number first.</div>'}
    else{
      a.innerHTML=c.units.map(function(u){var rr=conv(c,fu,u,v,cx);return '<div class="row2'+(u.id===p.t?" on":"")+'" data-u="'+u.id+'"><span>'+esc(u.label)+'</span><span>'+(rr.val!==undefined?fmt(rr.val):"needs input above")+'</span></div>'}).join("");
      a.querySelectorAll(".row2").forEach(function(r2){r2.onclick=function(){p.t=r2.getAttribute("data-u");$("st").value=p.t;save();upd()}});
    }
  }
}
home();
window.__cv={TWO:TWO,TW:TW,duRows:duRows,DU:DU,ciSolve:ciSolve,CI:CI,RELS:RELS,REL:REL,relState:relState,relCalc:relCalc,edRows:edRows,ED:ED,ohmSolve:ohmSolve,CATS:CATS,SUB:SUB,conv:conv,ctx:ctx,molar:molar,unitById:unitById,fmt:fmt,ST:ST,open:open,home:home,num:num};
})();
