package space.breeq.app

import android.annotation.SuppressLint
import android.content.ActivityNotFoundException
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Message
import android.util.Log
import android.view.View
import android.view.ViewGroup
import android.webkit.ConsoleMessage
import android.webkit.CookieManager
import android.webkit.JavascriptInterface
import android.webkit.RenderProcessGoneDetail
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.addCallback
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.graphics.ColorUtils
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat

/**
 * Breeq on Android: one WebView on the game menu, portrait only.
 *
 * The page is the product; this shell only does what a browser tab cannot:
 * fill the screen under the system bars and paint them in the page's colors,
 * lock portrait, keep the session across launches, hand external links to the
 * matching app, open the photo picker for the wall editor, and show a native
 * "offline" view when the first page cannot load.
 */
class MainActivity : ComponentActivity() {

    private lateinit var root: ViewGroup
    private lateinit var web: WebView
    private lateinit var offline: View

    /** True once the first page has painted (or failed): the splash can go. */
    private var contentShown = false
    /** The current main-frame load hit a network error; cleared when the next one starts. */
    private var loadFailed = false
    private var fileChooserCallback: ValueCallback<Array<Uri>>? = null

    private val appHosts: Set<String> =
        BuildConfig.APP_HOSTS.split(',').map { it.trim().lowercase() }.filter { it.isNotEmpty() }.toSet()

