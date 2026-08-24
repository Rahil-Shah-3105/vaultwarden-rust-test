const logger = console;
"use strict";
/* global jQuery, _post:readable, _delete:readable, BASE_URL:readable, reload:readable, jdenticon:readable */

function deleteUser(event) {
	logger.debug(`>>> Entering deleteUser(event=${event})`);
    event.preventDefault();
    event.stopPropagation();
    const id = event.target.parentNode.dataset.vwUserUuid;
	logger.debug(`deleteUser(event=${event}): id → ${id}`);
    const email = event.target.parentNode.dataset.vwUserEmail;
	logger.debug(`deleteUser(event=${event}): email → ${email}`);
    if (!id || !email) {
        alert("Required parameters not found!");
		logger.debug(`<<< Exiting deleteUser(event=${event})`);
        return false;
    }
    const input_email = prompt(`To delete user "${email}", please type the email below`);
	logger.debug(`deleteUser(event=${event}): input_email → ${input_email}`);
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
	logger.debug(`>>> Entering deleteSSOUser(event=${event})`);
    event.preventDefault();
    event.stopPropagation();
    const id = event.target.parentNode.dataset.vwUserUuid;
	logger.debug(`deleteSSOUser(event=${event}): id → ${id}`);
    const email = event.target.parentNode.dataset.vwUserEmail;
	logger.debug(`deleteSSOUser(event=${event}): email → ${email}`);
    if (!id || !email) {
        alert("Required parameters not found!");
		logger.debug(`<<< Exiting deleteSSOUser(event=${event})`);
        return false;
    }
    const input_email = prompt(`To delete user "${email}" SSO association, please type the email below`);
	logger.debug(`deleteSSOUser(event=${event}): input_email → ${input_email}`);
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
	logger.debug(`>>> Entering remove2fa(event=${event})`);
    event.preventDefault();
    event.stopPropagation();
    const id = event.target.parentNode.dataset.vwUserUuid;
	logger.debug(`remove2fa(event=${event}): id → ${id}`);
    const email = event.target.parentNode.dataset.vwUserEmail;
	logger.debug(`remove2fa(event=${event}): email → ${email}`);
    if (!id || !email) {
        alert("Required parameters not found!");
		logger.debug(`<<< Exiting remove2fa(event=${event})`);
        return false;
    }
    const confirmed = confirm(`Are you sure you want to remove 2FA for "${email}"?`);
	logger.debug(`remove2fa(event=${event}): confirmed → ${confirmed}`);
    if (confirmed) {
        _post(`${BASE_URL}/admin/users/${id}/remove-2fa`,
            "2FA removed correctly",
            "Error removing 2FA"
        );
    }
}

function deauthUser(event) {
	logger.debug(`>>> Entering deauthUser(event=${event})`);
    event.preventDefault();
    event.stopPropagation();
    const id = event.target.parentNode.dataset.vwUserUuid;
	logger.debug(`deauthUser(event=${event}): id → ${id}`);
    const email = event.target.parentNode.dataset.vwUserEmail;
	logger.debug(`deauthUser(event=${event}): email → ${email}`);
    if (!id || !email) {
        alert("Required parameters not found!");
		logger.debug(`<<< Exiting deauthUser(event=${event})`);
        return false;
    }
    const confirmed = confirm(`Are you sure you want to deauthorize sessions for "${email}"?`);
	logger.debug(`deauthUser(event=${event}): confirmed → ${confirmed}`);
    if (confirmed) {
        _post(`${BASE_URL}/admin/users/${id}/deauth`,
            "Sessions deauthorized correctly",
            "Error deauthorizing sessions"
        );
    }
}

function disableUser(event) {
	logger.debug(`>>> Entering disableUser(event=${event})`);
    event.preventDefault();
    event.stopPropagation();
    const id = event.target.parentNode.dataset.vwUserUuid;
	logger.debug(`disableUser(event=${event}): id → ${id}`);
    const email = event.target.parentNode.dataset.vwUserEmail;
	logger.debug(`disableUser(event=${event}): email → ${email}`);
    if (!id || !email) {
        alert("Required parameters not found!");
		logger.debug(`<<< Exiting disableUser(event=${event})`);
        return false;
    }
    const confirmed = confirm(`Are you sure you want to disable user "${email}"? This will also deauthorize their sessions.`);
	logger.debug(`disableUser(event=${event}): confirmed → ${confirmed}`);
    if (confirmed) {
        _post(`${BASE_URL}/admin/users/${id}/disable`,
            "User disabled successfully",
            "Error disabling user"
        );
    }
}

function enableUser(event) {
	logger.debug(`>>> Entering enableUser(event=${event})`);
    event.preventDefault();
    event.stopPropagation();
    const id = event.target.parentNode.dataset.vwUserUuid;
	logger.debug(`enableUser(event=${event}): id → ${id}`);
    const email = event.target.parentNode.dataset.vwUserEmail;
	logger.debug(`enableUser(event=${event}): email → ${email}`);
    if (!id || !email) {
        alert("Required parameters not found!");
		logger.debug(`<<< Exiting enableUser(event=${event})`);
        return false;
    }
    const confirmed = confirm(`Are you sure you want to enable user "${email}"?`);
	logger.debug(`enableUser(event=${event}): confirmed → ${confirmed}`);
    if (confirmed) {
        _post(`${BASE_URL}/admin/users/${id}/enable`,
            "User enabled successfully",
            "Error enabling user"
        );
    }
}

