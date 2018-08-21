const express = require('express');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const bodyParser = require('body-parser');    //used to extract the body from the incoming requests
const jwt = require('jsonwebtoken');
const ActiveDirectory = require('activedirectory');
const requestIp = require('request-ip');


const app = express();
const config = require('../webpack.config.js');
const compiler = webpack(config);


const authLogin = require('./controllers/auth/Login');
const authLoadpage = require('./controllers/auth/Loadpage');
const authLogout = require('./controllers/auth/Logout');
const authExpired = require('./controllers/auth/Expired');
const authMenu = require('./controllers/auth/Menu');

//Message
const message = require('./models/Services/Messsage');

//SDC
//--Sales
const CompanyConfig = require('./controllers/sdc/Sales/CompanyConfig');
const FinancialConfig = require('./controllers/sdc/Sales/FinancialCodeConfig')
const BankAccount = require('./controllers/sdc/Sales/BankAccount')
const Store = require('./controllers/sdc/Sales/Store')
const AccountCodeForSale = require('./controllers/sdc/Sales/AccountCode')
const BankInAdjustment = require('./controllers/sdc/Sales/BankInAdjustment')
const StampCloseDailyFins = require('./controllers/sdc/Sales/StampCloseDailyFins')

//--Inventory
const AccountCodeForInventory = require('./controllers/sdc/Inventory/AccountCodeForInventory')

//Report
//--SDC
//----Sales
const GenToken = require('./controllers/report/GenToken')

const status_type = require("./models/status_type");
const msg_type = require("./models/msg_type")
const settings = require("../settings");


// It extracts the data out of the request headers like the form data, etc,.
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
// parse request-ip
app.use(requestIp.mw())
// Tell express to use the webpack-dev-middleware and use the webpack.config.js
// configuration file as a base.
app.use(webpackDevMiddleware(compiler, {
  publicPath: config.output.publicPath
}));

app.use(function (req, res, next) {
  // res.header("Access-Control-Allow-Origin", settings.FontEndPath);
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "PUT, GET, POST, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization ");

  // Access-Control-Request-Headers: X-PINGOTHER, Content-Type
  // Access-Control-Request-Headers
  next();
});

//Login Page
app.post('/api/login', (req, res) => {
  console.log('login')
  authLogin.Login(req, res, req.body)
});

//Logout Page
app.post('/api/logout', verifyToken, (req, res) => {
  console.log('logout')
  
  jwt.verify(req.token, settings.secretkey, (err, authData) => {
    if (err) {      
      const data = {
        status: status_type.Unauthorized,
        Code: msg_type.CodeW0002,
      }
      authExpired.Expired(req, res, data)

    } else {      
      const user = authData.jwtdata
      authLogout.Logout(req, res, req.body, user);
    }
  })
});

//Load Page
app.post('/api/loadpage', verifyToken, (req, res) => {
  console.log('loadpage')
  jwt.verify(req.token, settings.secretkey, (err, authData) => {
    if (err) {     
      const data = {
        status: status_type.Unauthorized,
        Code: msg_type.CodeW0002,
      }
      authExpired.Expired(req, res, data)

    } else {
      const user = authData.jwtdata      
      authLoadpage.Loadpage(req, res, req.body, user);
    }
  })
})

//Menu Auth
app.get('/api/menuauth/:userid', (req, res) => {
  console.log('meunauth')
  authMenu.Menu(req, res, req.body)
});

//Get Company Setup
app.get('/api/companyconfig', (req, res) => {
  console.log('get_company')
  CompanyConfig.GetCompany(req, res, req.body);
})

//Add Company Setup
app.post('/api/companyconfig', verifyToken, (req, res) => {
  console.log('add_company')
  jwt.verify(req.token, settings.secretkey, (err, authData) => {
    if (err) {
      const data = {
        status: status_type.Unauthorized,
        Code: msg_type.CodeW0002,
      }
      authExpired.Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      CompanyConfig.AddCompany(req, res, req.body, user);
    }
  })
})

//Edit Company Setup
app.put('/api/companyconfig', verifyToken, (req, res) => {
  console.log('edit_company')
  jwt.verify(req.token, settings.secretkey, (err, authData) => {
    if (err) {
      const data = {
        status: status_type.Unauthorized,
        Code: msg_type.CodeW0002,
      }
      authExpired.Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      CompanyConfig.EditCompany(req, res, req.body, user);
    }
  })
})

//Delete Company Setup
app.delete('/api/companyconfig', verifyToken, (req, res) => {
  console.log('delete_companyconfig')
  jwt.verify(req.token, settings.secretkey, (err, authData) => {
    if (err) {
      const data = {
        status: status_type.Unauthorized,
        Code: msg_type.CodeW0002,
      }
      authExpired.Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      CompanyConfig.DeleteCompany(req, res, req.body, user);
    }
  })
})

