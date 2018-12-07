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
import { Menu, RoleData } from './controllers/auth/Menu';

//Administration
import { GetDataTableLogSDC } from './controllers/administration/sdc/LogSDC'


//SDC
//--Sales
import { GetCompany, AddCompany, EditCompany, DeleteCompany, GetCompanyAccount, AddCompanyAccount, EditCompanyAccount } from './controllers/sdc/Sales/CompanyConfig';
import { GetFinancialCode, AddFinancialCode, EditFinancialCode } from './controllers/sdc/Sales/FinancialCodeConfig';
import { GetBankAccount, AddBankAccount, EditBankAccount, DeleteBankAccount } from './controllers/sdc/Sales/BankAccount';
import { GetStoreConfig, GetPopupStore, GetDropDownBank, AddStoreConfig, EditStoreConfig, DeleteStoreConfig, GetAllStore, GetAllBank, GetVendor, GetRegion } from './controllers/sdc/Sales/Store';
import { GetAccountCode, GetDropDownBuType, GetDropDownType, AddAccountCode, EditAccountCode } from './controllers/sdc/Sales/AccountCode';
import { GetBankInAdjustment, GetPopupStoreBankInAdjustment, GetValidationstore, GetValidationfinancialcode, EditBankInAdjustment, ImportBankInAdjustment, GenGLBankInAdjustment } from './controllers/sdc/Sales/BankInAdjustment';
import { StampCloseDaiyFins } from './controllers/sdc/Sales/StampCloseDailyFins'
import { GenDataFilePL, GenDataFilePL_BALFile, GenDataFilePL_BAL_ADJFile, GenDataFilePL_BAL_ACTUALFile, GenDataFilePL_BAL_ACTUAL_ADJFile, GenDataFilePL_BAL_NetSalesFile, GenDataFilePL_BAL_ACTUAL_SPA_AND__ACTUAL_ADJ_SPA } from './controllers/sdc/Sales/GenDataPL'

//--Inventory
import { GetAccountCodeForInventory, GetDropDownGrpBy, GetDropDownCatCode, GetDropDownAccType, AddAccountCodeForInventory, EditAccountCodeForInventory, ImportAccountCodeForInventory, GetValidationAccountCodeForInventory } from './controllers/sdc/Inventory/AccountCodeForInventory';
import { GetPeriodEndingInventory, GetDataTableEndingInventory } from './controllers/sdc/Inventory/EndingInventory';
import { GetDataTableTransferInventory } from './controllers/sdc/Inventory/TransferInventory';
import { GetDataTableReceipts } from './controllers/sdc/Inventory/Receipts';
import { GetDataTableTermClosing, AddTermClosing, EditTermClosing } from './controllers/sdc/Inventory/TermClosing';
import { GetDropDownPeriod } from './controllers/sdc/Inventory/ImportToJDE';
import { GetDropDownInvenCategory, GetDataTableUnitCost, EditUnitCost, ImportUnitCost, GenInveotory, GetValidationInvItem } from './controllers/sdc/Inventory/UnitCost';
import { AddStampInventory } from './controllers/sdc/Inventory/StampInventory';

//Report
//--SDC
//----Sales
import { GenTokenTableau, GenTokenTableauForFullScreen } from './controllers/report/GenToken';

import { StatusUnauthorized } from "./models/status_type";
import { CodeW0002 } from "./models/msg_type";
import { secretkey, webPort, tableautoken, mmxsftp } from "../settings";

//Task Scheduler
import { runTaskSDCInterface } from './controllers/scheduler/SDC_Interface'
import taskDailyFins from './controllers/scheduler/DailyFins';

// It extracts the data out of the request headers like the form data, etc,.
app.use(urlencoded({ extended: false, limit: '50mb' }));
app.use(json({ limit: '50mb' }));
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
app.post('/api/login', async (req, res) => {
  console.log('login')
  await Login(req, res, req.body)
});

//Logout Page
app.post('/api/logout', verifyToken, async (req, res) => {
  console.log('logout')

  await verify(req.token, secretkey, async (err, authData) => {
    if (err) {
      const data = {
        status: StatusUnauthorized,
        Code: CodeW0002,
      }
      await Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      await Logout(req, res, req.body, user);
    }
  })
});

