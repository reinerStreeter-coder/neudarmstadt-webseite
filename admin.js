
let data = null;
const el = (id) => document.getElementById(id);

function esc(v) {
  return String(v ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
}

async function apiJson(url, options = {}) {
  const r = await fetch(url, options);
  const text = await r.text();
  let obj = {};
  try { obj = text ? JSON.parse(text) : {}; } catch(e) { obj = { raw: text }; }
  if (!r.ok) throw new Error(obj.error || text || ("HTTP " + r.status));
  return obj;
}

async function checkLogin() {
  try {
    const s = await apiJson("/api/status");
    if (s.loggedIn) {
      el("loginBox").classList.add("hidden");
      el("adminBox").classList.remove("hidden");
      await loadData();
    } else {
      el("loginBox").classList.remove("hidden");
      el("adminBox").classList.add("hidden");
    }
  } catch (e) {
    el("loginStatus").textContent = "Server nicht erreichbar: " + e.message;
  }
}

async function login() {
  el("loginStatus").textContent = "Login läuft...";
  try {
    await apiJson("/api/login", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ username: el("loginUser").value, password: el("loginPass").value })
    });
    el("loginStatus").textContent = "Login erfolgreich.";
    await checkLogin();
  } catch (e) {
    el("loginStatus").textContent = "Fehler: " + e.message;
  }
}

async function logout() {
  await fetch("/api/logout", {method:"POST"});
  location.reload();
}

async function loadData() {
  data = await apiJson("/api/data");
  fillForm();
}

function fillForm() {
  if (!data.legal) data.legal = {};
  if (!data.news) data.news = [];
  if (!data.messages) data.messages = [];
  if (!data.rentals) data.rentals = [];
  if (!data.gallery) data.gallery = [];
  if (!data.cards) data.cards = [];
  if (!data.people) data.people = [];
  if (!data.events) data.events = [];
  if (!data.auth) data.auth = {username:"admin", password:"neudarmstadt"};

  el("newUsername").value = data.auth.username || "admin";
  el("visitorTotal").textContent = data.visitors?.total || 0;
  if(!data.siteStatus) data.siteStatus={online:true,offlineTitle:"Neudarmstadt ist gerade offline",offlineText:"Wir arbeiten gerade an der Webseite. Bitte schau später wieder vorbei."};
  el("siteOnline").value = String(data.siteStatus.online !== false);
  el("offlineTitle").value = data.siteStatus.offlineTitle || "";
  el("offlineText").value = data.siteStatus.offlineText || "";
  el("legalEmail").value = data.legal.email || "";
  el("legalImpressum").value = data.legal.impressumText || "";
  el("legalPrivacy").value = data.legal.privacyText || "";
  el("siteTitle").value = data.site?.title || "";
  el("siteSubtitle").value = data.site?.subtitle || "";
  el("siteWelcome").value = data.site?.welcome || "";
  el("siteLogo").value = data.site?.logo || "";
  el("siteHero").value = data.site?.heroImage || "";

  renderCards();
  renderNews();
  renderEvents();
  renderRentals();
  renderGallery();
  renderMessages();
  renderPeople();
}

function renderCards() {
  el("cardsBox").innerHTML = data.cards.map((c,i)=>`
    <div class="admin-panel">
      <h3>Linkbild ${i+1}</h3>
      <label>Titel</label><input data-path="cards.${i}.title" value="${esc(c.title)}">
      <label>Text</label><textarea data-path="cards.${i}.text">${esc(c.text)}</textarea>
      <label>Bild</label><input data-path="cards.${i}.image" value="${esc(c.image)}">
      <label>Link</label><input data-path="cards.${i}.link" value="${esc(c.link)}">
    </div>`).join("");
}

function renderNews() {
  el("newsBox").innerHTML = data.news.map((n,i)=>`
    <div class="admin-panel">
      <label>Datum</label><input type="date" data-path="news.${i}.date" value="${esc(n.date)}">
      <label>Titel DE</label><input data-path="news.${i}.title" value="${esc(n.title)}">
      <label>Titel EN</label><input data-path="news.${i}.title_en" value="${esc(n.title_en)}">
      <label>Text DE</label><textarea data-path="news.${i}.text">${esc(n.text)}</textarea>
      <label>Text EN</label><textarea data-path="news.${i}.text_en">${esc(n.text_en)}</textarea>
      <label>Bild</label><input data-path="news.${i}.image" value="${esc(n.image)}">
      <button type="button" class="danger" onclick="data.news.splice(${i},1); renderNews();">Löschen</button>
    </div>`).join("");
}

