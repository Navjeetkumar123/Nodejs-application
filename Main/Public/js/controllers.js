function dashboardController($scope, $rootScope, $location, $http, $window) {
    console.log("dashboardController");
    $rootScope.dashboard = "Dashboard";
    $scope.username;
    $scope.role;
    // Setting user data into variables after fetching data from session
    $http.get("/tcm/user/getUsername").success(function(data) {
        //console.log("Username fetched");
        $scope.username = data.username;
        $scope.role = data.Role;
        //console.log($scope.role);
        //console.log($scope.username);
    }).error(function(data) {
        console.log("Error while fetching user data.");
    });
    // Fetching deals by user
    $http({
        url:'/tcm/deals/user',
        method: 'GET',
    }).success(function(data) {
        $scope.marginCallList = data;
        //console.log($scope.marginCallList);
    });
    // starting allocation for deals
    $scope.startAllocation = function(deal) {

        //console.log("startAllocation for :" + deal);
        $http.post('/tcm/deals/allocate', deal).success(function(data) {
            console.log("data: " + data);
        });
    }

    $scope.checkAll = function(){
        angular.forEach($scope.marginCallList, function(marginCall){
            if (marginCall.allocationStatus == 'Allocation Successful') {
                marginCall.select = $scope.selectAll;
            };
        });
    };

}

function submitAllocationController($scope, $rootScope, $location, $http, $window) {
    $rootScope.dashboard = "Submit Allocation Request";
    console.log("submitAllocationController");
    
    $scope.submitFile = function() {
        console.log("submitFile");
        var file = $scope.myFile;
        var fd = new FormData();
        fd.append('file', file);
        var fileName = file.name;
        var extn = fileName.substr(fileName.lastIndexOf('.') + 1);
        if (extn != "csv") {
            alert("Invalid file format.")
            return;
        }
        var request = {
            method: 'POST',
            url: '/validateFile',
            data: fd,
            //transfrom request is very necesssary if using express
            transformRequest: angular.identity,
            headers: {
                'Content-Type': undefined
            }
        };
        $http(request).success(function(result) {
            console.log(result);
            if(result.message == "Invalid"){
                alert("Invalid file content.");
            } else if (result.message == "Valid") {
                for (var i in result.data) {
                    //console.log(result.data[i])
                    //creating deal one by one after validating input file
                    var fd = new FormData();
                    fd.append('deal', JSON.stringify(result.data[i]));
                    var request = {
                        method: 'POST',
                        url: '/tcm/deals/addDeal',
                        data: fd,
                        //transfrom request is very necesssary if using express
                        transformRequest: angular.identity,
                        headers: {
                            'Content-Type': undefined
                        }
                    };
                    $http(request).success(function(result) {
                        console.log(result);
                    })
                };
                //console.log(JSON.stringify(result.data));
            }
            //$window.location.reload();
        })
    }
}

function transactionHistoryController($scope, $rootScope, $location, $http, $window) {
    $rootScope.dashboard = "Transaction History";

    console.log("transactionHistoryController");



    $scope.sub_transcation_history2 = function() {

        console.log("sub_transcation_history2");
        $location.url('/transact_history2');

        var fd = new FormData();
        fd.append('dealId', $scope.dealId);
        fd.append('currency', $scope.currency);
        fd.append('pledger', $scope.pledger);
        fd.append('pledgee', $scope.pledgee)
        console.log($scope.dealId);
        console.log($scope.currency);
        console.log($scope.pledger);
        console.log($scope.pledgee);
        var request = {
            method: 'POST',
            url: '/submitTransactionHistory',
            data: fd,
            transformRequest: angular.identity,
            headers: {
                'Content-Type': undefined
            }
        }
        $http(request)
        .success(function(data) {

            $location.url("/");

        })
        $http.get("/get_transaction_hist2_dealData").success(function(data) {
            $scope.transaction_history_TableData_2 = [{
                "dealId": "Deal_ID",
                "pledger": "Pledger",
                "pledgee": "Pledgee",
                "rqv": "RQV",
                "currency": "USD",
                "marginCallDate": "13-10-2017",
                "dealStatus": "approve",
                "applicationStatus": "reject"
            }]
        });
    }

    $scope.sub_transcation_history3 = function() {
        $http.get("/Get_transaction_hist3_dealData").success(function(data) {
            $scope.transaction_hist_Dealtable_3 = {
                "dealId": "Deal_ID",
                "pledger": "Pledger",
                "pledgerLongboxAcc": "11000345",
                "pledgee": "Pledgee",
                "pledgeeSegAcc": "1187800034",
            }

        });
        $http.get("/Get_transaction_hist3_security_data").success(function(data) {
            $scope.transaction_history_TableData_3 = [{
                "security": "Security",
                "secId": "Security id_123",
                "type": "longbox",
                "quantity": "1300",
                "collForm": "Form",
                "mtm": "MTM",
                "mrginCallDate": "10-5-2017",
                "valuation": "80",
                "effValue": "10,000",
                "totalValue": "INR",
                "currency": "USD"
            }]
        });

        $location.url('/transact_history3');

    }

}

