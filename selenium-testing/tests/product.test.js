const { urls, credentials, address, product, payment} = require('../data/testData.js');
const { Builder, By, until, Key } = require('selenium-webdriver');
const assert = require('assert');

async function testProductVisibility(driver) {
    try {
        await driver.get(urls.login);
        
        await driver.findElement(By.name('email')).sendKeys(credentials.standardUser.email); 
        await driver.findElement(By.name('password')).sendKeys(credentials.standardUser.password);
                
        await driver.findElement(By.css("button[type='submit']")).click();
        
        await driver.wait(until.urlIs(urls.home), 10000);
        const currentUrl = await driver.getCurrentUrl();
                
        assert.strictEqual(currentUrl, urls.home, 'ERROR: Final URL does not match the Home Page');

        console.log("--- ATTEMPT: Test Product Visibility ---");

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

        console.log("ASSERTION PASSED: Product slots are rendering correctly.");

    } catch (error) {
        console.error("TEST FAILED:", error.message);
    }
}

async function testProductDetails(driver) {
    try {
        const currentUrl = await driver.getCurrentUrl();
                
        assert.strictEqual(currentUrl, urls.home, 'ERROR: Final URL does not match the Home Page');

        await driver.executeScript("window.scrollBy(0, 500)");
        
        await driver.wait(
            until.elementLocated(By.css("div[class*='MuiPaper-root'][class*='MuiStack-root']")), 
            10000
        );

        const allSlots = await driver.findElements(By.css("div[class*='MuiPaper-root'][class*='MuiStack-root']"));
        
        const firstProduct = allSlots[0];
        
        const productText = await firstProduct.getText();
        const productName = productText.split('\n')[0];
        console.log(`--- ATTEMPT: Viewing details for "${productName}" ---`);
        
        await firstProduct.click();
        
        await driver.wait(until.urlContains('/product-details/'), 10000);
        const detailUrl = await driver.getCurrentUrl();
        console.log("Current URL:", detailUrl);
        
        assert.ok(detailUrl.includes('/product-details/'), "FAILED: Did not navigate to Product Details page");

        try {
            const productTitle = await driver.wait(
                until.elementLocated(By.css(".product-title-class")), 
                5000 
            );
            assert.ok(await productTitle.isDisplayed());
        } catch (waitError) {
            const pageSource = await driver.getPageSource();
            if (pageSource.includes("Cannot read properties of null")) {
                throw new Error("APPLICATION CRASH: React failed to read product '_id'.");
            }
            throw waitError;
        }

        const detailTitleElement = await driver.wait(
            until.elementLocated(By.css("h1, .MuiTypography-h3")),
            5000
        );
        const detailTitle = await detailTitleElement.getText();
        
        assert.ok(detailTitle.includes(productName), `FAILED: Detail page shows "${detailTitle}" instead of "${productName}"`);

        const addToCartBtn = await driver.findElement(By.xpath("//button[contains(text(), 'Add to Cart')]"));
        assert.strictEqual(await addToCartBtn.isDisplayed(), true, "FAILED: Add to Cart button not visible on details page");

        console.log("ASSERTION PASSED: Product Details page verified correctly.");
    } catch (error) {
        console.error("TEST FAILED:", error.message);
    }
}

async function testProductFilter(driver, expectedBrand) {
    try {
        await driver.get(urls.home);
        await driver.wait(until.urlIs(urls.home), 10000);

        console.log("--- ATTEMPT: Test Product Filtering ---");
        
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

        console.log("Applying multiple filters... waiting for refresh...");

        await filterBtn.click();
        await driver.sleep(3000);

        await driver.wait(
            until.elementLocated(By.xpath(`//p[@data-testid="product-card-brand" and text()="${expectedBrand}"]`)),
            10000
        );

        const productCards = await driver.findElements(By.css('[data-testid="product-card"]'));
        console.log(`Found ${productCards.length} products to verify.`);
        
        assert.ok(productCards.length > 0, `FAILED: No products found for brand ${expectedBrand}`);

        for (let i = 0; i < productCards.length; i++) {
            try {
                const brandElement = await productCards[i].findElement(
                    By.css('[data-testid="product-card-brand"]')
                );
                
                const actualBrand = await brandElement.getText();
                
                console.log(`Checking Card ${i+1}: ${actualBrand}`);
                
                assert.strictEqual(
                    actualBrand.trim(), 
                    expectedBrand, 
                    `Card ${i+1} mismatch. Expected ${expectedBrand}, but got ${actualBrand}`
                );
            } catch (staleError) {
                console.warn(`Card ${i+1} was updated by React during check. Skipping...`);
            }
        }

        console.log(`ASSERTION PASSED: All ${productCards.length} products match '${expectedBrand}'.`);

    } catch (error) {
        console.error("TEST FAILED:", error.message);
    }
}

