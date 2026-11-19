var logger = (typeof logger !== 'undefined' && logger) || console;
"use strict";
/* global jQuery, _post:readable, _delete:readable, BASE_URL:readable, reload:readable, jdenticon:readable */

function deleteUser(event) {
	logger.error(`>>> Entering deleteUser(event=${event})`, { "event.action": "deleteUser" });
    event.preventDefault();
    event.stopPropagation();
    const id = event.target.parentNode.dataset.vwUserUuid;
	logger.error(`deleteUser(event=${event}): id → ${id}`, { "event.action": "deleteUser" });
    const email = event.target.parentNode.dataset.vwUserEmail;
    if (!id || !email) {
        alert("Required parameters not found!");
		logger.warn(`<<< Exiting deleteUser(event=${event})`, { "event.action": "deleteUser" });
        return false;
    }
    const input_email = prompt(`To delete user "${email}", please type the email below`);
    if (input_email != null) {
        if (input_email == email) {
            _post(`${BASE_URL}/admin/users/${id}/delete`,
                "User deleted correctly",
                "Error deleting user"
            );
        } else {
            alert("Wrong email, please try again");
        }
    }
}

function deleteSSOUser(event) {
	logger.error(`>>> Entering deleteSSOUser(event=${event})`, { "event.action": "deleteSSOUser" });
    event.preventDefault();
    event.stopPropagation();
    const id = event.target.parentNode.dataset.vwUserUuid;
	logger.error(`deleteSSOUser(event=${event}): id → ${id}`, { "event.action": "deleteSSOUser" });
    const email = event.target.parentNode.dataset.vwUserEmail;
    if (!id || !email) {
        alert("Required parameters not found!");
		logger.warn(`<<< Exiting deleteSSOUser(event=${event})`, { "event.action": "deleteSSOUser" });
        return false;
    }
    const input_email = prompt(`To delete user "${email}" SSO association, please type the email below`);
    if (input_email != null) {
        if (input_email == email) {
            _delete(`${BASE_URL}/admin/users/${id}/sso`,
                "User SSO association deleted correctly",
                "Error deleting user SSO association"
            );
        } else {
            alert("Wrong email, please try again");
        }
    }
}

function remove2fa(event) {
	logger.error(`>>> Entering remove2fa(event=${event})`, { "event.action": "remove2fa" });
    event.preventDefault();
    event.stopPropagation();
    const id = event.target.parentNode.dataset.vwUserUuid;
	logger.error(`remove2fa(event=${event}): id → ${id}`, { "event.action": "remove2fa" });
    const email = event.target.parentNode.dataset.vwUserEmail;
    if (!id || !email) {
        alert("Required parameters not found!");
		logger.warn(`<<< Exiting remove2fa(event=${event})`, { "event.action": "remove2fa" });
        return false;
    }
    const confirmed = confirm(`Are you sure you want to remove 2FA for "${email}"?`);
	logger.error(`remove2fa(event=${event}): confirmed → ${confirmed}`, { "event.action": "remove2fa" });
    if (confirmed) {
        _post(`${BASE_URL}/admin/users/${id}/remove-2fa`,
            "2FA removed correctly",
            "Error removing 2FA"
        );
    }
}

function deauthUser(event) {
	logger.error(`>>> Entering deauthUser(event=${event})`, { "event.action": "deauthUser" });
    event.preventDefault();
    event.stopPropagation();
    const id = event.target.parentNode.dataset.vwUserUuid;
	logger.error(`deauthUser(event=${event}): id → ${id}`, { "event.action": "deauthUser" });
    const email = event.target.parentNode.dataset.vwUserEmail;
    if (!id || !email) {
        alert("Required parameters not found!");
		logger.warn(`<<< Exiting deauthUser(event=${event})`, { "event.action": "deauthUser" });
        return false;
    }
    const confirmed = confirm(`Are you sure you want to deauthorize sessions for "${email}"?`);
	logger.error(`deauthUser(event=${event}): confirmed → ${confirmed}`, { "event.action": "deauthUser" });
    if (confirmed) {
        _post(`${BASE_URL}/admin/users/${id}/deauth`,
            "Sessions deauthorized correctly",
            "Error deauthorizing sessions"
        );
    }
}

function disableUser(event) {
	logger.error(`>>> Entering disableUser(event=${event})`, { "event.action": "disableUser" });
    event.preventDefault();
    event.stopPropagation();
    const id = event.target.parentNode.dataset.vwUserUuid;
	logger.error(`disableUser(event=${event}): id → ${id}`, { "event.action": "disableUser" });
    const email = event.target.parentNode.dataset.vwUserEmail;
    if (!id || !email) {
        alert("Required parameters not found!");
		logger.warn(`<<< Exiting disableUser(event=${event})`, { "event.action": "disableUser" });
        return false;
    }
    const confirmed = confirm(`Are you sure you want to disable user "${email}"? This will also deauthorize their sessions.`);
	logger.error(`disableUser(event=${event}): confirmed → ${confirmed}`, { "event.action": "disableUser" });
    if (confirmed) {
        _post(`${BASE_URL}/admin/users/${id}/disable`,
            "User disabled successfully",
            "Error disabling user"
        );
    }
}

