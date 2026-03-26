const { urls, credentials, selectors, messages, product} = require('../data/testData.js');
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

async function testDeleteProduct(driver, productTitle) {
    try {
        console.log(`--- ATTEMPT: Deleting Product: "${productTitle}" ---`);
        
        await driver.get(urls.adminDashboard);

        const productRowXpath = `//div[@data-testid="admin-product-row"][descendant::*[normalize-space()="${productTitle}"]]`;
        
        const row = await driver.wait(
            until.elementLocated(By.xpath(productRowXpath)), 
            10000,
            `Could not find admin row for: ${productTitle}`
        );

        const deleteBtn = await row.findElement(By.css("[data-testid='delete-product']"));
        
        await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", deleteBtn);
        await driver.sleep(500); 
        await deleteBtn.click();

        const unDeleteBtn = await driver.wait(
            until.elementLocated(By.xpath(`${productRowXpath}//button[contains(., 'Un-delete')]`)), 
            8000,
            "ASSERTION FAILED: 'Un-delete' button did not appear."
        );

        console.log(`ASSERTION PASSED: "${productTitle}" deleted successfully.`);

    } catch (error) {
        console.error("DELETE PRODUCT TEST FAILED:", error.message);
        throw error;
    }
}

async function testAddNewProduct(driver) {
    const data = product.testAddNewProduct;

    try {
        console.log("--- ATTEMPT: Adding new product ---");
        await driver.get(urls.adminDashboard);

        const menuButton = await driver.wait(until.elementLocated(By.css("button[aria-label='Open settings']")), 5000);
        await menuButton.click();

        const addNewLink = await driver.wait(until.elementLocated(By.xpath("//a[contains(@href, '/admin/add-product')]")), 5000);
        await addNewLink.click();

        await driver.wait(until.elementLocated(By.id("title")), 5000).sendKeys(data.title);
        await driver.findElement(By.id("description")).sendKeys(data.desc);
        await driver.findElement(By.id("price")).sendKeys(data.price.toString());
        await driver.findElement(By.id("discountPercentage")).sendKeys(data.discount.toString());
        await driver.findElement(By.id("stockQuantity")).sendKeys(data.stock.toString());
        await driver.findElement(By.id("thumbnail")).sendKeys(data.thumb);

        for (let i = 0; i < data.images.length && i < 4; i++) {
            await driver.findElement(By.id(`image${i}`)).sendKeys(data.images[i]);
        }

        const brandInput = await driver.wait(until.elementLocated(By.id("brand")), 5000);
        const brandTrigger = await brandInput.findElement(By.xpath("./..")); 

        await driver.actions().move({origin: brandTrigger}).click().perform();

        await driver.wait(until.elementLocated(By.xpath("//div[contains(@class, 'MuiPaper-root')]//ul[@role='listbox']")), 8000);

        const brandOption = await driver.wait(
            until.elementLocated(By.xpath(`//li[@role="option" and contains(., "${data.brand}")]`)), 
            5000
        );
        await brandOption.click();

        await driver.sleep(1000); 

        const categoryInput = await driver.findElement(By.id("category"));
        const categoryTrigger = await categoryInput.findElement(By.xpath("./.."));

        await driver.actions().move({origin: categoryTrigger}).click().perform();

        await driver.wait(until.elementLocated(By.xpath("//div[contains(@class, 'MuiPaper-root')]//ul[@role='listbox']")), 8000);

        const categoryOption = await driver.wait(
            until.elementLocated(By.xpath(`//li[@role="option" and contains(., "${data.category}")]`)), 
            5000
        );
        await categoryOption.click();

        const submitBtn = await driver.findElement(By.css("[data-testid='submit-product']"));
        await submitBtn.click();

        await driver.wait(until.urlContains('/admin/dashboard'), 10000);
        console.log(`ASSERTION PASSED: Product "${data.title}" added successfully.`);

    } catch (error) {
        console.error("ADD PRODUCT FAILED:", error.message);
        throw error;
    }
}