//Load Page
app.post('/api/loadpage', verifyToken, async (req, res) => {
  console.log('loadpage')
  await verify(req.token, secretkey, async (err, authData) => {
    if (err) {
      const data = {
        status: StatusUnauthorized,
        Code: CodeW0002,
      }
      await Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      await LoadPage(req, res, req.body, user);
    }
  })
})

//Menu Auth
app.get('/api/menuauth/:userid', async (req, res) => {
  console.log('meunauth')
  await Menu(req, res, req.body)
});

//Role Data
app.get('/api/roledata/:userid', async (req, res) => {
  console.log('roledata')
  await RoleData(req, res, req.body)
});

//Get LogSDC
app.get('/api/logsdc/:datefrom/:dateto', async (req, res) => {
  console.log('get_logsdc')
  await GetDataTableLogSDC(req, res, req.body)
})

//Get Company Setup
app.get('/api/companyconfig', async (req, res) => {
  console.log('get_company')
  await GetCompany(req, res, req.body);
})

//Add Company Setup
app.post('/api/companyconfig', verifyToken, async (req, res) => {
  console.log('add_company')
  await verify(req.token, secretkey, async (err, authData) => {
    if (err) {
      const data = {
        status: StatusUnauthorized,
        Code: CodeW0002,
      }
      await Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      await AddCompany(req, res, req.body, user);
    }
  })
})

//Edit Company Setup
app.put('/api/companyconfig', verifyToken, async (req, res) => {
  console.log('edit_company')
  await verify(req.token, secretkey, async (err, authData) => {
    if (err) {
      const data = {
        status: StatusUnauthorized,
        Code: CodeW0002,
      }
      await Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      await EditCompany(req, res, req.body, user);
    }
  })
})

//Delete Company Setup
app.delete('/api/companyconfig', verifyToken, async (req, res) => {
  console.log('delete_companyconfig')
  verify(req.token, secretkey, async (err, authData) => {
    if (err) {
      const data = {
        status: StatusUnauthorized,
        Code: CodeW0002
      }
      await Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      await DeleteCompany(req, res, req.body, user);
    }
  })
})

//Get CompanyAccount Setup
app.get('/api/companyaccountconfig', async (req, res) => {
  console.log('companyaccountconfig')
  await GetCompanyAccount(req, res, req.body);
})

//Add CompanyAccount Setup
app.post('/api/companyaccountconfig', verifyToken, async (req, res) => {
  console.log('add_companyaccountconfig')
  await verify(req.token, secretkey, async (err, authData) => {
    if (err) {
      const data = {
        status: StatusUnauthorized,
        Code: CodeW0002,
      }
      await Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      await AddCompanyAccount(req, res, req.body, user);
    }
  })
})

//Edit CompanyAccount Setup
app.put('/api/companyaccountconfig', verifyToken, async (req, res) => {
  console.log('edit_companyaccountconfig')
  await verify(req.token, secretkey, async (err, authData) => {
    if (err) {
      const data = {
        status: StatusUnauthorized,
        Code: CodeW0002,
      }
      await Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      await EditCompanyAccount(req, res, req.body, user);
    }
  })
})

//Delete CompanyAccount Setup
app.delete('/api/companyaccountconfig', verifyToken, async (req, res) => {
  console.log('delete_companyaccountconfig')
  await verify(req.token, secretkey, async (err, authData) => {
    if (err) {
      const data = {
        status: StatusUnauthorized,
        Code: CodeW0002,
      }
      await Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      await DeleteCompany(req, res, req.body, user);
    }
  })
})

//Get Financial Code Setup
app.get('/api/financialcodeconfig', async (req, res) => {
  console.log('financialcodeconfig')
  await GetFinancialCode(req, res, req.body);
})

//Add Financial Code Setup
app.post('/api/financialcodeconfig', verifyToken, async (req, res) => {
  console.log('add_financialcodeconfig')
  await verify(req.token, secretkey, async (err, authData) => {
    if (err) {
      const data = {
        status: StatusUnauthorized,
        Code: CodeW0002,
      }
      await Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      await AddFinancialCode(req, res, req.body, user);
    }
  })
})

//Edit Financial Code Setup
app.put('/api/financialcodeconfig', verifyToken, async (req, res) => {
  console.log('edit_financialcodeconfig')
  await verify(req.token, secretkey, async (err, authData) => {
    if (err) {
      const data = {
        status: StatusUnauthorized,
        Code: CodeW0002,
      }
      await Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      const obj = req.body['obj']

      await EditFinancialCode(req, res, obj, user);
    }
  })
})

