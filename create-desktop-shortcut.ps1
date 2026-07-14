$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSCommandPath
$targetPath = Join-Path $projectRoot "start-dev.bat"

if (-not (Test-Path -LiteralPath $targetPath -PathType Leaf)) {
  throw "未找到启动脚本：$targetPath"
}

$desktopPath = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktopPath "开始写作.lnk"

$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $targetPath
$shortcut.WorkingDirectory = $projectRoot
$shortcut.IconLocation = "$env:SystemRoot\System32\shell32.dll,220"
$shortcut.Description = "启动本地写作空间并打开开始写作页面"
$shortcut.Save()

Write-Host ("快捷方式创建成功：{0}" -f $shortcutPath) -ForegroundColor Green
