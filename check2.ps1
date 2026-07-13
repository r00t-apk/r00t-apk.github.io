$c = Get-Content 'C:\Users\devkp\Downloads\spotify-auth\Untitled-1.html' -Raw
$positions = @()
$idx = 0
while (($idx = $c.IndexOf('</script', $idx)) -ge 0) {
  $lineNum = ($c.Substring(0, $idx) -split "`n").Count
  $positions += "Pos $idx, Line $lineNum"
  $idx++
}
Write-Host "Found $($positions.Count) </script tags:"
foreach ($p in $positions) { Write-Host "  $p" }

# Also check for any template literal issues (backticks in non-template-literal contexts)
$lines = $c -split "`n"
for ($i = 0; $i -lt $lines.Count; $i++) {
  $line = $lines[$i]
  if ($line -match '^\s*<script') { $inScript = $true; $scriptStart = $i; continue }
  if ($line -match '^\s*</script') { $inScript = $false; continue }
}
