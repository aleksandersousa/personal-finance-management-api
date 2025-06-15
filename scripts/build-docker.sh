#!/bin/bash

# Script para build Docker otimizado
# Uso: ./scripts/build-docker.sh [tag] [platform]

set -e

# Configurações
TAG=${1:-"personal-financial-management-api:latest"}
PLATFORM=${2:-"linux/amd64,linux/arm64"}
DOCKERFILE=".docker/Dockerfile.prod"

echo "🏗️ Building Docker image..."
echo "📦 Tag: $TAG"
echo "🏛️ Platform: $PLATFORM"
echo "📄 Dockerfile: $DOCKERFILE"

# Verifica se o Docker Buildx está disponível
if ! docker buildx version > /dev/null 2>&1; then
    echo "❌ Docker Buildx não está disponível"
    exit 1
fi

# Cria builder se não existir
if ! docker buildx inspect multiarch-builder > /dev/null 2>&1; then
    echo "🔧 Criando builder multi-arquitetura..."
    docker buildx create --name multiarch-builder --use
fi

# Função para build com retry
build_with_retry() {
    local max_attempts=3
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        echo "🔄 Tentativa $attempt de $max_attempts..."
        
        if docker buildx build \
            --platform "$PLATFORM" \
            --tag "$TAG" \
            --file "$DOCKERFILE" \
            --cache-from type=local,src=/tmp/.buildx-cache \
            --cache-to type=local,dest=/tmp/.buildx-cache-new,mode=max \
            --load \
            .; then
            echo "✅ Build concluído com sucesso!"
            
            # Move cache
            rm -rf /tmp/.buildx-cache
            mv /tmp/.buildx-cache-new /tmp/.buildx-cache
            return 0
        else
            echo "❌ Build falhou na tentativa $attempt"
            attempt=$((attempt + 1))
            
            if [ $attempt -le $max_attempts ]; then
                echo "⏳ Aguardando 30 segundos antes da próxima tentativa..."
                sleep 30
            fi
        fi
    done
    
    echo "❌ Build falhou após $max_attempts tentativas"
    return 1
}

# Função para build separado por arquitetura
build_separate_architectures() {
    echo "🔄 Tentando build separado por arquitetura..."
    
    # Build AMD64
    echo "🏗️ Building AMD64..."
    docker buildx build \
        --platform linux/amd64 \
        --tag "${TAG}-amd64" \
        --file "$DOCKERFILE" \
        --cache-from type=local,src=/tmp/.buildx-cache \
        --cache-to type=local,dest=/tmp/.buildx-cache-new,mode=max \
        --load \
        .
    
    # Build ARM64 (apenas se solicitado)
    if [[ "$PLATFORM" == *"arm64"* ]]; then
        echo "🏗️ Building ARM64..."
        docker buildx build \
            --platform linux/arm64 \
            --tag "${TAG}-arm64" \
            --file "$DOCKERFILE" \
            --cache-from type=local,src=/tmp/.buildx-cache \
            --cache-to type=local,dest=/tmp/.buildx-cache-new,mode=max \
            --load \
            .
        
        # Criar manifest multi-arch
        echo "🔗 Criando manifest multi-arquitetura..."
        docker buildx imagetools create \
            --tag "$TAG" \
            "${TAG}-amd64" \
            "${TAG}-arm64"
    fi
    
    # Move cache
    rm -rf /tmp/.buildx-cache
    mv /tmp/.buildx-cache-new /tmp/.buildx-cache
}

# Executa build principal
if ! build_with_retry; then
    echo "🔄 Build multi-arquitetura falhou, tentando build separado..."
    build_separate_architectures
fi

echo "🎉 Build Docker concluído!"
echo "🏷️ Tag: $TAG"

# Mostra informações da imagem
echo "📊 Informações da imagem:"
docker images "$TAG" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}" 