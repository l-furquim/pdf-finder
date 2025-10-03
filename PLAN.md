1 — Resumo técnico da solução (alto nível)

UI (React + TypeScript): área drag-and-drop + botão de seleção; suporte a seleção de pastas (webkitdirectory / File System Access API) e múltiplos arquivos.

Entrada de CPFs: campo que aceita múltiplos CPFs (textarea ou chips). UI com opção Modo permissivo (se quiser padear CPFs com menos de 11 dígitos).

Parser de PDF: extrair texto por página usando PDF.js no cliente (pdfjs-dist) ou pdf-parse no Node/Electron (para backend/desktop). 
NPM
+1

Busca: normalizar texto e CPFs (remover não dígitos), procurar em duas frentes por página: a) buscas por texto bruto (para formatos com pontuação), b) buscas em sequência de dígitos (para variações sem pontuação). Armazenar ocorrências (arquivo, página, trecho/offset).

Resultado: tabela/lista com cada ocorrência; botão/link que abre o PDF no visualizador na página correta (via viewer embutido ou URL com parâmetro de página). Atenção: abrir blob URL + #page pode ser inconsistente em alguns casos — usar um viewer embutido (PDF.js) garante controle. 
Nutrient
+1

Log CSV: gerar arquivo CSV diário com colunas: data,hora,cpf,arquivo,encontrado,paginas e gravar em Documents\leitor_documentos\YYYY-MM-DD.csv. Para web: pedir ao usuário a pasta via File System Access API e gravar lá; para desktop: gravar diretamente com fs usando path a partir de app.getPath('documents') ou os.homedir(). 
MDN Web Docs
+1

2 — Passo-a-passo detalhado (desenvolvimento)
2.1 Preparação do projeto

Opções:

Desktop (recomendado se quer gravação automática em Documents): Electron + React + TypeScript. (Electron fornece app.getPath('documents') e Node fs sem restrições). 
Electron

Web (se preferir sem instalação): React + TypeScript app (Vite/Next/CRA). Para gravação em Documents, use File System Access API (o usuário escolhe a pasta e dá permissão). 
Chrome for Developers

Instalar libs principais (sugestão):

pdfjs-dist (cliente) ou pdf-parse (node) — extração de texto. 
NPM
+1

fast-csv ou csv-writer para escrever CSV no Node/Electron; para navegador gerar string CSV e showSaveFilePicker() / download. 
NPM
+1

2.2 UI — componentes principais

UploadArea — drag & drop + botão:

Aceita múltiplos arquivos PDF e pastas (usar <input type="file" multiple webkitdirectory /> para suporte a seleção de pastas em muitos browsers; em Electron usar diálogo nativo dialog.showOpenDialog({properties: ['openFile','openDirectory','multiSelections']})).

Ao receber uma pasta, recursivamente colecionar todos os arquivos .pdf.

CpfInput — componente que aceita múltiplos CPFs:

Textarea ou chips. Suporta carga via arquivo .txt opcional. Botão para "Modo permissivo (pad left com zeros)" — explico a lógica abaixo.

SearchControls — botões: Buscar, Cancelar, Limpar; opções: concorrência (threads/workers), modo OCR (se habilitar OCR para PDFs escaneados).

ResultsTable — lista virtualizada (react-window) mostrando: CPF, Arquivo, Página(s), trecho (preview), botão “Abrir página”.

LogManager — status de gravação do CSV, link para abrir pasta logs.

2.3 Backend / Processamento (onde executar a extração)

Desktop (Electron): faça todo o processamento no main process ou em um worker thread Node/child process para não travar UI. Use pdf-parse ou pdfjs-dist no renderer + Web Worker. Use fs para ler arquivos e gravar CSV direto em Documents\leitor_documentos.

Web: faça parsing no browser com pdfjs-dist (renderer), usando Web Workers para extrair texto por página; para gravação peça a pasta via File System Access API ou forneça download do CSV.

2.4 Extração de texto por página

Para cada PDF:

Abrir documento (pdfjs) como arraybuffer/Uint8Array.

Para cada página i:

page.getTextContent() → montar pageText (concat dos itens com espaços).

Criar pageDigits = pageText.replace(/\D/g,'').

Guardar também pageTextLower = pageText.toLowerCase() para buscas case-insensitive.

