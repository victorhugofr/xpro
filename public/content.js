// Content script para seleção e análise de elementos
class XPathGenerator {
  constructor() {
    this.isSelectionMode = false;
    this.selectedElement = null;
    this.overlay = null;
    this.lastXPathData = null;
    this.usedStrategies = new Set(); // Track which strategies were used
    this.init();
  }

  init() {
    window.addEventListener("message", (event) => {
      if (event.data.type === "ENABLE_XPATH_SELECTION") {
        this.enableSelectionMode();
      }
    });

    document.addEventListener("click", (e) => {
      if (this.isSelectionMode) {
        e.preventDefault();
        e.stopPropagation();
        this.selectElement(e.target);
      }
    });

    document.addEventListener("mouseover", (e) => {
      if (this.isSelectionMode) {
        this.highlightElement(e.target);
      }
    });

    document.addEventListener("mouseout", (e) => {
      if (this.isSelectionMode) {
        this.removeHighlight(e.target);
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isSelectionMode) {
        this.disableSelectionMode();
      }
    });
  }

  enableSelectionMode() {
    this.isSelectionMode = true;
    document.body.style.cursor = "crosshair";
    this.showSelectionMessage();
  }

  disableSelectionMode() {
    this.isSelectionMode = false;
    document.body.style.cursor = "";
    this.hideSelectionMessage();
    this.removeAllHighlights();
  }

