const configs = require('./configs');

function validateUrl(url)
{
    let resultVar = false;

    const regexUrl = new RegExp(/(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi);

    if (!url.match(regexUrl)) 
    {
        console.error(`Url => ${url} không hợp lệ\n`);
    }
    else
    {
        resultVar = true;
    }

    return resultVar;
}

function dateToISOString(day, month, year)
{
    try 
    {
        return [undefined, new Date(`${year.trim()}-${month.trim()}-${day.trim()}`).toISOString()];
    } 
    catch (error) 
    {
        return [error, undefined]
    }
}

function getRandomNumber()
{
    let resultVar = 0;
    try 
    {
        resultVar = Math.floor(Math.random() * (configs.randomMax - configs.randomMin + 1)) + configs.randomMin;
    } 
    catch (error) 
    {
        console.error(`getRandomNumber error => ${error}\n`);
    }
    
    return resultVar;
}

function getProductUrl(websiteDomain, path)
{
    let resultVar = '';
    try 
    {
        if(path)
        {
            resultVar = path.trim();
            
            if(resultVar.length > 0)
            {
                if(resultVar.indexOf('://') <= 0)
                {   
                    while(resultVar.startsWith('/'))
                    {
                        resultVar = resultVar.substring(1);
                    }
    
                    resultVar = `${websiteDomain}${resultVar}`;
                }
            }
        }
    } 
    catch (error) 
    {
        console.error(`getProductUrl error => ${error}\n`);
    }

    return resultVar;
}

function getCurrentPageUrl(url)
{
    let currentPage = 1;
    try 
    {
        currentPage = url.substring(url.lastIndexOf('/') + 1).replace('p','');
    } 
    catch (error) 
    {
        console.error(`getCurrentPageUrl('${url}') error => ${error}\n`);
    }

    return currentPage;
}

module.exports = {
    validateUrl: validateUrl,
    dateToISOString: dateToISOString,
    getRandomNumber: getRandomNumber,
    getProductUrl: getProductUrl,
    getCurrentPageUrl: getCurrentPageUrl
}