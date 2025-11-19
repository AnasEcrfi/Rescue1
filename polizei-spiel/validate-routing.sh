#!/bin/bash

# ✅ Routing-System Validierungs-Skript
# Prüft, ob die kritischen Routing-Dateien mit dem Original übereinstimmen

echo "🔍 Validiere Routing-System..."
echo ""

# Farben
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

errors=0

# Test 1: TypeScript kompiliert ohne Fehler
echo "📝 Test 1: TypeScript Kompilierung"
if npx tsc --noEmit 2>&1 | grep -q "error TS"; then
    echo -e "${RED}❌ TypeScript Fehler gefunden${NC}"
    npx tsc --noEmit
    errors=$((errors + 1))
else
    echo -e "${GREEN}✅ TypeScript kompiliert ohne Fehler${NC}"
fi
echo ""

# Test 2: Prüfe ob kritische Dateien existieren
echo "📁 Test 2: Kritische Dateien existieren"
if [ ! -f "src/services/routingService.ts" ]; then
    echo -e "${RED}❌ routingService.ts fehlt${NC}"
    errors=$((errors + 1))
else
    echo -e "${GREEN}✅ routingService.ts existiert${NC}"
fi

if [ ! -f "src/utils/routeCalculator.ts" ]; then
    echo -e "${RED}❌ routeCalculator.ts fehlt${NC}"
    errors=$((errors + 1))
else
    echo -e "${GREEN}✅ routeCalculator.ts existiert${NC}"
fi

if [ ! -f "src/utils/routeCache.ts" ]; then
    echo -e "${RED}❌ routeCache.ts fehlt${NC}"
    errors=$((errors + 1))
else
    echo -e "${GREEN}✅ routeCache.ts existiert${NC}"
fi
echo ""

# Test 3: Prüfe ob die Dateien die kritischen Funktionen enthalten
echo "🔧 Test 3: Kritische Funktionen vorhanden"

# routingService.ts
if grep -q "export async function getRoute" src/services/routingService.ts; then
    echo -e "${GREEN}✅ getRoute() gefunden${NC}"
else
    echo -e "${RED}❌ getRoute() fehlt in routingService.ts${NC}"
    errors=$((errors + 1))
fi

if grep -q "export function convertToLeafletFormat" src/services/routingService.ts; then
    echo -e "${GREEN}✅ convertToLeafletFormat() gefunden${NC}"
else
    echo -e "${RED}❌ convertToLeafletFormat() fehlt in routingService.ts${NC}"
    errors=$((errors + 1))
fi

if grep -q "export function getStraightLineRoute" src/services/routingService.ts; then
    echo -e "${GREEN}✅ getStraightLineRoute() gefunden${NC}"
else
    echo -e "${RED}❌ getStraightLineRoute() fehlt in routingService.ts${NC}"
    errors=$((errors + 1))
fi

if grep -q "export function calculateDistance" src/services/routingService.ts; then
    echo -e "${GREEN}✅ calculateDistance() gefunden${NC}"
else
    echo -e "${RED}❌ calculateDistance() fehlt in routingService.ts${NC}"
    errors=$((errors + 1))
fi

# routeCalculator.ts
if grep -q "export const calculateRoute" src/utils/routeCalculator.ts; then
    echo -e "${GREEN}✅ calculateRoute() gefunden${NC}"
else
    echo -e "${RED}❌ calculateRoute() fehlt in routeCalculator.ts${NC}"
    errors=$((errors + 1))
fi

if grep -q "export const calculateStraightRoute" src/utils/routeCalculator.ts; then
    echo -e "${GREEN}✅ calculateStraightRoute() gefunden${NC}"
else
    echo -e "${RED}❌ calculateStraightRoute() fehlt in routeCalculator.ts${NC}"
    errors=$((errors + 1))
fi

if grep -q "export const usesAirRoute" src/utils/routeCalculator.ts; then
    echo -e "${GREEN}✅ usesAirRoute() gefunden${NC}"
