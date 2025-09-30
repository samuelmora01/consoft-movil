#!/bin/bash

# Script para probar el endpoint de SignUp
# Uso: ./test-signup.sh [local|dev|prod]

# Configuración
ENVIRONMENT=${1:-local}

if [ "$ENVIRONMENT" = "local" ]; then
    BASE_URL="http://localhost:3000"
elif [ "$ENVIRONMENT" = "dev" ]; then
    BASE_URL="https://api.mlholdingdev.com/oauth"
elif [ "$ENVIRONMENT" = "prod" ]; then
    BASE_URL="https://api.mlholdingprod.com/oauth"
else
    echo "Uso: $0 [local|dev|prod]"
    exit 1
fi

echo "🚀 Probando SignUp endpoint en ambiente: $ENVIRONMENT"
echo "📍 Base URL: $BASE_URL"
echo ""

# Función para hacer llamadas con curl
test_endpoint() {
    local test_name="$1"
    local json_file="$2"
    local expected_status="$3"
    
    echo "🧪 Prueba: $test_name"
    echo "📄 Archivo: $json_file"
    
    response=$(curl -s -w "\n%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -H "x-app-version: 1.0.0" \
        -H "x-platform: test" \
        -H "x-geo-location: CO" \
        -d @"$json_file" \
        "$BASE_URL/signup")
    
    body=$(echo "$response" | head -n -1)
    status_code=$(echo "$response" | tail -n 1)
    
    echo "📊 Status Code: $status_code"
    echo "📋 Response:"
    echo "$body" | jq . 2>/dev/null || echo "$body"
    
    if [ "$status_code" = "$expected_status" ]; then
        echo "✅ Resultado esperado"
    else
        echo "❌ Resultado inesperado (esperado: $expected_status)"
    fi
    
    echo ""
    echo "----------------------------------------"
    echo ""
}

# Verificar si jq está instalado
if ! command -v jq &> /dev/null; then
    echo "⚠️  jq no está instalado. Las respuestas JSON no se formatearán."
    echo ""
fi

# Primero, seed de UserTypes (solo en local)
if [ "$ENVIRONMENT" = "local" ]; then
    echo "🌱 Creando datos de prueba (UserTypes)..."
    seed_response=$(curl -s -w "\n%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        "$BASE_URL/bootstrap/seed-user-types")
    
    seed_body=$(echo "$seed_response" | head -n -1)
    seed_status=$(echo "$seed_response" | tail -n 1)
    
    echo "📊 Seed Status: $seed_status"
    echo "📋 Seed Response:"
    echo "$seed_body" | jq . 2>/dev/null || echo "$seed_body"
    echo ""
    echo "----------------------------------------"
    echo ""
fi

# Casos de éxito
echo "🎯 CASOS DE ÉXITO"
echo ""

test_endpoint "Owner Signup (con tokens)" \
    "signup-requests/owner-signup.json" \
    "200"

test_endpoint "Prospect Signup (con tokens)" \
    "signup-requests/prospect-signup.json" \
    "200"

test_endpoint "Independent Agent Signup (sin tokens)" \
    "signup-requests/independent-agent-signup.json" \
    "200"

test_endpoint "Real Estate Signup (sin tokens)" \
    "signup-requests/real-estate-signup.json" \
    "200"

# Casos de error
echo "❌ CASOS DE ERROR"
echo ""

test_endpoint "Email faltante" \
    "signup-requests/error-cases/missing-email.json" \
    "400"

test_endpoint "Email inválido" \
    "signup-requests/error-cases/invalid-email.json" \
    "400"

test_endpoint "Documento faltante" \
    "signup-requests/error-cases/missing-document.json" \
    "400"

# Probar duplicados (solo si es la segunda ejecución)
echo "🔄 CASOS DE DUPLICADOS"
echo ""

test_endpoint "Email duplicado (Owner)" \
    "signup-requests/owner-signup.json" \
    "400"

echo "🏁 Pruebas completadas para ambiente: $ENVIRONMENT"
echo ""
echo "💡 Notas:"
echo "  - Los casos de duplicados solo fallarán en la segunda ejecución"
echo "  - Para ambiente local, asegúrate de tener SAM ejecutándose: sam local start-api"
echo "  - Para dev/prod, actualiza las URLs en este script"