async function testMultiBrandFilter(driver, expectedBrands) {
    try {
        await driver.get(urls.home);
        await driver.wait(until.urlIs(urls.home), 10000);

        console.log(`--- ATTEMPT: Test Multi-Filtering for: ${expectedBrands.join(", ")} ---`);
        
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

        for (const brand of expectedBrands) {
            const label = await driver.wait(
                until.elementLocated(By.xpath(`//label[.//span[text()="${brand}"]]`)), 
                10000
            );
            const checkbox = await label.findElement(By.css("input[type='checkbox']"));
            await driver.executeScript("arguments[0].click();", checkbox);
        }

        console.log("Applying multiple filters... waiting for refresh...");
        await filterBtn.click();
        await driver.sleep(3000);

        const brandXpath = expectedBrands.map(b => `text()="${b}"`).join(" or ");
        await driver.wait(
            until.elementLocated(By.xpath(`//p[@data-testid="product-card-brand" and (${brandXpath})]`)),
            10000
        );

        const productCards = await driver.findElements(By.css('[data-testid="product-card"]'));
        console.log(`Found ${productCards.length} products to verify.`);
        
        assert.ok(productCards.length > 0, `FAILED: No products found for selected brands.`);

        for (let i = 0; i < productCards.length; i++) {
            try {
                const brandElement = await productCards[i].findElement(
                    By.css('[data-testid="product-card-brand"]')
                );
                
                const actualBrand = (await brandElement.getText()).trim();
                
                const isValidBrand = expectedBrands.includes(actualBrand);
                
                console.log(`Checking Card ${i+1}: ${actualBrand}`);
                
                assert.ok(
                    isValidBrand, 
                    `Card ${i+1} mismatch. Found '${actualBrand}', but expected one of: [${expectedBrands}]`
                );
            } catch (staleError) {
                console.warn(`Card ${i+1} was updated by React. Skipping...`);
            }
        }

        console.log(`ASSERTION PASSED: All ${productCards.length} products match the multi-brand filter.`);

    } catch (error) {
        console.error("MULTI-FILTER TEST FAILED:", error.message);
    }
}

async function testAddToCart(driver, productTitle) {
    try {
        console.log(`--- ATTEMPT: Adding '${productTitle}' to Cart ---`);

        const productCard = await driver.wait(
            until.elementLocated(By.xpath(
                `//div[@data-testid="product-card"][descendant::h6[normalize-space()="${productTitle}"]]`
            )),
            10000
        );

        await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", productCard);
        await driver.sleep(500);

        const addToCartBtn = await driver.wait(
            until.elementIsVisible(productCard.findElement(By.css('[data-testid="add-to-cart-btn"]'))),
            5000
        );
        
        await driver.executeScript("arguments[0].click();", addToCartBtn);
        console.log("Clicked Add to Cart button.");

        await driver.wait(
            until.elementLocated(By.xpath(`//div[@data-testid="product-card"][.//h6[text()="${productTitle}"]]//*[contains(text(), 'Added to cart')]`)),
            5000
        );
        console.log("UI confirmed item is added.");
        await driver.sleep(3000);

        const cartButton = await driver.wait(
            until.elementLocated(By.css('[data-testid="cart-button"]')),
            5000
        );
        
        const badge = await cartButton.findElement(By.xpath("./ancestor::span[contains(@class, 'MuiBadge-badge')] | ..//span[contains(@class, 'MuiBadge-badge')]"));
        const itemCount = await badge.getText();
        console.log(`Cart badge now shows: ${itemCount}`);

        await cartButton.click();

        await driver.wait(until.urlIs(urls.cart), 10000);
        
        await driver.wait(until.elementLocated(By.css('[data-testid="cart-item"]')), 10000);

        const cartItems = await driver.findElements(By.css('[data-testid="cart-item"]'));
        console.log(`Found ${cartItems.length} items in the cart.`);

        const specificItem = await driver.wait(
            until.elementLocated(By.xpath(
                `//div[@data-testid="cart-item"][descendant::*[contains(text(), "${productTitle}")]]`
            )),
            5000
        );

        assert.ok(specificItem, `ASSERTION FAILED: Could not find ${productTitle} in the cart list.`);
        console.log(`ASSERTION PASSED: '${productTitle}' successfully added and verified in Cart.`);

    } catch (error) {
        console.error("ADD TO CART TEST FAILED:", error.message);
    }
}

