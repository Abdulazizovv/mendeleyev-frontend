import apiClient from "./client";

/**
 * Finance API Request Interceptor
 * 
 * DEPRECATED: PIN code security has been removed.
 * This file is kept for backward compatibility but all interceptors are disabled.
 * Finance API now uses the standard apiClient without additional security layers.
 */

// No interceptors - direct pass-through to apiClient
export default apiClient;

