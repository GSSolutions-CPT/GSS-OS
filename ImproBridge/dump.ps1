$p = 'C:\Users\User\OneDrive\Desktop\nexus-vercel\Impro\dll\netstandard2.0\PortalAPI.dll'
$a = [Reflection.Assembly]::LoadFrom($p)

Write-Host "--- PortalAPI login methods ---"
$t = $a.GetTypes() | Where-Object Name -eq 'PortalAPI'
$t.GetMethods() | Where-Object Name -eq 'login' | ForEach-Object { Write-Host ($_.Name + '(' + (($_.GetParameters() | ForEach-Object { $_.ParameterType.Name + ' ' + $_.Name }) -join ', ') + ')') }

Write-Host "--- master properties ---"
$m = $a.GetTypes() | Where-Object Name -eq 'master'
$m.GetProperties() | ForEach-Object { Write-Host ('prop: ' + $_.PropertyType.Name + ' ' + $_.Name) }
Write-Host "--- master fields ---"
$m.GetFields() | ForEach-Object { Write-Host ('field: ' + $_.FieldType.Name + ' ' + $_.Name) }

Write-Host "--- tag properties ---"
$tg = $a.GetTypes() | Where-Object Name -eq 'tag'
$tg.GetProperties() | ForEach-Object { Write-Host ('prop: ' + $_.PropertyType.Name + ' ' + $_.Name) }
Write-Host "--- tag fields ---"
$tg.GetFields() | ForEach-Object { Write-Host ('field: ' + $_.FieldType.Name + ' ' + $_.Name) }
