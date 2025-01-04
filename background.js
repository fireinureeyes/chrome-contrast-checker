// unique query for compatibility mode
var id = 100;

// Listen for a click on browser action icon
chrome.action.onClicked.addListener(function(theTab) {
    console.log("Clicked on the icon");

    chrome.storage.local.get({
        magnifierStrength: 3,
        magnifierStrength2: 4.5,
        magnifierSize: 200,
        magnifierShape: 100,
        osFactor: 100
    }, function(items){
        // Check if compatibility mode is enabled
        if(items.magnifierCM){
            // Close the tab if it's a magnifier tab
            if (theTab.title.indexOf("_Magnifying_Glass")==0){
                chrome.tabs.remove(theTab.id);
                return;
            }
            // Capture the image in loseless format
            chrome.tabs.captureVisibleTab({format: "png"}, function(screenshotUrl) {
                var viewTabUrl = chrome.runtime.getURL('snapshot.html?id=' + id++)
                var targetId = null;

                chrome.tabs.onUpdated.addListener(function listener(tabId, changedProps) {
                    // Wait for the tab we opened to finish loading.
                    if (tabId != targetId || changedProps.status != "complete") return;

                    chrome.tabs.onUpdated.removeListener(listener);
                    // Look through all views to find the window which will display the screenshot
                    var views = chrome.extension.getViews();
                    for (var i = 0; i < views.length; i++) {
                        var view = views[i];
                        if (view.location.href == viewTabUrl) {
                            // Setup the image
                            view.setScreenshotUrl(screenshotUrl);
                            view.setMagnifier(items.magnifierStrength, items.magnifierStrength2, items.magnifierSize,
                                items.magnifierAA, items.magnifierShape);
                            break;
                        }
                    }
                })
                // Open the magnifier tab at appropriate position
                chrome.tabs.create({url: viewTabUrl, index: theTab.index}, function(tab) {
                    targetId = tab.id;
                })
            })
        } else {
            // Capture the current viewport
            chrome.tabs.captureVisibleTab({format: "png"}, function(screenshotUrl) {
                chrome.scripting.insertCSS({target: {tabId: theTab.id}, files: ["snapshot2.css"]}, function () {
                    chrome.scripting.executeScript({target: {tabId: theTab.id}, files: ["jquery-3.2.1.min.js"]}, function () {
                        chrome.scripting.executeScript({target: {tabId: theTab.id}, files: ["magnifying-glass.js"]}, function () {
                            chrome.tabs.getZoom(theTab.id, function(zoomFactor){
                                chrome.tabs.sendMessage(theTab.id, {
                                    snapshot_url: screenshotUrl, magnifier_str: items.magnifierStrength, magnifier_str2: items.magnifierStrength2,
                                    magnifier_size: items.magnifierSize,
                                    magnifier_shape: items.magnifierShape, page_zoom: zoomFactor,
                                    os_compensation: items.osFactor
                                })
                            })
                        })
                    })
                })
            })
        }
    })
})