//Get ฺBank Account Setup
app.get('/api/bankaccountconfig', async (req, res) => {
  console.log('bankaccountconfig')
  await GetBankAccount(req, res, req.body);
})

//Add ฺBank Account Setup
app.post('/api/bankaccountconfig', verifyToken, async (req, res) => {
  console.log('add_bankaccountconfig')
  await verify(req.token, secretkey, async (err, authData) => {
    if (err) {
      const data = {
        status: StatusUnauthorized,
        Code: CodeW0002,
      }
      await Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      await AddBankAccount(req, res, req.body, user);
    }
  })
})

//Edit ฺBank Account Setup
app.put('/api/bankaccountconfig', verifyToken, async (req, res) => {
  console.log('edit_bankaccountconfig')
  await verify(req.token, secretkey, async (err, authData) => {
    if (err) {
      const data = {
        status: StatusUnauthorized,
        Code: CodeW0002,
      }
      await Expired(req, res, data)
    } else {
      const user = authData.jwtdata
      await EditBankAccount(req, res, req.body, user);
    }
  })
})

//Delete Bank Account Setup
app.delete('/api/bankaccountconfig', verifyToken, async (req, res) => {
  console.log('delete_bankaccountconfig')
  await verify(req.token, secretkey, async (err, authData) => {
    if (err) {
      const data = {
        status: StatusUnauthorized,
        Code: CodeW0002,
      }
      await Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      await DeleteBankAccount(req, res, req.body, user);
    }
  })
})

//Get Store Setup
app.get('/api/storeconfig', async (req, res) => {
  console.log('storeconfig')
  await GetStoreConfig(req, res, req.body);
})

//Get Store Setup /Popup Store Name
app.get('/api/storeconfig/popupstore', async (req, res) => {
  console.log('storeconfig/popupstore')
  await GetPopupStore(req, res, req.body);
})

//Get Store Setup /DropDown Bank Name
app.get('/api/storeconfig/ddlbank', async (req, res) => {
  console.log('storeconfig/ddlbank')
  await GetDropDownBank(req, res, req.body);
})

//Add Store Setup
app.post('/api/storeconfig', verifyToken, async (req, res) => {
  console.log('add_storeconfig')
  await verify(req.token, secretkey, async (err, authData) => {
    if (err) {
      const data = {
        status: StatusUnauthorized,
        Code: CodeW0002,
      }
      await Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      await AddStoreConfig(req, res, req.body, user);
    }
  })
})

//Edit Store Setup
app.put('/api/storeconfig', verifyToken, async (req, res) => {
  console.log('edit_storeconfig')
  await verify(req.token, secretkey, async (err, authData) => {
    if (err) {
      const data = {
        status: StatusUnauthorized,
        Code: CodeW0002,
      }
      await Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      await EditStoreConfig(req, res, req.body, user);
    }
  })
})

//Delete Store Setup
app.delete('/api/storeconfig', verifyToken, async (req, res) => {
  console.log('delete_storeconfig')
  await verify(req.token, secretkey, async (err, authData) => {
    if (err) {
      const data = {
        status: StatusUnauthorized,
        Code: CodeW0002,
      }
      await Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      await DeleteStoreConfig(req, res, req.body, user);
    }
  })
})

//Get Account Code Setup For Sale
app.get('/api/accountcodeconfigforsale', async (req, res) => {
  console.log('accountcodeconfigforsale')
  await GetAccountCode(req, res, req.body);
})

//Get Account Code Setup For Sale /DropDown Bu Type
app.get('/api/accountcodeconfigforsale/ddlbutype', async (req, res) => {
  console.log('accountcodeconfigforsale/ddlbutype')
  await GetDropDownBuType(req, res, req.body);
})

//Get Account Code Setup For Sale /DropDown Type
app.get('/api/accountcodeconfigforsale/ddltype', async (req, res) => {
  console.log('accountcodeconfigforsale/ddltype')
  await GetDropDownType(req, res, req.body);
})

//Add Account Code Setup For Sale
app.post('/api/accountcodeconfigforsale', verifyToken, async (req, res) => {
  console.log('add_accountcodeconfigforsale')
  await verify(req.token, secretkey, async (err, authData) => {
    if (err) {
      const data = {
        status: StatusUnauthorized,
        Code: CodeW0002,
      }
      await Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      await AddAccountCode(req, res, req.body, user);
    }
  })
})

