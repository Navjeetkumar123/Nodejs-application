process.env['GOPATH'] = __dirname;
var hfc = require("hfc");
var util = require('util');
var variables = require("../variables.js");
var chain, poChaincodeID, dealChaincodeID, accountChaincodeID, shipmentChaincodeID;
chain = hfc.newChain(variables.chain);
var eh = chain.getEventHub();
chain.setMemberServicesUrl(variables.MEMBERSRVC_ADDRESS);
chain.addPeer(variables.PEER_ADDRESS);
chain.eventHubConnect(variables.EVENT_ADDRESS);
chain.setDevMode(variables.DEV_MODE);
//Deploy will take much longer in network mode
chain.setDeployWaitTime(variables.DeployWaitTime);
chain.setInvokeWaitTime(variables.InvokeWaitTime);
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();
var session = require('express-session');
var cookieParser = require('cookie-parser');
var fs = require('fs');
var path = require('path');
var request = require('request');
//var requestOrg = require('request');
//var request = requestOrg.defaults({'proxy':'http://na326813:man@326813@proxy1.wipro.com:8080'});
var http = require('http');
var async = require('async');
var assert = require('assert');
var MongoClient = require('mongodb').MongoClient;
var ObjectIdVar = require('mongodb').ObjectID;
var SHA256 = require("crypto-js/sha256");
var chaincodeIDPath = __dirname + "/chaincodeID";
console.log("chaincodeIDPath: " + chaincodeIDPath);
var KeyValStorePath = __dirname + "/" + variables.KeyValStore;
console.log("KeyValStorePath: ")
console.log(KeyValStorePath);
chain.setKeyValStore(hfc.newFileKeyValStore(KeyValStorePath));
module.exports = function(app) {
    var userObj, adminInfo;
    //var variables = require('../variables')
    //var url = 'mongodb://localhost:27017/tradeinfo';
    var chainCodeURL = 'http://' + variables.chainCodeIPAddress + ':' + variables.chainCodePort + '/chaincode'
    console.log(chainCodeURL)
    var authenticate = function(req, res, next) {
        var isAuthenticated = true;
        //console.log(req.session);
        //console.log(req.session.username);
        if (typeof req.session.username == 'undefined') {
            isAuthenticated = false;
        }
        if (isAuthenticated) {
            //console.log("Authenticated " + req.session.username);
            next();
        } else {
            // redirect user to authentication page
            console.log("Authentication Failed, Sending to login");
            res.redirect('/login');
        }
    };
    // Sending user details as a json to front-end
    app.get("/tcm/user/getUsername", function(req, res) {
        res.setHeader('Content-Type', 'application/json');
        res.json({
            username: req.session.username,
            name: req.session.name,
            Role: req.session.Role
            //name:req.session.name
        });
    });

    function fileExists(filepath) {
        try {
            return fs.statSync(filepath).isFile();
        } catch (err) {
            return false;
        }
    }
    // Validating user credentials with DB and then registering user on the hyperledger network
    // Parameters : username(req.body.username),password(req.body.pass)
    // Return: Redirecting to thier respective page according to user Role.
    app.post("/userLogin", multipartMiddleware, function(req, res, next) {
        console.log("userLogin");
        MongoClient.connect(variables.url, function(err, db) {
            console.log("connected to DB")
            if (err) throw err;
            //console.log(req.body.username)
            var collection = db.collection('users');
            collection.findOne({
                username: req.body.username
            }, function(err, result) {
                if (result != null) {
                    console.log('result');
                    if (result.password == req.body.pass) {
                        console.log("userLogin " + result.Role + "\n username: " + result.username);
                        console.log("password  matched");
                        req.session.username = result.username;
                        req.session.Role = result.Role;
                        req.session.user_id = result._id;
                        console.log("session saved")
                        if (fileExists(chaincodeIDPath)) {
                            // Read chaincodeID and use this for sub sequent Invokes/Queries
                            chaincodeID = fs.readFileSync(chaincodeIDPath, 'utf8');
                            chain.getUser(req.session.username, function(err, user) {
                                if (err)
                                    throw Error(" Failed to register and enroll " + req.session.username + ": " + err);
                                userObj = user;
                            });
                        } else {
                            if (result.Role == "Agent") {
                                req.session.username = result.username;
                                req.session.name = result.name;
                                registerAndEnrollUsers(req.session.username);
                                res.redirect('/t_index');
                            } else if (result.Role == "Pledger") {
                                req.session.username = result.username;
                                req.session.name = result.name;
                                registerAndEnrollUsers(req.session.username);
                                res.redirect('/p_index#/p_home');
                            } else if (result.Role == "Pledgee") {
                                req.session.username = result.username;
                                req.session.name = result.name;
                                registerAndEnrollUsers(req.session.username);
                                res.redirect('/p_index#/p_home');
                            }
                            db.close();
                        }
                    } else {
                        //return res.send('<script>alert("Invalid login credentials");</script>');
                        res.redirect('/login?valid=y');
                        //res.json('<script type="text/javascript">alert("I am an alert box!");</script>');
                    }
                } else {
                    //return res.send('<script>alert("Invalid user");</script>');
                    //console.log(result)
                    res.redirect('/login?valid=y');
                    //res.json('<script type="text/javascript">alert("I am an alert box!");</script>');
                    //console.log(err);
                }
            });
        });
    });

    // If user is not registered already on the hyperledger network, enroll the user after registering "admin" as a registrar
    // Input: username, affiliation and admin credentials(registered by default in the hyperedger network)
    // Return: User data containing enrollID,enrollSecret and other related data for login further and stores in a file named same as the username in "routes/keystore" folder
    function registerAndEnrollUsers(username) {
        // WebAppAdmin DJY27pEnl16d
        // admin Xurw3yU9zI0l
        chain.enroll("admin", "Xurw3yU9zI0l", function(err, admin) {
            if (err) {
                console.log("ERROR: failed to register admin: %s", err);
                process.exit(1);
            }
            // Set this user as the chain's registrar which is authorized to register other users.
            chain.setRegistrar(admin);
            console.log("\n Admin enrolled Successfully.\n")
            console.log(username);
            // registrationRequest
            var registrationRequest = {
                enrollmentID: username,
                affiliation: variables.AFFILIATION
            };
            console.log("registrationRequest: ")
            console.log(registrationRequest);
            // register a new user
            chain.registerAndEnroll(registrationRequest, function(error, user) {
                if (error) throw Error(" Failed to register and enroll " + username + ": " + error);
                console.log("Enrolled %s successfully\n", user);
                //req.session.user = user;
                //callback(user);
            });
        });
    }
    // Connecting to DB and fetching User Details from DB.If found, return user data,else return message
    // Input: username(req.params.username)
    // Output: user data from DB (username,name,role,password,LongboxAccountNumber) 
    app.get("/tcm/user/:username", multipartMiddleware, function(req, res, next) {
        console.log('/getUserDetails: Fetching user details');
        var user = req.params.username;
        console.log(user);
        MongoClient.connect(variables.url, function(err, db) {
            console.log("connected to DB")
            if (err) throw err;
            var collection = db.collection('users');
            collection.findOne({
                username: user
            }, function(err, result) {
                if (result != null) {
                    console.log("result: " + JSON.stringify(result));
                    console.log(result);
                    res.json(result)
                } else {
                    console.log(user + " record not found.");
                    var msg = user + " record not found.";
                    res.json({
                        message: msg
                    });
                }
                db.close();
            });
        });
    });
    // Fetching deals for a user from chaincode after logging in to the hyperledger network
    // Input: username(req.query.username) and role(req.query.role)
    // Output : deals and related transactions for a user as requested
    app.get("/tcm/deals/user", multipartMiddleware, function(req, res, next) {
        var username = req.session.username;
        var role = req.session.Role;
        var functionName;
        console.log("/tcm/deals/user: Fetching deals for user " + username + " with role " + role);
        var queryRequest = {
            // Name (hash) required for query
            chaincodeID: variables.dealChaincodeID,
            // Function to trigger
            fcn: 'get_AllDeal',
            // Parameters for the query function
            args: [" "]
        };
        console.log(queryRequest);
        // Query the request from the user object and get the deal details for a user from chaincode after logging into the hyperledger network.
        chain.getUser(req.session.username, function(err, user) {
            if (err) throw Error("/tcm/deals/user: Failed to register and enroll" + req.session.username + ": " + err);
            userObj = user;
        })
        var queryTx = userObj.query(queryRequest);
        queryTx.on('complete', function(results) {
            // Query completed successfully
            console.log("/tcm/deals/user: Successfully queried  chaincode function: request=%j, value=%s \n", queryRequest, results.result.toString());
            var x = JSON.parse(results.result.toString());
            console.log(x)
            res.json(x);
        });
        queryTx.on('error', function(err) {
            // Query failed
            console.log("/tcm/deals/user: Failed to query chaincode, function: request=%j, error=%j \n", queryRequest, err);
            res.json(err);
        });
    });
    // Fetching deals by status from chaincode after logging into the hyperledger network
    // Input: username(req.query.username), status(req.query.status) and role(req.query.role)
    // Output : deals and related transactions from the chaincode
    app.get("/tcm/deals/dealStatus", multipartMiddleware, function(req, res, next) {
        console.log('/tcm/deals/dealStatus: Fetching deals by Status ' + req.query.status);
        // Construct the Query request
        var queryRequest = {
            // Name (hash) required for query
            chaincodeID: variables.dealChaincodeID,
            // Function to trigger
            fcn: "get_AllDeal",
            // Parameters for the query function
            args: [req.params.accountNumber]
        };
        console.log(queryRequest);
        // Query the request from the user object and get the account details from chaincode.
        chain.getUser(req.session.username, function(err, user) {
            if (err) throw Error("/tcm/deals/dealStatus: Failed to register and enroll" + req.session.username + ": " + err);
            userObj = user;
        })
        var queryTx = userObj.query(queryRequest);
        queryTx.on('complete', function(results) {
            // Query completed successfully
            console.log("/tcm/deals/dealStatus: Successfully queried  chaincode function: request=%j, value=%s \n", queryRequest, results.result.toString());
            var x = JSON.parse(results.result.toString());
            console.log(x)
            res.json(x);
        });
        queryTx.on('error', function(err) {
            // Query failed
            console.log("/tcm/deals/dealStatus: Failed to query chaincode, function: request=%j, error=%j \n", queryRequest, err);
            res.json(err);
        });
    });
    // Fetching Account Details from chaincode after logging into the hyperledger network
    // Input : chaincodeDeployedAddress(variables.accountChaincodeID),accountNumber(req.params.accountNumber) and functionName(getAccount_byNumber)
    // Output: accountDetails(results)
    app.get("/tcm/accounts/:accountNumber", multipartMiddleware, function(req, res, next) {
        console.log('/tcm/accounts: Fetching account details for ' + req.params.accountNumber);
        // Construct the Query request
        var queryRequest = {
            // Name (hash) required for query
            chaincodeID: variables.accountChaincodeID,
            // Function to trigger
            fcn: "getAccount_byNumber",
            // Parameters for the query function
            args: [req.params.accountNumber]
        };
        console.log(queryRequest);
        // Query the request from the user object and get the account details from chaincode.
        chain.getUser(req.session.username, function(err, user) {
            if (err) throw Error("/tcm/accounts: Failed to register and enroll" + req.session.username + ": " + err);
            userObj = user;
        })
        var queryTx = userObj.query(queryRequest);
        queryTx.on('complete', function(results) {
            // Query completed successfully
            console.log("/tcm/accounts: Successfully queried  chaincode function: request=%j, value=%s \n", queryRequest, results.result.toString());
            var x = JSON.parse(results.result.toString());
            console.log(x)
            res.json(x);
        });
        queryTx.on('error', function(err) {
            // Query failed
            console.log("/tcm/accounts: Failed to query chaincode, function: request=%j, error=%j \n", queryRequest, err);
            res.json(err);
        });
    });

    // Fetching security Details of an account from chaincode after logging into the hyperledger network
    // Input : chaincodeDeployedAddress(variables.accountChaincodeID),accountNumber(req.params.accountNumber)
    // Output: security details(results)
    app.get("/tcm/accounts/security/:accountNumber", multipartMiddleware, function(req, res, next) {
        console.log('/tcm/accounts: Fetching account details for ' + req.params.accountNumber);
        // Construct the Query request
        var queryRequest = {
            // Name (hash) required for query
            chaincodeID: variables.accountChaincodeID,
            // Function to trigger
            fcn: "getSecurities_byAccount",
            // Parameters for the query function
            args: [req.params.accountNumber]
        };
        console.log(queryRequest);
        // Query the request from the user object and get the account details from chaincode.
        chain.getUser(req.session.username, function(err, user) {
            if (err) throw Error("/tcm/accounts/security/: Failed to register and enroll" + req.session.username + ": " + err);
            userObj = user;
        })
        var queryTx = userObj.query(queryRequest);
        queryTx.on('complete', function(results) {
            // Query completed successfully
            console.log("/tcm/accounts/security: Successfully queried  chaincode function: request=%j, value=%s \n", queryRequest, results.result.toString());
            var x = JSON.parse(results.result.toString());
            console.log(x)
            res.json(x);
        });
        queryTx.on('error', function(err) {
            // Query failed
            console.log("/tcm/accounts/security: Failed to query chaincode, function: request=%j, error=%j \n", queryRequest, err);
            res.json(err);
        });
    });


    // Fetching Account Details by account holder's name from chaincode after logging into the hyperledger network
    // Input : chaincodeDeployedAddress(variables.accountChaincodeID),account Holder Name(req.params.accountHolderName) and functionName(getAccount_byName)
    // Output: accountDetails(results) for a specific account holder
    app.get("/tcm/accounts/account/:accountHolderName", multipartMiddleware, function(req, res, next) {
        console.log('/tcm/accounts/account: Fetching account details for ' + req.params.accountHolderName);
        // Construct the Query request
        var queryRequest = {
            // Name (hash) required for query
            chaincodeID: variables.accountChaincodeID,
            // Function to trigger
            fcn: "getAccount_byName",
            // Parameters for the query function
            args: [req.params.accountHolderName]
        };
        console.log(queryRequest);
        // Query the request from the user object and get the account details from chaincode.
        chain.getUser(req.session.username, function(err, user) {
            if (err) throw Error("/tcm/accounts/account: Failed to register and enroll" + req.session.username + ": " + err);
            userObj = user;
        })
        var queryTx = userObj.query(queryRequest);
        queryTx.on('complete', function(results) {
            // Query completed successfully
            console.log("/tcm/accounts/account: Successfully queried  chaincode function: request=%j, value=%s \n", queryRequest, results.result.toString());
            var x = JSON.parse(results.result.toString());
            console.log(x)
            res.json(x);
        });
        queryTx.on('error', function(err) {
            // Query failed
            console.log("/tcm/accounts/account: Failed to query chaincode, function: request=%j, error=%j \n", queryRequest, err);
            res.json(err);
        });
    });

    // Adding securities to an account after logging into hyperledger network
    // Input: account() and securities()
    // Output: transaction hash(transHash) of the transaction
    app.post("/tcm/accounts/securities", multipartMiddleware, function(req, res, next) {
        console.log('/tcm/accounts/securities: Adding securities to an account');
        console.log(req.body.security);
        var security = req.body.security;
        var args = [security.securityId, req.body.longBoxAccount, security.securityName, security.securityQuantity, security.securityType, security.collateralForm, security.valuePercentage, security.mtm]
        console.log("args: " + args)
        // Construct the Invoke request
        var invokeRequest = {
            // Name (hash) required for invoke
            chaincodeID: variables.accountChaincodeID,
            // Function to trigger
            fcn: "add_security",
            // Parameters for the invoke function
            args: args
        };
        console.log(invokeRequest);
        // Fetching user info from chain
        chain.getUser(req.session.username, function(err, user) {
            if (err) throw Error("/tcm/accounts/securities: Failed to register and enroll" + req.session.username + ": " + err);
            userObj = user;
        })

        // Invoke the request from the user object and wait for events to occur.
        var tx = userObj.invoke(invokeRequest);
        var transHash;
        // Listen for the 'submitted' event
        tx.on('submitted', function(results) {
            console.log("/tcm/accounts/securities: submitted invoke: %j", results);
            //      callback(results);
        });
        // Listen for the 'complete' event.
        tx.on('complete', function(results) {
            console.log("/tcm/accounts/securities: completed invoke: %j", results);
            transHash = results.result;;
            //res.json(results)
            //      callback(results);
        });
        // Listen for the 'error' event.
        tx.on('error', function(err) {
            console.log("/tcm/accounts/securities: error on invoke: %j", err);
            res.json(err)
            //callback(err);
        });
        var regid = eh.registerChaincodeEvent(variables.accountChaincodeID, "evtsender", function(event) {
            console.log("/tcm/accounts/securities: Custom event received, payload: %j\n", event.payload.toString());
            eh.unregisterChaincodeEvent(regid);
            var x = JSON.parse(event.payload.toString());
            x.transHash = transHash;
            res.json(x);

        });
        var regid1 = eh.registerChaincodeEvent(variables.accountChaincodeID, "errEvent", function(event) {
            console.log("/tcm/accounts/securities: Custom Error event received, payload: %j\n", event.payload.toString());
            eh.unregisterChaincodeEvent(regid1);
            var x = JSON.parse(event.payload.toString());
            x.transHash = transHash;
            res.json(x);

        });
    });
    // Reading file content  and file validation
    // Input: input file csv
    // Output: valid or invalid(if any field in the file is empty)
    app.post("/validateFile", multipartMiddleware, function(req, res, next) {
        console.log('validateFile:  uploading file');
        console.log('files::::' + req.files.file);
        var resul = [];
        console.log(req.files)
        var fileName = req.files.file.name;
        var now = new Date();
        var timeStamp = Date.now();
        var deal_date = timeStamp;
        fileName = fileName;
        console.log(fileName)
        var tempPath = req.files.file.path;
        var relative_target_path = './public/Documents/';
        var target_path_wo_fileName = path.resolve(relative_target_path).replace(/\\/g, '/') + '/';
        var target_path = target_path_wo_fileName + fileName;
        // get whole text in array
        var array = fs.readFileSync(tempPath, 'utf8').toString().split('\n');
        console.log("array");
        console.log(array);
        // get headers from 1st index in array
        var headers = array[0].split(",");
        console.log("headers");
        console.log(headers);

        for (var j = 1; j < array.length; j++) {
            var obj = {};
            // Fetching each line from the input file storing in row[]
            var row = array[j].split(",");
            //Romoving spaces form Pledger and Pledgee from CSV
            row[2] = row[2].replace(/\s+/, "");
            row[3] = row[3].replace(/\s+/, "");
            //console.log("row");
            //console.log(row);
            if (row.length != 8) {
                return res.json({
                    "message": "Invalid"
                });
            } else {
                for (var i in row) {
                    // if this property is not present inside row or empty property
                    if (!row[i]) {
                        return res.json({
                            "message": "Invalid"
                        });
                    }
                };
            }
            var dateParts = row[6].split('/');
            var date = new Date(parseInt(dateParts[2],10),
                                parseInt(dateParts[1],10) - 1,      //Date accepts only 0 - 11, so subtracting 1 from the actual value
                                parseInt(dateParts[0],10));
            var dateUnixTimestamp = date.getTime()/1000;
            row[6] = dateUnixTimestamp.toString();
            // inserting deal_date(current timestamp) at index inside the row
            row.splice(1, 0, deal_date.toString());
            console.log(row);
            resul.push(row);
        }
        fs.writeFile(target_path, array, function(err) {
            //console.log('data::'+data);
            if (err) {
                console.log("File not uploaded");
                console.log("Error in writeFile " + err);
                console.log("Document upload: Error while writing Document: " + target_path);
                return res.json({
                    "message": "Error while writing file"
                });
            } else {

                //console.log(" "+ resul.join());
                console.log("FileSystem document upload successful at " + timeStamp);
                return res.json({
                    "message": "Valid",
                    "data": resul
                })
            }
        });
    });
    // Reading file content  and file validation for adding security
    // Input: input security file csv
    // Output: valid or invalid(if any field in the file is empty)
    app.post("/validateSecurityFile", multipartMiddleware, function(req, res, next) {
        console.log('validateSecurityFile:  Validating security file');
        console.log('files::::' + req.files.file);
        var resul = [];
        var mtm,collateral_form;
        console.log(req.files)
        var fileName = req.files.file.name;
        var now = new Date();
        var timeStamp = Date.now();
        fileName = fileName;
        console.log(fileName)
        var tempPath = req.files.file.path;
        var relative_target_path = './public/Documents/';
        var target_path_wo_fileName = path.resolve(relative_target_path).replace(/\\/g, '/') + '/';
        var target_path = target_path_wo_fileName + fileName;
        // get whole text in array
        var array = fs.readFileSync(tempPath, 'utf8').toString().split('\n');
        console.log("array");
        console.log(array);
        // get headers from 1st index in array
        var headers = array[0].split(",");
        console.log("headers");
        console.log(headers);
        var read = true;
        if(read){
            var flag= false;
            for (var j = 1; j < array.length; j++) {
                var obj = {};
                // Fetching each line from the input file storing in row[]
                var row = array[j].split(",");
                console.log("row");
                console.log(row);
                if (row.length != 4) {
                    flag = true;
                    console.log("row length is not 4")
                    return res.json({
                        "message": "Invalid"
                    });
                } else {
                    for (var i in row) {
                        // if this property is not present inside row or empty property
                        if (!row[i]) {
                            flag = true;
                            console.log("file is empty")
                            return res.json({
                                "message": "Invalid"
                            });
                        }
                    };
                }
                if(flag == false){
                    // Fetching MTM and collateral form from db by using security ID
                    MongoClient.connect(variables.url, function(err, db) {
                        console.log("Connected to DB")
                        if (err) throw err;
                        var collection = db.collection('security_data');
                        collection.findOne({
                            securityId: row[1]
                        }, function(err, result) {
                            if (result != null) {
                                console.log(result);
                                collateral_form = result.collateral_form;
                                mtm = result.market_value;
                                // inserting MTM and collateral_from at index 5 and 6 inside the row
                                row.splice(5, 0, collateral_form)
                                row.splice(6, 0, mtm)
                                //res.json(result)
                            } else {
                                flag = true;
                                console.log("record not found in db")
                                var msg = row[i]+" not found in security DB ";
                                res.json({
                                    message: msg
                                });
                            }
                        });
                    });
                    resul.push(row);
                }
            }
            read = false;
        }else if(!read){
            fs.writeFile(target_path, array, function(err) {
                //console.log('data::'+data);
                if (err) {
                    console.log("File not uploaded");
                    console.log("Error in writeFile " + err);
                    console.log("Document upload: Error while writing Document: " + target_path);
                    return res.json({
                        "message": "Error while writing file"
                    });
                } else {
                    console.log("Security input file uploaded successfully at " + timeStamp);
                    return res.json({
                        "message": "Valid",
                        "data": resul
                    })
                }
            });
        }
    });
    // Fetching Deal details from chaincode after logging into hyperledger network
    // Input: deal ID(req.params.dealId)
    // Output: deal and related transactions by deal ID from chaincode
    app.get("/tcm/deals/:dealId", multipartMiddleware, function(req, res, next) {
        console.log("/tcm/deals/: Fetching deal details by deal ID: " + req.params.dealId);
        // Construct the Query request
        var queryRequest = {
            // Name (hash) required for query
            chaincodeID: variables.dealChaincodeID,
            // Function to trigger
            fcn: "getDeal_byID",
            // Parameters for the query function
            args: [req.params.dealId]
        };
        console.log(queryRequest);
        // Query the request from the user object and get the deal details from chaincode.
        chain.getUser(req.session.username, function(err, user) {
            if (err) throw Error("/tcm/deals: Failed to register and enroll" + req.session.username + ": " + err);
            userObj = user;
        })
        var queryTx = userObj.query(queryRequest);
        queryTx.on('complete', function(results) {
            // Query completed successfully
            console.log("/tcm/deals: Successfully queried  chaincode function: request=%j, value=%s \n", queryRequest, results.result.toString());
            var x = JSON.parse(results.result.toString());
            console.log(x)
            res.json(x);
        });
        queryTx.on('error', function(err) {
            // Query failed
            console.log("/tcm/deals: Failed to query chaincode, function: request=%j, error=%j \n", queryRequest, err);
            res.json(err);
        });
    });

    // Fetching transactions by Deal ID from chaincode after logging into hyperledger network
    // Input: deal ID(req.params.dealId)
    // Output: List of Transactions by deal ID from chaincode
    app.get("/tcm/deal/transactions/:dealId", multipartMiddleware, function(req, res, next) {
        console.log("/tcm/deal/transactions/: Fetching transactions list by deal ID: " + req.params.dealId);
        // Construct the Query request
        var queryRequest = {
            // Name (hash) required for query
            chaincodeID: variables.dealChaincodeID,
            // Function to trigger
            fcn: "getTransaction_ByDealID",
            // Parameters for the query function
            args: [req.params.dealId]
        };
        console.log(queryRequest);
        // Query the request from the user object and get the deal details from chaincode.
        chain.getUser(req.session.username, function(err, user) {
            if (err) throw Error("/tcm/deal/transactions/: Failed to register and enroll" + req.session.username + ": " + err);
            userObj = user;
        })
        var queryTx = userObj.query(queryRequest);
        queryTx.on('complete', function(results) {
            // Query completed successfully
            console.log("/tcm/deal/transactions/: Successfully queried  chaincode function: request=%j, value=%s \n", queryRequest, results.result.toString());
            var x = JSON.parse(results.result.toString());
            console.log(x)
            res.json(x);
        });
        queryTx.on('error', function(err) {
            // Query failed
            console.log("/tcm/deal/transactions/: Failed to query chaincode, function: request=%j, error=%j \n", queryRequest, err);
            res.json(err);
        });
    });


    // Fetching Deals by Pledger from chaincode after logging into hyperledger network
    // Input: logged in user(req.session.username) 
    // Output: deal and related transactions by Pledger from chaincode
    app.get("/tcm/deals/dealsByPledger", multipartMiddleware, function(req, res, next) {
        console.log("/tcm/deals/dealsByPledger: Fetching deal details by Pledger: " + req.session.username);
        // Construct the Query request
        var queryRequest = {
            // Name (hash) required for query
            chaincodeID: variables.dealChaincodeID,
            // Function to trigger
            fcn: "getDeal_byPledger",
            // Parameters for the query function
            args: [req.session.username]
        };
        console.log(queryRequest);
        // Query the request from the user object and get the deal details from chaincode.
        chain.getUser(req.session.username, function(err, user) {
            if (err) throw Error("/tcm/deals/dealsByPledger: Failed to register and enroll" + req.session.username + ": " + err);
            userObj = user;
        })
        var queryTx = userObj.query(queryRequest);
        queryTx.on('complete', function(results) {
            // Query completed successfully
            console.log("/tcm/deals/dealsByPledger: Successfully queried  chaincode function: request=%j, value=%s \n", queryRequest, results.result.toString());
            var x = JSON.parse(results.result.toString());
            console.log(x)
            res.json(x);
        });
        queryTx.on('error', function(err) {
            // Query failed
            console.log("/tcm/deals/dealsByPledger: Failed to query chaincode, function: request=%j, error=%j \n", queryRequest, err);
            res.json(err);
        });
    });
    
    // Fetching Deals by Pledgee from chaincode after logging into hyperledger network
    // Input: logged in user(req.session.username) 
    // Output: deal and related transactions by Pledgee from chaincode
    app.get("/tcm/deals/dealsByPledgee", multipartMiddleware, function(req, res, next) {
        console.log("/tcm/deals/dealsByPledgee: Fetching deal details by Pledgee: " + req.session.username);
        // Construct the Query request
        var queryRequest = {
            // Name (hash) required for query
            chaincodeID: variables.dealChaincodeID,
            // Function to trigger
            fcn: "getDeal_byPledgee",
            // Parameters for the query function
            args: [req.session.username]
        };
        console.log(queryRequest);
        // Query the request from the user object and get the deal details from chaincode.
        chain.getUser(req.session.username, function(err, user) {
            if (err) throw Error("/tcm/deals/dealsByPledgee: Failed to register and enroll" + req.session.username + ": " + err);
            userObj = user;
        })
        var queryTx = userObj.query(queryRequest);
        queryTx.on('complete', function(results) {
            // Query completed successfully
            console.log("/tcm/deals/dealsByPledgee: Successfully queried  chaincode function: request=%j, value=%s \n", queryRequest, results.result.toString());
            var x = JSON.parse(results.result.toString());
            console.log(x)
            res.json(x);
        });
        queryTx.on('error', function(err) {
            // Query failed
            console.log("/tcm/deals/dealsByPledgee: Failed to query chaincode, function: request=%j, error=%j \n", queryRequest, err);
            res.json(err);
        });
    });

    // Fetching deals details and securities from chaincode after logging into hyperledger network
    // Input: dealID(req.query.dealId),username(req.query.username)and role(req.query.role)
    // Output: deal details and securities from chaincode
    app.get("/tcm/securities", multipartMiddleware, function(req, res, next) {
        console.log('/tcm/securities: Fetching allocation history');
        // code to be written
    });
    // Fetching users from DB according to their role
    // Input: roleName(req.params.role)
    // Output: User records with the same role as requested
    app.post("/tcm/users", multipartMiddleware, function(req, res, next) {
        console.log('/tcm/users: Fetching Users by Role ' + req.query.role);
        // Connecting to DB
        MongoClient.connect(variables.url, function(err, db) {
            console.log("Connected to DB")
            if (err) throw err;
            var collection = db.collection('users');
            collection.findOne({
                username: req.query.role
            }, function(err, result) {
                if (result != null) {
                    res.json({
                        result
                    })
                } else {
                    var msg = "User record not found for role " + req.query.role;
                    res.json({
                        message: msg
                    });
                }
            });
        });
    });
    // Searching deals according to search criteria
    // Input: search criteria(req.query.searchCriteria)
    // Output: deals and related transactions based on search criteria
    app.post("/tcm/deals/search", multipartMiddleware, function(req, res, next) {
        console.log('/tcm/deals: Searching deals according to ' + req.body);
        var args = [req.body];
        console.log("args: " + args);
        // Construct the Invoke request
        var invokeRequest = {
            // Name (hash) required for invoke
            chaincodeID: variables.dealChaincodeID,
            // Function to trigger
            fcn: "get_AllDeal",
            // Parameters for the invoke function
            args: args
        };
        console.log(invokeRequest);
        // Invoke the request from the user object and wait for events to occur.
        chain.getUser(req.session.username, function(err, user) {
            if (err) throw Error("/tcm/deals: Failed to register and enroll" + req.session.username + ": " + err);
            userObj = user;
        })

        var tx = userObj.invoke(invokeRequest);
        var transHash;
        // Listen for the 'submitted' event
        tx.on('submitted', function(results) {
            console.log("/tcm/deals: submitted invoke: %j", results);
            //      callback(results);
        });
        // Listen for the 'complete' event.
        tx.on('complete', function(results) {
            console.log("/tcm/deals: completed invoke: %j", results);
            transHash = results.result;
            //res.json(results)
            //      callback(results);
        });
        // Listen for the 'error' event.
        tx.on('error', function(err) {
            console.log("/tcm/deals: error on invoke: %j", err);
            res.json(err)
            //callback(err);
        });
        var regid = eh.registerChaincodeEvent(variables.accountChaincodeID, "evtsender", function(event) {
            console.log("/tcm/deals: Custom event received, payload: %j\n", event.payload.toString());
            eh.unregisterChaincodeEvent(regid);
            var x = JSON.parse(event.payload.toString());
            x.transHash = transHash;
            //console.log(x.accountId);
            res.json(x);

        });
        var regid1 = eh.registerChaincodeEvent(variables.accountChaincodeID, "errEvent", function(event) {
            console.log("/tcm/deals: Custom Error event received, payload: %j\n", event.payload.toStrifng());
            eh.unregisterChaincodeEvent(regid1);
            var x = JSON.parse(event.payload.toString());
            x.transHash = transHash;
            //console.log(x.accountId);
            res.json(x);

        });
    });

    // Fetching securities for a deal after logging into hyperledger network
    // Input: dealId(req.query.dealId)
    // Output: deal details and securities
    app.get("/tcm/securities", multipartMiddleware, function(req, res, next) {
        console.log('/tcm/securities: Fetching securities for a deal');
        var args = [req.query.dealId];
        console.log("args: " + args);
        var queryRequest = {
            // Name (hash) required for query
            chaincodeID: variables.dealChaincodeID,
            // Function to trigger
            fcn: "get_AllDeal",
            // Existing state variable to retrieve
            args: args
        };
        chain.getUser(req.session.username, function(err, user) {
            if (err) throw Error("/tcm/securities: Failed to register and enroll" + req.session.username + ": " + err);
            userObj = user;
        })
        // Trigger the query transaction
        var queryTx = userObj.query(queryRequest);
        queryTx.on('complete', function(results) {
            // Query completed successfully
            console.log("/tcm/securities: Successfully queried  chaincode function: request=%j, value=%s \n", queryRequest, results.result.toString());
            var x = JSON.parse(results.result.toString());
            console.log(x)
            res.json(x);
        });
        queryTx.on('error', function(err) {
            // Query failed
            console.log("/tcm/securities: Failed to query chaincode, function: request=%j, error=%j \n", queryRequest, err);
            res.json(err);
        });
    });
    // Fetching segregated account of a user from DB
    // Input: account holder name(req.query.username) and role(req.query.role)
    // Output: List of all segregated accounts of a user
    app.get("/tcm/accounts", multipartMiddleware, function(req, res, next) {
        console.log('/tcm/accounts: Fetching Segregated Account for user: ' + req.query.username);
        console.log(req.query.username);
        console.log(req.query.role);
        MongoClient.connect(variables.url, function(err, db) {
            console.log("connected to DB")
            if (err) throw err;
            //console.log(req.body.username)
            var collection = db.collection('users');
            collection.findOne({
                username: req.query.username,
                role: req.query.role
            }, function(err, result) {
                if (err) {
                    res.json(err);
                } else if (result != null) {
                    res.json(result);
                } else {
                    res.json({
                        message: req.query.username + " record not found."
                    });
                }
            });
        });
    });
    // Adding deals to an account
    // Input: deals List(req.body.deal)
    // Output: Transaction hash of adding deals to an account
    app.post("/tcm/deals/addDeal", multipartMiddleware, function(req, res, next) {
        console.log('/tcm/deals/addDeal: Adding deals');
        console.log(req.session.username);
        //console.log(req);
        console.log(req.body.deal)
        var args = JSON.parse(req.body.deal);
        console.log("args: " + args);
        // Construct the Invoke request
        var invokeRequest = {
            // Name (hash) required for invoke
            chaincodeID: variables.dealChaincodeID,
            // Function to trigger
            fcn: "create_transaction",
            // Parameters for the invoke function
            args: args
        };
        console.log(invokeRequest);
        // Fetching user info from chain
        chain.getUser(req.session.username, function(err, user) {
            if (err) throw Error("/tcm/deals/addDeal: Failed to register and enroll" + req.session.username + ": " + err);
            userObj = user;
        })

        // Invoke the request from the user object and wait for events to occur.
        var tx = userObj.invoke(invokeRequest);
        var transHash;
        // Listen for the 'submitted' event
        tx.on('submitted', function(results) {
            console.log("/tcm/deals/addDeal: submitted invoke: %j", results);
        });
        // Listen for the 'complete' event.
        tx.on('complete', function(results) {
            console.log("/tcm/deals/addDeal: completed invoke: %j", results);
            transHash = results.result;;
        });
        // Listen for the 'error' event.
        tx.on('error', function(err) {
            console.log("/tcm/deals/addDeal: error on invoke: %j", err);
            res.json(err)
        });
        var regid = eh.registerChaincodeEvent(variables.accountChaincodeID, "evtsender", function(event) {
            console.log("/tcm/deals/addDeal: Custom event received, payload: %j\n", event.payload.toString());
            eh.unregisterChaincodeEvent(regid);
            var x = JSON.parse(event.payload.toString());
            x.transHash = transHash;
            res.json(x);
        });
        var regid1 = eh.registerChaincodeEvent(variables.accountChaincodeID, "errEvent", function(event) {
            console.log("/tcm/deals/addDeal: Custom Error event received, payload: %j\n", event.payload.toString());
            eh.unregisterChaincodeEvent(regid1);
            var x = JSON.parse(event.payload.toString());
            x.transHash = transHash;
            res.json(x);
        });
    });
    // Fetching all account holders from the chain
    // Input: NA
    // Ouptu: List of all accounts holders in a chain
    app.get("/tcm/users", multipartMiddleware, function(req, res, next) {
        console.log('/tcm/users: Fetching All account holders from chain');
        var queryRequest = {
            // Name (hash) required for query
            chaincodeID: variables.accountChaincodeID,
            // Function to trigger
            fcn: "get_AllAccount",
            // Existing state variable to retrieve
            args: [" "]
        };
        chain.getUser(req.session.username, function(err, user) {
            if (err) throw Error("/tcm/users: Failed to register and enroll" + req.session.username + ": " + err);
            userObj = user;
        })
        // Trigger the query transaction
        var queryTx = userObj.query(queryRequest);
        queryTx.on('complete', function(results) {
            // Query completed successfully
            console.log("/tcm/users: Successfully queried  chaincode function: request=%j, value=%s \n", queryRequest, results.result.toString());
            var x = JSON.parse(results.result.toString());
            console.log(x)
            res.json(x);
        });
        queryTx.on('error', function(err) {
            // Query failed
            console.log("/tcm/users: Failed to query chaincode, function: request=%j, error=%j \n", queryRequest, err);
            res.json(err);
        });
    });
    // Fetching All user accounts from DB
    // Input: username(req.params.username)
    // Output: List of all accounts from DB
    app.get("/tcm/users/accounts/:username", multipartMiddleware, function(req, res, next) {
        console.log('/tcm/users/accounts/: Fetching all User Accounts');
        console.log(req.params.username)
        MongoClient.connect(variables.url, function(err, db) {
            console.log("connected to DB")
            if (err) throw err;
            var collection = db.collection('users');
            collection.findOne({
                username: req.params.username
            }, function(err, result) {
                if (result != null) {
                    console.log(result);
                    res.json(result);
                } else {
                    console.log(result);
                    res.json({
                        message: "Error while Fetching all user accounts."
                    });
                }
            });
        });
    });
    // Starting Allocation of a deal
    // Input: deal details(req.body.deal_details)
    // Output: Deal status of the deal.
    app.post("/tcm/deals/allocate", multipartMiddleware, function(req, res, next) {
        console.log('/tcm/deals/allocate: Starting allocation of a deal.');
        var deal = JSON.stringify(req.body.deal_details);
        var args = [deal];
        console.log("deal: " + deal);
        var queryRequest = {
            // Name (hash) required for query
            chaincodeID: variables.dealChaincodeID,
            // Function to trigger
            fcn: "start_allocation",
            // Existing state variable to retrieve
            args: args
        };
        chain.getUser(req.session.username, function(err, user) {
            if (err) throw Error("/tcm/deals/allocate: Failed to register and enroll" + req.session.username + ": " + err);
            userObj = user;
        })

        // Trigger the query transaction
        var queryTx = userObj.query(queryRequest);
        queryTx.on('complete', function(results) {
            // Query completed successfully
            console.log("/tcm/deals/allocate: Successfully queried  chaincode function: request=%j, value=%s \n", queryRequest, results.result.toString());
            var x = JSON.parse(results.result.toString());
            console.log(x)
            res.json(x);
        });
        queryTx.on('error', function(err) {
            // Query failed
            console.log("/tcm/deals/allocate: Failed to query chaincode, function: request=%j, error=%j \n", queryRequest, err);
            res.json(err);
        });
    });
    // Fetching securities Market Data from DB
    // Input: Security ID(req.query.securityId) and timestamp(req.query.timestamp)
    // Output: Latest Security market data by security ID
    app.get("/tcm/securities/market/", multipartMiddleware, function(req, res, next) {
        console.log('/tcm/securities/market/: Fetching latest securities market data');
        MongoClient.connect(variables.url, function(err, db) {
            console.log("connected to DB")
            if (err) throw err;
            //console.log(req.body.username)
            var collection = db.collection('Security_Market_Data');
            collection.findOne({
                securityId: req.query.securityId,
                timestamp: req.query.timestamp
            }, function(err, result) {
                if (result != null) {
                    res.json(result);
                } else {
                    res.json({
                        message: "Error while Fetching Security Market Data."
                    });
                }
            });
        });
    });

}