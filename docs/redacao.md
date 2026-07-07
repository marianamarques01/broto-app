# Plano de Desenvolvimento — Módulo de Redação (ENEM)
### Correção, feedback e evolução da escrita dissertativo-argumentativa
**Julho 2026 · Documento técnico de produto**

---

## 0. Por que redação é o módulo mais delicado — e o mais valioso — do Broto

Todo outro módulo do Broto lida com conteúdo que tem certo/errado (questão, flashcard) ou com comportamento (engajamento, rotina). **Redação não tem gabarito.** A nota é dada por dois avaliadores humanos, com margem de discordância entre eles, seguindo uma matriz de referência interpretativa. Isso muda o problema de "gerar/verificar" para **"avaliar com defensabilidade"** — e defensabilidade é mais difícil de garantir do que correção.

Ao mesmo tempo, é provavelmente a maior dor não resolvida do ENEM: professor de escola pública corrige em média dezenas de redações por semana, sem tempo para feedback individualizado repetido; cursinho caro cobra caro exatamente por oferecer correção humana frequente. **Um corretor de IA bem calibrado, com feedback acionável e disponível todo dia, é o tipo de coisa que top-of-mind de mercado (Escrevendo o Futuro, redação online paga em cursinhos) ainda não entrega de graça e em escala.** É também o argumento mais forte que vocês terão numa reunião com secretaria: nenhum sistema estadual hoje consegue dar a cada aluno correção frequente de redação — capacidade humana não escala.

[FATO — INEP, Cartilha do Participante 2025] A redação do ENEM é um texto dissertativo-argumentativo de até 30 linhas, avaliado por dois corretores independentes segundo cinco competências, cada uma valendo até 200 pontos, somando até 1.000. As competências são: **I** — domínio da modalidade escrita formal da língua portuguesa; **II** — compreender a proposta e aplicar conhecimentos de várias áreas para desenvolver o tema dentro da estrutura dissertativo-argumentativa; **III** — selecionar, relacionar, organizar e interpretar informações e argumentos em defesa de um ponto de vista; **IV** — conhecimento dos mecanismos linguísticos para construção da argumentação (coesão); **V** — elaborar proposta de intervenção para o problema, respeitando os direitos humanos. A nota final é a média aritmética dos dois avaliadores. Fatores que zeram a redação incluem fuga ao tema, texto muito curto, cópia dos textos motivadores, uso de língua estrangeira, identificação do candidato no texto e desrespeito à estrutura dissertativa.

Este é o documento que deve ancorar (via RAG) toda a lógica de correção do módulo — não o conhecimento genérico da LLM sobre "o que é uma boa redação".

---

## 1. O ciclo central (o que realmente ensina a escrever)

Correção isolada não ensina — o que ensina é o ciclo **escrever → receber feedback específico → reescrever → comparar**. O produto não pode ser "cole seu texto, receba uma nota" (isso existe grátis em vários lugares e não gera retenção nem aprendizado real). O núcleo do módulo é:

```
[Aluno escolhe/recebe um tema] 
        │
        ▼
[Aluno escreve (editor com contador de linhas, 
 estilo folha de resposta ENEM)]
        │
        ▼
[Correção por IA: nota por competência + 
 feedback textual específico + marcações no 
 próprio texto (trecho a trecho)]
        │
        ▼
[Aluno vê onde perdeu pontos e por quê,
 com sugestão concreta de como melhorar 
 aquele trecho]
        │
        ▼
[Opção: reescrever o mesmo tema incorporando 
 o feedback, OU seguir para um novo tema visando 
 a mesma competência fraca]
        │
        ▼
[Histórico de evolução por competência 
 ao longo do tempo — o gráfico que mostra 
 progresso é o que retém o aluno]
```

[INSIGHT] O valor differencial não é "corrigir rápido" — é **isolar a competência específica que está travando aquele aluno** e alimentar isso de volta no motor de rotina de estudo que já existe. Um aluno fraco em Competência IV (coesão) deveria começar a ver, no seu plano de estudo geral, exercícios ligados a conectivos e articulação textual — a redação vira mais um sinal para o mesmo cérebro adaptativo do Broto, não um app separado.

