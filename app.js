var express = require('express');
var path = require('path');
var router = express.Router();
var Cookies = require('cookies');
var fs = require('fs');
var fse = require('fs-extra');
var mkdirp = require('mkdirp');
var recursiveReadSync = require('recursive-readdir-sync'),
    files;
var app = express();
var klaw = require('klaw');
var klawSync = require('klaw-sync')
var through2 = require('through2');
var os = require('os');



app.set('view engine', 'ejs');

app.use('/', router);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function (req, res) {
    res.render('index.html');
})



app.get('/createproject', function (req, res) {
    res.render('createproject.html');
})


router.get('/createfolder', function (req, res) {
    var f1 = "abc/" + req.query.f1;
    var cookies = new Cookies(req, res, {});
    cookies.set('folderpath', f1, {})
    mkdirp(f1, function (err) {
        if (err) console.error(err)
        else console.log('Directory Created')
    });
    res.render(__dirname + '/public/createfolder.ejs');
});

router.get('/mergingout', function (req, res) {
    var sourcepath = "abc/" + req.query.sourcepath;
    var targetpath = "C:"+"\\checkout\\" + req.query.targetpath;

    console.log('sourcepath',sourcepath.split('\\')[1]);
    console.log('targetpath',targetpath.split('\\')[2]);

    const sourcefiles = klawSync(sourcepath, {
        nodir: true
    })
    let spaths = [];
    sourcefiles.forEach(function (elem) {
        spaths.push(elem.path);
    })

    const targetfiles = klawSync(targetpath, {
        nodir: true
    })
    let tpaths = [];
    targetfiles.forEach(function (elem) {
        tpaths.push(elem.path);
    })


    console.log('spaths', spaths);
    console.log('tpaths', tpaths);


    var matchedfolders = [];
    for (var i = 0; i < spaths.length; i++) {
        for (var j = 0; j < tpaths.length; j++) {
            if (spaths[i].split('\\')[spaths[i].split('\\').length - 1] == tpaths[j].split('\\')[tpaths[j].split('\\').length - 1]) {
                console.log('do nothing');
                break;
            } else {
                if (spaths[i].split('\\')[spaths[i].split('\\').length - 2] == tpaths[j].split('\\')[tpaths[j].split('\\').length - 2]) {
                    console.log('folder names matched');
                    matchedfolders.push(spaths[i]);
                    matchedfolders.push(tpaths[j]);
                    break;
                } else {
                    console.log('folder names do not match');
                    continue;
                }
            }
        }
    }

    console.log('matched folder names:', matchedfolders);

    

    function splitSlice(str, len) {
        str = str.split('\\').splice(0, str.split('\\').length - len).join("\\");
        return str;
    }

    function difference(first, second) {
        for (var i=0; i<second.length; i++) {
            var index = undefined;
            while ((index = first.indexOf(second[i])) !== -1) {
                first.splice(index, 1);
            }
        }
        return first;
    }

    spaths = difference(spaths, matchedfolders);
    console.log('spaths',spaths);
    tpaths = difference(tpaths, matchedfolders);
    console.log('tpaths',tpaths);

    
    for(let i = 0 ;i < spaths.length;i++){
        let sdata = (fs.readFileSync(spaths[i],'utf8'));
        console.log('sdata',sdata);
        spathfilename = spaths[i].split('\\')[spaths[i].split('\\').length-2];
        console.log('adasd',splitSlice(tpaths[i],2)+spathfilename);
        fs.writeFileSync(splitSlice(tpaths[i],2)+'\\'+spathfilename, JSON.stringify(sdata));
    }
    

    for (var i = 0; i < matchedfolders.length; i = i + 2) {

        let sourcedata = (fs.readFileSync(matchedfolders[i],'utf-8'))
        
        console.log('sourcedata',sourcedata);
        
        matchedfolders[i] = splitSlice(matchedfolders[i],2) + matchedfolders[i].split('\\')[matchedfolders[i].split('\\').length - 2].replace('.txt', '').concat('-mr.txt');
            
        let targetdata = (fs.readFileSync(matchedfolders[i+1],'utf-8'))
            
        console.log('targetdata',targetdata);

        let destinationFileName = matchedfolders[i+1].split('\\')[matchedfolders[i+1].split('\\').length - 2];
        
        let destinationFilePath = splitSlice(matchedfolders[i+1],1)
        console.log(destinationFilePath + " ++++++++++++++ ")
        fse.removeSync(destinationFilePath);
        
        destinationFilePath = splitSlice(destinationFilePath,1);


        let sourceFileName = destinationFilePath + '\\' +destinationFileName.split('.')[0] + '_MR.txt';
        let targetFileName = destinationFilePath + '\\' +destinationFileName.split('.')[0] + '_MT.txt';
        
        console.log('sourcefilename***************',sourceFileName);

        console.log('targetfilename****************',targetFileName);
        
        fs.writeFileSync(sourceFileName, JSON.stringify(sourcedata));  
        fs.writeFileSync(targetFileName, JSON.stringify(targetdata));
        
        console.log('targetpath',matchedfolders[i+1])
    }
    res.render(__dirname + '/public/mergedout.ejs');
});


