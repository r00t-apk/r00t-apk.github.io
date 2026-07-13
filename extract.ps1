$html = Get-Content 'C:\Users\devkp\Downloads\spotify-auth\Untitled-1.html' -Raw
$pattern = '<script>([\s\S]*?)</script>'
$matches = [regex]::Matches($html, $pattern)
foreach ($m in $matches) {
    $js = $m.Groups[1].Value
    if ($js.Length -gt 100) {
        [System.IO.File]::WriteAllText('C:\Users\devkp\Downloads\spotify-auth\test.js', $js)
        Write-Host "JS length: $($js.Length)"
    }
}