---

## 2. Personas e o que cada uma precisa

| Persona | O que precisa | Onde aparece |
|---|---|---|
| **Aluno** | Escrever, entender exatamente onde errou, saber o que fazer para melhorar, ver progresso | App principal |
| **Professor (painel de instituições)** | Ver quais alunos da turma estão fracos em quais competências, sem ler 40 redações manualmente, mas se quiser, tem acesso as redacoes para ler | Módulo de instituições (integração futura) |
| **Coordenador/diretor** | Prova de que o produto melhora nota de redação — métrica concreta para renovar contrato | Painel de escola (relatório) |
| **Equipe Broto (revisão)** | Auditar amostras de correção da IA para garantir calibração e detectar viés/erro sistemático | Painel interno |

---

## 3. O que é preciso ter (funcionalidades essenciais)

### 3.1 Banco de temas
- Temas próprios no estilo ENEM (situação-problema + textos motivadores curtos), gerados ou curados, cobrindo os grandes eixos temáticos recorrentes (educação, saúde, meio ambiente, tecnologia/dados, trabalho, direitos humanos, cultura).
- Temas reais de provas passadas do ENEM (1998–2025) **catalogados como referência de prática**, mas ao gerar novos textos motivadores para treino, nunca reproduzir os textos motivadores originais protegidos — apenas referenciar o tema/ano.
- Área de repertórios, dicas e modelos de redação para consulta. Tudo isso deve ser adicionado pelo professor. 
- Rotação/recomendação de tema: se o aluno já treinou muito um eixo temático, sugerir outro, para ampliar repertório (ligado à própria Competência II, que pune "repertório de bolso" — repertório pronto e genérico, sem conexão real com o tema, segundo a própria cartilha do INEP).

### 3.2 Editor de escrita
- Interface que simula a folha de resposta real: contagem de linhas (não só de caracteres — o ENEM pontua por linha, de 7 a 30), fonte legível, sem ferramentas de autocorreção que mascarem erros reais (o aluno precisa treinar a escrever como escreverá na prova).
- Opção de digitar OU enviar foto de redação manuscrita (muitos alunos treinam à mão, como será no exame real) — isso implica OCR de manuscrito, mais complexo, avaliar se entra no MVP ou depois.
- Timer opcional simulando a prova real (redação faz parte de uma prova de tempo limitado).

### 3.3 Motor de correção
- Nota de 0 a 200 por competência (I a V), motor separado por competência — não uma nota única "chutada" no fim.
- Justificativa textual por competência, em linguagem que o aluno entenda (não jargão de linguística).
- **Marcação inline no texto**: destacar o trecho específico onde um problema ocorre (ex.: desvio de norma culta, argumento fraco, ausência de conectivo), não só um parágrafo genérico de feedback no final — isso é o que mais diferencia correção útil de correção decorativa.
- Verificação de "fatores de nota zero" (fuga ao tema, cópia de texto motivador, texto muito curto, não-atendimento à estrutura dissertativo-argumentativa) como checagem própria e explícita, já que são casos especiais fora da escala 0–200 por competência.
- Avaliação específica da proposta de intervenção (Competência V) quanto a respeitar direitos humanos — esse é um ponto sensível: o modelo deve avaliar a **estrutura** da proposta (quem faz, o que faz, como, para quem, detalhamento — os elementos que a cartilha do INEP valoriza), não a posição política do aluno, desde que a proposta não viole direitos humanos.

### 3.4 Evolução e integração com o resto do Broto
- Gráfico de evolução por competência ao longo das redações enviadas — visual simples, tipo "sua Competência IV subiu 30 pontos nos últimos 5 textos".
- Alimentar o motor de rotina: competência fraca em redação gera recomendação de conteúdo relacionado (ex.: fraco em coesão → sugestão de flashcards/exercícios sobre conectivos, do módulo de geração de conteúdo já planejado).
- No painel de instituições (futuro): agregação por turma de "competência mais fraca da sala" — dado valioso para o professor decidir o que retomar em aula.

---

## 4. Requisitos não-funcionais críticos