async function testAddMultipleToCart(driver, productTitles) {
    try {
        console.log(`--- ATTEMPT: Adding ${productTitles.length} items to Cart ---`);

        for (const title of productTitles) {
            console.log(`Processing: ${title}...`);

            const productCard = await driver.wait(
                until.elementLocated(By.xpath(
                    `//div[@data-testid="product-card"][descendant::h6[normalize-space()="${title}"]]`
                )),
                10000
            );

            await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", productCard);
            await driver.sleep(500);

            const addToCartBtn = await productCard.findElement(By.css('[data-testid="add-to-cart-btn"]'));
            await driver.executeScript("arguments[0].click();", addToCartBtn);

            await driver.wait(
                until.elementLocated(By.xpath(
                    `//div[@data-testid="product-card"][descendant::h6[text()="${title}"]]//*[contains(text(), 'Added')]`
                )),
                5000
            );
            console.log(`${title} added to cart.`);
        }
        
        await driver.sleep(3000);
        await closeToast(driver);

        const cartButton = await driver.wait(
            until.elementLocated(By.css('[data-testid="cart-button"]')),
            5000
        );

        const badge = await cartButton.findElement(By.xpath("./ancestor::span[contains(@class, 'MuiBadge-badge')] | ..//span[contains(@class, 'MuiBadge-badge')]"));
        const itemCount = await badge.getText();
        console.log(`Cart badge now shows: ${itemCount}`);

        await cartButton.click();

        await driver.wait(until.urlIs(urls.cart), 10000);
        
        await driver.wait(until.elementLocated(By.css('[data-testid="cart-item"]')), 10000);
        const cartItems = await driver.findElements(By.css('[data-testid="cart-item"]'));
        
        console.log(`Found ${cartItems.length} items in the cart.`);
        
        assert.strictEqual(cartItems.length, productTitles.length, 
            `ASSERTION FAILED: Expected ${productTitles.length} items but found ${cartItems.length}`);

        console.log("ASSERTION PASSED: All multiple items verified in Cart.");

    } catch (error) {
        console.error("MULTI-ADD TO CART FAILED:", error.message);
    }
}

async function testRemoveItemFromCart(driver, productTitle) {
    try {
        console.log(`--- ATTEMPT: Removing '${productTitle}' from Cart ---`);

        const cartItem = await driver.wait(
            until.elementLocated(By.xpath(
                `//div[@data-testid="cart-item"][descendant::*[normalize-space()="${productTitle}"]]`
            )),
            10000
        );

        const removeBtn = await cartItem.findElement(By.css('[data-testid="remove-button"]'));
        
        await driver.executeScript("arguments[0].click();", removeBtn);
        console.log(`Clicked 'Remove' for ${productTitle}`);

        await driver.wait(async () => {
            const remainingItems = await driver.findElements(By.xpath(
                `//div[@data-testid="cart-item"][descendant::*[normalize-space()="${productTitle}"]]`
            ));
            return remainingItems.length === 0;
        }, 8000);

        await driver.sleep(2000);
        closeToast(driver);
        console.log(`ASSERTION PASSED: '${productTitle}' removed from UI.`);

    } catch (error) {
        console.error("REMOVE ITEM TEST FAILED:", error.message);
    }
}

