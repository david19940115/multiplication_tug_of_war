(() => {
  const notice = document.getElementById("startup-notice");
  const countdown = document.getElementById("startup-countdown");
  const game = document.getElementById("play-scroll");
  const duration = Number(countdown.textContent);
  notice.focus({preventScroll: true});

  for (let elapsed = 1; elapsed < duration; elapsed++) {
    window.setTimeout(() => {
      countdown.textContent = String(duration - elapsed);
    }, elapsed * 1000);
  }
  window.setTimeout(() => {
    notice.remove();
    game.inert = false;
    const heading = game.querySelector("h1");
    heading.tabIndex = -1;
    heading.focus({preventScroll: true});
  }, duration * 1000);
})();
