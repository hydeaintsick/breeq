package com.breeq.breeq

import android.app.Application
import android.content.Context
import android.util.Log
import com.onesignal.OneSignal
import com.onesignal.debug.LogLevel
import com.onesignal.notifications.INotificationClickEvent
import com.onesignal.notifications.INotificationClickListener
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import java.lang.ref.WeakReference

/**
 * OneSignal for the native shell. The page asks, after the first story chapter;
 * this class only starts the SDK and shows the system permission dialog when
 * the page says so. No prompt on launch.
 */
object BreeqPush {
    private const val TAG = "Breeq"
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
    private val appIdPattern =
        Regex("^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$")
    private val userIdPattern = Regex("^[a-fA-F0-9]{24}$")

    @Volatile
    var ready: Boolean = false
        private set

    private var opener: WeakReference<MainActivity>? = null
    private var live = false
    private var pendingUrl: String? = null

    fun attach(activity: MainActivity) {
        opener = WeakReference(activity)
    }

    fun markLive() {
        live = true
    }

    fun detach(activity: MainActivity) {
        if (opener?.get() === activity) {
            opener = null
            live = false
        }
    }

    fun consumePending(): String? {
        val url = pendingUrl
        pendingUrl = null
        return url
    }

    /** Idempotent. A blank id does nothing, so a build made before the key still runs. */
    fun start(context: Context, appId: String): Boolean {
        val id = appId.trim()
        if (!appIdPattern.matches(id)) return ready
        if (ready) return true
        synchronized(this) {
            if (ready) return true
            if (BuildConfig.DEBUG) OneSignal.Debug.logLevel = LogLevel.VERBOSE
            OneSignal.initWithContext(context.applicationContext, id)
            OneSignal.Notifications.addClickListener(object : INotificationClickListener {
                override fun onClick(event: INotificationClickEvent) {
                    val url = event.notification.launchURL ?: return
                    deliver(url)
                }
            })
            ready = true
        }
        return true
    }

    fun enable(userId: String, onResult: (Boolean) -> Unit) {
        val id = userId.trim()
        if (!ready || !userIdPattern.matches(id)) {
            onResult(false)
            return
        }
        scope.launch {
            val accepted = try {
                OneSignal.Notifications.requestPermission(false)
            } catch (error: Exception) {
                Log.w(TAG, "notification permission", error)
                false
            }
            if (accepted) OneSignal.login(id)
            onResult(accepted)
        }
    }

    fun disable() {
        if (!ready) return
        OneSignal.User.pushSubscription.optOut()
    }

    fun link(userId: String) {
        val id = userId.trim()
        if (!ready || !userIdPattern.matches(id)) return
        OneSignal.login(id)
    }

    private fun deliver(url: String) {
        val activity = opener?.get()
        if (activity != null && live) activity.runOnUiThread { activity.openFromPush(url) }
        else pendingUrl = url
    }
}

class BreeqApp : Application() {
    override fun onCreate() {
        super.onCreate()
        BreeqPush.start(this, BuildConfig.ONESIGNAL_APP_ID)
    }
}
