# ⚡ STEP 1 — Install everything

```bash
brew install ollama
npm i -g @openai/codex
```

Start Ollama:

```bash
ollama serve
```

---

# 🧠 STEP 2 — Install a GOOD coding model

👉 Recommended for your Mac mini:

```bash
ollama pull qwen2.5-coder:7b
```

---

# ⚙️ STEP 3 — Create Codex config (MOST IMPORTANT)

Create file:

```bash
~/.codex/config.toml
```

---

## 🔥 Paste THIS (production config)

```toml
# Default = cloud (best reasoning)
model = "gpt-5"
model_provider = "openai"

########################################
# LOCAL MODEL (Ollama)
########################################

[model_providers.ollama]
name = "Ollama"
base_url = "http://localhost:11434/v1"

########################################
# PROFILES
########################################

# 🧠 Cloud (default)
[profiles.cloud]
model = "gpt-5"
model_provider = "openai"

# ⚡ Local (fast + free)
[profiles.local]
model = "qwen2.5-coder:7b"
model_provider = "ollama"

# 🔥 Hybrid (optional advanced)
[profiles.fast]
model = "qwen2.5-coder:7b"
model_provider = "ollama"

########################################
# OPTIONAL TUNING
########################################

# Increase context if needed
# model_context_window = 64000
```

👉 Codex uses this config system to define providers + profiles ([OpenAI Developers][1])

---

# 🚀 STEP 4 — Run Codex

### Default (cloud)

```bash
codex
```

---

### Local model

```bash
codex --profile local
```

---

### Quick local mode

```bash
codex --oss
```

👉 `--oss` automatically uses local providers like Ollama ([Ollama Docs][2])

---

# 🔥 STEP 5 — Your REAL workflow

## 🟢 Use LOCAL for:

```txt
- refactoring files
- formatting code
- adding types
- generating boilerplate
```

Command:

```bash
codex --profile local
```

---

## 🔵 Use CLOUD for:

```txt
- debugging auth system
- OAuth + Better Auth integration
- architecture decisions
- multi-file reasoning
```

Command:

```bash
codex --profile cloud
```

---

# 🧠 STEP 6 — Use it on your repo

```bash
cd vezham
codex
```

Then say:

```txt
Understand this SaaS system and fix all auth + OAuth flows
```

---

# ⚠️ IMPORTANT TUNING (you’ll hit this)

## Increase context for big repo

In Ollama:

```bash
/set parameter num_ctx 32768
```

👉 Local models need manual context tuning ([Medium][3])

---

# 🔥 OPTIONAL — Add LM Studio too (hybrid++)

If you install LM Studio:

```toml
[model_providers.lmstudio]
name = "LM Studio"
base_url = "http://localhost:1234/v1"

[profiles.lm]
model = "qwen/qwen3-coder-30b"
model_provider = "lmstudio"
```

---

# 🧠 FINAL SETUP (MENTAL MODEL)

```txt
Mac mini
 ├── Codex CLI (controller)
 ├── Ollama (local models)
 ├── LM Studio (optional UI)
 └── Your repo

Cloud
 └── OpenAI models (deep reasoning)
```

```txt
Local → speed + cost
Cloud → intelligence
```
