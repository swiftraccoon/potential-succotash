async function login() {
    try {
        const response = await fetch('/login');
        const options = await response.json();

        const assertion = await navigator.credentials.get({ publicKey: options });
        const verificationResponse = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(assertion),
        });

        const verificationResult = await verificationResponse.json();
        if (verificationResult.success) {
            // Handle successful login
        } else {
            // Handle login failure
        }
    } catch (error) {
        console.error(error);
        // Handle errors
    }
}
