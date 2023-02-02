const { poolPromise } = require('./pool');
const sql = require('mssql');
const configs = require('./configs');

const actionTypeInsert = async (actionType) =>
{
    let resultVar = 0;
    try 
    {
        console.log(`Xử lý dữ liệu Hành động => ${actionType.Name}\n`);

        const pool = await poolPromise;

        await pool.request()  
            .input("ActBy", sql.NVarChar(150), configs.actionBy)  
            .input("SiteId", sql.Int, actionType.SiteId)  
            .input("Name", sql.NVarChar(50), actionType.Name)  
            .input("Description", sql.NVarChar(50), (actionType.Description || null))
            .output('ActionTypeId', sql.Int)
            .execute('ActionTypes_Insert').then(function(recordsets) {
                const output = (recordsets.output || {});
                resultVar = output['ActionTypeId'];
            });
    } 
    catch (error) 
    {
        console.error(`actionTypeInsert error => ${error}\n`);
    }

    return resultVar;
}

const productTypeInsert = async (productType) =>
{
    let resultVar = 0;
    try 
    {
        console.log(`Xử lý lưu Loại tin đăng ${productType.Name}\n`);

        const pool = await poolPromise;
        
        await pool.request()  
            .input("ActBy", sql.NVarChar(150), configs.actionBy)  
            .input("SiteId", sql.Int, productType.SiteId)  
            .input("Name", sql.NVarChar(50), productType.Name)  
            .input("Description", sql.NVarChar(50), (productType.Description || null))
            .output('ProductTypeId', sql.Int)
            .execute('ProductTypes_Insert').then(function(recordsets) {
                const output = (recordsets.output || {});
                resultVar = output['ProductTypeId'];
            });
    } 
    catch (error) 
    {
        console.error(`productTypeInsert error => ${error}\n`);
    }

    return resultVar;
}

const landTypeInsert = async (landType) =>
{
    let resultVar = 0;
    try 
    {
        console.log(`Xử lý dữ liệu Loại nhà đất - ${landType.Name}\n`);
        const pool = await poolPromise;
        
        await pool.request()  
            .input("ActBy", sql.NVarChar(150), configs.actionBy)  
            .input("SiteId", sql.Int, landType.SiteId)  
            .input("Name", sql.NVarChar(150), landType.Name)  
            .input("Description", sql.NVarChar(150), (landType.Description || null))
            .output('LandTypeId', sql.Int)
            .execute('LandTypes_Insert').then(function(recordsets) {
                const output = (recordsets.output || {});
                resultVar = output['LandTypeId'];
            });
    } 
    catch (error) 
    {
        console.error(`landTypeInsert error => ${error}\n`);
    }

    return resultVar;
}

const provinceInsert = async (province) =>
{
    let resultVar = 0;
    try 
    {
        console.log(`Xử lý dữ liệu Tỉnh / Thành phố - ${province.Name}\n`);
        const pool = await poolPromise;
        
        await pool.request()  
            .input("ActBy", sql.NVarChar(150), configs.actionBy)  
            .input("SiteId", sql.Int, province.SiteId)  
            .input("Name", sql.NVarChar(150), province.Name)  
            .input("Description", sql.NVarChar(150), (province.Description || null))
            .output('ProvinceId', sql.Int)
            .execute('Provinces_Insert').then(function(recordsets) {
                const output = (recordsets.output || {});
                resultVar = output['ProvinceId'];
            });
    } 
    catch (error) 
    {
        console.error(`provinceInsert error => ${error}\n`);
    }

    return resultVar;
}