//Get CompanyAccount Setup
app.get('/api/companyaccountconfig', (req, res) => {
  console.log('companyaccountconfig')
  CompanyConfig.GetCompanyAccount(req, res, req.body);
})

//Add CompanyAccount Setup
app.post('/api/companyaccountconfig', verifyToken, (req, res) => {
  console.log('add_companyaccountconfig')
  jwt.verify(req.token, settings.secretkey, (err, authData) => {
    if (err) {
      const data = {
        status: status_type.Unauthorized,
        Code: msg_type.CodeW0002,
      }
      authExpired.Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      CompanyConfig.AddCompanyAccount(req, res, req.body, user);
    }
  })
})

//Edit CompanyAccount Setup
app.put('/api/companyaccountconfig', verifyToken, (req, res) => {
  console.log('edit_companyaccountconfig')
  jwt.verify(req.token, settings.secretkey, (err, authData) => {
    if (err) {
      const data = {
        status: status_type.Unauthorized,
        Code: msg_type.CodeW0002,
      }
      authExpired.Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      CompanyConfig.EditCompanyAccount(req, res, req.body, user);
    }
  })
})

//Delete CompanyAccount Setup
app.delete('/api/companyaccountconfig', verifyToken, (req, res) => {
  console.log('delete_companyaccountconfig')
  jwt.verify(req.token, settings.secretkey, (err, authData) => {
    if (err) {
      const data = {
        status: status_type.Unauthorized,
        Code: msg_type.CodeW0002,
      }
      authExpired.Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      CompanyConfig.DeleteCompany(req, res, req.body, user);
    }
  })
})

//Get Financial Code Setup
app.get('/api/financialcodeconfig', (req, res) => {
  console.log('financialcodeconfig')
  FinancialConfig.GetFinancialCode(req, res, req.body);
})

//Edit Financial Code Setup
app.put('/api/financialcodeconfig', verifyToken, (req, res) => {
  console.log('edit_financialcodeconfig')
  jwt.verify(req.token, settings.secretkey, (err, authData) => {
    if (err) {
      const data = {
        status: status_type.Unauthorized,
        Code: msg_type.CodeW0002,
      }
      authExpired.Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      const obj = req.body['obj']

      FinancialConfig.EditFinancialCode(req, res, obj, user);
    }
  })
})

//Get ฺBank Account Setup
app.get('/api/bankaccountconfig', (req, res) => {
  console.log('bankaccountconfig')
  BankAccount.GetBankAccount(req, res, req.body);
})

//Add ฺBank Account Setup
app.post('/api/bankaccountconfig', verifyToken, (req, res) => {
  console.log('add_bankaccountconfig')
  jwt.verify(req.token, settings.secretkey, (err, authData) => {
    if (err) {
      const data = {
        status: status_type.Unauthorized,
        Code: msg_type.CodeW0002,
      }
      authExpired.Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      BankAccount.AddBankAccount(req, res, req.body, user);
    }
  })
})

//Edit ฺBank Account Setup
app.put('/api/bankaccountconfig', verifyToken, (req, res) => {
  console.log('edit_bankaccountconfig')
  jwt.verify(req.token, settings.secretkey, (err, authData) => {
    if (err) {
      const data = {
        status: status_type.Unauthorized,
        Code: msg_type.CodeW0002,
      }
      authExpired.Expired(req, res, data)
    } else {
      const user = authData.jwtdata
      BankAccount.EditBankAccount(req, res, req.body, user);
    }
  })
})

//Delete Bank Account Setup
app.delete('/api/bankaccountconfig', verifyToken, (req, res) => {
  console.log('delete_bankaccountconfig')
  jwt.verify(req.token, settings.secretkey, (err, authData) => {
    if (err) {
      const data = {
        status: status_type.Unauthorized,
        Code: msg_type.CodeW0002,
      }
      authExpired.Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      BankAccount.DeleteBankAccount(req, res, req.body, user);
    }
  })
})

//Get Store Setup
app.get('/api/storeconfig', (req, res) => {
  console.log('storeconfig')
  Store.GetStoreConfig(req, res, req.body);
})

//Get Store Setup /Popup Store Name
app.get('/api/storeconfig/popupstore', (req, res) => {
  console.log('storeconfig/popupstore')
  Store.GetPopupStore(req, res, req.body);
})

//Get Store Setup /DropDown Bank Name
app.get('/api/storeconfig/ddlbank', (req, res) => {
  console.log('storeconfig/ddlbank')
  Store.GetDropDownBank(req, res, req.body);
})

//Add Store Setup
app.post('/api/storeconfig', verifyToken, (req, res) => {
  console.log('add_storeconfig')
  jwt.verify(req.token, settings.secretkey, (err, authData) => {
    if (err) {
      const data = {
        status: status_type.Unauthorized,
        Code: msg_type.CodeW0002,
      }
      authExpired.Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      Store.AddStoreConfig(req, res, req.body, user);
    }
  })
})

