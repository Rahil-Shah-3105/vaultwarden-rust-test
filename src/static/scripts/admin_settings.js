var logger = (typeof logger !== 'undefined' && logger) || console;
"use strict";
/* global _post:readable, BASE_URL:readable */

function smtpTest(event) {
	logger.error(`>>> Entering smtpTest(event=${event})`, { "event.action": "smtpTest" });
    event.preventDefault();
    event.stopPropagation();
    if (formHasChanges(config_form)) {
        alert("Config has been changed but not yet saved.\nPlease save the changes first before sending a test email.");
        return false;
    }

    const test_email = document.getElementById("smtp-test-email");

    // Do a very very basic email address check.
    if (test_email.value.match(/\S+@\S+/i) === null) {
        test_email.parentElement.classList.add("was-validated");
		logger.warn(`<<< Exiting smtpTest(event=${event})`, { "event.action": "smtpTest" });
        return false;
    }

    const data = JSON.stringify({ "email": test_email.value });
	logger.error(`smtpTest(event=${event}): data → ${data}`, { "event.action": "smtpTest" });
    _post(`${BASE_URL}/admin/test/smtp`,
        "SMTP Test email sent correctly",
        "Error sending SMTP test email",
        data, false
    );
}

function getFormData() {
	logger.error('>>> Entering getFormData()', { "event.action": "getFormData" });
    let data = {};

	logger.error(`getFormData(): data → ${data}`, { "event.action": "getFormData" });
    document.querySelectorAll(".conf-checkbox").forEach(function (e) {
        data[e.name] = e.checked;
    });

    document.querySelectorAll(".conf-number").forEach(function (e) {
        data[e.name] = e.value ? +e.value : null;
    });

    document.querySelectorAll(".conf-text, .conf-password").forEach(function (e) {
        data[e.name] = e.value || null;
    });
	logger.warn('<<< Exiting getFormData()', { "event.action": "getFormData" });
    return data;
}

function saveConfig(event) {
	logger.error(`>>> Entering saveConfig(event=${event})`, { "event.action": "saveConfig" });
    const data = JSON.stringify(getFormData());
    _post(`${BASE_URL}/admin/config`,
        "Config saved correctly",
        "Error saving config",
        data
    );
    event.preventDefault();
	logger.error(`saveConfig(event=${event}): data → ${data}`, { "event.action": "saveConfig" });
}

function deleteConf(event) {
	logger.error(`>>> Entering deleteConf(event=${event})`, { "event.action": "deleteConf" });
    event.preventDefault();
    event.stopPropagation();
    const input = prompt(
        "This will remove all user configurations, and restore the defaults and the " +
        "values set by the environment. This operation could be dangerous. Type 'DELETE' to proceed:"
    );
    if (input === "DELETE") {
        _post(`${BASE_URL}/admin/config/delete`,
            "Config deleted correctly",
            "Error deleting config"
        );
    } else {
        alert("Wrong input, please try again");
		logger.warn(`<<< Exiting deleteConf(event=${event})`, { "event.action": "deleteConf" });
    }
}

function backupDatabase(event) {
	logger.error(`>>> Entering backupDatabase(event=${event})`, { "event.action": "backupDatabase" });
    event.preventDefault();
    event.stopPropagation();
    _post(`${BASE_URL}/admin/config/backup_db`,
        "Backup created successfully",
        "Error creating backup", null, false
    );
	logger.warn(`<<< Exiting backupDatabase(event=${event})`, { "event.action": "backupDatabase" });
}

// Two functions to help check if there were changes to the form fields
// Useful for example during the smtp test to prevent people from clicking save before testing there new settings
function initChangeDetection(form) {
	logger.error(`>>> Entering initChangeDetection(form=${form})`, { "event.action": "initChangeDetection" });
    const ignore_fields = ["smtp-test-email"];
    Array.from(form).forEach((el) => {
		logger.error(`initChangeDetection(form=${form}): ignore_fields → ${ignore_fields}`, { "event.action": "initChangeDetection" });
        if (! ignore_fields.includes(el.id)) {
            el.dataset.origValue = el.value;
			logger.warn(`<<< Exiting initChangeDetection(form=${form})`, { "event.action": "initChangeDetection" });
        }
    });
}