    private val fileChooser =
        registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
            val callback = fileChooserCallback ?: return@registerForActivityResult
            fileChooserCallback = null
            callback.onReceiveValue(
                WebChromeClient.FileChooserParams.parseResult(result.resultCode, result.data)
            )
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        val splash = installSplashScreen()
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_main)

        root = findViewById(R.id.root)
        web = findViewById(R.id.web)
        offline = findViewById(R.id.offline)
        findViewById<View>(R.id.retry).setOnClickListener { retry() }

        splash.setKeepOnScreenCondition { !contentShown }
        // A slow network must not hold the splash forever: give up on it after a few seconds.
        root.postDelayed({ contentShown = true }, SPLASH_MAX_MS)

        applyInsets()
        setupWebView()

        onBackPressedDispatcher.addCallback(this) {
            if (offline.visibility != View.VISIBLE && web.canGoBack()) web.goBack() else moveTaskToBack(true)
        }

        val restored = savedInstanceState?.let { web.restoreState(it) } != null
        if (!restored) {
            val linked = intent?.data?.takeIf { isAppHost(it.host) }
            web.loadUrl(linked?.toString() ?: BuildConfig.START_URL)
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        // App Links (breeq.space/r/<code>...) while the app is already running.
        intent.data?.takeIf { isAppHost(it.host) }?.let { web.loadUrl(it.toString()) }
    }

    // ---- WebView -------------------------------------------------------------------------

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG)

        with(web.settings) {
            javaScriptEnabled = true
            domStorageEnabled = true
            mediaPlaybackRequiresUserGesture = false
            allowFileAccess = false
            allowContentAccess = false
            mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
            cacheMode = WebSettings.LOAD_DEFAULT
            useWideViewPort = true
            loadWithOverviewMode = true
            setSupportZoom(false)
            builtInZoomControls = false
            displayZoomControls = false
            // The layout is tuned for the viewport; the system font scale would break the board.
            textZoom = 100
            // target=_blank and window.open land in onCreateWindow, which hands them out.
            setSupportMultipleWindows(true)
            javaScriptCanOpenWindowsAutomatically = true
            userAgentString = appUserAgent(userAgentString)
        }
        // The page owns its theme (data-theme); never let the engine auto-darken it.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            web.settings.isAlgorithmicDarkeningAllowed = false
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            @Suppress("DEPRECATION")
            web.settings.forceDark = WebSettings.FORCE_DARK_OFF
        }

        CookieManager.getInstance().apply {
            setAcceptCookie(true)
            setAcceptThirdPartyCookies(web, true)
        }

        web.isHorizontalScrollBarEnabled = false
        web.isVerticalScrollBarEnabled = false
        web.addJavascriptInterface(Bridge(), BRIDGE_NAME)
        web.webViewClient = Client()
        web.webChromeClient = Chrome()
    }

    /**
     * WebView announces itself with "; wv" and a "Version/4.0" token. Google's sign-in
     * refuses that (403 disallowed_useragent); Stripe and the site are indifferent. Present
     * as the Chrome it is, tagged so the site can tell it runs in the app.
     */
    private fun appUserAgent(default: String): String {
        val chrome = default.replace("; wv", "").replace(Regex("\\sVersion/\\d+(\\.\\d+)*"), "")
        return "$chrome BreeqApp/${BuildConfig.VERSION_NAME}"
    }

    private fun isAppHost(host: String?): Boolean = host != null && host.lowercase() in appHosts

    /** Networks the share row points at: their apps, never a page inside ours. */
    private fun isHandedOff(host: String?): Boolean {
        val h = host?.lowercase() ?: return false
        return HANDOFF_HOSTS.any { h == it || h.endsWith(".$it") }
    }

    private fun openExternally(uri: Uri): Boolean {
        val intent = try {
            if (uri.scheme == "intent") Intent.parseUri(uri.toString(), Intent.URI_INTENT_SCHEME)
            else Intent(Intent.ACTION_VIEW, uri)
        } catch (_: Exception) {
            return false
        }
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        return try {
            startActivity(intent)
            true
        } catch (_: ActivityNotFoundException) {
            // intent:// carries a Play fallback; otherwise say so.
            val fallback = intent.getStringExtra("browser_fallback_url")
            if (fallback != null) openExternally(Uri.parse(fallback))
            else {
                Toast.makeText(this, R.string.open_failed, Toast.LENGTH_SHORT).show()
                false
            }
        }
    }

    private inner class Client : WebViewClient() {
        override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
            val uri = request.url
            val scheme = uri.scheme?.lowercase()
            if (scheme != "http" && scheme != "https") {
                // mailto:, tel:, whatsapp:, tg:, intent:// ...
                openExternally(uri)
                return true
            }
            if (!request.isForMainFrame) return false
            if (isAppHost(uri.host)) return false
            if (isHandedOff(uri.host)) {
                openExternally(uri)
                return true
            }
            // Google sign-in, Stripe Checkout, a bank's 3-D Secure page: they come back to us,
            // so they stay inside where the session cookie lives.
            return false
        }

        override fun onPageStarted(view: WebView, url: String, favicon: Bitmap?) {
            loadFailed = false
        }

        override fun onPageCommitVisible(view: WebView, url: String) {
            contentShown = true
            // Chromium commits its own error page after onReceivedError; keep ours over it.
            if (!loadFailed) offline.visibility = View.GONE
        }

        override fun onPageFinished(view: WebView, url: String) {
            if (!loadFailed) view.evaluateJavascript(CHROME_OBSERVER_JS, null)
        }

        override fun onReceivedError(view: WebView, request: WebResourceRequest, error: WebResourceError) {
            if (!request.isForMainFrame) return
            Log.w(TAG, "load failed ${request.url}: ${error.errorCode} ${error.description}")
            loadFailed = true
            showOffline()
        }

        override fun onRenderProcessGone(view: WebView, detail: RenderProcessGoneDetail): Boolean {
            // The engine crashed or was reclaimed; a fresh activity gets a fresh WebView.
            Log.w(TAG, "render process gone (crash=${detail.didCrash()})")
            recreate()
            return true
        }
    }

    private inner class Chrome : WebChromeClient() {
        override fun onCreateWindow(view: WebView, isDialog: Boolean, isUserGesture: Boolean, resultMsg: Message): Boolean {
            // A throwaway WebView receives the popup's URL and forwards it: our own pages load here,
            // everything else (the share row, X, WhatsApp...) goes to the system.
            val probe = WebView(view.context)
            probe.webViewClient = object : WebViewClient() {
                override fun shouldOverrideUrlLoading(v: WebView, request: WebResourceRequest): Boolean {
                    val uri = request.url
                    if (isAppHost(uri.host)) web.loadUrl(uri.toString()) else openExternally(uri)
                    v.post { v.destroy() }
                    return true
                }
            }
            (resultMsg.obj as WebView.WebViewTransport).webView = probe
            resultMsg.sendToTarget()
            return true
        }

        override fun onShowFileChooser(
            webView: WebView,
            filePathCallback: ValueCallback<Array<Uri>>,
            fileChooserParams: FileChooserParams,
        ): Boolean {
            fileChooserCallback?.onReceiveValue(null)
            fileChooserCallback = filePathCallback
            return try {
                fileChooser.launch(fileChooserParams.createIntent())
                true
            } catch (_: ActivityNotFoundException) {
                fileChooserCallback = null
                false
            }
        }

        override fun onConsoleMessage(message: ConsoleMessage): Boolean {
            if (BuildConfig.DEBUG) Log.d(TAG, "${message.sourceId()}:${message.lineNumber()} ${message.message()}")
            return true
        }
    }

    // ---- Offline ---------------------------------------------------------------------------

    private fun showOffline() {
        contentShown = true
        offline.visibility = View.VISIBLE
    }

    /** The offline view stays up until the reload commits a real page. */
    private fun retry() {
        loadFailed = false
        val url = web.url?.takeIf { isAppHost(Uri.parse(it).host) } ?: BuildConfig.START_URL
        web.loadUrl(url)
    }

    // ---- System bars follow the page --------------------------------------------------------

    private fun applyInsets() {
        ViewCompat.setOnApplyWindowInsetsListener(root) { view, insets ->
            val bars = insets.getInsets(
                WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout() or WindowInsetsCompat.Type.ime()
            )
            view.setPadding(bars.left, bars.top, bars.right, bars.bottom)
            insets
        }
    }

    /** Paint the bars' backdrop in the page color and pick icon colors that read on it. */
    private fun setChrome(color: Int) {
        root.setBackgroundColor(color)
        web.setBackgroundColor(color)
        val light = ColorUtils.calculateLuminance(color) > 0.5
        WindowCompat.getInsetsController(window, window.decorView).apply {
            isAppearanceLightStatusBars = light
            isAppearanceLightNavigationBars = light
        }
    }

    /** `window.BreeqAndroid` — the site can tell it runs in the app and hand its colors over. */
    private inner class Bridge {
        @JavascriptInterface
        fun setChrome(cssColor: String) {
            val color = parseCssColor(cssColor) ?: return
            root.post { setChrome(color) }
        }

        @JavascriptInterface
        fun version(): String = BuildConfig.VERSION_NAME
    }

    // ---- Lifecycle -------------------------------------------------------------------------

    override fun onResume() {
        super.onResume()
        web.onResume()
    }

    override fun onPause() {
        web.onPause()
        CookieManager.getInstance().flush()
        super.onPause()
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        web.saveState(outState)
    }

    override fun onDestroy() {
        fileChooserCallback?.onReceiveValue(null)
        fileChooserCallback = null
        (web.parent as? ViewGroup)?.removeView(web)
        web.destroy()
        super.onDestroy()
    }

    companion object {
        private const val TAG = "Breeq"
        private const val BRIDGE_NAME = "BreeqAndroid"
        private const val SPLASH_MAX_MS = 5_000L

        /** Where a tap on the share row goes: the network's own app, or the browser. */
        private val HANDOFF_HOSTS = setOf(
            "x.com", "twitter.com", "facebook.com", "fb.com", "m.me",
            "wa.me", "whatsapp.com", "t.me", "telegram.me", "telegram.org",
            "instagram.com", "tiktok.com", "youtube.com", "youtu.be", "discord.gg", "discord.com",
            "play.google.com",
        )

        /**
         * Injected after every load: reports the page background whenever the theme flips
         * (html[data-theme]) so the system bars keep matching. Survives client-side navigation.
         */
        private val CHROME_OBSERVER_JS = """
            (function () {
              if (window.__breeqChrome) return;
              window.__breeqChrome = true;
              var send = function () {
                try {
                  var c = getComputedStyle(document.body).backgroundColor;
                  if (!c || c === 'rgba(0, 0, 0, 0)' || c === 'transparent') c = getComputedStyle(document.documentElement).backgroundColor;
                  $BRIDGE_NAME.setChrome(c);
                } catch (e) {}
              };
              new MutationObserver(send).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class', 'style'] });
              send();
              window.addEventListener('pageshow', send);
            })();
        """.trimIndent()

        /** `rgb(r, g, b)` / `rgba(r, g, b, a)` / `#rrggbb` → opaque color int. */
        internal fun parseCssColor(value: String): Int? {
            val v = value.trim()
            if (v.startsWith("#")) return try { Color.parseColor(v) or (0xFF shl 24) } catch (_: IllegalArgumentException) { null }
            val m = Regex("""rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)""").find(v) ?: return null
            val (r, g, b) = m.destructured
            return Color.rgb(r.toInt().coerceIn(0, 255), g.toInt().coerceIn(0, 255), b.toInt().coerceIn(0, 255))
        }
    }
}