1. **Calibração contra critério oficial, não "achismo" da LLM.** Todo prompt de correção deve ser ancorado via RAG na Cartilha do Participante do INEP (matriz de referência detalhada por competência) — não depender do conhecimento genérico do modelo sobre "o que é uma boa redação".
2. **Consistência.** A mesma redação enviada duas vezes deve receber nota e feedback muito próximos — variação alta destrói confiança. Isso é problema de engenharia de prompt (temperatura baixa, instruções estruturadas) e de teste (rodar a mesma entrada N vezes e medir variância antes de lançar).
3. **Calibração humana contínua.** Amostragem regular de redações corrigidas pela IA revisadas por um humano (idealmente alguém com experiência real de correção ENEM/vestibular) comparando notas — essa é a defesa de credibilidade do produto inteiro, principalmente para venda institucional.
4. **Transparência do feedback.** O aluno (e o professor, se aplicável) deve conseguir entender *por que* uma nota foi dada, não receber um número solto — isso é também proteção contra reclamação/desconfiança.
5. **Cuidado com temas sensíveis.** Redação do ENEM frequentemente aborda temas como violência, saúde mental, discriminação, desigualdade. O sistema deve avaliar a qualidade argumentativa sem penalizar posições políticas legítimas nem, no extremo oposto, deixar de sinalizar quando um texto do aluno contém conteúdo que mereça atenção humana (ex.: sinais de sofrimento pessoal explícitos no texto, que é diferente de erro de redação — nesse caso o produto deve ter um caminho de resposta cuidadosa, não só uma nota).
6. **Direitos autorais.** Nunca reproduzir redações nota 1000 publicadas pelo INEP ou por terceiros como se fossem geradas pelo sistema; podem ser referenciadas/resumidas como exemplo pedagógico, nunca copiadas.
7. **Acessibilidade.** O INEP já disponibiliza versões da cartilha para candidatos com dislexia, surdez/deficiência auditiva e TEA — sinal de que a prova em si já pensa em adaptações; o módulo deveria, no médio prazo, considerar necessidades similares (fontes, contraste, tempo de leitura do feedback).

---
a partir de agora considere tambem a parte da area de repertorios etc, que nao foi contemplada nesse doc mas deve ser feita tb

## 5. Modelo de dados (entidades novas) 

- `Tema`: enunciado, textos motivadores (próprios ou referência a tema histórico), eixo temático, nível de dificuldade, ano de referência (se baseado em prova real).
- `Redacao`: aluno_id, tema_id, texto (ou referência à imagem, se manuscrita), data_envio, modo (digitado/foto/cronometrado).
- `CorrecaoRedacao`: redacao_id, nota por competência (5 campos, 0–200 cada), nota_total, justificativas por competência (texto), marcações_inline (lista de trechos + tipo de problema + comentário), fatores_zero_detectados (booleano + motivo), versão_prompt, modelo_usado.
- `RevisaoHumanaCorrecao`: correcao_id, revisor, nota_humana por competência (para comparação), concordância/discordância, comentário — usado para calibração contínua.
- `EvolucaoCompetencia`: snapshot histórico por aluno/competência ao longo do tempo, para o gráfico de evolução (pode ser view calculada a partir de `CorrecaoRedacao`, não necessariamente tabela própria).

---

## 6. Fases de desenvolvimento

| Fase | Prazo sugerido | Entregável | Por quê |
|---|---|---|---|
| **Fase 1 — Banco de temas + editor** | 1–2 semanas | Temas próprios cadastrados + editor com contagem de linhas | Base necessária antes de qualquer correção |
| **Fase 2 — Motor de correção (texto digitado)** | 3–4 semanas | Correção por competência ancorada na matriz do INEP via RAG, com marcação inline e checagem de fatores de nota zero | O coração do módulo — merece o maior tempo e cuidado |
| **Fase 3 — Calibração humana** | Paralelo à Fase 2, 1–2 semanas de setup | Fluxo de amostragem + comparação nota IA vs. nota humana + relatório de concordância | Sem isso, não dá para afirmar publicamente que a correção é confiável |
| **Fase 4 — Evolução e integração com rotina** | 2 semanas | Gráfico de evolução por competência + gatilho de recomendação de conteúdo baseado em competência fraca | Fecha o ciclo pedagógico e conecta ao resto do Broto |
| **Fase 5 — Envio por foto (manuscrito)** | 2–3 semanas, pode ser adiada | OCR de redação manuscrita | Alto valor (treino real como na prova), mas tecnicamente mais custoso — avaliar se entra no MVP comercial ou na v2 |
| **Fase 6 — Painel institucional de redação** | 1–2 semanas | Agregação por turma de competências fracas, no módulo de instituições já planejado | Argumento comercial forte para escola/secretaria |

