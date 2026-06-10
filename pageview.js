(function () {
  window.dataLayer = window.dataLayer || [];

  // ===============================
  // CONFIGURAÇÕES
  // ===============================
  var STORAGE_KEY = "exame_tracking_data";

  var ANONYMOUS_ID_KEY = "exame_anonymous_id";
  var BROWSER_ID_KEY = "exame_browser_id";
  var COOKIE_ID_KEY = "exame_cookie_id";
  var SESSION_ID_KEY = "exame_session_id";
  var SESSION_LAST_SEEN_KEY = "exame_session_last_seen";

  var AID_PARAM = "aid";
  var CID_PARAM = "cid";
  var SID_PARAM = "sid";

  var COOKIE_DAYS = 365;
  var SESSION_TIMEOUT_MS = 30 * 60 * 1000;

  // ===============================
  // FUNÃƒâ€¡Ãƒâ€¢ES BASE
  // ===============================
  function dlPush(obj) {
    window.dataLayer.push(obj);
    console.log("dataLayer push:", obj);
  }

  function generateUUID() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }

    if (window.crypto && window.crypto.getRandomValues) {
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        var r = window.crypto.getRandomValues(new Uint8Array(1))[0] & 15;
        var v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    }

    return String(Date.now()) + "-" + Math.random().toString(36).slice(2);
  }

  function getParam(name) {
    try {
      return new URLSearchParams(window.location.search).get(name);
    } catch (e) {
      return null;
    }
  }

  function getCookie(name) {
    try {
      var escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      var match = document.cookie.match(new RegExp("(?:^|; )" + escapedName + "=([^;]*)"));
      return match ? decodeURIComponent(match[1]) : null;
    } catch (e) {
      return null;
    }
  }

  function getRootDomain() {
    var hostname = window.location.hostname || "";

    if (hostname === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
      return "";
    }

    var parts = hostname.split(".");

    // Regra simples para domÃƒÂ­nios brasileiros comuns, como saintpaul.com.br
    if (parts.length >= 3 && parts[parts.length - 1] === "br") {
      return parts.slice(-3).join(".");
    }

    if (parts.length >= 2) {
      return parts.slice(-2).join(".");
    }

    return hostname;
  }

  function setCookie(name, value, days) {
    try {
      var maxAge = days * 24 * 60 * 60;
      var base = name + "=" + encodeURIComponent(value) + "; path=/; max-age=" + maxAge + "; SameSite=Lax";

      // Cookie no host atual
      document.cookie = base;

      // Cookie no domÃƒÂ­nio raiz, quando possÃƒÂ­vel. Ex: lps.exame.com -> .exame.com
      var rootDomain = getRootDomain();
      if (rootDomain) {
        document.cookie = base + "; domain=." + rootDomain;
      }
    } catch (e) {}
  }

  function getStorageItem(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  function setStorageItem(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {}
  }

  function getLocalStorageData() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (e) {
      return {};
    }
  }

  function saveLocalStorageData(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {}
    return data;
  }

  // ===============================
  // IDS PADRONIZADOS
  // Ordem: URL > cookie/localStorage > novo UUID
  // ===============================
  function ensureTrackingIds() {
    var now = Date.now();
    var data = getLocalStorageData();

    // anonymous_id: URL > localStorage estruturado > localStorage simples > novo UUID
    var anonymousId = getParam(AID_PARAM) || data.anonymous_id || getStorageItem(ANONYMOUS_ID_KEY);
    if (!anonymousId) anonymousId = generateUUID();

    // browser_id: localStorage estruturado > localStorage simples > novo UUID
    var browserId = data.browser_id || getStorageItem(BROWSER_ID_KEY);
    if (!browserId) browserId = generateUUID();

    // cookie_id: URL > cookie > localStorage estruturado > localStorage simples > novo UUID
    var cookieId = getParam(CID_PARAM) || getCookie(COOKIE_ID_KEY) || data.cookie_id || getStorageItem(COOKIE_ID_KEY);
    if (!cookieId) cookieId = generateUUID();

    // session_id: URL > cookie/localStorage se dentro do timeout > novo UUID
    var sessionIdFromUrl = getParam(SID_PARAM);
    var sessionIdFromCookie = getCookie(SESSION_ID_KEY);
    var sessionIdFromStorage = data.session_id || getStorageItem(SESSION_ID_KEY);

    var lastSeenFromCookie = Number(getCookie(SESSION_LAST_SEEN_KEY));
    var lastSeenFromStorage = Number(data.session_last_seen || getStorageItem(SESSION_LAST_SEEN_KEY));
    var lastSeen = lastSeenFromCookie || lastSeenFromStorage || 0;

    var sessionId = sessionIdFromUrl || sessionIdFromCookie || sessionIdFromStorage;

    if (!sessionId || !lastSeen || now - lastSeen > SESSION_TIMEOUT_MS) {
      // Se veio pela URL, preserva mesmo se nÃƒÂ£o houver last_seen anterior.
      sessionId = sessionIdFromUrl || generateUUID();
    }

    data.anonymous_id = anonymousId;
    data.browser_id = browserId;
    data.cookie_id = cookieId;
    data.session_id = sessionId;
    data.session_last_seen = now;

    setStorageItem(ANONYMOUS_ID_KEY, anonymousId);
    setStorageItem(BROWSER_ID_KEY, browserId);
    setStorageItem(COOKIE_ID_KEY, cookieId);
    setStorageItem(SESSION_ID_KEY, sessionId);
    setStorageItem(SESSION_LAST_SEEN_KEY, String(now));

    setCookie(COOKIE_ID_KEY, cookieId, COOKIE_DAYS);
    setCookie(SESSION_ID_KEY, sessionId, 1);
    setCookie(SESSION_LAST_SEEN_KEY, String(now), 1);

    saveLocalStorageData(data);

    window.exameTrackingIds = {
      anonymous_id: anonymousId,
      browser_id: browserId,
      cookie_id: cookieId,
      session_id: sessionId,
    };

    return window.exameTrackingIds;
  }

  // ===============================
  // ATRIBUIÃƒâ€¡ÃƒÆ’O
  // ===============================
  function getCurrentUtm() {
    return {
      source: getParam("utm_source"),
      medium: getParam("utm_medium"),
      campaign: getParam("utm_campaign"),
      content: getParam("utm_content"),
      term: getParam("utm_term"),
    };
  }

  function hasAnyUtm(utm) {
    return !!(utm.source || utm.medium || utm.campaign || utm.content || utm.term);
  }

  function getCurrentClickIds() {
    return {
      fbclid: getParam("fbclid"),
      gclid: getParam("gclid"),
      ttclid: getParam("ttclid"),
      li_click_id: getParam("li_click_id"),
      msclkid: getParam("msclkid"),
      twclid: getParam("twclid"),
      dclid: getParam("dclid"),
      wbraid: getParam("wbraid"),
      gbraid: getParam("gbraid"),
    };
  }

  function hasAnyClickId(ids) {
    for (var key in ids) {
      if (ids[key]) return true;
    }
    return false;
  }

  function updateAttribution() {
    var data = getLocalStorageData();
    var currentUtm = getCurrentUtm();
    var currentClickIds = getCurrentClickIds();

    if (hasAnyUtm(currentUtm)) {
      if (!data.first_utm) {
        data.first_utm = {
          source: currentUtm.source || null,
          medium: currentUtm.medium || null,
          campaign: currentUtm.campaign || null,
          content: currentUtm.content || null,
          term: currentUtm.term || null,
          captured_at: new Date().toISOString(),
        };
      }

      data.last_utm = {
        source: currentUtm.source || null,
        medium: currentUtm.medium || null,
        campaign: currentUtm.campaign || null,
        content: currentUtm.content || null,
        term: currentUtm.term || null,
      };
    }

    if (hasAnyClickId(currentClickIds)) {
      if (!data.first_click_ids) data.first_click_ids = Object.assign({}, currentClickIds);
      data.last_click_ids = Object.assign({}, currentClickIds);
    }

    saveLocalStorageData(data);
    return data;
  }

  // ===============================
  // CONTEXTO DA PÃƒÂGINA
  // ===============================
  function normalizePhone(value) {
    var clean = String(value || "").replace(/\D/g, "");
    if (!clean) return "";
    return clean.indexOf("55") === 0 ? clean : "55" + clean;
  }

  function getDeviceType() {
    if (/Mobi|Android/i.test(navigator.userAgent)) return "mobile";
    if (/iPad|Tablet/i.test(navigator.userAgent)) return "tablet";
    return "desktop";
  }

  function getProductName() {
    var el = document.querySelector("[data-product-name]");
    if (el && el.getAttribute("data-product-name")) return el.getAttribute("data-product-name");

    var meta = document.querySelector('meta[name="product_name"], meta[property="product_name"]');
    if (meta && meta.getAttribute("content")) return meta.getAttribute("content");

    if (document.title) return document.title;

    var h1 = document.querySelector("h1");
    if (h1) return h1.textContent.trim();

    return null;
  }

  function getIdentityData() {
    var data = getLocalStorageData();
    var identity = data.identity || {};

    return {
      name: identity.name || data.name || null,
      email: identity.email || data.email || null,
      phone: identity.phone ? normalizePhone(identity.phone) : data.phone ? normalizePhone(data.phone) : null,
    };
  }

  function buildBasePayload(eventName, eventLabel) {
    var ids = ensureTrackingIds();
    var trackingData = updateAttribution();

    var firstUtm = trackingData.first_utm || {};
    var lastUtm = trackingData.last_utm || {};
    var firstClick = trackingData.first_click_ids || {};
    var lastClick = trackingData.last_click_ids || {};
    var identity = getIdentityData();

    return {
      event: eventName,
      event_name: eventLabel,
      event_id: generateUUID(),
      event_timestamp: new Date().toISOString(),

      anonymous_id: ids.anonymous_id || null,
      browser_id: ids.browser_id || null,
      cookie_id: ids.cookie_id || null,
      session_id: ids.session_id || null,

      hostname: window.location.hostname || null,
      domain: getRootDomain() || window.location.hostname || null,
      page_url: window.location.href,
      page_path: window.location.pathname,
      page_title: document.title || null,
      product_name: getProductName(),
      referrer: document.referrer || null,

      first_utm_source: firstUtm.source || null,
      first_utm_medium: firstUtm.medium || null,
      first_utm_campaign: firstUtm.campaign || null,
      first_utm_content: firstUtm.content || null,
      first_utm_term: firstUtm.term || null,
      first_utm_captured_at: firstUtm.captured_at || null,

      last_utm_source: lastUtm.source || null,
      last_utm_medium: lastUtm.medium || null,
      last_utm_campaign: lastUtm.campaign || null,
      last_utm_content: lastUtm.content || null,
      last_utm_term: lastUtm.term || null,

      first_fbclid: firstClick.fbclid || null,
      first_gclid: firstClick.gclid || null,
      first_ttclid: firstClick.ttclid || null,
      first_li_click_id: firstClick.li_click_id || null,
      first_msclkid: firstClick.msclkid || null,
      first_twclid: firstClick.twclid || null,
      first_dclid: firstClick.dclid || null,
      first_wbraid: firstClick.wbraid || null,
      first_gbraid: firstClick.gbraid || null,

      last_fbclid: lastClick.fbclid || null,
      last_gclid: lastClick.gclid || null,
      last_ttclid: lastClick.ttclid || null,
      last_li_click_id: lastClick.li_click_id || null,
      last_msclkid: lastClick.msclkid || null,
      last_twclid: lastClick.twclid || null,
      last_dclid: lastClick.dclid || null,
      last_wbraid: lastClick.wbraid || null,
      last_gbraid: lastClick.gbraid || null,

      _fbp: getCookie("_fbp"),
      _fbc: getCookie("_fbc"),
      _ga: getCookie("_ga"),

      device_type: getDeviceType(),
      browser: navigator.userAgent,
      browser_language: navigator.language || null,
      browser_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || null,

      name: identity.name,
      email: identity.email,
      phone: identity.phone,
    };
  }

  // ===============================
  // TRANSPORTE ENTRE DOMÃƒÂNIOS
  // NÃƒÂ£o restringe hosts. Aplica em qualquer link http/https.
  // ===============================
  function appendTrackingIdsToUrl(url, ids) {
    try {
      var originalUrl = String(url || "").trim();
      if (!originalUrl) return url;

      var parsed = new URL(originalUrl, window.location.href);
      if (!/^https?:$/.test(parsed.protocol)) return url;

      // Guard de seguranÃ§a:
      // nÃ£o reescreve URLs que apontam para a raiz do domÃ­nio.
      // Isso evita corromper redirects/links que acabem indo para https://lps.exame.com/.
      if (parsed.pathname === "/" && !originalUrl.includes("/")) return url;
      if (parsed.pathname === "/" && (originalUrl === "/" || originalUrl === parsed.origin || originalUrl === parsed.origin + "/")) return url;

      // MantÃ©m SOMENTE o anonymous_id na URL.
      // NÃ£o transporta cookie_id nem session_id por querystring.
      if (!ids || !ids.anonymous_id) return url;

      // Garante aid como primeiro parÃ¢metro, sem apagar os demais parÃ¢metros existentes.
      var currentParams = new URLSearchParams(parsed.search);
      currentParams.delete(AID_PARAM);

      var newParams = new URLSearchParams();
      newParams.append(AID_PARAM, ids.anonymous_id);

      currentParams.forEach(function (value, key) {
        newParams.append(key, value);
      });

      parsed.search = newParams.toString();
      return parsed.toString();
    } catch (e) {
      return url;
    }
  }

  function appendTrackingIdsToLinks() {
    var ids = ensureTrackingIds();
    if (!ids.anonymous_id) return;

    // Atua somente em links <a href>. NÃ£o altera forms nem actions.
    var links = document.querySelectorAll("a[href]");

    for (var i = 0; i < links.length; i++) {
      var link = links[i];
      var href = link.getAttribute("href");

      if (!href) continue;
      if (href.indexOf("#") === 0) continue;
      if (href.indexOf("javascript:") === 0) continue;
      if (href.indexOf("mailto:") === 0) continue;
      if (href.indexOf("tel:") === 0) continue;

      var updated = appendTrackingIdsToUrl(href, ids);
      if (updated !== href) link.setAttribute("href", updated);
    }
  }

  function startMutationObserver() {
    if (!window.MutationObserver || !document.body) return;

    var timer = null;
    var observer = new MutationObserver(function () {
      clearTimeout(timer);
      timer = setTimeout(appendTrackingIdsToLinks, 150);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["href"],
    });
  }

  function startUmami() {
    const websiteIds = {
      "lps.exame.com": "11d5f6f9-2d0e-4ecb-a90d-ab6408c2b313",
      "lps.saintpaul.com.br": "ea330008-5957-494d-8591-7265c3887af4",
    };

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
    };

    script.onerror = () => {
      console.error("Failed to load Umami script");
    };

    document.head.appendChild(script);
  }

  function init() {
    var payload = buildBasePayload("pageview", "pageview");
    dlPush(payload);
    appendTrackingIdsToLinks();
    startMutationObserver();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
    document.addEventListener("DOMContentLoaded", startUmami);
  } else {
    init();
    startUmami();
  }
})();