//Edit Account Code Setup For Sale
app.put('/api/accountcodeconfigforsale', verifyToken, async (req, res) => {
  console.log('edit_accountcodeconfigforsale')
  await verify(req.token, secretkey, async (err, authData) => {
    if (err) {
      const data = {
        status: StatusUnauthorized,
        Code: CodeW0002,
      }
      await Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      await EditAccountCode(req, res, req.body, user);
    }
  })
})


//Get Bank In Adjustment
app.get('/api/bankinadjustment/:store/:dateofstore', async (req, res) => {
  console.log('bankinadjustment')
  await GetBankInAdjustment(req, res, req.body);
})

//Get Bank In Adjustment /Popup Store Name
app.get('/api/bankinadjustment/popupstore', async (req, res) => {
  console.log('bankinadjustment/popupstore')
  await GetPopupStoreBankInAdjustment(req, res, req.body);
})

//Get Bank In Adjustment /Validation Store
app.get('/api/bankinadjustment/validationstore', async (req, res) => {
  console.log('bankinadjustment/validationstore')
  await GetValidationstore(req, res, req.body);
})

//Get Bank In Adjustment /Validation Financial  Code
app.get('/api/bankinadjustment/validationfinancialcode', async (req, res) => {
  console.log('bankinadjustment/validationfinancialcode')
  await GetValidationfinancialcode(req, res, req.body);
})

//Edit Bank In Adjustment
app.put('/api/bankinadjustment', verifyToken, async (req, res) => {
  console.log('edit_bankinadjustment')
  await verify(req.token, secretkey, async (err, authData) => {
    if (err) {
      const data = {
        status: StatusUnauthorized,
        Code: CodeW0002,
      }
      await Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      const obj = req.body['obj']

      await EditBankInAdjustment(req, res, obj, user);
    }
  })
})

//Upload Bank In Adjustment
app.get('/api/upload/bankinadjustment_template', async (req, res) => {
  console.log('downloadtemplate_bankinadjustment')
  let file = __dirname + '/upload/TemplateBankInAdjustment.xlsx'
  await res.download(file)
})

//Import Bank In Adjustment
app.put('/api/bankinadjustment/import', verifyToken, async (req, res) => {
  console.log('import_bankinadjustment')
  await verify(req.token, secretkey, async (err, authData) => {
    if (err) {
      const data = {
        status: StatusUnauthorized,
        Code: CodeW0002,
      }
      await Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      const obj = req.body['obj']

      await ImportBankInAdjustment(req, res, obj, user);
    }
  })
})

//Process Bank In Adjustment
app.post('/api/glprocessbankinadjustment', verifyToken, async (req, res) => {
  console.log('glprocessbankinadjustment')
  await verify(req.token, secretkey, async (err, authData) => {
    if (err) {
      const data = {
        status: StatusUnauthorized,
        Code: CodeW0002,
      }
      await Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      await GenGLBankInAdjustment(req, res, req.body, user);
    }
  })
})

//Stemp Closed Daily Fins
app.post('/api/stampclosedailyfins', verifyToken, async (req, res) => {
  console.log('stampclosedailyfins')
  await verify(req.token, secretkey, async (err, authData) => {
    if (err) {
      const data = {
        status: StatusUnauthorized,
        Code: CodeW0002,
      }
      await Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      await StampCloseDaiyFins(req, res, req.body, user);
    }
  })
})

//Gen Data File P&L
app.post('/api/gendatafilePL', verifyToken, async (req, res) => {
  console.log('gendatafilePL')
  await verify(req.token, secretkey, async (err, authData) => {
    if (err) {
      const data = {
        status: StatusUnauthorized,
        Code: CodeW0002,
      }
      await Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      const obj = req.body['obj']
      const year = req.body['year']
      const month = req.body['month']          
      await GenDataFilePL(req, res, year, month, obj, user)      
    }
  })
})

//Gen BAL File
app.post('/api/gendatafilePL/BAL', verifyToken, async (req, res) => {
  console.log('gendatafilePL_BAL')
  await verify(req.token, secretkey, async (err, authData) => {
    if (err) {
      const data = {
        status: StatusUnauthorized,
        Code: CodeW0002,
      }
      await Expired(req, res, data)

    } else {
      const user = authData.jwtdata      
      await GenDataFilePL_BALFile(req, res, req.body, user);
    }
  })
})