router.get('/mergedout',function(req,res){
    res.render(__dirname + '/public/mergedout.ejs');
})



router.get('/createfile', function (req, res) {
    var manifestPath = "abc/" + "manifest.txt";
    var filename = req.query.filename;
    var contents = req.query.content;
    var cookies = new Cookies(req, res, {});
    var cookiecontents = cookies.set('Contents', contents);
    var filecookies = new Cookies(req, res, {});
    cookies.set('filename', filename, {})
    var filepath = cookies.get('folderpath') + filename;
    cookies.set('filepath', filepath);
    console.log(filepath);
    mkdirp(filepath, function (err) {
        if (err) console.error(err)
        else console.log('File Path Created ' + filepath);
    });
    var weights = [1, 7, 3, 7, 11];
    var checkSum = 0;
    var j = 0;
    var modulus = Math.pow(2, 31) - 1;
    for (var i = 0; i < contents.length; i++) {
        j = j % weights.length;
        checkSum += weights[j++] * contents.charCodeAt(i);
    }
    checkSum = checkSum % modulus;
    console.log(checkSum);
    var artifact_id = checkSum + '-' + 'L' + contents.length + '.' + "txt";
    cookies.set('artifact_id', artifact_id);
    console.log(artifact_id);
    var finalPath = filepath + "/" + artifact_id;
    cookies.set('finalPath', finalPath);

    fs.writeFile(finalPath, contents, function (err, data) {
        if (err) {
            console.log(err);
        } else {
            console.log("file created in final Path created " + finalPath);
        }
    });

    function getDateTime() {

        var date = new Date();

        var hour = date.getHours();
        hour = (hour < 10 ? "0" : "") + hour;

        var min = date.getMinutes();
        min = (min < 10 ? "0" : "") + min;

        var sec = date.getSeconds();
        sec = (sec < 10 ? "0" : "") + sec;

        var year = date.getFullYear();

        var month = date.getMonth() + 1;
        month = (month < 10 ? "0" : "") + month;

        var day = date.getDate();
        day = (day < 10 ? "0" : "") + day;

        return year + ":" + month + ":" + day + " " + hour + ":" + min + ":" + sec;

    }
    var manifestContents = "Command: " + " createrepo" + "Date and Time: " + getDateTime() + " Relative Path: " + filepath + os.EOL;

    fs.writeFile(manifestPath, manifestContents, {
        flag: 'a+'
    }, function (err, data) {
        if (err) {
            console.log(err);
        } else {
            console.log("MANIFEST FILE CREATED");

        }

    });

    res.render(__dirname + '/public/createfile.ejs');
});



