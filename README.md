# BASTIVOYAGE
mkdir travel-ai && cd travel-ai && npx create-next-app@latest . --ts --tailwind --app && \
mkdir -p app components lib api prompts && \
echo "# Travel AI Platform

## Description
App IA de voyage (budget, vols, trains, hôtels, itinéraires).

## Prompt IA (Claude)
Copier le contenu du fichier prompts/claude.md pour générer l'architecture complète.

## Stack
- Next.js
- TypeScript
- Tailwind
- API IA (Claude/OpenAI)
- APIs voyage (Skyscanner, SNCF, Amadeus)

## Objectif
Assistant IA de voyage complet avec optimisation budget + réservation." > README.md && \
echo "Tu es un expert en architecture SaaS voyage. Crée l'app complète..." > prompts/claude.md && \
git init && git add . && git commit -m "init travel ai platform"