//Gen BAL_ADJ File
app.post('/api/gendatafilePL/BAL_ADJ', verifyToken, async (req, res) => {
  console.log('gendatafilePL_BAL_ADJ')
  await verify(req.token, secretkey, async (err, authData) => {
    if (err) {
      const data = {
        status: StatusUnauthorized,
        Code: CodeW0002,
      }
      await Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      await GenDataFilePL_BAL_ADJFile(req, res, req.body, user);      
    }
  })
})

//Gen ACTUAL File
app.post('/api/gendatafilePL/ACTUAL', verifyToken, async (req, res) => {
  console.log('gendatafilePL_ACTUAL')
  await verify(req.token, secretkey, async (err, authData) => {
    if (err) {
      const data = {
        status: StatusUnauthorized,
        Code: CodeW0002,
      }
      await Expired(req, res, data)

    } else {     
      const user = authData.jwtdata
      await GenDataFilePL_BAL_ACTUALFile(req, res, req.body, user);    
    }
  })
})

//Gen ACTUAL_ADJ File
app.post('/api/gendatafilePL/ACTUAL_ADJ', verifyToken, async (req, res) => {
  console.log('gendatafile_ACTUAL_ADJ')
  await verify(req.token, secretkey, async (err, authData) => {
    if (err) {
      const data = {
        status: StatusUnauthorized,
        Code: CodeW0002,
      }
      await Expired(req, res, data)

    } else {      
      const user = authData.jwtdata
      await GenDataFilePL_BAL_ACTUAL_ADJFile(req, res, req.body, user);       
    }
  })
})

//Gen NetSales File
app.post('/api/gendatafilePL/NetSales', verifyToken, async (req, res) => {
  console.log('gendatafile_NetSales')
  await verify(req.token, secretkey, async (err, authData) => {
    if (err) {
      const data = {
        status: StatusUnauthorized,
        Code: CodeW0002,
      }
      await Expired(req, res, data)

    } else {     
      const user = authData.jwtdata
      await GenDataFilePL_BAL_NetSalesFile(req, res, req.body, user);       
    }
  })
})

//Gen ACTUAL_SPA AND ACTUAL_ADJ_SPA File
app.post('/api/gendatafilePL/ACTUAL_SPA_AND_ACTUAL_ADJ_SPA', verifyToken, async (req, res) => {
  console.log('gendatafile_ACTUAL_SPA_AND_ACTUAL_ADJ_SPA')
  await verify(req.token, secretkey, async (err, authData) => {
    if (err) {
      const data = {
        status: StatusUnauthorized,
        Code: CodeW0002,
      }
      await Expired(req, res, data)

    } else {       
      const user = authData.jwtdata
      await GenDataFilePL_BAL_ACTUAL_SPA_AND__ACTUAL_ADJ_SPA(req, res, req.body, user);  
    }
  })
})

//Report
//Get AllStore / ForDropDown
app.get('/api/report/storeall', async (req, res) => {
  console.log('getallstore')
  await GetAllStore(req, res, req.body);
})

//Get AllBank / ForDropDown
app.get('/api/report/bankall', async (req, res) => {
  console.log('getallbank')
  await GetAllBank(req, res, req.body);
})

//Get Vendor / ForDropDown
app.get('/api/report/vendor', async (req, res) => {
  console.log('getvendor')
  await GetVendor(req, res, req.body);
})

//Get Region / ForDropDown
app.get('/api/report/region', async (req, res) => {
  console.log('getregion')
  await GetRegion(req, res, req.body);
})

//Gen Token for Tableau
app.post('/api/report/gentokentableau', verifyToken, async (req, res) => {
  console.log('gentokentableau')
  await verify(req.token, secretkey, async (err, authData) => {
    if (err) {
      const data = {
        status: StatusUnauthorized,
        Code: CodeW0002,
      }
      await Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      await GenTokenTableau(req, res, req.body, user);
    }
  })
})

//Gen Token for Tableau For FullScreen
app.post('/api/report/gentokentableauforfullscreen', verifyToken, async (req, res) => {
  console.log('gentokentableauforfullscreen')
  await verify(req.token, secretkey, async (err, authData) => {
    if (err) {
      const data = {
        status: StatusUnauthorized,
        Code: CodeW0002,
      }
      await Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      await GenTokenTableauForFullScreen(req, res, req.body, user);
    }
  })
})