async function testUpdateProductName(driver, productTitle, expectedBrand) {
    try {
        console.log(`--- ATTEMPT: Updating Name for "${productTitle}" ---`);
        await driver.get(urls.adminDashboard);

        await filterProducts(driver, expectedBrand);

        const productRows = await driver.wait(
            until.elementsLocated(By.css('[data-testid="admin-product-row"]')), 
            10000
        );
        
        let targetRow = null;

        for (let currentRow of productRows) {
            const text = await currentRow.getText();
            if (text.includes(productTitle)) {
                targetRow = currentRow; 
                break;
            }
        }

        if (!targetRow) {
            throw new Error(`Could not find product with title "${productTitle}" on dashboard.`);
        }
        
        await driver.sleep(500); 
        const updateBtn = await targetRow.findElement(By.css("[data-testid='update-product']"));
        await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", updateBtn);
        await driver.sleep(500); 
        await updateBtn.click();

        await driver.wait(until.urlContains('/admin/product-update'), 10000);

        async function updateFieldByLabel(labelTitle, value) {
            const xpath = `//h6[normalize-space()="${labelTitle}"]/following-sibling::div//input | //h6[normalize-space()="${labelTitle}"]/parent::div//input`;
            const input = await driver.wait(until.elementLocated(By.xpath(xpath)), 10000);
            
            await input.click();
            await input.sendKeys(Key.CONTROL, "a");
            await input.sendKeys(Key.BACK_SPACE);
            await input.sendKeys(value);
        }

        console.log(`Setting new title to: ${product.testUpdateProduct}`);
        await updateFieldByLabel('Title', product.testUpdateProduct);

        const submitBtn = await driver.wait(until.elementLocated(By.css("[data-testid='submit-product']")), 5000);
        await submitBtn.click();

        const toastElement = await driver.wait(
            until.elementLocated(By.css(selectors.toastMessage)), 
            5000 
        );

        await driver.wait(until.elementIsVisible(toastElement), 5000);

        const alertText = await toastElement.getText();
        console.log("TOAST DETECTED:", alertText);

        assert.strictEqual(alertText, messages.updateProduct, `EXPECTED: "${messages.updateProduct}", GOT: "${alertText}"`);

        await driver.wait(until.urlContains('/admin/dashboard'), 10000);
        
        await driver.sleep(500); 
        await filterProducts(driver, expectedBrand);
        
        await driver.wait(
            until.elementLocated(By.xpath(`//*[normalize-space()="${product.testUpdateProduct}"]`)), 
            5000,
            `ASSERTION FAILED: New title "${product.testUpdateProduct}" not found on dashboard.`
        );
        console.log(`ASSERTION PASSED: Product name changed to "${product.testUpdateProduct}"`);

    } catch (error) {
        console.error("UPDATE PRODUCT FAILED:", error.message);
        throw error;
    }
}

async function filterProducts(driver, expectedBrand){
    const filterBtn = await driver.wait(
            until.elementLocated(By.css('[data-testid="filter-toggle-button"]')), 
            10000
        );
        await filterBtn.click();

        const brandAccordion = await driver.wait(until.elementLocated(By.id("brand-filters")), 10000);
        const isExpanded = await brandAccordion.getAttribute("aria-expanded");
        if (isExpanded !== "true") {
            await brandAccordion.click();
            await driver.sleep(500); 
        }

        const label = await driver.wait(
            until.elementLocated(By.xpath(`//label[.//span[text()="${expectedBrand}"]]`)), 
            10000
        );
        const checkbox = await label.findElement(By.css("input[type='checkbox']"));
        await driver.executeScript("arguments[0].click();", checkbox);

        console.log("Applying filter... waiting for refresh...");

        await filterBtn.click();
        await driver.sleep(3000);
}

async function runAdminTest() {
    let driver = await new Builder().forBrowser('chrome').build();
    try {
        await driver.manage().window().maximize();
        await testAdminLogin(driver);
        await testDeleteProduct(driver, product.testDeleteProduct);
        await testAddNewProduct(driver)
        await testUpdateProductName(driver, product.testAddNewProduct.title, product.testAddNewProduct.brand);
    } finally {
        await driver.quit();
    }
}

runAdminTest();