/* =====================================================================
   Case File — minimal interaction layer
   1) highlighter-sweep observer   2) lightbox (<dialog>)   3) film strip
   No external libraries. See DESIGN.md.
   ===================================================================== */
(function () {
  "use strict";

  document.documentElement.classList.add("js");

  var reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* ---- 1) Highlighter sweep ------------------------------------------ */
  (function highlighter() {
    var marks = Array.prototype.slice.call(document.querySelectorAll("mark"));
    if (!marks.length) return;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      // static: CSS already renders the full mark; nothing to animate.
      marks.forEach(function (m) {
        m.classList.add("is-marked");
      });
      return;
    }

    // 견고성(P2-11): 백그라운드/가려진 탭에서는 IntersectionObserver가
    // 스로틀되어 above-the-fold 마크가 발화하지 않을 수 있다. 그래서
    // (a) 첫 rAF·load에서 뷰포트 안 마크를 즉시 마킹하고(형광펜 스윕은
    // CSS transition-delay가 그대로 캐스케이드를 만든다),
    // (b) 탭이 다시 포그라운드로 오면 미발화 마크를 flush 한다.
    function inView(el) {
      var r = el.getBoundingClientRect();
      var vh = window.innerHeight || document.documentElement.clientHeight;
      return r.top < vh * 0.92 && r.bottom > 0;
    }
    function flushVisible() {
      marks.forEach(function (m) {
        if (!m.classList.contains("is-marked") && inView(m)) {
          m.classList.add("is-marked");
        }
      });
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("is-marked");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.6 }
    );
    marks.forEach(function (m) {
      io.observe(m);
    });

    requestAnimationFrame(flushVisible);
    window.addEventListener("load", flushVisible);
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) flushVisible();
    });
  })();

  /* ---- 1b) Scrollspy — nav·칩 바 현재위치 표시(P1-8, A2) ------------- */
  /* 현재 섹션에 해당하는 링크에 aria-current="location"을 붙여
     기존 형광펜 밑줄(데스크톱 nav)과 칩 강조(모바일 칩 바)를 상시 노출.
     인덱스에서만 대상 섹션이 존재하고, 상세 페이지 링크(→index.html#…)는
     매칭 섹션이 없어 자동으로 no-op. */
  (function scrollspy() {
    var links = Array.prototype.slice.call(
      document.querySelectorAll(".site-nav a, .chipbar a")
    );
    if (!links.length) return;

    var map = {}; // id -> [링크…] (데스크톱 nav + 모바일 칩이 같은 섹션을 공유)
    var sections = [];
    links.forEach(function (a) {
      var href = a.getAttribute("href") || "";
      var h = href.indexOf("#");
      if (h < 0) return;
      var id = href.slice(h + 1);
      var sec = id && document.getElementById(id);
      if (!sec) return;
      if (!map[id]) {
        map[id] = [];
        sections.push(sec);
      }
      map[id].push(a);
    });
    if (!sections.length) return;

    /* 활성 칩이 화면 밖으로 밀려나 있으면 칩 바를 가로로 스크롤해 가운데로.
       페이지 세로 스크롤에는 손대지 않도록 scrollLeft만 조정한다. */
    function revealChip(id) {
      var chip = null;
      (map[id] || []).forEach(function (a) {
        if (!chip && a.closest && a.closest(".chipbar")) chip = a;
      });
      if (!chip) return;
      var bar = chip.closest(".chipbar");
      if (!bar || !bar.clientWidth) return; // 데스크톱에선 display:none
      var cr = chip.getBoundingClientRect();
      var br = bar.getBoundingClientRect();
      var delta = cr.left + cr.width / 2 - (br.left + br.width / 2);
      if (Math.abs(delta) < 8) return;
      var left = bar.scrollLeft + delta;
      if (bar.scrollTo) {
        bar.scrollTo({ left: left, behavior: reduceMotion ? "auto" : "smooth" });
      } else {
        bar.scrollLeft = left;
      }
    }

    var currentId = null;
    function setCurrent(id) {
      if (id === currentId) return;
      if (currentId && map[currentId]) {
        map[currentId].forEach(function (a) {
          a.removeAttribute("aria-current");
        });
      }
      if (map[id]) {
        map[id].forEach(function (a) {
          a.setAttribute("aria-current", "location");
        });
      }
      currentId = id;
      revealChip(id);
    }

    /* 교차 '비율'이 아니라 '읽는 줄'(뷰포트 상단에서 32% 지점)이 어느 섹션
       안에 있는지로 고른다. 비율 방식은 섹션이 뷰포트보다 훨씬 길면
       (케이스 섹션은 4000px+) 어떤 임계값도 넘지 못해 영영 발화하지 않았다. */
    function update() {
      var line = (window.innerHeight || 800) * 0.32;
      var pickId = null;
      sections.forEach(function (s) {
        var r = s.getBoundingClientRect();
        if (r.top <= line && r.bottom > line) pickId = s.id;
      });
      // 최상단(히어로)에선 아무것도 켜지 않고, 문서 끝에선 마지막 섹션을 켠다
      if (!pickId) {
        var last = sections[sections.length - 1];
        if (last && last.getBoundingClientRect().bottom <= line) pickId = last.id;
        else if (sections[0].getBoundingClientRect().top > line) pickId = null;
        else return; // 섹션 사이 여백 — 직전 상태 유지
      }
      setCurrent(pickId);
    }

    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        update();
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener("load", update);
    update();
  })();

  /* ---- 2) Lightbox + 문서 뷰어(D1) ------------------------------------ */
  /* 두 가지 모드를 한 <dialog>가 처리한다.
     (a) 페이지 모드 — 기존 동작. 페이지의 모든 button.zoom 을 한 갤러리로.
     (b) 문서 모드 — 조상 요소의 data-doc-base/-count 매니페스트로 해당
         문서의 전 페이지 목록을 '합성'한다. 55장을 숨은 <img>로 DOM에
         심지 않으므로 페이지 로드 시 네트워크에 하나도 실리지 않고,
         뷰어를 연 순간 보고 있는 장만 받아온다(lazy 보다 더 늦게 뜬다). */
  (function lightbox() {
    function qsa(sel) {
      return Array.prototype.slice.call(document.querySelectorAll(sel));
    }

    var zoomers = qsa("button.zoom");
    var deckAll = qsa("button.deck-all");
    if (!zoomers.length && !deckAll.length) return;

    function hostOf(btn) {
      return btn.closest ? btn.closest("[data-doc-base]") : null;
    }

    /* (a) 페이지 갤러리 — 문서 스코프 안에 있는 버튼은 빼고 모은다 */
    var pageBtns = zoomers.filter(function (btn) {
      return !hostOf(btn);
    });
    var pageItems = pageBtns.map(function (btn) {
      var img = btn.querySelector("img");
      return {
        src: btn.getAttribute("data-full") || (img && img.currentSrc) || (img && img.src),
        alt: (img && img.getAttribute("alt")) || "",
        cap: btn.getAttribute("data-cap") || ""
      };
    });

    /* (b) 문서 갤러리 — 매니페스트에서 1..N 페이지를 합성 */
    var docCache = {};
    function docItems(host) {
      var base = host.getAttribute("data-doc-base");
      var count = parseInt(host.getAttribute("data-doc-count"), 10) || 0;
      if (docCache[base]) return docCache[base];
      var ext = host.getAttribute("data-doc-ext") || ".webp";
      var title = host.getAttribute("data-doc-title") || "";
      var note = host.getAttribute("data-doc-note") || "";
      var caps = {};
      try {
        caps = JSON.parse(host.getAttribute("data-doc-caps") || "{}");
      } catch (e) {
        caps = {};
      }
      var out = [];
      for (var i = 1; i <= count; i++) {
        var extra = caps[String(i)] || "";
        out.push({
          src: base + i + ext,
          alt: title + " " + i + "쪽" + (extra ? " — " + extra : ""),
          cap:
            title +
            " — " +
            i +
            " / " +
            count +
            (extra ? " · " + extra : "") +
            (note ? " · " + note : "")
        });
      }
      docCache[base] = out;
      return out;
    }

    var dlg = document.createElement("dialog");
    dlg.className = "lightbox";
    dlg.setAttribute("aria-label", "증거 이미지 확대 보기");
    dlg.innerHTML =
      '<button class="lightbox-close" type="button" aria-label="닫기">✕</button>' +
      '<div class="lightbox-inner">' +
      '  <figure class="lightbox-figure">' +
      '    <img alt="" />' +
      "  </figure>" +
      '  <div class="lightbox-controls">' +
      '    <button class="lb-prev" type="button" aria-label="이전 이미지">‹</button>' +
      '    <span class="lightbox-count" aria-live="polite"></span>' +
      '    <button class="lb-next" type="button" aria-label="다음 이미지">›</button>' +
      "  </div>" +
      "</div>";
    document.body.appendChild(dlg);

    var lbImg = dlg.querySelector(".lightbox-figure img");
    var lbCount = dlg.querySelector(".lightbox-count");
    var items = pageItems;
    var idx = 0;

    function render() {
      var it = items[idx];
      if (!it) return;
      lbImg.src = it.src;
      lbImg.alt = it.alt;
      lbCount.textContent = idx + 1 + " / " + items.length;
    }
    function open(list, i) {
      if (!list || !list.length) return;
      items = list;
      idx = Math.max(0, Math.min(list.length - 1, i));
      render();
      if (typeof dlg.showModal === "function") dlg.showModal();
      else dlg.setAttribute("open", "");
    }
    function step(d) {
      idx = (idx + d + items.length) % items.length;
      render();
    }

    zoomers.concat(deckAll).forEach(function (btn) {
      var host = hostOf(btn);
      btn.addEventListener("click", function () {
        if (host) {
          var start = parseInt(btn.getAttribute("data-doc-start"), 10) || 1;
          open(docItems(host), start - 1);
        } else {
          open(pageItems, pageBtns.indexOf(btn));
        }
      });
    });
    dlg.querySelector(".lb-prev").addEventListener("click", function () {
      step(-1);
    });
    dlg.querySelector(".lb-next").addEventListener("click", function () {
      step(1);
    });
    dlg.querySelector(".lightbox-close").addEventListener("click", function () {
      dlg.close();
    });
    // backdrop click closes
    dlg.addEventListener("click", function (e) {
      if (e.target === dlg) dlg.close();
    });
    // arrow keys while open
    dlg.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        step(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        step(1);
      }
    });
  })();

  /* ---- 3) Film strip (F1 deck) --------------------------------------- */
  (function filmstrip() {
    var strips = document.querySelectorAll("[data-filmstrip]");
    Array.prototype.forEach.call(strips, function (strip) {
      var track = strip.querySelector(".filmstrip");
      var counter = strip.querySelector(".filmstrip-counter");
      var figures = track ? track.querySelectorAll("figure") : [];
      if (!track || !figures.length) return;
      var total = figures.length;
      var current = 0;

      function setCounter(i) {
        current = i;
        if (counter) counter.textContent = i + 1 + " / " + total;
      }
      setCounter(0);

      // update counter as user scrolls (centered slide wins)
      if ("IntersectionObserver" in window) {
        var io = new IntersectionObserver(
          function (entries) {
            entries.forEach(function (e) {
              if (e.isIntersecting && e.intersectionRatio >= 0.5) {
                var i = Array.prototype.indexOf.call(figures, e.target);
                if (i >= 0) setCounter(i);
              }
            });
          },
          { root: track, threshold: [0.5, 0.75] }
        );
        Array.prototype.forEach.call(figures, function (f) {
          io.observe(f);
        });
      }

      function goTo(i) {
        i = Math.max(0, Math.min(total - 1, i));
        figures[i].scrollIntoView({
          behavior: reduceMotion ? "auto" : "smooth",
          inline: "center",
          block: "nearest"
        });
        setCounter(i);
      }

      var prev = strip.querySelector(".fs-prev");
      var next = strip.querySelector(".fs-next");
      if (prev)
        prev.addEventListener("click", function () {
          goTo(current - 1);
        });
      if (next)
        next.addEventListener("click", function () {
          goTo(current + 1);
        });

      // arrow-key navigation when the strip has focus
      track.setAttribute("tabindex", "0");
      track.setAttribute("role", "group");
      track.setAttribute("aria-label", "F1 기획 덱 슬라이드, 좌우 방향키로 이동");
      track.addEventListener("keydown", function (e) {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          goTo(current - 1);
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          goTo(current + 1);
        }
      });
    });
  })();

  /* ---- 4) Micro-tilt on evidence photos ------------------------------ */
  /* 커서를 따라 아주 약하게(±2.5° 하드캡) 기운다 — 기존 "반듯해지며
     뜨는" 호버 위에 얹히는 결. transform은 CSS 변수로만 넘겨 기존 호버
     transform과 합성한다. reduced-motion·터치에서는 바인딩하지 않는다. */
  (function microTilt() {
    if (reduceMotion) return;
    if (!window.matchMedia || !window.matchMedia("(pointer: fine)").matches) return;
    var MAX = 2.5; // 하드캡(도). 넘기면 증거 판독성을 해치므로 상수 고정.
    var tiles = document.querySelectorAll(".case-media .zoom, .more-item .zoom");
    Array.prototype.forEach.call(tiles, function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        if (!r.width || !r.height) return;
        var px = (e.clientX - r.left) / r.width; // 0..1
        var py = (e.clientY - r.top) / r.height; // 0..1
        var ry = (px - 0.5) * 2 * MAX; // 좌우 → rotateY
        var rx = (0.5 - py) * 2 * MAX; // 상하 → rotateX
        el.style.setProperty("--tiltY", ry.toFixed(2) + "deg");
        el.style.setProperty("--tiltX", rx.toFixed(2) + "deg");
      });
      el.addEventListener("pointerleave", function () {
        el.style.setProperty("--tiltY", "0deg");
        el.style.setProperty("--tiltX", "0deg");
      });
    });
  })();
})();