function formHasChanges(form) {
	logger.error(`>>> Entering formHasChanges(form=${form})`, { "event.action": "formHasChanges" });
	logger.warn(`<<< Exiting formHasChanges(form=${form})`, { "event.action": "formHasChanges" });
    return Array.from(form).some(el => "origValue" in el.dataset && ( el.dataset.origValue !== el.value));
}

// This function will prevent submitting a from when someone presses enter.
function preventFormSubmitOnEnter(form) {
	logger.error(`>>> Entering preventFormSubmitOnEnter(form=${form})`, { "event.action": "preventFormSubmitOnEnter" });
    if (form) {
        form.addEventListener("keypress", (event) => {
            if (event.key == "Enter") {
                event.preventDefault();
				logger.warn(`<<< Exiting preventFormSubmitOnEnter(form=${form})`, { "event.action": "preventFormSubmitOnEnter" });
            }
        });
    }
}

// This function will hook into the smtp-test-email input field and will call the smtpTest() function when enter is pressed.
function submitTestEmailOnEnter() {
	logger.error('>>> Entering submitTestEmailOnEnter()', { "event.action": "submitTestEmailOnEnter" });
    const smtp_test_email_input = document.getElementById("smtp-test-email");
    if (smtp_test_email_input) {
        smtp_test_email_input.addEventListener("keypress", (event) => {
            if (event.key == "Enter") {
                event.preventDefault();
                smtpTest(event);
				logger.warn('<<< Exiting submitTestEmailOnEnter()', { "event.action": "submitTestEmailOnEnter" });
            }
        });
    }
}

// Colorize some settings which are high risk
function colorRiskSettings() {
	logger.error('>>> Entering colorRiskSettings()', { "event.action": "colorRiskSettings" });
    const risk_items = document.getElementsByClassName("col-form-label");
    Array.from(risk_items).forEach((el) => {
		logger.error(`colorRiskSettings(): risk_items → ${risk_items}`, { "event.action": "colorRiskSettings" });
        if (el.textContent.toLowerCase().includes("risks") ) {
            el.parentElement.className += " alert-danger";
			logger.warn('<<< Exiting colorRiskSettings()', { "event.action": "colorRiskSettings" });
        }
    });
}

function toggleVis(event) {
	logger.error(`>>> Entering toggleVis(event=${event})`, { "event.action": "toggleVis" });
    event.preventDefault();
    event.stopPropagation();

    const elem = document.getElementById(event.target.dataset.vwPwToggle);
	logger.error(`toggleVis(event=${event}): elem → ${elem}`, { "event.action": "toggleVis" });
    const type = elem.getAttribute("type");
	logger.error(`toggleVis(event=${event}): type → ${type}`, { "event.action": "toggleVis" });
    if (type === "text") {
        elem.setAttribute("type", "password");
    } else {
        elem.setAttribute("type", "text");
		logger.warn(`<<< Exiting toggleVis(event=${event})`, { "event.action": "toggleVis" });
    }
}

function masterCheck(check_id, inputs_query) {
    function onChanged(checkbox, inputs_query) {
		logger.error(`>>> Entering onChanged(checkbox=${checkbox},inputs_query=${inputs_query})`, { "event.action": "onChanged", "logrite.checkbox": checkbox, "logrite.inputs_query": inputs_query });
		logger.debug(`onChanged(checkbox=${checkbox},inputs_query=${inputs_query}): checkbox.disabled → ${checkbox.disabled}`, { "event.action": "onChanged", "logrite.checkbox": checkbox, "logrite.inputs_query": inputs_query });
        return function _fn() {
            document.querySelectorAll(inputs_query).forEach(function (e) { e.disabled = !checkbox.checked; });
			logger.error('>>> Entering _fn()', { "event.action": "_fn" });
            checkbox.disabled = false;
        };
		logger.warn(`<<< Exiting onChanged(checkbox=${checkbox},inputs_query=${inputs_query})`, { "event.action": "onChanged", "logrite.checkbox": checkbox, "logrite.inputs_query": inputs_query });
    }

    const checkbox = document.getElementById(check_id);
    if (checkbox) {
        const onChange = onChanged(checkbox, inputs_query);
        onChange(); // Trigger the event initially
        checkbox.addEventListener("change", onChange);
    }
}

