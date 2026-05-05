(function glitchEngine() {
  const badge      = document.getElementById('lanyard-badge');
  const barsEl     = document.getElementById('glitch-bars');
  const trackEl    = document.getElementById('vhs-track');

  /* -- glitch bars: random horizontal slices that offset/colorize -- */
  const BAR_COLORS = [
    'rgba(243,139,168,.18)', // red
    'rgba(137,180,250,.14)', // blue
    'rgba(203,166,247,.12)', // mauve
    'rgba(255,255,255,.07)', // white flash
  ];

  function spawnGlitchBars() {
    barsEl.innerHTML = '';
    const count = 2 + Math.floor(Math.random() * 4);
    const h = badge.offsetHeight;
    for (let i = 0; i < count; i++) {
      const bar = document.createElement('div');
      bar.className = 'glitch-bar';
      const top    = Math.random() * h;
      const height = 1 + Math.random() * 14;
      const shift  = (Math.random() - .5) * 18;
      const color  = BAR_COLORS[Math.floor(Math.random() * BAR_COLORS.length)];
      bar.style.cssText = `
        top:${top}px; height:${height}px;
        background:${color};
        transform:translateX(${shift}px);
        opacity:1;
      `;
      barsEl.appendChild(bar);
    }
  }

  function clearGlitchBars() { barsEl.innerHTML = ''; }

  function triggerGlitch() {
    spawnGlitchBars();
    const dur = 60 + Math.random() * 120;
    setTimeout(() => {
      clearGlitchBars();
      /* sometimes do a double-hit */
      if (Math.random() < .35) {
        setTimeout(() => {
          spawnGlitchBars();
          setTimeout(clearGlitchBars, 50 + Math.random() * 80);
        }, 80 + Math.random() * 100);
      }
    }, dur);
    scheduleGlitch();
  }

  function scheduleGlitch() {
    const next = 1200 + Math.random() * 4800;
    setTimeout(triggerGlitch, next);
  }
  scheduleGlitch();

  /* -- VHS tracking line: scrolls top→bottom periodically -- */
  let trackY = -4, trackRaf = null, trackActive = false;

  function animateTrack() {
    const h = badge.offsetHeight;
    trackY += 2.5;
    trackEl.style.top    = trackY + 'px';
    trackEl.style.opacity = trackY > h * .15 && trackY < h * .85 ? '.85' : '.3';
    if (trackY < h + 6) {
      trackRaf = requestAnimationFrame(animateTrack);
    } else {
      trackEl.style.opacity = '0';
      trackActive = false;
      scheduleTrack();
    }
  }

  function fireTrack() {
    if (trackActive) return;
    trackActive = true;
    trackY = -4;
    if (trackRaf) cancelAnimationFrame(trackRaf);
    animateTrack();
  }

  function scheduleTrack() {
    setTimeout(fireTrack, 3000 + Math.random() * 7000);
  }
  scheduleTrack();
})();

