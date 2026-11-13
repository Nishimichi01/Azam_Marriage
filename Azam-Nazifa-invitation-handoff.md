# Wedding e-invitation handoff: Azam & Nazifa

Paste this whole file into another AI as your first message. It contains the project brief and the full working code at the end.

## 1. Goal
A mobile-first online wedding invitation (shareable link) for Walimatul Urus Azam & Nazifa, with animation, smooth motion, background music and an RSVP. Follow the couple's own card (olive plaid, cream panel, pink lilies, sage background) and improve it. Features present but not cluttered.

## 2. Wedding details (use exactly)
- Event: Walimatul Urus
- Bride: Imas Nazifatuz Zahro binti Suhaimi
- Groom: Muhammad Azam Muddin bin Ishak
- Date: Sabtu, 26 Disember 2026 (26.12.2026)
- Time: 11:00 pagi - 03:00 petang
- Venue: Masjid Prima Saujana, Kajang
- Contact: 017-5707840 (Azam), WhatsApp 60175707840
- Card wording (Malay): "Dengan penuh rasa syukur ke hadrat Ilahi, kami dengan segala hormatnya menjemput / ke majlis perkahwinan puteri dan putera kami: / (names, with "dan" between) / yang akan berlangsung seperti ketetapan berikut: / ... / Kehadiran dan doa restu daripada pihak tuan/puan amat kami hargai, semoga majlis ini diberkati serta dirahmati Allah SWT."

## 3. Design system (from the couple's card)
- Colours: olive #7a7f4e, blush #c4a69a, cream paper #eae0da, sage #e0e3bf, brown ink #4a2c1a, lily pink #f8cad6 to #e2809f
- Cover: olive plaid with white and blush lines and a centred cream panel. "Walimatul Urus" in script at top, AZAM & NAZIFA and 26.12.2026 at the bottom.
- Invitation page: sage background, pink lilies top-left, bud branch bottom-right, olive band at the bottom with the contact line. Tempat | Masa in two columns split by a thin vertical rule.
- Type: Pinyon Script for "Walimatul Urus", Cormorant Garamond for everything else (light uppercase names, italic body).

## 4. What is built
One self-contained HTML file (code at the end of this document), published as a claude.ai artifact:
- Tap-to-open cover; the cream panel grows to fill the screen and becomes the invitation; text fades in line by line
- Maps, Waze and Add-to-Google-Calendar buttons
- Live countdown to 26 Dis 2026, 11:00 (UTC+8), drifting petals, reduced-motion respected, light and dark themes
- Bottom bar with only RSVP and Lokasi
- RSVP and wishes pop-up (attending or not, name, phone, adults, children, wish) that opens a pre-filled WhatsApp message to Azam
- Music hook: the `SONG` variable is empty; set it to an MP3 link and a Lagu button appears. Playback starts on the cover tap.

## 5. Constraints and decisions
- Database: claude.ai artifact storage only lets signed-in people write, so anonymous guests can't submit. RSVP therefore goes via WhatsApp. For a real response table use a Google Form or a backend (Supabase, Firebase).
- Music: browsers block autoplay, so audio starts on the cover tap. An MP3 the couple has rights to is still needed. YouTube and Spotify links can't be embedded as audio.
- Images: published artifact pages can't load remote images; embed or upload them. The lilies and buds are hand-drawn SVG, not the card's artwork.
- Fonts: Google Fonts only.

## 6. Reference designs analysed (references only, not copied)
- jemputan.me (Mia & Idraki), from a screen recording: round seal opens onto a watercolour garden, script names, frosted text fade, butterflies over a glass schedule card, two-button bottom bar (Lagu, Lokasi).
- tetamu.me (Mundzirah & Amman), same recording: burgundy lace borders, falling rose petals, countdown, couple photo, floating music pill, three-button bar (Calendar, Location, Contact).
- kahwinnow.com, aliveinvite.com, invait.my: only text and features were readable. Seen: open button, music, RSVP, guestbook, map links, calendar, gift and QR sections, slot tracker.
- Those pages contain real people's names and phone numbers; do not reuse them.