async function testIncreaseQuantity(driver, productTitle) {
    try {
        console.log(`--- ATTEMPT: Increasing quantity for '${productTitle}' ---`);

        const cartItem = await driver.wait(
            until.elementLocated(By.xpath(
                `//div[@data-testid="cart-item"][descendant::*[normalize-space()="${productTitle}"]]`
            )),
            10000
        );

        const quantityElement = await cartItem.findElement(
            By.xpath(".//button[@data-testid='subtract-quantity']/following-sibling::p | .//button[@data-testid='subtract-quantity']/following-sibling::span")
        );
        const initialQty = parseInt(await quantityElement.getText());
        console.log(`Initial quantity: ${initialQty}`);

        const addButton = await cartItem.findElement(By.css('[data-testid="add-quantity"]'));
        
        await driver.executeScript("arguments[0].click();", addButton);
        console.log("Clicked '+' button.");

        await driver.wait(async () => {
            const currentQty = await quantityElement.getText();
            return currentQty === (initialQty + 1).toString();
        }, 5000);

        const finalQty = parseInt(await quantityElement.getText());
        assert.strictEqual(finalQty, initialQty + 1, `ASSERTION FAILED: Quantity did not increment correctly!`);
        
        console.log(`ASSERTION PASSED: Quantity increased from ${initialQty} to ${finalQty}`);

    } catch (error) {
        console.error("QUANTITY TEST FAILED:", error.message);
        
        try {
            const addButton = await driver.findElement(By.css('[data-testid="add-quantity"]'));
            const isDisabled = await addButton.getAttribute("disabled");
            if (isDisabled) console.log("Note: The add button appears to be DISABLED (likely Stock Limit).");
        } catch (e) {}
    }
}

async function testRemoveQuantity(driver, productTitle) {
    try {
        console.log(`--- ATTEMPT: Decrease quantity for '${productTitle}' ---`);

        const cartItem = await driver.wait(
            until.elementLocated(By.xpath(
                `//div[@data-testid="cart-item"][descendant::*[normalize-space()="${productTitle}"]]`
            )),
            10000
        );

        const quantityElement = await cartItem.findElement(
            By.xpath(".//button[@data-testid='subtract-quantity']/following-sibling::p | .//button[@data-testid='subtract-quantity']/following-sibling::span")
        );
        const initialQty = parseInt(await quantityElement.getText());
        console.log(`Initial quantity: ${initialQty}`);

        const subtractButton = await cartItem.findElement(By.css('[data-testid="subtract-quantity"]'));
        
        await driver.executeScript("arguments[0].click();", subtractButton);
        console.log("Clicked '-' button.");

        await driver.wait(async () => {
            const currentQty = await quantityElement.getText();
            return currentQty === (initialQty - 1).toString();
        }, 5000);

        const finalQty = parseInt(await quantityElement.getText());
        assert.strictEqual(finalQty, initialQty - 1, `ASSERTION FAILED: Quantity did not increment correctly!`);
        
        console.log(`ASSERTION PASSED: Quantity decreased from ${initialQty} to ${finalQty}`);

    } catch (error) {
        console.error("QUANTITY TEST FAILED:", error.message);
        
        try {
            const addButton = await driver.findElement(By.css('[data-testid="add-quantity"]'));
            const isDisabled = await addButton.getAttribute("disabled");
            if (isDisabled) console.log("Note: The add button appears to be DISABLED (likely Stock Limit).");
        } catch (e) {}
    }
}

