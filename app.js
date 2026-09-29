/* FrutiGang - frontend + Supabase integration
   GitHub Pages: replace SUPABASE_URL and SUPABASE_ANON_KEY.
   Without Supabase configured, the app runs in local demo mode using localStorage.
*/
const SUPABASE_URL = "";
const SUPABASE_ANON_KEY = "";
const ADMIN_PASSWORD = "221208";

const hasSupabase = SUPABASE_URL && SUPABASE_ANON_KEY && window.supabase;
const sb = hasSupabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const state = {
  sides: new Set(),
  toppings: new Set(),
  cart: JSON.parse(localStorage.getItem("frutigang_cart") || "[]"),
  user: JSON.parse(localStorage.getItem("frutigang_user") || "null"),
  pendingOrder: null
};

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const money = n => `$${Number(n).toFixed(2)}`;
const sideNames = {vanilla:"Helado de vainilla", whip:"Crema chantilly"};
const toppingNames = {chocolate:"Jarabe de chocolate",honey:"Miel",caramel:"Caramelo",jelly:"Jalea de fresas",sprinkles:"Chispas",cherry:"Cereza"};
const sidePrices = {vanilla:0.50, whip:0.25};

function show(id){$(id)?.classList.remove("hidden")}
function hide(id){$(id)?.classList.add("hidden")}
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2800)}
function price(){return 0.75 + [...state.sides].reduce((sum,id)=>sum+(sidePrices[id]||0),0) + state.toppings.size*.1}
function description(){return ["Cóctel base",...([...state.sides].map(x=>sideNames[x])),...([...state.toppings].map(x=>toppingNames[x]))].join(" + ")}
function updatePrice(){ $("#price1").textContent=money(0.75 + [...state.sides].reduce((sum,id)=>sum+(sidePrices[id]||0),0)); $("#price2").textContent=money(price()) }
function updatePreview(){
  ["vanilla","whip","chocolate","honey","caramel","jelly","sprinkles","cherry"].forEach(id=>$("#preview"+id)?.classList.toggle("hidden",!(state.sides.has(id)||state.toppings.has(id))));
  $$(".option").forEach(b=>b.classList.toggle("selected",(b.dataset.type==="side"?state.sides:state.toppings).has(b.dataset.id)));
  updatePrice();
}
function resetBuilder(){state.sides.clear();state.toppings.clear();updatePreview();goStep(1)}
function goStep(n){show("#step"+n+"Panel");hide("#step"+(n===1?2:1)+"Panel");$$(".step").forEach(x=>x.classList.toggle("active",x.dataset.step==n))}
function saveCart(){localStorage.setItem("frutigang_cart",JSON.stringify(state.cart));renderCart()}
function renderCart(){
  $("#cartCount").textContent=state.cart.length;
  const box=$("#cartItems");
  if(!state.cart.length){box.innerHTML='<div class="preview-card"><h3>Tu carrito está vacío.</h3><p class="muted">Arma tu primer cóctel.</p></div>';$("#cartTotal").textContent="$0.00";return}
  box.innerHTML=state.cart.map((p,i)=>`<article class="cart-item">
    <div class="mini-cup">🍓🍍</div>
    <div><h3>FrutiGang personalizado</h3><p>${escapeHtml(p.description)}</p></div>
    <div><strong>${money(p.price)}</strong><div class="cart-actions"><button class="icon-btn" title="Duplicar" data-duplicate="${i}">⧉</button><button class="icon-btn" title="Eliminar" data-delete="${i}">🗑️</button></div></div>
  </article>`).join("");
  $("#cartTotal").textContent=money(state.cart.reduce((a,p)=>a+p.price,0));
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}

