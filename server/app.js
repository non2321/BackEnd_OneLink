import express from 'express';
import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import { urlencoded, json } from 'body-parser';    //used to extract the body from the incoming requests
import { verify } from 'jsonwebtoken';
import { mw } from 'request-ip';
import { schedule } from 'node-cron';
import fetch from 'node-fetch';
import FormData from 'form-data';

const app = express();
import config, { output } from '../webpack.config.js';
const compiler = webpack(config);

import { Login } from './controllers/auth/Login';
import { LoadPage } from './controllers/auth/Loadpage';
import { Logout } from './controllers/auth/Logout';
import { Expired } from './controllers/auth/Expired';
import { Menu } from './controllers/auth/Menu';


//SDC
//--Sales
import { GetCompany, AddCompany, EditCompany, DeleteCompany, GetCompanyAccount, AddCompanyAccount, EditCompanyAccount } from './controllers/sdc/Sales/CompanyConfig';
import { GetFinancialCode, AddFinancialCode, EditFinancialCode } from './controllers/sdc/Sales/FinancialCodeConfig';
import { GetBankAccount, AddBankAccount, EditBankAccount, DeleteBankAccount } from './controllers/sdc/Sales/BankAccount';
import { GetStoreConfig, GetPopupStore, GetDropDownBank, AddStoreConfig, EditStoreConfig, DeleteStoreConfig, GetAllStore, GetAllBank, GetVendor, GetRegion } from './controllers/sdc/Sales/Store';
import { GetAccountCode, GetDropDownBuType, GetDropDownType, AddAccountCode, EditAccountCode } from './controllers/sdc/Sales/AccountCode';
import { GetBankInAdjustment, GetPopupStore as _GetPopupStore, GetValidationstore, GetValidationfinancialcode, EditBankInAdjustment, ImportBankInAdjustment, GenGLBankInAdjustment } from './controllers/sdc/Sales/BankInAdjustment';
import { StampCloseDaiyFins } from './controllers/sdc/Sales/StampCloseDailyFins';

//--Inventory
import { GetAccountCodeForInventory, GetDropDownGrpBy, GetDropDownCatCode, GetDropDownAccType, AddAccountCodeForInventory, EditAccountCodeForInventory } from './controllers/sdc/Inventory/AccountCodeForInventory';
import { GetPeriodEndingInventory, GetDataTableEndingInventory } from './controllers/sdc/Inventory/EndingInventory';
import { GetDataTableTransferInventory } from './controllers/sdc/Inventory/TransferInventory';
import { GetDataTableReceipts } from './controllers/sdc/Inventory/Receipts';
import { GetDataTableTermClosing, AddTermClosing, EditTermClosing } from './controllers/sdc/Inventory/TermClosing';
import { GetDropDownPeriod } from './controllers/sdc/Inventory/ImportToJDE';
import { GetDropDownInvenCategory, GetDataTableUnitCost, EditUnitCost, Import, GenInveotory } from './controllers/sdc/Inventory/UnitCost';
import { AddStampInventory } from './controllers/sdc/Inventory/StampInventory';

//Report
//--SDC
//----Sales
import { GenTokenTableau, GenTokenTableauForFullScreen } from './controllers/report/GenToken';

import { StatusUnauthorized } from "./models/status_type";
import { CodeW0002 } from "./models/msg_type";
import { secretkey, webPort, tableautoken } from "../settings";

//Task Scheduler
import taskDailyFins from './controllers/scheduler/DailyFins';

