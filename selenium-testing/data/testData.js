const BASE_URL = 'http://localhost:3000';

module.exports = {
    urls: {
        home: `${BASE_URL}/`,
        login: `${BASE_URL}/login`,
        cart: `${BASE_URL}/cart`,
        adminDashboard: `${BASE_URL}/admin/dashboard`,
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

    products: {
        validSearch: 'VHS',
        nonExistent: 'ZXY123-Empty-Product',
        newProduct: {
            name: 'Retro 80s VHS Tape',
            price: 250,
            description: 'A classic blank tape for your simulator store.',
            stock: 50
        }
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