param([int]$Port=5187)
$ErrorActionPreference='Stop'
$root=[IO.Path]::GetFullPath((Join-Path (Split-Path -Parent $PSScriptRoot) 'dist'))
$listener=New-Object Net.HttpListener
$listener.Prefixes.Add("http://127.0.0.1:$Port/")
$listener.Start()
$types=@{'.html'='text/html; charset=utf-8';'.js'='text/javascript; charset=utf-8';'.css'='text/css; charset=utf-8';'.png'='image/png';'.woff2'='font/woff2';'.woff'='font/woff';'.json'='application/json';'.ico'='image/x-icon'}
try {
    while($listener.IsListening){
        $ctx=$listener.GetContext()
        try {
            if($ctx.Request.HttpMethod -notin @('GET','HEAD')){$ctx.Response.StatusCode=405;continue}
            $relative=[Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath).TrimStart('/')
            if(!$relative){$relative='index.html'}
            $path=[IO.Path]::GetFullPath((Join-Path $root $relative))
            if(!$path.StartsWith($root+[IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)){$ctx.Response.StatusCode=403;continue}
            if(!(Test-Path -LiteralPath $path -PathType Leaf)){$ctx.Response.StatusCode=404;continue}
            $ctx.Response.ContentType=$types[[IO.Path]::GetExtension($path)]
            $ctx.Response.Headers.Add('Cache-Control','no-cache')
            $bytes=[IO.File]::ReadAllBytes($path)
            $ctx.Response.ContentLength64=$bytes.Length
            if($ctx.Request.HttpMethod -eq 'GET'){$ctx.Response.OutputStream.Write($bytes,0,$bytes.Length)}
        } catch { try{$ctx.Response.StatusCode=500}catch{} } finally {$ctx.Response.Close()}
    }
} finally {$listener.Stop();$listener.Close()}
