<?php 
/**
 * Maps files from their original name to their new name
 */

$paths = array(
#paths
);

function getCSSPath($origPath, $paths) {
	if (array_key_exists($origPath, $paths)){
		return $paths[$origPath];
	} 
	return $origPath;
}


?>