---

## 7. Prompts para desenvolver (uso com Claude Code / agente de desenvolvimento)

Como nos módulos anteriores: peça para o agente ler a arquitetura RAG e o pipeline de geração de conteúdo já existentes antes de propor algo novo — o motor de correção de redação deve reaproveitar a infraestrutura de RAG, não duplicá-la.

### Prompt 1 — Levantamento e arquitetura do motor de correção

> **Concluído (jul/2026).** Entregáveis:
> - [`docs/redacao-arquitetura-motor.md`](./redacao-arquitetura-motor.md) — arquitetura RAG, modelo de dados, prompts
> - [`.planning/phases/redacao-enem/PLAN.md`](../.planning/phases/redacao-enem/PLAN.md) — plano executável por waves (REDA-01…08)

```
Contexto: quero adicionar ao Broto um módulo de correção de redação no
formato do ENEM (texto dissertativo-argumentativo, avaliado em 5
competências de 0 a 200 pontos cada, seguindo a Matriz de Referência oficial
do INEP). O Broto já tem um pipeline RAG usado para geração de conteúdo.

Antes de escrever código:
1. Leia a arquitetura atual do pipeline RAG e do módulo de geração de
   conteúdo (se já implementado) para reaproveitar padrões e infraestrutura.
2. Proponha como indexar, na base RAG, a Cartilha do Participante do ENEM
   (documento oficial do INEP com a Matriz de Referência detalhada por
   competência) para que o motor de correção consulte esse documento como
   fonte de verdade, em vez de depender do conhecimento genérico do modelo
   sobre "o que é uma boa redação".
3. Proponha o modelo de dados para Tema, Redacao, CorrecaoRedacao (nota por
   competência, justificativas, marcações inline no texto, detecção de
   fatores de nota zero) e RevisaoHumanaCorrecao (para calibração).
4. Proponha a estratégia de prompt para a correção: como estruturar a
   chamada ao modelo para produzir nota + justificativa + marcações
   inline de forma consistente e no formato que o frontend vai consumir
   (ex.: JSON com trechos de texto e posição/offset, tipo de problema,
   comentário).
5. NÃO implemente ainda — apresente o plano para eu revisar.
```

### Prompt 2 — Motor de correção (núcleo)
```
Implemente o motor de correção de redação aprovado na etapa anterior.

Requisitos:
1. Receber o texto da redação e o tema associado (incluindo textos
   motivadores do tema, se houver).
2. Antes de avaliar, checar os "fatores de nota zero" descritos na Matriz
   de Referência do INEP (fuga completa ao tema, texto muito curto — menos
   de 7 linhas —, cópia integral dos textos motivadores, não atendimento à
   estrutura dissertativo-argumentativa, entre outros). Se algum for
   detectado, a correção deve refletir isso claramente antes de prosseguir
   com a nota por competência.
3. Para cada uma das 5 competências, gerar: nota de 0 a 200 (em múltiplos
   de 40, como no critério oficial), uma justificativa em linguagem
   acessível ao aluno, e uma lista de marcações inline (trecho específico
   do texto + tipo de problema + comentário) sempre que aplicável.
4. Ancorar toda a avaliação nos trechos relevantes da Cartilha do
   Participante recuperados via RAG (injetar no prompt a descrição
   detalhada da competência sendo avaliada).
5. Retornar o resultado no formato de dados definido no modelo de
   CorrecaoRedacao.
6. Escreva testes com pelo menos 3 redações de qualidade claramente
   diferente (uma fraca, uma mediana, uma forte) para verificar que o
   motor diferencia adequadamente entre elas — se possível, use redações
   de exemplo público disponibilizadas pelo próprio INEP na cartilha como
   referência de calibração inicial (sem reproduzi-las no produto final,
   apenas como material de teste interno).
7. Rode a mesma redação de teste múltiplas vezes e reporte a variância da
   nota entre execuções — isso deve ficar documentado como métrica de
   consistência do motor.
```