//Get Account Code For Inventory
app.get('/api/accountcodeforinventory', async (req, res) => {
  console.log('get_accountcodeforinventory')
  await GetAccountCodeForInventory(req, res, req.body);
})

//Get Account Code For Inventory /DropDown Grp By
app.get('/api/accountcodeforinventory/ddlgrp_by', async (req, res) => {
  console.log('accountcodeforinventory/ddlgrp_by')
  await GetDropDownGrpBy(req, res, req.body)
})

//Get Account Code For Inventory /DropDown CatCode
app.get('/api/accountcodeforinventory/ddlcatcode', async (req, res) => {
  console.log('accountcodeforinventory/ddlcatcode')
  await GetDropDownCatCode(req, res, req.body)
})

//Get Account Code For Inventory /DropDown Acc Type
app.get('/api/accountcodeforinventory/ddlacc_type', async (req, res) => {
  console.log('accountcodeforinventory/ddlacc_type')
  await GetDropDownAccType(req, res, req.body)
})

//Add Account Code For Inventory
app.post('/api/accountcodeforinventory', verifyToken, async (req, res) => {
  console.log('add_accountcodeforinventory')
  await verify(req.token, secretkey, async (err, authData) => {
    if (err) {
      const data = {
        status: StatusUnauthorized,
        Code: CodeW0002,
      }
      await Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      await AddAccountCodeForInventory(req, res, req.body, user);
    }
  })
})

//Edit Account Code For Inventory
app.put('/api/accountcodeforinventory', verifyToken, async (req, res) => {
  console.log('edit_accountcodeforinventory')
  await verify(req.token, secretkey, async (err, authData) => {
    if (err) {
      const data = {
        status: StatusUnauthorized,
        Code: CodeW0002,
      }
      await Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      await EditAccountCodeForInventory(req, res, req.body, user);
    }
  })
})

//Upload Account Code For Inventory
app.get('/api/upload/accountcodeforinventory_template', async (req, res) => {
  console.log('downloadtemplate_accountcodeforinventory')
  let file = __dirname + '/upload/TemplateAccountCodeForInventory.xlsx'
  await res.download(file)
})

//Import Account Code For Inventory
app.put('/api/accountcodeforinventory/import', verifyToken, async (req, res) => {
  console.log('import_accountcodeforinventory')
  await verify(req.token, secretkey, async (err, authData) => {
    if (err) {
      const data = {
        status: StatusUnauthorized,
        Code: CodeW0002,
      }
      await Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      const obj = req.body['obj']

      await ImportAccountCodeForInventory(req, res, obj, user);
    }
  })
})

//Get Account Code For Inventory /Validation Import
app.get('/api/accountcodeforinventoryvalidation', async (req, res) => {
  console.log('accountcodeforinventoryvalidation')
  await GetValidationAccountCodeForInventory(req, res, req.body);
})

//Stemp Inventory
app.post('/api/stampinventory', verifyToken, async (req, res) => {
  console.log('stampinventory')
  await verify(req.token, secretkey, async (err, authData) => {
    if (err) {
      const data = {
        status: StatusUnauthorized,
        Code: CodeW0002,
      }
      await Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      await AddStampInventory(req, res, req.body, user);
    }
  })
})

//Get Import To JDE /DropDown Period
app.get('/api/importtojde/ddlperiod', async (req, res) => {
  console.log('importtojde/ddlperiod')
  await GetDropDownPeriod(req, res, req.body)
})

//Get Unitcost /DropDown Inven Category
app.get('/api/unitcost/ddlinvencategory', async (req, res) => {
  console.log('unitcost/ddlinvencategory')
  await GetDropDownInvenCategory(req, res, req.body);
})

//Get Unitcost
app.get('/api/unitcost/:period', async (req, res) => {
  console.log('get_unitcost')
  await GetDataTableUnitCost(req, res, req.body)
})

//Get Unitcost
app.get('/api/unitcost/:period/:invencategory', async (req, res) => {
  console.log('get_unitcost')
  await GetDataTableUnitCost(req, res, req.body)
})

//Get Unitcost
app.get('/api/unitcost/:period/:invencategory/:stockno', async (req, res) => {
  console.log('get_unitcost')
  await GetDataTableUnitCost(req, res, req.body)
})

