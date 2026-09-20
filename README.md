# Healthcare Platform

A full-stack healthcare management platform built with a React frontend and a Node.js microservices backend.

## Live Demo

- https://healthcare-project-six.vercel.app

## Project Overview

This repository contains:

- A React + Vite client app
- A microservices backend (Express services)
- API Gateway for routing and cross-service orchestration
- Kubernetes manifests for AKS deployment
- PowerShell scripts for local and cloud deployments

## Architecture

### Frontend

- Location: `client/`
- Stack: React, Vite, React Router, Axios, Tailwind CSS, Stripe, Google OAuth
- Notification library: `react-hot-toast`

### Backend (Microservices)

- `auth-service` (3009)
- `patient-service` (3001)
- `doctor-service` (3002)
- `admin-service` (3003)
- `appointment-service` (3004)
- `notification-service` (3005)
- `telemedicine-service` (3006)
- `ai-service` (3007)
- `payment-service` (3008)
- `api-gateway` (3000)

### Infrastructure

- Docker / Docker Compose for local containerized backend
- Kubernetes manifests in `k8s/`
- Azure Kubernetes Service (AKS) deployment scripts in `scripts/`

## Repository Structure

```text
client/               React frontend
services/             Backend microservices
k8s/                  Kubernetes manifests
scripts/              Deployment and image-push scripts
docker-compose.yml    Local backend orchestration
```

## Local Development

### 1) Prerequisites

- Node.js 18+
- npm 9+
- Docker Desktop
- PowerShell (for deployment scripts)

### 2) Install frontend dependencies

```powershell
cd client
npm install
```

### 3) Run frontend

```powershell
npm run dev
```

By default, Vite runs at `http://localhost:5173`.

### 4) Run backend with Docker Compose

From repository root:

```powershell
docker compose up --build
```

The API Gateway is exposed at:

- `http://localhost:3010`

## Kubernetes Deployment

### Option A: Deploy local images to local Kubernetes

From repository root:

```powershell
./scripts/deploy-k8s-local.ps1 -Namespace healthcare -Tag local
```

### Option B: Deploy to AKS using registry images

```powershell
./scripts/deploy-k8s.ps1 -Namespace healthcare -Registry shewongunarathne -Tag v1
```

Useful commands:

```powershell
kubectl -n healthcare get pods
kubectl -n healthcare get svc
kubectl -n healthcare get ingress
kubectl -n healthcare logs deploy/api-gateway --tail=100
```

## Environment and Configuration

- Service-specific environment variables live in each service folder as `.env` files.
- Kubernetes shared runtime config is in `k8s/configmap.yaml`.
- Current frontend URL configured for backend CORS is:
  - `https://healthcare-project-six.vercel.app`

## Key Features

- Role-based flows for patients, doctors, and admins
- Appointment booking and management
- Telemedicine sessions (doctor/patient join flow)
- Reports management (including edit and file replacement)
- Payment and refund workflow
- Google OAuth login support

## Notes

- If you update Kubernetes images, make sure tags in deployment scripts match pushed image tags.
- For frontend production on Vercel, verify `client/vercel.json` rewrites and environment variables before deployment.
