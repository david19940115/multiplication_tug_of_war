const sidewaysView = window.matchMedia("(orientation: portrait) and (any-pointer: coarse)");

function landscapeRect(element) {
  const rect = element.getBoundingClientRect();
  if (!sidewaysView.matches) return rect;

  const surface = document.getElementById("play-area").getBoundingClientRect();
  return {
    left: rect.top - surface.top,
    top: surface.right - rect.right,
    width: rect.height,
    height: rect.width
  };
}

document.addEventListener("DOMContentLoaded", () => {
  const viewport = document.getElementById("play-viewport");
  const content = document.getElementById("play-scroll");

  function pinOverlays() {
    if (sidewaysView.matches) {
      viewport.style.setProperty("--rotated-scroll", `${Math.max(0, -viewport.scrollLeft)}px`);
    }
  }

  function updateScrollExtent() {
    if (!sidewaysView.matches) {
      viewport.style.removeProperty("--rotated-track-width");
      viewport.style.removeProperty("--rotated-scroll");
      return;
    }
    viewport.style.setProperty("--rotated-track-width", `${Math.max(viewport.clientWidth, content.scrollHeight)}px`);
    pinOverlays();
  }

  const observer = new ResizeObserver(updateScrollExtent);
  observer.observe(content);
  viewport.addEventListener("scroll", pinOverlays, {passive: true});
  sidewaysView.addEventListener("change", updateScrollExtent);
  updateScrollExtent();
});
