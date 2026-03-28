// Import necessary modules
import { useEffect } from 'react';
import { GoogleLogin } from 'react-google-login';

const HomePage = () => {

    const handleGoogleLoginSuccess = (response) => {
        console.log('Google login successful!', response);
        // Handle successful login
    };

    const handleGoogleLoginFailure = (response) => {
        console.error('Google login failed!', response);
        // Handle failed login
    };

    // Debug logs to monitor the login process
    useEffect(() => {
        console.log('HomePage component mounted.');
    }, []);

    return (
        <div>
            <h1>Welcome to Commandia</h1>
            <GoogleLogin
                onSuccess={handleGoogleLoginSuccess}
                onFailure={handleGoogleLoginFailure}
                clientId="YOUR_CLIENT_ID"
                buttonText="Login with Google"
                theme="dark"
            />
        </div>
    );
};

export default HomePage;