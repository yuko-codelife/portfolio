/* =========================================================
   Quiet Conversation ― script.js
   ・ヘッダーのスクロール状態
   ・モバイルナビゲーションの開閉
   ・Hero: 障子が開くような横スライド（PC / スクロール連動）
   ・セクションのフェードイン（IntersectionObserver）
   ・お問い合わせフォームの簡易送信処理
   すべて prefers-reduced-motion に対応しています。
========================================================= */

(function () {
  "use strict";

  const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const prefersReducedMotion = () => reduceMotionQuery.matches;

  /* -----------------------------------------------------
     1. Header: スクロールで背景・罫線を表示
  ----------------------------------------------------- */
  const header = document.getElementById("siteHeader");

  function updateHeaderState() {
    if (window.scrollY > 12) {
      header.classList.add("is-scrolled");
    } else {
      header.classList.remove("is-scrolled");
    }
  }
  updateHeaderState();
  window.addEventListener("scroll", updateHeaderState, { passive: true });


  /* -----------------------------------------------------
     2. モバイルナビゲーションの開閉
  ----------------------------------------------------- */
  const navToggle = document.getElementById("navToggle");
  const primaryNav = document.getElementById("primaryNav");

  if (navToggle && primaryNav) {
    navToggle.addEventListener("click", () => {
      const isOpen = primaryNav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });

    // ナビ内リンクをクリックしたら閉じる
    primaryNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        primaryNav.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }


  /* -----------------------------------------------------
     3. Hero ― 「本の表紙」構造のスクロール連動演出（PC）

     .hero は 100vh + 70vh の高さを持ち、中の .hero-pin が
     position: sticky で画面に固定されている。
     この“70vh 分の余白”をスクロールしている間だけ、
     写真ページ（.hero-photo）を右へスライドさせて画面外まで抜く。
     アニメーションするのは写真だけで、表紙コピーや
     次の Introduction セクションには一切手を加えない。
     写真が完全に抜けた時点で sticky が自然に解除され、
     Introduction は通常のスクロールで現れる
     （＝すでにそこで待っていたかのように見える）。
  ----------------------------------------------------- */
  const hero = document.getElementById("hero");
  const heroPhoto = document.getElementById("heroPhoto");

  const DESKTOP_BREAKPOINT = 880;

  function isDesktopHero() {
    return window.innerWidth > DESKTOP_BREAKPOINT;
  }

  function updateHeroMotion() {
    if (!hero || !heroPhoto) return;

    if (!isDesktopHero() || prefersReducedMotion()) {
      heroPhoto.style.transform = "";
      return;
    }

    const rect = hero.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    // sticky が有効な区間（= hero の高さ - 1画面分）が
    // スクロールされた割合を 0〜1 で求める
    const scrollableDistance = hero.offsetHeight - viewportHeight;
    const scrolled = -rect.top;
    const progress = Math.min(Math.max(scrolled / scrollableDistance, 0), 1);

    // 写真ページを右へスライドし、完全に画面外（自身の幅の120%）まで抜く
    heroPhoto.style.transform = `translateX(${progress * 120}%)`;
  }

  window.addEventListener("scroll", updateHeroMotion, { passive: true });
  window.addEventListener("resize", updateHeroMotion);
  updateHeroMotion();

  // スクロール誘導のクリックで滑らかに Introduction へ
  const scrollCue = document.querySelector("[data-scroll-cue]");
  if (scrollCue) {
    scrollCue.addEventListener("click", (e) => {
      const target = document.querySelector(scrollCue.getAttribute("href"));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({
          behavior: prefersReducedMotion() ? "auto" : "smooth",
          block: "start",
        });
      }
    });
  }


  /* -----------------------------------------------------
     4. セクションの静かなフェードイン
  ----------------------------------------------------- */
  const revealTargets = document.querySelectorAll(
    ".section-kicker, .section-heading, .body-lead, .body-text, " +
    ".philosophy-figure, .philosophy-words li, .process-step, .work-item, .case-story, .case-reveal, " +
    ".profile-figure, .profile-text, .contact-figure, .contact-body, .intro-text"
  );

  revealTargets.forEach((el) => el.classList.add("reveal-on-scroll"));

  if ("IntersectionObserver" in window && !prefersReducedMotion()) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {threshold: 0.01,rootMargin: "0px 0px -40px 0px"}
    );
    revealTargets.forEach((el) => observer.observe(el));
  } else {
    // reduced-motion、または IntersectionObserver 非対応環境では即表示
    revealTargets.forEach((el) => el.classList.add("is-visible"));
  }


  /* -----------------------------------------------------
     4b. Introduction 写真 ― カーテンが開くような一方向のリビール
     フェードやパララックスは使わず、"is-revealed" を一度だけ付与して
     覆っている面（.intro-photo-curtain）を静かにスライドさせるだけ。
  ----------------------------------------------------- */
  const introPhotoFrame = document.getElementById("introPhotoFrame");

  if (introPhotoFrame) {
    if ("IntersectionObserver" in window && !prefersReducedMotion()) {
      const photoObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-revealed");
              photoObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.35 }
      );
      photoObserver.observe(introPhotoFrame);
    } else {
      introPhotoFrame.classList.add("is-revealed");
    }
  }


  /* -----------------------------------------------------
     5. お問い合わせフォーム（デモ用の簡易送信処理）
     実際のサイトでは、ここを送信先API / メールサービスに
     接続してください（例: fetch('/api/contact', {...})）。
  ----------------------------------------------------- */
  const contactForm = document.getElementById("contactForm");
  const formNote = document.getElementById("formNote");

  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const name = contactForm.name.value.trim();
      const email = contactForm.email.value.trim();
      const message = contactForm.message.value.trim();

      if (!name || !email || !message) {
        formNote.textContent = "すべての項目をご記入ください。";
        return;
      }

      // ここではデモとして成功メッセージのみ表示します。
      formNote.textContent = "メッセージを受け取りました。あらためてご連絡いたします。";
      contactForm.reset();
    });
  }

})();