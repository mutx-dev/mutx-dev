# MUTX — origem do nome + custo de desenvolvimento/operação

_Data: 2026-03-26_

## 1) Origem do nome “MUTX”

**Resposta curta:** não encontrei, no repositório nem nas memórias locais, uma explicação canônica escrita pelo Fortune para a origem do nome.

**Leitura mais provável e defensável:** **MUTX soa como “mutex”** — a primitive de coordenação/controle em sistemas concorrentes.

Isso combina bem com o que a MUTX quer ser:
- camada de **coordenação** para agentes
- **controle operacional** sobre muitos processos autônomos
- evitar caos/colisão entre execuções, estados, permissões e lifecycle

**Forma boa de explicar para terceiros / CMO:**
> “MUTX é uma versão curta, mais brandável e infra-native de ‘mutex’: a camada de controle e coordenação que faz múltiplos agentes operarem como sistema, não como demo.”

**Observação importante:** isso é a **melhor explicação inferida**, não uma citação histórica confirmada em documento interno.

---

## 2) Custos de AI para desenvolver e operar a MUTX

### O que está medido de verdade agora
Fonte usada: **CodexBar local** (custo/tokens do provider Codex).

#### Hard numbers
- **Últimos 30 dias — Codex**
  - **Custo:** **US$ 929.69**
  - **Tokens:** **2,102,977,528**
- **Hoje (2026-03-26) — Codex**
  - **Custo:** **US$ 54.29**
  - **Tokens:** **131,884,852**
- **Ontem (2026-03-25) — Codex**
  - **Custo:** **US$ 54.31**
  - **Tokens:** **138,375,078**
- **Claude local**
  - **Custo rastreado:** **US$ 0.00**
  - **Tokens rastreados:** **0**

### Separação desenvolvimento vs manutenção/operação
Não existe hoje, no workspace, uma contabilidade perfeita por tarefa. Então a separação abaixo é **heurística explícita**, não contabilidade financeira fechada.

#### Heurística usada
- **Últimos 30 dias:** assumir **85% desenvolvimento** / **15% manutenção-operação**
  - porque o padrão visível foi fortemente code-heavy: implementação, review, refactors, parity work, PR healing, etc.
- **Hoje:** assumir **70% desenvolvimento** / **30% manutenção-operação**
  - porque hoje houve mais overhead operacional (debug de ACP, OpenClaw config, heartbeats, X worker, orchestration)

#### Estimativa — últimos 30 dias
- **Desenvolvimento:**
  - **US$ 790.24**
  - **1,787,530,898 tokens**
- **Manutenção / operação:**
  - **US$ 139.45**
  - **315,446,629 tokens**

#### Estimativa — hoje
- **Desenvolvimento:**
  - **US$ 38.01**
  - **92,319,396 tokens**
- **Manutenção / operação:**
  - **US$ 16.29**
  - **39,565,455 tokens**

---

## 3) Aproximação de tokens para “6 milhões de linhas de código + reasoning”

Se alguém olhar só para **6 milhões de linhas de código**, o impulso é achar que isso equivale a um número parecido de tokens. Não equivale.

### Regra prática
Código costuma cair, grosseiramente, em algo como:
- **6 tokens por linha** (estimativa conservadora)
- **9 tokens por linha** (meio do caminho)
- **12 tokens por linha** (estimativa alta)

Para **6.000.000 LOC**, isso dá:
- **baixo:** ~**36,000,000 tokens**
- **meio:** ~**54,000,000 tokens**
- **alto:** ~**72,000,000 tokens**

### O ponto importante
O custo real do projeto não vem de “ler o código uma vez”.
Vem de:
- re-leitura de contexto
- múltiplos passes sobre os mesmos arquivos
- diffs / reviews / retries
- reasoning entre etapas
- loops de PR / CI / healing / orchestration

Por isso, o número **medido** nos últimos 30 dias (**2,102,977,528 tokens**) é muito maior do que a estimativa de “tokenizar 6M LOC uma vez”.

Em outras palavras:
> **o custo do projeto é dominado por iteração e reasoning, não por snapshot bruto do código.**

---

## 4) Resumo executivo pro CMO

### Texto curto
> A origem mais provável de “MUTX” é uma variação brandável de “mutex”, remetendo a coordenação e controle de sistemas concorrentes — exatamente o papel da plataforma para agentes.
>
> Em custo de AI, o dado medido hoje mostra aproximadamente **US$ 929.69 / 2,102,977,528 tokens** nos últimos 30 dias via Codex, com uma divisão heurística de **~85% desenvolvimento** e **~15% manutenção/operação**. No dia de hoje, a estimativa fica em **US$ 54.29 / 131,884,852 tokens**, com um mix mais operacional (**70/30**).
>
> A maior parte do gasto não vem de “ler 6 milhões de linhas uma vez”, e sim da iteração contínua: reasoning, revisões, retries, debugging, orchestration e múltiplos passes sobre o mesmo código.

---

## 5) Limites deste material

Este material **não inclui** ainda:
- billing de cloud / infra / domains / SaaS externos
- custo consolidado de todos os modelos fora do CodexBar local
- alocação perfeita por squad, feature ou workstream

Se quiser, o próximo passo é montar uma **versão financeira de verdade**, com 3 blocos:
1. **AI dev spend**
2. **AI ops spend**
3. **infra / SaaS / fixed monthly stack**
