(function () {
  'use strict';
  const $ = id => document.getElementById(id), C = window.BulletCore, E = window.PracticeEngine;
  const KEY = 'tiny-live-mobile-v2', CORE_CACHE = 'tiny-live-core-v3', VOICE_CACHE = 'tiny-live-voice-v2';
  const CORE_FILES = ['./','index.html','style.css','core.js','engine.js','app.js','manifest.webmanifest','icon.svg','icon-192.png','icon-512.png','voice/model-info.json'];
  const VOICE_FILES = ["voice/vosk.js", "voice/cn.part1.bin", "voice/cn.part2.bin", "voice/cn.part3.bin", "voice/cn.part4.bin", "voice/cn.part5.bin", "voice/cn.part6.bin", "voice/cn.part7.bin", "voice/cn.part8.bin", "voice/cn.part9.bin", "voice/cn.part10.bin", "voice/cn.part11.bin"];
  const sample = '小王 | 这款多少钱？\n刚进来，能再讲一下吗？\n和上一款有什么区别？\n什么时候发货？\n小橘子 | 可以近一点看吗？\n有没有适合新手的？\n买回去不合适怎么办？\n主播再讲一下重点';
  let stored = {};
  try { stored = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (_) {}
  const s = { playing: false, playlist: null, timer: null, clock: null, count: 0, elapsed: 0, view: 'chat', saveTimer: null, toastTimer: null, lane: 0, panel: 'edit', voice: null, model: null, modelURL: null, voiceBusy: false, voiceReady: false, lastReply: 0, lastTopic: '', topicTime: 0, sw: null, installPrompt: null, saveErrorShown: false };
  $('bulletText').value = typeof stored.text === 'string' ? stored.text : '';
  $('interval').value = C.interval(stored.interval === undefined ? 3 : stored.interval); $('intervalNumber').value = $('interval').value;
  $('order').value = stored.order === 'random' ? 'random' : 'sequence'; $('loop').checked = stored.loop !== false;
  $('triggerRules').value = typeof stored.rules === 'string' ? stored.rules : '';
  if (E.scenes[stored.scene]) $('scene').value = stored.scene;
  function toast(text) { clearTimeout(s.toastTimer); $('toast').textContent = text; $('toast').hidden = false; s.toastTimer = setTimeout(() => { $('toast').hidden = true; }, 4100); }
  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify({ text: $('bulletText').value, interval: C.interval($('interval').value), order: $('order').value, loop: $('loop').checked, rules: $('triggerRules').value, scene: $('scene').value })); $('savedLabel').textContent = '已保存在本机'; }
    catch (_) { $('savedLabel').textContent = '暂未保存，请导出备份'; if (!s.saveErrorShown) { toast('浏览器未能保存设置，建议导出 TXT 留存。'); s.saveErrorShown = true; } }
  }
  function makePlaylist() { s.playlist = new C.Playlist(C.parse($('bulletText').value), $('order').value, $('loop').checked); }
  function textChanged() {
    $('lineCount').textContent = String(C.parse($('bulletText').value).length); $('savedLabel').textContent = '正在保存…';
    clearTimeout(s.saveTimer); s.saveTimer = setTimeout(persist, 250); makePlaylist();
  }
  $('bulletText').addEventListener('input', textChanged);
  function setPanel(panel) { s.panel = panel; $('workspace').dataset.panel = panel; for (const key of ['edit','room']) { const active = panel === key; $(key + 'Tab').classList.toggle('active', active); $(key + 'Tab').setAttribute('aria-pressed', String(active)); } }
  $('editTab').addEventListener('click', () => setPanel('edit')); $('roomTab').addEventListener('click', () => setPanel('room'));
  const palettes = [['#f2e8fc','#b296c5'],['#eaf5ef','#8ab19b'],['#fff0e7','#c5a389'],['#ecf0fd','#9ca9cb'],['#fbf2de','#c2af82']];
  function addMessage(item, isVoice) {
    $('emptyStage').hidden = true; s.count++; $('playedCount').textContent = String(s.count); $('tabCount').textContent = String(s.count);
    const name = item.name || E.pick(E.nicknames), palette = E.pick(palettes);
    const row = document.createElement('div'); row.className = 'message';
    const avatar = document.createElement('span'); avatar.className = 'avatar'; avatar.style.background = palette[0]; avatar.style.color = palette[1]; avatar.textContent = Array.from(name)[0];
    const content = document.createElement('div'); content.className = 'message-content';
    const meta = document.createElement('div'); meta.className = 'message-meta'; const who = document.createElement('span'); who.textContent = name; meta.append(who);
    if (isVoice) { const tag = document.createElement('span'); tag.className = 'voice-tag'; tag.textContent = '语音触发'; meta.append(tag); }
    const time = document.createElement('time'); time.textContent = new Date().toLocaleTimeString('zh-CN', { hour:'2-digit', minute:'2-digit' }); meta.append(time);
    const text = document.createElement('p'); text.textContent = item.text; content.append(meta, text); row.append(avatar, content);
    const log = $('messages'), atEnd = log.scrollHeight - log.scrollTop - log.clientHeight < 90; log.append(row); if (log.children.length > 150) log.firstElementChild.remove(); if (atEnd) log.scrollTop = log.scrollHeight;
    if (s.view === 'float') addFloating(item.text, name);
  }
  function addFloating(text, name) {
    const area = $('floating'), lanes = Math.max(3, Math.floor((area.clientHeight - 45) / 52));
    const line = document.createElement('div'); line.className = 'fly'; line.style.top = 18 + ((s.lane++) % lanes) * 52 + 'px';
    const author = document.createElement('small'); author.textContent = name; const body = document.createElement('span'); body.textContent = text; line.append(author, body); area.append(line);
    line.addEventListener('animationend', () => line.remove(), { once:true }); if (area.children.length > 50) area.firstElementChild.remove();
  }
  function emitNext() {
    if (!s.playlist) makePlaylist(); const item = s.playlist.next();
    if (!item) { if (!s.voice) setPlaying(false); if (!C.parse($('bulletText').value).length) toast('先在「我的弹幕」里输入内容，一行一条。'); else if (!$('loop').checked) { $('playState').textContent = '本轮已播完'; toast('这一轮已播完，点「重来」可以从头练。'); } return false; }
    $('roundLabel').textContent = '第 ' + item.round + ' 轮 · ' + item.position + '/' + item.length; addMessage(item, false); return true;
  }
  function schedule() { clearTimeout(s.timer); if (!s.playing || !s.playlist || !s.playlist.items.length) return; s.timer = setTimeout(() => { if (s.playing && emitNext()) schedule(); }, C.interval($('interval').value) * 1000); }
  function setPlaying(playing) {
    if (playing && !C.parse($('bulletText').value).length && !s.voice) { toast('先写几条自己的弹幕，或点「填入示例」。'); setPanel('edit'); $('bulletText').focus(); return; }
    s.playing = playing; $('playLabel').textContent = playing ? '暂停练播' : (s.count || s.elapsed ? '继续练播' : '开始练播'); $('playButton').querySelector('.play-icon').textContent = playing ? 'Ⅱ' : '▶';
    $('stagePause').textContent = playing ? '暂停' : '继续'; $('stage').classList.toggle('paused', !playing); $('playState').textContent = playing ? '● 练习中' : (s.count || s.elapsed ? '已暂停' : '准备好了'); $('playState').className = 'state-badge ' + (playing ? 'live' : s.count ? 'pause' : '');
    clearTimeout(s.timer); clearInterval(s.clock);
    if (playing) {
      setPanel('room'); if (!s.playlist) makePlaylist(); if (!s.count && s.playlist.items.length) emitNext(); schedule();
      s.clock = setInterval(() => { s.elapsed++; $('elapsed').textContent = String(Math.floor(s.elapsed/60)).padStart(2,'0') + ':' + String(s.elapsed%60).padStart(2,'0'); }, 1000);
    } else if (s.voice) stopVoice();
  }
  $('playButton').addEventListener('click', () => setPlaying(!s.playing)); $('stagePause').addEventListener('click', () => setPlaying(!s.playing));
  $('nextButton').addEventListener('click', () => { setPanel('room'); if (emitNext()) schedule(); });
  function clearMessages() { $('messages').replaceChildren(); $('floating').replaceChildren(); $('emptyStage').hidden = false; }
  $('clearButton').addEventListener('click', clearMessages);
  $('restartButton').addEventListener('click', () => { const wasPlaying = s.playing; setPlaying(false); makePlaylist(); clearMessages(); s.count = 0; s.elapsed = 0; $('playedCount').textContent = '0'; $('tabCount').textContent = '0'; $('elapsed').textContent = '00:00'; $('roundLabel').textContent = '第 1 轮'; if (wasPlaying) setPlaying(true); else { $('playLabel').textContent = '开始练播'; $('playState').textContent = '准备好了'; } });
  function changeInterval(from) { const value = C.interval($(from).value); $('interval').value = value; $('intervalNumber').value = value; persist(); schedule(); }
  $('interval').addEventListener('input', () => changeInterval('interval')); $('intervalNumber').addEventListener('change', () => changeInterval('intervalNumber'));
  for (const key of ['order','loop']) $(key).addEventListener('change', () => { makePlaylist(); persist(); schedule(); });
  $('triggerRules').addEventListener('input', () => { clearTimeout(s.saveTimer); s.saveTimer = setTimeout(persist, 250); }); $('scene').addEventListener('change', persist);
  document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => {
    s.view = button.dataset.view; for (const el of document.querySelectorAll('[data-view]')) { const active = el === button; el.classList.toggle('active', active); el.setAttribute('aria-pressed', String(active)); }
    $('messages').hidden = s.view !== 'chat'; $('floating').hidden = s.view !== 'float';
    if (s.view === 'chat') { $('floating').replaceChildren(); $('messages').scrollTop = $('messages').scrollHeight; }
  }));
  async function toggleFullscreen() {
    if ($('preview').classList.contains('focus-mode')) { $('preview').classList.remove('focus-mode'); return; }
    if (document.fullscreenElement) { await document.exitFullscreen(); return; }
    setPanel('room');
    if (matchMedia('(max-width:760px)').matches || !$('preview').requestFullscreen) $('preview').classList.add('focus-mode');
    else { try { await $('preview').requestFullscreen(); } catch (_) { $('preview').classList.add('focus-mode'); } }
  }
  $('fullscreenButton').addEventListener('click', toggleFullscreen); $('stageExit').addEventListener('click', toggleFullscreen);
  document.addEventListener('keydown', event => { if (event.key === 'Escape') $('preview').classList.remove('focus-mode'); if (event.code === 'Space' && !['INPUT','TEXTAREA','SELECT','BUTTON'].includes(document.activeElement.tagName) && !$('offlineDialog').open) { event.preventDefault(); setPlaying(!s.playing); } });
  function validText(text) { if (String(text).length > 1000000) throw new Error('内容超过 1 MB，请分批导入。'); if (C.parse(text).length > 5000) throw new Error('最多设置 5000 条弹幕，请分批使用。'); return text; }
  function replaceText(text) { if ($('bulletText').value.trim() && !window.confirm('替换当前弹幕？需要保留的话，请先点「导出」。')) return; $('bulletText').value = validText(text); textChanged(); persist(); toast('弹幕已更新，可以开始练播。'); }
  $('sampleButton').addEventListener('click', () => replaceText(sample)); $('importButton').addEventListener('click', () => $('importFile').click());
  $('importFile').addEventListener('change', async () => { const file = $('importFile').files[0]; if (!file) return; try { if (file.size > 1000000) throw new Error('文件超过 1 MB，请分批导入。'); let text = await file.text(); if (text.includes('\ufffd')) { toast('文件编码无法正确识别，请另存为 UTF-8 TXT 后再导入。'); return; } replaceText(text.replace(/^\ufeff/,'')); } catch (error) { toast(error.message); } finally { $('importFile').value = ''; } });
  $('exportButton').addEventListener('click', () => { const blob = new Blob(['\ufeff' + $('bulletText').value], { type:'text/plain;charset=utf-8' }), url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = '我的练播弹幕.txt'; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000); });
  function respond(text, forced) {
    if (!forced && !s.playing) return; const now = Date.now(); if (!forced && now - s.lastReply < 5000) return;
    let rules; try { rules = E.parseRules($('triggerRules').value); } catch (error) { if (forced) toast(error.message); return; }
    const reply = E.chooseReply(text, $('scene').value, rules);
    $('transcript').hidden = false; $('transcript').textContent = '主播说：' + text;
    if (!reply) { if (forced) toast('没有匹配的关键词，可以在「更多设置」里添加。'); return; }
    if (!forced && s.lastTopic === reply.topic && now - s.topicTime < 14000) return;
    s.lastReply = now; s.lastTopic = reply.topic; s.topicTime = now; addMessage({ name:'', text:reply.text },true);
  }
  $('testForm').addEventListener('submit', event => { event.preventDefault(); const text = $('testText').value.trim(); if (!text) return; respond(text, true); $('testText').value = ''; });
  async function waitController() {
    if (!('serviceWorker' in navigator)) throw new Error('当前打开方式不支持离线保存，请用 Safari 或 Chrome 打开正式网页。');
    const reg = await navigator.serviceWorker.register('sw.js', {scope:'./'}); await navigator.serviceWorker.ready; s.sw = reg;
    if (!navigator.serviceWorker.controller) await new Promise((resolve, reject) => { const done = () => { clearTimeout(timer); navigator.serviceWorker.removeEventListener('controllerchange', done); resolve(); }; const timer = setTimeout(() => { navigator.serviceWorker.removeEventListener('controllerchange', done); reject(new Error('离线资源已安装，请刷新后再确认。')); }, 10000); navigator.serviceWorker.addEventListener('controllerchange', done); });
  }
  async function checkCoreCache() { if (!window.caches) return false; const cache = await caches.open(CORE_CACHE); const rows = await Promise.all(CORE_FILES.map(file => cache.match(new URL(file,location.href).href))); return rows.every(Boolean); }
  async function cacheCore() {
    if (!isSecureContext) throw new Error('这个局域网连接支持弹幕播放；离线保存请打开手机独立版网页。');
    $('cacheStatus').textContent = '正在保存页面资源…'; await waitController();
    if (!await checkCoreCache()) throw new Error('部分资源未保存完整，请联网刷新后重试。');
    $('cacheStatus').textContent = '自定义弹幕已可离线使用。请添加到桌面，然后断网打开确认。'; $('offlineLabel').textContent = '离线已准备';
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  }
  $('offlineButton').addEventListener('click', () => $('offlineDialog').showModal()); $('closeOffline').addEventListener('click', () => $('offlineDialog').close());
  $('cacheButton').addEventListener('click', async () => { $('cacheButton').disabled = true; try { await cacheCore(); } catch(error) { $('cacheStatus').textContent = error.message; } finally { $('cacheButton').disabled = false; } });
  window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); s.installPrompt = event; $('installButton').hidden = false; });
  $('installButton').addEventListener('click', async () => { if (!s.installPrompt) return; await s.installPrompt.prompt(); s.installPrompt = null; $('installButton').hidden = true; });
  async function cacheVoice() {
    const cache = await caches.open(VOICE_CACHE);
    for (let i = 0; i < VOICE_FILES.length; i++) {
      const url = new URL(VOICE_FILES[i], location.href).href;
      if (await cache.match(url)) continue;
      $('voiceStatus').textContent = '正在准备离线语音资源（' + (i+1) + '/' + VOICE_FILES.length + '），首次约 48 MB…';
      const response = await fetch(url, { cache:'no-store' }); if (!response.ok || response.headers.get('Content-Type')?.includes('text/html')) throw new Error('语音资源暂时不可用，请联网重试。');
      await cache.put(url, response);
    }
    s.voiceReady = true;
  }
  async function loadVoskScript() { if (window.Vosk) return; await new Promise((resolve,reject) => { const script = document.createElement('script'); script.src = 'voice/vosk.js'; script.onload = resolve; script.onerror = () => { script.remove(); reject(new Error('无法加载语音组件')); }; document.head.append(script); }); }
  async function loadBrowserModel() {
    if (s.model) return s.model;
    $('voiceStatus').textContent = '正在加载中文模型，首次可能需要稍等…'; await loadVoskScript();
    const cache = await caches.open(VOICE_CACHE), buffers = [];
    for (const file of VOICE_FILES.slice(1)) { const response = await cache.match(new URL(file,location.href).href); if (!response) throw new Error('语音模型未准备完整，请重新准备。'); buffers.push(await response.arrayBuffer()); }
    s.modelURL = URL.createObjectURL(new Blob(buffers, { type:'application/gzip' }));
    const model = new Vosk.Model(s.modelURL, -1); s.model = model;
    try {
      await new Promise((resolve,reject) => { const timer = setTimeout(() => reject(new Error('这台手机加载模型较慢，请关闭其他页面后重试。')), 90000); model.on('load', message => { clearTimeout(timer); if (message.result) resolve(); else reject(new Error('语音模型未加载成功')); }); model.on('error', message => { clearTimeout(timer); reject(new Error(message.error || '语音模型加载失败')); }); });
      return model;
    } catch (error) { model.terminate(); s.model = null; throw error; }
    finally { if (s.modelURL) { URL.revokeObjectURL(s.modelURL); s.modelURL = null; } }
  }
  async function toggleVoice() {
    if (s.voice) { stopVoice(); return; } if (s.voiceBusy) return;
    if (!isSecureContext || !navigator.mediaDevices || !window.caches) { toast('此连接可练自定义弹幕；手机语音请使用独立版的安全网页入口。'); return; }
    s.voiceBusy = true; $('voiceButton').disabled = true;
    let stream, ctx, recognizer;
    try {
      const cache = await caches.open(VOICE_CACHE); const ready = await Promise.all(VOICE_FILES.map(file => cache.match(new URL(file,location.href).href)));
      if (!ready.every(Boolean)) { await cacheVoice(); $('voiceStatus').textContent = '离线语音资源已准备好，再点一次即可开启麦克风。'; toast('资源已准备好。再点一次「开启语音触发」即可。'); return; }
      ctx = new (window.AudioContext || window.webkitAudioContext)(); const resume = ctx.resume(); const request = navigator.mediaDevices.getUserMedia({ audio:{channelCount:1,echoCancellation:true,noiseSuppression:true}, video:false });
      stream = await request; await resume; const model = await loadBrowserModel();
      recognizer = new model.KaldiRecognizer(ctx.sampleRate); recognizer.on('result', message => { const text = String(message.result.text || '').replace(/\s+/g,''); if (text) respond(text,false); }); recognizer.on('partialresult', message => { const text = String(message.result.partial || '').replace(/\s+/g,''); if (text) { $('transcript').hidden = false; $('transcript').textContent = '正在听：' + text; } });
      const source = ctx.createMediaStreamSource(stream), node = ctx.createScriptProcessor(4096,1,1), mute = ctx.createGain(); mute.gain.value = 0;
      node.onaudioprocess = event => { if (s.voice) recognizer.acceptWaveform(event.inputBuffer); }; source.connect(node); node.connect(mute); mute.connect(ctx.destination);
      s.voice = {stream,ctx,recognizer,source,node,mute}; $('voiceButton').textContent = '关闭语音触发'; $('voiceStatus').textContent = '麦克风已开启，识别在本机进行。说完后稍作停顿。'; setPlaying(true);
    } catch (error) { if (stream) stream.getTracks().forEach(track => track.stop()); if (ctx) ctx.close().catch(() => {}); if (recognizer) recognizer.remove(); $('voiceStatus').textContent = error.name === 'NotAllowedError' ? '麦克风权限未允许，请在浏览器设置中打开。' : error.message; }
    finally { s.voiceBusy = false; $('voiceButton').disabled = false; }
  }
  function stopVoice() { const voice = s.voice; if (!voice) return; s.voice = null; voice.node.onaudioprocess = null; voice.source.disconnect(); voice.node.disconnect(); voice.mute.disconnect(); voice.stream.getTracks().forEach(track => track.stop()); voice.ctx.close().catch(() => {}); voice.recognizer.remove(); $('voiceButton').textContent = '开启语音触发'; $('voiceStatus').textContent = '麦克风已关闭 · 离线模型已就绪'; }
  $('voiceButton').addEventListener('click', toggleVoice);
  document.addEventListener('visibilitychange', () => { if (document.hidden && s.playing) setPlaying(false); });
  window.addEventListener('pagehide', () => { persist(); stopVoice(); if (s.model) { s.model.terminate(); s.model = null; } });
  $('lineCount').textContent = String(C.parse($('bulletText').value).length); makePlaylist();
  if (isSecureContext && 'serviceWorker' in navigator && location.protocol !== 'file:') waitController().then(async () => { if (await checkCoreCache()) { $('offlineLabel').textContent = '离线已准备'; $('cacheStatus').textContent = '页面资源已保存，可以添加到桌面使用。'; } }).catch(() => {});
})();
