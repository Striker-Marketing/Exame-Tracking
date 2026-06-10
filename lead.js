(function () {
  window.dataLayer = window.dataLayer || [];

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
      var escapedName = name.replace(/[.*+?^${}()|[]\]/g, "\$&");
      var match = document.cookie.match(new RegExp("(?:^|; )" + escapedName + "=([^;]*)"));
      return match ? decodeURIComponent(match[1]) : null;
    } catch (e) {
      return null;
    }
  }

  function getRootDomain() {
    var hostname = window.location.hostname || "";

    if (hostname === "localhost" || /^d+.d+.d+.d+$/.test(hostname)) {
      return "";
    }

    var parts = hostname.split(".");

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

      document.cookie = base;

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

  function ensureTrackingIds() {
    var now = Date.now();
    var data = getLocalStorageData();

    var anonymousId = getParam(AID_PARAM) || data.anonymous_id || getStorageItem(ANONYMOUS_ID_KEY);
    if (!anonymousId) anonymousId = generateUUID();

    var browserId = data.browser_id || getStorageItem(BROWSER_ID_KEY);
    if (!browserId) browserId = generateUUID();

    var cookieId = getParam(CID_PARAM) || getCookie(COOKIE_ID_KEY) || data.cookie_id || getStorageItem(COOKIE_ID_KEY);
    if (!cookieId) cookieId = generateUUID();

    var sessionIdFromUrl = getParam(SID_PARAM);
    var sessionIdFromCookie = getCookie(SESSION_ID_KEY);
    var sessionIdFromStorage = data.session_id || getStorageItem(SESSION_ID_KEY);

    var lastSeenFromCookie = Number(getCookie(SESSION_LAST_SEEN_KEY));
    var lastSeenFromStorage = Number(data.session_last_seen || getStorageItem(SESSION_LAST_SEEN_KEY));
    var lastSeen = lastSeenFromCookie || lastSeenFromStorage || 0;

    var sessionId = sessionIdFromUrl || sessionIdFromCookie || sessionIdFromStorage;

    if (!sessionId || !lastSeen || now - lastSeen > SESSION_TIMEOUT_MS) {
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

  function getFormMap(form) {
    var map = {};

    try {
      var fd = new FormData(form);
      fd.forEach(function (value, key) {
        if (!(key in map)) {
          map[key] = String(value || "").trim();
        }
      });
    } catch (e) {}

    return map;
  }

  function pickFromMap(map, candidates) {
    for (var i = 0; i < candidates.length; i++) {
      var key = candidates[i];
      if (map[key]) return String(map[key]).trim();
    }
    return "";
  }

  function normalizeEmail(value) {
    return value ? String(value).trim().toLowerCase() : "";
  }

  function normalizePhone(value) {
    var clean = String(value || "").replace(/D/g, "");
    if (!clean) return "";
    return clean.indexOf("55") === 0 ? clean : "55" + clean;
  }

  function isValidLead(form, formMap) {
    if (typeof form.checkValidity === "function" && !form.checkValidity()) return false;

    var email = pickFromMap(formMap, ["email", "e-mail", "mail"]);
    var phone = pickFromMap(formMap, ["mobile", "telefone", "phone", "celular"]);

    return !!(email || phone);
  }

  function getFormFingerprint(form) {
    var action = form.getAttribute("action") || "";
    var id = form.getAttribute("id") || "";
    var name = form.getAttribute("name") || "";
    return [window.location.pathname, action, id, name].join("|");
  }

  var recentSubmits = {};

  function wasRecentlySent(key) {
    var now = Date.now();
    var last = recentSubmits[key] || 0;

    if (now - last < 5000) return true;

    recentSubmits[key] = now;
    return false;
  }

  function getDeviceType() {
    if (/Mobi|Android/i.test(navigator.userAgent)) return "mobile";
    if (/iPad|Tablet/i.test(navigator.userAgent)) return "tablet";
    return "desktop";
  }

  function getProductName() {
    var el = document.querySelector("[data-product-name]");
    if (el && el.getAttribute("data-product-name")) return el.getAttribute("data-product-name");

    var metaProduct = document.querySelector('meta[name="product_name"], meta[property="product_name"]');
    if (metaProduct && metaProduct.getAttribute("content")) return metaProduct.getAttribute("content");

    if (document.title) return document.title;

    var h1 = document.querySelector("h1");
    if (h1) return h1.textContent.trim();

    return null;
  }

  function saveIdentityForNextPageviews(identity) {
    var data = getLocalStorageData();

    data.identity = {
      name: identity.name || "",
      email: identity.email || "",
      phone: identity.phone || "",
    };

    saveLocalStorageData(data);
  }

  function handleLeadSubmit(ev) {
    if (!ev || !ev.target || !ev.target.matches("form")) return;

    var form = ev.target;
    var formMap = getFormMap(form);

    if (!isValidLead(form, formMap)) return;

    var fingerprint = getFormFingerprint(form);
    if (wasRecentlySent(fingerprint)) return;

    var ids = ensureTrackingIds();
    var trackingData = updateAttribution();

    var firstUtm = trackingData.first_utm || {};
    var lastUtm = trackingData.last_utm || {};
    var firstClickIds = trackingData.first_click_ids || {};
    var lastClickIds = trackingData.last_click_ids || {};

    var name = pickFromMap(formMap, ["last_name", "first_name", "nome", "name", "nome_completo", "fullname"]);

    var email = normalizeEmail(pickFromMap(formMap, ["email", "e-mail", "mail"]));

    var phone = normalizePhone(pickFromMap(formMap, ["mobile", "telefone", "phone", "celular"]));

    var empresa = pickFromMap(formMap, ["empresa", "company"]);
    var cargo = pickFromMap(formMap, ["cargo", "job_title", "jobtitle"]);
    var experiencia = pickFromMap(formMap, ["experiencia", "experience"]);
    var linkedin = pickFromMap(formMap, ["linkedin", "linkedin_url"]);

    saveIdentityForNextPageviews({
      name: name,
      email: email,
      phone: phone,
    });

    var payload = {
      event: "lead",
      event_name: "Lead",
      event_id: generateUUID(),
      event_timestamp: new Date().toISOString(),
      event_time: Math.floor(Date.now() / 1000),

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

      first_fbclid: firstClickIds.fbclid || null,
      first_gclid: firstClickIds.gclid || null,
      first_ttclid: firstClickIds.ttclid || null,
      first_li_click_id: firstClickIds.li_click_id || null,
      first_msclkid: firstClickIds.msclkid || null,
      first_twclid: firstClickIds.twclid || null,
      first_dclid: firstClickIds.dclid || null,
      first_wbraid: firstClickIds.wbraid || null,
      first_gbraid: firstClickIds.gbraid || null,

      last_fbclid: lastClickIds.fbclid || null,
      last_gclid: lastClickIds.gclid || null,
      last_ttclid: lastClickIds.ttclid || null,
      last_li_click_id: lastClickIds.li_click_id || null,
      last_msclkid: lastClickIds.msclkid || null,
      last_twclid: lastClickIds.twclid || null,
      last_dclid: lastClickIds.dclid || null,
      last_wbraid: lastClickIds.wbraid || null,
      last_gbraid: lastClickIds.gbraid || null,

      _fbp: getCookie("_fbp"),
      _fbc: getCookie("_fbc"),
      _ga: getCookie("_ga"),

      device_type: getDeviceType(),
      browser: navigator.userAgent,
      browser_language: navigator.language || null,
      browser_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || null,

      name: name || null,
      email: email || null,
      phone: phone || null,

      empresa: empresa || null,
      cargo: cargo || null,
      experiencia: experiencia || null,
      linkedin: linkedin || null,
    };

    dlPush(payload);

    if (window.umami) {
      window.umami.track("Lead");
    }
  }

  document.addEventListener("submit", handleLeadSubmit, true);
})();
