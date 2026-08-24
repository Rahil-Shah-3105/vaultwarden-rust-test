const logger = console;
"use strict";
/* global _post:readable, BASE_URL:readable */

function smtpTest(event) {
	logger.debug(`>>> Entering smtpTest(event=${event})`);
    event.preventDefault();
    event.stopPropagation();
    if (formHasChanges(config_form)) {
        alert("Config has been changed but not yet saved.\nPlease save the changes first before sending a test email.");
        return false;
    }

    const test_email = document.getElementById("smtp-test-email");
	logger.debug(`smtpTest(event=${event}): test_email → ${test_email}`);

    // Do a very very basic email address check.
    if (test_email.value.match(/\S+@\S+/i) === null) {
        test_email.parentElement.classList.add("was-validated");
		logger.debug(`<<< Exiting smtpTest(event=${event})`);
        return false;
    }

    const data = JSON.stringify({ "email": test_email.value });
	logger.debug(`smtpTest(event=${event}): data → ${data}`);
    _post(`${BASE_URL}/admin/test/smtp`,
        "SMTP Test email sent correctly",
        "Error sending SMTP test email",
        data, false
    );
}

function getFormData() {
	logger.debug('>>> Entering getFormData()');
    let data = {};

	logger.debug(`getFormData(): data → ${data}`);
    document.querySelectorAll(".conf-checkbox").forEach(function (e) {
		logger.debug('>>> Entering forEach()');
        data[e.name] = e.checked;
    });

    document.querySelectorAll(".conf-number").forEach(function (e) {
        data[e.name] = e.value ? +e.value : null;
    });

    document.querySelectorAll(".conf-text, .conf-password").forEach(function (e) {
        data[e.name] = e.value || null;
    });
	logger.debug('<<< Exiting getFormData()');
    return data;
}

function saveConfig(event) {
	logger.debug(`>>> Entering saveConfig(event=${event})`);
    const data = JSON.stringify(getFormData());
    _post(`${BASE_URL}/admin/config`,
        "Config saved correctly",
        "Error saving config",
        data
    );
    event.preventDefault();
	logger.debug(`saveConfig(event=${event}): data → ${data}`);
}

function deleteConf(event) {
	logger.debug(`>>> Entering deleteConf(event=${event})`);
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
		logger.debug(`<<< Exiting deleteConf(event=${event})`);
    }
}

function backupDatabase(event) {
	logger.debug(`>>> Entering backupDatabase(event=${event})`);
    event.preventDefault();
    event.stopPropagation();
    _post(`${BASE_URL}/admin/config/backup_db`,
        "Backup created successfully",
        "Error creating backup", null, false
    );
	logger.debug(`<<< Exiting backupDatabase(event=${event})`);
}

// Two functions to help check if there were changes to the form fields
// Useful for example during the smtp test to prevent people from clicking save before testing there new settings
function initChangeDetection(form) {
	logger.debug(`>>> Entering initChangeDetection(form=${form})`);
    const ignore_fields = ["smtp-test-email"];
    Array.from(form).forEach((el) => {
		logger.debug(`initChangeDetection(form=${form}): ignore_fields → ${ignore_fields}`);
        if (! ignore_fields.includes(el.id)) {
            el.dataset.origValue = el.value;
			logger.debug(`<<< Exiting initChangeDetection(form=${form})`);
        }
    });
}

function formHasChanges(form) {
	logger.debug(`>>> Entering formHasChanges(form=${form})`);
	logger.debug(`<<< Exiting formHasChanges(form=${form})`);
    return Array.from(form).some(el => "origValue" in el.dataset && ( el.dataset.origValue !== el.value));
}

// This function will prevent submitting a from when someone presses enter.
function preventFormSubmitOnEnter(form) {
	logger.debug(`>>> Entering preventFormSubmitOnEnter(form=${form})`);
    if (form) {
        form.addEventListener("keypress", (event) => {
            if (event.key == "Enter") {
                event.preventDefault();
				logger.debug(`<<< Exiting preventFormSubmitOnEnter(form=${form})`);
            }
        });
    }
}