function viewAccDetailsController($scope, $rootScope, $location, $http, $window) {
    $rootScope.dashboard = "View Account Details";
    console.log("viewAccDetailsController");

    // Fetching account holders list from chain
    $scope.accountHolders = [];
    $http.get("/tcm/users").success(function(data) {
        //console.log(data);
        for (var i in data) {
            //console.log(data[i].accountName)
            $scope.accountHolders.push(data[i].accountName);
        }
        console.log($scope.accountHolders)
    });
    // Fetching lonbox account details
    // Input: lonbox accountNumber(accountNumber)
    // Ouput: account details
    $scope.viewLongboxAccDetails = function(accountNumber) {
        console.log("viewLongboxAccDetails");
        $scope.security=[]
        $http.get("/tcm/accounts/"+ accountNumber).success(function(data) {
            console.log(data);
            for(var i in data){
               $scope.viewAcc_holder_details = data[i];
               $scope.security.push(data[i].securities.split(','));
               console.log($scope.security); 

            }
            console.log($scope.viewAcc_holder_details);
        });
        console.log($scope.security);         
        console.log($scope.viewAcc_holder_details);
        $location.url('/viewAccountdetails2');
    }
    // Fetching account details by account holder name
    $scope.viewAccDetails = function(accountHolderName) {
        console.log("viewAccDetails");
        $scope.segregatedDetails = []
        accHolderName = $scope.selectedItem;
        console.log(accHolderName);
        $http.get("/tcm/accounts/account/"+ accHolderName).success(function(data) {
            //console.log(data);
            for (var i in data) {
                //console.log(data[i]);
                if(data[i].accountType == "Longbox")
                {
                    $scope.longBoxDetails = data[i];
                } else if(data[i].accountType == "Segregated"){
                    $scope.segregatedDetails.push(data[i]);
                }
            };
            console.log($scope.longBoxDetails);
            console.log($scope.segregatedDetails);
        });
        //$location.url('/viewAccountdetails2');
    }
    $scope.viewSegAccDetails = function(accountNumber) {
        console.log("viewSegAccDetails");
        $http.get("/tcm/accounts/"+ accountNumber).success(function(data) {
            console.log(data);
            for(var i in data){
               $scope.transaction_history_TableData_3 = data[i];
            }
        });
        $http.get("/get_Acc_security_data").success(function(data) {
            $scope.transaction_history_TableData_3 = [{
                "security": "Security",
                "secId": "Security id_123",
                "type": "longbox",
                "quantity": "1300",
                "collForm": "Form",
                "mtm": "MTM",
                "mrginCallDate": "10-5-2017",
                "valuation": "80",
                "effValue": "10,000",
                "totalValue": "INR",
                "currency": "USD"
            }]
        });
        $location.url('/viewAccountdetails3');
    }
    /*$http.get("/get_longbox_accountDetails").success(function(data) {
        $scope.accountDetailsTable_1 = {
            "longboxAccNo": "110003384",
            "longboxAccBal": "1,00000",
            "currency": "USD"

        }
    });
    $http.get("/get_seg_acc_details").success(function(data) {
        $scope.accountDetailsTable_2 = [{
            "segAccNo": "110003384",
            "segAccBal": "1,00000",
            "currency": "USD",
            "pledger": "ABC Bank"

        }]
    });
*/

}

