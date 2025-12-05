/**
 * API Service
 * Handles all HTTP requests to the backend
 */

// Backend base URL - change this if your backend is on a different host/port
// For physical device testing, use your computer's IP address instead of localhost
const BASE_URL = (typeof __DEV__ !== 'undefined' && __DEV__)
    ? 'http://127.0.0.1:5001'  // Local development
    : 'http://127.0.0.1:5001'; // Production (update with actual backend URL)

/**
 * Make an API request
 * @param {string} endpoint - API endpoint (e.g., '/api/auth/login')
 * @param {object} options - Fetch options (method, body, headers, etc.)
 * @returns {Promise<{data: any, error: string|null, status: number}>}
 */
async function apiRequest(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const defaultHeaders = {
        'Content-Type': 'application/json',
    };

    const config = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
    };

    try {
        console.log(`[API] ${options.method || 'GET'} ${url}`);
        
        const response = await fetch(url, config);
        
        // Check if response has content
        const contentType = response.headers.get('content-type');
        const hasJsonContent = contentType && contentType.includes('application/json');
        
        // Get response text first to handle empty responses
        const responseText = await response.text();
        
        let json = {};
        if (responseText && responseText.trim() !== '') {
            try {
                json = JSON.parse(responseText);
            } catch (parseError) {
                console.error(`[API] JSON parse error for ${url}:`, parseError);
                console.error(`[API] Response text:`, responseText);
                
                if (!response.ok) {
                    return {
                        data: null,
                        error: `Invalid response from server: ${response.status} ${response.statusText}`,
                        status: response.status,
                    };
                }
                
                // If successful but not JSON, return the text as data
                return {
                    data: responseText,
                    message: null,
                    error: null,
                    status: response.status,
                };
            }
        }
        
        if (!response.ok) {
            // Handle error response
            // Backend returns: {"error": "message"} for errors
            let errorMessage = json.error || json.message;
            
            // If json is an array (unexpected format), try to extract error from first element
            if (Array.isArray(json) && json.length > 0) {
                const firstItem = json[0];
                if (firstItem && typeof firstItem === 'object' && firstItem.error) {
                    errorMessage = firstItem.error;
                } else {
                    errorMessage = JSON.stringify(json);
                }
            }
            
            // Fallback to status text if no error message found
            if (!errorMessage) {
                errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            }
            
            console.error(`[API Error] ${url}:`, errorMessage);
            return {
                data: null,
                error: errorMessage,
                status: response.status,
            };
        }

        // Handle success response
        console.log(`[API Success] ${url}:`, json);
        return {
            data: json.data || json,
            message: json.message,
            error: null,
            status: response.status,
        };
    } catch (error) {
        // Handle network errors
        console.error(`[API Network Error] ${url}:`, error.message);
        return {
            data: null,
            error: error.message || 'Network error. Please check your connection.',
            status: 0,
        };
    }
}

/**
 * Authentication API methods
 */
export const authAPI = {
    /**
     * Login with username
     * @param {string} username
     * @returns {Promise<{data: user object, error: string|null}>}
     */
    login: async (username) => {
        if (!username || username.trim() === '') {
            return {
                data: null,
                error: 'Username is required',
                status: 400,
            };
        }

        return apiRequest('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username: username.trim() }),
        });
    },

    /**
     * Signup with username
     * @param {string} username
     * @returns {Promise<{data: user object, error: string|null}>}
     */
    signup: async (username) => {
        if (!username || username.trim() === '') {
            return {
                data: null,
                error: 'Username is required',
                status: 400,
            };
        }

        return apiRequest('/api/auth/signup', {
            method: 'POST',
            body: JSON.stringify({ username: username.trim() }),
        });
    },
};

/**
 * Lobby API methods
 */
