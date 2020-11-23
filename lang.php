<?php

function rglob($pattern, $flags = 0) {
    $files = glob($pattern, $flags); 
    foreach (glob(dirname($pattern).'/*', GLOB_ONLYDIR|GLOB_NOSORT) as $dir) {
        $files = array_merge($files, rglob($dir.'/'.basename($pattern), $flags));
    }
    return $files;
}

$files = rglob('*.tsx');
$reg = '$(?:text|placeHolder)="([^"]+?)"$';
$f = fopen('out.txt', 'w');

foreach ($files as $path) {
	$content = file($path);
	$out = '';
	$n = 0;
	for ($i = 0; $i < count($content); ++$i) {
		$s = trim($content[$i]);
		if (!$s) {
			continue;
		};
		if (!preg_match($reg, $s, $m)) {
			continue;
		};

		$out .= $i . ': ' . $m[1] . "\t\t" . $s . "\n";
	};
	if ($out) {
		print "\n" . $path . "\n\n";
		print $out;

		fwrite($f, "\n" . $path . "\n\n");
		fwrite($f, $out);
	};
};

fclose($f);

?>