//Edit Store Setup
app.put('/api/storeconfig', verifyToken, (req, res) => {
  console.log('edit_storeconfig')
  jwt.verify(req.token, settings.secretkey, (err, authData) => {
    if (err) {
      const data = {
        status: status_type.Unauthorized,
        Code: msg_type.CodeW0002,
      }
      authExpired.Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      Store.EditStoreConfig(req, res, req.body, user);
    }
  })
})

//Delete Store Setup
app.delete('/api/storeconfig', verifyToken, (req, res) => {
  console.log('delete_storeconfig')
  jwt.verify(req.token, settings.secretkey, (err, authData) => {
    if (err) {
      const data = {
        status: status_type.Unauthorized,
        Code: msg_type.CodeW0002,
      }
      authExpired.Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      Store.DeleteStoreConfig(req, res, req.body, user);
    }
  })
})

//Get Account Code Setup For Sale
app.get('/api/accountcodeconfigforsale', (req, res) => {
  console.log('accountcodeconfigforsale')
  AccountCodeForSale.GetAccountCode(req, res, req.body);
})

//Get Account Code Setup For Sale /DropDown Bu Type
app.get('/api/accountcodeconfigforsale/ddlbutype', (req, res) => {
  console.log('accountcodeconfigforsale/ddlbutype')
  AccountCodeForSale.GetDropDownBuType(req, res, req.body);
})

//Get Account Code Setup For Sale /DropDown Type
app.get('/api/accountcodeconfigforsale/ddltype', (req, res) => {
  console.log('accountcodeconfigforsale/ddltype')
  AccountCodeForSale.GetDropDownType(req, res, req.body);
})

//Add Account Code Setup For Sale
app.post('/api/accountcodeconfigforsale', verifyToken, (req, res) => {
  console.log('add_accountcodeconfigforsale')
  jwt.verify(req.token, settings.secretkey, (err, authData) => {
    if (err) {
      const data = {
        status: status_type.Unauthorized,
        Code: msg_type.CodeW0002,
      }
      authExpired.Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      AccountCodeForSale.AddAccountCode(req, res, req.body, user);
    }
  })
})

//Edit Account Code Setup For Sale
app.put('/api/accountcodeconfigforsale', verifyToken, (req, res) => {
  console.log('edit_accountcodeconfigforsale')
  jwt.verify(req.token, settings.secretkey, (err, authData) => {
    if (err) {
      const data = {
        status: status_type.Unauthorized,
        Code: msg_type.CodeW0002,
      }
      authExpired.Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      AccountCodeForSale.EditAccountCode(req, res, req.body, user);
    }
  })
})


//Get Bank In Adjustment
app.get('/api/bankinadjustment/:store/:dateofstore', (req, res) => {
  console.log('bankinadjustment')
  BankInAdjustment.GetBankInAdjustment(req, res, req.body);
})

//Get Bank In Adjustment /Popup Store Name
app.get('/api/bankinadjustment/popupstore', (req, res) => {
  console.log('bankinadjustment/popupstore')
  BankInAdjustment.GetPopupStore(req, res, req.body);
})

//Get Bank In Adjustment /Validation Store
app.get('/api/bankinadjustment/validationstore', (req, res) => {
  console.log('bankinadjustment/validationstore')
  BankInAdjustment.GetValidationstore(req, res, req.body);
})

//Get Bank In Adjustment /Validation Financial  Code
app.get('/api/bankinadjustment/validationfinancialcode', (req, res) => {
  console.log('bankinadjustment/validationfinancialcode')
  BankInAdjustment.GetValidationfinancialcode(req, res, req.body);
})

//Edit Bank In Adjustment
app.put('/api/bankinadjustment', verifyToken, (req, res) => {
  console.log('edit_bankinadjustment')
  jwt.verify(req.token, settings.secretkey, (err, authData) => {
    if (err) {
      const data = {
        status: status_type.Unauthorized,
        Code: msg_type.CodeW0002,
      }
      authExpired.Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      const obj = req.body['obj']

      BankInAdjustment.EditBankInAdjustment(req, res, obj, user);
    }
  })
})

//Upload Bank In Adjustment
app.get('/api/upload/bankinadjustment_template', function (req, res) {
  console.log('downloadtemplate_bankinadjustment')
  let file = __dirname + '/upload/TemplateBankInAdjustment.xlsx'
  res.download(file)
})

//Import Bank In Adjustment
app.put('/api/bankinadjustment/import', verifyToken, (req, res) => {
  console.log('import_bankinadjustment')
  jwt.verify(req.token, settings.secretkey, (err, authData) => {
    if (err) {
      const data = {
        status: status_type.Unauthorized,
        Code: msg_type.CodeW0002,
      }
      authExpired.Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      const obj = req.body['obj']

      BankInAdjustment.ImportBankInAdjustment(req, res, obj, user);
    }
  })
})

