cd ~

brew install ollama
npm i -g @openai/codex

ollama --version
codex --version

ollama serve
ollama pull qwen2.5-coder:7b

ollama list ==> qwen2.5-coder:7b

ollama run qwen2.5-coder:7b