(() => {
  const sessionKey = "tug-of-war.startup-seen";
  const returning = new URLSearchParams(window.location.search).get("return") === "match";
  let seen = returning;
  try {
    seen ||= sessionStorage.getItem(sessionKey) === "1";
    sessionStorage.setItem(sessionKey, "1");
  } catch {}

  if (seen) document.documentElement.dataset.skipStartup = "";

  document.addEventListener("DOMContentLoaded", () => {
    const notice = document.getElementById("startup-notice");
    const countdown = document.getElementById("startup-countdown");
    const game = document.getElementById("play-scroll");
    const duration = Number(countdown.textContent);

    function enterLobby() {
      notice.remove();
      game.inert = false;
      const heading = game.querySelector("h1");
      heading.tabIndex = -1;
      heading.focus({preventScroll: true});
    }

    if (seen) {
      enterLobby();
      return;
    }
    notice.focus({preventScroll: true});

    for (let elapsed = 1; elapsed < duration; elapsed++) {
      window.setTimeout(() => {
        countdown.textContent = String(duration - elapsed);
      }, elapsed * 1000);
    }
    window.setTimeout(enterLobby, duration * 1000);
  });
})();
