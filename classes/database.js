var db = {};

db.connect = () => {
    db.connection = mysql.createConnection(config.mysql);
    db.connection.connect();
}

db.end = () => {
    db.connection.end();
}

db.query = (sql, params, options) => {
    db.connection.query(sql, params, (error, results, fields) => {
        if (error) {
            throw error;
        }

        if (typeof options.callback === 'function') {
            options.callback.call(this, results);
        }
    });
}

db.write = (table, data) => {

}

db.update = (table, fields, where) => {

}

db.read = async (table, fields, where, options) => {
    where = db.getWhereSQL(where);
    return new Promise((resolve, reject) => {
        db.query('SELECT ' + db.getFieldsSQL(fields) + ' FROM `' + table + '`' + where.SQL, where.params, {callback: (results) => {
            resolve(results);
        }});
    })

}

db.customQuery = async (sql, params) => {
    return new Promise((resolve, reject) => {
        db.query(sql, params, {callback: (results) => {
            resolve(results);
        }});
    })

}

db.delete = (table, where) => {
    var sql = 'DELETE FROM `' + table + '`';
    var whereSQL = '';
    var values = [];

    if (typeof where === 'object') {
        var whereSQL = ' WHERE ';
        Object.keys(where).forEach(function (column) {
            var value = where[column];
            if (typeof value === 'object') {
                whereSQL += column + ' IN (';
                value.forEach(function (v) {
                    values.push(v);
                    whereSQL += '?, ';
                });
                whereSQL = where.substring(0, where.length - 2) + ') ';
            } else {
                values.push(value);
                whereSQL += column + ' = ? '
            }
        });
    }

    return db.query(sql + whereSQL, values);
}

db.getFieldsSQL = (columns) => {
    if (typeof columns === 'object') {
        var fields = Object.keys(columns);
        if (fields.length) {
            var sql = '';

            fields.forEach(function (v) {
                if (!isNaN(parseInt(v))) {
                    sql += columns[v] + ', ';
                } else {
                    sql += v + ' AS ' + columns[v] + ', ';
                }
            });
            sql = sql.substring(0, sql.length - 2)
            return sql;
        } else {
            return '*';
        }
    } else {
        return '*';
    }
}

db.getWhereSQL = (columns) => {
    if (typeof columns === 'object') {
        var values = [];
        var whereSQL = ' WHERE ';
        
        Object.keys(columns).forEach(function (column) {
            var value = columns[column];
            if (typeof value === 'object') {
                whereSQL += column + ' IN (';
                value.forEach(function (v) {
                    values.push(v);
                    whereSQL += '?, ';
                })
                whereSQL = where.splice(0, -2) + ') ';
            } else {
                values.push(value);
                whereSQL += column + ' = ? '
            }
        });

        return {SQL: whereSQL, params: values}
    } else {
        return {SQL: '', params: []};
    }
}

module.exports = db;