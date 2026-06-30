.PHONY: help build up down logs ps clean dev prod

help: ## Show this help message
	@echo "BookLore Docker Commands"
	@echo "========================"
	@grep -E '^[a-zA-Z_-]+:.*##' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*## "}; {printf "  make %-10s %s\n", $$1, $$2}'

build: ## Build all services
	docker-compose build

up: ## Start all services in production mode
	docker-compose up -d

down: ## Stop all services
	docker-compose down

logs: ## View logs from all services
	docker-compose logs -f

ps: ## Show running containers
	docker-compose ps

clean: ## Remove all containers and volumes
	docker-compose down -v --remove-orphans

dev: ## Start development mode with hot reload
	docker-compose -f docker-compose.dev.yml up -d

dev-down: ## Stop development mode
	docker-compose -f docker-compose.dev.yml down

dev-logs: ## View development logs
	docker-compose -f docker-compose.dev.yml logs -f

build-backend: ## Build only backend
	docker-compose build backend

build-frontend: ## Build only frontend
	docker-compose build frontend

restart-backend: ## Restart only backend
	docker-compose restart backend
