chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "search") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const currentTab = tabs[0];

            // Use the URL provided in the message, or use a default if not provided
            const newUrl = request.link;
            const delay = request.delay * 1000;

            // Update the current tab with the new URL
            chrome.tabs.update(currentTab.id, { url: newUrl }, () => {
                // Wait for the page to be completely loaded
                chrome.webNavigation.onCompleted.addListener(async function onPageCompleted(details) {
                    // Check if the completed navigation is for the current tab
                    if (details.tabId === currentTab.id) {
                        // Remove the listener to avoid multiple calls
                        chrome.webNavigation.onCompleted.removeListener(onPageCompleted);
                        // Generate a random delay between 1 to 5 seconds (adjust as needed)
                        var randomDelay = Math.floor(Math.random() * 3000) + delay; // between 6 to 9 seconds
                        await new Promise(resolve => setTimeout(resolve, randomDelay)); // Pause execution

                        // Execute content script after the tab is fully loaded
                        chrome.scripting.executeScript({
                            target: { tabId: currentTab.id },
                            func: () => {
                                let status = "Unknown";
                                // [TODO]: add xpath, then condition to check if text content contains specific value then return value for that specific value.
                                let temp = document.evaluate("//*[@id=\"profile-content\"]/div/div[2]/div/div/main/section[1]/div[2]/div[3]/div", document, null, XPathResult.STRING_TYPE, null).stringValue;

                                if(temp.includes("Connect") && !temp.includes("Remove Connection")) {
                                    status = "Not connected";
                                } else if(temp.includes("Pending")) {
                                    status = "Pending";
                                } else if(temp.includes("Give Kudos")) {
                                    status = "Accepted";
                                }

                                return status;
                            },
                        }).then((result) => {
                            // Check if result is defined before accessing properties
                            if (result !== undefined) {
                                // Send the extracted text back to popup.js
                                sendResponse({ connStatus: result });
                            } else {
                                console.error("Error during script execution: Result is undefined");
                                sendResponse({ connStatus: null }); // Send null in case of an error
                            }
                        });
                    }
                });
            });
        });

        return true; // Required for asynchronous response
    }
});

// Allows users to open the side panel by clicking on the action toolbar icon
chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));