## 7. Still open
1. MP3 for the background music
2. Couple photos (if a photo section is wanted)
3. The original lily and flower artwork from the card
4. A schedule of events (not provided, so omitted)
5. Decide whether to replace WhatsApp RSVP with a Google Form or backend

## 8. Instructions for the next AI
Keep the design faithful to the card and uncluttered, with at most three buttons in the bottom bar. Keep all wedding details exactly as above and do not invent a schedule. Make small edits to the existing code rather than rewriting it. Test at phone width.

## 9. Full working code (azam-nazifa-invitation.html)

```html
<!DOCTYPE html>
<html lang="ms">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Walimatul Urus · Azam &amp; Nazifa</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,500;0,700;1,400;1,500&family=Pinyon+Script&display=swap" rel="stylesheet">
<style>
:root{--olive:#7a7f4e;--blush:#c4a69a;--paper:#eae0da;--sage:#e0e3bf;--ink:#4a2c1a;--soft:#6b5a3c;--glass:rgba(224,227,191,.82);
box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px);color-scheme:light dark}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--olive:#5d6139;--paper:#3b312b;--sage:#2b2f1f;--ink:#f0e4d9;--soft:#cbbfa9;--glass:rgba(43,47,31,.85)}}
:root[data-theme="dark"]{--olive:#5d6139;--paper:#3b312b;--sage:#2b2f1f;--ink:#f0e4d9;--soft:#cbbfa9;--glass:rgba(43,47,31,.85)}
html{scroll-padding-top:env(safe-area-inset-top,0px);scroll-behavior:smooth}
*{box-sizing:border-box;margin:0}
body{background:var(--sage);color:var(--ink);font-family:"Cormorant Garamond",Georgia,serif;font-size:19px;line-height:1.45;text-align:center;overflow-x:hidden}
body.lock{overflow:hidden;height:100%}
.script{font-family:"Pinyon Script","Snell Roundhand",cursive;font-weight:400}

/* ---------- cover ---------- */
.cover{position:fixed;inset:0;z-index:50;cursor:pointer;background-color:var(--olive);
--u:26vw;--w:2.2vw;
background-image:
linear-gradient(90deg,transparent 0 5vw,var(--blush) 5vw 5.9vw,transparent 5.9vw 6.7vw,var(--blush) 6.7vw 7.1vw,transparent 7.1vw 7.8vw,var(--blush) 7.8vw 8vw,transparent 8vw),
linear-gradient(0deg,transparent 0 5vw,var(--blush) 5vw 5.9vw,transparent 5.9vw 6.7vw,var(--blush) 6.7vw 7.1vw,transparent 7.1vw 7.8vw,var(--blush) 7.8vw 8vw,transparent 8vw),
linear-gradient(90deg,#fff 0 var(--w),transparent var(--w)),linear-gradient(0deg,#fff 0 var(--w),transparent var(--w));
background-size:var(--u) 100%,100% var(--u),var(--u) 100%,100% var(--u);
transition:opacity .9s ease .5s}
.cover.go{opacity:0;pointer-events:none}
.panel{position:absolute;inset:15% 14% 17% 14%;background:var(--paper);display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:7% 6% 8%;
transition:inset 1.3s cubic-bezier(.7,0,.2,1),background-color 1.3s ease .2s}
.cover.go .panel{inset:0;background:var(--sage)}
.panel .t{transition:opacity .5s}.cover.go .t{opacity:0}
.cover .script{font-size:clamp(30px,9vw,44px);color:#4a2c1a}
.cover .nm{font-weight:700;letter-spacing:.14em;font-size:clamp(17px,5.4vw,24px);color:#4a2c1a}
.cover .dt{font-weight:700;letter-spacing:.2em;font-size:15px;color:#4a2c1a}
.hint{font-style:italic;font-size:16px;color:#6b5a3c;animation:pulse 2.4s ease-in-out infinite}
.cover svg{width:34vw;max-width:170px;height:auto;animation:sway 5s ease-in-out infinite;transform-origin:50% 90%}
@keyframes sway{50%{transform:rotate(5deg) scale(1.03)}}
@keyframes pulse{50%{opacity:.35}}

/* ---------- invitation ---------- */
main{position:relative;padding-bottom:110px}
section{position:relative;padding:44px 28px;max-width:560px;margin:0 auto}
.hero{padding-top:78px}
.lily{position:absolute;pointer-events:none}
.l1{width:170px;left:-48px;top:-30px;transform:rotate(-14deg)}
.l2{width:130px;left:-22px;top:20px;transform:rotate(18deg)}
.hero .script{font-size:clamp(40px,12vw,58px);margin:0 0 26px 52px;line-height:1.1}
.it{font-style:italic;font-weight:500;color:var(--soft);max-width:30ch;margin:0 auto 16px}
.name{font-weight:300;text-transform:uppercase;font-size:clamp(23px,7vw,31px);line-height:1.15;letter-spacing:-.01em;margin:6px 0}
.dan{font-style:italic;font-size:16px;color:var(--soft)}
.date{font-weight:300;text-transform:uppercase;font-size:clamp(28px,8.6vw,40px);line-height:1.1;margin-top:26px}
.hero>*{opacity:0;transform:translateY(14px)}
body.on .hero>*{animation:rise .9s cubic-bezier(.2,.7,.2,1) forwards;animation-delay:calc(var(--i)*.14s + .5s)}
@keyframes rise{to{opacity:1;transform:none}}

.cols{display:grid;grid-template-columns:1fr 1px 1fr;gap:18px;text-align:left;align-items:start}
.cols .r{text-align:right}.cols i{display:block;font-size:19px;color:var(--soft);margin-bottom:6px}
.cols b{font-weight:500;font-size:24px;line-height:1.2;display:block}
.rule{background:var(--blush);align-self:stretch}
.btns{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:26px}
.btn{font:500 17px "Cormorant Garamond",serif;color:var(--ink);background:none;border:1px solid var(--olive);border-radius:99px;padding:9px 22px;text-decoration:none;cursor:pointer;transition:background .25s,color .25s}
.btn:hover,.btn:focus-visible{background:var(--olive);color:#fff;outline:none}
.btn.fill{background:var(--olive);color:#fff}

.count{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:6px}
.count div{background:var(--paper);padding:14px 0 10px;border-top:3px solid var(--blush)}
.count b{display:block;font-weight:300;font-size:34px;line-height:1;font-variant-numeric:tabular-nums}
.count span{font-size:14px;color:var(--soft)}
.note{margin-top:34px}
.band{background:var(--olive);color:#e6e8cf;padding:26px 20px 34px;font-style:italic}
.band a{color:inherit}
.branch{position:absolute;right:-30px;bottom:30px;width:190px;opacity:.95;pointer-events:none}

/* ---------- bar + sheet ---------- */
.bar{position:fixed;left:50%;bottom:calc(14px + env(safe-area-inset-bottom,0px));transform:translate(-50%,160%);z-index:20;display:flex;gap:4px;padding:6px;border-radius:99px;background:var(--glass);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid var(--blush);transition:transform .8s cubic-bezier(.2,.8,.2,1) .4s}
body.on .bar{transform:translate(-50%,0)}
.bar button,.bar a{font:500 17px "Cormorant Garamond",serif;color:var(--ink);background:none;border:0;border-radius:99px;padding:10px 20px;cursor:pointer;text-decoration:none}
.bar .pri{background:var(--olive);color:#fff}
.bar button:focus-visible,.bar a:focus-visible{outline:2px solid var(--olive)}
.veil{position:fixed;inset:0;z-index:30;background:rgba(40,30,20,.45);opacity:0;pointer-events:none;transition:opacity .4s}
.sheet{position:fixed;left:0;right:0;bottom:0;z-index:40;max-width:560px;margin:0 auto;background:var(--sage);border-radius:22px 22px 0 0;padding:26px 26px calc(26px + env(safe-area-inset-bottom,0px));transform:translateY(105%);transition:transform .6s cubic-bezier(.2,.8,.2,1);max-height:92%;overflow:auto;text-align:left}
body.sh .veil{opacity:1;pointer-events:auto}body.sh .sheet{transform:none}
.sheet h2{font-weight:500;font-size:30px;text-align:center}
.sheet .sub{text-align:center;color:var(--soft);font-style:italic;margin-bottom:16px}
.seg{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px}
.seg button{font:500 18px "Cormorant Garamond",serif;color:var(--ink);padding:10px;border:1px solid var(--olive);background:none;border-radius:12px;cursor:pointer}
.seg button.sel{background:var(--olive);color:#fff}
.sheet label{display:block;font-size:16px;color:var(--soft);margin:10px 0 3px}
.sheet input,.sheet select,.sheet textarea{width:100%;font:500 18px "Cormorant Garamond",serif;color:var(--ink);background:var(--paper);border:1px solid var(--blush);border-radius:10px;padding:10px 12px}
.sheet input:focus,.sheet select:focus,.sheet textarea:focus{outline:2px solid var(--olive)}
.two{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.sheet .go{width:100%;margin-top:18px;padding:13px}
.err{color:#b3402c;font-size:16px;min-height:20px;text-align:center;margin-top:6px}
.petal{position:fixed;top:-30px;z-index:10;width:12px;height:16px;border-radius:70% 0 70% 0;background:linear-gradient(135deg,#f9d3dd,#e58aa6);opacity:0;pointer-events:none;animation:fall linear infinite}
@keyframes fall{0%{opacity:0;transform:translate3d(0,0,0) rotate(0)}10%{opacity:.85}100%{opacity:0;transform:translate3d(60px,110vh,0) rotate(420deg)}}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition-duration:.01ms!important}.hero>*{opacity:1;transform:none}}
</style>
</head>
<body class="lock">

<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
<radialGradient id="pg" cx="50%" cy="85%" r="95%"><stop offset="0" stop-color="#fff"/><stop offset=".45" stop-color="#f8cad6"/><stop offset="1" stop-color="#e2809f"/></radialGradient>
<symbol id="lily" viewBox="-100 -100 200 200">
<g fill="url(#pg)" stroke="#e8a0b8" stroke-width=".8">
<path id="pt" d="M0 0C-27-30-31-78 0-98C31-78 27-30 0 0Z"/>
<use href="#pt" transform="rotate(72)"/><use href="#pt" transform="rotate(144)"/><use href="#pt" transform="rotate(216)"/><use href="#pt" transform="rotate(288)"/></g>
<g stroke="#c9705f" stroke-width="1.4" fill="#b8453a"><path d="M0 0L-14-48M0 0L2-54M0 0L16-46" fill="none"/><circle cx="-14" cy="-50" r="3.2"/><circle cx="2" cy="-56" r="3.2"/><circle cx="16" cy="-48" r="3.2"/></g>
</symbol>
<symbol id="branch" viewBox="0 0 200 200">
<path d="M200 20C150 40 110 80 60 190M150 52C132 62 120 66 104 66M128 90C150 92 160 84 172 72M96 130C112 126 122 118 130 104" fill="none" stroke="#9a9a73" stroke-width="2.4" stroke-linecap="round"/>
<g fill="#ef9db3"><ellipse cx="170" cy="40" rx="10" ry="16" transform="rotate(30 170 40)"/><ellipse cx="102" cy="66" rx="9" ry="14" transform="rotate(-70 102 66)"/><ellipse cx="176" cy="68" rx="10" ry="15" transform="rotate(50 176 68)"/><ellipse cx="132" cy="102" rx="9" ry="14" transform="rotate(30 132 102)"/><ellipse cx="94" cy="132" rx="9" ry="14" transform="rotate(-60 94 132)"/></g>
<g fill="#d9d4a8"><ellipse cx="84" cy="150" rx="6" ry="14" transform="rotate(-50 84 150)"/><ellipse cx="140" cy="76" rx="5" ry="13" transform="rotate(70 140 76)"/></g>
</symbol>
</defs></svg>

<div class="cover" id="cover" role="button" tabindex="0" aria-label="Buka jemputan">
  <div class="panel">
    <div class="script t">Walimatul Urus</div>
    <div class="t" style="text-align:center">
      <svg viewBox="-100 -100 200 200" aria-hidden="true"><use href="#lily"/></svg>
      <div class="hint">Ketik untuk buka</div>
    </div>
    <div class="t" style="text-align:center"><div class="nm">AZAM &amp; NAZIFA</div><div class="dt">26.12.2026</div></div>
  </div>
</div>

<main>
  <section class="hero">
    <svg class="lily l1" viewBox="-100 -100 200 200" aria-hidden="true"><use href="#lily"/></svg>
    <svg class="lily l2" viewBox="-100 -100 200 200" aria-hidden="true"><use href="#lily"/></svg>
    <div class="script" style="--i:0">Walimatul Urus</div>
    <p class="it" style="--i:1">Dengan penuh rasa syukur ke hadrat Ilahi, kami dengan segala hormatnya menjemput</p>
    <p class="it" style="--i:2">ke majlis perkahwinan puteri dan putera kami:</p>
    <div style="--i:3"><div class="name">Imas Nazifatuz Zahro binti Suhaimi</div><div class="dan">dan</div><div class="name">Muhammad Azam Muddin bin Ishak</div></div>
    <p class="it" style="--i:4;margin-top:16px">yang akan berlangsung seperti ketetapan berikut:</p>
    <div class="date" style="--i:5">26 Disember 2026,<br>Sabtu</div>
  </section>

  <section id="tempat">
    <div class="cols">
      <div class="r"><i>Tempat:</i><b>Masjid Prima Saujana, Kajang</b></div>
      <div class="rule"></div>
      <div><i>Masa:</i><b>11:00 pagi –<br>03:00 petang</b></div>
    </div>
    <div class="btns">
      <a class="btn" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=Masjid+Prima+Saujana+Kajang">Google Maps</a>
      <a class="btn" target="_blank" rel="noopener" href="https://waze.com/ul?q=Masjid%20Prima%20Saujana%20Kajang&navigate=yes">Waze</a>
      <a class="btn" target="_blank" rel="noopener" href="https://calendar.google.com/calendar/r/eventedit?text=Walimatul+Urus+Azam+%26+Nazifa&dates=20261226T110000/20261226T150000&ctz=Asia/Kuala_Lumpur&location=Masjid+Prima+Saujana,+Kajang">Simpan Tarikh</a>
    </div>
  </section>

  <section>
    <div class="count" aria-label="Kiraan detik"><div><b id="d">0</b><span>hari</span></div><div><b id="h">0</b><span>jam</span></div><div><b id="m">0</b><span>minit</span></div><div><b id="s">0</b><span>saat</span></div></div>
    <p class="it note">Kehadiran dan doa restu daripada pihak tuan/puan amat kami hargai, semoga majlis ini diberkati serta dirahmati Allah SWT.</p>
    <div class="btns"><button class="btn fill" data-open>RSVP &amp; Ucapan</button></div>
    <svg class="branch" viewBox="0 0 200 200" aria-hidden="true"><use href="#branch"/></svg>
  </section>

  <div class="band">Hubungi: <a href="https://wa.me/60175707840" target="_blank" rel="noopener">017-5707840 (Azam)</a></div>
</main>

<nav class="bar" aria-label="Menu">
  <button id="song" hidden>Lagu</button>
  <button class="pri" data-open>RSVP</button>
  <a href="#tempat">Lokasi</a>
</nav>

<div class="veil" id="veil"></div>
<div class="sheet" id="sheet" role="dialog" aria-label="RSVP">
  <h2>RSVP &amp; Ucapan</h2>
  <p class="sub">Jawapan anda dihantar terus kepada Azam melalui WhatsApp.</p>
  <div class="seg"><button class="sel" data-v="hadir">Hadir</button><button data-v="tidak">Tidak hadir</button></div>
  <label for="n">Nama</label><input id="n" autocomplete="name">
  <label for="p">Nombor telefon</label><input id="p" type="tel" autocomplete="tel">
  <div class="two" id="cnt">
    <div><label for="a">Dewasa</label><select id="a"></select></div>
    <div><label for="k">Kanak-kanak</label><select id="k"></select></div>
  </div>
  <label for="u">Ucapan (pilihan)</label><textarea id="u" rows="2"></textarea>
  <div class="err" id="err"></div>
  <button class="btn fill go" id="send">Hantar melalui WhatsApp</button>
  <a id="wa" target="_blank" rel="noopener" hidden></a>
</div>

<script>
(function(){
  var SONG = ""; // pautan fail MP3 (kosong = butang Lagu disembunyikan)
  var WA = "60175707840", TARGET = new Date("2026-12-26T11:00:00+08:00").getTime();
  var $ = function(i){return document.getElementById(i)}, B = document.body;
  var cover = $("cover"), opened = false, audio = null;

  function open(){
    if(opened) return; opened = true;
    cover.classList.add("go");
    setTimeout(function(){ B.classList.remove("lock"); B.classList.add("on"); petals(); }, 900);
    setTimeout(function(){ cover.style.display = "none"; }, 2000);
    if(audio){ audio.play().catch(function(){}); }
  }
  cover.addEventListener("click", open);
  cover.addEventListener("keydown", function(e){ if(e.key==="Enter"||e.key===" "){e.preventDefault();open();} });

  if(SONG){
    audio = new Audio(SONG); audio.loop = true;
    var sb = $("song"); sb.hidden = false;
    sb.addEventListener("click", function(){
      if(audio.paused){ audio.play().catch(function(){}); sb.textContent="Lagu"; } else { audio.pause(); sb.textContent="Senyap"; }
    });
  }

  function petals(){
    if(matchMedia("(prefers-reduced-motion:reduce)").matches) return;
    for(var i=0;i<9;i++){
      var p=document.createElement("i"); p.className="petal";
      p.style.left=(Math.random()*95)+"vw";
      p.style.animationDuration=(9+Math.random()*7)+"s";
      p.style.animationDelay=(Math.random()*9)+"s";
      p.style.transform="scale("+(.7+Math.random()*.8)+")";
      B.appendChild(p);
    }
  }

  function tick(){
    var t = Math.max(0, TARGET - Date.now()), z = function(n){return String(n)};
    $("d").textContent = z(Math.floor(t/864e5));
    $("h").textContent = z(Math.floor(t%864e5/36e5));
    $("m").textContent = z(Math.floor(t%36e5/6e4));
    $("s").textContent = z(Math.floor(t%6e4/1e3));
  }
  tick(); setInterval(tick, 1000);

  var a=$("a"), k=$("k"), i;
  for(i=1;i<=10;i++) a.add(new Option(i,i));
  for(i=0;i<=9;i++) k.add(new Option(i,i));

  var status = "hadir";
  var segs = document.querySelectorAll(".seg button");
  segs.forEach(function(b){ b.addEventListener("click", function(){
    segs.forEach(function(x){x.classList.remove("sel")}); b.classList.add("sel");
    status = b.dataset.v; $("cnt").style.display = status==="hadir" ? "" : "none";
  }); });

  function sheet(on){ B.classList.toggle("sh", on); }
  document.querySelectorAll("[data-open]").forEach(function(b){ b.addEventListener("click", function(){ sheet(true); }); });
  $("veil").addEventListener("click", function(){ sheet(false); });
  document.addEventListener("keydown", function(e){ if(e.key==="Escape") sheet(false); });

  $("send").addEventListener("click", function(){
    var n=$("n").value.trim(), p=$("p").value.trim(), u=$("u").value.trim();
    if(!n){ $("err").textContent="Sila isi nama anda."; return; }
    $("err").textContent="";
    var m = "Salam, saya " + n + (p ? " (" + p + ")" : "") + " ";
    m += status==="hadir"
      ? "*akan hadir* ke Walimatul Urus Azam & Nazifa pada 26 Disember 2026. Dewasa: " + a.value + ", Kanak-kanak: " + k.value + "."
      : "*tidak dapat hadir* ke Walimatul Urus Azam & Nazifa. Maaf dan terima kasih atas jemputan.";
    if(u) m += "\nUcapan: " + u;
    var l=$("wa"); l.href="https://wa.me/"+WA+"?text="+encodeURIComponent(m); l.click();
    sheet(false);
  });
})();
</script>
</body>
</html>

```
