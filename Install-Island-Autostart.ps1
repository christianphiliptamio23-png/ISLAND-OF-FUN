$ErrorActionPreference = 'Stop'
$startup = [Environment]::GetFolderPath('Startup')
$shortcutPath = Join-Path $startup 'Island of Fun Server.lnk'
$launcher = Join-Path $PSScriptRoot 'Start-Island.ps1'
$powershell = (Get-Command powershell.exe -ErrorAction Stop).Source
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $powershell
$shortcut.Arguments = '-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "' + $launcher + '" -NoBrowser'
$shortcut.WorkingDirectory = $PSScriptRoot
$shortcut.WindowStyle = 7
$shortcut.Description = 'Start the local Island of Fun server when signing in.'
$shortcut.Save()
Write-Output "Installed startup shortcut: $shortcutPath"
