;
(function () {

  // "Imports"
  // =========

  var O = window.Odata;
  var deepEqual = chai.assert.deepEqual;

  var log = console.log.bind(console);
  var debug = console.debug.bind(console);
  var error = console.error.bind(console);

  // Test the Odata class
  // ====================

  var T = {};

  T.options = {
    url: Odata.DEV_URL,
    email: 'joe@example.com'
  };

  T.options2 = {
    url: Odata.DEV_URL,
    email: 'gina@example.com'
  };

  T.createAccounts = function () {
    return Odata.createAccount(T.options).then(function (res) {
        log(T.options.accountId = res.data[1].accountId)
      }, function (res) {
        log(T.options.accountId = res.data[1].accountId)
      })
      .then(function () {
        return Odata.resetPassword(T.options).then(function (res) {
          log(T.options.password = res.data[0].password)
        }, error)
      })
      .then(function () {
        return Odata.createAccount(T.options2).then(function (res) {
            log(T.options2.accountId = res.data[1].accountId)
          }, function (res) {
            log(T.options2.accountId = res.data[1].accountId)
          })
          .then(function () {
            return Odata.resetPassword(T.options2).then(function (res) {
              log(T.options2.password = res.data[0].password)
            }, error)
          })
      });

  };

  // MySQL tests
  // ============

  T.cleanup = function () {
    var od = new Odata(T.options);
    od.drop('mytable')
      .then(log, log);
  };

  T.testMysql = function () {

    var od = new Odata(T.options);
    od.createTable('mytable', ["col1 int", "col2 varchar(255)"])
      .then(function (res) {
        log('createTable', res);
        deepEqual(res.data[0], {
          queryType: "create_table"
        }, 'createTable');
        return od.accountInfo()
      })
      .then(function (res) {
        log('accountInfo', res);
        deepEqual(res.data, [{
          queryType: "service_def"
        }, {
          table_name: "mytable",
          mb: 0.015625
        }], 'accountInfo');
        return od.grant('mytable', T.options2.accountId);
      })
      .then(function (res) {
        log('grant', res);
        deepEqual(res.data[0], {
          queryType: "grant"
        }, 'grant');
        return od.insert(T.options.accountId, 'mytable', {
          "col1": 11,
          "col2": "11"
        });
      })
      .then(function (res) {
        log('insert', res)
        return od.insert(T.options.accountId, 'mytable', {
          "col1": 1000,
          "col2": "1010"
        });
      })
      .then(function (res) {
        log('insert', res)
        return od.get(T.options.accountId, 'mytable');
      })
      .then(function (res) {
        log('get', res);
        deepEqual(res.data, [{
          queryType: "select"
        }, {
          col1: 11,
          col2: "11"
        }, {
          col1: 1000,
          col2: "1010"
        }], 'get');
        return od.get(T.options.accountId, 'mytable', 'col1');
      })
      .then(function (res) {
        log('get', res);
        deepEqual(res.data, [{
          queryType: "select"
        }, {
          col1: 11
        }, {
          col1: 1000
        }], 'get col1');
        return od.get(T.options.accountId, 'mytable', null, 'col1 eq 11');
      })
      .then(function (res) {
        log('get', res);
        deepEqual(res.data, [{
          queryType: "select"
        }, {
          col1: 11,
          col2: "11"
        }], 'get col1');
        return od.get(T.options.accountId, 'mytable', 'col1,@odata.etag', 'col1 eq 11', false, false, true);
      })
      .then(function (res) {
        log('etag', res)
        deepEqual(res.data, [{
            '@odata.etag': "99938282f04071859941e18f16efcf42",
            queryType: "select"
          },
          {
            '@odata.etag': "b59c67bf196a4758191e42f76670ceba",
            col1: 11
          }], 'ETAG get col1 eq 11');
        return od.delete(T.options.accountId, 'mytable', 'col1 eq 11')
      })
      .then(function (res) {
        log('delete', res);
        return od.get(T.options.accountId, 'mytable');
      })
      .then(function (res) {
        log('get', res);
        deepEqual(res.data, [{
          queryType: "select"
        }, {
          col1: 1000,
          col2: "1010"
        }], 'after delete');
        return od.update(T.options.accountId, 'mytable', {
          "col1": 1000,
          "col2": "1011"
        }, 'col1 eq 1000');
      })
      .then(function (res) {
        log('update', res);
        return od.get(T.options.accountId, 'mytable');
      })
      .then(function (res) {
        log('get', res);
        deepEqual(res.data, [{
          queryType: "select"
        }, {
          col1: 1000,
          col2: "1011"
        }], 'after update');
        return od.drop('mytable');
      })
      .then(log, error);

  };

  // LevelDB tests
  // ============

  T.testLevelDb = function () {

    var od = new Odata(T.options);
    od.createBucket('b_mybucket')
      .then(function (res) {
        log(res);
        return od.grantBucket('3ea8f06baf64', 'b_mybucket');
      })
      .then(function (res) {
        log(res);
        deepEqual(res.data[0][0].affectedRows, 4, 'grantBucket')
        return od.store('3ea8f06baf64', 'b_mybucket', 'Some data to store in a bucket');
      })
      .then(function (res) {
        log(res);
        deepEqual(res.data, [], 'store');
        return od.fetch('3ea8f06baf64', 'b_mybucket');
      })
      .then(function (res) {
        log(res);
        deepEqual(res.data, 'Some data to store in a bucket', 'fetch');
        return od.revokeBucket('3ea8f06baf64', 'b_mybucket');
      })
      .then(function (res) {
        log(res);
        deepEqual(res.data[0][0].affectedRows, 4, 'revokeBucket')
        return od.store('3ea8f06baf64', 'b_mybucket', 'Some data to store in a bucket');
      })
      .then(function (res) {
        log(res);
        deepEqual(res.data[0], {
          err: "Operation not allowed! POST /3ea8f06baf64/b_mybucket user:3ea8f06baf64"
        }, 'store without grant')
        return od.fetch('3ea8f06baf64', 'b_mybucket');
      })
      .then(function (res) {
        log(res);
        deepEqual(res.data[0], {
          err: "Operation not allowed! GET /3ea8f06baf64/b_mybucket user:3ea8f06baf64"
        }, 'fetch without grant')

      })
      .catch(error)

  };

  // exports
  // =======

  window.testOdata = T;

}());
