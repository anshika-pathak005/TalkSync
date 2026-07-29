import axios from "axios";

// this file is imported once, at app entry (index.js), purely for its
// side effects — axios's default export is a shared singleton, so
// registering these here affects every `import axios from "axios"` call
// anywhere else in the app without needing to touch those files

// required so the httpOnly refresh-token cookie actually gets sent/stored
axios.defaults.withCredentials = true;

// always attach the freshest access token, even if a component built its
// request config from a stale `user` object out of React Context (Context
// doesn't automatically re-sync when the token below is refreshed)
axios.interceptors.request.use((config) => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo") || "null");
    if (userInfo?.token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${userInfo.token}`;
    }
    return config;
});

// concurrent 401s (e.g. several components fetching on mount) should only
// trigger ONE refresh call, not one per request
let refreshPromise = null;

const AUTH_ENDPOINTS = ["/api/user/login", "/api/user/refresh"];

const isAuthEndpoint = (url) =>
    typeof url === "string" && AUTH_ENDPOINTS.some((endpoint) => url.includes(endpoint));

const clearSessionAndRedirect = () => {
    localStorage.removeItem("userInfo");
    if (window.location.pathname !== "/") {
        window.location.href = "/";
    }
};

axios.interceptors.response.use(
    (response) => response,
    async (error) => {
        const { config, response } = error;

        // don't try to "refresh" our way out of a failed login, or retry
        // a refresh call that itself just failed — both mean the session
        // is genuinely over
        if (!config || response?.status !== 401 || config._retry || isAuthEndpoint(config.url)) {
            return Promise.reject(error);
        }

        config._retry = true;

        try {
            if (!refreshPromise) {
                refreshPromise = axios
                    .post("/api/user/refresh")
                    .finally(() => {
                        refreshPromise = null;
                    });
            }
            const { data } = await refreshPromise;

            const userInfo = JSON.parse(localStorage.getItem("userInfo") || "null");
            if (userInfo) {
                userInfo.token = data.token;
                localStorage.setItem("userInfo", JSON.stringify(userInfo));
            }

            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${data.token}`;
            return axios(config);
        } catch (refreshError) {
            clearSessionAndRedirect();
            return Promise.reject(refreshError);
        }
    }
);

export default axios;
