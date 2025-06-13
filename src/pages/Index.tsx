import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code, Check, ArrowRight, ArrowDown } from 'lucide-react';
import XProLogo from '@/components/XProLogo';

const Index = () => {
  const xpathExamples = [
    {
      xpath: "//*[@id='submit-button']",
      confidence: "confiavel",
      element: "Botão de Submit",
      reason: "ID único encontrado - mais estável"
    },
    {
      xpath: "//*[@data-testid='user-profile']",
      confidence: "confiavel", 
      element: "Perfil do Usuário",
      reason: "Atributo de teste único encontrado"
    },
    {
      xpath: "//*[@class='nav-item active']",
      confidence: "atencao",
      element: "Item de Navegação",
      reason: "Classe única encontrada - verifique se não é dinâmica"
    },
    {
      xpath: "//div[3]/span[2]/button[1]",
      confidence: "fraco",
      element: "Botão Genérico",
      reason: "XPath baseado em posição - pode quebrar se a estrutura mudar"
    }
  ];

  const [selectedFramework, setSelectedFramework] = useState('cypress');
  const [copiedItem, setCopiedItem] = useState('');
  const [selectedXpath, setSelectedXpath] = useState(xpathExamples[0].xpath);
  const [selectedConfidence, setSelectedConfidence] = useState(xpathExamples[0].confidence);

  const handleCopy = (text: string, item: string, xpath: string, confidence: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(item);
    setSelectedXpath(xpath);
    setSelectedConfidence(confidence);
    setTimeout(() => setCopiedItem(''), 2000);
  };

  const confidenceConfig = {
    confiavel: { color: "bg-green-500", label: "Confiável", textColor: "text-green-700" },
    atencao: { color: "bg-yellow-500", label: "Atenção", textColor: "text-yellow-700" },
    fraco: { color: "bg-red-500", label: "Fraco", textColor: "text-red-700" }
  };

  const getFrameworkSnippets = (xpath: string, confidence: string) => {
    const statusLabel = confidenceConfig[confidence as keyof typeof confidenceConfig]?.label || 'Desconhecido';
    const statusColor = confidence === 'confiavel' ? 'verde' : confidence === 'atencao' ? 'amarelo' : 'vermelho';

    return {
      cypress: {
        name: "Cypress",
        icon: "🌙",
        code: `// Status: ${statusLabel} (${statusColor})
cy.xpath("${xpath}").click();

// Aguardar elemento
cy.xpath("${xpath}").should('be.visible');

// Obter texto
cy.xpath("${xpath}").invoke('text').then((text) => {
  cy.log(text);
});`
      },
      "selenium-java": {
        name: "Selenium Java",
        icon: "☕",
        code: `// Status: ${statusLabel} (${statusColor})
WebElement element = driver.findElement(By.xpath("${xpath}"));
element.click();

// Com espera explícita
WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
WebElement element = wait.until(ExpectedConditions.elementToBeClickable(
    By.xpath("${xpath}")
));
element.click();`
      },
      "selenium-python": {
        name: "Selenium Python",
        icon: "🐍",
        code: `# Status: ${statusLabel} (${statusColor})
element = driver.find_element(By.XPATH, "${xpath}")
element.click()

# Com espera explícita
from selenium.webdriver.support.wait import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

element = WebDriverWait(driver, 10).until(
    EC.element_to_be_clickable((By.XPATH, "${xpath}"))
)
element.click()`
      },
      playwright: {
        name: "Playwright",
        icon: "🎭",
        code: `// Status: ${statusLabel} (${statusColor})
await page.locator('xpath=${xpath}').click();

// Aguardar elemento
await page.locator('xpath=${xpath}').waitFor();

// Obter texto
const text = await page.locator('xpath=${xpath}').textContent();
console.log(text);`
      }
    };
  };

  const currentFrameworkSnippets = getFrameworkSnippets(selectedXpath, selectedConfidence);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white">
              <XProLogo className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">XPath Generator Pro</h1>
              <p className="text-lg text-gray-600">Extensão Chrome para Geração Inteligente de XPath</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Gere XPath Robusto com Análise de Confiabilidade
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Uma extensão Chrome profissional que gera XPath inteligente evitando índices voláteis 
            e priorizando atributos estáveis, com classificação visual de confiabilidade.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <Badge variant="outline" className="text-sm px-4 py-2">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Análise de Confiabilidade
            </Badge>
            <Badge variant="outline" className="text-sm px-4 py-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              4 Frameworks Suportados
            </Badge>
            <Badge variant="outline" className="text-sm px-4 py-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
              XPath Robusto
            </Badge>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card className="bg-white shadow-lg border-0">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle>XPath Inteligente</CardTitle>
              <CardDescription>
                Evita índices voláteis e prioriza IDs únicos, atributos estáveis como data-testid, name e aria-label.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white shadow-lg border-0">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <ArrowRight className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle>Classificação Visual</CardTitle>
              <CardDescription>
                Sistema de cores (Verde/Amarelo/Vermelho) que indica a robustez e confiabilidade do XPath gerado.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white shadow-lg border-0">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <XProLogo className="w-6 h-6" />
              </div>
              <CardTitle>Snippets de Código</CardTitle>
              <CardDescription>
                Gera automaticamente snippets prontos para Cypress, Selenium (Java/Python) e Playwright.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Demo Section */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* XPath Examples */}
          <Card className="bg-white shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowDown className="w-5 h-5" />
                Exemplos de XPath Gerados
              </CardTitle>
              <CardDescription>
                Veja como a extensão classifica diferentes tipos de XPath
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {xpathExamples.map((example, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${confidenceConfig[example.confidence].color}`}></div>
                      <span className={`font-medium text-sm ${confidenceConfig[example.confidence].textColor}`}>
                        {confidenceConfig[example.confidence].label}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(example.xpath, `xpath-${index}`, example.xpath, example.confidence)}
                      className="h-auto p-1"
                    >
                      {copiedItem === `xpath-${index}` ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Code className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <div className="text-sm font-medium text-gray-900 mb-1">
                    {example.element}
                  </div>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700 block mb-2">
                    {example.xpath}
                  </code>
                  <p className="text-xs text-gray-600">
                    {example.reason}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Framework Snippets */}
          <Card className="bg-white shadow-lg border-0">
            <CardHeader>
              <CardTitle>Snippets de Código</CardTitle>
              <CardDescription>
                Selecione um framework para ver o código gerado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={selectedFramework} onValueChange={setSelectedFramework}>
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="cypress" className="text-xs">
                    🌙 Cypress
                  </TabsTrigger>
                  <TabsTrigger value="selenium-java" className="text-xs">
                    ☕ Java
                  </TabsTrigger>
                  <TabsTrigger value="selenium-python" className="text-xs">
                    🐍 Python
                  </TabsTrigger>
                  <TabsTrigger value="playwright" className="text-xs">
                    🎭 Playwright
                  </TabsTrigger>
                </TabsList>
                {Object.keys(currentFrameworkSnippets).map((key) => {
                  const snippet = currentFrameworkSnippets[key as keyof typeof currentFrameworkSnippets];
                  return (
                    <TabsContent key={key} value={key}>
                      <div className="rounded-md bg-gray-900 p-4 font-mono text-sm text-gray-50">
                        <pre>
                          <code>{snippet.code}</code>
                        </pre>
                      </div>
                    </TabsContent>
                  );
                })}
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Installation Guide */}
        <Card className="bg-white shadow-lg border-0 mb-8">
          <CardHeader>
            <CardTitle>Como Instalar a Extensão</CardTitle>
            <CardDescription>
              Siga estes passos para instalar a extensão XPath Generator Pro no Chrome
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  <div>
                    <h4 className="font-medium">Baixe os arquivos da extensão</h4>
                    <p className="text-sm text-gray-600">Faça download dos arquivos da pasta /public</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  <div>
                    <h4 className="font-medium">Abra as extensões do Chrome</h4>
                    <p className="text-sm text-gray-600">Digite chrome://extensions/ na barra de endereços</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                  <div>
                    <h4 className="font-medium">Ative o modo desenvolvedor</h4>
                    <p className="text-sm text-gray-600">Clique no toggle "Modo do desenvolvedor"</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                  <div>
                    <h4 className="font-medium">Carregue a extensão</h4>
                    <p className="text-sm text-gray-600">Clique em "Carregar sem compactação" e selecione a pasta</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="font-medium mb-3">Como usar:</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Clique com botão direito em qualquer elemento</li>
                  <li>• Selecione "Gerar XPath Inteligente"</li>
                  <li>• Ou clique no ícone da extensão e selecione um elemento</li>
                  <li>• Veja a classificação de confiabilidade</li>
                  <li>• Gere snippets para seu framework preferido</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center">
          <p className="text-gray-600">
            Desenvolvido para automação de testes profissional com foco em robustez e confiabilidade.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
