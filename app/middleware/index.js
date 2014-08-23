function fatal(err, req, res, next){
    console.log(err);
    if(err.status !== 500) {
        res.status(err.status).json({error: err.code, message: err.message});
    }

    res.status(500).json({error: "Fatal server error"});
}

module.exports = {
  fatal: fatal
};
