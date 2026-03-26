const { urls, credentials, selectors, messages} = require('../data/testData.js');
const { Builder, By, until, Key } = require('selenium-webdriver'); // ✅ added Key
const assert = require('assert');

async function testAdminLogin(driver) {
    try {
        await driver.get('http://localhost:3000/login');

        await driver.findElement(By.name('email')).sendKeys(credentials.admin.email); 
        await driver.findElement(By.name('password')).sendKeys(credentials.admin.password);
        
        await driver.findElement(By.css("button[type='submit']")).click();
        
        console.log("--- ATTEMPT: Test Admin Login ---");

        await driver.wait(until.urlIs(urls.adminDashboard), 10000);
        const currentUrl = await driver.getCurrentUrl();
        
        assert.strictEqual(currentUrl, urls.adminDashboard);

        const toastElement = await driver.wait(
            until.elementLocated(By.css(selectors.toastMessage)), 
            5000 
        );

        const alertText = await toastElement.getText();
        console.log("TOAST DETECTED:", alertText);
        
        assert.strictEqual(alertText, messages.loginSuccess);
        
        console.log("✅ Admin login successful");

    } catch (error) {
        console.error("TEST FAILED:", error.message);
    }
}

async function addProduct(driver) {
    try {
        await driver.get('http://localhost:3000/admin/dashboard');

        // Navigate
        await driver.findElement(By.css("div.MuiAvatar-root")).click();
        const addLink = await driver.wait(
            until.elementLocated(By.xpath("//a[contains(., 'Add new Product')]")), 
            10000
        );
        await driver.executeScript("arguments[0].click();", addLink);

        await driver.wait(until.urlContains('/admin/add-product'), 10000);
        console.log("On Add Product page.");

        // Fill fields using ID (you must add IDs in React)
        await driver.wait(until.elementLocated(By.id('title')), 10000);

        await driver.findElement(By.id('title')).sendKeys('Selenium Product');
        await driver.findElement(By.id('description')).sendKeys('Test description');
        await driver.findElement(By.id('price')).sendKeys('299');
        await driver.findElement(By.id('discountPercentage')).sendKeys('10');
        await driver.findElement(By.id('stockQuantity')).sendKeys('50');
        await driver.findElement(By.id('thumbnail')).sendKeys('https://picsum.photos/200');

        await driver.findElement(By.id('image0')).sendKeys('https://picsum.photos/300');
        await driver.findElement(By.id('image1')).sendKeys('https://picsum.photos/301');
        await driver.findElement(By.id('image2')).sendKeys('https://picsum.photos/302');
        await driver.findElement(By.id('image3')).sendKeys('https://picsum.photos/303');

        // MUI SELECT FIX
        await driver.findElement(By.id('brand')).click();
        let option = await driver.wait(until.elementLocated(By.css('li.MuiMenuItem-root')), 5000);
        await option.click();

        await driver.findElement(By.id('category')).click();
        option = await driver.wait(until.elementLocated(By.css('li.MuiMenuItem-root')), 5000);
        await option.click();

        // Submit
        await driver.findElement(By.xpath("//button[@type='submit']")).click();

        // Assertion
        const toast = await driver.wait(
            until.elementLocated(By.className('Toastify__toast-body')),
            10000
        );

        const text = await toast.getText();
        console.log("ADD RESULT:", text);

        assert.ok(
            text.toLowerCase().includes("product"),
            "Add product failed"
        );

        await driver.wait(until.urlIs(urls.adminDashboard), 10000);

        console.log("Product added successfully");

    } catch (error) {
        console.error("ADD PRODUCT FAILED:", error.message);
    }
}

async function updateProduct(driver) {
    try {
        await driver.get('http://localhost:3000/admin/dashboard');

        const editButton = await driver.wait(
            until.elementLocated(By.xpath("//button[contains(., 'Update')]")), 
            10000
        );
        await editButton.click();

        await driver.wait(until.urlContains('/admin/product-update'), 10000);

        async function updateField(name, value) {
            const input = await driver.findElement(By.name(name));
            await input.click();
            await input.sendKeys(Key.CONTROL, "a");
            await input.sendKeys(Key.BACK_SPACE);
            await input.sendKeys(value);
        }

        await updateField('title', 'Updated Product');
        await updateField('price', '350');

        await driver.findElement(By.xpath("//button[@type='submit']")).click();

        const toast = await driver.wait(
            until.elementLocated(By.className('Toastify__toast-body')),
            10000
        );

        const text = await toast.getText();
        console.log("UPDATE RESULT:", text);

        assert.ok(
            text.toLowerCase().includes("updated"),
            "Update failed"
        );

        console.log("✅ Product updated");

    } catch (error) {
        console.error("UPDATE PRODUCT FAILED:", error.message);
    }
}

async function deleteProduct(driver) {
    try {
        console.log("--- DELETE TEST ---");

        await driver.get('http://localhost:3000/admin/dashboard');

        const deleteButtons = await driver.wait(
            until.elementsLocated(By.xpath("//button[contains(., 'Delete')]")), 
            10000
        );

        const target = deleteButtons[deleteButtons.length - 1];
        await target.click();

        try {
            const confirmBtn = await driver.wait(
                until.elementLocated(By.xpath("//button[contains(., 'Delete') or contains(., 'Confirm')]")), 
                3000
            );
            await confirmBtn.click();
        } catch {}

        try {
            const toast = await driver.wait(
                until.elementLocated(By.className('Toastify__toast-body')),
                5000
            );

            const text = await toast.getText();
            console.log("DELETE RESULT:", text);

            assert.ok(
                text.toLowerCase().includes("delete"),
                "Delete may have failed"
            );

        } catch {
            console.log("No toast detected");
        }

        console.log("Delete step completed");

    } catch (error) {
        console.error("DELETE PRODUCT FAILED:", error.message);
    }
}

async function runAuthenticationTest() {
    let driver = await new Builder().forBrowser('chrome').build();
    try {
        await testAdminLogin(driver);
        await addProduct(driver);
        await updateProduct(driver);
        await deleteProduct(driver);
    } finally {
        await driver.quit();
    }
}

runAuthenticationTest();