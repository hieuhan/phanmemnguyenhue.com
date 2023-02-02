const cheerio = require('cheerio');
const UserAgent = require('user-agents');
const userAgent = new UserAgent({ deviceCategory: 'desktop' });
const utils = require('./utils');
const dbHelper = require('./db_helpers');
const configs = require('./configs');
const dbhelpers = require('../../../web-scraping__/batdongsan.com.vn/dbhelpers');
const { url } = require('../../../web-scraping__/batdongsan.com.vn/scraper');

const scraperObject = {

    async scraper(browser, pageUrl)
    {
        try 
        {
            if (!utils.validateUrl(pageUrl)) 
            {
                await dbhelpers.scrapeLogInsert({
                    SiteId: configs.siteId,
                    Path: pageUrl,
                    Message: 'Url không hợp lệ'
                });

                return;
            }

            // Open a new page
            const page = await browser.newPage();

            page.setUserAgent(userAgent.random().toString());

            await page.setRequestInterception(true);

            page.on('request', (request) => {
                if (request.resourceType() === 'document') 
                {
                    request.continue();
                } 
                else 
                {
                    request.abort();
                }
            });

            console.log(`Truy cập trang => \n${pageUrl}\n`);

            const currentPage = utils.getCurrentPageUrl(pageUrl);
                    
            console.log(`Truy cập trang => ${currentPage} => danh sách bài đăng => \n ${pageUrl}\n`);

            await dbhelpers.scrapeLogInsert({
                SiteId: configs.siteId,
                Path: pageUrl,
                Message: `Truy cập trang => ${currentPage}`
            });

            // On this new page:
            // - open the "http://quotes.toscrape.com/" website
            // - wait until the dom content is loaded (HTML is ready)
            const pageResponse = await page.goto(pageUrl, { waitUntil: 'domcontentloaded'});

            //console.log(pageResponse.status());

            const scrapeCurrentPage = async (pageUrl) =>
            {
                try 
                {
                    await page.waitForSelector('.re__main-content');

                    console.log(`Thu thập url bài đăng => \n${pageUrl}\n`);

                    let productUrls = await page.$$eval('.re__srp-list .js__card-full-web', card => 
                    {
                        return card.map(el => el.querySelector('a.js__product-link-for-product-id').href);
                    });

                    let pagePromise = (productUrl) => new Promise(async(resolve, reject) =>
                    {
                        try 
                        {
                            let newPage = await browser.newPage();

                            newPage.setUserAgent(userAgent.random().toString());

                            await newPage.setRequestInterception(true);

                            newPage.on('request', (request) => 
                            {
                                if (request.resourceType() === 'document') 
                                {
                                    request.continue();
                                } 
                                else 
                                {
                                    request.abort();
                                }
                            });

                            console.log(`Truy cập bài đăng => \n${productUrl}\n`);

                            const newPageResponse = await newPage.goto(productUrl, { waitUntil: 'domcontentloaded'});

                            //console.log(newPageResponse.status());

                            await waitForTimeout(newPage);

                            await parserData(newPage, pageUrl, productUrl);

                            resolve(true);

                            await pageClose(newPage, productUrl);
                        } 
                        catch (error) 
                        {
                            resolve(false);
                            await scraperObject.scraperLog('pagePromise', error, pageUrl, productUrl);
                        }
                    });

                    for(link in productUrls)
                    {
                        await pagePromise(productUrls[link]);
                    }

                    let content = await page.content();

                    const $ = cheerio.load(content);

                    //link phan trang
                    let nextButton = $('.re__pagination-icon > .re__icon-chevron-right--sm').first();

                    let nextButtonExist = false;

                    if(nextButton.length > 0)
                    {
                        nextButtonExist = true;
                    }

                    if(nextButtonExist)
                    {
                        const nextButtonParent = nextButton.closest('.re__pagination-icon');

                        if(nextButtonParent.length > 0)
                        {
                            const nextButtonParentHref = nextButtonParent.attr('href');

                            if(nextButtonParentHref)
                            {
                                const nextUrl = utils.getProductUrl(nextButtonParentHref);

                                const nextPage = utils.getCurrentPageUrl(nextButtonParentHref);
            
                                console.log(`Truy cập trang => ${nextPage} => danh sách bài đăng => \n ${nextUrl}\n`);

                                const nextPageResponse = await page.goto(nextUrl, { waitUntil: 'domcontentloaded'});

                                console.log(nextPageResponse.status());

                                await dbHelper.scrapeLogInsert({
                                    SiteId: configs.siteId,
                                    Path: nextUrl,
                                    Message: `Truy cập trang => ${nextPage}`
                                })

                                return scrapeCurrentPage(nextUrl);
                            }
                        }
                    }
                
                    //đóng page
                    await pageClose(page, pageUrl);
                } 
                catch (error) 
                {
                    await scraperObject.scraperLog('scrapeCurrentPage', error, pageUrl, null);
                }
            }

            const parserData = async (page, pageUrl, productUrl) =>
            {
                try 
                {
                    let resultVar = [];

                    let content = await page.content();

                    const $ = cheerio.load(content);

                    const [actionTypeId, landTypeId, investorId, provinceId, customerId] = await Promise.all([
                        parserActionType($, pageUrl, productUrl),
                        parserLandType($, pageUrl, productUrl),
                        parserInvestor($, pageUrl, productUrl),
                        parserProvince($, pageUrl, productUrl),
                        parserCustomer($, pageUrl, productUrl)
                    ]);

                    if(provinceId > 0)
                    {
                        resultVar.DistrictId = await parserDistrict($, provinceId, pageUrl, productUrl);

                        if(resultVar.DistrictId > 0)
                        {
                            resultVar.WardId = await parserWards($, provinceId, resultVar.DistrictId, pageUrl, productUrl);

                            if(resultVar.WardId > 0)
                            {
                                resultVar.StreetId = await parserStreet($, provinceId, resultVar.DistrictId, resultVar.WardId, pageUrl, productUrl);
                            }
                        }

                        const [projectId, productId] = await Promise.all([
                            parserProject($, (investorId || 0), provinceId, (resultVar.DistrictId || 0), pageUrl, productUrl),
                            parserProduct($, actionTypeId, landTypeId, provinceId, (resultVar.DistrictId || 0), (resultVar.WardId || 0), (resultVar.StreetId || 0), resultVar.ProjectId, customerId, pageUrl, productUrl)
                        ]);
                    }

                    await waitForTimeout(page);
                } 
                catch (error) 
                {
                    await scraperObject.scraperLog('parserData', error, pageUrl, productUrl);
                }
            }

            const parserActionType = async ($, pageUrl, productUrl) =>
            {
                let actionTypeId = 0;
                try 
                {
                    let breadcrumbElement = $('.re__breadcrumb').first();

                    if(breadcrumbElement.length > 0)
                    {
                        let breadcrumbs = breadcrumbElement.text().trim().split('/');

                        if(breadcrumbs.length > 0)
                        {
                            const actionTypeName = breadcrumbs[0].trim();

                            if(actionTypeName.length > 0)
                            {
                                const actionType = 
                                {
                                    SiteId: configs.siteId,
                                    Name: actionTypeName
                                }
        
                                actionTypeId = await dbHelper.actionTypeInsert(actionType);
                            }
                        }
                    }
                } 
                catch (error) 
                {
                    await scraperObject.scraperLog('parserActionType', error, pageUrl, productUrl);
                }

                return actionTypeId;
            }

            const parserLandType = async ($, pageUrl, productUrl) =>
            {
                let resultVar = 0;
                try 
                {
                    let breadcrumbElement = $('.re__breadcrumb').first();

                    if(breadcrumbElement.length > 0)
                    {
                        let breadcrumbs = breadcrumbElement.text().trim().split('/');

                        if(breadcrumbs.length > 3)
                        {
                            const landTypeName = breadcrumbs[3].split('tại')[0].trim().replace('Loại bất động sản khác', 'Bất động sản khác');

                            if(landTypeName.length > 0)
                            {
                                let landType = {
                                    SiteId: configs.siteId,
                                    Name: landTypeName
                                }
        
                                resultVar = await dbHelper.landTypeInsert(landType);
                            }
                        }
                    }
                } 
                catch (error) 
                {
                    await scraperObject.scraperLog('parserLandType', error, pageUrl, productUrl);
                }

                return resultVar;
            }

            const parserInvestor = async ($, pageUrl, productUrl) =>
            {
                let resultVar = 0;
                try 
                {
                    const projectInfoElement = $('.re__ldp-project-info').first();

                    if(projectInfoElement.length > 0)
                    {
                        const investorIconElement = projectInfoElement.find('.re__icon-office--sm').first();

                        if(investorIconElement.length > 0)
                        {
                            const investorParentElement = investorIconElement.closest('.re__prj-card-config-value');

                            if(investorParentElement.length > 0)
                            {
                                const investorElement = investorParentElement.find('.re__long-text').first();
                                
                                if(investorElement.length > 0)
                                {
                                    const investorName = investorElement.text().trim();

                                    if(investorName.length > 0 && investorName.toLowerCase().indexOf('đang cập nhật') <= 0)
                                    {
                                        const investor = {
                                            SiteId: configs.siteId,
                                            Name: investorName
                                        }
                
                                        resultVar = await dbHelper.investorInsert(investor);
                                    }
                                }
                            }
                        }
                    }
                } 
                catch (error) 
                {
                    await scraperObject.scraperLog('parserInvestor', error, pageUrl, productUrl);
                }

                return resultVar;
            }

            const parserProject = async ($, investorId, provinceId, districtId, pageUrl, productUrl) =>
            {
                let resultVar = 0;
                try 
                {
                    const projectInfoElement = $('.re__ldp-project-info').first();

                    if(projectInfoElement.length > 0)
                    {
                        let projectName = '';

                        const projectTitleElement = projectInfoElement.find('.re__project-title').first();

                        if(projectTitleElement.length > 0)
                        {
                            projectName = projectTitleElement.text().trim();
                        }

                        if(projectName.length > 0)
                        {
                            const project = {
                                SiteId: configs.siteId,
                                InvestorId: investorId,
                                ProvinceId: provinceId,
                                DistrictId: districtId,
                                Name: projectName
                            }
    
                            resultVar = await dbHelper.projectInsert(project);
                        }
                    }
                } 
                catch (error) 
                {
                    await scraperObject.scraperLog('parserProject', error, pageUrl, productUrl);
                }

                return resultVar;
            }

            const parserProvince = async ($, pageUrl, productUrl) =>
            {
                let resultVar = 0;
                try 
                {
                    const breadcrumbElement = $('.re__breadcrumb').first();

                    if(breadcrumbElement.length > 0)
                    {
                        const breadcrumbs = breadcrumbElement.text().trim().split('/');

                        if(breadcrumbs.length > 1)
                        {
                            const provinceName = breadcrumbs[1].trim();

                            if(provinceName.length > 0)
                            {
                                let province = {
                                    SiteId: configs.siteId,
                                    Name: provinceName
                                }
        
                                resultVar = await dbHelper.provinceInsert(province);
                            }
                        }
                    }
                } 
                catch (error) 
                {
                    await scraperObject.scraperLog('parserProvince', error, pageUrl, productUrl);
                }

                return resultVar;
            }

            const parserDistrict = async ($, provinceId, pageUrl, productUrl) =>
            {
                let resultVar = 0;
                try 
                {
                    const breadcrumbElement = $('.re__breadcrumb').first();

                    if(breadcrumbElement.length > 0)
                    {
                        const breadcrumbs = breadcrumbElement.text().trim().split('/');

                        if(breadcrumbs.length > 2)
                        {
                            const districtName = breadcrumbs[2].trim();

                            if(districtName.length > 0)
                            {
                                let district = {
                                    SiteId: configs.siteId,
                                    ProvinceId: provinceId,
                                    Name: districtName
                                }
        
                                resultVar = await dbHelper.districtInsert(district);
                            }
                        }
                    }
                } 
                catch (error) 
                {
                    await scraperObject.scraperLog('parserDistrict', error, pageUrl, productUrl);
                }

                return resultVar;
            }

            const parserWards = async ($, provinceId, districtId, pageUrl, productUrl) =>
            {
                let resultVar = 0;
                try 
                {
                    const addressElement = $('.js__product-detail-web .js__pr-address').first();

                    if(addressElement.length > 0)
                    {
                        let wardName = '';

                        const addressArray = addressElement.text().split(',');
                        
                        addressArray.forEach(element => {
                            if(element.trim().startsWith('Phường') || element.trim().startsWith('Xã') || element.trim().startsWith('Thị trấn')
                            || element.trim().startsWith('phường') || element.trim().startsWith('xã') || element.trim().startsWith('thị trấn'))
                            {
                                if(wardName.trim().length == 0)
                                {
                                    wardName = element.trim().replace('Phường', '').replace('Xã', '').replace('Thị trấn', '').replace('phường', '').replace('xã', '').replace('thị trấn', '').trim();
                                }
                            }
                        });

                        if(wardName.length > 0)
                        {
                            let wards = {
                                SiteId: configs.siteId,
                                ProvinceId: provinceId,
                                DistrictId: districtId,
                                Name: wardName
                            }
    
                            resultVar = await dbHelper.wardsInsert(wards);
                        }
                    }
                } 
                catch (error) 
                {
                    await scraperObject.scraperLog('parserWards', error, pageUrl, productUrl);
                }

                return resultVar;
            }

            const parserStreet = async ($, provinceId, districtId, wardId, pageUrl, productUrl) =>
            {
                let resultVar = 0;
                try 
                {
                    const addressElement = $('.js__product-detail-web .js__pr-address').first();

                    if(addressElement.length > 0)
                    {
                        let streetName = '';

                        const addressArray = addressElement.text().split(',');
                       
                        addressArray.forEach(element => {

                            if(element.indexOf('Đường') != -1 || element.indexOf('đường') != -1)
                            {
                                if(streetName.trim().length == 0)
                                {
                                    if(element.indexOf('Đường') != -1)
                                    {
                                        streetName = element.substring(element.indexOf('Đường') + 'Đường'.length,  element.length).trim();
                                    } 
                                    else if(element.indexOf('đường') != -1)
                                    {
                                        streetName = element.substring(element.indexOf('đường') + 'đường'.length,  element.length).trim();
                                    }
                                }
                            }      
                        });

                        if(streetName.length > 0)
                        {
                            let street = {
                                SiteId: configs.siteId,
                                ProvinceId: provinceId,
                                DistrictId: districtId,
                                WardId: wardId,
                                Name: streetName
                            }
    
                            resultVar = await dbHelper.streetInsert(street);
                        }
                    }
                } 
                catch (error) 
                {
                    await scraperObject.scraperLog('parserStreet', error, pageUrl, productUrl);
                }

                return resultVar;
            }

            const parserCustomer = async ($, pageUrl, productUrl) =>
            {
                let resultVar = 0;
                try 
                {
                    const mainSidebarElement = $('.re__main-sidebar').first();

                    if(mainSidebarElement.length > 0)
                    {
                        let fullName = '', phoneNumber = '', email = null, avatar = null;

                        const contactNameElement = mainSidebarElement.find('.re__contact-name').first();

                        if(contactNameElement.length > 0)
                        {
                            fullName = (contactNameElement.attr('title') || '').trim();
                        }

                        const linkSmsElement = mainSidebarElement.find('.re__link-sms.link_sms').first();

                        if(linkSmsElement.length > 0)
                        {
                            let linkSmsElementData = linkSmsElement.attr('data-href');

                            if(linkSmsElementData && linkSmsElementData.indexOf('sms://') != -1)
                            {
                                try 
                                {
                                    linkSmsElementData = linkSmsElementData.replace('sms://','').trim();

                                    linkSmsElementData = linkSmsElementData.substring(0, linkSmsElementData.indexOf('/')).replace(/[^0-9]/gm,'').trim();

                                    if(linkSmsElementData.length > 0)
                                    {
                                        phoneNumber = linkSmsElementData;
                                    }
                                } 
                                catch (error) 
                                {
                                    await scraperObject.scraperLog(`${fullName} => extract phone number from link sms => ${linkSmsElementData}`, error, pageUrl, productUrl);
                                }
                            }
                        }

                        const sendEmailElement = mainSidebarElement.find('.email-copy.re__btn.re__btn-se-border--md').first();

                        if(sendEmailElement.length > 0)
                        {
                            const sendEmailElementData = sendEmailElement.attr('data-email');

                            if(sendEmailElementData)
                            {
                                email = sendEmailElementData.trim();
                            }
                        }

                        const contactAvatarElement = mainSidebarElement.find('img.re__contact-avatar').first();

                        if(contactAvatarElement.length > 0)
                        {
                            const avatarSource = contactAvatarElement.attr('src') || contactAvatarElement.attr('data-src');

                            if(avatarSource && avatarSource.trim().length > 0)
                            {
                                avatar = avatarSource.trim();
                            }
                        }

                        if(fullName.length > 0 || phoneNumber.length > 0 || email.length > 0)
                        {
                            let customer = {
                                SiteId: configs.siteId,
                                FullName: fullName,
                                PhoneNumber: phoneNumber,
                                Email: email,
                                Avatar: avatar
                            }
    
                            resultVar = await dbHelper.customerInsert(customer);
                        }
                    }
                } 
                catch (error) 
                {
                    await scraperObject.scraperLog('parserCustomer', error, pageUrl, productUrl);
                }

                return resultVar;
            }

            const parserProduct = async ($, actionTypeId, landTypeId, provinceId, districtId, wardId, streetId, projectId, customerId, pageUrl, productUrl) =>
            {
                let resultVar = 0;
                try 
                {
                    const productDetailWebElement = $('.js__product-detail-web').first();
                    
                    if(productDetailWebElement.length > 0)
                    {
                        let title = '', breadcrumb = '', address = '', productCode = 0, 
                            publishedAt = null, expirationAt = null, verified = 0, isVideo = 0;

                        //tin đã xác thực
                        const iconVerifiedElement = productDetailWebElement.find('.re__icon-verified--sm').first();

                        if(iconVerifiedElement.length > 0)
                        {
                            verified = 1;
                        }

                        const breadcrumbElement = $('.re__breadcrumb.js__breadcrumb').first();

                        if(breadcrumbElement.length > 0)
                        {
                            breadcrumb = breadcrumbElement.text().trim();
                        }

                        const addressElement = productDetailWebElement.find('.re__pr-short-description.js__pr-address').first();

                        if(addressElement.length > 0)
                        {
                            address = addressElement.text().trim();
                        }

                        const productTitleElement = productDetailWebElement.find('.re__pr-title').first();

                        if(productTitleElement.length > 0)
                        {
                            title = productTitleElement.text().trim(), titleHtml = productTitleElement.html();

                            if(titleHtml.indexOf('hidden-mobile m-on-title') != -1)
                            {
                                let phoneNumber = '';
                                const mainSidebarElement = $('.re__main-sidebar').first();

                                if(mainSidebarElement.length > 0)
                                {
                                    const linkSmsElement = mainSidebarElement.find('.re__link-sms.link_sms').first();

                                    if(linkSmsElement.length > 0)
                                    {
                                        let linkSmsElementData = linkSmsElement.attr('data-href');

                                        if(linkSmsElementData && linkSmsElementData.indexOf('sms://') != -1)
                                        {
                                            try 
                                            {
                                                linkSmsElementData = linkSmsElementData.replace('sms://','').trim();

                                                linkSmsElementData = linkSmsElementData.substring(0, linkSmsElementData.indexOf('/')).replace(/[^0-9]/gm,'').trim();

                                                if(linkSmsElementData.length > 0)
                                                {
                                                    phoneNumber = linkSmsElementData;
                                                }
                                            } 
                                            catch (error) 
                                            {
                                                await scraperObject.scraperLog(`${fullName} => extract phone number from link sms => ${linkSmsElementData}`, error, pageUrl, productUrl);
                                            }
                                        }
                                    }
                                }

                                if(phoneNumber.length > 0)
                                {
                                    let regexTitle = /<span class="hidden-mobile m-on-title".*?>(.*?)<\/span>.*?/gm;

                                    title = titleHtml.replace(regexTitle, `${phoneNumber}`);
                                }
                            }
                            else
                            {
                                title = productTitleElement.text().trim();
                            }
                        }

                        const specsContentElement = $('.re__pr-specs-content.js__other-info').first();

                        if(specsContentElement.length > 0)
                        {
                            //ngày đăng
                            const shortInfoItemFirstElement = $('.re__pr-config .re__pr-short-info-item:nth-child(1) .value').first();

                            if(shortInfoItemFirstElement.length > 0)
                            {
                                const publishedAtSplit = shortInfoItemFirstElement.text().trim().split('/');

                                if(publishedAtSplit.length == 3)
                                {
                                    const [ publishedAtError, publishedAtData] = utils.dateToISOString(publishedAtSplit[0] , publishedAtSplit[1], publishedAtSplit[2]);
                                    
                                    if(publishedAtError)
                                    {
                                        await scraperObject.scraperLog(`Bài đăng => ${title} => PublishedAt`, publishedAtError, pageUrl, productUrl);
                                    }
                                    else
                                    {
                                        publishedAt = publishedAtData;
                                    }
                                }
                            }

                            //ngày hết hạn
                            const shortInfoItemSecondElement = $('.re__pr-config .re__pr-short-info-item:nth-child(2) .value').first();

                            if(shortInfoItemSecondElement.length > 0)
                            {
                                const expirationAtSplit = shortInfoItemSecondElement.text().trim().split('/');

                                if(expirationAtSplit.length == 3)
                                {
                                    const [ expirationAtError, expirationAtData] = utils.dateToISOString(expirationAtSplit[0], expirationAtSplit[1], expirationAtSplit[2]);

                                    if(expirationAtError)
                                    {
                                        await scraperObject.scraperLog(`Bài đăng => ${title} => ExpirationAt`, expirationAtError, pageUrl, productUrl);
                                    }
                                    else 
                                    {
                                        expirationAt = expirationAtData;
                                    }
                                }
                            }

                            //mã tin
                            const shortInfoItemFourthElement = $('.re__pr-config .re__pr-short-info-item:nth-child(4) .value').first();

                            if(shortInfoItemFourthElement.length > 0)
                            {
                                try 
                                {
                                    const shortInfoItemFourthElementClean = shortInfoItemFourthElement.text().replace(/[^0-9]/gm,'').trim();

                                    if(shortInfoItemFourthElementClean.length > 0)
                                    {
                                        productCode = parseInt(shortInfoItemFourthElementClean);
                                    }
                                } 
                                catch (error) 
                                {
                                    await scraperObject.scraperLog(`Bài đăng ${title} => ProductCode`, error, pageUrl, productUrl);
                                }
                            }

                            //tin video
                            const swiperSlideElement = $('ul.swiper-wrapper li.swiper-slide.js__media-item-container');

                            if(swiperSlideElement.length > 0)
                            {
                                for(element of swiperSlideElement)
                                {
                                    const dataFilter = $(element).attr('data-filter');

                                    if(dataFilter && dataFilter.toLowerCase().trim() == 'video')
                                    {
                                        if(isVideo <= 0)
                                        {
                                            isVideo = 1;
                                        }
                                    }
                                }
                            } 
                            
                            let product = {
                                SiteId: configs.siteId,
                                Title: title,
                                ProductUrl: productUrl,
                                ProductCode: productCode,
                                ProvinceId: provinceId,
                                DistrictId: districtId,
                                WardId: wardId,
                                StreetId: streetId,
                                ProjectId: projectId,
                                CustomerId: customerId,
                                Breadcrumb: breadcrumb,
                                Address: address,
                                Verified: verified,
                                IsVideo: isVideo,
                                ActionTypeId: actionTypeId,
                                LandTypeId: landTypeId,
                                PublishedAt: publishedAt,
                                ExpirationAt: expirationAt
                            }
    
                            resultVar = await dbHelper.productInsert(product);
                        }
                    }
                } 
                catch (error) 
                {
                    await scraperObject.scraperLog('parserProduct', error, pageUrl, productUrl);
                }

                return resultVar;
            }

            const pageClose = async (page, path) =>
            {
                try 
                {
                    await page.close();

                    console.log(`Đóng page => ${path || ''}\n`);
                } 
                catch (error) 
                {
                    console.error(`pageClose => ${path || ''} error => ${error.message}\n stack trace => ${error.stack}\n`);
                }
            }

            const waitForTimeout = async (page) =>
            {
                const randomNumber = utils.getRandomNumber();
                try 
                {
                    console.log(`Đợi xử lý sau => ${randomNumber/1000} giây...\n`);

                    await page.waitForTimeout(randomNumber);
                } 
                catch (error) 
                {
                    console.error(`waitForTimeout('${randomNumber}') error => ${error.message}\n stack trace => ${error.stack}\n`);
                }
            }

            //
            await waitForTimeout(page);
            
            let data = await scrapeCurrentPage(pageUrl);

		    console.log(data);

		    return data;
        } 
        catch (error) 
        {
            console.error(`error ${error}`);
        }
    },

    async scraperLog(message, error, pageUrl, productUrl)
    {
        try 
        {
            console.error(`${message} error => ${error.message}\n stack trace => ${error.stack}\n`);

            await dbHelper.scrapeLogInsert({
                siteId: configs.siteId,
                Path: pageUrl,
                DetailPath: (productUrl || null),
                Message: `${message} error => ${error}`
            });
        } 
        catch (error) 
        {
            console.error(`scraperLog error => ${error.message}\n stack trace => ${error.stack}\n`);
        }
    }
};

module.exports = scraperObject;