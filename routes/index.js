var express = require('express');
var router = express.Router();

var crypto = require('crypto'); 
var User = require('../models/user');
var Post = require('../models/post');

/* GET home page. */
router.get('/', function(req, res) {
  Post.get(null,function(err,posts){
	  if(err){
		  posts = [];
	  }
	  res.render('index', { title: 'Microblog' ,
		  posts: posts });
  })
});

router.get('/reg', checkNotLogin);
router.get('/reg', function(req, res) {
  res.render('reg', { title: '用户注册' });
});

  router.post('/reg', checkNotLogin);
  router.post('/reg', function(req, res) {
	  //检查用户两次口令是否一致
	  if(req.body['password-repeat'] != req.body['password']){
		  req.flash('error','两次输入的口令不一致');
		  return res.redirect('/reg'); 
	  }
	  console.log("Express 111");
	  //生成口令的散列值
	  var md5 = crypto.createHash('md5');
	  var password = md5.update(req.body.password).digest('base64');
	  var newUser = new User({
		  name:req.body.username,
		  password:password,
	  });
	  //检查用户名是否存在
	  User.get(newUser.name,function(err,user){
		  if(user)
			  err='Username already exits.';
		  if(err){
			  req.flash('error',err);
			  return res.redirect('/reg');
		  }
          //如果不存在则新增用户
	      newUser.save(function(err){
		      console.log("Express 1");
		      if(err){
			      console.log("Express 2");
			      req.flash('error',err);
			      return res.redirect('/reg');
		      }
     	     req.session.user = newUser;
			 console.log(newUser);
             req.flash('success','注册成功');
             res.redirect('/');	
	      }); 
	  }) 
  });
  router.get('/login', checkNotLogin); 
  router.get('/login', function(req, res) { 
    res.render('login', { 
      title: '用户登入', 
    }); 
  }); 
  router.post('/login', checkNotLogin); 
  router.post('/login', function(req, res) { 
    //生成口令的散列值 
    var md5 = crypto.createHash('md5'); 
    var password = md5.update(req.body.password).digest('base64'); 
     
    User.get(req.body.username, function(err, user) { 
      if (!user) { 
        req.flash('error', '用户不存在'); 
        return res.redirect('/login'); 
      } 
      if (user.password != password) { 
        req.flash('error', '用户口令错误'); 
        return res.redirect('/login'); 
      } 
      req.session.user = user; 
      req.flash('success', '登入成功'); 
	  res.redirect('/u/' + user.name);
      //res.redirect('/'); 
    }); 
  }); 
  router.get('/logout', checkLogin); 
  router.get('/logout', function(req, res) { 
    req.session.user = null; 
    req.flash('success', '登出成功'); 
    res.redirect('/'); 
  }); 

router.post("/post",checkLogin);
router.post("/post",function(req,res) {
  var currentUser = req.session.user;
  var post = new Post(currentUser.name, req.body.post);
  post.save(function(err) {
    if (err) {
      req.flash('error', err);
      return res.redirect('/');
    }
    req.flash('success', '发表成功');
    res.redirect('/u/' + currentUser.name);
  });
});

router.get("/u/:user",function(req,res) {
  User.get(req.params.user, function(err, user) {
    if (!user) {
      req.flash('error', '用户不存在');
      return res.redirect('/');
    }
    Post.get(user.name, function(err, posts) {
      if (err) {
        req.flash('error', err);
        return res.redirect('/');
      }
      res.render('index', {
        title: user.name,
        posts: posts
      });
    });
  });
});

module.exports = router;

function checkLogin(req, res, next) { 
  if (!req.session.user) { 
    req.flash('error', '未登入'); 
    return res.redirect('/login'); 
  } 
  next(); 
} 
 
function checkNotLogin(req, res, next) { 
  if (req.session.user) { 
    req.flash('error', '已登入'); 
    return res.redirect('/'); 
  } 
  next(); 
} 
