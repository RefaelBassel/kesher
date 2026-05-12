# Interactive .env.local writer with UTF-8 (no BOM) encoding.
# Run with: .\setup-env.ps1

Write-Host ""
Write-Host "Kesher .env.local setup" -ForegroundColor Cyan
Write-Host "=======================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Find these values at: https://supabase.com/dashboard -> kesher -> Settings -> API Keys"
Write-Host ""

$url = Read-Host "1. Project URL (https://...supabase.co)"
$anon = Read-Host "2. Publishable key (sb_publishable_...)"
$service = Read-Host "3. Secret key (sb_secret_...)"

if (-not $url -or -not $anon -or -not $service) {
    Write-Host ""
    Write-Host "ERROR: All three values are required" -ForegroundColor Red
    exit 1
}

$content = @"
# Supabase
NEXT_PUBLIC_SUPABASE_URL=$url
NEXT_PUBLIC_SUPABASE_ANON_KEY=$anon
SUPABASE_SERVICE_ROLE_KEY=$service

# Gemini
GOOGLE_GEMINI_API_KEY=

# Groq fallback
GROQ_API_KEY=

# ScrapingBee (for production scraping of anti-bot sites)
SCRAPINGBEE_API_KEY=

# Resend
RESEND_API_KEY=
RESEND_FROM_EMAIL=onboarding@resend.dev

# Push (VAPID)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:refaelbassel@gmail.com

# Admin
ADMIN_EMAILS=refaelbassel@gmail.com
CRON_SECRET=devsecret-change-in-production
NEXT_PUBLIC_APP_URL=http://localhost:3000
"@

[System.IO.File]::WriteAllText("$PWD\.env.local", $content, [System.Text.UTF8Encoding]::new($false))

Write-Host ""
Write-Host "SUCCESS! .env.local written with UTF-8 (no BOM)" -ForegroundColor Green
Write-Host ""
Write-Host "Verification:"

$check = [System.IO.File]::ReadAllText("$PWD\.env.local")
if ($check -match "NEXT_PUBLIC_SUPABASE_URL=(\S+)") {
    $detectedUrl = $matches[1]
    Write-Host "  URL detected: $detectedUrl" -ForegroundColor Green
}
if ($check -match "NEXT_PUBLIC_SUPABASE_ANON_KEY=(\S+)") {
    $anonStart = $matches[1].Substring(0, [Math]::Min(20, $matches[1].Length))
    Write-Host "  Anon key:     $anonStart..." -ForegroundColor Green
}
if ($check -match "SUPABASE_SERVICE_ROLE_KEY=(\S+)") {
    $serviceStart = $matches[1].Substring(0, [Math]::Min(20, $matches[1].Length))
    Write-Host "  Service key:  $serviceStart..." -ForegroundColor Green
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Stop the dev server with Ctrl+C if running"
Write-Host "  2. Run: npx next dev --turbopack"
Write-Host "  3. Refresh the browser"
Write-Host ""