// This function will hook into the smtp-test-email input field and will call the smtpTest() function when enter is pressed.
function submitTestEmailOnEnter() {
	logger.debug('>>> Entering submitTestEmailOnEnter()');
    const smtp_test_email_input = document.getElementById("smtp-test-email");
    if (smtp_test_email_input) {
		logger.debug(`submitTestEmailOnEnter(): smtp_test_email_input → ${smtp_test_email_input}`);
        smtp_test_email_input.addEventListener("keypress", (event) => {
            if (event.key == "Enter") {
                event.preventDefault();
                smtpTest(event);
				logger.debug('<<< Exiting submitTestEmailOnEnter()');
            }
        });
    }
}

// Colorize some settings which are high risk
function colorRiskSettings() {
	logger.debug('>>> Entering colorRiskSettings()');
    const risk_items = document.getElementsByClassName("col-form-label");
    Array.from(risk_items).forEach((el) => {
		logger.debug(`colorRiskSettings(): risk_items → ${risk_items}`);
        if (el.textContent.toLowerCase().includes("risks") ) {
            el.parentElement.className += " alert-danger";
			logger.debug('<<< Exiting colorRiskSettings()');
        }
    });
}

function toggleVis(event) {
	logger.debug(`>>> Entering toggleVis(event=${event})`);
    event.preventDefault();
    event.stopPropagation();

    const elem = document.getElementById(event.target.dataset.vwPwToggle);
	logger.debug(`toggleVis(event=${event}): elem → ${elem}`);
    const type = elem.getAttribute("type");
	logger.debug(`toggleVis(event=${event}): type → ${type}`);
    if (type === "text") {
        elem.setAttribute("type", "password");
    } else {
        elem.setAttribute("type", "text");
		logger.debug(`<<< Exiting toggleVis(event=${event})`);
    }
}

function masterCheck(check_id, inputs_query) {
    function onChanged(checkbox, inputs_query) {
		logger.debug(`>>> Entering onChanged(checkbox=${checkbox},inputs_query=${inputs_query})`);
        return function _fn() {
		logger.debug('>>> Entering _fn()');
            document.querySelectorAll(inputs_query).forEach(function (e) { e.disabled = !checkbox.checked; });
            checkbox.disabled = false;
			logger.debug('<<< Exiting _fn()');
        };
		logger.debug(`<<< Exiting onChanged(checkbox=${checkbox},inputs_query=${inputs_query})`);
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
	logger.debug('>>> Entering checkAdminToken()');
    const admin_token = document.getElementById("input_admin_token");
    const disable_admin_token = document.getElementById("input_disable_admin_token");
    if (!disable_admin_token.checked && !admin_token.value.startsWith("$argon2")) {
        // Check if the warning has been closed before and 30 days have passed
        const admin_token_warning_closed = localStorage.getItem("admin_token_warning_closed");
        if (admin_token_warning_closed !== null) {
            const closed_date = new Date(parseInt(admin_token_warning_closed));
			logger.debug(`checkAdminToken(): closed_date → ${closed_date}`);
            const current_date = new Date();
			logger.debug(`checkAdminToken(): current_date → ${current_date}`);
            const thirtyDays = 1000*60*60*24*30;
            if (current_date - closed_date < thirtyDays) {
                return;
            }
        }

        // When closing the alert, store the current date/time in the browser
        const admin_token_warning = document.getElementById("admin_token_warning");
        admin_token_warning.addEventListener("closed.bs.alert", function() {
			logger.debug(`>>> Entering addEventListener(d=${d})`);
            const d = new Date();
            localStorage.setItem("admin_token_warning_closed", d.getTime());
        });

        // Display the warning
        admin_token_warning.classList.remove("d-none");
    }
	logger.debug('<<< Exiting checkAdminToken()');
}

// This will check for specific configured values, and when needed will show a warning div
function showWarnings() {
	logger.debug('>>> Entering showWarnings()');
    checkAdminToken();
	logger.debug('<<< Exiting showWarnings()');
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