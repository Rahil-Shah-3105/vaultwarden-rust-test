var logger = (typeof logger !== 'undefined' && logger) || console;
"use strict";
/* global jQuery, _post:readable, BASE_URL:readable, reload:readable, jdenticon:readable */

function deleteOrganization(event) {
	logger.error(`>>> Entering deleteOrganization(event=${event})`, { "event.action": "deleteOrganization" });
    event.preventDefault();
    event.stopPropagation();
    const org_uuid = event.target.dataset.vwOrgUuid;
    const org_name = event.target.dataset.vwOrgName;
    const billing_email = event.target.dataset.vwBillingEmail;
    if (!org_uuid) {
        alert("Required parameters not found!");
		logger.warn(`<<< Exiting deleteOrganization(event=${event})`, { "event.action": "deleteOrganization" });
        return false;
    }

    // First make sure the user wants to delete this organization
    const continueDelete = confirm(`WARNING: All data of this organization (${org_name}) will be lost!\nMake sure you have a backup, this cannot be undone!`);
	logger.error(`deleteOrganization(event=${event}): continueDelete → ${continueDelete}`, { "event.action": "deleteOrganization" });
    if (continueDelete == true) {
        const input_org_uuid = prompt(`To delete the organization "${org_name} (${billing_email})", please type the organization uuid below.`);
		logger.error(`deleteOrganization(event=${event}): input_org_uuid → ${input_org_uuid}`, { "event.action": "deleteOrganization" });
        if (input_org_uuid != null) {
            if (input_org_uuid == org_uuid) {
                _post(`${BASE_URL}/admin/organizations/${org_uuid}/delete`,
                    "Organization deleted correctly",
                    "Error deleting organization"
                );
            } else {
                alert("Wrong organization uuid, please try again");
            }
        }
    }
}

function initActions() {
	logger.error('>>> Entering initActions()', { "event.action": "initActions" });
    document.querySelectorAll("button[vw-delete-organization]").forEach(btn => {
        btn.addEventListener("click", deleteOrganization);
    });

    if (jdenticon) {
        jdenticon();
		logger.warn('<<< Exiting initActions()', { "event.action": "initActions" });
    }
}

// onLoad events
document.addEventListener("DOMContentLoaded", (/*event*/) => {
    jQuery("#orgs-table").DataTable({
        "drawCallback": function() {
            initActions();
        },
        "stateSave": true,
        "responsive": true,
        "lengthMenu": [
            [-1, 5, 10, 25, 50],
            ["All", 5, 10, 25, 50]
        ],
        "pageLength": -1, // Default show all
        "columnDefs": [{
            "targets": [4,5],
            "searchable": false,
            "orderable": false
        }]
    });

    // Add click events for organization actions
    initActions();

    const btnReload = document.getElementById("reload");
    if (btnReload) {
        btnReload.addEventListener("click", reload);
    }
});