export const lobbyAPI = {
    /**
     * Create a new lobby
     * @param {object} lobbyData - { host_id, location, radius, date, start_hour, end_hour, activity_counts, max_members }
     * @returns {Promise<{data: lobby object, error: string|null}>}
     */
    create: async (lobbyData) => {
        return apiRequest('/api/lobbies', {
            method: 'POST',
            body: JSON.stringify(lobbyData),
        });
    },

    /**
     * Join a lobby by code
     * @param {string} code - Lobby join code
     * @param {string} user_id - User ID
     * @returns {Promise<{data: lobby object, error: string|null}>}
     */
    join: async (code, user_id) => {
        return apiRequest('/api/lobbies/join', {
            method: 'POST',
            body: JSON.stringify({ code: code.toUpperCase(), user_id }),
        });
    },

    /**
     * Get lobby details by ID
     * @param {string} lobby_id
     * @returns {Promise<{data: lobby object, error: string|null}>}
     */
    get: async (lobby_id) => {
        return apiRequest(`/api/lobbies/${lobby_id}`);
    },

    /**
     * Get lobby status with members
     * @param {string} lobby_id
     * @returns {Promise<{data: status object, error: string|null}>}
     */
    getStatus: async (lobby_id) => {
        return apiRequest(`/api/lobbies/${lobby_id}/status`);
    },

    /**
     * Set member ready status
     * @param {string} lobby_id
     * @param {string} user_id
     * @param {boolean} ready
     * @returns {Promise<{data: status object, error: string|null}>}
     */
    setReady: async (lobby_id, user_id, ready = true) => {
        return apiRequest(`/api/lobbies/${lobby_id}/member/${user_id}/ready`, {
            method: 'POST',
            body: JSON.stringify({ ready }),
        });
    },
};

/**
 * Consensus/Voting API methods
 */
export const consensusAPI = {
    /**
     * Start the voting game (host only)
     * @param {string} lobby_id
     * @param {string} user_id
     * @returns {Promise<{data: status object, error: string|null}>}
     */
    start: async (lobby_id, user_id) => {
        return apiRequest(`/api/consensus/lobby/${lobby_id}/start`, {
            method: 'POST',
            body: JSON.stringify({ user_id }),
        });
    },

    /**
     * Get options for a round
     * @param {string} lobby_id
     * @param {number} round_number
     * @returns {Promise<{data: {round, options, count}, error: string|null}>}
     */
    getRoundOptions: async (lobby_id, round_number) => {
        return apiRequest(`/api/consensus/lobby/${lobby_id}/round/${round_number}/options`);
    },

    /**
     * Submit a vote
     * @param {string} lobby_id
     * @param {object} voteData - { user_id, option_id, round_number, vote }
     * @returns {Promise<{data: vote object, error: string|null}>}
     */
    vote: async (lobby_id, voteData) => {
        return apiRequest(`/api/consensus/lobby/${lobby_id}/vote`, {
            method: 'POST',
            body: JSON.stringify(voteData),
        });
    },

    /**
     * Get round status and consensus info
     * @param {string} lobby_id
     * @param {number} round_number
     * @returns {Promise<{data: status object, error: string|null}>}
     */
    getRoundStatus: async (lobby_id, round_number) => {
        return apiRequest(`/api/consensus/lobby/${lobby_id}/round/${round_number}/status`);
    },

    /**
     * Complete a round (mark consensus reached)
     * @param {string} lobby_id
     * @param {number} round_number
     * @param {string} selected_option_id
     * @param {string} user_id
     * @returns {Promise<{data: completion object, error: string|null}>}
     */
    completeRound: async (lobby_id, round_number, selected_option_id, user_id) => {
        return apiRequest(`/api/consensus/lobby/${lobby_id}/round/${round_number}/complete`, {
            method: 'POST',
            body: JSON.stringify({ selected_option_id, user_id }),
        });
    },

    /**
     * Get waiting status (who's finished voting)
     * @param {string} lobby_id
     * @returns {Promise<{data: waiting status object, error: string|null}>}
     */
    getWaitingStatus: async (lobby_id) => {
        return apiRequest(`/api/consensus/lobby/${lobby_id}/waiting`);
    },
};

/**
 * Result API methods
 */
export const resultAPI = {
    /**
     * Get final itinerary with selected activities
     * @param {string} lobby_id
     * @returns {Promise<{data: itinerary object, error: string|null}>}
     */
    getItinerary: async (lobby_id) => {
        return apiRequest(`/api/results/lobby/${lobby_id}/itinerary`);
    },
};

export default {
    auth: authAPI,
    lobby: lobbyAPI,
    consensus: consensusAPI,
    result: resultAPI,
    BASE_URL,
};

