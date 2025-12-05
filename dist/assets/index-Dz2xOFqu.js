import{c as P}from"./createLucideIcon-Bi4YljoP.js";import{r as d}from"./index-XgJ0_-ue.js";/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const He=P("FileText",[["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",key:"1rqfz7"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M10 9H8",key:"b1mrlr"}],["path",{d:"M16 13H8",key:"t4e002"}],["path",{d:"M16 17H8",key:"z1uh3a"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Fe=P("Upload",[["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}],["polyline",{points:"17 8 12 3 7 8",key:"t8dd8p"}],["line",{x1:"12",x2:"12",y1:"3",y2:"15",key:"widbto"}]]);let V={data:""},Y=e=>{if(typeof window=="object"){let t=(e?e.querySelector("#_goober"):window._goober)||Object.assign(document.createElement("style"),{innerHTML:" ",id:"_goober"});return t.nonce=window.__nonce__,t.parentNode||(e||document.head).appendChild(t),t.firstChild}return e||V},K=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,Q=/\/\*[^]*?\*\/|  +/g,F=/\n+/g,x=(e,t)=>{let a="",i="",o="";for(let s in e){let r=e[s];s[0]=="@"?s[1]=="i"?a=s+" "+r+";":i+=s[1]=="f"?x(r,s):s+"{"+x(r,s[1]=="k"?"":t)+"}":typeof r=="object"?i+=x(r,t?t.replace(/([^,])+/g,n=>s.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g,l=>/&/.test(l)?l.replace(/&/g,n):n?n+" "+l:l)):s):r!=null&&(s=/^--/.test(s)?s:s.replace(/[A-Z]/g,"-$&").toLowerCase(),o+=x.p?x.p(s,r):s+":"+r+";")}return a+(t&&o?t+"{"+o+"}":o)+i},b={},L=e=>{if(typeof e=="object"){let t="";for(let a in e)t+=a+L(e[a]);return t}return e},W=(e,t,a,i,o)=>{let s=L(e),r=b[s]||(b[s]=(l=>{let p=0,u=11;for(;p<l.length;)u=101*u+l.charCodeAt(p++)>>>0;return"go"+u})(s));if(!b[r]){let l=s!==e?e:(p=>{let u,c,m=[{}];for(;u=K.exec(p.replace(Q,""));)u[4]?m.shift():u[3]?(c=u[3].replace(F," ").trim(),m.unshift(m[0][c]=m[0][c]||{})):m[0][u[1]]=u[2].replace(F," ").trim();return m[0]})(e);b[r]=x(o?{["@keyframes "+r]:l}:l,a?"":"."+r)}let n=a&&b.g?b.g:null;return a&&(b.g=b[r]),((l,p,u,c)=>{c?p.data=p.data.replace(c,l):p.data.indexOf(l)===-1&&(p.data=u?l+p.data:p.data+l)})(b[r],t,i,n),r},G=(e,t,a)=>e.reduce((i,o,s)=>{let r=t[s];if(r&&r.call){let n=r(a),l=n&&n.props&&n.props.className||/^go/.test(n)&&n;r=l?"."+l:n&&typeof n=="object"?n.props?"":x(n,""):n===!1?"":n}return i+o+(r??"")},"");function O(e){let t=this||{},a=e.call?e(t.p):e;return W(a.unshift?a.raw?G(a,[].slice.call(arguments,1),t.p):a.reduce((i,o)=>Object.assign(i,o&&o.call?o(t.p):o),{}):a,Y(t.target),t.g,t.o,t.k)}let _,M,N;O.bind({g:1});let v=O.bind({k:1});function J(e,t,a,i){x.p=t,_=e,M=a,N=i}function w(e,t){let a=this||{};return function(){let i=arguments;function o(s,r){let n=Object.assign({},s),l=n.className||o.className;a.p=Object.assign({theme:M&&M()},n),a.o=/ *go\d+/.test(l),n.className=O.apply(a,i)+(l?" "+l:"");let p=e;return e[0]&&(p=n.as||e,delete n.as),N&&p[0]&&N(n),_(p,n)}return o}}var X=e=>typeof e=="function",D=(e,t)=>X(e)?e(t):e,ee=(()=>{let e=0;return()=>(++e).toString()})(),S=(()=>{let e;return()=>{if(e===void 0&&typeof window<"u"){let t=matchMedia("(prefers-reduced-motion: reduce)");e=!t||t.matches}return e}})(),te=20,A="default",R=(e,t)=>{let{toastLimit:a}=e.settings;switch(t.type){case 0:return{...e,toasts:[t.toast,...e.toasts].slice(0,a)};case 1:return{...e,toasts:e.toasts.map(r=>r.id===t.toast.id?{...r,...t.toast}:r)};case 2:let{toast:i}=t;return R(e,{type:e.toasts.find(r=>r.id===i.id)?1:0,toast:i});case 3:let{toastId:o}=t;return{...e,toasts:e.toasts.map(r=>r.id===o||o===void 0?{...r,dismissed:!0,visible:!1}:r)};case 4:return t.toastId===void 0?{...e,toasts:[]}:{...e,toasts:e.toasts.filter(r=>r.id!==t.toastId)};case 5:return{...e,pausedAt:t.time};case 6:let s=t.time-(e.pausedAt||0);return{...e,pausedAt:void 0,toasts:e.toasts.map(r=>({...r,pauseDuration:r.pauseDuration+s}))}}},C=[],U={toasts:[],pausedAt:void 0,settings:{toastLimit:te}},h={},q=(e,t=A)=>{h[t]=R(h[t]||U,e),C.forEach(([a,i])=>{a===t&&i(h[t])})},Z=e=>Object.keys(h).forEach(t=>q(e,t)),ae=e=>Object.keys(h).find(t=>h[t].toasts.some(a=>a.id===e)),j=(e=A)=>t=>{q(t,e)},re={blank:4e3,error:4e3,success:2e3,loading:1/0,custom:4e3},ie=(e={},t=A)=>{let[a,i]=d.useState(h[t]||U),o=d.useRef(h[t]);d.useEffect(()=>(o.current!==h[t]&&i(h[t]),C.push([t,i]),()=>{let r=C.findIndex(([n])=>n===t);r>-1&&C.splice(r,1)}),[t]);let s=a.toasts.map(r=>{var n,l,p;return{...e,...e[r.type],...r,removeDelay:r.removeDelay||((n=e[r.type])==null?void 0:n.removeDelay)||(e==null?void 0:e.removeDelay),duration:r.duration||((l=e[r.type])==null?void 0:l.duration)||(e==null?void 0:e.duration)||re[r.type],style:{...e.style,...(p=e[r.type])==null?void 0:p.style,...r.style}}});return{...a,toasts:s}},se=(e,t="blank",a)=>({createdAt:Date.now(),visible:!0,dismissed:!1,type:t,ariaProps:{role:"status","aria-live":"polite"},message:e,pauseDuration:0,...a,id:(a==null?void 0:a.id)||ee()}),k=e=>(t,a)=>{let i=se(t,e,a);return j(i.toasterId||ae(i.id))({type:2,toast:i}),i.id},f=(e,t)=>k("blank")(e,t);f.error=k("error");f.success=k("success");f.loading=k("loading");f.custom=k("custom");f.dismiss=(e,t)=>{let a={type:3,toastId:e};t?j(t)(a):Z(a)};f.dismissAll=e=>f.dismiss(void 0,e);f.remove=(e,t)=>{let a={type:4,toastId:e};t?j(t)(a):Z(a)};f.removeAll=e=>f.remove(void 0,e);f.promise=(e,t,a)=>{let i=f.loading(t.loading,{...a,...a==null?void 0:a.loading});return typeof e=="function"&&(e=e()),e.then(o=>{let s=t.success?D(t.success,o):void 0;return s?f.success(s,{id:i,...a,...a==null?void 0:a.success}):f.dismiss(i),o}).catch(o=>{let s=t.error?D(t.error,o):void 0;s?f.error(s,{id:i,...a,...a==null?void 0:a.error}):f.dismiss(i)}),e};var oe=1e3,ne=(e,t="default")=>{let{toasts:a,pausedAt:i}=ie(e,t),o=d.useRef(new Map).current,s=d.useCallback((c,m=oe)=>{if(o.has(c))return;let y=setTimeout(()=>{o.delete(c),r({type:4,toastId:c})},m);o.set(c,y)},[]);d.useEffect(()=>{if(i)return;let c=Date.now(),m=a.map(y=>{if(y.duration===1/0)return;let E=(y.duration||0)+y.pauseDuration-(c-y.createdAt);if(E<0){y.visible&&f.dismiss(y.id);return}return setTimeout(()=>f.dismiss(y.id,t),E)});return()=>{m.forEach(y=>y&&clearTimeout(y))}},[a,i,t]);let r=d.useCallback(j(t),[t]),n=d.useCallback(()=>{r({type:5,time:Date.now()})},[r]),l=d.useCallback((c,m)=>{r({type:1,toast:{id:c,height:m}})},[r]),p=d.useCallback(()=>{i&&r({type:6,time:Date.now()})},[i,r]),u=d.useCallback((c,m)=>{let{reverseOrder:y=!1,gutter:E=8,defaultPosition:T}=m||{},z=a.filter(g=>(g.position||T)===(c.position||T)&&g.height),B=z.findIndex(g=>g.id===c.id),H=z.filter((g,I)=>I<B&&g.visible).length;return z.filter(g=>g.visible).slice(...y?[H+1]:[0,H]).reduce((g,I)=>g+(I.height||0)+E,0)},[a]);return d.useEffect(()=>{a.forEach(c=>{if(c.dismissed)s(c.id,c.removeDelay);else{let m=o.get(c.id);m&&(clearTimeout(m),o.delete(c.id))}})},[a,s]),{toasts:a,handlers:{updateHeight:l,startPause:n,endPause:p,calculateOffset:u}}},le=v`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`,de=v`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`,ce=v`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`,pe=w("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${le} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${de} 0.15s ease-out forwards;
    animation-delay: 150ms;
    position: absolute;
    border-radius: 3px;
    opacity: 0;
    background: ${e=>e.secondary||"#fff"};
    bottom: 9px;
    left: 4px;
    height: 2px;
    width: 12px;
  }

  &:before {
    animation: ${ce} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`,ue=v`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`,me=w("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${e=>e.secondary||"#e0e0e0"};
  border-right-color: ${e=>e.primary||"#616161"};
  animation: ${ue} 1s linear infinite;
`,fe=v`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`,ye=v`
0% {
	height: 0;
	width: 0;
	opacity: 0;
}
40% {
  height: 0;
	width: 6px;
	opacity: 1;
}
100% {
  opacity: 1;
  height: 10px;
}`,ge=w("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#61d345"};
  position: relative;
  transform: rotate(45deg);

  animation: ${fe} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;
  &:after {
    content: '';
    box-sizing: border-box;
    animation: ${ye} 0.2s ease-out forwards;
    opacity: 0;
    animation-delay: 200ms;
    position: absolute;
    border-right: 2px solid;
    border-bottom: 2px solid;
    border-color: ${e=>e.secondary||"#fff"};
    bottom: 6px;
    left: 6px;
    height: 10px;
    width: 6px;
  }
`,he=w("div")`
  position: absolute;
`,be=w("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`,ve=v`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`,xe=w("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${ve} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`,we=({toast:e})=>{let{icon:t,type:a,iconTheme:i}=e;return t!==void 0?typeof t=="string"?d.createElement(xe,null,t):t:a==="blank"?null:d.createElement(be,null,d.createElement(me,{...i}),a!=="loading"&&d.createElement(he,null,a==="error"?d.createElement(pe,{...i}):d.createElement(ge,{...i})))},ke=e=>`
0% {transform: translate3d(0,${e*-200}%,0) scale(.6); opacity:.5;}
100% {transform: translate3d(0,0,0) scale(1); opacity:1;}
`,Ee=e=>`
0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}
100% {transform: translate3d(0,${e*-150}%,-1px) scale(.6); opacity:0;}
`,$e="0%{opacity:0;} 100%{opacity:1;}",Ce="0%{opacity:1;} 100%{opacity:0;}",De=w("div")`
  display: flex;
  align-items: center;
  background: #fff;
  color: #363636;
  line-height: 1.3;
  will-change: transform;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1), 0 3px 3px rgba(0, 0, 0, 0.05);
  max-width: 350px;
  pointer-events: auto;
  padding: 8px 10px;
  border-radius: 8px;
