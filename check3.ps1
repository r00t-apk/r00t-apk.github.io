$html = Get-Content 'C:\Users\devkp\Downloads\spotify-auth\Untitled-1.html' -Raw
$start = $html.IndexOf('<script>') + 8
$end = $html.LastIndexOf('</script')
$js = $html.Substring($start, $end - $start)
$lines = $js -split "`r?`n"
Write-Host "JS has $($lines.Count) lines"
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match '</') {
        Write-Host "CONTAINS '</' at line $($i+1): $($lines[$i].Trim())"
    }
}
