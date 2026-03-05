$dll = "C:\Users\User\.nuget\packages\realtime-csharp\6.0.4\lib\netstandard2.0\realtime-csharp.dll"
[Reflection.Assembly]::LoadFrom($dll) | Out-Null
$types = [AppDomain]::CurrentDomain.GetAssemblies() | Select-Many GetTypes | Where Namespace -like "*Realtime*"
Write-Host "--- RealtimeChannel Events ---"
$types | Where Name -eq "RealtimeChannel" | Select-Many GetEvents | Select Name
Write-Host "--- RealtimeChannel Methods ---"
$types | Where Name -eq "RealtimeChannel" | Select-Many GetMethods | Where Name -like "*Postgres*" | Select Name, @{N = "Params"; E = { $_.GetParameters().Name -join "," } }