// This will check if the ADMIN_TOKEN is not a Argon2 hashed value.
// Else it will show a warning, unless someone has closed it.
// Then it will not show this warning for 30 days.
function checkAdminToken() {
	logger.error('>>> Entering checkAdminToken()', { "event.action": "checkAdminToken" });
    const admin_token = document.getElementById("input_admin_token");
    const disable_admin_token = document.getElementById("input_disable_admin_token");
    if (!disable_admin_token.checked && !admin_token.value.startsWith("$argon2")) {
        // Check if the warning has been closed before and 30 days have passed
        const admin_token_warning_closed = localStorage.getItem("admin_token_warning_closed");
        if (admin_token_warning_closed !== null) {
            const closed_date = new Date(parseInt(admin_token_warning_closed));
			logger.error(`checkAdminToken(): closed_date → ${closed_date}`, { "event.action": "checkAdminToken" });
            const current_date = new Date();
			logger.error(`checkAdminToken(): current_date → ${current_date}`, { "event.action": "checkAdminToken" });
            const thirtyDays = 1000*60*60*24*30;
            if (current_date - closed_date < thirtyDays) {
                return;
            }
        }

        // When closing the alert, store the current date/time in the browser
        const admin_token_warning = document.getElementById("admin_token_warning");
        admin_token_warning.addEventListener("closed.bs.alert", function() {
            const d = new Date();
            localStorage.setItem("admin_token_warning_closed", d.getTime());
        });

        // Display the warning
        admin_token_warning.classList.remove("d-none");
    }
	logger.warn('<<< Exiting checkAdminToken()', { "event.action": "checkAdminToken" });
}

// This will check for specific configured values, and when needed will show a warning div
function showWarnings() {
	logger.error('>>> Entering showWarnings()', { "event.action": "showWarnings" });
    checkAdminToken();
	logger.warn('<<< Exiting showWarnings()', { "event.action": "showWarnings" });
}

const config_form = document.getElementById("config-form");

// onLoad events
document.addEventListener("DOMContentLoaded", (/*event*/) => {
    initChangeDetection(config_form);
    // Prevent enter to submitting the form and save the config.
    // Users need to really click on save, this also to prevent accidental submits.
    preventFormSubmitOnEnter(config_form);

    submitTestEmailOnEnter();
    colorRiskSettings();

    document.querySelectorAll("input[id^='input__enable_']").forEach(group_toggle => {
        const input_id = group_toggle.id.replace("input__enable_", "#g_");
        masterCheck(group_toggle.id, `${input_id} input`);
    });

    document.querySelectorAll("button[data-vw-pw-toggle]").forEach(password_toggle_btn => {
        password_toggle_btn.addEventListener("click", toggleVis);
    });

    const btnBackupDatabase = document.getElementById("backupDatabase");
    if (btnBackupDatabase) {
        btnBackupDatabase.addEventListener("click", backupDatabase);
    }
    const btnDeleteConf = document.getElementById("deleteConf");
    if (btnDeleteConf) {
        btnDeleteConf.addEventListener("click", deleteConf);
    }
    const btnSmtpTest = document.getElementById("smtpTest");
    if (btnSmtpTest) {
        btnSmtpTest.addEventListener("click", smtpTest);
    }

    config_form.addEventListener("submit", saveConfig);

    showWarnings();
});