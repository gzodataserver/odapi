ODSync
======

Build with [`gulp`](https://github.com/gulpjs/gulp). Install with: `npm install gulp gulp-concat gulp-rename gulp-uglify`.


Run the unit tests
==================

Open `test.html` in a browser and show the developer console.

You need a odataserver2 backend. Make sure it is running if you have it installed locally.

Test the mysql functions with: `testOdata.createAccounts()` followed by `testOdata.testMysql()`.
You will get a 406 if the account already exists.
The function `testOdata.cleanup()` can be used to make sure all old test data is deleted.
The accunts will not be deleted though.

Test the leveldb functions with: `testOdata.createAccounts()` followed by `testOdata.testLevelDb()`.



Using the back end API
======================

Setup these helpers: `var log = console.log.bind(console); var error = console.log.bind(console, 'ERROR')`

Show the help page:
`Odata.help(Odata.DEV_URL).then(function(res){log(res.data)}, function(res){log(res.data)})`

Let's gather the credentials in an object so we don't have to type them:
`var options = {url: Odata.DEV_URL, email: 'joe@example.com'}`

Create an account and save the account id (you'll get a 406 id the account already exists, just continue to the next step):
`Odata.createAccount(options).then(function(res){log(options.accountId=res.data[1].accountId)}, function(res){log(options.accountId=res.data[1].accountId)})`

Take a note of the account id that was returned. Now generate a password:
`Odata.resetPassword(options).then(function(res){log(options.password=res.data[0].password)}, error)`

Note down the password (this feature is only enabled in dev and test environments).

Create one more account.

Let's gather the credentials in an object so we don't have to type them:
`var options2 = {url: Odata.DEV_URL, email: 'gina@example.com'}`

`Odata.createAccount(options2).then(function(res){log(options2.accountId=res.data[1].accountId)}, function(res){log(options2.accountId=res.data[1].accountId)})`

Take a note of the account id that was returned. Now generate a password:
`Odata.resetPassword(options2).then(function(res){log(options2.password=res.data[0].password)}, error)`

Working with tables
--------------------

Now create a Odata object with account just created and use it:

    var od = new Odata(options);
    od.createTable('mytable', ["col1 int","col2 varchar(255)"]).then(log);
    od.accountInfo().then(log);

Grant access for Joe's new table to Gina and insert some data:

    od.grant('mytable', '9590c009ef00').then(console.log.bind(console));

    od.insert('3ea8f06baf64', 'mytable', {"col1":11,"col2":"11"}).then(log);
    od.insert('3ea8f06baf64', 'mytable', {"col1":1000,"col2":"1010"}).then(log);

    od.get('3ea8f06baf64', 'mytable').then(log);
    od.get('3ea8f06baf64', 'mytable', 'col1').then(log);
    od.get('3ea8f06baf64', 'mytable', null, 'col1 eq 11').then(log);

Delete a row:

    od.delete('3ea8f06baf64', 'mytable', 'col1 eq 11').then(log);
    od.get('3ea8f06baf64', 'mytable').then(log);

Update a row:

    od.update('3ea8f06baf64', 'mytable', {"col1":1000,"col2":"1011"}, 'col1 eq 1000').then(log);
    od.get('3ea8f06baf64', 'mytable').then(log);

Drop a table:

    od.drop('mytable').then(log);

Cleanup:

    od.deleteAccount('3ea8f06baf64').then(log);



Working with buckets
--------------------

Create a bucket (key/value store):

    var od = new Odata(Odata.DEV_URL, '3ea8f06baf64', 'o1Z4zxyPSUQO');
    od.createBucket('b_mybucket').then(log);
    od.store('3ea8f06baf64', 'b_mybucket', 'Some data to store in a bucket').then(log);
    od.fetch('3ea8f06baf64', 'b_mybucket').then(log);