function renderEvents() {
  el("eventsBox").innerHTML = data.events.map((e,i)=>`
    <div class="admin-panel">
      <label>Datum</label><input type="date" data-path="events.${i}.date" value="${esc(e.date)}">
      <label>Uhrzeit</label><input data-path="events.${i}.time" value="${esc(e.time)}">
      <label>Kategorie</label><input data-path="events.${i}.category" value="${esc(e.category)}">
      <label>Ort</label><input data-path="events.${i}.location" value="${esc(e.location)}">
      <label>Titel DE</label><input data-path="events.${i}.title" value="${esc(e.title)}">
      <label>Titel EN</label><input data-path="events.${i}.title_en" value="${esc(e.title_en)}">
      <label>Beschreibung DE</label><textarea data-path="events.${i}.description">${esc(e.description)}</textarea>
      <label>Beschreibung EN</label><textarea data-path="events.${i}.description_en">${esc(e.description_en)}</textarea>
      <label>Bild</label><input data-path="events.${i}.image" value="${esc(e.image)}">
      <button type="button" class="danger" onclick="data.events.splice(${i},1); renderEvents();">Löschen</button>
    </div>`).join("");
}

function renderRentals() {
  el("rentalsBox").innerHTML = data.rentals.map((r,i)=>`
    <div class="admin-panel">
      <label>Titel DE</label><input data-path="rentals.${i}.title" value="${esc(r.title)}">
      <label>Titel EN</label><input data-path="rentals.${i}.title_en" value="${esc(r.title_en)}">
      <label>Preis</label><input data-path="rentals.${i}.price" value="${esc(r.price)}">
      <label>Beschreibung DE</label><textarea data-path="rentals.${i}.description">${esc(r.description)}</textarea>
      <label>Beschreibung EN</label><textarea data-path="rentals.${i}.description_en">${esc(r.description_en)}</textarea>
      <label>Bild</label><input data-path="rentals.${i}.image" value="${esc(r.image)}">
      <button type="button" class="danger" onclick="data.rentals.splice(${i},1); renderRentals();">Löschen</button>
    </div>`).join("");
}

function renderGallery() {
  el("galleryBox").innerHTML = data.gallery.map((g,i)=>`
    <div class="admin-panel">
      <label>Titel DE</label><input data-path="gallery.${i}.title" value="${esc(g.title)}">
      <label>Titel EN</label><input data-path="gallery.${i}.title_en" value="${esc(g.title_en)}">
      <label>Beschreibung DE</label><textarea data-path="gallery.${i}.description">${esc(g.description)}</textarea>
      <label>Beschreibung EN</label><textarea data-path="gallery.${i}.description_en">${esc(g.description_en)}</textarea>
      <label>Bild</label><input data-path="gallery.${i}.image" value="${esc(g.image)}">
      <button type="button" class="danger" onclick="data.gallery.splice(${i},1); renderGallery();">Löschen</button>
    </div>`).join("");
}

function renderMessages() {
  el("messagesBox").innerHTML = data.messages.map((m,i)=>`
    <div class="message-card">
      <strong>An: ${esc(m.recipientName)}</strong><br>
      <span class="small">${esc(m.date)}</span>
      <p><b>Von:</b> ${esc(m.sender || "Unbekannt")} ${m.contact ? "(" + esc(m.contact) + ")" : ""}</p>
      <p>${esc(m.text)}</p>
      <button type="button" class="danger" onclick="data.messages.splice(${i},1); renderMessages();">Nachricht löschen</button>
    </div>`).join("") || '<p class="small">Noch keine Nachrichten vorhanden.</p>';
}

function renderPeople() {
  el("peopleBox").innerHTML = data.people.map((p,i)=>`
    <div class="admin-panel">
      <label>Name</label><input data-path="people.${i}.name" value="${esc(p.name)}">
      <label>Rolle</label><input data-path="people.${i}.role" value="${esc(p.role)}">
      <label>Gruppe</label><select data-path="people.${i}.group">
        <option value="mayor" ${p.group==="mayor" ? "selected" : ""}>Bürgermeister-Reihe</option>
        <option value="council" ${p.group==="council" ? "selected" : ""}>Stadtrat-Reihe</option>
      </select>
      <label>Beschreibung DE</label><textarea data-path="people.${i}.description">${esc(p.description)}</textarea>
      <label>Beschreibung EN</label><textarea data-path="people.${i}.description_en">${esc(p.description_en)}</textarea>
      <label>Avatar UUID</label><input data-path="people.${i}.uuid" value="${esc(p.uuid)}">
      <label>Status</label><select data-path="people.${i}.online">
        <option value="false" ${p.online ? "" : "selected"}>Offline</option>
        <option value="true" ${p.online ? "selected" : ""}>Online</option>
      </select>
      <label>Bild</label><input data-path="people.${i}.image" value="${esc(p.image)}">
    </div>`).join("");
}

