(function () {
  function startUmami() {
    const websiteIds = {
      "lps.exame.com": "11d5f6f9-2d0e-4ecb-a90d-ab6408c2b313",
      "lps.saintpaul.com.br": "ea330008-5957-494d-8591-7265c3887af4",
    };
    let hasLead = false;

    const websiteId = websiteIds[location.hostname];
    if (!websiteId) return;
    if (document.querySelector('script[src*="umami.striker.marketing"]')) return;

    const script = document.createElement("script");
    script.src = "https://umami.striker.marketing/script.js";
    script.setAttribute("data-website-id", websiteId);

    script.onload = () => {
      document.head.appendChild(
        Object.assign(document.createElement("script"), {
          src: "https://cdn.jsdelivr.net/gh/Striker-Marketing/HandleUmamiTracking@1/script.min.js?cb=" + Math.floor(Date.now() / 600000),
        }),
      );
      document.addEventListener("submit", (e) => {
        if (hasLead) return;
        const action = e.target.getAttribute("action");
        if (action && action.includes("facebook")) return;
        if (window.umami) {
          window.umami.track("Lead");
          hasLead = true;
        }
      });
    };

    script.onerror = () => {
      console.error("Failed to load Umami script");
    };

    document.head.appendChild(script);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startUmami);
  } else {
    startUmami();
  }
})();