`,Oe=w("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`,je=(e,t)=>{let a=e.includes("top")?1:-1,[i,o]=S()?[$e,Ce]:[ke(a),Ee(a)];return{animation:t?`${v(i)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards`:`${v(o)} 0.4s forwards cubic-bezier(.06,.71,.55,1)`}},ze=d.memo(({toast:e,position:t,style:a,children:i})=>{let o=e.height?je(e.position||t||"top-center",e.visible):{opacity:0},s=d.createElement(we,{toast:e}),r=d.createElement(Oe,{...e.ariaProps},D(e.message,e));return d.createElement(De,{className:e.className,style:{...o,...a,...e.style}},typeof i=="function"?i({icon:s,message:r}):d.createElement(d.Fragment,null,s,r))});J(d.createElement);var Ie=({id:e,className:t,style:a,onHeightUpdate:i,children:o})=>{let s=d.useCallback(r=>{if(r){let n=()=>{let l=r.getBoundingClientRect().height;i(e,l)};n(),new MutationObserver(n).observe(r,{subtree:!0,childList:!0,characterData:!0})}},[e,i]);return d.createElement("div",{ref:s,className:t,style:a},o)},Me=(e,t)=>{let a=e.includes("top"),i=a?{top:0}:{bottom:0},o=e.includes("center")?{justifyContent:"center"}:e.includes("right")?{justifyContent:"flex-end"}:{};return{left:0,right:0,display:"flex",position:"absolute",transition:S()?void 0:"all 230ms cubic-bezier(.21,1.02,.73,1)",transform:`translateY(${t*(a?1:-1)}px)`,...i,...o}},Ne=O`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`,$=16,Pe=({reverseOrder:e,position:t="top-center",toastOptions:a,gutter:i,children:o,toasterId:s,containerStyle:r,containerClassName:n})=>{let{toasts:l,handlers:p}=ne(a,s);return d.createElement("div",{"data-rht-toaster":s||"",style:{position:"fixed",zIndex:9999,top:$,left:$,right:$,bottom:$,pointerEvents:"none",...r},className:n,onMouseEnter:p.startPause,onMouseLeave:p.endPause},l.map(u=>{let c=u.position||t,m=p.calculateOffset(u,{reverseOrder:e,gutter:i,defaultPosition:t}),y=Me(c,m);return d.createElement(Ie,{id:u.id,key:u.id,onHeightUpdate:p.updateHeight,className:u.visible?Ne:"",style:y},u.type==="custom"?D(u.message,u):o?o(u):d.createElement(ze,{toast:u,position:c}))}))},Le=f;export{He as F,Fe as U,Pe as a,Le as z};
