/*
 * grunt-revcss
 * https://github.com/edude03/grunt-revcss
 *
 * Copyright (c) 2014 Michael Francis
 * Licensed under the MIT license.
 */

'use strict';

var path = require('path'),
    util = require('util'),
    fs = require('fs-extra');

//CSS Import Regex matches import 
var cssRegex = RegExp(/\s?import\s+url\("(.*)"\)/gi);
//Href regex - capture anything where there is [space]href="(somevalue)"
var hrefRegex = RegExp(/\s+href="([^"<?]*\.css)"/gi);
var buildDir = '../build-tmp',
    inputDir = path.join(buildDir, './css');

/**
 * Function to pull out all of an objects values
 */
Object.values = function(obj){
  var vals = [];
  for (var prop in obj){
    if (obj.hasOwnProperty(prop)){
      vals.push(obj[prop]);
    }
  }
  return vals;
}

/**
 * Looks for items to replace in the file source
 * using the match regex, replaces the match with it's
 * new value from the replacements list and returns the
 * updated file source
 * @param  {String} fileSrc      [description]
 * @param  {Object} replacements [description]
 * @param  {RexExp} matchRegex   [description]
 * @return {String}              [description]
 */
var replaceRefFn = function replaceRef(fileSrc, replacements, matchRegex){
  var matches;
  while(matches = matchRegex.exec(fileSrc)) {
    //[0] is the original string, [1] is the capture group 
    //Match is the name without buildDir
    var match = matches[1],
        oldName = path.join(buildDir, match);

    //Hack: Since some paths are relative to the current (css)
    //folder, if we don't find css in the resulting path to the file
    //we'll add it to the path 
    //To fix this properly we'd need to know where this file is located,
    //but this method doesn't have access to that info
    if (path.dirname(oldName).indexOf('css') === -1){
      oldName = path.join(buildDir, 'css', match);
    }
      
    //If the replacements list has this file
    if (typeof replacements[oldName] !== 'undefined') {
      //We need a copy of the name without the buildDir 
      //IE ../build-tmp/css/file.css -> /css/file.css
      var cleanName = replacements[oldName].replace(buildDir, '');


      //Perform the replacement
      fileSrc = fileSrc.replace(match, cleanName, 'g');
      console.log('Replacing %s with %s', match, cleanName);
    }
  }
  return fileSrc;
}

/**
 * Converts a javascript object into a
 * PHP array
 * @param  {Object} paths Object like {path: path}
 * @return {String}       Formatted as a PHP array
 */
var buildPHPArray = function(paths){
  var lines = [];
    for(var p in paths){
      lines.push(util.format('\t"%s" => "%s"', p.replace(buildDir, ''), paths[p].replace(buildDir, '')));
    }

  return lines.join('\n');
}

module.exports = function(grunt) {

  grunt.registerTask('revcss', 'Revisions css and updates the references to it', function() {
    //Register this as an async task
    var done = this.async();
    
    //Files that have been revisioned
    var revisioned = grunt.filerev.summary,
        revisionedPaths = Object.values(revisioned);


    var transformedFiles = revisionedPaths.map(function(filePath){
      //Read in the file
      return fs.readFileSync(filePath, 'utf8');
    }).map(function(fileSrc){
      //Perform the replacement
      return replaceRefFn(fileSrc, revisioned, cssRegex);
    });
        
    //Write the files back to disk
    for(var i = 0, leng = revisionedPaths.length; i < leng; i++){
      console.log('writing to %s', revisionedPaths[i]);
      fs.writeFileSync(revisionedPaths[i], transformedFiles[i]);
    }

    //Write the PHP build map file
    var modPath = "./node_modules/grunt-revcss";
    fs.readFile(path.join(modPath, 'cssmaptemplate.php'), 'utf8', function(err, tmpl){
      tmpl = tmpl.replace('#paths', buildPHPArray(revisioned));
      fs.writeFile(path.join(buildDir, 'cssmap.php'), tmpl, done);
    })

    //Hardcoding the reading of a few key files until I rewrite this to use grunt's files system
    //but iterating over the templates directory is probably the best way to do this going forward
    var files = ['./templates/default/header.tmpl', './templates/default/madetoorder.html'];


    var transformedHTML = files.map(function(filePath){
        return fs.readFileSync(filePath, 'utf8');
    }).map(function(fileSrc){
        return replaceRefFn(fileSrc, revisioned, hrefRegex);
    })

    //Write the files back to disk
    for (var i = 0, leng = files.length; i < leng; i++){
      console.log('writing to %s', files[i]);
      fs.writeFileSync(files[i], transformedHTML[i]);
    }


  })
}