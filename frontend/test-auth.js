/* Author: Abdul Samad | */

/**
 * Quick Test Script for Authentication
 * 
 * Open browser console at http://localhost:5174
 * Paste this code and run it to test registration and login
 */

// Test Registration
async function testRegister() {
    const response = await fetch('http://localhost:8000/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'Test User',
            email: 'test@example.com',
            password: 'test123',
            role: 'corporate',
            org_name: 'Test Corp'
        })
    });
    const data = await response.json();
    console.log('Registration response:', data);
    return data;
}

// Test Login
async function testLogin() {
    const formData = new FormData();
    formData.append('username', 'test@example.com');
    formData.append('password', 'test123');

    const response = await fetch('http://localhost:8000/api/v1/auth/token', {
        method: 'POST',
        body: formData
    });
    const data = await response.json();
    console.log('Login response:', data);
    return data;
}

// Run tests
console.log('Testing registration...');
testRegister()
    .then(() => {
        console.log('Testing login...');
        return testLogin();
    })
    .then(() => {
        console.log('All tests passed!');
    })
    .catch(err => {
        console.error('Test failed:', err);
    });