function homeController($scope, $location, $rootScope, $http, $window) {
    console.log("homeController");
    $rootScope.dashboard = "Home";
    $scope.username;
    $scope.role;
    // Setting user data into variables after fetching data from session
    $http.get("/tcm/user/getUsername").success(function(data) {
        //console.log("Username fetched");
        $scope.username = data.username;
        $scope.role = data.Role;
        //console.log($scope.role);
        //console.log($scope.username);
        $scope.getUserDetails($scope.username);
    }).error(function(data) {
        console.log("Error while fetching user data.");
    });

    // Fetching user details from DB
    $scope.getUserDetails = function(username) {
        //console.log(username);
        $http.get("/tcm/user/" + username).success(function(data) {
            //console.log(data);
            $scope.bankRecord = data;
            $scope.getAccountDetails(data.LongBoxAccountNumber);
        });
    }
    // Fetching account details by account number from chaincode
    $scope.getAccountDetails = function(accountNumber) {
        //console.log(accountNumber);
        $http.get("/tcm/accounts/" + accountNumber).success(function(data) {
            //console.log(data);
            $scope.currency = data[accountNumber].currency;
            $scope.LongBoxAccountBalance = data[accountNumber].totalValue
        });
    }
    // Fetching number of pending collateral
    /*$http.get("/tcm/deals/pending").success(function(data) {
        console.log(data)
        console.log(data.length)
        $scope.count = 6;
    });*/
    // Fetching details of pending collateral
    /*$scope.viewPendingMarginCall = function() {
        $http.get("/tcm/deals/pending").success(function(data) {
            console.log(data)
            for (var i in data) {
                $scope.pendingMarginCalls = data[i]
            };
            $scope.pendingMarginCalls = [{
                "transactionId": "123456789A001",
                "dealId": "123456790",
                "pledgee": "XYZ Bank",
                "rqv": "10000.00",
                "currency": "USD",
                "marginCallDate": "13/10/2017",
                "transactionStatus": "Matched"
            }]

        });

        $location.url('/p_pendingRequest');
    }*/
}

function myLongboxAccController($scope, $location, $http, $rootScope, $window) {
    //console.log("myLongboxAccController");
    $rootScope.dashboard = "My Longbox Account";
    $scope.securities=[];
    var longBoxAccountNumber;
    $scope.username;
    $scope.role;
    $scope.submitFile = function() {
        var file = $scope.myFile;
        var fd = new FormData();
        fd.append('file', file);
        var fileName = file.name;
        var extn = fileName.substr(fileName.lastIndexOf('.') + 1);
        if (extn != "csv") {
            alert("Invalid file format")
            return;
        }
        var request = {
            method: 'POST',
            url: '/validateSecurityFile',
            data: fd,
            //transfrom request is very necesssary if using express
            transformRequest: angular.identity,
            headers: {
                'Content-Type': undefined
            }
        };
        $http(request).success(function(result) {
            console.log(result);
            if (result.message == "Valid") {
                addSecurity(result.data);
            };
        }).error(function(){
            alert("Error while validating security input file");
            return;
        });
        
    }

    $scope.uploadFile = function() {
        //console.log("uploadFile");
        $location.url('/p_addSecurity');
    }
    function addSecurity(security_data){
        
        //console.log(security_data);
        var fd = new FormData();
        fd.append('security', security_data);
        fd.append('longBoxAccount', longBoxAccountNumber);
        var request = {
            method: 'POST',
            data: fd,
            url: '/tcm/accounts/securities',
            //transfrom request is very necesssary if using express
            transformRequest: angular.identity,
            headers: {
                'Content-Type': undefined
            }
        };
        $http(request).success(function(result) {
            console.log(result);
            
        }).error(function(){
            alert("Error while validating security input file");
            return;
        });
    }
    // Fetching user data from session and storing into variables.
    $http.get("/tcm/user/getUsername").success(function(data) {
        //console.log("Username fetched");
        $scope.username = data.username;
        $scope.role = data.Role;
        //console.log($scope.username);
        //  console.log($scope.role);
        // fetching user data from DB
        $http.get("/tcm/users/accounts/" + $scope.username).success(function(data) {
            //console.log($scope.username);
            //console.log(data);
            var securityId;
            longBoxAccountNumber = data.LongBoxAccountNumber;
            // Fetching longbox account details from chaincode
            $http.get("/tcm/accounts/" + longBoxAccountNumber).success(function(accountData) {
                //console.log(accountData)
                for (var i in accountData) {
                    $scope.longBoxRecord = accountData[i];
                    //console.log($scope.longBoxRecord);
                    //console.log(accountData[i].securities);
                    //security.push(accountData[i].securities.split(','));
                    //console.log(security);
                    // Fetching security details of a longbox account
                    $http.get("/tcm/accounts/security/" + longBoxAccountNumber).success(function(securityData) {
                        //console.log(securityData);
                        if (securityData.code == "503") {
                            //console.log(securityData.message);
                            alert("No securities found for selected account.");
                        }else{
                            for(var k in securityData){
                                //console.log(securityData[k])
                                $scope.securities.push(securityData[k]);
                                //console.log($scope.securities);
                            }
                        }
                    }).error(function() {
                        alert("Error while fetching securities from longBoxAccount.Please retry.")
                    });
                };
            }).error(function() {
                alert("Error while fetching longBoxAccount details.Please retry.")
            });
        });
    }).error(function(data) {
        console.log("Error while fetching user data.");
    });
    
}

