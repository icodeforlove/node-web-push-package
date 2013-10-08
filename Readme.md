## web-push-package

generates a [web push package](https://developer.apple.com/library/prerelease/mac/documentation/NetworkingInternet/Conceptual/NotificationProgrammingGuideForWebsites/PushNotifications/PushNotifications.html#//apple_ref/doc/uid/TP40013225-CH3-SW7) for the Apple Push Notification service

*currently required you to have OpenSSL installed*

## installation

    $ npm install web-push-package

## usage

```javascript
new WebPushPackage({
	certificates: {
		signer: 'certificates/cert.pem',
		key: 'certificates/key.pem'
	},

	website: {
		websiteName: 'Example',
		websitePushID: 'web.com.example',
		allowedDomains: ['http://example.com'],
		urlFormatString: 'http://example.com/information/%@', // website arg format
		authenticationToken: 'a823ca752962ed1504c7c15691dcb276' // should be 20+ chars,
		webServiceURL: 'https://example.com'
	},

	iconPath: 'icons',

	callback: function (pushPackage) {
		// fs.writeFileSync('package.zip', pushPackage);
	}
});
```

the above would generate a package looking like this

- icon.iconset/icon_128x128.png
- icon.iconset/icon_128x128@2x.png
- icon.iconset/icon_16x16.png
- icon.iconset/icon_16x16@2x.png
- icon.iconset/icon_32x32.png
- icon.iconset/icon_32x32@2x.png
- manifest.json
- signature
- website.json
