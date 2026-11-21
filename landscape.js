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
