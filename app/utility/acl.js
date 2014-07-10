// deprecated
var acl = require('app/modules/acl');

var checkAcl = function(name, path, action) {
    return acl.isAllowed(name, path, action);
};

module.exports = checkAcl;