function mySegAccController($scope, $rootScope, $location, $http, $window) {
    //console.log("mySegAccController");
    $rootScope.dashboard = "My Segregated Account";
    $scope.segAccRecord = [];
    $scope.securities=[];
    $scope.username;
    $scope.role ;
    // Fetching user data from session and storing into variables.
    $http.get("/tcm/user/getUsername").success(function(data) {
        //console.log("Username fetched");
        $scope.username = data.username;
        $scope.role = data.Role;
        //console.log($scope.username);
        //console.log($scope.role);
        // Fetching user details from DB
        $http.get("/tcm/users/accounts/" + $scope.username).success(function(data) {
            //console.log(data);
            for( var i in data.SegregatedAccountNumber){
                var segregatedAccountNumber = data.SegregatedAccountNumber[i];
                //console.log(segregatedAccountNumber);
                //Fetching segregated account details from chain
                $http.get("/tcm/accounts/" + segregatedAccountNumber).success(function(accountData) {
                   // console.log(accountData)
                    if (accountData.code == "503") {
                        //console.log(accountData.message);
                        //alert(accountData.message);
                    }else{
                        for (var i in accountData) {
                            $scope.segAccRecord.push(accountData[i]);
                            //console.log($scope.segAccRecord);
                            //console.log(accountData[i].securities);
                        }
                    }
                }).error(function() {
                    alert("Error while fetching segregated Account details.Please retry.");
                });
            }
        });
    }).error(function(data) {
        console.log("Error while fetching user data.");
    });

    $rootScope.segAccount2_table2 = [];
    $scope.securities = [];
    // Fetching selected segregated account's details from chain
    $scope.viewSegAccDetails = function(accountNumber) {
        console.log("viewSegAccDetails");
        $http.get("/tcm/accounts/" + accountNumber).success(function(accountData) {
            console.log(accountData)
            for (var i in accountData) {
                //console.log(accountData[i]);
                $rootScope.segAccount2_table2=accountData[i];
                
            }
        }).error(function() {
            alert("Error while fetching segregated Account details.Please retry.");
        });
        // Fetching security details of a segregated account
        $http.get("/tcm/accounts/security/" + accountNumber).success(function(securityData) {
            console.log(securityData);
            if (securityData.code == "503") {
                //console.log(securityData.message)
                alert("securities not found");
            }else{
                for(var k in securityData){
                    console.log(securityData[k])
                    $scope.securities.push(securityData[k]);
                    console.log($scope.securities);
                }
            }
            $location.url('/p_SegAcc2');
        }).error(function() {
            alert("Error while fetching securities from segregated Account.Please retry.")
        });
    }
}

