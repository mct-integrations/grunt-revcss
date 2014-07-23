<?php 
/**
 * Maps files from their original name to their new name
 */

$paths = array(
#paths
);

function getCSSPath($origPath, $paths) {
	if (in_array($origPath, $paths)){
		return $paths[$origPath];
	} 
	return $origPath;
}


?>