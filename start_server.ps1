# Local Web Server for previewing the UAV Nadir InSAR academic website
param(
    [int]$Port = 8080
)

$webRoot = $PSScriptRoot
if (-not $webRoot) { $webRoot = Get-Location }

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")

try {
    $listener.Start()
    Write-Host "=======================================================" -ForegroundColor Cyan
    Write-Host " UAV Nadir InSAR Website Preview Server Running" -ForegroundColor Green
    Write-Host " URL: http://localhost:$Port/" -ForegroundColor Yellow
    Write-Host " Serving from: $webRoot" -ForegroundColor White
    Write-Host " Press Ctrl+C in this console to stop the server." -ForegroundColor Gray
    Write-Host "=======================================================" -ForegroundColor Cyan

    Start-Process "http://localhost:$Port/"

    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $req = $context.Request
        $res = $context.Response

        $localPath = $req.Url.LocalPath.TrimStart('/')
        if ([string]::IsNullOrEmpty($localPath)) { $localPath = "index.html" }
        $filePath = Join-Path $webRoot ($localPath.Replace('/', '\'))

        if (Test-Path $filePath -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $res.StatusCode = 200
            $res.ContentLength64 = $bytes.Length

            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            switch ($ext) {
                ".html" { $res.ContentType = "text/html; charset=utf-8" }
                ".css"  { $res.ContentType = "text/css" }
                ".js"   { $res.ContentType = "application/javascript" }
                ".png"  { $res.ContentType = "image/png" }
                ".jpg"  { $res.ContentType = "image/jpeg" }
                ".svg"  { $res.ContentType = "image/svg+xml" }
                ".mp4"  { $res.ContentType = "video/mp4" }
                ".pdf"  { $res.ContentType = "application/pdf" }
                default { $res.ContentType = "application/octet-stream" }
            }

            if ($req.HttpMethod -ne "HEAD") {
                $res.OutputStream.Write($bytes, 0, $bytes.Length)
            }
        } else {
            $res.StatusCode = 404
            $notFound = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $res.OutputStream.Write($notFound, 0, $notFound.Length)
        }
        $res.OutputStream.Close()
    }
} finally {
    $listener.Stop()
    $listener.Close()
}
