// Save options to chrome.storage.local.
function save_options() {
    var magStr = document.getElementById('strength').value;
    var magStr2 = document.getElementById('strength2').value;
    chrome.storage.local.set({
        magnifierStrength: magStr,
        magnifierStrength2: magStr2,
    }, function() {
        // Update status to let user know options were saved.
        var status = document.getElementById('status');
        if (magStr <= 0 || magStr2 <= 0){
            status.textContent = 'Non-positive number detected, the magnifier might not behave as expected.'
        } else {
            status.textContent = 'Options saved.';
        }
        setTimeout(function() {
            status.textContent = '';
        }, 1550);
    });
};

// Restore data using the preferences stored in chrome.storage.
function restore_options() {
    chrome.storage.local.get({
        magnifierStrength: 3,
        magnifierStrength2: 4.5,
        osFactor: 100,
    }, function(items) {
        document.getElementById('strength').value = items.magnifierStrength;
        document.getElementById('strength2').value = items.magnifierStrength2;
        document.getElementById('os_mag').value = items.osFactor;
    });
};

// Reset the preference to default values
function reset_options(){
    chrome.storage.local.clear(function(){
        restore_options();
        var status = document.getElementById('status');
        status.textContent = 'Options reset.';
        setTimeout(function() {
            status.textContent = '';
        }, 1200);
    });
};

// Set the page to appropriate language
function init(){
    document.getElementById("label_str").innerText = chrome.i18n.getMessage("label_str");
    document.getElementById("label_default").innerText = chrome.i18n.getMessage("label_default");
    document.getElementById("label_save").innerText = chrome.i18n.getMessage("label_save");
    document.getElementById("label_compensation").innerText = chrome.i18n.getMessage("label_compensation");
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
document.getElementById('reset').addEventListener('click', reset_options);
init();