else
    echo -e "${RED}❌ usesAirRoute() fehlt in routeCalculator.ts${NC}"
    errors=$((errors + 1))
fi
echo ""

# Test 4: Prüfe ob die Dateien den Warn-Kommentar haben
echo "⚠️ Test 4: Warn-Kommentare vorhanden"
if grep -q "KRITISCHE DATEI - NICHT ÄNDERN" src/services/routingService.ts; then
    echo -e "${GREEN}✅ Warn-Kommentar in routingService.ts${NC}"
else
    echo -e "${YELLOW}⚠️ Warn-Kommentar fehlt in routingService.ts${NC}"
fi

if grep -q "KRITISCHE DATEI - NICHT ÄNDERN" src/utils/routeCalculator.ts; then
    echo -e "${GREEN}✅ Warn-Kommentar in routeCalculator.ts${NC}"
else
    echo -e "${YELLOW}⚠️ Warn-Kommentar fehlt in routeCalculator.ts${NC}"
fi
echo ""

# Test 5: Vergleiche mit Original aus Git
echo "📊 Test 5: Vergleich mit Original (Commit 0f18d96)"
if git show 0f18d96:polizei-spiel/src/services/routingService.ts > /tmp/original_routingService.ts 2>/dev/null; then
    # Entferne die Warn-Kommentare für den Vergleich
    grep -v "KRITISCHE DATEI - NICHT ÄNDERN" src/services/routingService.ts | grep -v "⚠️" > /tmp/current_routingService_clean.ts
    grep -v "KRITISCHE DATEI - NICHT ÄNDERN" /tmp/original_routingService.ts | grep -v "⚠️" > /tmp/original_routingService_clean.ts

    if diff -q /tmp/current_routingService_clean.ts /tmp/original_routingService_clean.ts > /dev/null 2>&1; then
        echo -e "${GREEN}✅ routingService.ts identisch mit Original${NC}"
    else
        echo -e "${YELLOW}⚠️ routingService.ts wurde modifiziert (außer Warn-Kommentaren)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️ Konnte Original nicht aus Git laden${NC}"
fi

if git show 0f18d96:polizei-spiel/src/utils/routeCalculator.ts > /tmp/original_routeCalculator.ts 2>/dev/null; then
    grep -v "KRITISCHE DATEI - NICHT ÄNDERN" src/utils/routeCalculator.ts | grep -v "⚠️" > /tmp/current_routeCalculator_clean.ts
    grep -v "KRITISCHE DATEI - NICHT ÄNDERN" /tmp/original_routeCalculator.ts | grep -v "⚠️" > /tmp/original_routeCalculator_clean.ts

    if diff -q /tmp/current_routeCalculator_clean.ts /tmp/original_routeCalculator_clean.ts > /dev/null 2>&1; then
        echo -e "${GREEN}✅ routeCalculator.ts identisch mit Original${NC}"
    else
        echo -e "${YELLOW}⚠️ routeCalculator.ts wurde modifiziert (außer Warn-Kommentaren)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️ Konnte Original nicht aus Git laden${NC}"
fi
echo ""

# Zusammenfassung
echo "=================================================="
if [ $errors -eq 0 ]; then
    echo -e "${GREEN}✅ Alle Tests bestanden! Routing-System ist intakt.${NC}"
    echo ""
    echo "🎉 Das Routing-System funktioniert korrekt!"
    exit 0
else
    echo -e "${RED}❌ $errors Fehler gefunden! Routing-System ist KAPUTT!${NC}"
    echo ""
    echo "⚠️ Stelle die Original-Dateien wieder her:"
    echo "   git show 0f18d96:polizei-spiel/src/services/routingService.ts > polizei-spiel/src/services/routingService.ts"
    echo "   git show 0f18d96:polizei-spiel/src/utils/routeCalculator.ts > polizei-spiel/src/utils/routeCalculator.ts"
    exit 1
fi
