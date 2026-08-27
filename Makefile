# =============================================================================
# Anytype-ts Makefile
# =============================================================================
# Kullanım:
#   make build    — bağımlılıkları yükle + UI derle → dist/
#   make install  — build + kurulu Anytype'a kopyala
#   make copy     — Sadece kopyala (build atlanır)
#   make dev      — Geliştirme sunucusunu başlat
#   make clean    — dist/ temizle
# =============================================================================

.PHONY: build install copy dev clean deps help _ensure-bun

# Sentinel dosyası: node_modules en son install ne zaman çalıştı
NODE_MODULES_STAMP := node_modules/.install-stamp

# dist/ çıktısının var olup olmadığını kontrol et
DIST_INDEX := dist/js

BUN_BIN := $(shell command -v bun 2>/dev/null || echo $$HOME/.bun/bin/bun)

# ─── Bun kurulumu ─────────────────────────────────────────────────────────────
_ensure-bun:
	@if ! command -v bun >/dev/null 2>&1 && [ ! -x "$(BUN_BIN)" ]; then \
		echo "\033[1m\033[33m▶ bun bulunamadı, kuruluyor...\033[0m"; \
		curl -fsSL https://bun.sh/install | bash; \
		echo "\033[32m✅ bun kuruldu.\033[0m"; \
	fi

# ─── Bağımlılık kurulumu ──────────────────────────────────────────────────────
# package.json değiştiyse veya node_modules yoksa otomatik çalışır
$(NODE_MODULES_STAMP): package.json | _ensure-bun
	@echo "\033[1m\033[33m▶ Bağımlılıklar kuruluyor (bun install)...\033[0m"
	PATH="$$HOME/.bun/bin:$$PATH" $(BUN_BIN) install
	@touch $(NODE_MODULES_STAMP)
	@echo "\033[32m✅ Bağımlılıklar kuruldu.\033[0m"


## deps: Bağımlılıkları kur (npm/bun install)
deps: $(NODE_MODULES_STAMP)

## build: Bağımlılıkları kur + UI'ı derle → dist/
build: $(NODE_MODULES_STAMP)
	@echo "\033[1m\033[36m▶ UI derleniyor (bun run build)...\033[0m"
	PATH="$$HOME/.bun/bin:$$PATH" $(BUN_BIN) run build
	@echo "\033[32m✅ Derleme tamamlandı → dist/\033[0m"

## install: UI'ı derle ve kurulu Anytype'a kopyala
install: build
	@echo "\033[1m\033[36m▶ Kurulu Anytype'a kopyalanıyor...\033[0m"
	go run scripts/deploy.go --no-build
	@echo "\033[32m✅ Kurulum tamamlandı. Anytype'ı yeniden başlatın.\033[0m"

## copy: Sadece kopyala (önceden build yapılmış olmalı)
copy:
	@if [ ! -d "$(DIST_INDEX)" ]; then \
		echo "\033[31m❌ dist/ bulunamadı. Önce 'make build' çalıştırın.\033[0m"; \
		exit 1; \
	fi
	@echo "\033[1m\033[36m▶ Kopyalanıyor (build atlanıyor)...\033[0m"
	go run scripts/deploy.go --no-build
	@echo "\033[32m✅ Kopyalama tamamlandı. Anytype'ı yeniden başlatın.\033[0m"

## dev: Geliştirme sunucusunu başlat
dev: $(NODE_MODULES_STAMP)
	@echo "\033[1m\033[36m▶ Geliştirme sunucusu başlatılıyor...\033[0m"
	PATH="$$HOME/.bun/bin:$$PATH" $(BUN_BIN) run dev



## clean: dist/ ve bağımlılık damgasını temizle
clean:
	@echo "\033[33m▶ dist/ temizleniyor...\033[0m"
	rm -rf dist/css dist/js dist/assets dist/workers
	@echo "\033[32m✅ Temizlendi.\033[0m"

## help: Bu yardım metnini göster
help:
	@echo ""
	@echo "\033[1mAnytype-ts Makefile Komutları:\033[0m"
	@echo ""
	@grep -E '^## ' Makefile | sed 's/## //' | awk -F: '{printf "  \033[36mmake %-12s\033[0m %s\n", $$1, $$2}'
	@echo ""

.DEFAULT_GOAL := help
