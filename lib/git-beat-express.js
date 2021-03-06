'use strict';

var GitBeat = require('./git-beat');

module.exports = function (config) {
  config = config || {};
  if (!config.app) {
    throw new Error('Missing app');
  }

  var pathPrefix = config.pathPrefix || '';
  var repos = {};


  config.app.param('repository', function (req, res, next, id) {
    if (!repos[id]) {
      return next();
    }

    req.params.repository = repos[id];
    req.params.repository.branch({}, function (err, branches) {
      if (err) {
        return next(err);
      }

      for (var branch in branches) {
        if (branches[branch]) {
          req.params.currentBranch = branch;
          return next();
        }
      }

      next();
    });
  });


  config.app.param('branch', function (req, res, next, id) {
    req.params.branch = id;
    next();
  });


  config.app.param('commit', function (req, res, next, id) {
    next();
  });

  function addRepo(repo) {
    repos[repo.name] = new GitBeat(repo);
  }

  function logger() {
    console.info.apply(console, arguments);
  }

  var names = Object.keys(config.repos);
  for (var n in names) {
    var name = names[n];
    var repo = config.repos[name];
    repo.name = name;
    repo.logger = logger;
    addRepo(repo);
  }

  config.app.route(pathPrefix + '/:repository')
    .get(function (req, res, next) {
      var repo = req.params.repository;
      var resp = {
        cwd: repo.cwd,
        isCloned: repo.isCloned,
        url: repo.url,
        branch: req.params.currentBranch
      };

      res
        .status(200)
        .send(resp);
    });

  return function (req, res, next) {
    console.info('middleware req.url', req.url, req.params);
    next();
  };
};
