const { urls, credentials, selectors, messages} = require('../data/testData.js');
const { Builder, By, until } = require('selenium-webdriver');
const assert = require('assert');

async function testAdminLogin(driver) {
    try {
        await driver.get('http://localhost:3000/login');

        await driver.findElement(By.name('email')).sendKeys(credentials.admin.email); 
        await driver.findElement(By.name('password')).sendKeys(credentials.admin.password);
        
        const loginButton = await driver.findElement(By.css("button[type='submit']"));
        await loginButton.click();
        
        console.log("--- ATTEMPT: Test Admin Login ---");

        await driver.wait(until.urlIs(urls.adminDashboard), 10000);
        const currentUrl = await driver.getCurrentUrl();
        
        assert.strictEqual(currentUrl, urls.adminDashboard, 'ERROR: Final URL does not match the Admin Dashboard');
        
        const toastElement = await driver.wait(
            until.elementLocated(By.css(selectors.toastMessage)), 
            5000 
        );

        await driver.wait(until.elementIsVisible(toastElement), 5000);

        const alertText = await toastElement.getText();
        console.log("TOAST DETECTED:", alertText);
        
        assert.strictEqual(alertText, messages.loginSuccess, `EXPECTED: "${messages.loginSuccess}", GOT: "${alertText}"`);
        
        console.log("ASSERTION PASSED: User Admin reached Admin Dashboard.");

    } catch (error) {
        console.error("TEST FAILED:");
        console.error(error.message);
        
    }
}

async function testUserLogin(driver) {
    try {
        await driver.get('http://localhost:3000/login');

        await driver.findElement(By.name('email')).sendKeys(credentials.standardUser.email); 
        await driver.findElement(By.name('password')).sendKeys(credentials.standardUser.password);
        
        await driver.findElement(By.css("button[type='submit']")).click();
        console.log("--- ATTEMPT: Test User Login ---");

        await driver.wait(until.urlIs(urls.home), 10000);
        const currentUrl = await driver.getCurrentUrl();
        
        assert.strictEqual(currentUrl, urls.home, 'ERROR: Final URL does not match the Home Page');

        const toastElement = await driver.wait(
            until.elementLocated(By.css(selectors.toastMessage)), 
            5000 
        );

        await driver.wait(until.elementIsVisible(toastElement), 5000);

        const alertText = await toastElement.getText();
        console.log("TOAST DETECTED:", alertText);

        assert.strictEqual(alertText, messages.loginSuccess, `EXPECTED: "${messages.loginSuccess}", GOT: "${alertText}"`);
        console.log("ASSERTION PASSED: Standard User reached Home Page.");
    } catch (error) {
        console.error("TEST FAILED:", error.message);
    }
}

async function testLogout(driver){
    try {
        const menuButton = await driver.wait(
            until.elementLocated(By.css("button[class*='MuiButtonBase-root']")), 
            5000
        );
        await menuButton.click();

        const menuList = await driver.wait(
            until.elementLocated(By.css("ul[class*='MuiList-root'][role='menu']")), 
            5000 
        );
        await driver.wait(until.elementIsVisible(menuList), 5000);

        const logoutLink = await driver.wait(
            until.elementLocated(By.xpath("//a[contains(@href, '/logout')]")), 
            5000
        );
        await logoutLink.click();

        await driver.wait(until.urlIs(urls.login), 10000);
        const currentUrl = await driver.getCurrentUrl();
        
        assert.strictEqual(currentUrl, urls.login, 'ERROR: Final URL does not match the Login Page');

        const cookies = await driver.manage().getCookies();
        const tokenCookie = cookies.find(c => c.name === 'token'); // Change 'token' to your cookie name
        assert.strictEqual(tokenCookie, undefined, 'ERROR: Auth token still exists in cookies!');

        console.log("ASSERTION PASSED: Logout user successfully.");
    } catch (error) {
        console.error("TEST FAILED:", error.message);
    }
}

async function testInvalidLogin(driver) {
    try {
        await driver.get('http://localhost:3000/login');

        await driver.findElement(By.name('email')).sendKeys(credentials.invalidUser.email); 
        await driver.findElement(By.name('password')).sendKeys(credentials.invalidUser.password);
        
        await driver.findElement(By.css("button[type='submit']")).click();
        console.log("--- ATTEMPT: Test Invalid Login ---");

        const toastElement = await driver.wait(
            until.elementLocated(By.css(selectors.toastMessage)), 
            5000 
        );
        
        await driver.wait(until.elementIsVisible(toastElement), 5000);

        const alertText = await toastElement.getText();
        console.log("TOAST DETECTED:", alertText);

        assert.strictEqual(alertText, messages.invalidLogin, `EXPECTED: "${messages.invalidLogin}", GOT: "${alertText}"`);
        console.log("ASSERTION PASSED: Invalid login toast verified.");
    } catch (error) {
        console.error("TEST FAILED:", error.message);
    }
}

async function testEmptyLogin(driver) {
    try {
        await driver.get('http://localhost:3000/login');

        await driver.findElement(By.name('email')).sendKeys(""); 
        await driver.findElement(By.name('password')).sendKeys("");
        
        await driver.findElement(By.css("button[type='submit']")).click();
        console.log("--- ATTEMPT: Test Empty Login ---");

        const errorElements = await driver.findElements(By.css('.MuiFormHelperText-root'));
        
        const errorMessages = await Promise.all(
            errorElements.map(element => element.getText())
        );

        console.log("DETECTED ERROR MESSAGES:", errorMessages);

        const isEmailErrorPresent = errorMessages.includes(messages.emptyEmail);
        const isPasswordErrorPresent = errorMessages.includes(messages.emptyPassword);

        if (isEmailErrorPresent) {
            console.log("ASSERTION PASSED: Email validation logic triggered.");
        } else {
            throw new Error("ASSERTION FAILED: No email validation messages detected.");
        }
            
        if (isPasswordErrorPresent) {
            console.log("ASSERTION PASSED: Password validation logic triggered.");
        } else {
            throw new Error("ASSERTION FAILED: No password validation messages detected.");
        }
    } catch (error) {
        console.error("TEST FAILED:", error.message);
    }
}

async function runAuthenticationTest() {
    let driver = await new Builder().forBrowser('chrome').build();
    try {
        await testAdminLogin(driver);
        await testLogout(driver);
        await driver.manage().deleteAllCookies();
        await testUserLogin(driver);
        await testLogout(driver);
        await driver.manage().deleteAllCookies();
        await testInvalidLogin(driver);
        await driver.manage().deleteAllCookies();
        await testEmptyLogin(driver);
        
    } catch (error) {
        console.error('ONE TEST FAILED:', error);
    } finally {
        await driver.quit();
    }
}

runAuthenticationTest();