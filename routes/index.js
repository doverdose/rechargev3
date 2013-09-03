exports.index = function(req,res){
    res.render('index.html');
};

exports.dashboard = function(req, res) {
    res.render('dashboard.html');
};

exports.form = function(req, res) {
    res.render('form.html');
};

