param(
  [string]$Registry = "shewongunarathne",
  [string]$Tag = "v1"
)

$ErrorActionPreference = "Stop"

$services = @(
  @{ Name = "auth-service"; Path = "services/auth-service" },
  @{ Name = "patient-service"; Path = "services/patient-service" },
  @{ Name = "doctor-service"; Path = "services/doctor-service" },
  @{ Name = "admin-service"; Path = "services/admin-service" },
  @{ Name = "notification-service"; Path = "services/notification-service" },
  @{ Name = "appointment-service"; Path = "services/appointment-service" },
  @{ Name = "telemedicine-service"; Path = "services/telemedicine-service" },
  @{ Name = "ai-service"; Path = "services/ai-service" },
  @{ Name = "payment-service"; Path = "services/payment-service" },
  @{ Name = "api-gateway"; Path = "services/api-gateway" }
)

foreach ($svc in $services) {
  $image = "$Registry/$($svc.Name):$Tag"
  Write-Host "Building $image from $($svc.Path)..." -ForegroundColor Cyan
  docker build -t $image $svc.Path

  Write-Host "Pushing $image..." -ForegroundColor Cyan
  docker push $image
}

Write-Host "All images built and pushed successfully." -ForegroundColor Green