function mySegAccController2($scope, $rootScope, $location, $http, $window) {
    //console.log("mySegAccController2");
    //console.log($rootScope.segAccount2_table2)
}
function allocationHistoryController($scope, $rootScope, $location, $http, $window) {
    $rootScope.dashboard = "Allocation History";
    $http.get("/get_alloc_hist_table").success(function(data) {
        $scope.alloc_hist_table = [{
            "dealId": "Deal_ID",
            "pledgee": "Pledgee",
            "rqv": "RQV",
            "currency": "USD",
            "issueDate": "13-10-2017",
            "dealStatus": "approve",
            "allocationStatus": "reject"
        }]

    });
    $scope.submitAllocationHistory2 = function() {
        console.log("submitAllocationHistory2");
        $http.get("/get_alloc_hist2_deal_data").success(function(data) {
            $scope.alloc_Dealhist_table = {
                "dealId": "Deal_ID",
                "pledgee": "Pledgee",
                "pledgeeSegAcc": "1100000344",
                "rqv": "RQV",
                "currency": "USD",
            }
        });
        $http.get("/get_alloc_hist2_security_data").success(function(data) {
            $scope.alloc_hist_table_2 = [{
                "security": "Security",
                "secId": "Security id_123",
                "type": "longbox",
                "quantity": "1300",
                "collForm": "Form",
                "mtm": "MTM",
                "valuation": "80",
                "effValue": "10,000",
                "totalValue": "INR",
                "currency": "USD"
            }]

        });


        $location.url('/p_allocationHistory2');
    }
}