app.get('/viewfiles', function (req, res) {


    var cookies = new Cookies(req, res, {});
    var filename = cookies.get('filename');
    var filepath = cookies.get('folderpath') + filename;
    var finalPath = cookies.get('finalPath');

    try {
        files = recursiveReadSync('abc');
    } catch (err) {
        if (err.errno === 34) {
            console.log('Path does not exist');
        } else {
            //something unrelated went wrong, rethrow
            throw err;
        }
    }

    //   console.log('Files array:', files);

    res.render(__dirname+'/public/viewfiles.ejs',{
        files:files
    });

});



app.get('/mergeout', function (req, res) {


    var cookies = new Cookies(req, res, {});
    var filename = cookies.get('filename');
    var filepath = cookies.get('folderpath') + filename;
    var finalPath = cookies.get('finalPath');

    try {
        files = recursiveReadSync('abc');
    } catch (err) {
        if (err.errno === 34) {
            console.log('Path does not exist');
        } else {
            //something unrelated went wrong, rethrow
            throw err;
        }
    }

    //   console.log('Files array:', files);
    console.log(files);

    res.render(__dirname + '/public/mergeout.ejs', {
        files: files
    });

});


app.get('/fedit', function (req, res) {
    var path = req.query.path;
    path = path.substring(1, path.length - 1);
    console.log(path);
    console.log('you are IN FEDIT ', path);
    fs.readFile(path, function read(err, buf) {
        res.render(__dirname + '/public/fedit.ejs', {
            path: path,
            data: buf
        });


    });
});

