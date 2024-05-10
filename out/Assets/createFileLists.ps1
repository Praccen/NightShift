Write-Host "Textures"
$fileNames = (Get-ChildItem ./textures).Name
if ($fileNames)  {
    Set-Content -Path ./textures/textures.txt -Value $fileNames
    Write-Host $fileNames
}

Write-Host "Objs"
$fileNames = (Get-ChildItem ./objs).Name
if ($fileNames)  {
    Set-Content -Path ./objs/objs.txt -Value $fileNames
    Write-Host $fileNames
}