const districtInsert = async (district) =>
{
    let resultVar = 0;
    try 
    {
        console.log(`Xử lý dữ liệu Quận / Huyện - ${district.Name}\n`);
        const pool = await poolPromise;
        
        await pool.request()  
            .input("ActBy", sql.NVarChar(150), configs.actionBy)  
            .input("SiteId", sql.Int, district.SiteId)  
            .input("ProvinceId", sql.Int, district.ProvinceId)  
            .input("Name", sql.NVarChar(150), district.Name)  
            .input("Description", sql.NVarChar(150), (district.Description || null))
            .output('DistrictId', sql.Int)
            .execute('Districts_Insert').then(function(recordsets) {
                const output = (recordsets.output || {});
                resultVar = output['DistrictId'];
            });
    } 
    catch (error) 
    {
        console.error(`districtInsert error => ${error}\n`);
    }

    return resultVar;
}

const wardsInsert = async (wards) =>
{
    let resultVar = 0;
    try 
    {
        console.log(`Xử lý dữ liệu Phường / Xã - ${wards.Name}\n`);
        const pool = await poolPromise;
        
        await pool.request()  
            .input("ActBy", sql.NVarChar(150), configs.actionBy)  
            .input("SiteId", sql.Int, wards.SiteId)  
            .input("ProvinceId", sql.Int, wards.ProvinceId)
            .input("DistrictId", sql.Int, wards.DistrictId)
            .input("Name", sql.NVarChar(150), wards.Name)  
            .input("Description", sql.NVarChar(150), (wards.Description || null))
            .output('WardId', sql.Int)
            .execute('Wards_Insert').then(function(recordsets) {
                const output = (recordsets.output || {});
                resultVar = output['WardId'];
            });
    } 
    catch (error) 
    {
        console.error(`wardsInsert error => ${error}\n`);
    }

    return resultVar;
}

const streetInsert = async (street) =>
{
    let resultVar = 0;
    try 
    {
        console.log(`Xử lý dữ liệu Đường / Phố - ${street.Name}\n`);
        const pool = await poolPromise;
        
        await pool.request()  
            .input("ActBy", sql.NVarChar(150), configs.actionBy)  
            .input("SiteId", sql.Int, street.SiteId)  
            .input("ProvinceId", sql.Int, street.ProvinceId)
            .input("DistrictId", sql.Int, street.DistrictId)
            .input("WardId", sql.Int, street.WardId)
            .input("Name", sql.NVarChar(150), street.Name)  
            .input("Description", sql.NVarChar(150), (street.Description || null))
            .output('StreetId', sql.Int)
            .execute('Streets_Insert').then(function(recordsets) {
                const output = (recordsets.output || {});
                resultVar = output['StreetId'];
            });
    } 
    catch (error) 
    {
        console.error(`streetInsert error => ${error}\n`);
    }

    return resultVar;
}

const investorInsert = async (investor) =>
{
    let resultVar = 0;
    try 
    {
        console.log(`Xử lý dữ liệu Chủ đầu tư - ${investor.Name}\n`);
        const pool = await poolPromise;
        
        await pool.request()  
            .input("ActBy", sql.NVarChar(150), configs.actionBy)  
            .input("SiteId", sql.Int, investor.SiteId)  
            .input("Name", sql.NVarChar(150), investor.Name)  
            .input("Description", sql.NVarChar(150), (investor.Description || null))
            .output('InvestorId', sql.Int)
            .execute('Investors_Insert').then(function(recordsets) {
                const output = (recordsets.output || {});
                resultVar = output['InvestorId'];
            });
    } 
    catch (error) 
    {
        console.error(`investorInsert error => ${error}\n`);
    }

    return resultVar;
}

