
document.addEventListener('DOMContentLoaded', function() {
  const selectElementBtn = document.getElementById('selectElement');

  selectElementBtn.addEventListener('click', function() {
    // Fechar o popup
    window.close();
    
    // Executar script para ativar seleção de elemento
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.scripting.executeScript({
        target: {tabId: tabs[0].id},
        function: enableElementSelection
      });
    });
  });

  // Escutar mensagens do content script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "elementSelected") {
      console.log("Elemento selecionado:", request.xpathData);
      // Aqui poderia atualizar o popup com os dados se necessário
    }
  });
});

function enableElementSelection() {
  window.postMessage({ type: "ENABLE_XPATH_SELECTION" }, "*");
}
