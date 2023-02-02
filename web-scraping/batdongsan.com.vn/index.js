const browserObject = require('./browser');
const scraperObject = require('./scraper');

(async () => {
    
    let browser = await browserObject.startBrowser();

    if(browser != null)
    {
        await Promise.all([
            scraperObject.scraper(browser,'https://batdongsan.com.vn/nha-dat-ban-binh-duong/p1'),
            scraperObject.scraper(browser,'https://batdongsan.com.vn/nha-dat-ban-da-nang/p1'),
            scraperObject.scraper(browser,'https://batdongsan.com.vn/nha-dat-ban-khanh-hoa/p1'),
            scraperObject.scraper(browser,'https://batdongsan.com.vn/nha-dat-ban-dong-nai/p1'),
            scraperObject.scraper(browser,'https://batdongsan.com.vn/nha-dat-ban-hai-phong/p1')
        ]);

        console.log('Đóng trình duyệt...');

        await browser.close();
    }

})().catch(error => {
    console.error(`Không thể tạo phiên bản trình duyệt => ${error}\n`);
});