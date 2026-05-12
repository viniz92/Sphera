REGISTRY ?= seu-usuario
VERSION  ?= 1.0.0

BACKEND_IMAGE  = $(REGISTRY)/eks-dashboard-backend:$(VERSION)
FRONTEND_IMAGE = $(REGISTRY)/eks-dashboard-frontend:$(VERSION)

# ─── Build das imagens ────────────────────────────────────────────────────────

build:
	docker build -t $(BACKEND_IMAGE) ./backend
	docker build -f ./frontend/Dockerfile.prod -t $(FRONTEND_IMAGE) ./frontend

# ─── Push para registry ───────────────────────────────────────────────────────

push: build
	docker push $(BACKEND_IMAGE)
	docker push $(FRONTEND_IMAGE)

# ─── Helm ─────────────────────────────────────────────────────────────────────

helm-lint:
	helm lint ./helm/eks-dashboard

helm-template:
	helm template eks-dashboard ./helm/eks-dashboard

helm-install:
	helm upgrade --install eks-dashboard ./helm/eks-dashboard \
		--namespace eks-dashboard \
		--create-namespace \
		--set image.backend.repository=$(REGISTRY)/eks-dashboard-backend \
		--set image.backend.tag=$(VERSION) \
		--set image.frontend.repository=$(REGISTRY)/eks-dashboard-frontend \
		--set image.frontend.tag=$(VERSION)

helm-uninstall:
	helm uninstall eks-dashboard --namespace eks-dashboard

helm-package:
	helm package ./helm/eks-dashboard --destination ./helm/dist

# ─── Dev local ────────────────────────────────────────────────────────────────

dev:
	docker compose up --build

port-forward:
	kubectl port-forward svc/eks-dashboard 8080:80 -n eks-dashboard

logs-backend:
	kubectl logs -n eks-dashboard -l app.kubernetes.io/name=eks-dashboard -c backend --follow

logs-frontend:
	kubectl logs -n eks-dashboard -l app.kubernetes.io/name=eks-dashboard -c frontend --follow

.PHONY: build push helm-lint helm-template helm-install helm-uninstall helm-package dev port-forward logs-backend logs-frontend
