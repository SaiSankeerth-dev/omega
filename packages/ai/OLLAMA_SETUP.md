Ollama local dev setup

1. Install Ollama (https://ollama.com/docs/installation).
2. Run the Ollama daemon: ollama serve
3. Install a model, for example: ollama pull llama2
4. Set environment variables in your .env (or system):
   - OLLAMA_API_URL=http://localhost:11434
   - OLLAMA_DEFAULT_MODEL=llama2
5. Run the server and then run the test command:
   - pnpm -w test (or the project's test runner)

Health check:
- GET ${OLLAMA_API_URL}/api/ping should return 200 when running.

Notes:
- Ollama on localhost requires local compute. For CI use OpenRouter or a cloud provider.
- Streams: Ollama supports NDJSON streaming on /api/generate when stream=true.
