var FileModel           = require('app/fileUpload/models/FileModel');
var fileGetScreen       = require('app/fileUpload/models/FileModel').fileGetScreen;
var formidable = require('formidable');
var crypto = require('crypto');
var fs   = require('fs-extra');
var config = require('app/config');

var log = require('app/modules/logger');
var rate = require('app/modules/rate');

var postFilesLimiter = rate(10, 20);
function postFiles(req, res, next) {
    var form = new formidable.IncomingForm();
    var file = new FileModel({
    });

    form.parse(req, function(err, fields, files) {
      file = new FileModel({
          name: files['file'].name,
          type: req.query.type,
          uniqueId: crypto.randomBytes(20).toString('hex'),
          mimeType: files['file'].type,
          size: files['file'].size
      });

      file.validateFile(function(err, path) {
          if(err.length !== 0) {
              res.json({errors:err});
          }
      });
    });

    var path = config.app.fileUpload.tmpPath;

    form.on('end', function(fields, files) {
      var temp_path = this.openedFiles[0].path;
      var file_name = this.openedFiles[0].name;
      var newLocation = path;
      
      var i = file.name.lastIndexOf('.');
      var ext =  (i < 0) ? '' : file.name.substr(i);

      file.filename = file.uniqueId+ext;
      fs.copy(temp_path, newLocation + file.filename, function(err) {  
          if (err) {
              next(err);
          } else {
              // delete older than 5 minutes
              var now = new Date();
              now.setMinutes(now.getMinutes() - 5);
              FileModel.find({created: {$lt : now} }, function(err, files) {
                  files.forEach(function(file) {
                  fs.remove(newLocation + file.filename, function(err){
                    if (!err) {
                      file.remove(function(err, file) {
                      });                  
                    }
                  });
                  });
                  console.log(files);
              });

              file.save(function (err) {
                    if (!err) {
                        res.status(201).json({file: fileGetScreen(file)});
                    } else {
                        if(err.name == 'ValidationError') {
                            res.statusCode = 400;
                            res.send(err);
                        }             
                    }
                });
          }
      });
    });

    return;
}


function setup(app) {
    app.namespace('/api/v1', function(){
        app.post('/files', postFilesLimiter, postFiles);
    });
}

module.exports = setup;