function enableUser(event) {
	logger.error(`>>> Entering enableUser(event=${event})`, { "event.action": "enableUser" });
    event.preventDefault();
    event.stopPropagation();
    const id = event.target.parentNode.dataset.vwUserUuid;
	logger.error(`enableUser(event=${event}): id → ${id}`, { "event.action": "enableUser" });
    const email = event.target.parentNode.dataset.vwUserEmail;
    if (!id || !email) {
        alert("Required parameters not found!");
		logger.warn(`<<< Exiting enableUser(event=${event})`, { "event.action": "enableUser" });
        return false;
    }
    const confirmed = confirm(`Are you sure you want to enable user "${email}"?`);
	logger.error(`enableUser(event=${event}): confirmed → ${confirmed}`, { "event.action": "enableUser" });
    if (confirmed) {
        _post(`${BASE_URL}/admin/users/${id}/enable`,
            "User enabled successfully",
            "Error enabling user"
        );
    }
}

function updateRevisions(event) {
	logger.error(`>>> Entering updateRevisions(event=${event})`, { "event.action": "updateRevisions" });
    event.preventDefault();
    event.stopPropagation();
    _post(`${BASE_URL}/admin/users/update_revision`,
        "Success, clients will sync next time they connect",
        "Error forcing clients to sync"
    );
	logger.warn(`<<< Exiting updateRevisions(event=${event})`, { "event.action": "updateRevisions" });
}

function inviteUser(event) {
	logger.error(`>>> Entering inviteUser(event=${event})`, { "event.action": "inviteUser" });
    event.preventDefault();
    event.stopPropagation();
    const email = document.getElementById("inviteEmail");
    const data = JSON.stringify({
        "email": email.value
    });
    email.value = "";
    _post(`${BASE_URL}/admin/invite`,
        "User invited correctly",
        "Error inviting user",
        data
    );
	logger.error(`inviteUser(event=${event}): data → ${data}`, { "event.action": "inviteUser" });
}

function resendUserInvite (event) {
	logger.error(`>>> Entering resendUserInvite(event=${event})`, { "event.action": "resendUserInvite" });
    event.preventDefault();
    event.stopPropagation();
    const id = event.target.parentNode.dataset.vwUserUuid;
	logger.error(`resendUserInvite(event=${event}): id → ${id}`, { "event.action": "resendUserInvite" });
    const email = event.target.parentNode.dataset.vwUserEmail;
    if (!id || !email) {
        alert("Required parameters not found!");
		logger.warn(`<<< Exiting resendUserInvite(event=${event})`, { "event.action": "resendUserInvite" });
        return false;
    }
    const confirmed = confirm(`Are you sure you want to resend invitation for "${email}"?`);
	logger.error(`resendUserInvite(event=${event}): confirmed → ${confirmed}`, { "event.action": "resendUserInvite" });
    if (confirmed) {
        _post(`${BASE_URL}/admin/users/${id}/invite/resend`,
            "Invite sent successfully",
            "Error resend invite"
        );
    }
}

const ORG_TYPES = {
    "0": {
        "name": "Owner",
        "bg": "orange",
        "font": "black"
    },
    "1": {
        "name": "Admin",
        "bg": "blueviolet"
    },
    "2": {
        "name": "User",
        "bg": "blue"
    },
    "4": {
        "name": "Manager",
        "bg": "green"
    },
};

// Special sort function to sort dates in ISO format
jQuery.extend(jQuery.fn.dataTableExt.oSort, {
    "date-iso-pre": function(a) {
        let x;
        const sortDate = a.replace(/(<([^>]+)>)/gi, "").trim();
        if (sortDate !== "") {
            const dtParts = sortDate.split(" ");
            const timeParts = (undefined != dtParts[1]) ? dtParts[1].split(":") : ["00", "00", "00"];
            const dateParts = dtParts[0].split("-");
            x = (dateParts[0] + dateParts[1] + dateParts[2] + timeParts[0] + timeParts[1] + ((undefined != timeParts[2]) ? timeParts[2] : 0)) * 1;
            if (isNaN(x)) {
                x = 0;
            }
        } else {
            x = Infinity;
        }
        return x;
    },

    "date-iso-asc": function(a, b) {
        return a - b;
    },

    "date-iso-desc": function(a, b) {
        return b - a;
    }
});

