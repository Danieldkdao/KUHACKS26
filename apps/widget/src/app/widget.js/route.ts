import { NextResponse } from "next/server";

export async function GET() {
  const script = `
(function () {
  if (window.__KU_WIDGET_INITIALIZED__) return;
  window.__KU_WIDGET_INITIALIZED__ = true;

  const currentScript =
    document.currentScript ||
    Array.from(document.getElementsByTagName("script")).find((script) =>
      script.src.includes("/widget.js")
    );

  if (!currentScript) return;

  const widgetId = currentScript.getAttribute("data-widget-id") || "";
  const position = currentScript.getAttribute("data-position") || "bottom-right";
  const theme = currentScript.getAttribute("data-theme") || "light";
  const baseUrl = new URL(currentScript.src).origin;

  const iframeUrl =
    baseUrl +
    "/embed?widgetId=" +
    encodeURIComponent(widgetId) +
    "&theme=" +
    encodeURIComponent(theme);

  const launcher = document.createElement("button");
  launcher.type = "button";
  launcher.setAttribute("aria-label", "Open chat");
  launcher.innerText = "Chat";
  launcher.style.position = "fixed";
  launcher.style.zIndex = "999999";
  launcher.style.width = "56px";
  launcher.style.height = "56px";
  launcher.style.borderRadius = "9999px";
  launcher.style.border = "0";
  launcher.style.cursor = "pointer";
  launcher.style.background = "#155dfc";
  launcher.style.color = "white";
  launcher.style.fontSize = "14px";
  launcher.style.fontWeight = "600";
  launcher.style.boxShadow = "0 10px 25px rgba(0,0,0,0.18)";

  const panel = document.createElement("div");
  panel.style.position = "fixed";
  panel.style.zIndex = "999998";
  panel.style.width = "440px";
  panel.style.height = "800px";
  panel.style.maxWidth = "calc(100vw - 24px)";
  panel.style.maxHeight = "calc(100vh - 88px)";
  panel.style.borderRadius = "18px";
  panel.style.overflow = "hidden";
  panel.style.boxShadow = "0 18px 45px rgba(0,0,0,0.22)";
  panel.style.background = "white";
  panel.style.display = "none";

  const iframe = document.createElement("iframe");
  iframe.src = iframeUrl;
  iframe.title = "Embedded chat widget";
  iframe.style.width = "100%";
  iframe.style.height = "100%";
  iframe.style.border = "0";
  iframe.style.background = "transparent";
  iframe.allow = "clipboard-write";
  panel.appendChild(iframe);

  if (position === "bottom-left") {
    launcher.style.left = "24px";
    launcher.style.bottom = "24px";
    panel.style.left = "24px";
    panel.style.bottom = "92px";
  } else {
    launcher.style.right = "24px";
    launcher.style.bottom = "24px";
    panel.style.right = "24px";
    panel.style.bottom = "92px";
  }

  let isOpen = false;

  const updatePanel = () => {
    panel.style.display = isOpen ? "block" : "none";
  };

  launcher.addEventListener("click", () => {
    isOpen = !isOpen;
    updatePanel();
  });

  document.body.appendChild(panel);
  document.body.appendChild(launcher);

  window.addEventListener("message", (event) => {
    if (event.origin !== baseUrl) return;
    if (!event.data || typeof event.data !== "object") return;

    if (event.data.type === "KU_WIDGET_CLOSE") {
      isOpen = false;
      updatePanel();
    }

    if (
      event.data.type === "KU_WIDGET_RESIZE" &&
      typeof event.data.height === "number"
    ) {
      panel.style.height = Math.min(event.data.height, window.innerHeight - 88) + "px";
    }
  });
})();
  `;

  return new NextResponse(script, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      // "Cache-Control": "public, max-age=300",
    },
  });
}
