$bytes = [System.IO.File]::ReadAllBytes('C:\Users\devkp\Downloads\spotify-auth\Untitled-1.html')
$bom = $bytes[0..2]
Write-Host "BOM: $([System.BitConverter]::ToString($bom))"
Write-Host "File size: $($bytes.Length) bytes"

# Try to check for BOM or encoding issues
$text = [System.IO.File]::ReadAllText('C:\Users\devkp\Downloads\spotify-auth\Untitled-1.html', [System.Text.Encoding]::UTF8)
Write-Host "File length (chars): $($text.Length)"

# Check if there are any null bytes that might indicate encoding problems
$nullCount = 0
for ($i = 0; $i -lt [Math]::Min(100, $bytes.Length); $i++) {
    if ($bytes[$i] -eq 0) { $nullCount++ }
}
Write-Host "Null bytes in first 100 bytes: $nullCount"

# Now check the actual JS part for issues
$start = $text.IndexOf('<script>') + 8
$end = $text.LastIndexOf('</script')
$js = $text.Substring($start, $end - $start)

# Check for any characters that look like </script (which would break the parser)
$scriptCloseIdx = $js.IndexOf('</script')
if ($scriptCloseIdx -ge 0) {
    Write-Host "FOUND '</script' inside JS at offset $scriptCloseIdx!"
    $lineNum = ($js.Substring(0, $scriptCloseIdx) -split "`n").Count
    Write-Host "At JS line: $lineNum"
    Write-Host "Context: $($js.Substring([Math]::Max(0,$scriptCloseIdx-30), [Math]::Min(60, $js.Length-$scriptCloseIdx+30)))"
} else {
    Write-Host "No '</script' found inside JS - OK"
}

# Check for any backtick issues (unclosed template literals)
$backtickCount = 0
$inBacktick = $false
$lines = $js -split "`n"
for ($i = 0; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]
    $count = ([regex]::Matches($line, '`')).Count
    if ($count % 2 -ne 0) {
        Write-Host "ODD backtick count at JS line $($i+1): $($line.Substring(0, [Math]::Min(80, $line.Length)))"
    }
}
