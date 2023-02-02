const puppeteer = require('puppeteer-extra');
const pluginStealth = require('puppeteer-extra-plugin-stealth');
const {executablePath} = require('puppeteer');
const configs = require('./configs');

puppeteer.use(pluginStealth());

async function startBrowser()
{
    let browser;
	try 
    {
	    console.log('Khởi chạy trình duyệt...');

        browser = await puppeteer.launch({
                headless: true,
                devtools: false,
                executablePath: configs.executablePath || executablePath(),
                ignoreHTTPSErrors: true
        });
	} 
	catch (error) 
	{
        browser = null;
	    console.log(`Không thể khởi chạy trình duyệt => error => ${error}\n`);
	}

	return browser;
}

module.exports = {
	startBrowser
};