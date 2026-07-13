$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add('http://127.0.0.1:8000/')
$listener.Start()
Write-Host "Server running at http://127.0.0.1:8000/"
$baseDir = $PSScriptRoot

while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $path = $ctx.Request.Url.LocalPath
    if ($path -eq '/') { $path = '/Untitled-1.html' }
    $file = Join-Path $baseDir ($path.TrimStart('/'))
    if (Test-Path $file) {
        $bytes = [IO.File]::ReadAllBytes($file)
        $ctx.Response.ContentType = 'text/html'
        $ctx.Response.ContentLength64 = $bytes.Length
        $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
        $ctx.Response.StatusCode = 404
    }
    $ctx.Response.Close()
}
