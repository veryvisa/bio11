/* Bio 11: language switch + 🔊.
   🔊 plays a real human recording (Wikimedia Commons, see credits.html) when the term has one (data-audio).
   Terms without a recording (data-tts) use speech only with a natural-sounding voice picked by name; if this device has
   no such voice the button stays hidden (CSS: html.tts-ok shows it). Never the browser's default voice, never autoplay. */
(function () {
  var root = document.documentElement;
  /* 'Last time' for the hub (2026-11-19): remember the last study page of this course (not the home page) so the
     BC Teen Pathways home can offer 'Continue: <page>'. Same origin, this browser only; nothing is uploaded. */
  try { if (!/(^|\/)(index\.html)?$/.test(location.pathname)) localStorage.setItem('teen:last:bio11', JSON.stringify({ u: location.pathname + location.search, t: document.title.split(' · ')[0], ts: Date.now() })); } catch (e) { }
  function setLang(l) { root.setAttribute('data-lang', l); try { localStorage.setItem('bio11.lang', l); localStorage.setItem('teen:lang', l); } catch (e) { }  /* teen:lang: one language choice for the whole study-site family */ }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-set-lang]'); if (b) { setLang(b.getAttribute('data-set-lang')); return; }
    var s = e.target.closest && e.target.closest('[data-say]'); if (s) { e.preventDefault(); say(s); return; }
    var y = e.target.closest && e.target.closest('.yt[data-yt]'); if (y) { e.preventDefault(); loadVideo(y); }
  });
  /* click-to-load video: nothing from YouTube is requested until the student taps; youtube-nocookie, no related videos */
  function loadVideo(b) {
    var wrap = document.createElement('div'); wrap.className = 'yt-frame';
    var f = document.createElement('iframe');
    f.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(b.getAttribute('data-yt')) + '?rel=0&autoplay=1&start=' + (parseInt(b.getAttribute('data-start'), 10) || 0);
    f.title = b.getAttribute('aria-label') || 'Video';
    f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen'; f.setAttribute('allowfullscreen', ''); f.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    wrap.appendChild(f); b.replaceWith(wrap);
  }

  /* ---- voice choice (pure function, tested by tools/voice_test.py) ---- */
  var NOVELTY = /\b(Fred|Albert|Zarvox|Trinoids|Whisper|Bad News|Good News|Bahh|Bells|Boing|Bubbles|Cellos|Jester|Organ|Superstar|Wobble|Junior|Ralph|Kathy|Princess|Deranged|Hysterical|Agnes|Bruce|Vicki|Victoria|Grandma|Grandpa|Rocko|Shelley|Sandy|Flo|Eddy|Reed)\b|espeak|eSpeak|mbrola|festival|pico/i;
  var NAMED = /^(Samantha|Ava|Allison|Susan|Zoe|Evan|Nathan|Tom|Joelle|Noelle|Nicky|Aaron|Siri)\b/i;
  var CLOUD_OK = /^(Google US English|Microsoft (Aria|Jenny|Guy|Ana|Michelle|Christopher|Eric|Roger|Steffan|Clara|Liam|Emma|Brian|Andrew|Ava)\b.*(Natural|Online))/i;
  function na(v) { return /^en[-_](US|CA)$/i.test(v.lang || ''); }
  function score(v) {
    if (!v || !na(v) || NOVELTY.test(v.name || '')) return -1;
    var n = v.name || '';
    if (NAMED.test(n) && /(Premium|Enhanced)/i.test(n)) return 50;
    if (CLOUD_OK.test(n)) return 40;
    if (NAMED.test(n)) return 30;
    if (/(Premium|Enhanced|Natural|Neural)/i.test(n)) return 25;
    if (v.localService && /^(English|Google)/i.test(n)) return 10;   /* Android / ChromeOS system English voices */
    if (v.localService && /^en[-_]CA$/i.test(v.lang)) return 6;
    if (v.localService) return 5;
    return -1;
  }
  function pickVoice(list) {
    var best = null, bs = 0;
    for (var i = 0; i < (list || []).length; i++) { var s = score(list[i]); if (s > bs) { bs = s; best = list[i]; } }
    return best;
  }
  window.bio11Voice = { pick: pickVoice, score: score };

  var synth = window.speechSynthesis, voice = null;
  function load() {
    try { voice = pickVoice(synth ? synth.getVoices() : []); } catch (e) { voice = null; }
    root.classList.toggle('tts-ok', !!voice);
  }
  if (synth && typeof SpeechSynthesisUtterance !== 'undefined') { load(); try { synth.addEventListener('voiceschanged', load); } catch (e) { } }

  var player = null, cur = null;
  function on(btn) { btn.classList.add('on'); cur = btn; }
  function off() { if (cur) cur.classList.remove('on'); cur = null; }
  function speak(btn) {
    if (!voice) return false;                     /* no natural voice: say nothing rather than a robot */
    try {
      synth.cancel();
      var u = new SpeechSynthesisUtterance(btn.getAttribute('data-say'));
      u.voice = voice; u.lang = voice.lang; u.rate = 0.85;
      u.onstart = function () { on(btn); }; u.onend = u.onerror = off;
      synth.speak(u); return true;
    } catch (e) { return false; }
  }
  function say(btn) {
    off();
    if (player) { try { player.pause(); } catch (e) { } }
    var src = btn.getAttribute('data-audio');
    if (src) {
      player = new Audio(src); on(btn);
      player.onended = off;
      player.onerror = function () { off(); speak(btn); };
      var p = player.play(); if (p && p.catch) p.catch(function () { off(); });
      return;
    }
    speak(btn);
  }
})();
