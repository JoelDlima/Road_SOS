package com.roadsos.mobile

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.PowerManager
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.telephony.SmsManager
import androidx.core.app.NotificationCompat
import com.facebook.react.bridge.ReactContext
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.net.HttpURLConnection
import java.net.URL
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sqrt

class CrashDetectionService : Service(), SensorEventListener {

    companion object {
        const val CHANNEL_SERVICE  = "roadsos_service_v2"
        const val CHANNEL_CRASH    = "roadsos_crash_v2"
        const val NOTIF_ID_SERVICE = 2001
        const val NOTIF_ID_CRASH   = 2002

        const val ACTION_START            = "com.roadsos.mobile.CRASH_START"
        const val ACTION_STOP             = "com.roadsos.mobile.CRASH_STOP"
        const val ACTION_UPDATE           = "com.roadsos.mobile.CRASH_UPDATE"
        const val ACTION_STOP_VIBRATION   = "com.roadsos.mobile.CRASH_STOP_VIB"
        const val ACTION_CANCEL_COUNTDOWN = "com.roadsos.mobile.CRASH_CANCEL"
        const val ACTION_SEND_NOW         = "com.roadsos.mobile.CRASH_SEND_NOW"
        const val ACTION_SIMULATE         = "com.roadsos.mobile.CRASH_SIMULATE"

        const val EXTRA_MODE        = "mode"
        const val EXTRA_SENSITIVITY = "sensitivity"

        const val PREF_FILE            = "roadsos_crash_prefs"
        const val PREF_CRASH_TIME      = "pending_crash_time"
        const val PREF_CONTACTS        = "emergency_contacts"
        const val PREF_CONTACT_NAMES   = "emergency_contact_names"
        const val PREF_LOCATION_LAT    = "last_lat"
        const val PREF_LOCATION_LNG    = "last_lng"
        const val PREF_LOCATION_ADDR   = "last_addr"
        const val PREF_USER_NAME       = "user_name"

        const val EVENT_CRASH_DETECTED = "RoadSoSCrashDetected"

        private const val UPDATE_INTERVAL_US  = 50_000   // 20 Hz
        private const val EMA_ALPHA           = 0.08f
        private const val COUNTDOWN_SECONDS   = 15

        private val DRIVE = mapOf(
            "low"    to Triple(25f, 5.0f, 3.5f),
            "medium" to Triple(15f, 4.0f, 3.0f),
            "high"   to Triple(10f, 3.2f, 2.5f),
        )
        private val WALK = mapOf(
            "low"    to 4.0f,
            "medium" to 3.0f,
            "high"   to 2.2f,
        )

        private const val DRIVE_CONFIRM_MS  = 80L
        private const val WALK_CONFIRM_MS   = 150L
        private const val CRASH_COOLDOWN_MS = 30_000L
    }

    // ── Hardware ──────────────────────────────────────────────────────────

    private lateinit var sensorManager: SensorManager
    private var accelerometer: Sensor? = null
    private var wakeLock: PowerManager.WakeLock? = null
    private var vibrator: Vibrator? = null

    // ── Mode ──────────────────────────────────────────────────────────────

    @Volatile private var mode        = "normal"
    @Volatile private var sensitivity = "medium"

    // ── Sensor algorithm state ────────────────────────────────────────────

    private var prevMagG        = 1.0f
    private var emaG            = 1.0f
    private var prevTimestampMs = System.currentTimeMillis()
    private var impactStartMs: Long? = null
    private var lastCrashMs     = 0L
    private var lastGForce      = 0f
    private var lastJerkGs      = 0f

    // ── Countdown state ───────────────────────────────────────────────────

    private val countdownHandler = Handler(Looper.getMainLooper())
    private var countdownRemaining = 0
    private var countdownActive = false

    // ── Lifecycle ─────────────────────────────────────────────────────────

