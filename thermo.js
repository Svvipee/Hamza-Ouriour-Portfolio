'use strict';
// Educational ideal Brayton model; no pressure losses or variable specific heats.
// The 2.5 heat-addition factor is a retained illustration parameter, not test data.
const form=document.querySelector('#cycle-form');
const result=document.querySelector('#result');
function runCycle(event){
  event?.preventDefault();
  const pr=Number(document.querySelector('#pr').value),gamma=Number(document.querySelector('#gamma').value),T1=Number(document.querySelector('#T1').value);
  const raw=['pr','gamma','T1'].map(id=>document.getElementById(id).value.trim());
  if(raw.some(v=>!v)||![pr,gamma,T1].every(Number.isFinite)||pr<=1||gamma<=1||gamma>1.67||T1<=0){
    result.textContent='Enter a pressure ratio greater than 1, γ between 1 and 1.67 (exclusive of 1), and a positive inlet temperature.';
    document.querySelector('#chart').getContext('2d').clearRect(0,0,900,420);return;
  }
  const ratio=Math.pow(pr,(gamma-1)/gamma);
  const states=[T1,T1*ratio,T1*ratio*2.5,T1*2.5];
  if(!states.every(Number.isFinite)){result.textContent='These inputs exceed the numerical range. Use smaller values.';return;}
  const eff=1-1/ratio;
  result.textContent=`Ideal thermal efficiency: ${(eff*100).toFixed(2)}%. T₁: ${states[0].toFixed(1)} K · T₂: ${states[1].toFixed(1)} K · T₃: ${states[2].toFixed(1)} K · T₄: ${states[3].toFixed(1)} K.`;
  const canvas=document.querySelector('#chart'),ctx=canvas.getContext('2d');
  ctx.clearRect(0,0,900,420);ctx.fillStyle='#fff';ctx.fillRect(0,0,900,420);
  const max=Math.max(...states)*1.15,ys=t=>350-t/max*290,xs=[150,350,550,750];
  ctx.font='15px Arial';ctx.fillStyle='#506171';ctx.fillText('Temperature (K)',24,26);
  for(let i=0;i<=4;i++){const y=350-i*290/4;ctx.strokeStyle='#d5dde2';ctx.beginPath();ctx.moveTo(75,y);ctx.lineTo(840,y);ctx.stroke();ctx.fillText((max*i/4).toFixed(0),15,y+5);}
  ctx.strokeStyle='#245d80';ctx.lineWidth=3;ctx.beginPath();states.forEach((t,i)=>i?ctx.lineTo(xs[i],ys(t)):ctx.moveTo(xs[i],ys(t)));ctx.stroke();
  states.forEach((t,i)=>{ctx.fillStyle='#142b3e';ctx.beginPath();ctx.arc(xs[i],ys(t),5,0,Math.PI*2);ctx.fill();ctx.fillText(t.toFixed(1)+' K',xs[i]-29,ys(t)-15);ctx.fillText('State '+(i+1),xs[i]-25,380);});
  ctx.fillStyle='#506171';ctx.fillText('State sequence — not entropy',320,410);
}
form.addEventListener('submit',runCycle);
runCycle();
