$dll = "C:\Users\User\OneDrive\Desktop\nexus-vercel\Impro\dll\netstandard2.0\PortalAPI.dll"
$asm = [Reflection.Assembly]::LoadFrom($dll)
Write-Host "--- master properties ---"
$m = $asm.GetTypes() | Where-Object Name -eq 'master'
$m.GetProperties() | ForEach-Object { Write-Host ('prop: ' + $_.PropertyType.Name + ' ' + $_.Name) }
Write-Host "--- tag properties ---"
$t = $asm.GetTypes() | Where-Object Name -eq 'tag'
$t.GetProperties() | ForEach-Object { Write-Host ('prop: ' + $_.PropertyType.Name + ' ' + $_.Name) }
