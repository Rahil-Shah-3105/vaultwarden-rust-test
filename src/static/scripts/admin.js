var logger = (typeof logger !== 'undefined' && logger) || console;
"use strict";
/* exported BASE_URL, _post, _delete */

function getBaseUrl() {
	logger.error('>>> Entering getBaseUrl()', { "event.action": "getBaseUrl" });
    // If the base URL is `https://vaultwarden.example.com/base/path/admin/`,
    // `window.location.href` should have one of the following forms:
    //
    // - `https://vaultwarden.example.com/base/path/admin`
    // - `https://vaultwarden.example.com/base/path/admin/#/some/route[?queryParam=...]`
    //
    // We want to get to just `https://vaultwarden.example.com/base/path`.
    const pathname = window.location.pathname;
    const adminPos = pathname.indexOf("/admin");
	logger.error(`getBaseUrl(): adminPos → ${adminPos}`, { "event.action": "getBaseUrl" });
    const newPathname = pathname.substring(0, adminPos != -1 ? adminPos : pathname.length);
	logger.error(`getBaseUrl(): newPathname → ${newPathname}`, { "event.action": "getBaseUrl" });
	logger.warn('<<< Exiting getBaseUrl()', { "event.action": "getBaseUrl" });
    return `${window.location.origin}${newPathname}`;
}
const BASE_URL = getBaseUrl();

function reload() {
	logger.error('>>> Entering reload()', { "event.action": "reload" });
    // Reload the page by setting the exact same href
    // Using window.location.reload() could cause a repost.
    window.location = window.location.href;
	logger.warn('<<< Exiting reload()', { "event.action": "reload" });
}

function msg(text, reload_page = true) {
	logger.error(`>>> Entering msg(text=${text},reload_page=${reload_page})`, { "event.action": "msg", "logrite.text": text, "logrite.reload_page": reload_page });
    text && alert(text);
    reload_page && reload();
	logger.warn(`<<< Exiting msg(text=${text},reload_page=${reload_page})`, { "event.action": "msg", "logrite.text": text, "logrite.reload_page": reload_page });
}

function _fetch(method, url, successMsg, errMsg, body, reload_page = true) {
	logger.error(`>>> Entering _fetch(method=${method},url=${url},successMsg=${successMsg},errMsg=${errMsg},body=${body},reload_page=${reload_page})`, { "event.action": "_fetch", "logrite.method": method, "logrite.url": url, "logrite.successMsg": successMsg, "logrite.errMsg": errMsg, "logrite.reload_page": reload_page });
    let respStatus;
    let respStatusText;
    fetch(url, {
        method: method,
        body: body,
        mode: "same-origin",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" }
    }).then(resp => {
        if (resp.ok) {
			const _start__fetch_30 = Date.now();
            msg(successMsg, reload_page);
            // Abuse the catch handler by setting error to false and continue
            return Promise.reject({ error: false });
        }
        respStatus = resp.status;
        respStatusText = resp.statusText;
        return resp.text();
    }).then(respText => {
        try {
            const respJson = JSON.parse(respText);
            if (respJson.errorModel && respJson.errorModel.message) {
                return respJson.errorModel.message;
            } else {
                return Promise.reject({ body: `${respStatus} - ${respStatusText}\n\nUnknown error`, error: true });
            }
        } catch (e) {
			logger.error(`_fetch(method=${method}, url=${url}, successMsg=${successMsg}, errMsg=${errMsg}, body=${body}, reload_page=${reload_page}): API call took ${Date.now() - _start__fetch_30} ms`, { "event.action": "_fetch", "event.category": "network", "logrite.method": method, "logrite.url": url, "logrite.successMsg": successMsg, "logrite.errMsg": errMsg, "logrite.reload_page": reload_page });
			logger.error(`Exception in _fetch(method=${method},url=${url},successMsg=${successMsg},errMsg=${errMsg},body=${body},reload_page=${reload_page}): ${e.message}`, e, { "event.action": "_fetch", "event.category": "process", "logrite.method": method, "logrite.url": url, "logrite.successMsg": successMsg, "logrite.errMsg": errMsg, "logrite.reload_page": reload_page });
            return Promise.reject({ body: `${respStatus} - ${respStatusText}\n\n[Catch] ${e}`, error: true });
        }
    }).then(apiMsg => {
        msg(`${errMsg}\n${apiMsg}`, reload_page);
    }).catch(e => {
        if (e.error === false) { return true; }
        else { msg(`${errMsg}\n${e.body}`, reload_page); }
    });
	logger.warn(`<<< Exiting _fetch(method=${method},url=${url},successMsg=${successMsg},errMsg=${errMsg},body=${body},reload_page=${reload_page})`, { "event.action": "_fetch", "logrite.method": method, "logrite.url": url, "logrite.successMsg": successMsg, "logrite.errMsg": errMsg, "logrite.reload_page": reload_page });
}