### Prompt 3 — Editor de escrita (frontend)
```
Construa a tela de escrita de redação no [pasta do app], seguindo a
identidade visual já usada no Broto.

Requisitos:
1. Editor de texto simples, sem autocorreção agressiva, com contagem de
   linhas (não só caracteres) visível em tempo real — o ENEM avalia entre
   7 e 30 linhas.
2. Exibição do tema escolhido (situação-problema + textos motivadores) de
   forma fixa/visível enquanto o aluno escreve, como na prova real.
3. Opção de ativar um cronômetro simulando tempo de prova (funcionalidade
   opcional, não obrigatória para enviar).
4. Ao enviar, chamar o motor de correção e exibir um estado de
   carregamento claro (a correção pode levar alguns segundos).
5. Não implementar ainda o envio por foto/manuscrito — isso é uma fase
   posterior. Foco nesta etapa é o fluxo de texto digitado.
```

### Prompt 4 — Tela de feedback (frontend)
```
Construa a tela de resultado da correção de redação.

Requisitos:
1. Exibir a nota total e a nota de cada uma das 5 competências, com
   indicação visual clara de qual competência está mais fraca.
2. Exibir o texto original da redação com as marcações inline destacadas
   (ex.: trecho sublinhado/colorido conforme o tipo de problema), e ao
   clicar/tocar em uma marcação, mostrar o comentário específico daquele
   trecho.
3. Exibir a justificativa textual de cada competência de forma acessível,
   evitando jargão técnico de linguística sem explicação.
4. Se fatores de nota zero foram detectados, isso deve aparecer de forma
   destacada e clara, explicando o motivo.
5. Incluir um botão de "reescrever este tema" que leva o aluno de volta ao
   editor com o mesmo tema, e um botão de "praticar minha competência mais
   fraca" que leva a um novo tema (lógica de recomendação pode ser simples
   nesta fase: mesmo eixo temático ou aleatório entre os temas
   disponíveis).
```

### Prompt 5 — Fluxo de calibração humana
```
Implemente o fluxo interno de calibração humana do motor de correção.

Requisitos:
1. Painel interno (equipe Broto) que lista redações corrigidas pela IA,
   permitindo selecionar uma amostra para revisão humana.
2. Interface para o revisor humano atribuir sua própria nota por
   competência à mesma redação, sem ver a nota da IA antes de terminar sua
   avaliação (evitar viés de ancoragem).
3. Após a revisão humana ser salva, exibir a comparação: nota IA vs. nota
   humana, por competência, com o cálculo de diferença.
4. Painel agregado mostrando, ao longo do tempo, a concordância média
   entre IA e humano por competência (ex.: diferença média absoluta) — essa
   métrica deve ficar visível para orientar decisões de ajuste de prompt
   ou de confiança no motor.
5. Escreva testes garantindo que a nota da IA não é exibida ao revisor
   humano antes de ele submeter sua própria avaliação.
```

### Prompt 6 — Evolução e integração com o motor de rotina
```
Implemente o rastreamento de evolução do aluno em redação e a integração
com o motor de recomendação de estudo já existente no Broto.

Requisitos:
1. A partir do histórico de CorrecaoRedacao de um aluno, calcular a
   evolução de cada competência ao longo do tempo (ex.: média móvel das
   últimas N redações, ou simplesmente a série temporal das notas).
2. Construir um componente de frontend simples (gráfico de linha) mostrando
   essa evolução por competência, para o aluno acompanhar seu progresso.
3. Quando uma competência estiver consistentemente fraca (defina um
   critério, ex.: média abaixo de um limiar nas últimas 3 redações),
   disparar uma recomendação para o motor de rotina de estudo já existente,
   sugerindo conteúdo relacionado (ex.: se a Competência IV — coesão —
   estiver fraca, sugerir prática de conectivos/articulação textual do
   módulo de flashcards/questões já implementado, se disponível).
4. Documente claramente como esse gatilho se conecta à lógica de seleção
   de conteúdo já existente no motor de rotina, para não duplicar lógica de
   priorização que já existe no BKT.
```

