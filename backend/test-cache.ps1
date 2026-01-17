# Test cache headers
Write-Host "`n=== Testing Cache Functionality ===`n" -ForegroundColor Cyan

# First call - should be MISS
Write-Host "Test 1: First call to /api/products (should be MISS)" -ForegroundColor Yellow
$response1 = Invoke-WebRequest -Uri 'http://localhost:5000/api/products' -UseBasicParsing
$cacheHeader1 = $response1.Headers['X-Cache']
Write-Host "X-Cache: $cacheHeader1" -ForegroundColor $(if ($cacheHeader1 -eq 'MISS') { 'Green' } else { 'Red' })

Start-Sleep -Seconds 1

# Second call - should be HIT
Write-Host "`nTest 2: Second call to /api/products (should be HIT)" -ForegroundColor Yellow
$response2 = Invoke-WebRequest -Uri 'http://localhost:5000/api/products' -UseBasicParsing
$cacheHeader2 = $response2.Headers['X-Cache']
Write-Host "X-Cache: $cacheHeader2" -ForegroundColor $(if ($cacheHeader2 -eq 'HIT') { 'Green' } else { 'Red' })

# Compression test
Write-Host "`nTest 3: Compression (should be gzip)" -ForegroundColor Yellow
$response3 = Invoke-WebRequest -Uri 'http://localhost:5000/api/products' -Headers @{'Accept-Encoding'='gzip'} -UseBasicParsing
$encoding = $response3.Headers['Content-Encoding']
Write-Host "Content-Encoding: $encoding" -ForegroundColor $(if ($encoding -eq 'gzip') { 'Green' } else { 'Red' })

Write-Host "`n=== Summary ===`n" -ForegroundColor Cyan
if ($cacheHeader1 -eq 'MISS' -and $cacheHeader2 -eq 'HIT' -and $encoding -eq 'gzip') {
    Write-Host "✅ All tests PASSED!" -ForegroundColor Green
} else {
    Write-Host "❌ Some tests FAILED" -ForegroundColor Red
}