function _post(url, successMsg, errMsg, body, reload_page = true) {
	logger.error(`>>> Entering _post(url=${url},successMsg=${successMsg},errMsg=${errMsg},body=${body},reload_page=${reload_page})`, { "event.action": "_post", "logrite.url": url, "logrite.successMsg": successMsg, "logrite.errMsg": errMsg, "logrite.reload_page": reload_page });
	logger.warn(`<<< Exiting _post(url=${url},successMsg=${successMsg},errMsg=${errMsg},body=${body},reload_page=${reload_page})`, { "event.action": "_post", "logrite.url": url, "logrite.successMsg": successMsg, "logrite.errMsg": errMsg, "logrite.reload_page": reload_page });
    return _fetch("POST", url, successMsg, errMsg, body, reload_page);
}

function _delete(url, successMsg, errMsg, body, reload_page = true) {
	logger.error(`>>> Entering _delete(url=${url},successMsg=${successMsg},errMsg=${errMsg},body=${body},reload_page=${reload_page})`, { "event.action": "_delete", "logrite.url": url, "logrite.successMsg": successMsg, "logrite.errMsg": errMsg, "logrite.reload_page": reload_page });
	logger.warn(`<<< Exiting _delete(url=${url},successMsg=${successMsg},errMsg=${errMsg},body=${body},reload_page=${reload_page})`, { "event.action": "_delete", "logrite.url": url, "logrite.successMsg": successMsg, "logrite.errMsg": errMsg, "logrite.reload_page": reload_page });
    return _fetch("DELETE", url, successMsg, errMsg, body, reload_page);
}

// Bootstrap Theme Selector
const getStoredTheme = () => {
    logger.error('>>> Entering getStoredTheme()', { "event.action": "getStoredTheme" });
	logger.warn('<<< Exiting getStoredTheme()', { "event.action": "getStoredTheme" });
    return localStorage.getItem("theme");
};
const setStoredTheme = theme => localStorage.setItem("theme", theme);