(Opcional) Se PDF for imagem (scanned) ou getTextContent() retornar muito pouco texto, habilitar OCR (Tesseract.js) — processamento bem mais lento.

2.5 Normalização e regras para CPF (regras e regex)

Entrada do usuário: para cada CPF inserido:

Remover todos os caracteres não dígitos: digits = cpf.replace(/\D/g,'').

Se digits.length == 11: ok.

Se digits.length < 11 e Modo permissivo ON: left-pad com zeros até 11 (digits = digits.padStart(11,'0')).

Se digits.length > 11: erro/rejeitar.

Por que o modo permissivo? Alguns exemplos que você passou (245678910) tem 9 dígitos — pode ser CPF com zeros à esquerda ausentes; o modo permissivo tenta cobrir esse caso, mas pode gerar falsos-positivos — então deixe a escolha para o usuário.

Formas a buscar no texto bruto:

Formatos com pontuação: \b\d{3}\.\d{3}\.\d{3}-\d{2}\b

Formato com só dígitos: \b\d{11}\b

Formato com dash somente: \b\d{9}-\d{2}\b (para 002456789-10)

Estratégia robusta (recomendada):

Para cada página: testar tanto a presença do CPF formatado (usar regex em pageText) quanto a presença da sequência digits em pageDigits (search substring). Assim você pega 002.456.789-10, 00245678910, 002456789-10, e também ...00245678910... sem pontuação.

2.6 Algoritmo de busca (escala e performance)

Use pool de workers (Web Workers no browser, worker_threads/child_process no Node) para processar PDFs paralelamente; limite concorrência (ex.: Math.max(1, navigator.hardwareConcurrency - 1)).

Para cada PDF, processe página a página e publique resultados incrementais (streaming UI) — não espere terminar tudo para mostrar algo.

Use busca em duas camadas: primeiro um indexOf (fast) em pageDigits e somente quando batida fazer regex/extração de contexto para exibição. Evita execuções pesadas de regex em todo texto.

Para muitos arquivos/arquivos grandes:

Limite máximo de tamanho por arquivo (configurável, ex.: 200 MB).

Forneça feedback de progresso e opção de cancelar.

Se muitos resultados, use paginação/virtualização (react-window).

Se PDFs são scans (imagens), use OCR separadamente (Tesseract.js) e marque que isso é opcional por ser lento.

2.7 Geração do link para abrir PDF na página certa

Em desktop (Electron):

Abra a janela com um visualizador (ou use shell.openPath() com argumentos) ou carregue o PDF em um viewer embutido e passe o número da página (controlado pela sua UI).

Para gravação local, abra o arquivo pelo path local e controlar viewer.

No browser:

Melhor: embutir o PDF.js viewer (controla #page=) e carregar o PDF (blob) dentro da aplicação, então navegue o viewer para a página encontrada. Fragment em blob URL nem sempre funciona de forma consistente — usar viewer embutido é mais confiável. 
Stack Overflow
+1

2.8 Registro em CSV (log diário)

Esquema CSV: timestamp,cpf,filePath,found,bool,pages
Exemplo: 2025-10-03T14:02:10,00245678910,C:\Users\Lucas\Docs\foo.pdf,true,2;7

Desktop/Electron:

Path destino: path.join(app.getPath('documents'), 'leitor_documentos') (criar se não existir). Nome do arquivo: YYYY-MM-DD.csv. Use fast-csv ou csv-writer para escrita (append em cada execução). 
Electron
+1

Web:

Se o usuário selecionou a pasta com File System Access API, abra um FileSystemFileHandle para o CSV e faça append. Caso contrário, gere o CSV em memória e ofereça download (ou pedir ao usuário para escolher onde salvar).

Sempre escreva os logs em modo append para não sobrescrever do dia; se a sessão for grande, escreva de forma incremental (a cada N resultados) para evitar perder os dados se travar.

3 — Arquitetura de pastas recomendada (React + TypeScript)

my-app/
├─ public/
│   └─ index.html
├─ src/
│   ├─ main.tsx            # bootstrap (ReactDOM)
│   ├─ App.tsx
│   ├─ styles/             # css/tailwind
│   ├─ assets/
│   ├─ components/
│   │   ├─ UploadArea/
│   │   │   ├─ UploadArea.tsx
│   │   │   └─ UploadArea.module.css
│   │   ├─ CpfInput/
│   │   ├─ ResultsTable/
│   │   └─ SearchControls/
│   ├─ pages/
│   ├─ hooks/
│   │   └─ useWorkerPool.ts
│   ├─ services/
│   │   ├─ pdfService.ts      # funções que usam pdfjs/pdf-parse para extrair texto
│   │   └─ logService.ts      # geração/append CSV
│   ├─ workers/
│   │   └─ pdfWorker.ts       # web worker para extração por página
│   ├─ utils/
│   │   ├─ cpf.ts             # normalize + validators + regex helpers
│   │   └─ fileUtils.ts       # leitura recursiva de pastas (electron/webkitdirectory)
│   ├─ types/
│   └─ index.css
├─ package.json
└─ tsconfig.json

4 — Boas práticas React + TypeScript e performance (regras)

Processo pesado fora do thread UI: use Web Workers no browser; worker_threads/child_process no Node/Electron. Nunca extraia texto de PDFs direto no thread da UI.

Limite de concorrência: não processe N PDFs ao mesmo tempo; use pool (ex.: 2–4 workers ou navigator.hardwareConcurrency - 1).

Memória: libere buffers (revoke blob URLs); processe página a página e descarte buffers de PDF já processados.

Virtualização de listas: se resultados forem muitos, use react-window ou react-virtualized para renderizar só o que está visível.

Memoização e pure components: componentes de resultado puros (React.memo), evitar passar funções inline que causem re-render.

Tipos estritos: strict no tsconfig e tipos claros para PdfDocument, PdfPage, SearchResult. Isso ajuda a evitar bugs e melhorar refactor.

Worker-friendly data: serializar somente o necessário ao enviar para workers (ArrayBuffer em vez de objetos grandes).

Debounce UI: evitar chamadas de busca duplicadas; também usar cancel tokens para abortar parsing (AbortController).

Logs incrementais e tolerância a falhas: persistir resultados parciais no CSV frequentemente para não perder tudo se travar.

5 — Bibliotecas recomendadas (com justificativa / referência)

pdfjs-dist (PDF.js) — ótima escolha para extrair texto em navegador; bem suportada. Use no cliente para extrair getTextContent() por página. 
NPM

pdf-parse — wrapper/solução simples para Node que usa pdf.js internamente; conveniente se for processar no backend/Electron. 
NPM

fast-csv / csv-writer — para escrever CSVs grandes de forma eficiente no Node/Electron. fast-csv tem suporte a streaming e é amplamente usado. 
NPM
+1

File System Access API — se for implementar versão web que grava localmente (usuario escolhe pasta). Uso experimental em alguns browsers (ver compatibilidade). 
MDN Web Docs
+1

(Opcional) Tesseract.js — para OCR de PDFs escaneados (imagem → texto). Use apenas se necessário, e informe o usuário que é lento.

6 — Exemplo de fluxo de execução (pseudocódigo resumido)

Usuário solta arquivos/pastas em UploadArea.

App enumera recursivamente os .pdf e armazena lista de File / path.

Usuário insere lista de CPFs e ativa Modo permissivo?.

Ao clicar Buscar:

Normalizar CPFs → lista de strings cpfDigits[].

Criar pool de workers (N).

Para cada arquivo PDF:

Enviar para um worker: carregar pdf → para cada página extrair texto → gerar pageText e pageDigits → verificar cada cpfDigits (indexOf / regex) → se achar, retornar {cpf, filePath, pageNumber, snippet} para UI e para gravar CSV.

UI mostra resultados conforme chegam.

Ao finalizar (ou incremental), escrever/append no CSV diário no diretório Documents\leitor_documentos.

Usuário clica “Abrir página” → app abre viewer embutido apontando ao arquivo e página.

7 — Pontos de atenção / riscos e mitigações

PDFs scaneados (imagem): getTextContent() não acha texto — requer OCR → processamento lento; cobrar para habilitar OCR ou avisar usuário.

Permissive padding pode gerar falsos-positivos. Mostre controle para usuário.

Segurança / Privacidade: os PDFs podem conter dados sensíveis — se for desktop local, deixe claro que tudo fica local. Se houver upload a servidor, criptografe e siga LGPD/GDPR.

Compatibilidade de seleção de diretório no navegador: webkitdirectory funciona em muitos browsers; File System Access API é experimental em alguns. Fornecer fallback. 
MDN Web Docs
+1