async function currentUser(){
  if(sb){const {data}=await sb.auth.getUser(); if(data.user){state.user=data.user;return data.user} }
  return state.user;
}
async function register(e){
  e.preventDefault();
  const email=$("#regEmail").value.trim(), name=$("#regName").value.trim(), section=$("#regSection").value.trim(), grade=$("#regGrade").value.trim(), phone=$("#regPhone").value.trim(), password=$("#regPassword").value;
  if(!email||!name||!section||!grade||password.length<6)return;
  $("#registerMsg").textContent="Creando cuenta…";
  if(sb){
    const {data,error}=await sb.auth.signUp({email,password,options:{data:{full_name:name,section,grade,phone}}});
    if(error){$("#registerMsg").textContent=error.message;return}
    if(data.user){
      await sb.from("profiles").upsert({id:data.user.id,email,name,section,grade,phone:phone||null});
      state.user=data.user;localStorage.setItem("frutigang_user",JSON.stringify({id:data.user.id,email,name,section,grade,phone}));
    }
  }else{
    const users=JSON.parse(localStorage.getItem("frutigang_users")||"[]");
    if(users.some(u=>u.email.toLowerCase()===email.toLowerCase())){$("#registerMsg").textContent="Ese correo ya está registrado.";return}
    const u={id:crypto.randomUUID(),email,name,section,grade,phone,password};
    users.push(u);localStorage.setItem("frutigang_users",JSON.stringify(users));state.user=u;localStorage.setItem("frutigang_user",JSON.stringify(u));
  }
  $("#accountBtn").textContent="Cuenta creada ✓ listo para ordenar";$("#accountBtn").classList.add("account-ok");
  $("#registerMsg").textContent="Cuenta creada correctamente.";
  setTimeout(()=>hide("#authModal"),700);toast("Cuenta creada ✓ listo para ordenar");
}
async function login(e){
  e.preventDefault();const email=$("#loginEmail").value.trim(),password=$("#loginPassword").value;$("#loginMsg").textContent="Ingresando…";
  if(sb){
    const {data,error}=await sb.auth.signInWithPassword({email,password});if(error){$("#loginMsg").textContent=error.message;return}
    state.user=data.user;
    const {data:p}=await sb.from("profiles").select("*").eq("id",data.user.id).maybeSingle();
    if(p){state.user={...state.user,...p}}
  }else{
    const u=JSON.parse(localStorage.getItem("frutigang_users")||"[]").find(x=>x.email.toLowerCase()===email.toLowerCase()&&x.password===password);
    if(!u){$("#loginMsg").textContent="Correo o contraseña incorrectos.";return}state.user=u;localStorage.setItem("frutigang_user",JSON.stringify(u));
  }
  localStorage.setItem("frutigang_user",JSON.stringify(state.user));$("#accountBtn").textContent="Cuenta creada ✓ listo para ordenar";hide("#authModal");toast("Sesión iniciada ✓");
}
function openAuth(mode="register"){show("#authModal");show(mode==="register"?"#registerForm":"#loginForm");hide(mode==="register"?"#loginForm":"#registerForm");$("#tabRegister").classList.toggle("active",mode==="register");$("#tabLogin").classList.toggle("active",mode!=="register")}
async function requireUser(){
  const u=await currentUser();
  if(!u){toast("Es necesario registrarse para hacer un pedido");openAuth("register");return null}
  return u;
}
async function addOrder(){
  const u=await requireUser();if(!u)return;
  const item=state.pendingOrder;if(!item)return;
  const order={customer_id:u.id||null,customer_name:u.name||u.user_metadata?.full_name||"",section:u.section||u.user_metadata?.section||"",grade:u.grade||u.user_metadata?.grade||"",email:u.email||"",phone:u.phone||u.user_metadata?.phone||null,items:[item],total:item.price,status:"Nuevo",created_at:new Date().toISOString()};
  if(sb){
    const {error}=await sb.from("orders").insert(order);if(error){toast("No se pudo guardar el pedido: "+error.message);return}
  }else{
    const orders=JSON.parse(localStorage.getItem("frutigang_orders")||"[]");orders.unshift({...order,id:crypto.randomUUID()});localStorage.setItem("frutigang_orders",JSON.stringify(orders));
  }
  state.cart=[];saveCart();state.pendingOrder=null;hide("#confirmModal");hide("#cartSection");show("#builder");resetBuilder();toast("¡Gracias por tu compra!");
  window.scrollTo({top:document.querySelector("#builder").offsetTop-80,behavior:"smooth"});
}
function addCurrentCocktailToCart(){
  const item = {
    id: crypto.randomUUID(),
    description: description(),
    price: Number(price().toFixed(2)),
    sides: [...state.sides],
    toppings: [...state.toppings],
    created_at: new Date().toISOString()
  };
  state.cart.push(item);
  saveCart();
  toast("🍓 ¡Cóctel añadido al carrito!");
  // Reset the builder so a new cocktail can be created independently.
  resetBuilder();
  // Show the cart immediately so the customer can see what was added.
  hide("#builder");
  hide("#inicio");
  hide("#adminSection");
  show("#cartSection");
  renderCart();
  window.scrollTo({top: document.querySelector("#cartSection").offsetTop - 70, behavior:"smooth"});
}

