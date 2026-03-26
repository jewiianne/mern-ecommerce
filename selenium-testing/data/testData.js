const BASE_URL = 'http://localhost:3000';

module.exports = {
    urls: {
        home: `${BASE_URL}/`,
        login: `${BASE_URL}/login`,
        cart: `${BASE_URL}/cart`,
        checkout: `${BASE_URL}/checkout`,
        adminDashboard: `${BASE_URL}/admin/dashboard`,
        orders: `${BASE_URL}/orders`,
        addProduct: `${BASE_URL}/admin/add-product`,
    },

    credentials: {
        admin: {
            email: 'test_admin@example.com',
            password: '12345Admin',
            name: 'admin'
        },
        standardUser: {
            email: 'test_user@example.com',
            password: '12345User',
            name: 'user'
        },
        invalidUser: {
            email: 'wrong@test.com',
            password: 'wrongpassword'
        }
    },

    product: {
        testAddProduct: 'Samsung Galaxy Book',
        testAddSecondProduct: 'Samsung Universe 9',
        testAddProducts: ['Samsung Galaxy Book', 'Samsung Universe 9'],
        testRemoveProduct: 'Samsung Universe 9',
        productFilter:'Samsung',
        productFilters:['Samsung', 'Apple', 'OPPO']
    },

    address:{
        valid:{
            type: 'Home',
            street: 'New York Avenue',
            country: 'Philippines',
            phone: '09861078663',
            city: 'Quezon City',
            state: 'Metro Manila',
            postal: '1008'
        },
        invalid:{
            type: 'hi',
            street: 'st',
            country: 'ph',
            phone: '1',
            city: 'c17y',
            state: 'st',
            postal: '1'
        }
    },

    payment: {
        method: 'Cash',
    },

    selectors: {
        toastMessage: 'div.Toastify__toast-body'
    },

    messages: {
        invalidLogin: 'Invalid Credentails',
        loginSuccess: 'Login successful',
        emptyEmail: 'Email is required',
        emptyPassword: 'Password is required'
    }
};