const projectInsert = async (project) =>
{
    let resultVar = 0;
    try 
    {
        console.log(`Xử lý dữ liệu Dự án - ${project.Name}\n`);
        const pool = await poolPromise;
        
        await pool.request()  
            .input("ActBy", sql.NVarChar(150), configs.actionBy)  
            .input("SiteId", sql.Int, project.SiteId)  
            .input("InvestorId", sql.Int, project.InvestorId)
            .input("ProvinceId", sql.Int, project.ProvinceId)
            .input("DistrictId", sql.Int, (project.DistrictId || null))
            //.input("WardId", sql.Int, (obj.WardId || null))
            //.input("StreetId", sql.Int, (obj.StreetId || null))
            .input("Name", sql.NVarChar(250), project.Name)  
            .input("Description", sql.NVarChar(250), (project.Description || null))
            // .input("PriceFrom", sql.Float, (obj.PriceFrom || null))
            // .input("PriceTo", sql.Float, (obj.PriceTo || null))
            // .input("ComputedPriceFrom", sql.Float, (obj.ComputedPriceFrom || null))
            // .input("ComputedPriceTo", sql.Float, (obj.ComputedPriceTo || null))
            // .input("PriceDisplay", sql.NVarChar(50), obj.PriceDisplay)  
            // .input("AreaFrom", sql.Float, (obj.AreaFrom || null))
            // .input("AreaTo", sql.Float, (obj.AreaTo || null))
            // .input("ComputedAreaFrom", sql.Float, (obj.ComputedAreaFrom || null))
            // .input("ComputedAreaTo", sql.Float, (obj.ComputedAreaTo || null))
            // .input("AreaDisplay", sql.NVarChar(50), (obj.AreaDisplay || null)) 
            // .input("Apartments", sql.Int, (obj.Apartments || null))
            // .input("Buildings", sql.Int, (obj.Buildings || null))
            // .input("Status", sql.NVarChar(250), (obj.Status || null))  
            .output('ProjectId', sql.Int)
            .execute('Projects_Insert').then(function(recordsets) {
                const output = (recordsets.output || {});
                resultVar = output['ProjectId'];
            });
    } 
    catch (error) 
    {
        console.error(`projectInsert error => ${error}\n`);
    }

    return resultVar;
}

const customerInsert = async (customer) =>
{
    let resultVar = 0;
    try 
    {
        console.log(`Xử lý dữ liệu Khách hàng - ${customer.FullName} / ${customer.PhoneNumber}\n`);
        const pool = await poolPromise;
        
        await pool.request()  
            .input("ActBy", sql.NVarChar(150), configs.actionBy)  
            .input("SiteId", sql.Int, customer.SiteId)  
            .input("FullName", sql.NVarChar(250), (customer.FullName || null))
            .input("PhoneNumber", sql.NVarChar(50), (customer.PhoneNumber || null))
            .input("Email", sql.NVarChar(150), (customer.Email || null))
            .input("Avatar", sql.NVarChar(2000), (customer.Avatar || null))
            .output('CustomerId', sql.Int)
            .execute('Customers_Insert').then(function(recordsets) {
                const output = (recordsets.output || {});
                resultVar = output['CustomerId'];
            });
    } 
    catch (error) 
    {
        console.error(`customerInsert error => ${error}\n`);
    }

    return resultVar;
}

