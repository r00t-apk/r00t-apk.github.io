$text = [System.IO.File]::ReadAllText('C:\Users\devkp\Downloads\spotify-auth\Untitled-1.html', [System.Text.Encoding]::UTF8)
$start = $text.IndexOf('<script>') + 8
$end = $text.LastIndexOf('</script')
$js = $text.Substring($start, $end - $start)
# Write a test HTML that loads the script and catches errors
$testHtml = @"
<!DOCTYPE html>
<html>
<head><script>
window.onerror = function(msg, url, line, col, err) {
  document.title = 'ERROR:' + line + ':' + msg;
  document.body.innerHTML = '<pre>ERROR at line ' + line + ': ' + msg + '\n' + (err && err.stack ? err.stack : '') + '</pre>';
};
</script></head>
<body>
<script>
try {
$js
document.title = 'OK';
document.body.innerHTML = '<h1>Script loaded OK</h1>';
} catch(e) {
  document.title = 'CATCH:' + e.message;
  document.body.innerHTML = '<pre>CATCH: ' + e.message + '\n' + e.stack + '</pre>';
}
</script>
</body>
</html>
"@
[System.IO.File]::WriteAllText('C:\Users\devkp\Downloads\spotify-auth\test-syntax.html', $testHtml, [System.Text.Encoding]::UTF8)
Write-Host "Created test-syntax.html"
