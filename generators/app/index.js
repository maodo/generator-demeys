const Generator = require('yeoman-generator');
const fs = require('fs');
const exec = require('child_process').exec
const npm = require('./utils/npm');

module.exports = class extends Generator {

	constructor(args, opts) {
		super(args, opts);
		this.answers = {};

		this.on('end', function () {
			exec(`git add -A && git commit -m "First Commit"`, { cwd: this.answers.projectName });
		});
	}

	prompting() {
		return this.prompt([{
			type: 'input',
			name: 'projectName',
			message: 'Your project Name'
		}, {
			type: 'list',
			name: 'projectType',
			message: 'Type of the project',
			choices: ['Web', 'Back']
		}, {
			type: 'list',
			name: 'choiceType',
			message: 'Choice of the web project',
			when: (response) => response.projectType === 'Web',
			choices: ['Basic']
		}, {
			type: 'list',
			name: 'choiceType',
			message: 'Choice of the back project',
			when: (response) => response.projectType === 'Back',
			choices: ['NodeJS', 'Java/Springboot', 'Java/Dropwizard']
		}, {
			type: 'list',
			name: 'framework',
			message: 'Choice of the framework',
			when: (response) => response.choiceType === 'NodeJS',
			choices: ['Express', 'HapiJS']	
		}, {
			type: 'list',
			name: 'documentationFormat',
			message: 'Format of your Documentation',
			choices: ['Markdown', 'AsciiDoc']
		}]).then(answers => this.answers = answers);
	}

	/**
	 * Create a folder based on the project name
	 */
	createFolder() {
		fs.mkdirSync(this.answers.projectName);
	}

	initGitRepository() {
		exec('git init -q ' + this.answers.projectName);
	}

	createREADME() {
		let file = this.answers.documentationFormat === 'Markdown' ? 'README.md' : 'README.asciidoc';
		this.fs.copyTpl(
			this.templatePath(file),
			this.destinationPath(`${this.answers.projectName}/${file}`),
			{ projectName: this.answers.projectName }
		);
	}

	createGitIgnoreFile() {
		let patterns = ['*.iml', '.idea'];
		if (this.answers.projectType === 'Web' || (this.answers.projectType === 'Back' && this.answers.choiceType === 'NodeJS')) {
			patterns = patterns.concat(['node_modules']);
		} else if (this.answers.projectType === 'Back' && this.answers.choiceType === 'Java/Dropwizard') {
			patterns = patterns.concat(['target', '*/target/*']);
		}

		this.fs.copyTpl(
			this.templatePath('.gitignore'),
			this.destinationPath(`${this.answers.projectName}/.gitignore`),
			{ patterns }
		);
	}

	createNpmPackage() {
		if (this.answers.projectType === 'Web') {
			npm.createNpmPackage.call(this, './node_modules/.bin/live-server --proxy=/api:http://localhost:3000/api');
		}
		if (this.answers.projectType === 'Back' && this.answers.choiceType === 'NodeJS') {
			npm.createNpmPackage.call(this, 'node index.js');
		}
	}

	installDependencies() {
		if (this.answers.projectType === 'Web') {
			this.npmInstall(['live-server@1.2.0'], { 'save-dev': true }, null, { cwd: this.answers.projectName });
		}
		if(this.answers.framework === 'Express'){
			this.npmInstall(['express@4.14.0'], { 'save': true }, null, {cwd: this.answers.projectName});
		}
		if(this.answers.framework === 'HapiJS'){
			this.npmInstall(['hapi@16.1.0'], { 'save': true }, null, {cwd: this.answers.projectName});
		}
	}

	copyWebFiles() {
		if (this.answers.projectType === 'Web') {
			this.fs.copy(
				this.templatePath('web/!(index.html)'),
				this.destinationPath(this.answers.projectName)
			);
			this.fs.copyTpl(
				this.templatePath('web/index.html'),
				this.destinationPath(`${this.answers.projectName}/index.html`),
				{ projectName: this.answers.projectName }
			);
		}

		if(this.answers.framework === 'Express'){
			this.fs.copyTpl(
				this.templatePath('back/express/index.js'),
				this.destinationPath(`${this.answers.projectName}/index.js`),
				{ projectName: this.answers.projectName }
			);
		}
		if(this.answers.framework === 'HapiJS'){
			this.fs.copyTpl(
				this.templatePath('back/hapijs/index.js'),
				this.destinationPath(`${this.answers.projectName}/index.js`),
				{ projectName: this.answers.projectName }
			);
		}
	}

  copySpringBootFiles() {
		if (this.answers.projectType === 'Back' && this.answers.choiceType === 'Java/Springboot') {
			this.fs.copy(
				this.templatePath('back/springboot/'),
				this.destinationPath(this.answers.projectName)
			);
			this.fs.copyTpl(
				this.templatePath('back/springboot/src/main/java/app/controller/DemeysController.java'),
				this.destinationPath(`${this.answers.projectName}/src/main/java/app/controller/DemeysController.java`),
        { projectName: this.answers.projectName }
			);
		}
  }
	
  copyDWFiles() {
		if (this.answers.projectType === 'Back' && this.answers.choiceType === 'Java/Dropwizard') {
			this.fs.copy(
				this.templatePath('back/dropwizard/'),
				this.destinationPath(this.answers.projectName)
			);
			this.fs.copyTpl(
				this.templatePath('back/dropwizard/application/src/main/java/com/demeys/app/services/AppService.java'),
				this.destinationPath(`${this.answers.projectName}/application/src/main/java/com/demeys/app/services/AppService.java`),
				{ projectName: this.answers.projectName }
			);
		}
	}
}
