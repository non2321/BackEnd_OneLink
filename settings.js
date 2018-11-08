export const dbConfig = {
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


export const adConfig = {
    url: 'ldap://hq-ad-master.phthailand.com',
    baseDN: 'dc=phthailand,dc=com',
    username: 'admin.app@phthailand.com',
    password: 'happYHour.200'
}

export const tableautoken = {
    path: 'http://192.168.151.31/trusted',
    username: 'admin',
    servergentoken : 'http://192.168.151.113:3000/api/tableautoken'
}

export const domain = 'phthailand'

export const secretkey = 'one-link'

export const tokenexpires = '30m'

export const webPort = 3000;


export const FontEndPath = 'http://localhost:8080'