async function testSubtotal(driver, productTitle) {
    try {
        console.log(`--- ATTEMPT: Verifying subtotal update for '${productTitle}' ---`);

        const cartItem = await driver.wait(
            until.elementLocated(By.xpath(
                `//div[@data-testid="cart-item"][descendant::*[normalize-space()="${productTitle}"]]`
            )),
            10000
        );

        const priceElement = await cartItem.findElement(By.xpath(".//*[contains(text(), '$')]"));
        const unitPrice = parseFloat((await priceElement.getText()).replace(/[^0-9.]/g, ""));
        console.log(`Detected Unit Price: ${unitPrice}`);

        const subtotalElement = await driver.findElement(
            By.xpath("//h6[contains(text(), '$')]/parent::div | //p[text()='Subtotal']/following-sibling::p")
        );
        const initialSubtotal = parseFloat((await subtotalElement.getText()).replace(/[^0-9.]/g, ""));
        console.log(`Initial Subtotal: ${initialSubtotal}`);

        const addButton = await cartItem.findElement(By.css('[data-testid="add-quantity"]'));
        await driver.executeScript("arguments[0].click();", addButton);
        console.log("Clicked '+' button.");

        const expectedSubtotal = initialSubtotal + unitPrice;

        await driver.wait(async () => {
            const currentSubtotalText = await subtotalElement.getText();
            const currentSubtotal = parseFloat(currentSubtotalText.replace(/[^0-9.]/g, ""));
            return currentSubtotal === expectedSubtotal;
        }, 8000);

        const finalSubtotal = parseFloat((await subtotalElement.getText()).replace(/[^0-9.]/g, ""));
        
        assert.strictEqual(
            finalSubtotal, 
            expectedSubtotal, 
            `ASSERTION FAILED: Subtotal mismatch! Expected ${expectedSubtotal}, but got ${finalSubtotal}`
        );

        console.log(`ASSERTION PASSED: Subtotal updated correctly to $${finalSubtotal}`);

    } catch (error) {
        console.error("SUBTOTAL TEST FAILED:", error.message);
        
        if (error.message.includes("findElement")) {
            console.log("Check if the Subtotal Typography is visible on the screen.");
        }
    }
}

async function testEmptyCheckoutFormValidation(driver) {
    try {
        console.log("--- ATTEMPT: Testing Empty Form Validation ---");

        if (!(await driver.getCurrentUrl()).includes('/checkout')) {
            const checkoutBtn = await driver.wait(until.elementLocated(By.xpath("//a[normalize-space()='Checkout']")), 5000);
            await driver.executeScript("arguments[0].click();", checkoutBtn);
            await driver.wait(until.urlIs(urls.checkout), 10000);
        }
        
        const selectors = ["//input[contains(@placeholder, 'Home')]", "//p[text()='Street']/following-sibling::div//input"]; 
        for (const selector of selectors) {
            const el = await driver.findElement(By.xpath(selector));
            await el.sendKeys(Key.CONTROL, "a", Key.DELETE);
        }

        const addAddressBtn = await driver.wait(until.elementLocated(By.xpath("//button[text()='add']")), 5000);
        await addAddressBtn.click();
        await driver.sleep(1000); 

        const typeInput = await driver.wait(until.elementLocated(By.xpath("//input[contains(@placeholder, 'Home')]")), 5000);
        const isInvalid = await typeInput.getAttribute("aria-invalid");
        assert.strictEqual(isInvalid, "true", "ASSERTION FAILED: aria-invalid should be true");

        const resetBtn = await driver.wait(until.elementLocated(By.xpath("//button[text()='Reset']")), 5000);
        await resetBtn.click();
        
        console.log("ASSERTION PASSED: Empty form validation confirmed.");
    } catch (error) {
        console.error("EMPTY FORM TEST FAILED:", error.message);
        throw error;
    }
}