/* ══════════════ LANYARD ══════════════ */
(function () {
  const USER_ID    = '801089753038061669';
  const LANYARD_WS = 'wss://api.lanyard.rest/socket';
  const CDN        = 'https://cdn.discordapp.com';
  const badge      = document.getElementById('lanyard-badge');

  const esc = s => String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  const statusLabel = s =>
    ({online:'online ♡',idle:'idle zzz',dnd:'do not disturb',offline:'offline'})[s]||'offline';

  function activityTag(type) {
    return ({
      0:['game','tag-game'],1:['stream','tag-stream'],
      2:['music','tag-music'],3:['watch','tag-watch'],
      4:['custom','tag-custom'],5:['compe','tag-compete']
    })[type]||['app','tag-custom'];
  }

  function elapsed(start) {
    if (!start) return '';
    const s=Math.floor((Date.now()-start)/1000);
    const m=Math.floor(s/60),h=Math.floor(m/60);
    if(h>0)return`${h}h ${m%60}m`;
    if(m>0)return`${m}m ${s%60}s`;
    return`${s}s`;
  }

  function artUrl(act) {
    if (!act.assets) return null;
    const img = act.assets.large_image||act.assets.small_image;
    if (!img) return null;
    if (img.startsWith('mp:external/'))
      return `https://media.discordapp.net/external/${img.replace('mp:external/','')}`;
    if (img.startsWith('spotify:')) return null;
    return `${CDN}/app-assets/${act.application_id}/${img}.png`;
  }

  function avatarUrl(data) {
    const u=data.discord_user;
    if (!u) return `${CDN}/embed/avatars/0.png`;
    if (u.avatar)
      return `${CDN}/avatars/${u.id}/${u.avatar}.${u.avatar.startsWith('a_')?'gif':'png'}?size=128`;
    return `${CDN}/embed/avatars/${Number(BigInt(u.id)>>22n)%6}.png`;
  }

  function renderAct(act, data) {
    const [tagTxt,tagCls]=activityTag(act.type);

    if (act.type===2&&data.listening_to_spotify) {
      const sp=data.spotify||{};
      const art=sp.album_art_url
        ?`<img class="activity-art" src="${esc(sp.album_art_url)}" alt="" onerror="this.style.display='none'">`
        :'<div class="activity-art"></div>';
      const artist=(sp.artist||act.state||'').replace(/;/g,', ');
      const elap=act.timestamps?.start
        ?`<div class="activity-elapsed"><span class="live-dot"></span><span>${elapsed(act.timestamps.start)}</span></div>`:'';
      return `<div class="activity-item">
        <div class="activity-type-tag ${tagCls}">${tagTxt}</div>
        <div class="activity-art-wrap">${art}</div>
        <div class="activity-info">
          <div class="activity-name">${esc(sp.song||act.details||'')}</div>
          <div class="activity-detail">${esc(artist)}</div>
          <div class="activity-album">${esc(sp.album||'')}</div>
          ${elap}
        </div>
      </div>`;
    }

    const imgUrl=artUrl(act);
    const imgTag=imgUrl?`<img class="activity-art" src="${esc(imgUrl)}" alt="" onerror="this.style.display='none'">`:''
    const smUrl=act.assets?.small_image&&act.application_id
      ?`${CDN}/app-assets/${act.application_id}/${act.assets.small_image}.png`:'';
    const smTag=smUrl&&imgUrl
      ?`<img class="activity-art-small" src="${esc(smUrl)}" alt="" onerror="this.style.display='none'">`:''
    const elap=act.timestamps?.start
      ?`<div class="activity-elapsed"><span class="live-dot"></span><span>${elapsed(act.timestamps.start)}</span></div>`:'';

    return `<div class="activity-item">
      ${imgUrl?`<div class="activity-art-wrap">${imgTag}${smTag}</div>`:''}
      <div class="activity-info">
        <div class="activity-name">${esc(act.name||'')}</div>
        ${act.details?`<div class="activity-detail">${esc(act.details)}</div>`:''}
        ${act.state  ?`<div class="activity-detail">${esc(act.state)}</div>`:''}
        ${elap}
      </div>
      <div class="activity-type-tag ${tagCls}">${tagTxt}</div>
    </div>`;
  }

  let tickTimer=null;

  function render(data) {
    if (tickTimer) clearInterval(tickTimer);

    const u      = data.discord_user||{};
    const status = data.discord_status||'offline';
    const acts   = (data.activities||[]).filter(a=>a.type!==4);
    const custom = (data.activities||[]).find(a=>a.type===4);
    const custTxt= [custom?.emoji?.name,custom?.state].filter(Boolean).join(' ');
    const uname  = esc(u.global_name||u.username||'unknown');

    const platforms=['desktop','mobile','web'].map(p=>{
      const on=(p==='desktop'&&data.active_on_discord_desktop)
             ||(p==='mobile' &&data.active_on_discord_mobile)
             ||(p==='web'    &&data.active_on_discord_web);
      return `<div class="platform-pill${on?' active':''}">
        <div class="platform-dot"></div>${p}
      </div>`;
    }).join('');

    const actsHtml=acts.length
      ?`<div class="badge-activities">
           <div class="activity-section-label">now active</div>
           ${acts.map(a=>renderAct(a,data)).join('')}
         </div>`
      :`<div class="no-activity">nothing playing right now</div>`;

    /* preserve glitch overlay elements across re-render */
    badge.innerHTML=`
      <div class="vhs-lines"></div>
      <div class="glitch-bars" id="glitch-bars"></div>
      <div id="vhs-track" style="position:absolute;left:0;right:0;z-index:31;pointer-events:none;height:2px;background:linear-gradient(90deg,transparent 0%,rgba(243,139,168,.35) 20%,rgba(255,255,255,.18) 50%,rgba(137,180,250,.3) 80%,transparent 100%);opacity:0;mix-blend-mode:screen;"></div>

      <div class="badge-ribbon"></div>

      <div class="badge-header">
        <div class="badge-header-deco">✦ ✧ ✦</div>
        <div class="badge-avatar-wrap">
          <div class="badge-avatar-ring"></div>
          <img class="badge-avatar" src="${esc(avatarUrl(data))}" alt=""
               onerror="this.src='${CDN}/embed/avatars/0.png'">
        </div>
        <div class="badge-header-text">

          <div class="badge-username" data-text="${uname}">${uname}</div>
          <div class="badge-handle">${u.username?'@'+esc(u.username):''} • It/She/They</div>
        </div>
      </div>

      <div class="badge-status-row">
        <div class="badge-status-pill" data-status="${status}">
          <div class="status-pill-dot"></div>
          ${statusLabel(status)}
        </div>
      </div>
      <div class="badge-custom-status">
        ${custTxt?esc(custTxt):'<span style="color:var(--overlay0);font-style:italic">no status message set ♡</span>'}
      </div>

      <div class="badge-divider"></div>
      ${actsHtml}
      <div class="badge-platforms">${platforms}</div>
      <div class="badge-footer">
        <div class="badge-footer-id">${USER_ID}</div>
        <div class="badge-footer-hearts">♡ ♡ ♡</div>
      </div>
      <div class="badge-ribbon-bottom"></div>
    `;

    if (acts.some(a=>a.timestamps?.start)) {
      tickTimer=setInterval(()=>{
        badge.querySelectorAll('.activity-elapsed span:last-child').forEach((el,i)=>{
          const a=acts[i];
          if(a?.timestamps?.start) el.textContent=elapsed(a.timestamps.start);
        });
      },1000);
    }
  }

  let ws,hbInterval;
  function connect() {
    ws=new WebSocket(LANYARD_WS);
    ws.onmessage=({data:raw})=>{
      const msg=JSON.parse(raw);
      if(msg.op===1){
        hbInterval=setInterval(
          ()=>ws.readyState===1&&ws.send(JSON.stringify({op:3})),
          msg.d.heartbeat_interval
        );
        ws.send(JSON.stringify({op:2,d:{subscribe_to_id:USER_ID}}));
      }
      if(msg.op===0&&(msg.t==='INIT_STATE'||msg.t==='PRESENCE_UPDATE')) render(msg.d);
    };
    ws.onclose=()=>{clearInterval(hbInterval);setTimeout(connect,5000)};
    ws.onerror=()=>ws.close();
  }
  connect();
})();