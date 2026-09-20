param(
  [string]$Namespace = "healthcare",
  [string]$Tag = "local",
  [switch]$SkipBuild,
  [switch]$SkipSecrets
)

$ErrorActionPreference = "Stop"

$services = @(
  @{ Name = "auth-service"; Path = "services/auth-service"; EnvFile = "services/auth-service/.env" },
  @{ Name = "patient-service"; Path = "services/patient-service"; EnvFile = "services/patient-service/.env" },
  @{ Name = "doctor-service"; Path = "services/doctor-service"; EnvFile = "services/doctor-service/.env" },
  @{ Name = "admin-service"; Path = "services/admin-service"; EnvFile = "services/admin-service/.env" },
  @{ Name = "notification-service"; Path = "services/notification-service"; EnvFile = "services/notification-service/.env" },
  @{ Name = "appointment-service"; Path = "services/appointment-service"; EnvFile = "services/appointment-service/.env" },
  @{ Name = "telemedicine-service"; Path = "services/telemedicine-service"; EnvFile = "services/telemedicine-service/.env" },
  @{ Name = "ai-service"; Path = "services/ai-service"; EnvFile = "services/ai-service/.env" },
  @{ Name = "payment-service"; Path = "services/payment-service"; EnvFile = "services/payment-service/.env" },
  @{ Name = "api-gateway"; Path = "services/api-gateway"; EnvFile = "services/api-gateway/.env" }
)

if (-not $SkipBuild) {
  foreach ($svc in $services) {
    $image = "$($svc.Name):$Tag"
    Write-Host "Building local image $image from $($svc.Path)..." -ForegroundColor Cyan
    docker build -t $image $svc.Path
  }
}

kubectl apply -f k8s/namespace.yaml

if (-not $SkipSecrets) {
  foreach ($svc in $services) {
    if (-not (Test-Path $svc.EnvFile)) {
      throw "Missing env file: $($svc.EnvFile)"
    }

    $secretName = "$($svc.Name)-env"
    Write-Host "Applying secret $secretName from $($svc.EnvFile)..." -ForegroundColor Yellow
    kubectl -n $Namespace create secret generic $secretName --from-env-file=$($svc.EnvFile) --dry-run=client -o yaml | kubectl apply -f -
  }
}

kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/backend-workloads.yaml
kubectl apply -f k8s/ingress.yaml

foreach ($svc in $services) {
  $image = "$($svc.Name):$Tag"
  Write-Host "Setting image for $($svc.Name) => $image" -ForegroundColor Yellow
  $imageArg = "$($svc.Name)=$image"
  kubectl -n $Namespace set image "deployment/$($svc.Name)" $imageArg
}

foreach ($svc in $services) {
  Write-Host "Waiting for rollout: $($svc.Name)" -ForegroundColor Cyan
  kubectl -n $Namespace rollout status "deployment/$($svc.Name)" --timeout=240s
}

Write-Host "Local Kubernetes deployment complete." -ForegroundColor Green
kubectl -n $Namespace get pods
kubectl -n $Namespace get svc