// It extracts the data out of the request headers like the form data, etc,.
app.use(urlencoded({ extended: false }));
app.use(json());
// parse request-ip
app.use(mw())
// Tell express to use the webpack-dev-middleware and use the webpack.config.js
// configuration file as a base.
app.use(webpackDevMiddleware(compiler, {
  publicPath: output.publicPath
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
  Login(req, res, req.body)
});

//Logout Page
app.post('/api/logout', verifyToken, (req, res) => {
  console.log('logout')

  verify(req.token, secretkey, (err, authData) => {
    if (err) {
      const data = {
        status: StatusUnauthorized,
        Code: CodeW0002,
      }
      Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      Logout(req, res, req.body, user);
    }
  })
});

//Load Page
app.post('/api/loadpage', verifyToken, (req, res) => {
  console.log('loadpage')
  verify(req.token, secretkey, (err, authData) => {
    if (err) {
      const data = {
        status: StatusUnauthorized,
        Code: CodeW0002,
      }
      Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      LoadPage(req, res, req.body, user);
    }
  })
})

//Menu Auth
app.get('/api/menuauth/:userid', (req, res) => {
  console.log('meunauth')
  Menu(req, res, req.body)
});

//Get Company Setup
app.get('/api/companyconfig', (req, res) => {
  console.log('get_company')
  GetCompany(req, res, req.body);
})

//Add Company Setup
app.post('/api/companyconfig', verifyToken, (req, res) => {
  console.log('add_company')
  verify(req.token, secretkey, (err, authData) => {
    if (err) {
      const data = {
        status: StatusUnauthorized,
        Code: CodeW0002,
      }
      Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      AddCompany(req, res, req.body, user);
    }
  })
})

//Edit Company Setup
app.put('/api/companyconfig', verifyToken, (req, res) => {
  console.log('edit_company')
  verify(req.token, secretkey, (err, authData) => {
    if (err) {
      const data = {
        status: StatusUnauthorized,
        Code: CodeW0002,
      }
      Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      EditCompany(req, res, req.body, user);
    }
  })
})

//Delete Company Setup
app.delete('/api/companyconfig', verifyToken, (req, res) => {
  console.log('delete_companyconfig')
  verify(req.token, secretkey, (err, authData) => {
    if (err) {
      const data = {
        status: StatusUnauthorized,
        Code: CodeW0002,
      }
      Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      DeleteCompany(req, res, req.body, user);
    }
  })
})

//Get CompanyAccount Setup
app.get('/api/companyaccountconfig', (req, res) => {
  console.log('companyaccountconfig')
  GetCompanyAccount(req, res, req.body);
})

//Add CompanyAccount Setup
app.post('/api/companyaccountconfig', verifyToken, (req, res) => {
  console.log('add_companyaccountconfig')
  verify(req.token, secretkey, (err, authData) => {
    if (err) {
      const data = {
        status: StatusUnauthorized,
        Code: CodeW0002,
      }
      Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      AddCompanyAccount(req, res, req.body, user);
    }
  })
})

//Edit CompanyAccount Setup
app.put('/api/companyaccountconfig', verifyToken, (req, res) => {
  console.log('edit_companyaccountconfig')
  verify(req.token, secretkey, (err, authData) => {
    if (err) {
      const data = {
        status: StatusUnauthorized,
        Code: CodeW0002,
      }
      Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      EditCompanyAccount(req, res, req.body, user);
    }
  })
})

//Delete CompanyAccount Setup
app.delete('/api/companyaccountconfig', verifyToken, (req, res) => {
  console.log('delete_companyaccountconfig')
  verify(req.token, secretkey, (err, authData) => {
    if (err) {
      const data = {
        status: StatusUnauthorized,
        Code: CodeW0002,
      }
      Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      DeleteCompany(req, res, req.body, user);
    }
  })
})

//Get Financial Code Setup
app.get('/api/financialcodeconfig', (req, res) => {
  console.log('financialcodeconfig')
  GetFinancialCode(req, res, req.body);
})

//Add Financial Code Setup
app.post('/api/financialcodeconfig', verifyToken, (req, res) => {
  console.log('add_financialcodeconfig')
  verify(req.token, secretkey, (err, authData) => {
    if (err) {
      const data = {
        status: StatusUnauthorized,
        Code: CodeW0002,
      }
      Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      AddFinancialCode(req, res, req.body, user);
    }
  })
})

//Edit Financial Code Setup
app.put('/api/financialcodeconfig', verifyToken, (req, res) => {
  console.log('edit_financialcodeconfig')
  verify(req.token, secretkey, (err, authData) => {
    if (err) {
      const data = {
        status: StatusUnauthorized,
        Code: CodeW0002,
      }
      Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      const obj = req.body['obj']

      EditFinancialCode(req, res, obj, user);
    }
  })
})

//Get ฺBank Account Setup
app.get('/api/bankaccountconfig', (req, res) => {
  console.log('bankaccountconfig')
  GetBankAccount(req, res, req.body);
})

//Add ฺBank Account Setup
app.post('/api/bankaccountconfig', verifyToken, (req, res) => {
  console.log('add_bankaccountconfig')
  verify(req.token, secretkey, (err, authData) => {
    if (err) {
      const data = {
        status: StatusUnauthorized,
        Code: CodeW0002,
      }
      Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      AddBankAccount(req, res, req.body, user);
    }
  })
})

//Edit ฺBank Account Setup
app.put('/api/bankaccountconfig', verifyToken, (req, res) => {
  console.log('edit_bankaccountconfig')
  verify(req.token, secretkey, (err, authData) => {
    if (err) {
      const data = {
        status: StatusUnauthorized,
        Code: CodeW0002,
      }
      Expired(req, res, data)
    } else {
      const user = authData.jwtdata
      EditBankAccount(req, res, req.body, user);
    }
  })
})

//Delete Bank Account Setup
app.delete('/api/bankaccountconfig', verifyToken, (req, res) => {
  console.log('delete_bankaccountconfig')
  verify(req.token, secretkey, (err, authData) => {
    if (err) {
      const data = {
        status: StatusUnauthorized,
        Code: CodeW0002,
      }
      Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      DeleteBankAccount(req, res, req.body, user);
    }
  })
})

//Get Store Setup
app.get('/api/storeconfig', (req, res) => {
  console.log('storeconfig')
  GetStoreConfig(req, res, req.body);
})

//Get Store Setup /Popup Store Name
app.get('/api/storeconfig/popupstore', (req, res) => {
  console.log('storeconfig/popupstore')
  GetPopupStore(req, res, req.body);
})

//Get Store Setup /DropDown Bank Name
app.get('/api/storeconfig/ddlbank', (req, res) => {
  console.log('storeconfig/ddlbank')
  GetDropDownBank(req, res, req.body);
})

//Add Store Setup
app.post('/api/storeconfig', verifyToken, (req, res) => {
  console.log('add_storeconfig')
  verify(req.token, secretkey, (err, authData) => {
    if (err) {
      const data = {
        status: StatusUnauthorized,
        Code: CodeW0002,
      }
      Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      AddStoreConfig(req, res, req.body, user);
    }
  })
})

//Edit Store Setup
app.put('/api/storeconfig', verifyToken, (req, res) => {
  console.log('edit_storeconfig')
  verify(req.token, secretkey, (err, authData) => {
    if (err) {
      const data = {
        status: StatusUnauthorized,
        Code: CodeW0002,
      }
      Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      EditStoreConfig(req, res, req.body, user);
    }
  })
})

//Delete Store Setup
app.delete('/api/storeconfig', verifyToken, (req, res) => {
  console.log('delete_storeconfig')
  verify(req.token, secretkey, (err, authData) => {
    if (err) {
      const data = {
        status: StatusUnauthorized,
        Code: CodeW0002,
      }
      Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      DeleteStoreConfig(req, res, req.body, user);
    }
  })
})

//Get Account Code Setup For Sale
app.get('/api/accountcodeconfigforsale', (req, res) => {
  console.log('accountcodeconfigforsale')
  GetAccountCode(req, res, req.body);
})

//Get Account Code Setup For Sale /DropDown Bu Type
app.get('/api/accountcodeconfigforsale/ddlbutype', (req, res) => {
  console.log('accountcodeconfigforsale/ddlbutype')
  GetDropDownBuType(req, res, req.body);
})

//Get Account Code Setup For Sale /DropDown Type
app.get('/api/accountcodeconfigforsale/ddltype', (req, res) => {
  console.log('accountcodeconfigforsale/ddltype')
  GetDropDownType(req, res, req.body);
})

//Add Account Code Setup For Sale
app.post('/api/accountcodeconfigforsale', verifyToken, (req, res) => {
  console.log('add_accountcodeconfigforsale')
  verify(req.token, secretkey, (err, authData) => {
    if (err) {
      const data = {
        status: StatusUnauthorized,
        Code: CodeW0002,
      }
      Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      AddAccountCode(req, res, req.body, user);
    }
  })
})

//Edit Account Code Setup For Sale
app.put('/api/accountcodeconfigforsale', verifyToken, (req, res) => {
  console.log('edit_accountcodeconfigforsale')
  verify(req.token, secretkey, (err, authData) => {
    if (err) {
      const data = {
        status: StatusUnauthorized,
        Code: CodeW0002,
      }
      Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      EditAccountCode(req, res, req.body, user);
    }
  })
})


//Get Bank In Adjustment
app.get('/api/bankinadjustment/:store/:dateofstore', (req, res) => {
  console.log('bankinadjustment')
  GetBankInAdjustment(req, res, req.body);
})

//Get Bank In Adjustment /Popup Store Name
app.get('/api/bankinadjustment/popupstore', (req, res) => {
  console.log('bankinadjustment/popupstore')
  _GetPopupStore(req, res, req.body);
})

//Get Bank In Adjustment /Validation Store
app.get('/api/bankinadjustment/validationstore', (req, res) => {
  console.log('bankinadjustment/validationstore')
  GetValidationstore(req, res, req.body);
})

//Get Bank In Adjustment /Validation Financial  Code
app.get('/api/bankinadjustment/validationfinancialcode', (req, res) => {
  console.log('bankinadjustment/validationfinancialcode')
  GetValidationfinancialcode(req, res, req.body);
})

//Edit Bank In Adjustment
app.put('/api/bankinadjustment', verifyToken, (req, res) => {
  console.log('edit_bankinadjustment')
  verify(req.token, secretkey, (err, authData) => {
    if (err) {
      const data = {
        status: StatusUnauthorized,
        Code: CodeW0002,
      }
      Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      const obj = req.body['obj']

      EditBankInAdjustment(req, res, obj, user);
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
  verify(req.token, secretkey, (err, authData) => {
    if (err) {
      const data = {
        status: StatusUnauthorized,
        Code: CodeW0002,
      }
      Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      const obj = req.body['obj']

      ImportBankInAdjustment(req, res, obj, user);
    }
  })
})

//Process Bank In Adjustment
app.post('/api/glprocessbankinadjustment', verifyToken, (req, res) => {
  console.log('glprocessbankinadjustment')
  verify(req.token, secretkey, (err, authData) => {
    if (err) {
      const data = {
        status: StatusUnauthorized,
        Code: CodeW0002,
      }
      Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      GenGLBankInAdjustment(req, res, req.body, user);
    }
  })
})

//Stemp Closed Daily Fins
app.post('/api/stampclosedailyfins', verifyToken, (req, res) => {
  console.log('stampclosedailyfins')
  verify(req.token, secretkey, (err, authData) => {
    if (err) {
      const data = {
        status: StatusUnauthorized,
        Code: CodeW0002,
      }
      Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      StampCloseDaiyFins(req, res, req.body, user);
    }
  })
})


//Report
//Get AllStore / ForDropDown
app.get('/api/report/storeall', (req, res) => {
  console.log('getallstore')
  GetAllStore(req, res, req.body);
})

//Get AllBank / ForDropDown
app.get('/api/report/bankall', (req, res) => {
  console.log('getallbank')
  GetAllBank(req, res, req.body);
})

//Get Vendor / ForDropDown
app.get('/api/report/vendor', (req, res) => {
  console.log('getvendor')
  GetVendor(req, res, req.body);
})

//Get Region / ForDropDown
app.get('/api/report/region', (req, res) => {
  console.log('getregion')
  GetRegion(req, res, req.body);
})

//Gen Token for Tableau
app.post('/api/report/gentokentableau', verifyToken, (req, res) => {
  console.log('gentokentableau')
  verify(req.token, secretkey, (err, authData) => {
    if (err) {
      const data = {
        status: StatusUnauthorized,
        Code: CodeW0002,
      }
      Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      GenTokenTableau(req, res, req.body, user);
    }
  })
})

//Gen Token for Tableau For FullScreen
app.post('/api/report/gentokentableauforfullscreen', verifyToken, (req, res) => {
  console.log('gentokentableauforfullscreen')
  verify(req.token, secretkey, (err, authData) => {
    if (err) {
      const data = {
        status: StatusUnauthorized,
        Code: CodeW0002,
      }
      Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      GenTokenTableauForFullScreen(req, res, req.body, user);
    }
  })
})


//Get Account Code For Inventory
app.get('/api/accountcodeforinventory', (req, res) => {
  console.log('get_accountcodeforinventory')
  GetAccountCodeForInventory(req, res, req.body);
})

//Get Account Code For Inventory /DropDown Grp By
app.get('/api/accountcodeforinventory/ddlgrp_by', (req, res) => {
  console.log('accountcodeforinventory/ddlgrp_by')
  GetDropDownGrpBy(req, res, req.body)
})

//Get Account Code For Inventory /DropDown CatCode
app.get('/api/accountcodeforinventory/ddlcatcode', (req, res) => {
  console.log('accountcodeforinventory/ddlcatcode')
  GetDropDownCatCode(req, res, req.body)
})

//Get Account Code For Inventory /DropDown Acc Type
app.get('/api/accountcodeforinventory/ddlacc_type', (req, res) => {
  console.log('accountcodeforinventory/ddlacc_type')
  GetDropDownAccType(req, res, req.body)
})

//Add Account Code For Inventory
app.post('/api/accountcodeforinventory', verifyToken, (req, res) => {
  console.log('add_accountcodeforinventory')
  verify(req.token, secretkey, (err, authData) => {
    if (err) {
      const data = {
        status: StatusUnauthorized,
        Code: CodeW0002,
      }
      Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      AddAccountCodeForInventory(req, res, req.body, user);
    }
  })
})

//Edit Account Code For Inventory
app.put('/api/accountcodeforinventory', verifyToken, (req, res) => {
  console.log('edit_accountcodeforinventory')
  verify(req.token, secretkey, (err, authData) => {
    if (err) {
      const data = {
        status: StatusUnauthorized,
        Code: CodeW0002,
      }
      Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      EditAccountCodeForInventory(req, res, req.body, user);
    }
  })
})

//Stemp Inventory
app.post('/api/stampinventory', verifyToken, (req, res) => {
  console.log('stampinventory')
  verify(req.token, secretkey, (err, authData) => {
    if (err) {
      const data = {
        status: StatusUnauthorized,
        Code: CodeW0002,
      }
      Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      AddStampInventory(req, res, req.body, user);
    }
  })
})

//Get Import To JDE /DropDown Period
app.get('/api/importtojde/ddlperiod', (req, res) => {
  console.log('importtojde/ddlperiod')
  GetDropDownPeriod(req, res, req.body)
})

//Get Unitcost /DropDown Inven Category
app.get('/api/unitcost/ddlinvencategory', (req, res) => {
  console.log('unitcost/ddlinvencategory')
  GetDropDownInvenCategory(req, res, req.body);
})

//Get Unitcost
app.get('/api/unitcost/:period', (req, res) => {
  console.log('get_unitcost')
  GetDataTableUnitCost(req, res, req.body)
})

//Get Unitcost
app.get('/api/unitcost/:period/:invencategory', (req, res) => {
  console.log('get_unitcost')
  GetDataTableUnitCost(req, res, req.body)
})

//Get Unitcost
app.get('/api/unitcost/:period/:invencategory/:stockno', (req, res) => {
  console.log('get_unitcost')
  GetDataTableUnitCost(req, res, req.body)
})

//Edit Unitcost
app.put('/api/unitcost', verifyToken, (req, res) => {
  console.log('edit_unitcost')
  verify(req.token, secretkey, (err, authData) => {
    if (err) {
      const data = {
        status: StatusUnauthorized,
        Code: CodeW0002,
      }
      Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      const obj = req.body['obj']

      EditUnitCost(req, res, obj, user);
    }
  })
})

//Upload Unitcost
app.get('/api/upload/unitcost_template', function (req, res) {
  console.log('downloadtemplate_unitcost')
  let file = __dirname + '/upload/TemplateUnitCost.xlsx'
  res.download(file)
})

//Import UnitCost
app.put('/api/unitcost/import', verifyToken, (req, res) => {
  console.log('import_unitcost')
  verify(req.token, secretkey, (err, authData) => {
    if (err) {
      const data = {
        status: StatusUnauthorized,
        Code: CodeW0002,
      }
      Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      const obj = req.body['obj']

      Import(req, res, obj, user);
    }
  })
})

//Gen PH Inventroy To E1 (UnitCost)
app.post('/api/genunitocst', verifyToken, (req, res) => {
  console.log('genunitocst')
  verify(req.token, secretkey, (err, authData) => {
    if (err) {
      const data = {
        status: StatusUnauthorized,
        Code: CodeW0002,
      }
      Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      GenInveotory(req, res, req.body, user);
    }
  })
})


//Get Receipts
app.get('/api/receipts/:store/:datefrom/:dateto', (req, res) => {
  console.log('get_receipts')
  GetDataTableReceipts(req, res, req.body)
})

//Get Receipts
app.get('/api/receipts/:store/:datefrom/:dateto/:invoice*', (req, res) => {
  console.log('get_receipts')
  GetDataTableReceipts(req, res, req.body)
})

//Get Term Closing
app.get('/api/termclosing', (req, res) => {
  console.log('termclosing')
  GetDataTableTermClosing(req, res, req.body)
})

//Add Term Closing
app.post('/api/termclosing', verifyToken, (req, res) => {
  console.log('add_termclosing')
  verify(req.token, secretkey, (err, authData) => {
    if (err) {
      const data = {
        status: StatusUnauthorized,
        Code: CodeW0002,
      }
      Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      AddTermClosing(req, res, req.body, user);
    }
  })
})

//Edit Term Closing
app.put('/api/termclosing', verifyToken, (req, res) => {
  console.log('edit_termclosing')
  verify(req.token, secretkey, (err, authData) => {
    if (err) {
      const data = {
        status: StatusUnauthorized,
        Code: CodeW0002,
      }
      Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      const obj = req.body['obj']

      EditTermClosing(req, res, obj, user);
    }
  })
})

//Get Ending Inventory Period
app.get('/api/endinginventory/GetPeriodEndingInventory/:year/:month', (req, res) => {
  console.log('endinginventory/GetPeriodEndingInventory')
  GetPeriodEndingInventory(req, res, req.body)
})

//Get Ending Inventory
app.get('/api/endinginventory/:stamp/:store/:diff/:period', (req, res) => {
  console.log('get_endinginventory')
  GetDataTableEndingInventory(req, res, req.body)
})

//Get Transfer Inventory
app.get('/api/transferinventory/:stamp/:store/:datefrom/:dateto', (req, res) => {
  console.log('get_endinginventory')
  GetDataTableTransferInventory(req, res, req.body)
})

app.get('/api/tableautoken', async (req, res) => {
  const form = new FormData();
  form.append('username', tableautoken.username)
  const response = await fetch(tableautoken.path, { method: 'POST', body: form })
  const tableautokens = await response.text()  
  res.send(tableautokens)
})



// Serve the files on port.
app.listen(webPort, function () {
  console.log('Server started on port %s \n', webPort);
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
      status: StatusUnauthorized,
      Code: CodeW0002,
    }
    Expired(req, res, data)

  }
}

//Task Scheduler

// cron.schedule('0 0 4 * * *', async function(){
schedule('*/5 * * * * *', async function () {
  // console.log('running schedule')
  // await taskDailyFins.runTaskDailyFins()  
});