const productInsert = async (product) =>
{
    let resultVar = 0;
    try {
        console.log(`Xử lý dữ liệu bài đăng - ${product.Title}\n`);
        const pool = await poolPromise;
        
        await pool.request()  
            .input("ActBy", sql.NVarChar(150), configs.actionBy)  
            .input("SiteId", sql.Int, product.SiteId)  
            .input("ProvinceId", sql.Int, product.ProvinceId)
            .input("DistrictId", sql.Int, product.DistrictId)
            .input("WardId", sql.Int, product.WardId)
            .input("StreetId", sql.Int, product.StreetId)
            .input("Title", sql.NVarChar(500), product.Title)  
            .input("ProductUrl", sql.NVarChar(255), product.ProductUrl)
            .input("ProductCode", sql.Int, (product.ProductCode || null))
            //.input("ProductContent", sql.NVarChar(sql.MAX), (product.ProductContent || null))
            .input("ProjectId", sql.Int, (product.ProjectId || 0))
            .input("CustomerId", sql.Int, product.CustomerId)
            .input("Breadcrumb", sql.NVarChar(250), (product.Breadcrumb || null)) 
            .input("Address", sql.NVarChar(500), (product.Address || null)) 
            // .input("Verified", sql.TinyInt, (product.Verified || null))
            // .input("IsVideo", sql.TinyInt, (product.IsVideo || null))
            // .input("Area", sql.Float, (product.Area || null))
            // .input("AreaDisplay", sql.NVarChar(50), (product.AreaDisplay || null)) 
            // .input("Price", sql.Float, (product.Price || null))
            // .input("PriceDisplay", sql.NVarChar(50), (product.PriceDisplay || null))  
            // .input("ComputedPrice", sql.Float, (product.ComputedPrice || null))
            // .input("Facade", sql.Float, (product.Facade || null))
            // .input("FacadeDisplay", sql.NVarChar(50), (product.FacadeDisplay || null)) 
            // .input("WayIn", sql.Float, (product.WayIn || null))
            // .input("WayInDisplay", sql.NVarChar(50), (product.WayInDisplay || null)) 
            // .input("Floors", sql.TinyInt, (product.Floors || null))
            // .input("HouseDirection", sql.NVarChar(50), (product.HouseDirection || null))  
            // .input("BalconyDirection", sql.NVarChar(50), (product.BalconyDirection || null))  
            // .input("Rooms", sql.TinyInt, (product.Rooms || null))
            // .input("Toilets", sql.SmallInt, (product.Toilets || null))
            // .input("Juridical", sql.NVarChar(250), (product.Juridical || null))
            // .input("Interiors", sql.NVarChar(250), (product.Interiors || null))
            // .input("ProductTypeId", sql.Int, (product.ProductTypeId || null))
            // .input("ActionTypeId", sql.Int, (product.ActionTypeId || null))
            // .input("LandTypeId", sql.Int, (product.LandTypeId || null))
            // .input("Latitude", sql.Float, (product.Latitude || null))
            // .input("Longitude", sql.Float, (product.Longitude || null))
            .input("PublishedAt", sql.DateTime, (product.PublishedAt || null))
            .input("ExpirationAt", sql.DateTime, (product.ExpirationAt || null))
            .output('ProductId', sql.Int)
            .execute('Products_Insert').then(function(recordsets) {
                const output = (recordsets.output || {});
                resultVar = output['ProductId'];
            });
    } 
    catch (error) 
    {
        console.error(`productInsert error => ${error}\n`);
    }

    return resultVar;
}

const scrapeLogInsert = async (scrapeLog) =>
{
    let resultVar = 0;
    try 
    {
        console.log(`Xử lý log dữ liệu => ${scrapeLog.Path}\n`);
        const pool = await poolPromise;
        
        await pool.request()  
            .input("ActBy", sql.NVarChar(150), configs.actionBy)  
            .input("SiteId", sql.Int, scrapeLog.SiteId)  
            .input("Path", sql.NVarChar(500), scrapeLog.Path)
            .input("DetailPath", sql.NVarChar(500), (scrapeLog.DetailPath || null))
            .input("Message", sql.NVarChar(sql.MAX), (scrapeLog.Message || null))
            .output('ScrapeLogId', sql.Int)
            .execute('ScrapeLogs_Insert').then(function(recordsets) {
                const output = (recordsets.output || {});
                resultVar = output['ScrapeLogId'];
            });
    } 
    catch (error) 
    {
        console.error(`scrapeLogInsert error => ${error}\n`);
    }

    return resultVar;
}

module.exports = {
    actionTypeInsert: actionTypeInsert,
    productTypeInsert: productTypeInsert,
    landTypeInsert: landTypeInsert,
    investorInsert: investorInsert,
    projectInsert: projectInsert,
    provinceInsert: provinceInsert,
    districtInsert: districtInsert,
    wardsInsert: wardsInsert,
    streetInsert: streetInsert,
    customerInsert: customerInsert,
    productInsert: productInsert,
    scrapeLogInsert: scrapeLogInsert
}