$js = [System.IO.File]::ReadAllText('C:\Users\devkp\Downloads\spotify-auth\test.js')
$b = 0; $p = 0; $s = 0
foreach($c in $js.ToCharArray()) {
    if($c -eq '{'){$b++}
    if($c -eq '}'){$b--}
    if($c -eq '('){$p++}
    if($c -eq ')'){$p--}
    if($c -eq '['){$s++}
    if($c -eq ']'){$s--}
}
Write-Host "Braces: $b  Parens: $p  Brackets: $s"
