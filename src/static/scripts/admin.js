const logger = console;
"use strict";
/* exported BASE_URL, _post, _delete */

function getBaseUrl() {
	logger.debug('>>> Entering getBaseUrl()');
    // If the base URL is `https://vaultwarden.example.com/base/path/admin/`,
    // `window.location.href` should have one of the following forms:
    //
    // - `https://vaultwarden.example.com/base/path/admin`
    // - `https://vaultwarden.example.com/base/path/admin/#/some/route[?queryParam=...]`
    //
    // We want to get to just `https://vaultwarden.example.com/base/path`.
    const pathname = window.location.pathname;
    const adminPos = pathname.indexOf("/admin");
	logger.debug(`getBaseUrl(): adminPos → ${adminPos}`);
    const newPathname = pathname.substring(0, adminPos != -1 ? adminPos : pathname.length);
	logger.debug(`getBaseUrl(): newPathname → ${newPathname}`);
    return `${window.location.origin}${newPathname}`;
}
const BASE_URL = getBaseUrl();

function reload() {
	logger.debug('>>> Entering reload()');
    // Reload the page by setting the exact same href
    // Using window.location.reload() could cause a repost.
    window.location = window.location.href;
	logger.debug(`reload(): window.location → ${window.location}`);
}

function msg(text, reload_page = true) {
	logger.debug(`>>> Entering msg(text=${text},reload_page=${reload_page})`);
    text && alert(text);
    reload_page && reload();
	logger.debug(`<<< Exiting msg(text=${text},reload_page=${reload_page})`);
}

function _fetch(method, url, successMsg, errMsg, body, reload_page = true) {
	logger.debug(`>>> Entering _fetch(method=${method},url=${url},successMsg=${successMsg},errMsg=${errMsg},body=${body},reload_page=${reload_page})`);
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
			const _start__fetch = Date.now();
            msg(successMsg, reload_page);
            // Abuse the catch handler by setting error to false and continue
            return Promise.reject({ error: false });
        }
        respStatus = resp.status;
        respStatusText = resp.statusText;
		logger.debug(`_fetch(method=${method},url=${url},successMsg=${successMsg},errMsg=${errMsg},body=${body},reload_page=${reload_page}): respStatus → ${respStatus}`);
		logger.debug(`_fetch(method=${method},url=${url},successMsg=${successMsg},errMsg=${errMsg},body=${body},reload_page=${reload_page}): respStatusText → ${respStatusText}`);
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
			logger.info(`_fetch(method=${method}, url=${url}, successMsg=${successMsg}, errMsg=${errMsg}, body=${body}, reload_page=${reload_page}): API call took ${Date.now() - _start__fetch} ms`);
			logger.error(`Exception in _fetch(method=${method},url=${url},successMsg=${successMsg},errMsg=${errMsg},body=${body},reload_page=${reload_page}): ${e.message}`, e);
            return Promise.reject({ body: `${respStatus} - ${respStatusText}\n\n[Catch] ${e}`, error: true });
        }
    }).then(apiMsg => {
        msg(`${errMsg}\n${apiMsg}`, reload_page);
    }).catch(e => {
        if (e.error === false) { return true; }
        else { msg(`${errMsg}\n${e.body}`, reload_page); }
    });
	logger.debug(`<<< Exiting _fetch(method=${method},url=${url},successMsg=${successMsg},errMsg=${errMsg},body=${body},reload_page=${reload_page})`);
}

function _post(url, successMsg, errMsg, body, reload_page = true) {
	logger.debug(`>>> Entering _post(url=${url},successMsg=${successMsg},errMsg=${errMsg},body=${body},reload_page=${reload_page})`);
	logger.debug(`<<< Exiting _post(url=${url},successMsg=${successMsg},errMsg=${errMsg},body=${body},reload_page=${reload_page})`);
    return _fetch("POST", url, successMsg, errMsg, body, reload_page);
}

function _delete(url, successMsg, errMsg, body, reload_page = true) {
	logger.debug(`>>> Entering _delete(url=${url},successMsg=${successMsg},errMsg=${errMsg},body=${body},reload_page=${reload_page})`);
	logger.debug(`<<< Exiting _delete(url=${url},successMsg=${successMsg},errMsg=${errMsg},body=${body},reload_page=${reload_page})`);
    return _fetch("DELETE", url, successMsg, errMsg, body, reload_page);
}

// Bootstrap Theme Selector
const getStoredTheme = () => localStorage.getItem("theme");
const setStoredTheme = theme => localStorage.setItem("theme", theme);

const getPreferredTheme = () => {
	logger.debug('>>> Entering getPreferredTheme()');
    const storedTheme = getStoredTheme();
    if (storedTheme) {
		logger.debug(`getPreferredTheme(): storedTheme → ${storedTheme}`);
	logger.debug('<<< Exiting getPreferredTheme()');
        return storedTheme;
    }

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
	logger.debug(`>>> Entering showActiveTheme(theme=${theme},focus=${focus})`);
    const themeSwitcher = document.querySelector("#bd-theme");

	logger.debug(`showActiveTheme(theme=${theme},focus=${focus}): themeSwitcher → ${themeSwitcher}`);
    if (!themeSwitcher) {
        return;
    }

    const themeSwitcherText = document.querySelector("#bd-theme-text");
	logger.debug(`showActiveTheme(theme=${theme},focus=${focus}): themeSwitcherText → ${themeSwitcherText}`);
    const activeThemeIcon = document.querySelector(".theme-icon-active use");
	logger.debug(`showActiveTheme(theme=${theme},focus=${focus}): activeThemeIcon → ${activeThemeIcon}`);
    const btnToActive = document.querySelector(`[data-bs-theme-value="${theme}"]`);
	logger.debug(`showActiveTheme(theme=${theme},focus=${focus}): btnToActive → ${btnToActive}`);
    if (!btnToActive) {
        return;
    }
    const btnIconUse = btnToActive ? btnToActive.querySelector("[data-theme-icon-use]") : null;
	logger.debug(`showActiveTheme(theme=${theme},focus=${focus}): btnIconUse → ${btnIconUse}`);
    const iconHref = btnIconUse ? btnIconUse.getAttribute("href") || btnIconUse.getAttribute("xlink:href") : null;
	logger.debug(`showActiveTheme(theme=${theme},focus=${focus}): iconHref → ${iconHref}`);

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
	logger.debug(`showActiveTheme(theme=${theme},focus=${focus}): themeSwitcherLabel → ${themeSwitcherLabel}`);
    themeSwitcher.setAttribute("aria-label", themeSwitcherLabel);

    if (focus) {
        themeSwitcher.focus();
    }
	logger.debug(`<<< Exiting showActiveTheme(theme=${theme},focus=${focus})`);
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
