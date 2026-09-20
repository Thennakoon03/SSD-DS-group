# Kubernetes Deployment Guide

This folder contains Kubernetes manifests for the backend services.

## Services included

- auth-service (3009)
- patient-service (3001)
- doctor-service (3002)
- admin-service (3003)
- appointment-service (3004)
- notification-service (3005)
- telemedicine-service (3006)
- ai-service (3007)
- payment-service (3008)
- api-gateway (3000)

## Prerequisites

- Docker installed and logged in (`docker login`)
- Kubernetes cluster reachable via `kubectl`
- NGINX ingress controller installed if you plan to use `ingress.yaml`

## 1) Update placeholders

- Edit `configmap.yaml` and set `FRONTEND_URL` to your real frontend URL.
- Edit `ingress.yaml` and set host `api.your-domain.com` to your API domain.

## 2) Build and push images

From repository root:

```powershell
./scripts/push-backend-images.ps1 -Registry shewongunarathne -Tag v1
```

## 3) Deploy to Kubernetes

From repository root:

```powershell
./scripts/deploy-k8s.ps1 -Namespace healthcare -Registry shewongunarathne -Tag v1
```

This script will:

- create namespace
- create/update secrets from service `.env` files
- apply configmap, deployments, services, ingress
- set deployment images to your registry/tag
- wait for rollout

## Useful commands

```powershell
kubectl -n healthcare get pods
kubectl -n healthcare get svc
kubectl -n healthcare get ingress
kubectl -n healthcare logs deploy/api-gateway --tail=100
```

## Local test without ingress

```powershell
kubectl -n healthcare port-forward svc/api-gateway 3010:3000
```

Then call:

- `http://localhost:3010/`

## Notes

- Secrets are created from each service `.env` using `kubectl create secret ... --dry-run=client -o yaml | kubectl apply -f -`.
- If your cluster cannot pull public Docker Hub images, create an image pull secret and patch service accounts.
