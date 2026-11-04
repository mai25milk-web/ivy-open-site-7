/* 絵画・造形教室アイビーオープン
   メニュー・動き・固定ボタン・申込みフォーム。外部ライブラリなし */
(function () {
  'use strict';

  window.ivyReady = true;
  var root = document.documentElement;

  /* ---------- メニュー（スマホ） ---------- */
  var burger = document.querySelector('.burger');
  var nav = document.getElementById('nav');
  var scrim = document.querySelector('.scrim');
  var closeBtn = document.querySelector('.nav__close');

  function setMenu(open) {
    if (!nav || !burger) return;
    nav.classList.toggle('is-open', open);
    scrim.classList.toggle('is-open', open);
    document.body.classList.toggle('is-locked', open);
    burger.setAttribute('aria-expanded', String(open));
    if (open) closeBtn.focus();
  }

  if (burger && nav) {
    burger.addEventListener('click', function () { setMenu(true); });
    closeBtn.addEventListener('click', function () { setMenu(false); burger.focus(); });
    scrim.addEventListener('click', function () { setMenu(false); });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); burger.focus(); }
    });
  }

  /* ---------- 開いたときの動きのスキップ ---------- */
  function finishIntro() {
    root.classList.add('intro-done');
    try { sessionStorage.setItem('ivy-intro', '1'); } catch (e) { /* 保存できなくても動く */ }
    ['pointerdown', 'keydown', 'wheel', 'touchmove'].forEach(function (t) {
      window.removeEventListener(t, finishIntro);
    });
  }
  if (root.classList.contains('js-motion') && !root.classList.contains('intro-done')) {
    ['pointerdown', 'keydown', 'wheel', 'touchmove'].forEach(function (t) {
      window.addEventListener(t, finishIntro, { passive: true });
    });
    window.setTimeout(finishIntro, document.querySelector('.curtain') ? 3100 : 1400);
  }

  /* ---------- スクロールで出る動き ---------- */
  var reveals = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  function showAll() { reveals.forEach(function (el) { el.classList.add('is-in'); }); }

  if (!root.classList.contains('js-motion') || !('IntersectionObserver' in window)) {
    showAll();
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px' });

    reveals.forEach(function (el) {
      /* 今の画面幅で表示していない要素（PC専用・スマホ専用）は待たない */
      if (el.getClientRects().length === 0 || el.classList.contains('reveal--draw')) el.classList.add('is-in');
      else io.observe(el);
    });
  }

  /* ---------- 絵画と造形、それぞれの側で写真がゆっくり切り替わる ---------- */
  var fvPhoto = document.querySelector('.fv__photo');
  if (fvPhoto && root.classList.contains('js-motion')) {
    var isPc = window.matchMedia('(min-width: 768px)').matches;
    var sets = isPc
      ? [['watercolor-hands', 'clay-materials'], ['oil-canvas-easel', 'desk-brushes-clay']]
      : [['oil-canvas-easel', 'desk-brushes-clay'], ['still-life', 'desk-pastels-paper']];
    var line = fvPhoto.querySelector('.fv__line');
    var slides = [[], []];
    ['a', 'b'].forEach(function (name, side) {
      var layer = document.createElement('div');
      layer.className = 'fv__side fv__side--' + name;
      layer.setAttribute('aria-hidden', 'true');
      sets.forEach(function (set, i) {
        var img = document.createElement('img');
        img.className = 'fv__slide';
        img.alt = '';
        img.decoding = 'async';
        img.src = 'assets/img/' + set[side] + '.webp';
        layer.appendChild(img);
        slides[side][i] = img;
      });
      fvPhoto.insertBefore(layer, line);
    });

    var step = 0; /* 0 は最初の写真（重ねない） */
    function setSlide(i, on) {
      slides[0][i].classList.toggle('is-on', on);
      slides[1][i].classList.toggle('is-on', on);
    }
    window.setInterval(function () {
      if (document.hidden || window.pageYOffset > fvPhoto.offsetHeight) return;
      var prev = step;
      step = (step + 1) % (sets.length + 1);
      if (step > 0) setSlide(step - 1, true);
      if (prev > 0) {
        if (step === 0) setSlide(prev - 1, false);
        else window.setTimeout(function () { setSlide(prev - 1, false); }, 3000);
      }
    }, 6000);
  }

  /* ---------- スクロールに合わせて動くもの ---------- */
  if (root.classList.contains('js-motion')) {
    var drifts = Array.prototype.slice.call(document.querySelectorAll('.ph:not(.ph--empty):not(.mapbox)'))
      .filter(function (el) { return el.querySelector('img'); });
    var draws = Array.prototype.slice.call(document.querySelectorAll('.reveal--draw'));
    var ticking = false;

    drifts.forEach(function (el) { el.classList.add('has-drift'); });

    function onFrame() {
      ticking = false;
      var vh = window.innerHeight;

      if (fvPhoto) {
        var p = Math.min(window.pageYOffset / fvPhoto.offsetHeight, 1);
        fvPhoto.style.transform = 'translateY(' + (p * fvPhoto.offsetHeight * .3) + 'px) scale(' + (1 + p * .08) + ')';
        fvPhoto.style.opacity = 1 - p * .6;
      }

      drifts.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        var ratio = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2);
        el.style.setProperty('--drift', (-ratio * r.height * .06) + 'px');
      });

      draws.forEach(function (el) {
        var box = el.parentNode.getBoundingClientRect();
        var done = Math.max(0, Math.min(1, (vh * .85 - box.top) / (box.height + vh * .3)));
        var path = el.querySelector('path');
        if (path) path.style.strokeDashoffset = 1 - done;
        var items = el.parentNode.querySelectorAll('li');
        Array.prototype.forEach.call(items, function (li, i) {
          li.classList.toggle('is-on', done >= i / (items.length - 1) * .96 + .02);
        });
      });
    }
    function requestFrame() {
      if (!ticking) { ticking = true; window.requestAnimationFrame(onFrame); }
    }
    window.addEventListener('scroll', requestFrame, { passive: true });
    window.addEventListener('resize', requestFrame);
    onFrame();
  }

  /* ---------- スマホ固定ボタン：FVのボタンかフォームが見えている間は隠す ---------- */
  var fixbar = document.querySelector('.fixbar');
  var formArea = document.getElementById('apply');
  var fvCta = document.querySelector('.hero .cta, .intro .cta');
  if (fixbar && formArea && 'IntersectionObserver' in window) {
    var seen = new Map();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { seen.set(e.target, e.isIntersecting); });
      var any = false;
      seen.forEach(function (v) { if (v) any = true; });
      fixbar.classList.toggle('is-hidden', any);
    });
    io.observe(formArea);
    if (fvCta) io.observe(fvCta);
  }

  /* ---------- 申込みフォーム ----------
     確認用のページなので、入力内容はどこにも送らない。
     検証が通ったら thanks ページへ移動するだけ */
  var form = document.getElementById('apply-form');
  if (!form) return;

  var submit = form.querySelector('[type="submit"]');
  var gradeField = document.getElementById('field-grade');
  var grade = document.getElementById('grade');

  submit.disabled = false;

  function chosenClass() {
    var r = form.querySelector('input[name="class"]:checked');
    return r ? r.value : '';
  }

  function syncGrade() {
    if (!gradeField) return;
    var page = form.getAttribute('data-page');
    var v = chosenClass();
    /* TOPで未選択のときは見せておき、大人を選んだら隠す */
    var show = v === 'kids' || (v === '' && page === 'top');
    gradeField.hidden = !show;
    if (!show) showError('grade', '');
  }

  function showError(id, msg) {
    var box = document.getElementById('err-' + id);
    var el = document.getElementById(id);
    if (box) { box.textContent = msg; box.hidden = !msg; }
    if (el && el.classList.contains('input')) {
      if (msg) el.setAttribute('aria-invalid', 'true');
      else el.removeAttribute('aria-invalid');
    }
  }

  var rules = [
    ['class', function () { return chosenClass() ? '' : '参加するクラスを1つ選んでください。'; }],
    ['name', function () { return document.getElementById('name').value.trim() ? '' : 'お名前を入力してください。'; }],
    ['grade', function () {
      return !gradeField || gradeField.hidden || chosenClass() !== 'kids' || grade.value ? '' : 'お子さんの学年を選んでください。';
    }],
    ['email', function () {
      var v = document.getElementById('email').value.trim();
      if (!v) return 'メールアドレスを入力してください。';
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'メールアドレスの形を確認してください（例：name@example.com）。';
    }],
    ['agree', function () { return document.getElementById('agree').checked ? '' : '個人情報の取り扱いへの同意にチェックを入れてください。'; }]
  ];

  form.addEventListener('change', function (e) {
    if (e.target.name === 'class') { syncGrade(); showError('class', ''); }
  });
  form.addEventListener('input', function (e) {
    if (e.target.id) showError(e.target.id, '');
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var first = null;
    rules.forEach(function (rule) {
      var msg = rule[1]();
      showError(rule[0], msg);
      if (msg && !first) first = rule[0];
    });
    if (first) {
      var target = document.getElementById(first) || form.querySelector('input[name="class"]');
      target.focus();
      return;
    }
    window.location.href = form.getAttribute('data-thanks');
  });

  syncGrade();
})();

// Instagram の埋め込みは読み込み後に高さが変わるので、スクロール位置を計算し直す
(function () {
  var box = document.querySelector('.ig-embeds'), t;
  if (!box || !window.ScrollTrigger || !window.ResizeObserver) return;
  new ResizeObserver(function () { clearTimeout(t); t = setTimeout(function () { ScrollTrigger.refresh(); }, 200); }).observe(box);
})();
