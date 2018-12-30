module.exports = function(app) {

   app.all("/login",function(req, res, next) {
        res.render('login');

    });
  
    app.all("/t_index",function(req, res, next) {
        res.render('t_index');
    });

     app.all("/p_index",function(req, res, next) {
        res.render('p_index');
    });

    //  app.all("/p_home",function(req, res, next) {
    //     res.render('p_home');
    // });
    app.all("/transact_history",function(req, res, next) {
        res.render('transact_history');
    });
    app.all("/viewAccountdetails1",function(req, res, next) {
        res.render('viewAccountdetails1');
    });
    
    app.all("/",function(req, res, next) {
        res.render('login');
    });
}
