'use strict';

const crypto = require('crypto');
const fs = require('fs');

class SQLDumpGenerator {
	constructor(targetBytes, filepath) {
		this.totalBytes = 0;
		this.targetBytes = targetBytes;
		this.pct = 0;
		this.targetFile = filepath;
		this.startTime = new Date().getTime();
		this.stream = fs.createWriteStream(this.targetFile, { flags: 'w' });
		this.stream.on('error', console.error);
	}

	async init() {
		const interval = setInterval(() => this.updateProgress(), 1000);
		await this.write('CREATE TABLE `sample_table` (`id` int(11) NOT NULL AUTO_INCREMENT, `name` varchar(250) NOT NULL, `age` int(11) NOT NULL, `date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (`id`));\n');
		while (this.totalBytes < this.targetBytes) {
			await this.write(`INSERT INTO \`sample_table\` (\`name\`, \`age\`) VALUES ('${this.randName()}', '${this.randAge()}');\n`);
		}
		this.stream.end();
		clearInterval(interval);
		this.updateProgress();
	}

	write(str) {
		return new Promise((resolve) => {
			this.totalBytes += Buffer.byteLength(str, 'utf8');
			this.stream.write(str, resolve);
		});
	}

	output(str, overwriteLine = false) {
		if (overwriteLine) {
			process.stdout.clearLine();
			process.stdout.cursorTo(0);
		}
		process.stdout.write(str);
	}

	updateProgress() {
		const pct = Math.min(100, Math.floor((this.totalBytes / this.targetBytes) * 10000) / 100);
		const elapsedTime = new Date().getTime() - this.startTime;
		const msPerByte = elapsedTime / this.totalBytes;
		const message = (pct === 100)
			                ? `${pct}% complete in ${this.formatElapsed(elapsedTime)}.`
			                : `${pct}% complete, ${this.formatElapsed(msPerByte * (this.targetBytes - this.totalBytes))} remaining.`;
		this.output(message, true);
	}

	randName() {
		return crypto.randomBytes(16).toString('hex');
	}

	randAge() {
		return Math.floor(Math.random() * (95 - 18 + 1)) + 18;
	}

	formatElapsed(millis) {
		const minutes = Math.floor(millis / 60000);
		const seconds = ((millis % 60000) / 1000).toFixed(0);
		return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
	}
}

module.exports = SQLDumpGenerator;

// (async function main(){
// const generator = new SQLDumpGenerator(2.5 * 1e+9, 'large_dump.sql');
// await generator.init();
// console.log("\nDump created: ", generator.targetFile);
// })();
