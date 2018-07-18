const logger = new (require("./../logic/components/Logger"))();
module.exports = (req,res,next)=>{
    let reqDate = new Date();
    logger.debug(reqDate +" "+ req.method +" "+ req.path);
    return next();
};