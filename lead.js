(function () {
  function handleLeadSubmit() {
    if (window.umami) {
      window.umami.track("Lead");
    }
  }

  document.addEventListener("submit", handleLeadSubmit, true);
})();
