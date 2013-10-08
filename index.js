var PromiseObject = require('promise-object'),
	when = require('whenplus'),
	glob = require('glob'),
	path = require('path'),
	fs = require('fs'),
	crypto = require('crypto'),
	AdmZip = require('adm-zip');

var WebPushPackage = PromiseObject.create({
	initialize: function ($config) {
		this._icons = {};
		this._website = $config.website;
		this._iconPath = $config.iconPath;
		this._certificates = $config.certificates;

		this._getPackageFiles().done(function (files) {
			var zip = new AdmZip();

			files.forEach(function (file) {
				zip.addFile(file.name, file.data);
			});

			$config.callback(zip.toBuffer());
		}, function (error) {
			console.log(error.stack);
		});
	},

	_getPackageFiles: function ($deferred, $self) {
		var files = [];
		this._getIcons().done(function (icons) {
			files = files.concat(icons);
			files.push($self._generateWebsiteJSON());

			var manifest = $self._generateManifestJSON(files);
			files.push(manifest);

			$self._generateManifestSignature(manifest.data).done(function (data) {
				files.push({
					data: data,
					name: 'signature'
				});

				$deferred.resolve(files);
			}, $deferred.reject);
		}, $deferred.reject);
	},

	_generateManifestJSON: function (files) {
		var manifest = {};
		files.forEach(function (file) {
			manifest[file.name] = crypto.createHash('sha1').update(file.data).digest('hex');
		}, this);

		return {
			data: new Buffer(JSON.stringify(manifest).replace(/\//g, '\\/')),
			name: 'manifest.json'
		};
	},

	_generateManifestSignature: function ($deferred, $self, manifestData) {
		var tempFile = '/tmp/' + Math.random();

		fs.writeFile(tempFile, manifestData, function (error) {
			if (error) return $deferred.reject(error);

			var spawn = require('child_process').spawn,
				openssl = spawn('openssl', ['smime', '-sign', '-in', tempFile, '-signer', $self._certificates.signer, '-inkey', $self._certificates.key]),
				data;

			openssl.stdout.on('data', function (chunk) {
				data = data ? data + chunk : chunk;
			});

			openssl.stderr.on('data', function (data) {
				console.log('stderr: ' + data);
			});

			openssl.on('close', function (code) {

				var base64 = data.match(/Content-Disposition:[^\n]+\s*?([A-Za-z0-9+=\/\r\n]+)\s*?-----/);
				if (base64) {
					base64 = base64[1].replace(/[\s]/g, '');
					base64 = new Buffer(base64, 'base64');

					fs.unlink(tempFile, function (error) {
						if (error) return $deferred.reject(error);
						$deferred.resolve(base64);
					});

				}
			});
		});
	},

	_generateWebsiteJSON: function () {
		var data = new Buffer(JSON.stringify(this._website).replace(/\//g, '\\/'));

		return {
			data: data,
			name: 'website.json'
		};
	},

	_getIcons: function ($deferred, $self) {
		glob(this._iconPath + '/*', function (error, files) {
			if (error) return $deferred.reject(error);

			when.map(files, $self._getFile).done(function (files) {
				$deferred.resolve(files);
			}, $deferred.reject);
		});
	},

	_getFile: function ($deferred, $self, filePath) {
		fs.readFile(filePath, function (error, data) {
			if (error) return $deferred.reject(error);
			$deferred.resolve({name: 'icon.iconset/' + path.basename(filePath), data: data});
		});
	}
});

module.exports = WebPushPackage;