### Prompt 7 — Auditoria de segurança e sensibilidade de conteúdo
```
Faça uma auditoria do módulo de redação com foco em dois riscos
específicos deste módulo: conteúdo sensível escrito pelo próprio aluno e
avaliação enviesada de propostas de intervenção.

1. Revise o prompt de correção da Competência V (proposta de intervenção)
   e confirme que a avaliação é sobre a ESTRUTURA da proposta (elementos
   como agente, ação, meio, finalidade, detalhamento) e sua compatibilidade
   com direitos humanos, não sobre concordância com a posição política do
   aluno.
2. Proponha uma checagem (pode ser um passo adicional de análise, não
   necessariamente bloqueante) para identificar se o texto do aluno contém
   sinais de sofrimento pessoal genuíno (não relacionados à qualidade da
   redação em si) que mereçam um encaminhamento cuidadoso, diferente de
   uma simples nota — documente essa lógica com bastante cautela, já que
   o produto NÃO deve diagnosticar nem alarmar o aluno automaticamente,
   apenas sinalizar internamente para que a equipe pense em um fluxo de
   resposta apropriado.
3. Verifique se o pipeline evita reproduzir, mesmo parcialmente, redações
   nota 1000 publicadas pelo INEP ou por terceiros como se fossem geradas
   pelo sistema.
4. Gere um relatório resumido (markdown) das descobertas para documentação
   interna.
```

---

## 8. Como isso vira argumento comercial (conectando ao GTM)

- **Para escola/cursinho (Trilho B):** "Cada aluno recebe correção de redação toda semana, coisa que nenhum professor consegue sozinho." É um dos motivos de compra mais concretos e fáceis de demonstrar ao vivo.
- **Para secretaria (Trilho C):** redação é a parte do ENEM mais citada como "gargalo de correção" em redes públicas — poucos professores, muitos alunos. Um painel agregado de "competências mais fracas por escola/regional" é dado de gestão que hoje simplesmente não existe em escala estadual.
- **Para investidor:** este módulo é o que mais evidencia o "moat de dados" discutido no dossiê estratégico — cada redação corrigida gera dado de evolução de escrita por aluno ao longo do tempo, algo que nenhum concorrente de conteúdo replica só copiando a interface.

---

## 9. O que NÃO construir ainda

- Correção de redações em outros formatos de vestibular (FUVEST, UNICAMP, etc., que têm critérios próprios) — fica para depois que o motor ENEM estiver calibrado e confiável.
- Envio por foto/manuscrito — avaliar entrada em fase posterior; tecnicamente mais caro (OCR) e o digitado já entrega o ciclo pedagógico completo.
- Correção colaborativa entre alunos (peer review) — feature social interessante, mas não essencial ao MVP.
- Geração automática de "redação modelo perfeita" para o tema — risco de o aluno copiar em vez de aprender; se implementado no futuro, deve vir com fricção pedagógica proposital (ex.: só liberar depois que o aluno enviar sua própria tentativa).

---

## 10. Checklist antes de qualquer correção chegar a um aluno real

- [ ] Motor de correção ancorado via RAG na Cartilha do Participante do INEP, não em conhecimento genérico do modelo
- [ ] Teste de consistência (mesma redação, múltiplas execuções) com variância documentada e aceitável
- [ ] Amostra de calibração humana rodada e taxa de concordância IA vs. humano documentada
- [ ] Checagem de fatores de nota zero implementada e testada
- [ ] Avaliação da Competência V confirmada como estrutural, não política
- [ ] Nenhuma redação nota 1000 real reproduzida no produto
- [ ] Marcações inline funcionando e compreensíveis na interface (teste com pelo menos um aluno real antes do lançamento amplo)