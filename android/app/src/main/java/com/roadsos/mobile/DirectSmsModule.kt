package com.roadsos.mobile

import android.Manifest
import android.app.PendingIntent
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.telephony.SmsManager
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray

/**
 * Sends SMS messages directly through Android's [SmsManager], bypassing the
 * system composer. Used by RoadSoS for true one-tap SOS — the user already
 * confirmed via the in-app countdown, so a second confirmation in Messages
 * defeats the purpose.
 *
 * Caveats:
 *  - Requires the SEND_SMS runtime permission (declared in AndroidManifest).
 *  - Google Play disallows non-default-SMS-handler apps from sending SMS for
 *    distribution on the Store. RoadSoS is intended for sideloaded /
 *    enterprise-distributed installs in this hackathon configuration.
 */
class DirectSmsModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = MODULE_NAME

    /**
     * Whether the SEND_SMS permission has been granted. SMS_SEND uses a runtime
     * dangerous permission on API 23+; the app must request it from the user.
     */
    @ReactMethod
    fun isPermissionGranted(promise: Promise) {
        try {
            val ctx = reactApplicationContext
            val granted = ContextCompat.checkSelfPermission(ctx, Manifest.permission.SEND_SMS) ==
                PackageManager.PERMISSION_GRANTED
            promise.resolve(granted)
        } catch (err: Throwable) {
            promise.reject(ERR_UNKNOWN, err.message ?: "permission check failed", err)
        }
    }

    /**
     * Send a single SMS body to each phone number in [phones]. Returns once
     * all messages have been handed to the radio (delivery is asynchronous —
     * the radio confirms each segment via PendingIntent, but we don't wait on
     * those callbacks to keep the SOS flow snappy).
     *
     * Long messages are automatically split into multiple segments using
     * [SmsManager.divideMessage].
     */
    @ReactMethod
    fun sendDirect(phones: ReadableArray, message: String, promise: Promise) {
        try {
            val ctx = reactApplicationContext
            val granted = ContextCompat.checkSelfPermission(ctx, Manifest.permission.SEND_SMS) ==
                PackageManager.PERMISSION_GRANTED
            if (!granted) {
                promise.reject(ERR_PERMISSION_DENIED, "SEND_SMS permission not granted")
                return
            }

            val manager: SmsManager = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                ctx.getSystemService(SmsManager::class.java)
            } else {
                @Suppress("DEPRECATION")
                SmsManager.getDefault()
            }

            val sentResults = Arguments.createArray()
            val parts = manager.divideMessage(message)

            for (i in 0 until phones.size()) {
                val phone = phones.getString(i) ?: continue
                val result = Arguments.createMap()
                result.putString("phone", phone)
                try {
                    if (parts.size <= 1) {
                        manager.sendTextMessage(phone, null, message, makeSentIntent(), null)
                    } else {
                        val sentIntents = ArrayList<PendingIntent?>(parts.size)
                        for (j in parts.indices) sentIntents.add(makeSentIntent())
                        manager.sendMultipartTextMessage(phone, null, parts, sentIntents, null)
                    }
                    result.putBoolean("ok", true)
                } catch (sendErr: Throwable) {
                    result.putBoolean("ok", false)
                    result.putString("error", sendErr.message ?: "send failed")
                }
                sentResults.pushMap(result)
            }
            promise.resolve(sentResults)
        } catch (err: Throwable) {
            promise.reject(ERR_UNKNOWN, err.message ?: "direct sms failed", err)
        }
    }

    private fun makeSentIntent(): PendingIntent? = try {
        val ctx = reactApplicationContext
        val intent = Intent(SENT_ACTION).setPackage(ctx.packageName)
        val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        } else {
            PendingIntent.FLAG_UPDATE_CURRENT
        }
        PendingIntent.getBroadcast(ctx, 0, intent, flags)
    } catch (_: Throwable) {
        null
    }

    companion object {
        const val MODULE_NAME = "RoadSoSDirectSms"
        private const val SENT_ACTION = "com.roadsos.mobile.SMS_SENT"
        private const val ERR_PERMISSION_DENIED = "ERR_PERMISSION_DENIED"
        private const val ERR_UNKNOWN = "ERR_UNKNOWN"
    }
}