//Process Bank In Adjustment
app.post('/api/glprocessbankinadjustment', verifyToken, (req, res) => {
  console.log('glprocessbankinadjustment')
  jwt.verify(req.token, settings.secretkey, (err, authData) => {
    if (err) {
      const data = {
        status: status_type.Unauthorized,
        Code: msg_type.CodeW0002,
      }
      authExpired.Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      BankInAdjustment.GenGLBankInAdjustment(req, res, req.body, user);
    }
  })
})

//Stemp Closed Daily Fins
app.post('/api/stampclosedailyfins', verifyToken, (req, res) => {
  console.log('stampclosedailyfins')
  jwt.verify(req.token, settings.secretkey, (err, authData) => {
    if (err) {
      const data = {
        status: status_type.Unauthorized,
        Code: msg_type.CodeW0002,
      }
      authExpired.Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      StampCloseDailyFins.StampCloseDaiyFins(req, res, req.body, user);
    }
  })
})



//Report

//Get AllStore / ForDropDown
app.get('/api/report/storeall', (req, res) => {
  console.log('getallstore')
  Store.GetAllStore(req, res, req.body);
})

//Get AllBank / ForDropDown
app.get('/api/report/bankall', (req, res) => {
  console.log('getallbank')
  Store.GetAllBank(req, res, req.body);
})

//Gen Token for Tableau
app.post('/api/report/gentokentableau', verifyToken, (req, res) => {
  console.log('gentokentableau')
  jwt.verify(req.token, settings.secretkey, (err, authData) => {
    if (err) {
      const data = {
        status: status_type.Unauthorized,
        Code: msg_type.CodeW0002,
      }
      authExpired.Expired(req, res, data)

    } else {
      const user = authData.jwtdata     
      GenToken.GenTokenTableau(req, res, req.body, user);
    }
  })
})


//Get Account Code For Inventory
app.get('/api/accountcodeforinventory', (req, res) => {
  console.log('get_accountcodeforinventory')
  AccountCodeForInventory.Get(req, res, req.body);
})

//Get Account Code For Inventory /DropDown Grp By
app.get('/api/accountcodeforinventory/ddlgrp_by', (req, res) => {
  console.log('accountcodeforinventory/ddlgrp_by')
  AccountCodeForInventory.GetDropDownGrpBy(req, res, req.body)
})

//Get Account Code For Inventory /DropDown CatCode
app.get('/api/accountcodeforinventory/ddlcatcode', (req, res) => {
  console.log('accountcodeforinventory/ddlcatcode')
  AccountCodeForInventory.GetDropDownCatCode(req, res, req.body)
})

//Get Account Code For Inventory /DropDown Acc Type
app.get('/api/accountcodeforinventory/ddlacc_type', (req, res) => {
  console.log('accountcodeforinventory/ddlacc_type')
  AccountCodeForInventory.GetDropDownAccType(req, res, req.body)
})

//Add Account Code For Inventory
app.post('/api/accountcodeforinventory', verifyToken, (req, res) => {
  console.log('add_accountcodeforinventory')
  jwt.verify(req.token, settings.secretkey, (err, authData) => {
    if (err) {
      const data = {
        status: status_type.Unauthorized,
        Code: msg_type.CodeW0002,
      }
      authExpired.Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      AccountCodeForInventory.Add(req, res, req.body, user);
    }
  })
})

//Edit Account Code For Inventory
app.put('/api/accountcodeforinventory', verifyToken, (req, res) => {
  console.log('edit_accountcodeforinventory')
  jwt.verify(req.token, settings.secretkey, (err, authData) => {
    if (err) {
      const data = {
        status: status_type.Unauthorized,
        Code: msg_type.CodeW0002,
      }
      authExpired.Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      AccountCodeForInventory.Edit(req, res, req.body, user);
    }
  })
})

// Serve the files on port.
app.listen(settings.webPort, function () {
  console.log('Server started on port %s \n', settings.webPort);
});

// FORMAT OF TOKEN
// Authorization: Bearer <access_token>

// Verify Token
function verifyToken(req, res, next) {
  // Get auth header value
  const bearerHeader = req.headers['authorization']
  // Check if bearer is undefined
  if (typeof bearerHeader !== 'undefined') {
    // Split at the space
    const bearer = bearerHeader.split(' ')
    // Get token from array
    const bearerToken = bearer[1]
    // Set the token
    req.token = bearerToken
    // Next middleware
    next()
  } else {
    // Forbidden  
    const data = {
      status: status_type.Unauthorized,
      Code: msg_type.CodeW0002,
    }
    authExpired.Expired(req, res, data)

  }
}