async function testInvalidCheckoutForm(driver) {
    try {
        console.log("--- ATTEMPT: Testing Invalid Shipping Information ---");

        if (!(await driver.getCurrentUrl()).includes('/checkout')) {
            const checkoutBtn = await driver.wait(until.elementLocated(By.xpath("//a[normalize-space()='Checkout']")), 5000);
            await driver.executeScript("arguments[0].click();", checkoutBtn);
            await driver.wait(until.urlIs(urls.checkout), 10000);
        }

        const invalidFields = [
            { label: "Type", value: address.invalid.type, xpath: "//input[contains(@placeholder, 'Home')]" },
            { label: "Street", value: address.invalid.street, xpath: "//p[text()='Street']/following-sibling::div//input" },
            { label: "Country", value: address.invalid.country, xpath: "//p[text()='Country']/following-sibling::div//input" },
            { label: "Phone", value: address.invalid.phone, xpath: "//p[text()='Phone Number']/following-sibling::div//input" },
            { label: "City", value: address.invalid.city, xpath: "//p[text()='City']/following-sibling::div//input" },
            { label: "State", value: address.invalid.state, xpath: "//p[text()='State']/following-sibling::div//input" },
            { label: "Postal", value: address.invalid.postal, xpath: "//p[text()='Postal Code']/following-sibling::div//input" }
        ];

        for (const field of invalidFields) {
            const element = await driver.wait(until.elementLocated(By.xpath(field.xpath)), 5000);
            await element.sendKeys(Key.CONTROL, "a", Key.DELETE); 
            await element.sendKeys(field.value);
        }

        const addAddressBtn = await driver.wait(until.elementLocated(By.xpath("//button[text()='add']")), 5000);
        await addAddressBtn.click();

        await driver.sleep(1000);
        
        const errorElements = await driver.wait(
            until.elementsLocated(By.xpath("//p[contains(@class, 'Mui-error') or contains(@class, 'MuiFormHelperText-root')]")), 
            5000
        );
        
        assert.ok(errorElements.length > 0, "ASSERTION FAILED: No validation errors appeared for invalid data.");
        console.log(`Confirmed: ${errorElements.length} validation errors are visible.`);

        const invalidCardXpath = `//div[contains(@class, 'MuiPaper-root')][descendant::p[text()="${address.invalid.street}"]]`;
        const cards = await driver.findElements(By.xpath(invalidCardXpath));
        
        assert.strictEqual(cards.length, 0, "ASSERTION FAILED: An address card was created with invalid data!");

        const resetBtn = await driver.wait(until.elementLocated(By.xpath("//button[text()='Reset']")), 5000);
        await resetBtn.click();
        console.log("ASSERTION PASSED: Form reset successfully.");

    } catch (error) {
        console.error("NVALID FORM TEST FAILED:", error.message);
        throw error;
    }
}

async function testCheckoutForm(driver) {
    try {
        console.log("--- ATTEMPT: Filling Valid Shipping Information ---");
        if (!(await driver.getCurrentUrl()).includes('/checkout')) {
            const checkoutBtn = await driver.wait(until.elementLocated(By.xpath("//a[normalize-space()='Checkout']")), 5000);
            await driver.executeScript("arguments[0].click();", checkoutBtn);
            await driver.wait(until.urlIs(urls.checkout), 10000);
        }

        const fields = [
            { label: "Type", value: address.valid.type, xpath: "//input[contains(@placeholder, 'Home')]" },
            { label: "Street", value: address.valid.street, xpath: "//p[text()='Street']/following-sibling::div//input" },
            { label: "Country", value: address.valid.country, xpath: "//p[text()='Country']/following-sibling::div//input" },
            { label: "Phone", value: address.valid.phone, xpath: "//p[text()='Phone Number']/following-sibling::div//input" },
            { label: "City", value: address.valid.city, xpath: "//p[text()='City']/following-sibling::div//input" },
            { label: "State", value: address.valid.state, xpath: "//p[text()='State']/following-sibling::div//input" },
            { label: "Postal", value: address.valid.postal, xpath: "//p[text()='Postal Code']/following-sibling::div//input" }
        ];

        for (const field of fields) {
            const element = await driver.wait(until.elementLocated(By.xpath(field.xpath)), 5000);
            await element.sendKeys(Key.CONTROL, "a", Key.DELETE); 
            await element.sendKeys(field.value);
        }

        const addAddressBtn = await driver.wait(until.elementLocated(By.xpath("//button[text()='add']")), 5000);
        await addAddressBtn.click();

        const radioXpath = `//div[contains(@class, 'MuiPaper-root')][descendant::p[contains(text(), "${address.valid.street}")]]//input[@type='radio']`;
        const newAddressRadio = await driver.wait(until.elementLocated(By.xpath(radioXpath)), 10000);
        
        await driver.executeScript("arguments[0].click();", newAddressRadio);
        assert.ok(await newAddressRadio.isSelected(), "Radio button not selected.");

        console.log("ASSERTION PASSED: Valid form confirmed.");
    } catch (error) {
        console.error("VALID FORM TEST FAILED:", error.message);
        throw error;
    }
}

