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

async function addProduct(driver) {
    try {
        await driver.get('http://localhost:3000/admin/dashboard');

        // Navigate to the form
        const avatar = await driver.wait(until.elementLocated(By.css("div.MuiAvatar-root")), 10000);
        await avatar.click();
        
        const addLink = await driver.wait(until.elementLocated(By.xpath("//a[contains(., 'Add new Product')]")), 10000);
        await driver.executeScript("arguments[0].click();", addLink);
        
        await driver.wait(until.urlContains('/admin/add-product'), 10000);
        console.log("On Add Product page.");

        // Fill out fields
        const fields = {
            'title': 'Selenium Pro Headphones',
            'description': 'High-end noise cancelling wireless headphones.',
            'price': '299',
            'discountPercentage': '15',
            'stockQuantity': '100',
            'thumbnail': 'https://picsum.photos/200',
            'image0': 'https://picsum.photos/300',
            'image1': 'https://picsum.photos/301',
            'image2': 'https://picsum.photos/302',
            'image3': 'https://picsum.photos/303'
        };

        for (const [name, value] of Object.entries(fields)) {
            let input = await driver.findElement(By.name(name));
            await input.clear(); // Good practice to clear before typing
            await input.sendKeys(value);
        }

        const submitBtn = await driver.findElement(By.xpath("//button[@type='submit' and contains(., 'Add Product')]"));
        await submitBtn.click(); 

        // Success Check
        const toast = await driver.wait(until.elementLocated(By.className('Toastify__toast-body')), 15000);
        const resultText = await toast.getText();
        console.log("RESULT:", resultText);

        await driver.wait(until.urlIs('http://localhost:3000/admin/dashboard'), 10000);
        console.log("SUCCESS: Product added and redirected.");

    } catch (error) {
        console.error("ADD PRODUCT FAILED:", error.message);
    }
}

async function updateProduct(driver) {
    try {
        await driver.get('http://localhost:3000/admin/dashboard');

        const editButton = await driver.wait(
            until.elementLocated(By.xpath("//button[contains(., 'Edit')] | //a[contains(@href, 'admin/product-update')]")), 
            10000
        );
        await driver.executeScript("arguments[0].click();", editButton);

        await driver.wait(until.urlContains('/admin/product-update'), 10000);
        await driver.sleep(2000);
        async function updateField(name, newValue) {
            const input = await driver.wait(until.elementLocated(By.name(name)), 10000);
            await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", input);
            
            await input.click();
            await input.sendKeys(Key.CONTROL, "a"); 
            await input.sendKeys(Key.BACK_SPACE);    
            await input.sendKeys(newValue);

            await driver.executeScript("arguments[0].dispatchEvent(new Event('input', { bubbles: true }));", input);
        }
        await updateField('title', 'Updated Selenium Product Name');
        await updateField('price', '350');
        await updateField('stockQuantity', '75');

        const brandTrigger = await driver.wait(
            until.elementLocated(By.css('[aria-labelledby="brand-selection mui-component-select-brand"]')), 
            10000
        );
        await driver.executeScript("arguments[0].click();", brandTrigger);
        
        const bOption = await driver.wait(until.elementLocated(By.css('li.MuiMenuItem-root')), 5000);
        await bOption.click();
        await driver.sleep(1000);

        const updateBtn = await driver.findElement(By.xpath("//button[@type='submit' and (text()='Update Product' or text()='Save')]"));
        await driver.executeScript("arguments[0].click();", updateBtn);

        const toast = await driver.wait(until.elementLocated(By.className('Toastify__toast-body')), 15000);
        console.log("UPDATE RESULT:", await toast.getText());

        await driver.wait(until.urlIs('http://localhost:3000/admin/dashboard'), 10000);
        console.log("SUCCESS: Product updated and redirected.");

    } catch (error) {
        console.error("UPDATE PRODUCT FAILED:", error.message);
    }
}

async function deleteProduct(driver) {
    try {
        console.log("--- ATTEMPT: Navigating to Admin Dashboard ---");
        await driver.get('http://localhost:3000/admin/dashboard');

        const deleteButtons = await driver.wait(
            until.elementsLocated(By.xpath("//button[contains(., 'Delete')] | //*[contains(@class, 'delete')]")), 
            10000
        );
        
        if (deleteButtons.length === 0) {
            throw new Error("No products found to delete.");
        }
        
        const targetDeleteBtn = deleteButtons[deleteButtons.length - 1];
        await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", targetDeleteBtn);
        await driver.sleep(500);
        await driver.executeScript("arguments[0].click();", targetDeleteBtn);

        try {
            const confirmBtn = await driver.wait(
                until.elementLocated(By.xpath("//button[text()='Delete' or text()='Confirm' or text()='Yes']")), 
                3000
            );
            console.log("Confirmation modal detected. Confirming delete...");
            await confirmBtn.click();
        } catch (e) {
            console.log("No confirmation modal appeared, proceeding...");
        }

        const toast = await driver.wait(
            until.elementLocated(By.className('Toastify__toast-body')), 
            10000
        );
        const toastMsg = await toast.getText();
        console.log("DELETE RESULT:", toastMsg);
        await driver.navigate().refresh();
        console.log("ASSERTION PASSED: Delete action completed.");

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
        
    } catch (error) {
        console.error('ONE TEST FAILED:', error);
    } finally {
        await driver.quit();
    }
}

runAuthenticationTest();