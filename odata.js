;
(function () {

  // imports
  // ========

  var log = console.log.bind(console);
  var info = console.info.bind(console, 'INFO');
  var debug = console.debug.bind(console, 'DEBUG');
  var error = console.error.bind(console, 'ERROR');

  var H = window.helpers;

  // Odata class
  // ==========

  // constructor
  Odata = function (options) {
    if (!options.accountId || !options.password || !options.url)
      throw "ERROR: url, accountId and password must be set!";

    this.options = options;
    this.credentials = {
      user: options.accountId,
      password: options.password
    }

    // TODO: cleanup this
    this.url = options.url;
    this.password = options.password;
    this.accountId = options.accountId;
  };

  // Static declarations
  // -------------------

  // TODO: cleanup this
  //Odata.xhr = remote.xhr;
  Odata.DEV_URL = 'https://odatadev.gizur.com/';
  Odata.PROD_URL = 'https://odata.gizur.com/';

  // curl -d '{"email":"joe@example.com"}' http://[IP]:[PORT]/create_account
  Odata.createAccount = function (options) {
    debug('createAccount', options);
    var data = {
      email: options.email
    };
    return remote.xhrJSON(options.url + 'create_account', 'POST', data);
  };

  // `curl -d '{"accountId":"3ea8f06baf64","email":"joe@example.com"}' http://[IP]:[PORT]/3ea8f06baf64/s/reset_password`
  Odata.resetPassword = function (options) {
    var data = {
      accountId: options.accountId,
      email: options.email
    };
    return remote.xhrJSON(options.url + options.accountId + '/s/reset_password', 'POST', data);
  };

  // Prototype declarations
  // -----------------------

  // `curl -H "user:3ea8f06baf64" -H "password:xxx" -d '{"tableDef":{"tableName":"mytable","columns":["col1 int","col2 varchar(255)"]}}' http://[IP]:[PORT]/3ea8f06baf64/s/create_table`
  Odata.prototype.createTable = function (tableName, columns) {
    var data = {
      tableDef: {
        tableName: tableName,
        columns: columns
      }
    };
    return remote.xhrJSON(this.url + this.accountId + '/s/create_table', 'POST', data, this.credentials);
  };


  // curl -H "user:3ea8f06baf64" -H "password:xxx" http://[IP]:[PORT]/3ea8f06baf64
  Odata.prototype.accountInfo = function () {
    return remote.xhrJSON(this.url + this.accountId, 'GET', null, this.credentials);
  };


  //`curl -H "user:3ea8f06baf64" -H "password:xxx" -d '{"tableName":"mytable","accountId":"6adb637f9cf2"}' http://[IP]:[PORT]/3ea8f06baf64/s/grant`
  Odata.prototype.grant = function (tableName, accountId) {
    var data = {
      tableName: tableName,
      accountId: accountId
    };
    return remote.xhrJSON(this.url + this.accountId + '/s/grant', 'POST', data, this.credentials);
  };

  // curl -H "user:3ea8f06baf64" -H "password:xxx" -d '{"col1":11,"col2":"11"}' http://[IP]:[PORT]/3ea8f06baf64/mytable`
  Odata.prototype.insert = function (accountId, tableName, data) {
    return remote.xhrJSON(this.url + accountId + '/' + tableName, 'POST', data, this.credentials);
  };

  // `curl -H "user:3ea8f06baf64" -H "password:xxx" http://[IP]:[PORT]/3ea8f06baf64/mytable`
  // `curl -H "user:3ea8f06baf64" -H "password:xxx" http://[IP]:[PORT]/3ea8f06baf64/mytable\?\$select=col2`
  Odata.prototype.get = function (accountId, tableName, columns, filter, orderby, skip) {

    var params = {};
    if (columns) params['$select'] = columns;
    if (filter) params['$filter'] = filter;
    if (orderby) params['$orderby'] = orderby;
    if (skip) params['$skip'] = skip;

    var url = this.url + accountId + '/' + tableName;
    url += (columns || filter || orderby || skip) ? '?' : '';
    url += Qs.stringify(params);

    return remote.xhrJSON(url, 'GET', null, this.credentials);
  };

  // `curl -X DELETE -H "user:3ea8f06baf64" -H "password:xxx" http://[IP]:[PORT]/3ea8f06baf64/mytable`
  Odata.prototype.delete = function (accountId, tableName, filter) {
    var url = this.url + accountId + '/' + tableName;
    url += (filter) ? '?$filter=' + filter : '';
    return remote.xhrJSON(url, 'DELETE', null, this.credentials);
  };

  // `curl -X PUT -H "user:3ea8f06baf64" -H "password:xxx" -d '{"col1":11,"col2":"11"}' http://[IP]:[PORT]/3ea8f06baf64/mytable`
  Odata.prototype.update = function (accountId, tableName, data, filter) {
    var url = this.url + accountId + '/' + tableName;
    url += (filter) ? '?$filter=' + filter : '';

    return remote.xhrJSON(url, 'PUT', data, this.credentials);
  };

  // `curl -X POST -H "user:3ea8f06baf64" -H "password:xxx" -d '{"tableName":"mytable"}' http://[IP]:[PORT]/3ea8f06baf64/s/delete_table`
  Odata.prototype.drop = function (tableName) {
    var data = {
      tableName: tableName,
    };

    return remote.xhrJSON(this.url + this.accountId + '/s/delete_table', 'POST', data, {
      user: this.accountId,
      password: this.password
    });
  };

  // `curl -H "user:3ea8f06baf64" -H "password:xxx" -d '{"bucketName":"b_mybucket"}' http://[IP]:[PORT]/3ea8f06baf64/s/create_bucket`
  Odata.prototype.createBucket = function (bucketName) {
    var data = {
      bucketName: bucketName,
    };
    return remote.xhrJSON(this.url + this.accountId + '/s/create_bucket', 'POST', data,
      this.credentials);
  };

  // `curl -H "user:3ea8f06baf64" -H "password:xxx" -d "Just some test data to store in the bucket" http://[IP]:[PORT]/3ea8f06baf64/b_mybucket`
  Odata.prototype.store = function (accountId, bucketName, data) {
    return remote.xhrJSON(this.url + accountId + '/' + bucketName, 'POST', data,
      this.credentials);
  };

  // `curl -H "user:3ea8f06baf64" -H "password:xxx" -v http://[IP]:[PORT]/3ea8f06baf64/b_mybucket`
  Odata.prototype.fetch = function (accountId, bucketName) {
    return remote.xhrJSON(this.url + accountId + '/' + bucketName, 'GET', null,
      this.credentials);
  };

  // curl -X POST -H "user:3ea8f06baf64" -H "password:xxx" -d '{"accountId":"3ea8f06baf64"}' http://[IP]:[PORT]/3ea8f06baf64/s/delete_account
  Odata.prototype.deleteAccount = function (accountId) {
    var data = {
      accountId: accountId
    };
    return remote.xhrJSON(this.url + accountId + '/s/delete_account', 'POST', data,
      this.credentials);
  };

  //`curl -H "user:3ea8f06baf64" -H "password:xxx" -d '{"name":"mytable","accountId":"6adb637f9cf2"}' http://[IP]:[PORT]/3ea8f06baf64/s/grant_bucket`
  Odata.prototype.grantBucket = function (accountId, name) {
    var data = {
      name: name,
      verbs: ['select', 'insert', 'update', 'delete'],
      accountId: accountId
    };
    return remote.xhrJSON(this.url + this.accountId + '/s/grant_bucket', 'POST', data, this.credentials);
  };

  //`curl -H "user:3ea8f06baf64" -H "password:xxx" -d '{"name":"mytable","accountId":"6adb637f9cf2"}' http://[IP]:[PORT]/3ea8f06baf64/s/revoke_bucket`
  Odata.prototype.revokeBucket = function (accountId, name) {
    var data = {
      name: name,
      verbs: ['select', 'insert', 'update', 'delete'],
      accountId: accountId
    };
    return remote.xhrJSON(this.url + this.accountId + '/s/revoke_bucket', 'POST', data, this.credentials);
  };

  // Command line help, static functions on the App object
  // -----------------------------------------------------

  Odata.help2 = function (url) {
    if (!url) throw 'ERROR: Mandatory url argument is missing. The constants Odata.DEV_URL and Odata.PROD_URL can for instance be used.';
    return remote.xhrJSON(url + 'help', 'GET');
  }

  Odata.help = function (topic) {

    var footer = '\n\n-----\nSee Odata.help("accounts") for how to setup an account.';

    if (!topic) {

      var msg =
        '-- Odata API help --' +
        "\n\n* Odata.help('accounts') - create accounts, reset password etc." +
        "\n* Odata.help('tables') - working with tables" +
        "\n* Odata.help('buckets') - working with buckets";

      info(msg);

      return;
    }

    if (topic === 'accounts') {
      var msg = "An account can be created in the odata server if you don't alreqady have one:"  +
        "\nThis creas an account and saves the accountid in options.accountId" +
        "\nA 404 i received if the account already exists, the account id is saved anyway" +
        "\n\nvar log = console.log.bind(console);" +
        "\n\nvar options = {url: Odata.DEV_URL, email: 'joe@example.com'};" +
        '\nOdata.createAccount(options).then(' +
        '\n\tfunction(res){log(options.accountId=res.data[1].accountId)}, ' +
        '\n\tfunction(res){log(options.accountId=res.data[1].accountId)});' +
        '\n' +
        "\nOdata.resetPassword(options).then(" +
        "\n\tfunction(res){log(options.password=res.data[0].password)}, log);" +
        "\n\nNow is options setup with the required data to work with the odataserver" +
        "\n\nA second account is used in some of the examples in this help." +
        "\n\nvar options2 = {url: Odata.DEV_URL, email: 'gina@example.com'}" +
        '\nOdata.createAccount(options2).then(' +
        '\n\tfunction(res){log(options2.accountId=res.data[1].accountId)}, ' +
        '\n\tfunction(res){log(options2.accountId=res.data[1].accountId)});' +
        '\n' +
        "\nOdata.resetPassword(options2).then(" +
        "\n\tfunction(res){log(options2.password=res.data[0].password)}, log);" +
        "\n\nDelete an account" +
        "\nvar od = new Odata(options);" +
        "\nod.deleteAccount(options.accountId).then(log);" +
        "\n";

      info(msg);
    }

    if (topic === 'tables') {
      var msg = "options needs to be setup when working with tables (see Odata.help('accounts') ):"  +
        "\n\nvar log = console.log.bind(console);" +
        "\n\nvar od = new Odata(options);" +
        "\nod.createTable('mytable', ['col1 int','col2 varchar(255)']).then(log);" +
        "\nod.accountInfo().then(log);" +
        "\n" +
        "\n\nod.grant('mytable', options2.accountId).then(console.log.bind(console));" +
        "\nod.insert(options.accountId, 'mytable', {col1:11, col2:'11'}).then(log);" +
        "\nod.insert(options.accountId, 'mytable', {col1:1000, col2:'1010'}).then(log);" +
        "\nod.get(options.accountId, 'mytable').then(log);" +
        "\nod.get(options.accountId, 'mytable', 'col1').then(log);" +
        "\nod.get(options.accountId, 'mytable', null, 'col1 eq 11').then(log);" +
        "\n\n//delete a row" +
        "\nod.delete(options.accountId, 'mytable', 'col1 eq 11').then(log);" +
        "\nod.get(options.accountId, 'mytable').then(log);" +
        "\n\n//update a row" +
        "\nod.update(options.accountId, 'mytable', {col1:1000,col2:'1011'}, 'col1 eq 1000').then(log);" +
        "\nod.get(options.accountId, 'mytable').then(log);" +
        "\n//drop a table" +
        "\nod.drop('mytable').then(log);" +
        "\n";

      info(msg);
    }

  }

  // exports
  // ========

  window.Odata = Odata;


}());
