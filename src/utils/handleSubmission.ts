export const handleSubmission = async <T>(
  asyncFunction: () => Promise<T>, // The async function to execute
  addToast: (message: string, type: 'error' | 'success' | 'info') => void, // Add toast from context
  successMessage: string, // Message for success
  errorMessage = 'An error occurred. Please try again.' // Default error message
): Promise<T | undefined> => {
  try {
    const result = await asyncFunction();
    addToast(successMessage, 'success');
    return result;
  } catch (error: any) {
    console.log('error', error);
    if (error?.response) {
      addToast(error.response.data?.message || errorMessage, 'error');
    } else if (error?.request) {
      addToast('Network error. Please check your connection.', 'error');
    } else {
      addToast(errorMessage, 'error');
    }
    return undefined;
  }
};
