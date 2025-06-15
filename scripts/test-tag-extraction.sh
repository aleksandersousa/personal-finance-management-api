#!/bin/bash

# Script para testar extração de tags
# Simula o comportamento do GitHub Actions

echo "🧪 Testando extração de tags..."

# Simula output multi-linha do docker/metadata-action
MULTI_LINE_TAGS="ghcr.io/aleksandersousa/personal-financial-management-api:develop
ghcr.io/aleksandersousa/personal-financial-management-api:develop-718b68f"

echo "📋 Tags originais (multi-linha):"
echo "$MULTI_LINE_TAGS"
echo ""

# Extrai primeira tag (simula o que fazemos no workflow)
PRIMARY_TAG=$(echo "$MULTI_LINE_TAGS" | head -n1)

echo "🏷️ Tag primária extraída:"
echo "$PRIMARY_TAG"
echo ""

# Testa se é válida para variável de ambiente
echo "✅ Testando formato para GITHUB_ENV:"
if echo "IMAGE_TAG=$PRIMARY_TAG" | grep -q '^[A-Z_][A-Z0-9_]*='; then
    echo "✅ Formato válido para variável de ambiente"
else
    echo "❌ Formato inválido para variável de ambiente"
fi

# Testa caracteres especiais
echo ""
echo "🔍 Análise de caracteres:"
echo "Contém espaços: $(echo "$PRIMARY_TAG" | grep -q ' ' && echo 'SIM' || echo 'NÃO')"
echo "Contém quebras de linha: $(echo "$PRIMARY_TAG" | grep -q $'\n' && echo 'SIM' || echo 'NÃO')"
echo "Comprimento: $(echo -n "$PRIMARY_TAG" | wc -c) caracteres"

# Simula uso em deploy
echo ""
echo "🚀 Simulando uso em deploy:"
echo "IMAGE_TAG=$PRIMARY_TAG"
echo "Comando Docker: docker pull $PRIMARY_TAG"

echo ""
echo "✅ Teste concluído!" 