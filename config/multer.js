const multer = require('multer');
const crypto = require('crypto');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/images')
    },
    filename: function (req, file, cb) {
        crypto.randomBytes(12,(err,bytes)=>{ // the bytes wiil be in buffer form so we will convert it to string
            const fn = bytes.toString('hex')+ path.extname(file.originalname);
            cb(null,fn);
        })
    }
  })
  
const upload = multer({ storage: storage })

module.exports = upload;