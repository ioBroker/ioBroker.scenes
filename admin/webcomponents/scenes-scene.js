import{createRoot as e,useState as t,jsx as n,jsxs as r}from"../../../lib/esm/react-19.js";var i=`iob-dialog-close`;function a(e){return!!e.form}var o=[`header`,`staticText`,`divider`];function s(e,t){return e==null?``:typeof e==`object`?e[t]||e.en||Object.values(e).find(e=>!!e)||``:String(e)}function c(e){let t={};for(let[n,r]of Object.entries(e.items||{}))r&&!o.includes(r.type)&&(t[n]=r.type);return t}function l(e){return typeof e==`string`?e:typeof e==`number`||typeof e==`boolean`?e.toString():JSON.stringify(e)}function u(e,t){if(t!=null)switch(e){case`number`:case`slider`:{if(typeof t==`number`)return Number.isFinite(t)?t:void 0;let e=l(t).trim().replace(`,`,`.`);if(!e)return;let n=Number(e);return Number.isFinite(n)?n:void 0}case`checkbox`:return t===!0||t===`true`||t===1||t===`1`;default:return l(t)}}function d(e,t){let n={};for(let[r,i]of Object.entries(e)){let e=u(i,t[r]);e!==void 0&&(n[r]=e)}return n}var f=`"Roboto", "Helvetica", "Arial", sans-serif`,p=Object.freeze({type:`light`,primary:`#3399CC`,primaryContrast:`#FFFFFF`,secondary:`#164477`,secondaryContrast:`#FFFFFF`,background:`#FFFFFF`,paper:`#FFFFFF`,text:`rgba(0, 0, 0, 0.87)`,textSecondary:`rgba(0, 0, 0, 0.6)`,divider:`rgba(0, 0, 0, 0.12)`,error:`#D32F2F`,warning:`#ED6C02`,info:`#0288D1`,success:`#2E7D32`,fontFamily:f,fontSize:14,borderRadius:4}),m=Object.freeze({type:`dark`,primary:`#4DABF5`,primaryContrast:`rgba(0, 0, 0, 0.87)`,secondary:`#436A93`,secondaryContrast:`#FFFFFF`,background:`#121212`,paper:`#121212`,text:`#FFFFFF`,textSecondary:`rgba(255, 255, 255, 0.7)`,divider:`rgba(255, 255, 255, 0.12)`,error:`#F44336`,warning:`#FFA726`,info:`#29B6F6`,success:`#66BB6A`,fontFamily:f,fontSize:14,borderRadius:4}),h=[`primary`,`primaryContrast`,`secondary`,`secondaryContrast`,`background`,`paper`,`text`,`textSecondary`,`divider`,`error`,`warning`,`info`,`success`,`fontFamily`],g=[`fontSize`,`borderRadius`];function _(e){return{...e===`dark`?m:p}}function v(e){if(!e||typeof e!=`object`)return _(typeof e==`string`?e:`light`);let t=e,n=_(typeof t.type==`string`?t.type:`light`);for(let e of h){let r=t[e];typeof r==`string`&&r.trim()&&(n[e]=r.trim())}for(let e of g){let r=t[e],i=typeof r==`string`?parseFloat(r):r;typeof i==`number`&&Number.isFinite(i)&&i>=0&&(n[e]=i)}return n}function y(e,t){return e.type===t.type&&h.every(n=>e[n]===t[n])&&g.every(n=>e[n]===t[n])}function b(e){return`--iob-${e.replace(/[A-Z]/g,e=>`-${e.toLowerCase()}`)}`}function x(e){let t={};for(let n of h)t[b(n)]=e[n];for(let n of g)t[b(n)]=`${e[n]}px`;return t[`color-scheme`]=e.type,t}var S={ok:{en:`OK`,"zh-cn":`确定`},cancel:{en:`Cancel`,de:`Abbrechen`,ru:`Отмена`,pt:`Cancelar`,nl:`Annuleren`,fr:`Annuler`,it:`Annulla`,es:`Cancelar`,pl:`Anuluj`,uk:`Скасувати`,"zh-cn":`取消`},close:{en:`Close`,de:`Schließen`,ru:`Закрыть`,pt:`Fechar`,nl:`Sluiten`,fr:`Fermer`,it:`Chiudi`,es:`Cerrar`,pl:`Zamknij`,uk:`Закрити`,"zh-cn":`关闭`}},C=`
dialog {
    box-sizing: border-box;
    width: 480px;
    max-width: calc(100vw - 32px);
    max-height: calc(100vh - 32px);
    padding: 0;
    border: 0;
    border-radius: calc(var(--iob-border-radius) * 2);
    background: var(--iob-paper);
    color: var(--iob-text);
    font-family: var(--iob-font-family);
    font-size: var(--iob-font-size);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}
/* as the dialogs of MUI: a dark paper gets lighter the higher it lies */
dialog.dark { background-image: linear-gradient(rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.16)); }
dialog::backdrop { background: rgba(0, 0, 0, 0.5); }
dialog:focus { outline: none; }
form { display: flex; flex-direction: column; height: 100%; max-height: inherit; margin: 0; }
header { display: flex; align-items: center; gap: 8px; padding: 12px 8px 12px 16px; font-size: 1.15em; font-weight: 500; }
header span { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.body { flex: 1; min-height: 0; padding: 0 16px 16px; overflow: auto; display: flex; flex-direction: column; gap: 12px; }
footer { display: flex; justify-content: flex-end; gap: 8px; padding: 0 16px 16px; }
button { font: inherit; padding: 6px 16px; border-radius: var(--iob-border-radius); border: 1px solid var(--iob-primary); background: transparent; color: var(--iob-primary); cursor: pointer; }
button.primary { background: var(--iob-primary); color: var(--iob-primary-contrast); }
button.close { border: 0; padding: 2px 8px; font-size: 1.4em; line-height: 1; color: var(--iob-text-secondary); }
label { display: flex; flex-direction: column; gap: 4px; }
label.check { flex-direction: row; align-items: center; gap: 8px; }
input, select, textarea { font: inherit; accent-color: var(--iob-primary); }
.help { color: var(--iob-text-secondary); font-size: 0.85em; }
h3 { margin: 4px 0 0; font-size: 1em; }
p { margin: 0; }
hr { width: 100%; border: 0; border-top: 1px solid var(--iob-divider); margin: 0; }
[hidden] { display: none !important; }
`;function w(e){if(!e)return null;try{let t=Function(`data`,`return (${e});`);return e=>{try{return!!t(e)}catch{return!1}}}catch{return null}}function T(e){return typeof e==`string`?e:typeof e==`number`||typeof e==`boolean`?String(e):``}function E(e){let{input:t,setting:n}=e;if(t)return t instanceof HTMLInputElement&&t.type===`checkbox`?t.checked:t instanceof HTMLSelectElement?n.options?.[t.selectedIndex]?.value:t.value}function D(e,t,n,r,i){let a={name:t,setting:n,box:e.createElement(`div`),hidden:w(n.hidden),disabled:w(n.disabled)},o=s(n.label,i);switch(n.type){case`header`:return a.box=e.createElement(`h3`),a.box.textContent=s(n.text,i)||o,a;case`staticText`:return a.box=e.createElement(`p`),a.box.textContent=s(n.text,i)||o,a;case`divider`:return a.box=e.createElement(`hr`),a}let c=e.createElement(`label`);a.box=c;let l=e.createElement(`span`);if(l.textContent=o||t,n.type===`checkbox`){let t=e.createElement(`input`);t.type=`checkbox`,t.checked=r===!0||r===`true`,c.className=`check`,c.append(t,l),a.input=t}else if(n.type===`select`){let t=e.createElement(`select`);for(let r of n.options||[]){let n=e.createElement(`option`);n.textContent=s(r.label,i),t.append(n)}let o=(n.options||[]).findIndex(e=>String(e.value)===T(r));t.selectedIndex=o===-1?0:o,c.append(l,t),a.input=t}else if(n.type===`text`&&(n.minRows||1)>1){let t=e.createElement(`textarea`);t.rows=n.minRows||2,t.value=T(r),c.append(l,t),a.input=t}else{let t=e.createElement(`input`),i=T(r);switch(n.type){case`number`:case`slider`:t.type=n.type===`slider`?`range`:`number`,n.min!==void 0&&(t.min=String(n.min)),n.max!==void 0&&(t.max=String(n.max)),t.step=n.step===void 0?`any`:String(n.step);break;case`password`:t.type=`password`;break;case`color`:t.type=!i||/^#[0-9a-f]{6}$/i.test(i)?`color`:`text`;break;default:t.type=`text`}if(t.value=i,t.type===`range`){let n=e.createElement(`output`);n.textContent=t.value,t.addEventListener(`input`,()=>n.textContent=t.value),l.append(`: `,n)}c.append(l,t),a.input=t}if(n.help){let t=e.createElement(`span`);t.className=`help`,t.textContent=s(n.help,i),c.append(t)}return a}function O(e,t={}){let n=t.lang||`en`,r=document,o=e=>S[e][n]||S[e].en||e,l=r.createElement(`div`);l.setAttribute(`data-iob-dialog`,``);let u=l.attachShadow({mode:`open`}),f=r.createElement(`style`);f.textContent=C;let p=r.createElement(`dialog`),m=v(t.theme);p.className=m.type===`dark`?`dark`:``;for(let[e,t]of Object.entries(x(m)))p.style.setProperty(e,t);e.width&&(p.style.width=`${e.width}px`),e.height&&(p.style.height=`${e.height}px`);let h=r.createElement(`form`),g=r.createElement(`header`),_=r.createElement(`span`);_.textContent=s(e.title,n);let y=r.createElement(`button`);y.type=`button`,y.className=`close`,y.title=o(`close`),y.setAttribute(`aria-label`,o(`close`)),y.textContent=`×`,g.append(_,y);let b=r.createElement(`div`);return b.className=`body`,h.append(g,b),p.append(h),u.append(f,p),new Promise(t=>{let f=!1,m=e=>{f||(f=!0,p.open&&p.close(),l.remove(),t(e))};if(y.addEventListener(`click`,()=>m(null)),p.addEventListener(`close`,()=>m(null)),h.addEventListener(`submit`,e=>e.preventDefault()),a(e)){let t={},i=[];for(let[t,a]of Object.entries(e.form.items||{})){let o=e.data?.[t]??a.default,s=D(r,t,a,o,n);i.push(s),b.append(s.box)}let a=()=>{for(let e of i)e.input&&(t[e.name]=E(e));return t},l=()=>{let e=a();for(let t of i)t.box.hidden=t.hidden?t.hidden(e):!1,t.input&&(t.input.disabled=t.disabled?t.disabled(e):!1)};h.addEventListener(`input`,l),h.addEventListener(`change`,l),l();let u=i.find(e=>e.input&&!e.box.hidden&&!e.input.disabled);u?.input&&(u.input.autofocus=!0);let f=r.createElement(`footer`),p=r.createElement(`button`);p.type=`button`,p.textContent=s(e.cancel,n)||o(`cancel`),p.addEventListener(`click`,()=>m(null));let g=r.createElement(`button`);g.type=`submit`,g.className=`primary`,g.textContent=s(e.ok,n)||o(`ok`),f.append(p,g),h.append(f),h.addEventListener(`submit`,()=>m(d(c(e.form),a())))}else b.append(e.element),p.addEventListener(i,e=>m(e.detail??null));r.body.append(l),p.showModal(),u.activeElement&&u.activeElement!==y||(p.tabIndex=-1,p.focus())})}function k(e){return[...new Set(e.filter(e=>typeof e==`string`&&!!e))]}var A=[`socket`,`dialogs`,`theme`,`editMode`,`settings`,`value`],j=class extends HTMLElement{states={};objects={};#e=null;#t={};#n=v(`light`);#r=!1;#i=null;#a=void 0;#o=null;#s=!1;#c=(e,t)=>{this.#o?.states.includes(e)&&(this.states[e]=t||null,this.#_())};#l=(e,t)=>{this.#o?.objects.includes(e)&&(this.objects[e]=t||null,this.#d())};get socket(){return this.#e}set socket(e){this.#e=e||null,this.#d()}get settings(){return this.#t}set settings(e){this.#t=e||{},this.#d()}get theme(){return this.#n}set theme(e){let t=v(e);y(t,this.#n)||(this.#n=t,this.#u(),this.#_())}get editMode(){return this.#r}set editMode(e){let t=!!e;t!==this.#r&&(this.#r=t,this.#_())}get dialogs(){return this.#i}set dialogs(e){this.#i=e||null}get value(){return this.#a}set value(e){e!==this.#a&&(this.#a=e,this.#_())}connectedCallback(){for(let e of A)if(Object.prototype.hasOwnProperty.call(this,e)){let t=this[e];delete this[e],this[e]=t}this.#u(),this.#d()}disconnectedCallback(){this.#g()}getStateIds(e){return[]}getObjectIds(e){return[]}get systemLang(){return this.#e?.systemLang||`en`}text(e){return s(e,this.systemLang)}setState(e,t){return this.#e&&!this.#r?this.#e.setState(e,t):Promise.resolve()}changeValue(e){return this.#r||this.emit(`iob-change`,e)?!1:(this.value=e,!0)}emit(e,t){return this.dispatchEvent(new CustomEvent(e,{detail:t,bubbles:!0,composed:!0,cancelable:!0}))}async openDialog(e){if(this.#r)return null;let t=this.#i?await this.#i.open(e):await O(e,{lang:this.systemLang,theme:this.#n});return a(e)?t&&typeof t==`object`?d(c(e.form),t):null:t??null}#u(){for(let[e,t]of Object.entries(x(this.#n)))this.style.setProperty(e,t)}#d(){if(!this.isConnected)return;let e=this.#e,t=e?k(this.getStateIds(this.#t)):[],n=e?k(this.getObjectIds(this.#t)):[];this.#o&&this.#o.socket!==e&&this.#g();let r=this.#o?.states||[],i=this.#o?.objects||[],a=r.filter(e=>!t.includes(e)),o=i.filter(e=>!n.includes(e)),s=t.filter(e=>!r.includes(e)),c=n.filter(e=>!i.includes(e));e&&a.length&&e.unsubscribeState(a,this.#c),e&&o.length&&this.#h(e,o);for(let e of a)delete this.states[e];for(let e of[...a,...o])!t.includes(e)&&!n.includes(e)&&delete this.objects[e];this.#o=e&&(t.length||n.length)?{socket:e,states:t,objects:n}:null,e&&s.length&&this.#p(e,s),e&&c.length&&this.#m(e,c),this.#_()}#f(e,t,n){return this.#o?.socket===e&&this.#o[t].includes(n)}#p(e,t){e.subscribeState(t,this.#c).catch(e=>console.warn(`<${this.localName}>: cannot subscribe ${t.join(`, `)}: ${e}`));for(let n of t)e.getState(n).then(t=>{this.#f(e,`states`,n)&&this.states[n]===void 0&&(this.states[n]=t||null,this.#_())}).catch(()=>{}),e.getObject(n).then(t=>{this.#f(e,`states`,n)&&!this.#f(e,`objects`,n)&&(this.objects[n]=t||null,this.#_())}).catch(()=>{})}#m(e,t){e.subscribeObject(t,this.#l).catch(e=>console.warn(`<${this.localName}>: cannot subscribe the objects ${t.join(`, `)}: ${e}`));for(let n of t)e.getObject(n).then(t=>{this.#f(e,`objects`,n)&&(this.objects[n]=t||null,this.#d())}).catch(()=>{})}#h(e,t){e.unsubscribeObject(t,this.#l).catch(()=>{})}#g(){if(this.#o){let{socket:e,states:t,objects:n}=this.#o;t.length&&e.unsubscribeState(t,this.#c),n.length&&this.#h(e,n),this.#o=null}this.states={},this.objects={}}#_(){this.#s||(this.#s=!0,queueMicrotask(()=>{this.#s=!1,this.isConnected&&this.render()}))}};function M(e,t){let n=typeof e==`string`?e:e.tag;customElements.get(n)||customElements.define(n,t)}var N=`iob-scenes-scene`;function P(e){return!!e&&/^scene\.\d+\.[^.]/.test(e)}function F(e){return e==null?null:e===`uncertain`?`uncertain`:e===!0||e===`true`}function I(e,t){return!(t&&e===!0)}function L(e){return e==null||typeof e==`boolean`||e===`uncertain`||e===`true`||e===`false`?``:String(typeof e==`number`?Math.round(e*100)/100:e)}var R={chooseScene:`Choose a scene in the settings`,notScene:`Not a scene of the scenes adapter`,scene:`Scene`,uncertain:`uncertain`,disabled:`Disabled`,activate:`Activate`,deactivate:`Deactivate`,confirmActivate:`Are you sure you want to activate this scene?`,confirmDeactivate:`Are you sure you want to deactivate this scene?`,pin:`PIN`,wrongPin:`Wrong PIN`},z={en:R,de:{chooseScene:`Szene in den Einstellungen wählen`,notScene:`Keine Szene des Szenen-Adapters`,scene:`Szene`,uncertain:`unbestimmt`,disabled:`Deaktiviert`,activate:`Aktivieren`,deactivate:`Deaktivieren`,confirmActivate:`Möchten Sie diese Szene wirklich aktivieren?`,confirmDeactivate:`Möchten Sie diese Szene wirklich deaktivieren?`,pin:`PIN`,wrongPin:`Falscher PIN`},ru:{chooseScene:`Выберите сцену в настройках`,notScene:`Это не сцена адаптера scenes`,scene:`Сцена`,uncertain:`неопределенный`,disabled:`Отключена`,activate:`Активировать`,deactivate:`Деактивировать`,confirmActivate:`Вы действительно хотите активировать эту сцену?`,confirmDeactivate:`Вы действительно хотите деактивировать эту сцену?`,pin:`PIN-код`,wrongPin:`Неверный PIN-код`},pt:{chooseScene:`Escolha uma cena nas configurações`,notScene:`Não é uma cena do adaptador scenes`,scene:`Cena`,uncertain:`incerto`,disabled:`Desativada`,activate:`Ativar`,deactivate:`Desativar`,confirmActivate:`Tem certeza de que deseja ativar esta cena?`,confirmDeactivate:`Tem certeza de que deseja desativar esta cena?`,pin:`PIN`,wrongPin:`PIN incorreto`},nl:{chooseScene:`Kies een scène in de instellingen`,notScene:`Geen scène van de scenes-adapter`,scene:`Scène`,uncertain:`onzeker`,disabled:`Uitgeschakeld`,activate:`Activeren`,deactivate:`Deactiveren`,confirmActivate:`Weet u zeker dat u deze scène wilt activeren?`,confirmDeactivate:`Weet u zeker dat u deze scène wilt deactiveren?`,pin:`Pincode`,wrongPin:`Onjuiste pincode`},fr:{chooseScene:`Choisissez une scène dans les paramètres`,notScene:`Pas une scène de l'adaptateur scenes`,scene:`Scène`,uncertain:`incertain`,disabled:`Désactivée`,activate:`Activer`,deactivate:`Désactiver`,confirmActivate:`Voulez-vous vraiment activer cette scène ?`,confirmDeactivate:`Voulez-vous vraiment désactiver cette scène ?`,pin:`Code PIN`,wrongPin:`Code PIN incorrect`},it:{chooseScene:`Scegli una scena nelle impostazioni`,notScene:`Non è una scena dell'adattatore scenes`,scene:`Scena`,uncertain:`incerto`,disabled:`Disattivata`,activate:`Attiva`,deactivate:`Disattiva`,confirmActivate:`Vuoi davvero attivare questa scena?`,confirmDeactivate:`Vuoi davvero disattivare questa scena?`,pin:`PIN`,wrongPin:`PIN errato`},es:{chooseScene:`Elija una escena en la configuración`,notScene:`No es una escena del adaptador scenes`,scene:`Escena`,uncertain:`incierto`,disabled:`Desactivada`,activate:`Activar`,deactivate:`Desactivar`,confirmActivate:`¿Seguro que desea activar esta escena?`,confirmDeactivate:`¿Seguro que desea desactivar esta escena?`,pin:`PIN`,wrongPin:`PIN incorrecto`},pl:{chooseScene:`Wybierz scenę w ustawieniach`,notScene:`To nie jest scena adaptera scenes`,scene:`Scena`,uncertain:`niepewny`,disabled:`Wyłączona`,activate:`Aktywuj`,deactivate:`Dezaktywuj`,confirmActivate:`Czy na pewno chcesz aktywować tę scenę?`,confirmDeactivate:`Czy na pewno chcesz dezaktywować tę scenę?`,pin:`PIN`,wrongPin:`Nieprawidłowy PIN`},uk:{chooseScene:`Виберіть сцену в налаштуваннях`,notScene:`Це не сцена адаптера scenes`,scene:`Сцена`,uncertain:`невизначений`,disabled:`Вимкнена`,activate:`Активувати`,deactivate:`Деактивувати`,confirmActivate:`Ви дійсно хочете активувати цю сцену?`,confirmDeactivate:`Ви дійсно хочете деактивувати цю сцену?`,pin:`PIN-код`,wrongPin:`Неправильний PIN-код`},"zh-cn":{chooseScene:`请在设置中选择场景`,notScene:`不是 scenes 适配器的场景`,scene:`场景`,uncertain:`不确定`,disabled:`已禁用`,activate:`激活`,deactivate:`停用`,confirmActivate:`确定要激活此场景吗？`,confirmDeactivate:`确定要停用此场景吗？`,pin:`PIN 码`,wrongPin:`PIN 码错误`}};function B(e,t){return z[e]?.[t]||R[t]}function V(e,t,n){let r=Math.max(0,Math.round((n-t)/1e3)),i;try{i=new Intl.RelativeTimeFormat(e,{numeric:`auto`})}catch{i=new Intl.RelativeTimeFormat(`en`,{numeric:`auto`})}if(r<60)return i.format(0,`second`);let a=Math.floor(r/60);if(a<60)return i.format(-a,`minute`);let o=Math.floor(a/60);return o<24?i.format(-o,`hour`):i.format(-Math.floor(o/24),`day`)}var H=`M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z`,U=`M8 5v14l11-7z`;function W({path:e}){return/* @__PURE__ */ n(`svg`,{viewBox:`0 0 24 24`,"aria-hidden":`true`,children:/* @__PURE__ */ n(`path`,{d:e})})}function G({src:e,active:r}){let[i,a]=t(``);return e&&i!==e?/* @__PURE__ */ n(`img`,{src:e,alt:``,draggable:!1,onError:()=>a(e)}):/* @__PURE__ */ n(W,{path:r?U:H})}function K(e){let{name:t,activity:i,status:a,image:o,color:s,off:c,action:l,editMode:u,onClick:d}=e,f=!c&&!u,p=[`scene`];return i===!0?p.push(`active`):i===`uncertain`&&p.push(`uncertain`),f&&p.push(`clickable`),c&&p.push(`off`),u&&p.push(`edit`),/* @__PURE__ */ r(`div`,{className:p.join(` `),style:s?{"--color":s}:void 0,role:f?`button`:void 0,tabIndex:f?0:void 0,title:f?`${t}: ${l}`:void 0,"aria-label":f?`${t}: ${l}`:void 0,onClick:f?d:void 0,onKeyDown:f?e=>{(e.key===`Enter`||e.key===` `)&&(e.preventDefault(),d())}:void 0,children:[/* @__PURE__ */ n(`div`,{className:`symbol`,children:/* @__PURE__ */ n(G,{src:o,active:i===!0||i===`uncertain`})}),/* @__PURE__ */ r(`div`,{className:`text`,children:[/* @__PURE__ */ n(`div`,{className:`name`,children:t}),/* @__PURE__ */ n(`div`,{className:`status`,children:a})]})]})}function q({text:e,editMode:t}){return/* @__PURE__ */ r(`div`,{className:`hint${t?` edit`:``}`,children:[/* @__PURE__ */ n(W,{path:H}),/* @__PURE__ */ n(`span`,{children:e})]})}var J=`
:host {
    display: block;
    width: 100%;
    height: 100%;
}
.mount {
    width: 100%;
    height: 100%;
    /* the size of the box does not depend on what is in it */
    container-type: size;
}
.edit {
    pointer-events: none;
}
.scene {
    /* the color of an active scene: the setting, or the success color of the theme */
    --accent: var(--color, var(--iob-success));
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    padding: clamp(6px, 8cqmin, 16px);
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: clamp(2px, 4cqmin, 10px);
    overflow: hidden;
    border-radius: calc(var(--iob-border-radius) * 2);
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    outline: none;
    transition: background-color 0.2s;
}
.scene.uncertain {
    --accent: var(--iob-warning);
}
.scene.clickable {
    cursor: pointer;
}
.scene.clickable:hover {
    background: color-mix(in srgb, currentColor 6%, transparent);
}
.scene.active {
    background: color-mix(in srgb, var(--accent) 14%, transparent);
}
.scene.active.clickable:hover {
    background: color-mix(in srgb, var(--accent) 20%, transparent);
}
.scene.uncertain {
    background: color-mix(in srgb, var(--accent) 10%, transparent);
}
.scene:focus-visible {
    box-shadow: inset 0 0 0 2px var(--iob-primary);
}
.scene.off {
    opacity: 0.5;
}
.symbol {
    flex: 1;
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
}
.symbol svg,
.symbol img {
    width: clamp(20px, 36cqmin, 96px);
    height: clamp(20px, 36cqmin, 96px);
    display: block;
    flex: none;
}
.symbol svg {
    fill: var(--iob-text-secondary);
    opacity: 0.6;
}
.active .symbol svg,
.uncertain .symbol svg {
    fill: var(--accent);
    opacity: 1;
}
.uncertain .symbol svg {
    opacity: 0.8;
}
.symbol img {
    object-fit: contain;
    filter: grayscale(100%) opacity(0.5);
}
.active .symbol img {
    filter: none;
}
.uncertain .symbol img {
    filter: opacity(0.6);
}
.text {
    min-width: 0;
    flex: none;
}
.name,
.status {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.name {
    font-weight: 600;
    font-size: clamp(11px, 10cqmin, 20px);
    line-height: 1.3;
}
.status {
    color: var(--iob-text-secondary);
    font-size: clamp(9px, 7.5cqmin, 15px);
    line-height: 1.3;
    /* keeps its line while empty, so the name does not jump */
    min-height: 1.3em;
}
.uncertain .status {
    color: var(--iob-warning);
}
/* a wide box: the symbol beside the name */
@container (min-aspect-ratio: 9 / 5) {
    .scene {
        flex-direction: row;
        align-items: center;
        gap: clamp(6px, 10cqh, 16px);
        padding: clamp(4px, 10cqh, 16px) clamp(8px, 14cqh, 20px);
    }
    .symbol {
        flex: none;
    }
    .symbol svg,
    .symbol img {
        width: clamp(18px, 55cqh, 64px);
        height: clamp(18px, 55cqh, 64px);
    }
    .text {
        flex: 1;
    }
    .name {
        font-size: clamp(11px, 24cqh, 22px);
    }
    .status {
        font-size: clamp(9px, 17cqh, 15px);
    }
}
.hint {
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    padding: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: clamp(2px, 3cqmin, 8px);
    overflow: hidden;
    text-align: center;
    color: var(--iob-text-secondary);
    font-size: clamp(10px, 7cqmin, 15px);
}
.hint svg {
    width: clamp(16px, 14cqmin, 32px);
    height: clamp(16px, 14cqmin, 32px);
    fill: currentColor;
    flex: none;
}
`,Y=3e4;M(N,class extends j{#e;#t=null;#n=!1;constructor(){super();let t=this.attachShadow({mode:`open`}),n=document.createElement(`style`);n.textContent=J;let r=document.createElement(`div`);r.className=`mount`,t.append(n,r),this.#e=e(r)}connectedCallback(){super.connectedCallback(),this.#t||=setInterval(()=>{let e=this.settings.scene;P(e)&&F(this.states[e]?.val)===!0&&this.render()},Y)}disconnectedCallback(){super.disconnectedCallback(),this.#t&&=(clearInterval(this.#t),null)}getStateIds(e){return P(e.scene)?[e.scene]:[]}getObjectIds(e){return P(e.scene)?[e.scene]:[]}#r(e){let t=this.objects[e];return t==null||t.type===`state`?t:null}#i(e,t){return this.settings.name?.trim()||this.text(t?.common?.name)||e.split(`.`).pop()||B(this.systemLang,`scene`)}async#a(e,t,n){if(!(this.editMode||this.#n)){this.#n=!0;try{await this.#o(t,n)&&await this.setState(e,t)}catch{}finally{this.#n=!1}}}async#o(e,t){let{confirm:n,confirmText:r}=this.settings;if(n!==`dialog`&&n!==`pin`)return!0;let i=this.systemLang,a=e=>B(i,e),o=r?.trim()||a(e?`confirmActivate`:`confirmDeactivate`),s=a(e?`activate`:`deactivate`),c=this.settings.pin??``;if(n===`dialog`||!c)return await this.openDialog({title:t,form:{type:`panel`,items:{question:{type:`staticText`,text:o}}},ok:s})!==null;let l=!1;for(;;){let e={question:{type:`staticText`,text:o}};l&&(e.wrong={type:`staticText`,text:a(`wrongPin`)}),e.pin={type:`password`,label:a(`pin`)};let n=await this.openDialog({title:t,form:{type:`panel`,items:e},ok:s});if(!n)return!1;if(String(n.pin??``)===c)return!0;l=!0}}render(){let e=this.settings,t=this.systemLang,r=e=>B(t,e),i=e.scene?.trim();if(!i){this.#e.render(/* @__PURE__ */ n(q,{text:r(`chooseScene`),editMode:this.editMode}));return}let a=P(i)?this.#r(i):null;if(a===null){this.#e.render(/* @__PURE__ */ n(q,{text:r(`notScene`),editMode:this.editMode}));return}let o=this.states[i],s=F(o?.val),c=a?.common?.enabled===!1,l=a?.native,u=I(s,!!l?.onFalse?.enabled&&!l?.virtualGroup),d=this.#i(i,a),f=``,p=L(o?.val);if(c)f=r(`disabled`);else if(s===`uncertain`)f=r(`uncertain`);else if(p){let e=a?.common?.unit;f=e?`${p} ${e}`:p}else s===!0&&o?.lc&&(f=V(t,o.lc,Date.now()));let m=e.icon?.trim()||``,h=e.iconActive?.trim()||m;this.#e.render(/* @__PURE__ */ n(K,{name:d,activity:s,status:f,image:s===!0||s===`uncertain`?h:m,color:e.color?.trim()||``,off:c,action:r(u?`activate`:`deactivate`),editMode:this.editMode,onClick:()=>void this.#a(i,u,d)}))}});