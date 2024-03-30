'use strict';

// SET THESE FOR LOCAL TESTING ONLY!
// RESET THEM TO '' BEFORE COMMITING CHANGES!
const mysqlHost = '127.0.0.1';
const mysqlUser = 'root';
const mysqlPass = 'bijoux22';

const expect = require('chai').expect;

const MySQLImporterClass = require('../classes/mysql-importer.class');

const {
  query,
	mysqlConnect,
	createTestDB,
	destroyTestDB,
	closeConnection
} = require('./test-helpers');

const config = {
	host: mysqlHost || '127.0.0.1',
	user: mysqlUser || 'root',
	password: mysqlPass || '',
	database: 'mysql-import-test-db-1'
};
const startTime = new Date();
let importer;

describe('Running All Tests', () => {
	before(() => {
		(async () => {
			await mysqlConnect(config);
			importer = new MySQLImporterClass(config);

			// For coverage
			importer.onProgress('Not a function');
			importer.onDumpCompleted('Not a function');

			importer.onProgress((progress) => {
				const percent = Math.floor((progress.bytesProcessed / progress.totalBytes) * 10000) / 100;
				const filename = progress.file_path.split('/').pop();
				const message = `\tFile ${progress.file_no} of ${progress.total_files}: processing ${filename} - ${percent}% Complete`;
				if (process.stdout.isTTY) {
					process.stdout.clearLine();
					process.stdout.cursorTo(0);
					process.stdout.write(message);
				} else {
					console.log(message);
				}
			});

			importer.onDumpCompleted((status) => {
				const filename = status.file_path.split('/').pop();
				let message;
				if (status.error) {
					message = `\tFile ${status.file_no} of ${status.total_files}: Was not processed.\n`;
				} else {
					message = `\tFile ${status.file_no} of ${status.total_files}: Completed processing ${filename}\n`;
				}
				if (process.stdout.isTTY) {
					process.stdout.clearLine();
					process.stdout.cursorTo(0);
					process.stdout.write(message);
				} else {
					console.log(message);
				}
			});

			importer.setEncoding('utf8');

			await createTestDB('mysql-import-test-db-1');
			await createTestDB('mysql-import-test-db-2');
			query('USE `mysql-import-test-db-1`');
			await importer.import(`${__dirname}/sample_dump_files/test.sql`);
		})();
	});

	after(async () => {
		await destroyTestDB('mysql-import-test-db-1');
		await destroyTestDB('mysql-import-test-db-2');
		await closeConnection();
		console.log(`All tests completed in ${(new Date() - startTime) / 1000} seconds.`);
	});

	it('Import two tables', async () => {
		const tables = await query('SHOW TABLES;');
		expect(tables.length).to.equal(2);
	});

	it('978 Rows Imported Into Test DB', async () => {
		const rows = await query('SELECT * FROM `importtest`;');
		expect(rows.length).to.equal(978);
	});

	it('5 Rows With Semicolons Imported Into Test DB', async () => {
		const rows = await query('SELECT * FROM `importtest` WHERE `doc` LIKE "%;%";');
		expect(rows.length).to.equal(5);
	});

	it('Reuse Importer', async () => {
		await importer.import(`${__dirname}/sample_dump_files/test2.sql`);
		const tables = await query('SHOW TABLES;');
		expect(tables.length).to.equal(3);
	});

	it('5 Rows Inserted in 2nd Table', async () => {
		const rows = await query('SELECT * FROM `test_table_2`;');
		expect(rows.length).to.equal(5);
	});

	it('Import Array, Directory', async () => {
		await importer.import(`${__dirname}/sample_dump_files/test3.sql`,
			`${__dirname}/sample_dump_files/more_sample_files/`);
		const tables = await query('SHOW TABLES;');
		expect(tables.length).to.equal(6);
	});

	it('Change database', async () => {
		query('USE `mysql-import-test-db-2`;');
		importer.use('mysql-import-test-db-2');
		await importer.import(`${__dirname}/sample_dump_files/`);
		const tables = await query('SHOW TABLES;');
		expect(tables.length).to.equal(6);
	});

	it('Test imported', async () => {
		const files = importer.getImported();
		expect(files.length).to.equal(11);
	});

	it('Test imported function', async () => {
		const funcs = await query("SHOW FUNCTION STATUS LIKE 'testfunc';");
		expect(funcs.length).to.equal(1);
	});

	it('Test unsupported encoding', () => {
		let error;
		try {
			importer.setEncoding('#we&%');
		} catch (e) {
			error = e;
		}
		expect(typeof error).to.equal('object');
	});

	it('Test manually connecting', async () => {
		const host = config.host;
		let error = null;
		try {
			importer._connection_settings.host = '#$%^';
			await importer._connect();
		} catch (e) {
			error = e;
			importer._connection_settings.host = host;
		}
		expect(typeof error).to.equal('object');
	});

	it('Test live DB change', async () => {
		await importer._connect();
		await importer._connect(); // a second time time, intentionally
		await importer.use('mysql-import-test-db-1'); // should work with no problems
		let error;
		try {
			await importer.use('mysql-import-test-#$%');
		} catch (e) {
			error = e;
		}
		try { await importer.disconnect(true); } catch (e) { /* empty */ }
		expect(typeof error).to.equal('object');
	});

	it('Single file error handling', async () => {
		let error;
		try {
			await importer.importSingleFile('@#$');
		} catch (e) {
			error = e;
		}
		expect(typeof error).to.equal('object');
	});

	it('Test fake sql file.', async () => {
		const fakeSQLFile = `${__dirname}/sample_dump_files/more_sample_files/not_sql.txt`;
		let error;
		try {
			await importer.importSingleFile(fakeSQLFile);
		} catch (e) {
			error = e;
		}
		expect(typeof error).to.equal('object');
	});

	it('Test importing broken file.', async () => {
		const fakeSQLFile = `${__dirname}/broken_dump_files/dump.sql`;
		const fakeSQLFile2 = `${__dirname}/broken_dump_files/dump_1.sql`;
		let error;
		try {
			await importer.import(fakeSQLFile, fakeSQLFile2);
		} catch (e) {
			error = e;
		}
		expect(typeof error).to.equal('object');
	});

	it('Test diconnect function.', async () => {
		try {
			importer._conn = false;
			await importer.disconnect();
			await importer._connect();
			await importer.disconnect(false);
		} catch (e) { /* empty */ }
	});

	it('Test fileExist method.', async () => {
		let error;
		try {
			await importer._fileExists('!@#$');
		} catch (e) {
			error = e;
		}
		expect(typeof error).to.equal('object');
	});

	it('Test statFile method.', async () => {
		let error;
		try {
			await importer._statFile('!@#$');
		} catch (e) {
			error = e;
		}
		expect(typeof error).to.equal('object');
	});

	it('Test readDir method.', async () => {
		let error;
		try {
			await importer._readDir('!@#$');
		} catch (e) {
			error = e;
		}
		expect(typeof error).to.equal('object');
	});

	it('Testing path parser.', async () => {
		let error;
		try {
			await importer._getSQLFilePaths('!@#$', '$%^#^', `${__dirname}/broken_dump_files`);
		} catch (e) {
			error = e;
		}
		expect(typeof error).to.equal('object');
	});
});
