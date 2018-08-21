exports.dbConfig = {
    user: 'sa',
    password: 'r1ckY.1958',
    server: '192.168.151.114',
    database: 'PHCDB_DEV',
    pool: {
        max: 50,
        min: 0,
        idleTimeoutMillis: 30000
    }
};


exports.adConfig = {
    url: 'ldap://hq-ad-master.phthailand.com',
    baseDN: 'dc=phthailand,dc=com',
    username: 'admin.app@phthailand.com',
    password: 'happYHour.200'
}

exports.tableautoken = {
    path: 'http://192.168.151.31/trusted',
    username: 'admin'   
}

exports.domain = 'phthailand'

exports.secretkey = 'one-link'

exports.tokenexpires = '30m'

exports.webPort = 3000;


exports.FontEndPath = 'http://localhost:8080'