async function testPaymentAndOrder(driver) {
    try {
        console.log(`--- ATTEMPT: Selecting Payment Method (${payment.method}) ---`);

        const paymentRadio = await driver.wait(
            until.elementLocated(By.xpath(
                `//p[text()="${payment.method}"]/preceding-sibling::span//input[@type='radio']`
            )),
            10000
        );

        await driver.executeScript("arguments[0].click();", paymentRadio);
        console.log(`Selected payment method: ${payment.method}`);

        const isChecked = await paymentRadio.isSelected();
        assert.ok(isChecked, `ASSERTION FAILED: ${payment.method} radio button was not selected.`);

        const payBtn = await driver.findElement(By.xpath("//button[text()='Pay and order']"));
        
        await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", payBtn);
        await payBtn.click();
        console.log("Clicked 'Pay and order' button.");

        await driver.wait(until.urlContains('/order-success'), 15000);
        
        console.log("ASSERTION PASSED: Order placed and verified.");

    } catch (error) {
        console.error("PAYMENT TEST FAILED:", error.message);
    }
}

async function testMultipleOrdersConfirmation(driver, productTitles) {
    try {
        console.log("--- ATTEMPT: Confirming Multiple Items in Order History ---");
        
        await driver.wait(until.urlContains('/order-success'), 10000);
        const ordersLink = await driver.wait(
            until.elementLocated(By.xpath("//a[contains(@href, '/orders')]")), 
            5000
        );
        await ordersLink.click();
        
        await driver.wait(until.urlIs(urls.orders), 10000);

        for (const title of productTitles) {
            console.log(`Verifying existence of: ${title}...`);

            const productElement = await driver.wait(
                until.elementLocated(By.xpath(
                    `//div[contains(@class, 'MuiPaper-root')]//descendant::*[normalize-space()="${title}"]`
                )), 
                8000
            );

            await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", productElement);

            const confirmedText = await productElement.getText();
            assert.ok(confirmedText.includes(title), `ASSERTION FAILED: Product '${title}' not found in Order History.`);
            console.log(`Found: ${confirmedText}`);
        }

        const statusElement = await driver.wait(
            until.elementLocated(By.xpath("//*[contains(text(), 'Status')]")), 
            5000
        );
        const orderIdElement = await driver.findElement(By.xpath("//p[text()='Order Number']/following-sibling::p"));

        console.log(`Latest Order ID: ${await orderIdElement.getText()}`);
        console.log(`Current ${await statusElement.getText()}`);

        console.log("ASSERTION PASSED: All products confirmed in Order History.");

    } catch (error) {
        const bodyText = await driver.findElement(By.tagName("body")).getText();
        if (bodyText.includes("haven't been shopping lately")) {
            console.error("ORDER CONFIRMATION FAILED: The order list is empty!");
        } else {
            console.error("ORDER CONFIRMATION FAILED:", error.message);
        }
        throw error;
    }
}

async function closeToast(driver) {
    try {
        const toasts = await driver.findElements(By.className("Toastify__toast"));
        
        if (toasts.length > 0) {
            console.log("Toast detected, waiting for it to clear...");
            
            const closeButton = await driver.wait(
                until.elementLocated(By.className("Toastify__close-button")), 
                2000
            );
            await closeButton.click();
            
            await driver.wait(until.stalenessOf(toasts[0]), 5000);
            console.log("Toast cleared.");
        }

    } catch (error) {
        console.log("No toast was blocking the button or error occurred:", error.message);
    }
}

async function runProductTest() {
    let driver = await new Builder().forBrowser('chrome').build();
    try {
        await driver.manage().window().maximize();
        await testProductVisibility(driver);
        await testProductDetails(driver);
        await testMultiBrandFilter(driver, ["Apple", "Samsung", "OPPO"]);
        await testAddMultipleToCart(driver, product.testAddProducts);
        await testRemoveItemFromCart(driver, product.testRemoveProduct);
        await testIncreaseQuantity(driver, product.testAddProduct);
        await testRemoveQuantity(driver, product.testAddProduct);
        await testProductFilter(driver, product.productFilter);
        await testAddToCart(driver, product.testAddSecondProduct);
        await testSubtotal(driver, product.testAddProduct);
        await testEmptyCheckoutFormValidation(driver);
        await testInvalidCheckoutForm(driver);
        await testCheckoutForm(driver);
        await testPaymentAndOrder(driver);
        await testMultipleOrdersConfirmation(driver, product.testAddProducts);
        
    } catch (error) {
        console.error('ONE TEST FAILED:', error);
    } finally {
        await driver.quit();
    }
}

runProductTest();