  showSelectionMessage() {
    const message = document.createElement("div");
    message.id = "xpath-selection-message";
    message.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: #1e40af;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 999999;
        animation: slideIn 0.3s ease-out;
      ">
        <strong>Modo de Seleção Ativado</strong><br>
        Clique em um elemento para gerar XPath<br>
        <small>Pressione ESC para cancelar</small>
      </div>
    `;
    document.body.appendChild(message);
  }

  hideSelectionMessage() {
    const message = document.getElementById("xpath-selection-message");
    if (message) {
      message.remove();
    }
  }

  highlightElement(element) {
    if (element === document.body || element === document.documentElement) return;
    
    element.style.outline = "2px solid #3b82f6";
    element.style.outlineOffset = "2px";
    element.style.backgroundColor = "rgba(59, 130, 246, 0.1)";
  }

  removeHighlight(element) {
    element.style.outline = "";
    element.style.outlineOffset = "";
    element.style.backgroundColor = "";
  }

  removeAllHighlights() {
    const elements = document.querySelectorAll("*");
    elements.forEach(el => this.removeHighlight(el));
  }

  selectElement(element) {
    this.selectedElement = element;
    this.usedStrategies.clear(); // Reset used strategies for new element
    this.disableSelectionMode();
    
    const xpathData = this.generateIntelligentXPath(element);
    this.lastXPathData = xpathData;
    
    // Enviar dados para o popup
    chrome.runtime.sendMessage({
      action: "elementSelected",
      xpathData: xpathData,
      elementInfo: {
        tagName: element.tagName.toLowerCase(),
        id: element.id,
        className: element.className,
        textContent: element.textContent?.slice(0, 50) + "..."
      }
    });

    this.showXPathModal(xpathData);
  }

  async regenerateXPath() {
    if (!this.selectedElement) return;
    
    // Obter o XPath atual e sua confiança
    const currentXPath = this.lastXPathData;
    const currentConfidenceLevel = this.getConfidenceLevel(currentXPath.confidence);
    
    // Tentar encontrar uma alternativa melhor ou igual
    const newXPathData = this.generateBetterAlternativeXPath(this.selectedElement, currentConfidenceLevel);
    
    if (newXPathData && this.isUniqueInDocument(newXPathData.xpath)) {
      this.lastXPathData = newXPathData;
      this.updateModalContent(newXPathData);
    } else {
      // Se não encontrou alternativa melhor, manter o atual
      this.showErrorMessage("Nenhuma alternativa melhor encontrada. Mantendo XPath atual.");
    }
  }

  getConfidenceLevel(confidence) {
    const levels = { "confiavel": 3, "atencao": 2, "fraco": 1 };
    return levels[confidence] || 1;
  }

  generateBetterAlternativeXPath(element, minConfidenceLevel) {
    const strategies = [
      { fn: this.getXPathByUniqueId.bind(this), level: 3 },
      { fn: this.getXPathByUniqueAttribute.bind(this), level: 3 },
      { fn: this.getXPathByTagAndUniqueAttribute.bind(this), level: 3 },
      { fn: this.getXPathByCombinedAttributes.bind(this), level: 2 },
      { fn: this.getXPathByPartialText.bind(this), level: 2 },
      { fn: this.getXPathByUniqueClass.bind(this), level: 2 },
      { fn: this.getXPathByTagAndClass.bind(this), level: 2 }
    ];

    // Filtrar apenas estratégias que têm nível >= mínimo exigido
    const validStrategies = strategies.filter(s => s.level >= minConfidenceLevel);
    
    for (const strategy of validStrategies) {
      if (!this.usedStrategies.has(strategy.fn.name)) {
        const result = strategy.fn(element);
        if (result && this.isUniqueInDocument(result.xpath)) {
          this.usedStrategies.add(strategy.fn.name);
          return result;
        }
      }
    }

    return null;
  }

  getXPathByTagAndUniqueAttribute(element) {
    const tagName = element.tagName.toLowerCase();
    const uniqueAttrs = ['data-testid', 'data-test', 'name', 'role', 'aria-label', 'title', 'placeholder'];
    
    for (const attr of uniqueAttrs) {
      const value = element.getAttribute(attr);
      if (value) {
        const xpath = `//${tagName}[@${attr}='${value}']`;
        if (this.isUniqueInDocument(xpath)) {
          return {
            xpath: xpath,
            confidence: "confiavel",
            reason: `Tag ${tagName} com atributo único ${attr}`
          };
        }
      }
    }
    return null;
  }

  getXPathByTagAndClass(element) {
    const tagName = element.tagName.toLowerCase();
    if (element.className) {
      const classes = element.className.split(' ').filter(c => c.trim());
      
      for (const cls of classes) {
        const xpath = `//${tagName}[@class='${cls}']`;
        if (this.isUniqueInDocument(xpath)) {
          return {
            xpath: xpath,
            confidence: "atencao",
            reason: `Tag ${tagName} com classe específica`
          };
        }
      }
    }
    return null;
  }

  async generateWithAI() {
    if (!this.selectedElement) return;
    
    this.showLoadingState();
    
    try {
      const elementInfo = this.getElementInfo(this.selectedElement);
      
      // Tentar múltiplas APIs gratuitas
      let aiXPath = null;
      
      try {
        aiXPath = await this.callHuggingFaceAPI(elementInfo);
      } catch (error) {
        console.log("HuggingFace API falhou, tentando OpenRouter...");
        try {
          aiXPath = await this.callOpenRouterAPI(elementInfo);
        } catch (error2) {
          console.log("OpenRouter falhou, tentando geração local avançada...");
          aiXPath = this.generateAdvancedLocalXPath(elementInfo);
        }
      }
      
      if (!aiXPath || !this.isUniqueInDocument(aiXPath)) {
        throw new Error("XPath gerado não é único");
      }
      
      const xpathData = {
        xpath: aiXPath,
        confidence: this.analyzeConfidence(aiXPath),
        reason: "XPath gerado com IA - análise avançada de estrutura"
      };
      
      this.lastXPathData = xpathData;
      this.updateModalContent(xpathData);
      
    } catch (error) {
      console.error("Erro ao gerar XPath com IA:", error);
      this.showErrorMessage("IA indisponível. Usando geração local avançada.");
      await this.regenerateXPath();
    }
  }

  async callHuggingFaceAPI(elementInfo) {
    const prompt = `Generate a unique XPath for this HTML element:
Tag: ${elementInfo.tagName}
ID: ${elementInfo.id || "None"}
Classes: ${elementInfo.className || "None"}
Attributes: ${JSON.stringify(elementInfo.attributes)}
Text: ${elementInfo.textContent || "None"}

Rules:
1. XPath must be unique on the page
2. Prefer IDs if unique
3. Use stable attributes like data-testid, name, aria-label
4. Avoid position-based selectors
5. Return ONLY the XPath, no explanations

XPath:`;

    const response = await fetch('https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_length: 100,
          temperature: 0.1
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HuggingFace API failed with status: ${response.status}`);
    }

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }

    let xpath = data.generated_text || data[0]?.generated_text || "";
    xpath = xpath.replace(prompt, "").trim();
    xpath = xpath.split('\n')[0].trim();
    
    return xpath;
  }

  async callOpenRouterAPI(elementInfo) {
    const prompt = `Generate a unique XPath for: tag=${elementInfo.tagName}, id=${elementInfo.id}, classes=${elementInfo.className}. Return only XPath.`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer sk-or-v1-' + 'demo-key-for-testing',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openchat/openchat-7b:free',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 50
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API failed with status: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  }

  generateAdvancedLocalXPath(elementInfo) {
    const element = this.selectedElement;
    
    // Estratégia avançada: combinação de múltiplos atributos
    const tagName = element.tagName.toLowerCase();
    const strategies = [];
    
    // 1. ID + Tag se ID existir
    if (element.id) {
      strategies.push(`//${tagName}[@id='${element.id}']`);
    }
    
    // 2. Atributo único + tag
    const uniqueAttrs = ['data-testid', 'name', 'role', 'aria-label'];
    for (const attr of uniqueAttrs) {
      const value = element.getAttribute(attr);
      if (value) {
        strategies.push(`//${tagName}[@${attr}='${value}']`);
      }
    }
    
    // 3. Combinação de classe + outro atributo
    if (element.className && element.getAttribute('type')) {
      const firstClass = element.className.split(' ')[0];
      strategies.push(`//${tagName}[@class='${firstClass}' and @type='${element.getAttribute('type')}']`);
    }
    
    // 4. Texto único se curto
    const text = element.textContent?.trim();
    if (text && text.length < 30 && text.length > 2) {
      strategies.push(`//${tagName}[text()='${text}']`);
    }
    
    // Retornar a primeira estratégia que for única
    for (const xpath of strategies) {
      if (this.isUniqueInDocument(xpath)) {
        return xpath;
      }
    }
    
    // Fallback: usar o melhor XPath já conhecido
    return this.lastXPathData?.xpath || `//*[@id='${element.id}']`;
  }

  getElementInfo(element) {
    return {
      tagName: element.tagName.toLowerCase(),
      id: element.id || null,
      className: element.className || null,
      attributes: Array.from(element.attributes).map(attr => ({
        name: attr.name,
        value: attr.value
      })),
      textContent: element.textContent?.slice(0, 100) || null,
      parentTagName: element.parentElement?.tagName.toLowerCase() || null,
      outerHTML: element.outerHTML.slice(0, 500)
    };
  }

  analyzeConfidence(xpath) {
    if (xpath.includes("@id=") && !xpath.includes("[") && !xpath.includes("following-sibling")) {
      return "confiavel";
    }
    if (xpath.includes("@data-testid") || xpath.includes("@name=") || xpath.includes("@aria-label")) {
      return "confiavel";
    }
    if (xpath.includes("@class=") || xpath.includes("text()") || xpath.includes("contains")) {
      return "atencao";
    }
    return "fraco";
  }

  showLoadingState() {
    const modal = document.getElementById("xpath-modal");
    if (modal) {
      const button = modal.querySelector("#ai-generate-btn");
      if (button) {
        button.textContent = "Gerando...";
        button.disabled = true;
      }
    }
  }

  showErrorMessage(message) {
    const modal = document.getElementById("xpath-modal");
    if (modal) {
      const errorDiv = document.createElement("div");
      errorDiv.className = "error-message";
      errorDiv.textContent = message;
      
      const header = modal.querySelector(".xpath-modal-header");
      header.insertAdjacentElement("afterend", errorDiv);
      
      setTimeout(() => errorDiv.remove(), 3000);
    }
  }

  updateModalContent(xpathData) {
    const modal = document.getElementById("xpath-modal");
    if (!modal) return;

    // Atualizar confiança
    const confidenceDiv = modal.querySelector(".xpath-confidence");
    const confidenceColors = {
      confiavel: "#10b981",
      atencao: "#f59e0b", 
      fraco: "#ef4444"
    };
    const confidenceLabels = {
      confiavel: "Confiável",
      atencao: "Atenção",
      fraco: "Fraco"
    };

    confidenceDiv.style.backgroundColor = confidenceColors[xpathData.confidence] + "20";
    confidenceDiv.style.borderLeftColor = confidenceColors[xpathData.confidence];
    confidenceDiv.querySelector(".confidence-label").innerHTML = `<strong>${confidenceLabels[xpathData.confidence]}</strong>`;
    confidenceDiv.querySelector(".confidence-reason").textContent = xpathData.reason;

    // Atualizar XPath
    const xpathCode = modal.querySelector(".xpath-code code");
    const copyBtn = modal.querySelector(".xpath-code .copy-btn");
    xpathCode.textContent = xpathData.xpath;
    copyBtn.dataset.xpath = xpathData.xpath;

    // Resetar botão de IA
    const aiButton = modal.querySelector("#ai-generate-btn");
    if (aiButton) {
      aiButton.textContent = "Gerar com IA";
      aiButton.disabled = false;
    }

    // Limpar snippet se existir
    const snippetContainer = document.getElementById("snippet-container");
    if (snippetContainer) {
      snippetContainer.style.display = "none";
    }

    // Resetar botões de framework
    modal.querySelectorAll(".framework-btn").forEach(btn => btn.classList.remove("active"));
  }

  generateIntelligentXPath(element) {
    const strategies = [
      this.getXPathByUniqueId.bind(this),
      this.getXPathByUniqueAttribute.bind(this),
      this.getXPathByText.bind(this),
      this.getXPathByUniqueClass.bind(this),
      this.getXPathByPosition.bind(this)
    ];

    for (const strategy of strategies) {
      const result = strategy(element);
      if (result && this.isUniqueInDocument(result.xpath)) {
        this.usedStrategies.add(strategy.name);
        return result;
      }
    }

    // Fallback para XPath absoluto
    return {
      xpath: this.getAbsoluteXPath(element),
      confidence: "fraco",
      reason: "XPath baseado em estrutura absoluta - pode quebrar facilmente"
    };
  }

  generateAlternativeXPath(element) {
    // Lista de estratégias em ordem de preferência
    const allStrategies = [
      { fn: this.getXPathByUniqueId.bind(this), name: 'getXPathByUniqueId' },
      { fn: this.getXPathByUniqueAttribute.bind(this), name: 'getXPathByUniqueAttribute' },
      { fn: this.getXPathByText.bind(this), name: 'getXPathByText' },
      { fn: this.getXPathByPartialText.bind(this), name: 'getXPathByPartialText' },
      { fn: this.getXPathByUniqueClass.bind(this), name: 'getXPathByUniqueClass' },
      { fn: this.getXPathByTagAndAttribute.bind(this), name: 'getXPathByTagAndAttribute' },
      { fn: this.getXPathByCombinedAttributes.bind(this), name: 'getXPathByCombinedAttributes' },
      { fn: this.getXPathByPosition.bind(this), name: 'getXPathByPosition' }
    ];

    // Tentar estratégias não utilizadas primeiro
    for (const strategy of allStrategies) {
      if (!this.usedStrategies.has(strategy.name)) {
        const result = strategy.fn(element);
        if (result && this.isUniqueInDocument(result.xpath)) {
          this.usedStrategies.add(strategy.name);
          return result;
        }
      }
    }

    // Se todas foram usadas, tentar uma abordagem diferente
    return this.getAlternativeApproach(element);
  }

  getXPathByPartialText(element) {
    const text = element.textContent?.trim();
    if (text && text.length > 10) {
      // Usar as primeiras palavras do texto
      const words = text.split(' ').slice(0, 3).join(' ');
      const xpath = `//*[contains(text(),'${words}')]`;
      if (this.isUniqueInDocument(xpath)) {
        return {
          xpath: xpath,
          confidence: "atencao",
          reason: "Baseado em texto parcial - pode mudar se o conteúdo for alterado"
        };
      }
    }
    return null;
  }

  getXPathByTagAndAttribute(element) {
    const tagName = element.tagName.toLowerCase();
    const attributes = ['type', 'role', 'title', 'placeholder', 'value'];
    
    for (const attr of attributes) {
      const value = element.getAttribute(attr);
      if (value) {
        const xpath = `//${tagName}[@${attr}='${value}']`;
        if (this.isUniqueInDocument(xpath)) {
          return {
            xpath: xpath,
            confidence: "atencao",
            reason: `Baseado na tag ${tagName} e atributo ${attr}`
          };
        }
      }
    }
    return null;
  }

  getXPathByCombinedAttributes(element) {
    const tagName = element.tagName.toLowerCase();
    const attributes = ['class', 'type', 'role', 'title'];
    const combinations = [];
    
    // Tentar combinações de 2 atributos
    for (let i = 0; i < attributes.length; i++) {
      for (let j = i + 1; j < attributes.length; j++) {
        const attr1 = attributes[i];
        const attr2 = attributes[j];
        const value1 = element.getAttribute(attr1);
        const value2 = element.getAttribute(attr2);
        
        if (value1 && value2) {
          const xpath = `//${tagName}[@${attr1}='${value1}' and @${attr2}='${value2}']`;
          if (this.isUniqueInDocument(xpath)) {
            return {
              xpath: xpath,
              confidence: "atencao",
              reason: `Baseado em combinação de atributos ${attr1} e ${attr2}`
            };
          }
        }
      }
    }
    return null;
  }

  getAlternativeApproach(element) {
    // Tentar uma abordagem mista: tag + classe + posição relativa
    const tagName = element.tagName.toLowerCase();
    const className = element.className.split(' ')[0]; // Primeira classe
    
    if (className) {
      const xpath = `//${tagName}[contains(@class,'${className}')]`;
      if (this.isUniqueInDocument(xpath)) {
        return {
          xpath: xpath,
          confidence: "fraco",
          reason: "Abordagem alternativa com tag e classe parcial"
        };
      }
    }

    // Último recurso: posição mais específica
    const absoluteXPath = this.getAbsoluteXPath(element);
    return {
      xpath: absoluteXPath,
      confidence: "fraco",
      reason: "XPath baseado em estrutura absoluta - última alternativa"
    };
  }

  getXPathByUniqueId(element) {
    if (element.id && this.isUniqueInDocument(`//*[@id='${element.id}']`)) {
      return {
        xpath: `//*[@id='${element.id}']`,
        confidence: "confiavel",
        reason: "ID único encontrado - mais estável"
      };
    }
    return null;
  }

  getXPathByUniqueAttribute(element) {
    const uniqueAttrs = ['name', 'data-testid', 'data-test', 'aria-label', 'role'];
    
    for (const attr of uniqueAttrs) {
      const value = element.getAttribute(attr);
      if (value && this.isUniqueInDocument(`//*[@${attr}='${value}']`)) {
        return {
          xpath: `//*[@${attr}='${value}']`,
          confidence: "confiavel",
          reason: `Atributo único '${attr}' encontrado`
        };
      }
    }
    return null;
  }

  getXPathByText(element) {
    const text = element.textContent?.trim();
    if (text && text.length < 50 && text.length > 2) {
      const xpath = `//*[normalize-space(text())='${text}']`;
      if (this.isUniqueInDocument(xpath)) {
        return {
          xpath: xpath,
          confidence: "atencao",
          reason: "Baseado em texto - pode mudar se o conteúdo for alterado"
        };
      }
    }
    return null;
  }

  getXPathByUniqueClass(element) {
    if (element.className) {
      const classes = element.className.split(' ').filter(c => c.trim());
      
      for (const cls of classes) {
        const xpath = `//*[@class='${cls}']`;
        if (this.isUniqueInDocument(xpath)) {
          return {
            xpath: xpath,
            confidence: "atencao",
            reason: "Classe única encontrada - verifique se não é dinâmica"
          };
        }
      }
    }
    return null;
  }

  getXPathByPosition(element) {
    let path = "";
    let current = element;
    
    while (current && current !== document.documentElement) {
      const tagName = current.tagName.toLowerCase();
      
      if (current.id) {
        path = `//*[@id='${current.id}']` + path;
        break;
      }
      
      const siblings = Array.from(current.parentNode.children).filter(
        sibling => sibling.tagName === current.tagName
      );
      
      if (siblings.length === 1) {
        path = `/${tagName}` + path;
      } else {
        const index = siblings.indexOf(current) + 1;
        path = `/${tagName}[${index}]` + path;
      }
      
      current = current.parentNode;
    }

    return {
      xpath: path || this.getAbsoluteXPath(element),
      confidence: "fraco",
      reason: "XPath baseado em posição - pode quebrar se a estrutura mudar"
    };
  }

  getAbsoluteXPath(element) {
    if (element === document.documentElement) return '/html';
    
    let path = '';
    for (; element && element.nodeType === 1; element = element.parentNode) {
      let index = 0;
      for (let sibling = element.previousSibling; sibling; sibling = sibling.previousSibling) {
        if (sibling.nodeType === 1 && sibling.tagName === element.tagName) index++;
      }
      
      const tagName = element.tagName.toLowerCase();
      const pathSegment = `${tagName}[${index + 1}]`;
      path = `/${pathSegment}${path}`;
    }
    
    return path;
  }

  isUniqueInDocument(xpath) {
    try {
      const result = document.evaluate(xpath, document, null, XPathResult.ANY_TYPE, null);
      const elements = [];
      let element = result.iterateNext();
      while (element) {
        elements.push(element);
        element = result.iterateNext();
      }
      console.log(`XPath "${xpath}" encontrou ${elements.length} elementos`);
      return elements.length === 1;
    } catch (e) {
      console.error("Erro ao avaliar XPath:", e);
      return false;
    }
  }

  showXPathModal(xpathData) {
    // Remover modal existente se houver
    const existingModal = document.getElementById("xpath-modal");
    if (existingModal) existingModal.remove();

    const modal = document.createElement("div");
    modal.id = "xpath-modal";
    modal.innerHTML = this.getModalHTML(xpathData);
    document.body.appendChild(modal);

    // Event listeners para o modal
    this.setupModalEventListeners(modal, xpathData);
  }

  getModalHTML(xpathData) {
    const confidenceColors = {
      confiavel: "#10b981",
      atencao: "#f59e0b", 
      fraco: "#ef4444"
    };

    const confidenceLabels = {
      confiavel: "Confiável",
      atencao: "Atenção",
      fraco: "Fraco"
    };

    return `
      <div class="xpath-modal-overlay">
        <div class="xpath-modal-content">
          <div class="xpath-modal-header">
            <h3>XPath Gerado</h3>
            <button class="xpath-modal-close">&times;</button>
          </div>
          
          <div class="xpath-confidence" style="background-color: ${confidenceColors[xpathData.confidence]}20; border-left: 4px solid ${confidenceColors[xpathData.confidence]}">
            <div class="confidence-label" style="color: ${confidenceColors[xpathData.confidence]}">
              <strong>${confidenceLabels[xpathData.confidence]}</strong>
            </div>
            <div class="confidence-reason">${xpathData.reason}</div>
          </div>

          <div class="xpath-result">
            <label>XPath Gerado:</label>
            <div class="xpath-code">
              <code>${xpathData.xpath}</code>
              <button class="copy-btn" data-xpath="${xpathData.xpath}">Copiar</button>
            </div>
          </div>

          <div class="generation-buttons">
            <button id="regenerate-btn" class="action-btn regenerate">Gerar Novamente</button>
            <button id="ai-generate-btn" class="action-btn ai-generate">Gerar com IA</button>
          </div>

          <div class="framework-section">
            <label>Gerar Snippet para Framework:</label>
            <div class="framework-buttons">
              <button class="framework-btn" data-framework="cypress">Cypress</button>
              <button class="framework-btn" data-framework="selenium-java">Selenium Java</button>
              <button class="framework-btn" data-framework="selenium-python">Selenium Python</button>
              <button class="framework-btn" data-framework="playwright">Playwright</button>
            </div>
          </div>

          <div class="snippet-result" id="snippet-container" style="display: none;">
            <label>Snippet de Código:</label>
            <div class="snippet-code">
              <pre><code id="snippet-code"></code></pre>
              <button class="copy-btn" id="copy-snippet">Copiar Snippet</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  setupModalEventListeners(modal, xpathData) {
    // Fechar modal
    modal.querySelector(".xpath-modal-close").addEventListener("click", () => {
      modal.remove();
    });

    modal.querySelector(".xpath-modal-overlay").addEventListener("click", (e) => {
      if (e.target === modal.querySelector(".xpath-modal-overlay")) {
        modal.remove();
      }
    });

    // Copiar XPath
    modal.querySelector("[data-xpath]").addEventListener("click", (e) => {
      this.copyToClipboard(this.lastXPathData.xpath); // Usar sempre o XPath atual
      this.showCopyFeedback(e.target);
    });

    // Botão Gerar Novamente
    modal.querySelector("#regenerate-btn").addEventListener("click", () => {
      this.regenerateXPath();
    });

    // Botão Gerar com IA
    modal.querySelector("#ai-generate-btn").addEventListener("click", () => {
      this.generateWithAI();
    });

    // Botões de framework - usar sempre o XPath atual
    modal.querySelectorAll(".framework-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const framework = e.target.dataset.framework;
        this.generateSnippet(framework); // Remover parâmetro xpath
        
        // Highlight do botão selecionado
        modal.querySelectorAll(".framework-btn").forEach(b => b.classList.remove("active"));
        e.target.classList.add("active");
      });
    });
  }

  generateSnippet(framework) {
    // Sempre usar o XPath mais atual
    const currentXPath = this.lastXPathData.xpath;
    
    const snippets = {
      cypress: `// Status: ${this.getConfidenceText(currentXPath)}
cy.xpath("${currentXPath}").click();

// Ou para aguardar o elemento
cy.xpath("${currentXPath}").should('be.visible');

// Para obter texto
cy.xpath("${currentXPath}").invoke('text').then((text) => {
  cy.log(text);
});`,

      "selenium-java": `// Status: ${this.getConfidenceText(currentXPath)}
WebElement element = driver.findElement(By.xpath("${currentXPath}"));
element.click();

// Ou com espera explícita
WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
WebElement element = wait.until(ExpectedConditions.elementToBeClickable(By.xpath("${currentXPath}")));
element.click();`,

      "selenium-python": `# Status: ${this.getConfidenceText(currentXPath)}
element = driver.find_element(By.XPATH, "${currentXPath}")
element.click()

# Ou com espera explícita
from selenium.webdriver.support.wait import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

element = WebDriverWait(driver, 10).until(
    EC.element_to_be_clickable((By.XPATH, "${currentXPath}"))
)
element.click()`,

      playwright: `// Status: ${this.getConfidenceText(currentXPath)}
await page.locator('xpath=${currentXPath}').click();

// Ou para aguardar o elemento
await page.locator('xpath=${currentXPath}').waitFor();

// Para obter texto
const text = await page.locator('xpath=${currentXPath}').textContent();
console.log(text);`
    };

    const snippetContainer = document.getElementById("snippet-container");
    const snippetCode = document.getElementById("snippet-code");
    const copyBtn = document.getElementById("copy-snippet");

    snippetCode.textContent = snippets[framework];
    snippetContainer.style.display = "block";

    // Event listener para copiar snippet
    copyBtn.onclick = () => {
      this.copyToClipboard(snippets[framework]);
      this.showCopyFeedback(copyBtn);
    };
  }

  getConfidenceText(xpath) {
    // Análise simples baseada no XPath para determinar confiabilidade
    if (xpath.includes("@id=")) return "Confiável (verde)";
    if (xpath.includes("@data-test") || xpath.includes("@name=")) return "Confiável (verde)";
    if (xpath.includes("@class=") || xpath.includes("text()")) return "Atenção (amarelo)";
    return "Fraco (vermelho)";
  }

  copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      console.log("Copiado para clipboard");
    });
  }

  showCopyFeedback(button) {
    const originalText = button.textContent;
    button.textContent = "Copiado!";
    button.style.backgroundColor = "#10b981";
    
    setTimeout(() => {
      button.textContent = originalText;
      button.style.backgroundColor = "";
    }, 2000);
  }
}

// Inicializar o gerador de XPath
const xpathGenerator = new XPathGenerator();
