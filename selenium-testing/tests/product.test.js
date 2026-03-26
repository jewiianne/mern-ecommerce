const { urls, credentials, selectors, messages} = require('../data/testData.js');
const { Builder, By, until } = require('selenium-webdriver');
const assert = require('assert');

async function testProductVisibility(driver) {
    try {
        await driver.get('http://localhost:3000/login');
        
        await driver.findElement(By.name('email')).sendKeys(credentials.standardUser.email); 
        await driver.findElement(By.name('password')).sendKeys(credentials.standardUser.password);
                
        await driver.findElement(By.css("button[type='submit']")).click();
        
        await driver.wait(until.urlIs(urls.home), 10000);
        const currentUrl = await driver.getCurrentUrl();
                
        assert.strictEqual(currentUrl, urls.home, 'ERROR: Final URL does not match the Home Page');

        await driver.executeScript("window.scrollBy(0, 500)");
        
        await driver.wait(
            until.elementLocated(By.css("div[class*='MuiPaper-root'][class*='MuiStack-root']")), 
            10000
        );

        const allSlots = await driver.findElements(By.css("div[class*='MuiPaper-root'][class*='MuiStack-root']"));
        
        console.log(`PRODUCT DETECTED: ${allSlots.length} product slots are on the page.`);

        assert.ok(allSlots.length > 0, "FAILED: Product list is empty.");
        
        const isVisible = await allSlots[0].isDisplayed();
        assert.strictEqual(isVisible, true, "FAILED: Product slot is in DOM but not visible.");

        const content = await allSlots[0].getText();
        assert.ok(content.length > 0, "FAILED: Product slot exists but has no text content.");

        console.log("SUCCESS: Product slots are rendering correctly.");

    } catch (error) {
        console.error("TEST FAILED:", error.message);
    }
}

async function runProductTest() {
    let driver = await new Builder().forBrowser('chrome').build();
    try {
        await testProductVisibility(driver);
        
    } catch (error) {
        console.error('ONE TEST FAILED:', error);
    } finally {
        await driver.quit();
    }
}

runProductTest();