function openConfirm(){
  if(!state.cart.length){toast("Tu carrito está vacío");return}
  requireUser().then(u=>{if(!u)return;const total=state.cart.reduce((a,p)=>a+p.price,0);state.pendingOrder={description:state.cart.map((p,i)=>`${i+1}. ${p.description} (${money(p.price)}`).join(" · "),price:total,cart:[...state.cart]};$("#confirmDetails").innerHTML=`<div class="confirm-product"><b>Pedido:</b><p>${escapeHtml(state.pendingOrder.description)}</p><strong>Total: ${money(total)}</strong></div>`;show("#confirmModal")});
}
async function loadOrders(){
  if(sb){const {data,error}=await sb.from("orders").select("*").order("created_at",{ascending:false});if(error){$("#ordersTable").innerHTML=`<p>${escapeHtml(error.message)}</p>`;return}return data||[]}
  return JSON.parse(localStorage.getItem("frutigang_orders")||"[]");
}
async function renderAdmin(){
  const orders=await loadOrders();$("#adminStats").innerHTML=`<div class="stat"><span class="muted">Pedidos</span><br><b>${orders.length}</b></div><div class="stat"><span class="muted">Ventas</span><br><b>${money(orders.reduce((a,o)=>a+Number(o.total||0),0))}</b></div>`;
  if(!orders.length){$("#ordersTable").innerHTML="<div style='padding:25px'>No hay pedidos registrados.</div>";return}
  $("#ordersTable").innerHTML=`<table><thead><tr><th>Fecha</th><th>Cliente</th><th>Sección</th><th>Grado</th><th>Correo</th><th>Teléfono</th><th>Pedido completo</th><th>Total</th></tr></thead><tbody>${orders.map(o=>`<tr><td>${new Date(o.created_at).toLocaleString("es-SV")}</td><td>${escapeHtml(o.customer_name)}</td><td>${escapeHtml(o.section)}</td><td>${escapeHtml(o.grade)}</td><td>${escapeHtml(o.email)}</td><td>${escapeHtml(o.phone||"—")}</td><td>${(o.items||[]).map(x=>escapeHtml(x.description)).join("<br>")}</td><td><b>${money(o.total)}</b></td></tr>`).join("")}</tbody></table>`;
}
async function enterAdmin(){
  if($("#adminPassword").value!==ADMIN_PASSWORD){$("#adminMsg").textContent="Contraseña incorrecta.";return}
  hide("#adminLoginModal");hide("#inicio");hide("#builder");hide("#cartSection");show("#adminSection");await renderAdmin();window.scrollTo({top:0,behavior:"smooth"});
}
function scrollToBuilder(){hide("#inicio");hide("#cartSection");hide("#adminSection");show("#builder");resetBuilder();window.scrollTo({top:document.querySelector("#builder").offsetTop-70,behavior:"smooth"})}

$$("[data-close]").forEach(b=>b.addEventListener("click",()=>hide("#"+b.dataset.close)));
$("#accountBtn").addEventListener("click",()=>openAuth(state.user?"login":"register"));
$("#tabRegister").addEventListener("click",()=>openAuth("register"));$("#tabLogin").addEventListener("click",()=>openAuth("login"));
$("#registerForm").addEventListener("submit",register);$("#loginForm").addEventListener("submit",login);
$("#heroOrder").addEventListener("click",scrollToBuilder);$("#backHome").addEventListener("click",()=>{hide("#builder");show("#inicio");window.scrollTo({top:0,behavior:"smooth"})});
$("#toStep2").addEventListener("click",()=>goStep(2));$("#toStep1").addEventListener("click",()=>goStep(1));
$("#cartBtn").addEventListener("click",()=>{hide("#inicio");hide("#builder");hide("#adminSection");show("#cartSection");renderCart();window.scrollTo({top:0,behavior:"smooth"})});
$("#closeCart").addEventListener("click",scrollToBuilder);$("#buyBtn").addEventListener("click",openConfirm);
$("#addCart").addEventListener("click",addCurrentCocktailToCart);$("#confirmBuy").addEventListener("click",addOrder);
$("#adminBtn").addEventListener("click",()=>show("#adminLoginModal"));$("#adminForm").addEventListener("submit",e=>{e.preventDefault();enterAdmin()});$("#logoutAdmin").addEventListener("click",()=>{hide("#adminSection");show("#inicio");window.scrollTo({top:0,behavior:"smooth"})});
$$(".option").forEach(b=>b.addEventListener("click",()=>{const set=b.dataset.type==="side"?state.sides:state.toppings;set.has(b.dataset.id)?set.delete(b.dataset.id):set.add(b.dataset.id);updatePreview()}));
$("#cartItems").addEventListener("click",e=>{const d=e.target.closest("[data-delete]"),du=e.target.closest("[data-duplicate]");if(d){state.cart.splice(Number(d.dataset.delete),1);saveCart()}if(du){state.cart.push({...state.cart[Number(du.dataset.duplicate)],id:crypto.randomUUID()});saveCart()}});
window.addEventListener("load",async()=>{const u=await currentUser();if(u){$("#accountBtn").textContent="Cuenta creada ✓ listo para ordenar";$("#accountBtn").classList.add("account-ok")}renderCart();updatePreview();});
