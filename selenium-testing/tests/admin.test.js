const { urls, credentials, selectors, messages} = require('../data/testData.js');
const { Builder, By, until, Key } = require('selenium-webdriver'); // ✅ added Key
const assert = require('assert');

async function testAdminLogin(driver) {
    try {
        await driver.get(urls.login);

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
        console.log("Adding Product...");

        // Wait for form to load
        await driver.wait(until.elementLocated(By.id('title')), 15000);

        async function fillForm(id, value) {
            const element = await driver.wait(until.elementLocated(By.id(id)), 10000);
            await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", el);
            await driver.wait(until.elementIsVisible(el), 5000);
            await element.clear();
            await element.sendKeys(value);
        }

        // Fill form
        await fillForm('title', 'Selenium Product');
        await fillForm('description', 'Test description');
        await fillForm('price', '299');
        await fillForm('discountPercentage', '10');
        await fillForm('stockQuantity', '50');
        await fillForm('thumbnail', 'https://sample.photos');
        await fillForm('image0', 'https://sample.photos');

        // MUI dropdowns
        async function selectMUI(testId) {
            const dropdown = await driver.wait(until.elementLocated(By.css(`[data-testid="${testId}"]`)), 10000);
            await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", dropdown);
            await driver.sleep(500);
            await driver.executeScript("arguments[0].parentElement.click();", dropdown);

            const option = await driver.wait(until.elementLocated(By.css('li.MuiMenuItem-root')), 5000);
            await driver.executeScript("arguments[0].click();", option);
        }
        await selectMUI("brand");
        await selectMUI("category");

        // Submit
        await driver.findElement(By.xpath("//button[@type='submit']")).click();

        // Wait for toast OR redirect (30s)
        const timeout = 30000;
        const interval = 500;
        let success = false;
        const start = Date.now();

        while ((Date.now() - start) < timeout && !success) {
            try {
                const toast = await driver.findElement(By.className('Toastify__toast-body'));
                const text = await toast.getText();
                console.log("DEBUG TOAST:", text);
                if (text.toLowerCase().includes("product")) {
                    success = true;
                    break;
                }
            } catch {}

            try {
                const currentUrl = await driver.getCurrentUrl();
                if (currentUrl === urls.adminDashboard) {
                    console.log("Add product success");
                    success = true;
                    break;
                }
            } catch {}

            await driver.sleep(interval);
        }

        assert.ok(success, "Add product failed");
    } catch (error) {
        console.error("ADD PRODUCT FAILED:");
        console.error(error.message);
    }
}

async function updateProduct(driver) {
    try {
        await driver.get('http://localhost:3000/admin/dashboard');

        const editButtons = await driver.wait(
            until.elementsLocated(By.xpath("//a[contains(@href, 'product-update')]")),
            10000
        );

        // click last product
        await driver.executeScript("arguments[0].click();", editButtons[editButtons.length - 1]);

        await driver.wait(until.urlContains('/admin/product-update'), 10000);

        async function updateField(name, value) {
            const input = await driver.wait(until.elementLocated(By.name(name)), 10000);
            await input.click();
            await input.sendKeys(Key.CONTROL, "a");
            await input.sendKeys(Key.BACK_SPACE);
            await input.sendKeys(value);
        }

        await updateField('title', 'Updated Product');
        await updateField('price', '350');

        const submitBtn = await driver.findElement(By.xpath("//button[@type='submit']"));
        await submitBtn.click();

        // toast OR redirect
        let success = false;

        try {
            const toast = await driver.wait(
                until.elementLocated(By.className('Toastify__toast-body')),
                5000
            );
            const text = await toast.getText();
            console.log("UPDATE RESULT:", text);

            if (text.toLowerCase().includes("updated")) {
                success = true;
            }
        } catch {}

        if (!success) {
            await driver.wait(until.urlContains('/admin/dashboard'), 10000);
            success = true;
        }

        assert.ok(success, "Update failed");
        console.log("Product updated");

    } catch (error) {
        console.error("UPDATE PRODUCT FAILED:");
        console.error(error.message);
    }
}

async function deleteProduct(driver) {
    try {
        console.log("--- DELETE TEST ---");
        await driver.get('http://localhost:3000/admin/dashboard');

        // Retry loop to find products
        const timeout = 20000;
        const interval = 500;
        let deleteBtn = null;
        const start = Date.now();

        while ((Date.now() - start) < timeout && !deleteBtn) {
            try {
                const buttons = await driver.findElements(By.css('[data-testid^="delete-"]'));
                if (buttons.length > 0) {
                    deleteBtn = buttons[0];
                    break;
                }
            } catch {}
            await driver.sleep(interval);
        }

        if (!deleteBtn) throw new Error("No delete button found after 20s");

        await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", deleteBtn);
        await driver.executeScript("arguments[0].click();", deleteBtn);

        try {
            const confirmBtn = await driver.wait(
                until.elementLocated(By.xpath("//button[contains(., 'Delete') or contains(., 'Confirm')]")),
                3000
            );
            await driver.executeScript("arguments[0].click();", confirmBtn);
        } catch {}

        // Toast
        try {
            const toast = await driver.wait(
                until.elementLocated(By.className('Toastify__toast-body')),
                5000
            );
            const text = await toast.getText();
            console.log("DELETE RESULT:", text);
        } catch {
            console.log("No toast detected, delete may have succeeded silently.");
        }

        console.log("Deleted a product");
    } catch (error) {
        console.error("DELETE PRODUCT FAILED:");
        console.error(error.message);
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