function myTransactionController($scope, $rootScope, $location, $http, $window) {
    $rootScope.dashboard = "My Transaction";
    var deals=[];
    //var $scope.counterparties=[];
    $scope.radio = function (bool)
    {
        console.log(bool);
        document.getElementById("radio3").checked = false;
        document.getElementById("radio4").checked = false;
        document.getElementById("radio3").disabled = bool;
        document.getElementById("radio4").disabled = (!bool); 
    }
   $scope.radioChange1=function()
    {
      //console.log("abcd");
      if(document.getElementById("radio1").checked == true)
      {
        document.getElementById("radio4").checked = true;
          
      }
    }
    $scope.radioChange2=function()
    {
        if(document.getElementById("radio2").checked == true)
        {
            document.getElementById("radio3").checked = true;
        }
    }
    if ($scope.user == "Pledger") {
        // Fetching All deals by Pledger
        $http.get("/tcm/deals/dealsByPledger").success(function(dealData) {
            console.log(dealData);
            if (dealData.code == "503") {
                console.log(dealData.message)
                alert(dealData.message);
            }else{
                for(var k in dealData){
                    console.log(dealData[k])
                    deals.push(dealData[k]);
                    console.log(deals);
                    getTransactionsByDealID(dealData[k]);
                }
            }
        }).error(function() {
            alert("Error while fetching Deals By Pledger.Please retry.")
        });
    }else if ($scope.user == "Pledgee") {
        // Fetching deals by Pledgee
            $http.get("/tcm/deals/dealsByPledgee").success(function(dealData) {
                console.log(dealData);
                if (dealData.code == "503") {
                    console.log(dealData.message)
                    alert(dealData.message);
                }else{
                    for(var k in dealData){
                        console.log(dealData[k])
                        deals.push(dealData[k]);
                        console.log(deals);
                        getTransactionsByDealID(dealData[k]);
                    }
                }
            }).error(function() {
                alert("Error while fetching Deals By Pledgee.Please retry.")
            });
    }
    
    // Fetching transactions by Deal ID and stroing currencies for the logged in user
    getTransactionsByDealID = function(dealId){
        console.log(dealId);
        $http.get("/tcm/deal/transactions/" + dealId).success(function(result) {
            console.log(result);
            if(result != null){
                for(var k in result){
                    console.log(result[k].currency)
                    $scope.currencies.push(result[k].currency);
                    console.log($scope.currencies);
                    if ($scope.user == "Pledger") {
                        $scope.counterparties.push(result[k].pledgee)
                    }else if ($scope.user == "Pledgee") {
                        $scope.counterparties.push(result[k].pledger)
                    }
                }
            }else{
                $scope.counterparty="No counterparty found."
            }
        }).error(function() {
            alert("Error while fetching transactions by Deal ID.Please retry.")
        });
    }

    $scope.submitMyTransaction2 = function() {
        var search = {};
        var dealIDs = [];
        console.log("submitMyTransaction");
        if ($scope.dealId != null) {
            $http.get("/tcm/deals/"+ $scope.dealId).success(function(data) {
                console.log(data);
                for(var i in data){
                   $scope.viewAcc_holder_details = data[i];
                   $scope.security.push(data[i].securities.split(','));
                   console.log($scope.security); 

                }
                console.log($scope.viewAcc_holder_details);
            });
        }
        if ($scope.transactionId != null) {
            // Fetching all deals from chaincode
            $http.get("/tcm/deals/search").success(function(data) {
                console.log(data);
                for(var i in data){
                   dealIDs.push(data[i]);
                   // Fetching transactions by dealID
                   $http.get("/tcm/deal/transactions/", dealIDs[i]).success(function(transactions) {
                        console.log(transactions);
                        for(var i in transactions){
                            if (transactions[i] == $scope.transactionId){ // i or transactions[i]
                                $scope.transaction = transactions[i];
                            }
                        }
                    }); 

                }
                console.log($scope.viewAcc_holder_details);
            });
        };
        // var fd = new FormData();
        // fd.append('user', $scope.user)
        // fd.append('c_role', $scope.c_role)
        // fd.append('transactionId', $scope.transactionId)
        // fd.append('dealId', $scope.dealId)
        // fd.append('counterparty', $scope.counterparty)
        // fd.append('currency', $scope.currencyList)
        console.log($scope.user);
        console.log($scope.c_role);
        console.log($scope.transactionId);
        console.log($scope.dealId);
        console.log($scope.counterparty);
        console.log($scope.currencyList);
        search['user']= $scope.user;
        search['c_role']=$scope.c_role;
        search['transactionId']=$scope.transactionId;
        search['dealId']=$scope.dealId;
        search['counterparty']=$scope.counterparty;
        search['currency']=$scope.currencyList;
        console.log(search);

        $http.post('/tcm/deals/search', search).success(function(result) {
            if (result!= null) {
                $scope.myTransactionData = result;
                $location.url("/p_myTransaction2");
            }else{
                alert("No matching records found.")
            }
        })
        .error(function() {
            alert('Error in creation of instance. Try again.');
            console.log('data was not inserted successfully');
            $location.url("/p_myTransaction2");
        });
        // $location.url('/p_myTransaction2'); 
        $http.get("/get_trans_hist2_deal_data").success(function(data) {
            $scope.trans_hist_table = [{
                "dealId": "Deal_ID",
                "pledgee": "Pledgee",
                "rqv": "RQV",
                "currency": "USD",
                "issueDate": "13-10-2017",
                "dealStatus": "approve",
                "allocationStatus": "reject"
            }]
        });

    }


    $scope.submitMyTransaction3 = function() {
        console.log("submitMyTransaction3");
        $http.get("/get_trans_hist3_deal_data").success(function(data) {
            $scope.alloc_Dealhist_table = {
                "dealId": "Deal_ID",
                "pledgee": "Pledgee",
                "pledgeeSegAcc": "1100000344",
                "rqv": "RQV",
                "currency": "USD",
            }
        });
        $http.get("/get_trans_hist3_security_data").success(function(data) {
            $scope.alloc_hist_table_2 = [{
                "security": "Security",
                "secId": "Security id_123",
                "type": "longbox",
                "quantity": "1300",
                "collForm": "Form",
                "mtm": "MTM",
                "valuation": "80",
                "effValue": "10,000",
                "totalValue": "INR",
                "currency": "USD"
            }]
        });

        $location.url('/p_myTransaction3');
    }



}