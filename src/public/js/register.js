async function register() {
    try {
        const response = await fetch('/register');
        const options = await response.json();

        const credential = await navigator.credentials.create({ publicKey: options });
        const verificationResponse = await fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credential),
        });

        const verificationResult = await verificationResponse.json();
        if (verificationResult.success) {
            // Handle successful registration
        } else {
            // Handle registration failure
        }
    } catch (error) {
        console.error(error);
        // Handle errors
    }
}