function applyInputs() {
  data.legal.email = el("legalEmail").value;
  data.legal.impressumText = el("legalImpressum").value;
  data.legal.privacyText = el("legalPrivacy").value;
  data.siteStatus = {
    online: el("siteOnline").value === "true",
    offlineTitle: el("offlineTitle").value,
    offlineText: el("offlineText").value
  };
  data.site.title = el("siteTitle").value;
  data.site.subtitle = el("siteSubtitle").value;
  data.site.welcome = el("siteWelcome").value;
  data.site.logo = el("siteLogo").value;
  data.site.heroImage = el("siteHero").value;

  document.querySelectorAll("[data-path]").forEach(input => {
    const parts = input.dataset.path.split(".");
    let obj = data;
    for (let i=0; i<parts.length-1; i++) obj = obj[parts[i]];
    let value = input.value;
    if (input.dataset.path.endsWith(".online")) value = value === "true";
    obj[parts[parts.length-1]] = value;
  });
}

async function saveAll() {
  try {
    applyInputs();
    await apiJson("/api/data", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(data)});
    el("saveStatus").textContent = "Gespeichert!";
  } catch (e) {
    el("saveStatus").textContent = "Speicherfehler: " + e.message;
  }
}

function addNews() {
  data.news.push({date:"", title:"Neue News", title_en:"New news", text:"", text_en:"", image:"assets/landing.png"});
  renderNews();
}

function addEvent() {
  data.events.push({date:"", time:"", category:"Event", location:"Neudarmstadt", title:"Neues Event", title_en:"New event", description:"", description_en:"", image:"assets/landing.png"});
  renderEvents();
}

function addRental() {
  data.rentals.push({title:"Neue Vermietung", title_en:"New rental", price:"", description:"", description_en:"", image:"assets/landing.png"});
  renderRentals();
}

function addGallery() {
  data.gallery.push({title:"Neues Bild", title_en:"New image", description:"", description_en:"", image:"assets/landing.png"});
  renderGallery();
}

async function changePassword() {
  try {
    const j = await apiJson("/api/change-password", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({username:el("newUsername").value, oldPassword:el("oldPassword").value, newPassword:el("newPassword").value})});
    el("passwordStatus").textContent = "Passwort wurde geändert.";
    el("oldPassword").value = "";
    el("newPassword").value = "";
  } catch(e) {
    el("passwordStatus").textContent = "Fehler: " + e.message;
  }
}

async function uploadImage() {
  const f = el("uploadFile").files[0];
  if (!f) { el("uploadStatus").textContent = "Bitte Bild wählen."; return; }
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const j = await apiJson("/api/upload", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({filename:f.name, data:reader.result})});
      el("uploadedPath").value = j.path;
      el("uploadStatus").textContent = "Hochgeladen: " + j.path;
    } catch(e) {
      el("uploadStatus").textContent = "Upload-Fehler: " + e.message;
    }
  };
  reader.readAsDataURL(f);
}

async function manualBackup() {
  try {
    const j = await apiJson("/api/backup", {method:"POST"});
    el("saveStatus").textContent = "Backup erstellt: " + j.file;
    await loadBackups();
  } catch(e) {
    el("saveStatus").textContent = "Backup-Fehler: " + e.message;
  }
}

async function loadBackups() {
  try {
    const j = await apiJson("/api/backups");
    el("backupList").innerHTML = (j.files || []).map(f => `<div>${esc(f)}</div>`).join("") || "Keine Backups vorhanden.";
  } catch(e) {
    el("backupList").textContent = "Fehler: " + e.message;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  el("loginButton").addEventListener("click", login);
  el("logoutButton").addEventListener("click", logout);
  el("saveButton").addEventListener("click", saveAll);
  el("backupButton").addEventListener("click", manualBackup);
  el("backupListButton").addEventListener("click", loadBackups);
  el("passwordButton").addEventListener("click", changePassword);
  el("uploadButton").addEventListener("click", uploadImage);
  el("addNewsButton").addEventListener("click", addNews);
  el("addEventButton").addEventListener("click", addEvent);
  el("addRentalButton").addEventListener("click", addRental);
  el("addGalleryButton").addEventListener("click", addGallery);
  el("refreshMessagesButton").addEventListener("click", renderMessages);
  checkLogin();
});