    override fun onCreate() {
        super.onCreate()
        sensorManager = getSystemService(Context.SENSOR_SERVICE) as SensorManager
        accelerometer = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
        vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            (getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager).defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        }
        createNotificationChannels()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_STOP -> {
                cancelCountdown()
                vibrator?.cancel()
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf()
                return START_NOT_STICKY
            }
            ACTION_STOP_VIBRATION -> {
                vibrator?.cancel()
                return START_STICKY
            }
            ACTION_CANCEL_COUNTDOWN -> {
                cancelCountdown()
                return START_STICKY
            }
            ACTION_SEND_NOW -> {
                // Skip the rest of the countdown and fire the SOS right now.
                if (countdownActive) {
                    countdownActive = false
                    countdownHandler.removeCallbacksAndMessages(null)
                    executeSOS()
                }
                return START_STICKY
            }
            ACTION_SIMULATE -> {
                // Dev/testing — run the full crash flow without a real impact.
                startForeground(NOTIF_ID_SERVICE, buildServiceNotification())
                if (!countdownActive) dispatchCrash()
                return START_STICKY
            }
            ACTION_UPDATE -> {
                intent.getStringExtra(EXTRA_MODE)?.let        { mode        = it }
                intent.getStringExtra(EXTRA_SENSITIVITY)?.let { sensitivity = it }
                startForeground(NOTIF_ID_SERVICE, buildServiceNotification())
                return START_STICKY
            }
            else -> {
                intent?.getStringExtra(EXTRA_MODE)?.let        { mode        = it }
                intent?.getStringExtra(EXTRA_SENSITIVITY)?.let { sensitivity = it }
            }
        }

        startForeground(NOTIF_ID_SERVICE, buildServiceNotification())

        val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
        wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "roadsos:crash_detection")
            .apply { acquire(12 * 60 * 60 * 1000L) }

        accelerometer?.also { sensor ->
            sensorManager.registerListener(this, sensor, UPDATE_INTERVAL_US)
        }

        return START_STICKY
    }

    override fun onDestroy() {
        cancelCountdown()
        sensorManager.unregisterListener(this)
        wakeLock?.let { if (it.isHeld) it.release() }
        vibrator?.cancel()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    // ── Sensor callback ───────────────────────────────────────────────────

    override fun onSensorChanged(event: SensorEvent) {
        if (event.sensor.type != Sensor.TYPE_ACCELEROMETER) return

        val x = event.values[0]; val y = event.values[1]; val z = event.values[2]
        val rawMag = sqrt((x * x + y * y + z * z).toDouble()).toFloat()
        val magG   = rawMag / SensorManager.GRAVITY_EARTH

        val now   = System.currentTimeMillis()
        val dtSec = min(max((now - prevTimestampMs) / 1000f, 0.01f), 0.5f)
        prevTimestampMs = now

        emaG = EMA_ALPHA * magG + (1f - EMA_ALPHA) * emaG
        val jerkGs = abs(magG - prevMagG) / dtSec
        prevMagG = magG

        lastGForce  = magG
        lastJerkGs  = jerkGs

        val isCrash = if (mode == "drive") {
            val cfg = DRIVE[sensitivity] ?: DRIVE["medium"]!!
            val ratio = magG / max(emaG, 0.5f)
            magG > cfg.third && ratio > cfg.second && jerkGs > cfg.first
        } else {
            val threshold = WALK[sensitivity] ?: WALK["medium"]!!
            magG > threshold
        }

        val confirmMs = if (mode == "drive") DRIVE_CONFIRM_MS else WALK_CONFIRM_MS

        if (isCrash) {
            val start = impactStartMs
            if (start == null) {
                impactStartMs = now
            } else if (now - start >= confirmMs) {
                if (now - lastCrashMs > CRASH_COOLDOWN_MS) {
                    lastCrashMs   = now
                    impactStartMs = null
                    dispatchCrash()
                }
            }
        } else {
            impactStartMs = null
        }
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}

    // ── Crash dispatch ────────────────────────────────────────────────────

    private fun dispatchCrash() {
        // Persist timestamp so JS can also pick it up on resume
        getSharedPreferences(PREF_FILE, Context.MODE_PRIVATE)
            .edit()
            .putLong(PREF_CRASH_TIME, System.currentTimeMillis())
            .apply()

        // Emit to JS if React context is alive
        tryEmitToJS()

        // Start repeating vibration
        val pattern = longArrayOf(0, 600, 300)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator?.vibrate(VibrationEffect.createWaveform(pattern, 0))
        } else {
            @Suppress("DEPRECATION")
            vibrator?.vibrate(pattern, 0)
        }

        // Start the native 15-second countdown (handles Supabase + SMS + final notif)
        startCountdown()
    }

    // ── Countdown ─────────────────────────────────────────────────────────

    private fun startCountdown() {
        countdownRemaining = COUNTDOWN_SECONDS
        countdownActive    = true
        showCountdownNotification(countdownRemaining)
        scheduleNextTick()
    }

    private fun scheduleNextTick() {
        countdownHandler.postDelayed({
            if (!countdownActive) return@postDelayed
            countdownRemaining--
            if (countdownRemaining <= 0) {
                countdownActive = false
                executeSOS()
            } else {
                showCountdownNotification(countdownRemaining)
                scheduleNextTick()
            }
        }, 1000L)
    }

    private fun cancelCountdown() {
        countdownActive = false
        countdownHandler.removeCallbacksAndMessages(null)
        vibrator?.cancel()
        val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        nm.cancel(NOTIF_ID_CRASH)
        showResultNotification("SOS Cancelled", "Crash alert stopped. Stay safe.", false)
    }

    // ── SOS execution (runs when countdown hits 0) ─────────────────────────

    private fun executeSOS() {
        vibrator?.cancel()

        // Run network + SMS on a background thread
        Thread {
            val logSent = sendCrashLogToSupabase()
            val smsSent = sendEmergencySMS()
            Handler(Looper.getMainLooper()).post {
                val title = buildResultTitle(logSent, smsSent)
                val body  = buildResultBody(logSent, smsSent)
                showResultNotification(title, body, true)
            }
        }.start()
    }

    // ── Supabase HTTP ─────────────────────────────────────────────────────

    private fun sendCrashLogToSupabase(): Boolean {
        return try {
            val prefs = getSharedPreferences(PREF_FILE, Context.MODE_PRIVATE)
            val latRaw = prefs.getString(PREF_LOCATION_LAT, "") ?: ""
            val lngRaw = prefs.getString(PREF_LOCATION_LNG, "") ?: ""
            val addr   = (prefs.getString(PREF_LOCATION_ADDR, "") ?: "").replace("\"", "'")
            val iso    = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).format(Date())
            val addrJson = if (addr.isBlank()) "null" else "\"$addr\""
            // Write null (not 0,0) when no GPS fix is on record — a 0,0 row
            // would pin the crash to the ocean on the responder dashboard.
            val hasLoc  = isValidCoord(latRaw) && isValidCoord(lngRaw)
            val latJson = if (hasLoc) latRaw else "null"
            val lngJson = if (hasLoc) lngRaw else "null"

            val json = """{"mode":"$mode","sensitivity":"$sensitivity","g_force":${lastGForce.toBigDecimal().toPlainString()},"jerk_gs":${lastJerkGs.toBigDecimal().toPlainString()},"latitude":$latJson,"longitude":$lngJson,"address":$addrJson,"device_platform":"android","detected_at":"$iso","outcome":null}"""

            val url  = URL("${BuildConfig.SUPABASE_URL}/rest/v1/crash_logs")
            val conn = url.openConnection() as HttpURLConnection
            conn.requestMethod = "POST"
            conn.setRequestProperty("Content-Type", "application/json")
            conn.setRequestProperty("apikey", BuildConfig.SUPABASE_ANON_KEY)
            conn.setRequestProperty("Authorization", "Bearer ${BuildConfig.SUPABASE_ANON_KEY}")
            conn.setRequestProperty("Prefer", "return=minimal")
            conn.doOutput = true
            conn.connectTimeout = 8_000
            conn.readTimeout    = 8_000
            conn.outputStream.use { it.write(json.toByteArray(Charsets.UTF_8)) }
            val code = conn.responseCode
            conn.disconnect()
            code in 200..299
        } catch (_: Exception) {
            false
        }
    }

    // ── Emergency SMS ─────────────────────────────────────────────────────

    private fun sendEmergencySMS(): Boolean {
        return try {
            val prefs   = getSharedPreferences(PREF_FILE, Context.MODE_PRIVATE)
            val phones  = (prefs.getString(PREF_CONTACTS, "") ?: "")
                .split(",").map { it.trim() }.filter { it.isNotBlank() }
            if (phones.isEmpty()) return false

            val latRaw = prefs.getString(PREF_LOCATION_LAT, "") ?: ""
            val lngRaw = prefs.getString(PREF_LOCATION_LNG, "") ?: ""
            val addr   = prefs.getString(PREF_LOCATION_ADDR, "") ?: ""
            val name   = prefs.getString(PREF_USER_NAME, "RoadSoS User") ?: "RoadSoS User"
            val hasLoc = isValidCoord(latRaw) && isValidCoord(lngRaw)
            val locStr = when {
                addr.isNotBlank() -> addr
                hasLoc            -> "$latRaw, $lngRaw"
                else              -> "location unavailable — call back immediately"
            }
            val mapLine = if (hasLoc) "\nMap: https://maps.google.com/?q=$latRaw,$lngRaw" else ""
            val message =
                "🚨 EMERGENCY: $name may need help!\n" +
                "Location: $locStr\n" +
                "Triggered: auto crash detection" + mapLine

            val smsManager: SmsManager = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                getSystemService(SmsManager::class.java)
            } else {
                @Suppress("DEPRECATION")
                SmsManager.getDefault()
            }

            val parts = smsManager.divideMessage(message)
            var anySent = false
            phones.forEach { phone ->
                try {
                    if (parts.size <= 1) {
                        smsManager.sendTextMessage(phone, null, message, null, null)
                    } else {
                        smsManager.sendMultipartTextMessage(phone, null, parts, null, null)
                    }
                    anySent = true
                } catch (_: Exception) {}
            }
            anySent
        } catch (_: Exception) {
            false
        }
    }

    /** A stored coordinate is usable only if it parses and isn't the 0,0 default. */
    private fun isValidCoord(raw: String): Boolean {
        val v = raw.toDoubleOrNull() ?: return false
        return v != 0.0
    }

    // ── Notifications ─────────────────────────────────────────────────────

    private fun showCountdownNotification(seconds: Int) {
        val cancelPi = cancelPendingIntent()
        val notif = NotificationCompat.Builder(this, CHANNEL_CRASH)
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setContentTitle("⚠️ Impact detected!")
            .setContentText("Sending SOS in ${seconds}s. Tap Cancel to stop.")
            .setSubText("$seconds")
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setVibrate(longArrayOf(0))
            .setContentIntent(launchPendingIntent())
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Cancel SOS", cancelPi)
            .setFullScreenIntent(launchPendingIntent(), true)
            .build()

        val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        nm.notify(NOTIF_ID_CRASH, notif)
    }

    private fun showResultNotification(title: String, body: String, success: Boolean) {
        val icon = if (success) android.R.drawable.ic_dialog_info else android.R.drawable.ic_dialog_alert
        val notif = NotificationCompat.Builder(this, CHANNEL_CRASH)
            .setSmallIcon(icon)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(launchPendingIntent())
            .build()

        val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        nm.cancel(NOTIF_ID_CRASH)
        nm.notify(NOTIF_ID_CRASH, notif)
    }

    private fun buildResultTitle(logSent: Boolean, smsSent: Boolean): String = when {
        logSent && smsSent -> "✅ SOS sent!"
        smsSent            -> "📱 SMS sent!"
        logSent            -> "📡 Crash logged!"
        else               -> "⚠️ SOS attempted"
    }

    private fun buildResultBody(logSent: Boolean, smsSent: Boolean): String {
        val parts = mutableListOf<String>()
        if (logSent)  parts.add("Crash log sent to dashboard")
        if (smsSent)  parts.add("SMS sent to emergency contacts")
        if (!logSent) parts.add("Crash log: offline (check connection)")
        if (!smsSent) parts.add("SMS: no contacts or permission denied")
        return parts.joinToString("\n")
    }

    private fun buildServiceNotification(): Notification {
        val label = if (mode == "drive") "Drive Mode Active" else "Normal Mode Active"
        return NotificationCompat.Builder(this, CHANNEL_SERVICE)
            .setSmallIcon(android.R.drawable.ic_menu_compass)
            .setContentTitle("RoadSoS")
            .setContentText("$label — crash detection running")
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setContentIntent(launchPendingIntent())
            .setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE)
            .build()
    }

    private fun cancelPendingIntent(): PendingIntent {
        val intent = Intent(this, CrashDetectionService::class.java).apply {
            action = ACTION_CANCEL_COUNTDOWN
        }
        val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M)
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        else PendingIntent.FLAG_UPDATE_CURRENT
        return PendingIntent.getService(this, 1, intent, flags)
    }

    private fun launchPendingIntent(): PendingIntent {
        val intent = packageManager.getLaunchIntentForPackage(packageName)
            ?.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP)
        val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M)
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        else PendingIntent.FLAG_UPDATE_CURRENT
        return PendingIntent.getActivity(this, 0, intent, flags)
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        nm.createNotificationChannel(NotificationChannel(
            CHANNEL_SERVICE, "RoadSoS Active", NotificationManager.IMPORTANCE_LOW
        ).apply {
            description = "Shown while crash detection is running in the background"
            setShowBadge(false)
        })
        nm.createNotificationChannel(NotificationChannel(
            CHANNEL_CRASH, "Crash Alerts", NotificationManager.IMPORTANCE_HIGH
        ).apply {
            description = "Fired immediately when an impact is detected"
            enableVibration(false) // vibration handled manually for looping
        })
    }

    // ── JS bridge ─────────────────────────────────────────────────────────

    private fun tryEmitToJS() {
        val app = applicationContext as? MainApplication ?: return
        val mgr = try { app.reactNativeHost.reactInstanceManager } catch (_: Exception) { return }
        val ctx: ReactContext = mgr.currentReactContext ?: return
        if (!ctx.hasActiveCatalystInstance()) return
        ctx.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            ?.emit(EVENT_CRASH_DETECTED, null)
    }
}
