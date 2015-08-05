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
};


module.exports = function(grunt) {

  grunt.registerTask('revcss', 'Revisions css and updates the references to it', function() {
    var options = this.options();

    // [todo] - Refactor these to use grunt options
    var buildDir = options.buildDir,
      inputDir = path.join(buildDir, './css');


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

      // [todo] - Allow multiple regexes to be evaluated in this loop
      while(matches = matchRegex.exec(fileSrc)) {
        //[0] is the original string, [1] is the capture group
        //Match is the name without buildDir
        var match = matches[1],
          oldName = path.join(buildDir, match);



        /* Hack: Since some paths are relative to the current (css) we check if
         the path is relative and if so we guess which folder it's relative to and replace
         it with a path relative to root.
         To fix this properly we'd need to know where this file is located,
         but this method doesn't have access to that info */

        //If the string begins with "../../"
        if (match.substr(0, 6) === '../../'){
          //Change change the relative path to a absolute path
          oldName = match.replace('../../', buildDir + '/css/');
        }


        //Similar to above, this is a hack for
        //import url("something.css");
        // [todo] - add a universal method to resolve paths
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

      return lines.join(',\n');
    };

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
    });

    //Hardcoding the reading of a few key files until I rewrite this to use grunt's files system
    //but iterating over the templates directory is probably the best way to do this going forward
    // [todo] - Figure out a better way to integrate these files into the build process
    var files = ['./templates/default/header.tmpl', './templates/default/madetoorder.html'];


    var transformedHTML = files.map(function(filePath){
      return fs.readFileSync(filePath, 'utf8');
    }).map(function(fileSrc){
      return replaceRefFn(fileSrc, revisioned, hrefRegex);
    });

    //Write the files back to disk
    for (var i = 0, leng = files.length; i < leng; i++){
      console.log('writing to %s', files[i]);
      fs.writeFileSync(path.join(buildDir, files[i]), transformedHTML[i]);
    }


  })
}