const userOrgTypeDialog = document.getElementById("userOrgTypeDialog");
// Fill the form and title
userOrgTypeDialog.addEventListener("show.bs.modal", function(event) {
    // Get shared values
    const userEmail = event.relatedTarget.parentNode.dataset.vwUserEmail;
    const userUuid = event.relatedTarget.parentNode.dataset.vwUserUuid;
    // Get org specific values
    const userOrgType = event.relatedTarget.dataset.vwOrgType;
    const userOrgTypeName = ORG_TYPES[userOrgType]["name"];
    const orgName = event.relatedTarget.dataset.vwOrgName;
    const orgUuid = event.relatedTarget.dataset.vwOrgUuid;

    document.getElementById("userOrgTypeDialogOrgName").textContent = orgName;
    document.getElementById("userOrgTypeDialogUserEmail").textContent = userEmail;
    document.getElementById("userOrgTypeUserUuid").value = userUuid;
    document.getElementById("userOrgTypeOrgUuid").value = orgUuid;
    document.getElementById(`userOrgType${userOrgTypeName}`).checked = true;
}, false);

// Prevent accidental submission of the form with valid elements after the modal has been hidden.
userOrgTypeDialog.addEventListener("hide.bs.modal", function() {
    document.getElementById("userOrgTypeDialogOrgName").textContent = "";
    document.getElementById("userOrgTypeDialogUserEmail").textContent = "";
    document.getElementById("userOrgTypeUserUuid").value = "";
    document.getElementById("userOrgTypeOrgUuid").value = "";
}, false);

function updateUserOrgType(event) {
	logger.error(`>>> Entering updateUserOrgType(event=${event})`, { "event.action": "updateUserOrgType" });
    event.preventDefault();
    event.stopPropagation();

    const data = JSON.stringify(Object.fromEntries(new FormData(event.target).entries()));
	logger.error(`updateUserOrgType(event=${event}): data → ${data}`, { "event.action": "updateUserOrgType" });

    _post(`${BASE_URL}/admin/users/org_type`,
        "Updated organization type of the user successfully",
        "Error updating organization type of the user",
        data
    );
	logger.warn(`<<< Exiting updateUserOrgType(event=${event})`, { "event.action": "updateUserOrgType" });
}

function initUserTable() {
	logger.error('>>> Entering initUserTable()', { "event.action": "initUserTable" });
    // Color all the org buttons per type
    document.querySelectorAll("button[data-vw-org-type]").forEach(function(e) {
        const orgType = ORG_TYPES[e.dataset.vwOrgType];
        e.style.backgroundColor = orgType.bg;
        if (orgType.font !== undefined) {
            e.style.color = orgType.font;
        }
        e.title = orgType.name;
    });

    document.querySelectorAll("button[vw-remove2fa]").forEach(btn => {
        btn.addEventListener("click", remove2fa);
    });
    document.querySelectorAll("button[vw-deauth-user]").forEach(btn => {
        btn.addEventListener("click", deauthUser);
    });
    document.querySelectorAll("button[vw-delete-user]").forEach(btn => {
        btn.addEventListener("click", deleteUser);
    });
    document.querySelectorAll("button[vw-delete-sso-user]").forEach(btn => {
        btn.addEventListener("click", deleteSSOUser);
    });
    document.querySelectorAll("button[vw-disable-user]").forEach(btn => {
        btn.addEventListener("click", disableUser);
    });
    document.querySelectorAll("button[vw-enable-user]").forEach(btn => {
        btn.addEventListener("click", enableUser);
    });
    document.querySelectorAll("button[vw-resend-user-invite]").forEach(btn => {
        btn.addEventListener("click", resendUserInvite);
    });

    if (jdenticon) {
        jdenticon();
		logger.warn('<<< Exiting initUserTable()', { "event.action": "initUserTable" });
    }
}

// onLoad events
document.addEventListener("DOMContentLoaded", (/*event*/) => {
    const size = jQuery("#users-table > thead th").length;
    const ssoOffset = size-7;
    jQuery("#users-table").DataTable({
        "drawCallback": function() {
            initUserTable();
        },
        "stateSave": true,
        "responsive": true,
        "lengthMenu": [
            [-1, 2, 5, 10, 25, 50],
            ["All", 2, 5, 10, 25, 50]
        ],
        "pageLength": -1, // Default show all
        "columnDefs": [{
            "targets": [1 + ssoOffset, 2 + ssoOffset],
            "type": "date-iso"
        }, {
            "targets": size-1,
            "searchable": false,
            "orderable": false
        }]
    });

    // Add click events for user actions
    initUserTable();

    const btnUpdateRevisions = document.getElementById("updateRevisions");
    if (btnUpdateRevisions) {
        btnUpdateRevisions.addEventListener("click", updateRevisions);
    }
    const btnReload = document.getElementById("reload");
    if (btnReload) {
        btnReload.addEventListener("click", reload);
    }
    const btnUserOrgTypeForm = document.getElementById("userOrgTypeForm");
    if (btnUserOrgTypeForm) {
        btnUserOrgTypeForm.addEventListener("submit", updateUserOrgType);
    }
    const btnInviteUserForm = document.getElementById("inviteUserForm");
    if (btnInviteUserForm) {
        btnInviteUserForm.addEventListener("submit", inviteUser);
    }
});
