const URL_VALIDATION_ERROR = {
    invalid: {
        message: "Invalid URL",
    },
    duplicate: {
        message: "URL already exists",
    },
};


export function validateUrl(urlInput: string) {
    let error;

    // Validate if URL is valid site collection and is not already in the list
    const isValidUrl =
        urlInput.toLowerCase().startsWith(window.location.origin.toLowerCase()) ||
        urlInput.startsWith("/");

    if (!isValidUrl) {
        error = URL_VALIDATION_ERROR.invalid;
    }

    return {
        urlInput,
        error,
    };
}