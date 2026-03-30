# TradingAgents caveats and repo truths


## Contents

- [When to read this](#when-to-read-this)
- [Safety and usage posture](#safety-and-usage-posture)
- [Reproducibility limits](#reproducibility-limits)
- [Repo truths worth knowing](#repo-truths-worth-knowing)
  - [1. Default data path is lighter-weight than the README may imply](#1-default-data-path-is-lighter-weight-than-the-readme-may-imply)
  - [2. `.env.example` is incomplete relative to README](#2-envexample-is-incomplete-relative-to-readme)
  - [3. `results_dir` does not control all logs](#3-resultsdir-does-not-control-all-logs)
  - [4. Exchange-qualified tickers are a first-class concern](#4-exchange-qualified-tickers-are-a-first-class-concern)
  - [5. Analyst naming is slightly inconsistent across code/UI/docs](#5-analyst-naming-is-slightly-inconsistent-across-codeuidocs)
  - [6. This is not a brokerage or execution stack](#6-this-is-not-a-brokerage-or-execution-stack)
- [Evaluation guidance](#evaluation-guidance)
- [Good language to use](#good-language-to-use)

## When to read this

Read this file before making strong claims about performance, reproducibility, safety, or operational readiness.

## Safety and usage posture

TradingAgents is explicitly presented by Tauric Research as a **research-purpose** framework.

Key disclaimer points from Tauric’s public disclaimer:

- educational and research purposes only
- not financial, investment, or trading advice
- no warranty of accuracy or completeness
- past performance is not predictive of future results
- users bear risk of loss
- AI/autonomous-agent outputs can be wrong, incomplete, or brittle under volatility

Always echo this framing when summarizing results.

## Reproducibility limits

Do not imply deterministic behavior. Results vary with:

- chosen LLM provider
- chosen model names
- provider-specific thinking/reasoning settings
- temperature/default provider behavior
- selected analysts
- debate depth
- data vendor choice and freshness
- date/ticker selection
- third-party API changes

Even the final normalized rating is produced by an LLM call.

## Repo truths worth knowing

### 1. Default data path is lighter-weight than the README may imply

The default config uses `yfinance` for all data categories:

- stock data
- technical indicators
- fundamentals
- news

So a basic experiment can run **without** Alpha Vantage, as long as the chosen LLM provider key exists.

### 2. `.env.example` is incomplete relative to README

The README mentions `ALPHA_VANTAGE_API_KEY`, but `.env.example` does not include it.

Do not tell users “copy `.env.example` and you are done” if they plan to use Alpha Vantage.

### 3. `results_dir` does not control all logs

The CLI respects `results_dir`, but `TradingAgentsGraph._log_state()` writes to hard-coded `eval_results/...` paths.

So changing `TRADINGAGENTS_RESULTS_DIR` does not fully relocate all outputs.

### 4. Exchange-qualified tickers are a first-class concern

The repo includes explicit tests and agent instructions to preserve exchange suffixes like `.TO`, `.HK`, `.T`, `.L`.

If a user gives a non-US ticker, do not silently strip or normalize away the suffix.

### 5. Analyst naming is slightly inconsistent across code/UI/docs

Examples:

- internal key: `social`
- CLI wording: “Social Media Analyst”
- some report labels: “Social Analyst”
- report field: `sentiment_report`

Be precise when mapping user requests to code.

### 6. This is not a brokerage or execution stack

The repo describes a simulated exchange/execution conceptually, but the exposed OSS usage pattern is research-oriented analysis and decision generation. Avoid overselling it as ready-to-deploy live trading infrastructure.

## Evaluation guidance

When helping a user compare experiments:

- hold ticker/date/provider/data vendor constant unless intentionally testing them
- compare one variable at a time
- log model names and reasoning/thinking settings explicitly
- save both structured state and human-readable reports
- separate “framework quality” from “market regime luck”

## Good language to use

Prefer:

- “research result”
- “model-generated recommendation”
- “experimental decision output”
- “backtesting/evaluation caveat”

Avoid:

- “guaranteed edge”
- “production-safe trading system”
- “investment advice”
- “deterministic strategy alpha”