app.get('/checkout', function (req, res) {
    var oldpath = req.query.path;
    var newpath = oldpath.replace(/'/g, '');
    var cookies = new Cookies(req, res, {});
    console.log('oldpath', oldpath.replace(/'/g, ''));
    console.log('newpath', newpath);
    var checkoutpath = "C:/" + newpath.replace('abc', 'checkout');
    var checkoutpatharray = checkoutpath.split('\\');
    console.log('checkoutpath', checkoutpath.substring(0, checkoutpath.lastIndexOf("\\")));

    mkdirp(checkoutpath.substring(0, checkoutpath.lastIndexOf("\\")) + '/', function (err) {
        if (err) console.log(err);
        else {
            console.log('Checkout Directory Created');
            copyFile(oldpath.replace(/'/g, ''), checkoutpath);
        }
    })


    function copyFile(src, dest) {
        let readStream = fs.createReadStream(src);

        readStream.once('error', (err) => {
            console.log(err);
        });

        readStream.once('end', () => {
            console.log('done copying, checkout done');
        });

        readStream.pipe(fs.createWriteStream(dest));
    }

    // fse.copy(oldpath.replace(/'/g,''), checkoutpath, function (err) {
    //     if (err) {
    //       console.error(err);
    //     } else {
    //       console.log("successfully checked in");
    //     }
    //   });
    // checkoutpath = "C:/checkout\\1\\2\\3\\abc.txt"
    // console.log(checkoutpath.split('\\')[checkoutpath.split('\\').indexOf('C:/checkout')+1]);

    var manifestPath = "abc/" + "manifest-checkout-" + checkoutpath.split('\\')[checkoutpath.split('\\').indexOf('C:/checkout') + 1];
    // checkoutpath.split('\\').slice(checkoutpath.split('\\').length-3,checkoutpath.split('\\').length-2)
    console.log(manifestPath);

    function getDateTime() {

        var date = new Date();

        var hour = date.getHours();
        hour = (hour < 10 ? "0" : "") + hour;

        var min = date.getMinutes();
        min = (min < 10 ? "0" : "") + min;

        var sec = date.getSeconds();
        sec = (sec < 10 ? "0" : "") + sec;

        var year = date.getFullYear();

        var month = date.getMonth() + 1;
        month = (month < 10 ? "0" : "") + month;

        var day = date.getDate();
        day = (day < 10 ? "0" : "") + day;

        return year + ":" + month + ":" + day + " " + hour + ":" + min + ":" + sec;

    }
    var manifestContents = "Command: " + "checkout " + "Date and Time: " + getDateTime() + " Checkoutpath: " + checkoutpath + os.EOL;

    fs.writeFile(manifestPath, manifestContents, function (err, data) {
        if (err) {
            console.log(err);
        } else {
            console.log("CHECKOUT MANIFEST FILE CREATED");

        }

    });


    res.render(__dirname + '/public/checkout.ejs');


});

app.get('/fcheckinedit', function (req, res) {
    var path = req.query.path;
    var cookies = new Cookies(req, res, {});
    var contents;
    var items = [] // files, directories, symlinks, etc

    var checkinPath = req.query.checkinPath;
    console.log(checkinPath);
    var repoPath = "abc/";
    fse.copy(checkinPath, repoPath, function (err) {
        if (err) {
            console.error(err);
        } else {
            console.log("successfully checked in");
        }
    });

    var manifestPath = "abc/" + "manifest-checkin-" + checkinPath.split('\\')[checkinPath.split('\\').indexOf('checkout') + 1];
    // console.log(checkinPath.split('\\') );
    function getDateTime() {

        var date = new Date();

        var hour = date.getHours();
        hour = (hour < 10 ? "0" : "") + hour;

        var min = date.getMinutes();
        min = (min < 10 ? "0" : "") + min;

        var sec = date.getSeconds();
        sec = (sec < 10 ? "0" : "") + sec;

        var year = date.getFullYear();

        var month = date.getMonth() + 1;
        month = (month < 10 ? "0" : "") + month;

        var day = date.getDate();
        day = (day < 10 ? "0" : "") + day;

        return year + ":" + month + ":" + day + " " + hour + ":" + min + ":" + sec;

    }

    var manifestContents = "Command: " + "checkin " + "Date and Time: " + getDateTime() + " Folder: " + checkinPath.split('\\')[checkinPath.split('\\').indexOf('checkout') + 1] + " is checked in." + os.EOL;

    fs.writeFile(manifestPath, manifestContents, function (err, data) {
        if (err) {
            console.log(err);
        } else {
            console.log("CHECKIN MANIFEST FILE CREATED: Path is : " + manifestPath);

        }

    });

    res.render(__dirname + '/public/fcheckinedit.ejs');


});

app.get('/mergein', function (req, res) {    
    var mergeinPath = req.query.mergeinPath;
    console.log(mergeinPath);
    var repoPath = "abc/";
    fse.copy(mergeinPath, repoPath, function (err) {
        if (err) {
            console.error(err);
        } else {
            console.log("successfully merged in");
        }
});

var manifestPath = "abc/" + "manifest-mergein-" + mergeinPath.split('\\')[mergeinPath.split('\\').indexOf('checkout') + 1];
    // console.log(checkinPath.split('\\') );
    function getDateTime() {

        var date = new Date();

        var hour = date.getHours();
        hour = (hour < 10 ? "0" : "") + hour;

        var min = date.getMinutes();
        min = (min < 10 ? "0" : "") + min;

        var sec = date.getSeconds();
        sec = (sec < 10 ? "0" : "") + sec;

        var year = date.getFullYear();

        var month = date.getMonth() + 1;
        month = (month < 10 ? "0" : "") + month;

        var day = date.getDate();
        day = (day < 10 ? "0" : "") + day;

        return year + ":" + month + ":" + day + " " + hour + ":" + min + ":" + sec;

    }

    var manifestContents = "Command: " + "checkin " + "Date and Time: " + getDateTime() + " Folder: " + mergeinPath.split('\\')[mergeinPath.split('\\').indexOf('checkout') + 1] + " is merged in." + os.EOL;

    fs.writeFile(manifestPath, manifestContents, function (err, data) {
        if (err) {
            console.log(err);
        } else {
            console.log("Merged MANIFEST FILE CREATED: Path is : " + manifestPath);

        }

    });

    res.render(__dirname + '/public/mergein.ejs');


});



app.listen(3000, function () {
    console.log('server is listening');

})