function updateRevisions(event) {
	logger.debug(`>>> Entering updateRevisions(event=${event})`);
    event.preventDefault();
    event.stopPropagation();
    _post(`${BASE_URL}/admin/users/update_revision`,
        "Success, clients will sync next time they connect",
        "Error forcing clients to sync"
    );
	logger.debug(`<<< Exiting updateRevisions(event=${event})`);
}

function inviteUser(event) {
	logger.debug(`>>> Entering inviteUser(event=${event})`);
    event.preventDefault();
    event.stopPropagation();
    const email = document.getElementById("inviteEmail");
    const data = JSON.stringify({
        "email": email.value
    });
    email.value = "";
	logger.debug(`inviteUser(event=${event}): email → ${email}`);
    _post(`${BASE_URL}/admin/invite`,
        "User invited correctly",
        "Error inviting user",
        data
    );
	logger.debug(`inviteUser(event=${event}): data → ${data}`);
}

function resendUserInvite (event) {
	logger.debug(`>>> Entering resendUserInvite(event=${event})`);
    event.preventDefault();
    event.stopPropagation();
    const id = event.target.parentNode.dataset.vwUserUuid;
	logger.debug(`resendUserInvite(event=${event}): id → ${id}`);
    const email = event.target.parentNode.dataset.vwUserEmail;
	logger.debug(`resendUserInvite(event=${event}): email → ${email}`);
    if (!id || !email) {
        alert("Required parameters not found!");
		logger.debug(`<<< Exiting resendUserInvite(event=${event})`);
        return false;
    }
    const confirmed = confirm(`Are you sure you want to resend invitation for "${email}"?`);
	logger.debug(`resendUserInvite(event=${event}): confirmed → ${confirmed}`);
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
		logger.debug(`>>> Entering function(a=${a})`);
        let x;
        const sortDate = a.replace(/(<([^>]+)>)/gi, "").trim();
        if (sortDate !== "") {
            const dtParts = sortDate.split(" ");
			logger.debug(`function(a=${a}): sortDate → ${sortDate}`);
			logger.debug(`function(a=${a}): dtParts → ${dtParts}`);
            const timeParts = (undefined != dtParts[1]) ? dtParts[1].split(":") : ["00", "00", "00"];
            const dateParts = dtParts[0].split("-");
			logger.debug(`function(a=${a}): timeParts → ${timeParts}`);
			logger.debug(`function(a=${a}): dateParts → ${dateParts}`);
            x = (dateParts[0] + dateParts[1] + dateParts[2] + timeParts[0] + timeParts[1] + ((undefined != timeParts[2]) ? timeParts[2] : 0)) * 1;
            if (isNaN(x)) {
                x = 0;
            }
        } else {
            x = Infinity;
        }
		logger.debug(`<<< Exiting function(a=${a})`);
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
	logger.debug(`>>> Entering addEventListener(false=${false})`);
    const userEmail = event.relatedTarget.parentNode.dataset.vwUserEmail;
    const userUuid = event.relatedTarget.parentNode.dataset.vwUserUuid;
    // Get org specific values
    const userOrgType = event.relatedTarget.dataset.vwOrgType;
    const userOrgTypeName = ORG_TYPES[userOrgType]["name"];
	logger.debug(`addEventListener(userEmail=${userEmail},false=${false}): userOrgTypeName → ${userOrgTypeName}`);
    const orgName = event.relatedTarget.dataset.vwOrgName;
    const orgUuid = event.relatedTarget.dataset.vwOrgUuid;

    document.getElementById("userOrgTypeDialogOrgName").textContent = orgName;
    document.getElementById("userOrgTypeDialogUserEmail").textContent = userEmail;
    document.getElementById("userOrgTypeUserUuid").value = userUuid;
    document.getElementById("userOrgTypeOrgUuid").value = orgUuid;
    document.getElementById(`userOrgType${userOrgTypeName}`).checked = true;
	logger.debug(`<<< Exiting addEventListener(userEmail=${userEmail},false=${false})`);
}, false);

// Prevent accidental submission of the form with valid elements after the modal has been hidden.
userOrgTypeDialog.addEventListener("hide.bs.modal", function() {
    document.getElementById("userOrgTypeDialogOrgName").textContent = "";
    document.getElementById("userOrgTypeDialogUserEmail").textContent = "";
    document.getElementById("userOrgTypeUserUuid").value = "";
    document.getElementById("userOrgTypeOrgUuid").value = "";
}, false);

function updateUserOrgType(event) {
	logger.debug(`>>> Entering updateUserOrgType(event=${event})`);
    event.preventDefault();
    event.stopPropagation();

    const data = JSON.stringify(Object.fromEntries(new FormData(event.target).entries()));
	logger.debug(`updateUserOrgType(event=${event}): data → ${data}`);

    _post(`${BASE_URL}/admin/users/org_type`,
        "Updated organization type of the user successfully",
        "Error updating organization type of the user",
        data
    );
	logger.debug(`<<< Exiting updateUserOrgType(event=${event})`);
}

function initUserTable() {
	logger.debug('>>> Entering initUserTable()');
    // Color all the org buttons per type
    document.querySelectorAll("button[data-vw-org-type]").forEach(function(e) {
		logger.debug('>>> Entering forEach()');
        const orgType = ORG_TYPES[e.dataset.vwOrgType];
        e.style.backgroundColor = orgType.bg;
        if (orgType.font !== undefined) {
            e.style.color = orgType.font;
        }
        e.title = orgType.name;
    });

	logger.debug(`initUserTable(): e.title → ${e.title}`);
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
		logger.debug('<<< Exiting initUserTable()');
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