//Edit Unitcost
app.put('/api/unitcost', verifyToken, async (req, res) => {
  console.log('edit_unitcost')
  await verify(req.token, secretkey, async (err, authData) => {
    if (err) {
      const data = {
        status: StatusUnauthorized,
        Code: CodeW0002,
      }
      await Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      const obj = req.body['obj']

      await EditUnitCost(req, res, obj, user);
    }
  })
})

//Upload Unitcost
app.get('/api/upload/unitcost_template', async (req, res) => {
  console.log('downloadtemplate_unitcost')
  let file = __dirname + '/upload/TemplateUnitCost.xlsx'
  await res.download(file)
})

//Import UnitCost
app.put('/api/unitcost/import', verifyToken, async (req, res) => {
  console.log('import_unitcost')
  await verify(req.token, secretkey, async (err, authData) => {
    if (err) {
      const data = {
        status: StatusUnauthorized,
        Code: CodeW0002,
      }
      await Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      const obj = req.body['obj']

      await ImportUnitCost(req, res, obj, user);
    }
  })
})

//Get UnitCost /Validation InvItem
app.get('/api/unitcostvalidationinvitem', async (req, res) => {
  console.log('unitcostvalidationinvitem')
  await GetValidationInvItem(req, res, req.body);
})

//Gen PH Inventroy To E1 (UnitCost)
app.post('/api/genunitocst', verifyToken, async (req, res) => {
  console.log('genunitocst')
  await verify(req.token, secretkey, async (err, authData) => {
    if (err) {
      const data = {
        status: StatusUnauthorized,
        Code: CodeW0002,
      }
      await Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      await GenInveotory(req, res, req.body, user);
    }
  })
})


//Get Receipts
app.get('/api/receipts/:store/:datefrom/:dateto', async (req, res) => {
  console.log('get_receipts')
  await GetDataTableReceipts(req, res, req.body)
})

//Get Receipts
app.get('/api/receipts/:store/:datefrom/:dateto/:invoice*', async (req, res) => {
  console.log('get_receipts')
  await GetDataTableReceipts(req, res, req.body)
})

//Get Term Closing
app.get('/api/termclosing', async (req, res) => {
  console.log('termclosing')
  await GetDataTableTermClosing(req, res, req.body)
})

//Add Term Closing
app.post('/api/termclosing', verifyToken, async (req, res) => {
  console.log('add_termclosing')
  await verify(req.token, secretkey, async (err, authData) => {
    if (err) {
      const data = {
        status: StatusUnauthorized,
        Code: CodeW0002,
      }
      await Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      await AddTermClosing(req, res, req.body, user);
    }
  })
})

//Edit Term Closing
app.put('/api/termclosing', verifyToken, async (req, res) => {
  console.log('edit_termclosing')
  await verify(req.token, secretkey, async (err, authData) => {
    if (err) {
      const data = {
        status: StatusUnauthorized,
        Code: CodeW0002,
      }
      await Expired(req, res, data)

    } else {
      const user = authData.jwtdata
      const obj = req.body['obj']

      await EditTermClosing(req, res, obj, user);
    }
  })
})

//Get Ending Inventory Period
app.get('/api/endinginventory/getperiod/:year/:month', async (req, res) => {
  console.log('endinginventory/getperiod')
  await GetPeriodEndingInventory(req, res, req.body)
})

//Get Ending Inventory
app.get('/api/endinginventory/:stamp/:store/:diff/:period', async (req, res) => {
  console.log('get_endinginventory')
  await GetDataTableEndingInventory(req, res, req.body)
})

//Get Transfer Inventory
app.get('/api/transferinventory/:stamp/:store/:datefrom/:dateto', async (req, res) => {
  console.log('get_endinginventory')
  await GetDataTableTransferInventory(req, res, req.body)
})

app.get('/api/tableautoken', async (req, res) => {
  const form = new FormData();
  form.append('username', tableautoken.username)
  const response = await fetch(tableautoken.path, { method: 'POST', body: form })
  const tableautokens = await response.text()
  res.send(tableautokens)
})



// Serve the files on port.
app.listen(webPort, () => {
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
schedule('0 0 7 * * *', async function () {
  console.log('running schedule SDCInterface 7 AM')
  await runTaskSDCInterface()
});












