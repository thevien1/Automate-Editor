Add-Type -AssemblyName System.Drawing

$size = 256
$bmp = New-Object System.Drawing.Bitmap $size, $size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.Clear([System.Drawing.Color]::Transparent)

# Squircle background
$rect = New-Object System.Drawing.Rectangle 10, 10, 236, 236
$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$radius = 54
$diameter = $radius * 2

$path.AddArc($rect.X, $rect.Y, $diameter, $diameter, 180, 90)
$path.AddArc(($rect.Right - $diameter), $rect.Y, $diameter, $diameter, 270, 90)
$path.AddArc(($rect.Right - $diameter), ($rect.Bottom - $diameter), $diameter, $diameter, 0, 90)
$path.AddArc($rect.X, ($rect.Bottom - $diameter), $diameter, $diameter, 90, 90)
$path.CloseFigure()

$brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rect, ([System.Drawing.Color]::FromArgb(255, 0, 98, 255)), ([System.Drawing.Color]::FromArgb(255, 115, 35, 205)), 45
$g.FillPath($brush, $path)

# Subtle white border
$pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(90, 255, 255, 255)), 4
$g.DrawPath($pen, $path)

# Lightning Bolt Points
[System.Drawing.PointF[]]$pts = @(
    (New-Object System.Drawing.PointF 146, 36),
    (New-Object System.Drawing.PointF 72, 136),
    (New-Object System.Drawing.PointF 124, 136),
    (New-Object System.Drawing.PointF 106, 220),
    (New-Object System.Drawing.PointF 184, 116),
    (New-Object System.Drawing.PointF 132, 116),
    (New-Object System.Drawing.PointF 146, 36)
)

$boltPath = New-Object System.Drawing.Drawing2D.GraphicsPath
$boltPath.AddLines($pts)
$boltPath.CloseFigure()

$boltBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rect, ([System.Drawing.Color]::White), ([System.Drawing.Color]::FromArgb(255, 56, 189, 248)), 90
$g.FillPath($boltBrush, $boltPath)

$boltPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::White), 2
$g.DrawPath($boltPen, $boltPath)

# Glowing orbit dots
$cyanBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 0, 245, 255))
$purpleBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 192, 132, 252))
$g.FillEllipse($cyanBrush, 40, 56, 18, 18)
$g.FillEllipse($purpleBrush, 196, 178, 18, 18)
$g.FillEllipse($cyanBrush, 196, 56, 14, 14)
$g.FillEllipse($purpleBrush, 40, 178, 14, 14)

$publicDir = "D:\Phần mềm\GPMAutomateEditor\public"
if (!(Test-Path $publicDir)) { New-Item -ItemType Directory -Path $publicDir -Force }

$pngPath = Join-Path $publicDir "icon.png"
$icoPath = Join-Path $publicDir "icon.ico"

$bmp.Save($pngPath, [System.Drawing.Imaging.ImageFormat]::Png)

$hIcon = $bmp.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($hIcon)
$fs = New-Object System.IO.FileStream $icoPath, ([System.IO.FileMode]::Create)
$icon.Save($fs)
$fs.Close()

$g.Dispose()
$bmp.Dispose()
Write-Host "Success: Generated $pngPath and $icoPath"
