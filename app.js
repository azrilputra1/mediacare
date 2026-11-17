// Medicare frontend — Firebase Authentication + Cloud Firestore
// Isi firebaseConfig di bawah dengan konfigurasi project Firebase milik Anda.
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  getAuth, onAuthStateChanged, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, sendPasswordResetEmail, signOut,
  updateProfile
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {
  getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc,
  query, where, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// GANTI semua nilai placeholder dengan konfigurasi dari Firebase Console.
const firebaseConfig = {
  apiKey: "GANTI_DENGAN_API_KEY",
  authDomain: "GANTI_DENGAN_PROJECT_ID.firebaseapp.com",
  projectId: "GANTI_DENGAN_PROJECT_ID",
  storageBucket: "GANTI_DENGAN_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "GANTI_DENGAN_MESSAGING_SENDER_ID",
  appId: "GANTI_DENGAN_APP_ID"
};

const configReady = Object.values(firebaseConfig).every(v => v && !v.startsWith("GANTI_"));
let auth, db;
if (configReady) {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}

const $ = id => document.getElementById(id);
const authScreen = $("authScreen");
const appScreen = $("appScreen");
let currentUser = null;
let appointments = [];
let calendarDate = new Date();
let selectedDate = dateKey(new Date());

function dateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth()+1).padStart(2,"0");
  const d = String(date.getDate()).padStart(2,"0");
  return `${y}-${m}-${d}`;
}
function safeText(value="") {
  return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function initials(name="Pasien") {
  return name.trim().split(/\s+/).slice(0,2).map(x=>x[0]?.toUpperCase()||"").join("") || "MP";
}
function showMessage(id, text, success=false) {
  const el=$(id); el.textContent=text; el.classList.toggle("success",success);
}
function toast(text) {
  const el=$("toast"); el.textContent=text; el.classList.add("show");
  setTimeout(()=>el.classList.remove("show"),2600);
}
function formatDate(value) {
  if (!value) return "-";
  return new Date(`${value}T00:00:00`).toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"});
}
function setAuthTab(tab) {
  document.querySelectorAll("[data-auth-tab]").forEach(b=>b.classList.toggle("active",b.dataset.authTab===tab));
  $("loginForm").classList.toggle("hidden",tab!=="login");
  $("registerForm").classList.toggle("hidden",tab!=="register");
  showMessage("authMessage","");
}
document.querySelectorAll("[data-auth-tab]").forEach(b=>b.addEventListener("click",()=>setAuthTab(b.dataset.authTab)));

function requireFirebase() {
  if (!configReady) {
    showMessage("authMessage","Konfigurasi Firebase belum diisi. Ikuti petunjuk di README terlebih dahulu.");
    return false;
  }
  return true;
}

$("registerForm").addEventListener("submit", async e=>{
  e.preventDefault();
  if(!requireFirebase()) return;
  const name=$("registerName").value.trim();
  const email=$("registerEmail").value.trim();
  const password=$("registerPassword").value;
  const confirm=$("registerConfirm").value;
  if(password!==confirm){showMessage("authMessage","Konfirmasi password tidak sama.");return;}
  try{
    const credential=await createUserWithEmailAndPassword(auth,email,password);
    await updateProfile(credential.user,{displayName:name});
    await credential.user.reload();
    toast("Akun berhasil dibuat.");
  }catch(err){showMessage("authMessage",authError(err));}
});

$("loginForm").addEventListener("submit",async e=>{
  e.preventDefault();
  if(!requireFirebase()) return;
  try{
    await signInWithEmailAndPassword(auth,$("loginEmail").value.trim(),$("loginPassword").value);
    showMessage("authMessage","");
  }catch(err){showMessage("authMessage",authError(err));}
});

$("forgotPassword").addEventListener("click",async()=>{
  if(!requireFirebase()) return;
  const email=$("loginEmail").value.trim();
  if(!email){showMessage("authMessage","Masukkan email terlebih dahulu.");return;}
  try{await sendPasswordResetEmail(auth,email);showMessage("authMessage","Link reset password dikirim ke email Anda.",true);}
  catch(err){showMessage("authMessage",authError(err));}
});

function authError(err){
  const map={
    "auth/email-already-in-use":"Email sudah terdaftar.",
    "auth/invalid-email":"Format email tidak valid.",
    "auth/weak-password":"Password terlalu lemah. Gunakan minimal 6 karakter.",
    "auth/invalid-credential":"Email atau password salah.",
    "auth/user-not-found":"Akun tidak ditemukan.",
    "auth/wrong-password":"Password salah.",
    "auth/too-many-requests":"Terlalu banyak percobaan. Coba lagi nanti.",
    "auth/network-request-failed":"Periksa koneksi internet Anda."
  };
  return map[err.code] || err.message || "Terjadi kesalahan. Coba lagi.";
}

onAuthStateChanged(auth || {onAuthStateChanged:()=>{}}, async user=>{
  if(!configReady) return;
  if(user){
    currentUser=user;
    authScreen.classList.add("hidden");
    appScreen.classList.remove("hidden");
    updateUserUI(user);
    await loadAppointments();
    showView("dashboard");
  }else{
    currentUser=null; appointments=[];
    appScreen.classList.add("hidden");
    authScreen.classList.remove("hidden");
  }
});

function updateUserUI(user){
  const name=user.displayName || user.email?.split("@")[0] || "Pasien";
  $("topUserName").textContent=name;
  $("topUserEmail").textContent=user.email||"";
  $("topAvatar").textContent=initials(name);
  $("profileAvatar").textContent=initials(name);
  $("profileName").textContent=name;
  $("profileEmail").textContent=user.email||"-";
  $("profileUid").textContent=user.uid;
  $("patientName").value=name;
  $("welcomeText").textContent=`Selamat datang kembali, ${name}.`;
}

$("logoutButton").addEventListener("click",async()=>{
  if(auth && confirm("Apakah Anda yakin ingin keluar?")) await signOut(auth);
});

document.querySelectorAll("[data-view]").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.view)));
document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.go)));
function showView(name){
  const titles={dashboard:"Dashboard",appointments:"Janji Temu",doctors:"Dokter",history:"Riwayat Janji Temu",profile:"Profil Saya"};
  document.querySelectorAll(".view").forEach(v=>v.classList.add("hidden"));
  $(`${name}View`).classList.remove("hidden");
  $("pageTitle").textContent=titles[name];
  document.querySelectorAll("[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===name));
  $("sidebar").classList.remove("open");
  if(name==="appointments") renderCalendar();
  if(name==="history") renderHistory();
}
$("mobileMenu").addEventListener("click",()=>$("sidebar").classList.toggle("open"));

async function loadAppointments(){
  if(!currentUser)return;
  try{
    const q=query(collection(db,"appointments"),where("userId","==",currentUser.uid));
    const snap=await getDocs(q);
    appointments=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
    renderAll();
  }catch(err){toast("Gagal memuat data: "+err.message);}
}
function renderAll(){
  $("totalCount").textContent=appointments.length;
  $("completedCount").textContent=appointments.filter(a=>a.status==="Selesai").length;
  $("pendingCount").textContent=appointments.filter(a=>a.status==="Menunggu").length;
  renderUpcoming();renderAppointmentList();renderCalendar();renderHistory();
}
function appointmentCard(a,actions=true){
  const statusClass=a.status==="Selesai"?"done":a.status==="Dibatalkan"?"cancelled":"pending";
  return `<article class="appointment-item">
    <div class="appointment-main"><strong>${safeText(a.doctor)}</strong>
    <p>${safeText(a.patientName)} · ${safeText(a.clinic)}<br>${formatDate(a.date)} · ${safeText(a.time)}${a.notes?`<br>Catatan: ${safeText(a.notes)}`:""}</p></div>
    <span class="status ${statusClass}">${safeText(a.status||"Menunggu")}</span>
    ${actions?`<div class="item-actions"><button class="small-btn edit-btn" data-edit="${a.id}">Ubah</button><button class="small-btn delete-btn" data-delete="${a.id}">Hapus</button></div>`:""}
  </article>`;
}
function renderUpcoming(){
  const today=dateKey(new Date());
  const list=appointments.filter(a=>a.date>=today&&a.status!=="Dibatalkan"&&a.status!=="Selesai").slice(0,3);
  $("upcomingList").innerHTML=list.length?list.map(a=>appointmentCard(a,false)).join():'<div class="empty-state">Belum ada janji temu mendatang.</div>';
}
function renderAppointmentList(){
  $("appointmentList").innerHTML=appointments.length?appointments.map(a=>appointmentCard(a,true)).join():'<div class="empty-state">Belum ada janji temu. Silakan buat jadwal pertama Anda.</div>';
}
function renderHistory(){
  $("historyList").innerHTML=appointments.length?[...appointments].reverse().map(a=>appointmentCard(a,false)).join():'<div class="empty-state">Riwayat masih kosong.</div>';
}
$("appointmentList").addEventListener("click",async e=>{
  const edit=e.target.closest("[data-edit]"); const del=e.target.closest("[data-delete]");
  if(edit) startEdit(edit.dataset.edit);
  if(del) await removeAppointment(del.dataset.delete);
});

$("appointmentForm").addEventListener("submit",async e=>{
  e.preventDefault(); if(!currentUser)return;
  const id=$("appointmentId").value;
  const data={
    userId:currentUser.uid,
    patientName:$("patientName").value.trim(),
    doctor:$("doctorSelect").value,
    date:$("appointmentDate").value,
    time:$("appointmentTime").value,
    clinic:$("clinicName").value.trim(),
    notes:$("appointmentNotes").value.trim(),
    status:"Menunggu",
    updatedAt:serverTimestamp()
  };
  if(data.date<dateKey(new Date())){showMessage("appointmentMessage","Tanggal janji temu tidak boleh di masa lalu.");return;}
  try{
    if(id){
      const existing=appointments.find(a=>a.id===id);
      if(existing)data.status=existing.status;
      await updateDoc(doc(db,"appointments",id),data);
      toast("Jadwal berhasil diperbarui.");
    }else{
      data.createdAt=serverTimestamp();
      await addDoc(collection(db,"appointments"),data);
      toast("Janji temu berhasil disimpan.");
    }
    resetAppointmentForm();showMessage("appointmentMessage","");await loadAppointments();
  }catch(err){showMessage("appointmentMessage","Gagal menyimpan: "+err.message);}
});

function startEdit(id){
  const a=appointments.find(x=>x.id===id);if(!a)return;
  $("appointmentId").value=a.id;$("patientName").value=a.patientName||"";
  $("doctorSelect").value=a.doctor||"";$("appointmentDate").value=a.date||"";
  $("appointmentTime").value=a.time||"";$("clinicName").value=a.clinic||"";
  $("appointmentNotes").value=a.notes||"";
  $("appointmentFormTitle").textContent="Ubah Janji Temu";
  $("saveAppointment").textContent="Simpan Perubahan";
  $("cancelEdit").classList.remove("hidden");
  $("appointmentForm").scrollIntoView({behavior:"smooth",block:"start"});
}
function resetAppointmentForm(){
  $("appointmentForm").reset();$("appointmentId").value="";
  $("patientName").value=currentUser?.displayName||"";
  $("appointmentFormTitle").textContent="Buat Janji Temu";
  $("saveAppointment").textContent="Simpan Janji Temu";
  $("cancelEdit").classList.add("hidden");
}
$("cancelEdit").addEventListener("click",resetAppointmentForm);

async function removeAppointment(id){
  const a=appointments.find(x=>x.id===id);if(!a)return;
  if(!confirm(`Hapus janji temu dengan ${a.doctor}?`))return;
  try{
    await deleteDoc(doc(db,"appointments",id));toast("Janji temu dihapus.");await loadAppointments();
  }catch(err){toast("Gagal menghapus: "+err.message);}
}

function renderCalendar(){
  const year=calendarDate.getFullYear(),month=calendarDate.getMonth();
  $("calendarMonth").textContent=calendarDate.toLocaleDateString("id-ID",{month:"long",year:"numeric"});
  const first=new Date(year,month,1),start=first.getDay(),days=new Date(year,month+1,0).getDate();
  const today=dateKey(new Date());
  const weekdays=["Min","Sen","Sel","Rab","Kam","Jum","Sab"];
  let html=weekdays.map(d=>`<span class="calendar-day weekday">${d}</span>`).join("");
  for(let i=0;i<start;i++)html+=`<span class="calendar-day other"></span>`;
  for(let day=1;day<=days;day++){
    const key=dateKey(new Date(year,month,day));
    const has=appointments.some(a=>a.date===key&&a.status!=="Dibatalkan");
    html+=`<button class="calendar-day ${key===today?"today":""} ${key===selectedDate?"selected":""} ${has?"has-event":""}" data-date="${key}">${day}</button>`;
  }
  $("calendarGrid").innerHTML=html;
  renderSelectedDate();
}
function renderSelectedDate(){
  const list=appointments.filter(a=>a.date===selectedDate&&a.status!=="Dibatalkan");
  $("selectedDateAppointments").innerHTML=`<strong>${formatDate(selectedDate)}</strong><br>`+(list.length?list.map(a=>`${safeText(a.time)} — ${safeText(a.doctor)}`).join("<br>"):"Tidak ada janji temu pada tanggal ini.");
}
$("calendarGrid").addEventListener("click",e=>{
  const btn=e.target.closest("[data-date]");if(!btn)return;
  selectedDate=btn.dataset.date;calendarDate=new Date(`${selectedDate}T00:00:00`);renderCalendar();
});
$("prevMonth").addEventListener("click",()=>{calendarDate.setMonth(calendarDate.getMonth()-1);renderCalendar();});
$("nextMonth").addEventListener("click",()=>{calendarDate.setMonth(calendarDate.getMonth()+1);renderCalendar();});

// Prevent past dates in appointment form.
$("appointmentDate").min=dateKey(new Date());

// If Firebase config has not been replaced, keep the setup screen visible with a clear message.
if(!configReady){
  showMessage("authMessage","Firebase belum dikonfigurasi. Buka README.txt dan ikuti langkah setup sebelum login/register.");
}