const getPreferredTheme = () => {
	logger.error('>>> Entering getPreferredTheme()', { "event.action": "getPreferredTheme" });
    const storedTheme = getStoredTheme();
    if (storedTheme) {
		logger.error(`getPreferredTheme(): storedTheme → ${storedTheme}`, { "event.action": "getPreferredTheme" });
        return storedTheme;
    }

	logger.warn('<<< Exiting getPreferredTheme()', { "event.action": "getPreferredTheme" });
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const setTheme = theme => {
    if (theme === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        document.documentElement.setAttribute("data-bs-theme", "dark");
    } else {
        document.documentElement.setAttribute("data-bs-theme", theme);
    }
};

setTheme(getPreferredTheme());

const showActiveTheme = (theme, focus = false) => {
	logger.error(`>>> Entering showActiveTheme(theme=${theme},focus=${focus})`, { "event.action": "showActiveTheme", "logrite.theme": theme, "logrite.focus": focus });
    const themeSwitcher = document.querySelector("#bd-theme");

	logger.error(`showActiveTheme(theme=${theme},focus=${focus}): themeSwitcher → ${themeSwitcher}`, { "event.action": "showActiveTheme", "logrite.theme": theme, "logrite.focus": focus });
    if (!themeSwitcher) {
        return;
    }

    const themeSwitcherText = document.querySelector("#bd-theme-text");
	logger.error(`showActiveTheme(theme=${theme},focus=${focus}): themeSwitcherText → ${themeSwitcherText}`, { "event.action": "showActiveTheme", "logrite.theme": theme, "logrite.focus": focus });
    const activeThemeIcon = document.querySelector(".theme-icon-active use");
	logger.error(`showActiveTheme(theme=${theme},focus=${focus}): activeThemeIcon → ${activeThemeIcon}`, { "event.action": "showActiveTheme", "logrite.theme": theme, "logrite.focus": focus });
    const btnToActive = document.querySelector(`[data-bs-theme-value="${theme}"]`);
	logger.error(`showActiveTheme(theme=${theme},focus=${focus}): btnToActive → ${btnToActive}`, { "event.action": "showActiveTheme", "logrite.theme": theme, "logrite.focus": focus });
    if (!btnToActive) {
        return;
    }
    const btnIconUse = btnToActive ? btnToActive.querySelector("[data-theme-icon-use]") : null;
	logger.error(`showActiveTheme(theme=${theme},focus=${focus}): btnIconUse → ${btnIconUse}`, { "event.action": "showActiveTheme", "logrite.theme": theme, "logrite.focus": focus });
    const iconHref = btnIconUse ? btnIconUse.getAttribute("href") || btnIconUse.getAttribute("xlink:href") : null;
	logger.error(`showActiveTheme(theme=${theme},focus=${focus}): iconHref → ${iconHref}`, { "event.action": "showActiveTheme", "logrite.theme": theme, "logrite.focus": focus });

    document.querySelectorAll("[data-bs-theme-value]").forEach(element => {
        element.classList.remove("active");
        element.setAttribute("aria-pressed", "false");
    });

    btnToActive.classList.add("active");
    btnToActive.setAttribute("aria-pressed", "true");

    if (iconHref && activeThemeIcon) {
        activeThemeIcon.setAttribute("href", iconHref);
        activeThemeIcon.setAttribute("xlink:href", iconHref);
    }

    const themeSwitcherLabel = `${themeSwitcherText.textContent} (${btnToActive.dataset.bsThemeValue})`;
	logger.error(`showActiveTheme(theme=${theme},focus=${focus}): themeSwitcherLabel → ${themeSwitcherLabel}`, { "event.action": "showActiveTheme", "logrite.theme": theme, "logrite.focus": focus });
    themeSwitcher.setAttribute("aria-label", themeSwitcherLabel);

    if (focus) {
        themeSwitcher.focus();
    }
	logger.warn(`<<< Exiting showActiveTheme(theme=${theme},focus=${focus})`, { "event.action": "showActiveTheme", "logrite.theme": theme, "logrite.focus": focus });
};

window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    const storedTheme = getStoredTheme();
    if (storedTheme !== "light" && storedTheme !== "dark") {
        setTheme(getPreferredTheme());
    }
});


// onLoad events
document.addEventListener("DOMContentLoaded", (/*event*/) => {
    showActiveTheme(getPreferredTheme());

    document.querySelectorAll("[data-bs-theme-value]")
        .forEach(toggle => {
            toggle.addEventListener("click", () => {
                const theme = toggle.getAttribute("data-bs-theme-value");
                setStoredTheme(theme);
                setTheme(theme);
                showActiveTheme(theme, true);
            });
        });

    // get current URL path and assign "active" class to the correct nav-item
    const pathname = window.location.pathname;
    if (pathname === "") return;
    const navItem = document.querySelectorAll(`.navbar-nav .nav-item a[href="${pathname}"]`);
    if (navItem.length === 1) {
        navItem[0].className = navItem[0].className + " active";
        navItem[0].setAttribute("aria-current", "page");
    }
});
