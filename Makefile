.PHONY: help build up down restart logs dev

help:
	@echo "Frontend buyruqlari:"
	@echo ""
	@echo "  Docker (production):"
	@echo "  build    - Docker image yaratish (API URL .env dan o'qiladi)"
	@echo "  up       - Konteynerlarni ishga tushirish (3008 port)"
	@echo "  down     - Konteynerlarni to'xtatish"
	@echo "  restart  - Nginx va frontendni qayta yuklash"
	@echo "  logs     - Loglarni kuzatish"
	@echo ""
	@echo "  Mahalliy:"
	@echo "  dev      - npm run dev (ishlab chiqish rejimi)"
	@echo ""
	@echo "  Eslatma: API URL o'zgarganda 'make build' kerak!"

build:
	docker compose build mendeleyev_frontend

up:
	docker compose up -d

down:
	docker compose down

restart:
	docker compose restart

logs:
	docker compose logs -f --tail=200

dev:
	npm run dev
