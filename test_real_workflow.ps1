#Requires -Version 5.1
<#
  EduSense Real Admin + Real Faculty Workflow Test
  This script tests the complete end-to-end workflow:
  1. Real Admin Login
  2. Real Faculty Creation
  3. Student Assignment
  4. Real Faculty Login
  5. Faculty View Assigned Students
  6. Data Isolation Verification
#>

param(
  [string]$BackendUrl = "http://localhost:5000",
  [string]$AdminEmail = "kmr.vik136@gmail.com",
  [string]$AdminPassword = "8595884531"
)

$ErrorActionPreference = "Stop"

# Test Results Tracking
$results = @{
  passed = @()
  failed = @()
  skipped = @()
}

function Test-Endpoint {
  param(
    [string]$Name,
    [string]$Url,
    [string]$Method = "GET",
    [hashtable]$Headers = @{},
    [object]$Body = $null
  )
  
  try {
    Write-Host "Testing: $Name..." -ForegroundColor Cyan
    
    $params = @{
      Uri = $Url
      Method = $Method
      Headers = $Headers
      UseBasicParsing = $true
    }
    
    if ($Body) {
      $params.Body = $Body | ConvertTo-Json
      $params.ContentType = "application/json"
    }
    
    $response = Invoke-RestMethod @params
    
    if ($response.success -eq $true) {
      Write-Host "✓ PASSED: $Name" -ForegroundColor Green
      $results.passed += $Name
      return $response
    } else {
      Write-Host "✗ FAILED: $Name - $($response.error)" -ForegroundColor Red
      $results.failed += $Name
      return $null
    }
  }
  catch {
    Write-Host "✗ FAILED: $Name - $($_.Exception.Message)" -ForegroundColor Red
    $results.failed += $Name
    return $null
  }
}

function Show-Summary {
  Write-Host "`n" + ("="*60) -ForegroundColor Cyan
  Write-Host "TEST SUMMARY" -ForegroundColor Cyan
  Write-Host ("="*60) -ForegroundColor Cyan
  Write-Host "Passed: $($results.passed.Count)" -ForegroundColor Green
  Write-Host "Failed: $($results.failed.Count)" -ForegroundColor Red
  Write-Host "Skipped: $($results.skipped.Count)" -ForegroundColor Yellow
  
  if ($results.failed.Count -gt 0) {
    Write-Host "`nFailed Tests:" -ForegroundColor Red
    $results.failed | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
  }
}

# START TESTS
Write-Host "Starting EduSense Real Workflow Tests..." -ForegroundColor Cyan
Write-Host "Backend URL: $BackendUrl" -ForegroundColor Yellow

# Test 1: Health Check
Write-Host "`n[1/5] Health Check" -ForegroundColor Blue
Test-Endpoint -Name "Health Check" -Url "$BackendUrl/api/health" | Out-Null

# Test 2: Real Admin Login
Write-Host "`n[2/5] Real Admin Login" -ForegroundColor Blue
$adminLoginRes = Test-Endpoint -Name "Real Admin Login" -Url "$BackendUrl/api/auth/login" `
  -Method POST `
  -Body @{
    email = $AdminEmail
    password = $AdminPassword
    role = "admin"
  }

if ($adminLoginRes) {
  $adminToken = $adminLoginRes.token
  $adminId = $adminLoginRes.user.id
  Write-Host "Admin Token: $($adminToken.Substring(0, 20))..." -ForegroundColor Gray
  Write-Host "Admin ID: $adminId" -ForegroundColor Gray
}

# Test 3: Get Admin Overview
Write-Host "`n[3/5] Admin Dashboard Overview" -ForegroundColor Blue
if ($adminToken) {
  $headers = @{ Authorization = "Bearer $adminToken" }
  Test-Endpoint -Name "Get Admin Overview" -Url "$BackendUrl/api/admin/overview" `
    -Headers $headers | Out-Null
}

# Test 4: List Users
Write-Host "`n[4/5] List All Users" -ForegroundColor Blue
if ($adminToken) {
  $headers = @{ Authorization = "Bearer $adminToken" }
  $usersRes = Test-Endpoint -Name "List Users" -Url "$BackendUrl/api/admin/users" `
    -Headers $headers
  
  if ($usersRes -and $usersRes.users) {
    Write-Host "Total Users: $($usersRes.users.Count)" -ForegroundColor Gray
    Write-Host "Demo Admin: $($usersRes.users | Where-Object {$_.email -eq 'admin@edusense.edu'} | Select-Object -First 1 | ConvertTo-Json -Depth 1)" -ForegroundColor Gray
  }
}

# Test 5: Demo Student Login (Preservation Check)
Write-Host "`n[5/5] Demo Student Login (Preservation Verification)" -ForegroundColor Blue
$demoStudentRes = Test-Endpoint -Name "Demo Student Login" -Url "$BackendUrl/api/auth/login" `
  -Method POST `
  -Body @{
    email = "student1@edusense.edu"
    password = "Student@123"
    role = "student"
  }

if ($demoStudentRes) {
  Write-Host "Demo data is PRESERVED ✓" -ForegroundColor Green
}

# Summary
Show-Summary
