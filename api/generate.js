export default async function handler(req, res) {
    // Hanya izinkan metode POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { rawCookie } = req.body;
    if (!rawCookie) {
        return res.status(400).json({ error: 'Cookie tidak boleh kosong' });
    }

    try {
        const cookieDict = extractCookieDict(rawCookie);
        const netflixId = cookieDict['NetflixId'];

        if (!netflixId) {
            return res.status(400).json({ error: 'Cookie NetflixId tidak ditemukan.' });
        }

        const API_URL = "https://ios.prod.ftl.netflix.com/iosui/user/15.48";
        
        const queryParams = new URLSearchParams({
            appVersion: "15.48.1",
            config: '{"gamesInTrailersEnabled":"false","isTrailersEvidenceEnabled":"false","cdsMyListSortEnabled":"true","kidsBillboardEnabled":"true","addHorizontalBoxArtToVideoSummariesEnabled":"false","skOverlayTestEnabled":"false","homeFeedTestTVMovieListsEnabled":"false","baselineOnIpadEnabled":"true","trailersVideoIdLoggingFixEnabled":"true","postPlayPreviewsEnabled":"false","bypassContextualAssetsEnabled":"false","roarEnabled":"false","useSeason1AltLabelEnabled":"false","disableCDSSearchPaginationSectionKinds":["searchVideoCarousel"],"cdsSearchHorizontalPaginationEnabled":"true","searchPreQueryGamesEnabled":"true","kidsMyListEnabled":"true","billboardEnabled":"true","useCDSGalleryEnabled":"true","contentWarningEnabled":"true","videosInPopularGamesEnabled":"true","avifFormatEnabled":"false","sharksEnabled":"true"}',
            device_type: "NFAPPL-02-",
            esn: "NFAPPL-02-IPHONE8%3D1-PXA-02026U9VV5O8AUKEAEO8PUJETCGDD4PQRI9DEB3MDLEMD0EACM4CS78LMD334MN3MQ3NMJ8SU9O9MVGS6BJCURM1PH1MUTGDPF4S4200",
            idiom: "phone",
            iosVersion: "15.8.5",
            isTablet: "false",
            languages: "en-US",
            locale: "en-US",
            maxDeviceWidth: "375",
            model: "saget",
            modelType: "IPHONE8-1",
            odpAware: "true",
            path: '["account","token","default"]',
            pathFormat: "graph",
            pixelDensity: "2.0",
            progressive: "false",
            responseFormat: "json"
        });

        const headers = {
            "User-Agent": "Argo/15.48.1 (iPhone; iOS 15.8.5; Scale/2.00)",
            "x-netflix.request.attempt": "1",
            "x-netflix.request.client.user.guid": "A4CS633D7VCBPE2GPK2HL4EKOE",
            "x-netflix.context.profile-guid": "A4CS633D7VCBPE2GPK2HL4EKOE",
            "x-netflix.request.routing": '{"path":"/nq/mobile/nqios/~15.48.0/user","control_tag":"iosui_argo"}',
            "x-netflix.context.app-version": "15.48.1",
            "x-netflix.argo.translated": "true",
            "x-netflix.context.form-factor": "phone",
            "x-netflix.context.sdk-version": "2012.4",
            "x-netflix.client.appversion": "15.48.1",
            "x-netflix.context.max-device-width": "375",
            "x-netflix.context.ab-tests": "",
            "x-netflix.tracing.cl.useractionid": "4DC655F2-9C3C-4343-8229-CA1B003C3053",
            "x-netflix.client.type": "argo",
            "x-netflix.client.ftl.esn": "NFAPPL-02-IPHONE8=1-PXA-02026U9VV5O8AUKEAEO8PUJETCGDD4PQRI9DEB3MDLEMD0EACM4CS78LMD334MN3MQ3NMJ8SU9O9MVGS6BJCURM1PH1MUTGDPF4S4200",
            "x-netflix.context.locales": "en-US",
            "x-netflix.context.top-level-uuid": "90AFE39F-ADF1-4D8A-B33E-528730990FE3",
            "x-netflix.client.iosversion": "15.8.5",
            "accept-language": "en-US;q=1",
            "x-netflix.argo.abtests": "",
            "x-netflix.context.os-version": "15.8.5",
            "x-netflix.request.client.context": '{"appState":"foreground"}',
            "x-netflix.context.ui-flavor": "argo",
            "x-netflix.argo.nfnsm": "9",
            "x-netflix.context.pixel-density": "2.0",
            "x-netflix.request.toplevel.uuid": "90AFE39F-ADF1-4D8A-B33E-528730990FE3",
            "x-netflix.request.client.timezoneid": "Asia/Dhaka",
            "Cookie": `NetflixId=${netflixId}`
        };

        const response = await fetch(`${API_URL}?${queryParams.toString()}`, {
            method: 'GET',
            headers: headers
        });

        if (!response.ok) {
            throw new Error(`Netflix API Error: HTTP ${response.status}`);
        }

        const data = await response.json();
        
        // Ekstraksi token
        const tokenData = data?.value?.account?.token?.default || {};
        const token = tokenData.token;
        let expires = tokenData.expires;

        if (!token) {
            throw new Error('Token tidak ditemukan dalam respons Netflix.');
        }

        // Normalisasi timestamp (jika dalam milidetik)
        if (typeof expires === 'number' && String(expires).length === 13) {
            expires = Math.floor(expires / 1000);
        }

        let formattedExpiry = "Unknown";
        if (expires) {
            formattedExpiry = new Date(expires * 1000).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
        }

        return res.status(200).json({
            success: true,
            url: `https://netflix.com/?nftoken=${token}`,
            token: token,
            expires: formattedExpiry
        });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

// Fungsi untuk parsing cookie (terjemahan dari Python)
function extractCookieDict(text) {
    const cookieDict = {};
    const COOKIE_KEYS = ["NetflixId", "SecureNetflixId", "nfvdid", "OptanonConsent"];
    
    // 1. Cek format Netscape (tab-separated)
    const lines = text.split('\n');
    for (const line of lines) {
        const parts = line.trim().split('\t');
        if (parts.length >= 7) {
            cookieDict[parts[5]] = parts[6];
        }
    }

    // 2. Cek format JSON
    try {
        const data = JSON.parse(text);
        const processCookieObj = (obj) => {
            if (COOKIE_KEYS.includes(obj.name) && typeof obj.value === 'string') {
                cookieDict[obj.name] = decodeURIComponent(obj.value);
            }
        };

        if (Array.isArray(data)) {
            data.forEach(processCookieObj);
        } else if (data && typeof data === 'object') {
            if (data.cookies && Array.isArray(data.cookies)) {
                data.cookies.forEach(processCookieObj);
            } else {
                COOKIE_KEYS.forEach(key => {
                    if (typeof data[key] === 'string') {
                        cookieDict[key] = decodeURIComponent(data[key]);
                    }
                });
            }
        }
    } catch (e) {
        // Abaikan jika bukan JSON
    }

    // 3. Fallback pakai Regex (jika format raw string)
    COOKIE_KEYS.forEach(key => {
        if (!cookieDict[key]) {
            const match = text.match(new RegExp(`${key}=([^;,\\s]+)`));
            if (match) {
                cookieDict[key] = decodeURIComponent(match[1]);
            }
        }
    });

    return cookieDict;
}
