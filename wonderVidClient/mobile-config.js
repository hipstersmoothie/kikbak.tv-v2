App.accessRule('*'); 

App.info({
  id: 'com.lisowski.kikbak',
  name: 'kikbak.tv',
  description: 'Top Music Videos of the Web',
  author: 'Andrew Lisowski and Emmett Harper',
  website: 'http://kikbak.tv'
});

App.setPreference('Orientation', 'default');
App.setPreference('Orientation', 'all', 'ios')

App.setPreference('StatusBarStyle', 'lightcontent');
App.setPreference('StatusBarOverlaysWebView', 'true');

App.icons({
  // iOS
  'iphone': 'public/app-icons/Icon-60.png',
  'iphone_2x': 'public/app-icons/Icon-60@2x.png',
  'iphone_3x': 'public/app-icons/Icon-60@3x.png',
  'ipad': 'public/app-icons/Icon-76.png',
  'ipad_2x': 'public/app-icons/Icon-76@2x.png'
});

App.launchScreens({
	'iphone_2x': 'public/splashScreens/iPhone4-2x.png',
	'iphone5': 'public/splashScreens/iPhone5-2x.png', 
	'iphone6': 'public/splashScreens/iPhone6-2x.png',
	'iphone6p_portrait': 'public/splashScreens/iPhone6+-3x.png',
	'ipad_portrait': 'public/splashScreens/ipadPortrait.png',
	'ipad_landscape': 'public/splashScreens/ipadLandscape.png'
});