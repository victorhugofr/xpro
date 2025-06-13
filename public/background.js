
// Background script para menu de contexto
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "generateXPath",
    title: "Gerar XPath Inteligente",
    contexts: ["all"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "generateXPath") {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: enableElementSelection
    });
  }
});

function enableElementSelection() {
  window.postMessage({ type: "ENABLE_XPATH_SELECTION" }, "*");
}

// Comunicação com content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "openPopup") {
    chrome.action.openPopup();
  }
});
