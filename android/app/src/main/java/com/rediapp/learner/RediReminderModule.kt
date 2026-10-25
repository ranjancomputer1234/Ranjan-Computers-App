package com.rediapp.learner

import android.Manifest
import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import org.json.JSONArray
import org.json.JSONObject
import java.util.Calendar

private const val CHANNEL_ID = "redi_reminders"
private const val PREFS = "redi_reminder_schedule"
private const val DAILY = "daily"
private const val ONCE = "once"
private const val EXTRA_ID = "identifier"
private const val EXTRA_TITLE = "title"
private const val EXTRA_BODY = "body"
private const val EXTRA_DAILY = "daily"

private object RediReminderScheduler {
  private fun alarmManager(context: Context) = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

  private fun requestCode(identifier: String) = identifier.hashCode() and 0x7fffffff

  private fun alarmIntent(
    context: Context,
    identifier: String,
    title: String = "",
    body: String = "",
    daily: Boolean = false,
  ): PendingIntent {
    val intent = Intent(context, RediReminderReceiver::class.java).apply {
      putExtra(EXTRA_ID, identifier)
      putExtra(EXTRA_TITLE, title)
      putExtra(EXTRA_BODY, body)
      putExtra(EXTRA_DAILY, daily)
    }
    return PendingIntent.getBroadcast(
      context,
      requestCode(identifier),
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
  }

  private fun nextOccurrence(hour: Int, minute: Int): Long {
    val now = Calendar.getInstance()
    val next = Calendar.getInstance().apply {
      set(Calendar.HOUR_OF_DAY, hour)
      set(Calendar.MINUTE, minute)
      set(Calendar.SECOND, 0)
      set(Calendar.MILLISECOND, 0)
      if (timeInMillis <= now.timeInMillis) add(Calendar.DAY_OF_YEAR, 1)
    }
    return next.timeInMillis
  }

  fun scheduleDaily(
    context: Context,
    identifier: String,
    hour: Int,
    minute: Int,
    title: String,
    body: String,
    persist: Boolean = true,
  ): Boolean {
    if (hour !in 0..23 || minute !in 0..59) return false
    val alarm = alarmIntent(context, identifier, title, body, true)
    alarmManager(context).setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, nextOccurrence(hour, minute), alarm)
    if (persist) {
      val value = JSONObject()
        .put("id", identifier)
        .put("hour", hour)
        .put("minute", minute)
        .put("title", title)
        .put("body", body)
      context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString(DAILY, value.toString()).apply()
    }
    return true
  }

  fun scheduleOnce(
    context: Context,
    identifier: String,
    timestampMs: Long,
    title: String,
    body: String,
    persist: Boolean = true,
  ): Boolean {
    if (timestampMs <= System.currentTimeMillis()) return false
    alarmManager(context).setAndAllowWhileIdle(
      AlarmManager.RTC_WAKEUP,
      timestampMs,
      alarmIntent(context, identifier, title, body),
    )
    if (persist) updateOneTime(context, identifier) { items ->
      items.put(JSONObject().put("id", identifier).put("at", timestampMs).put("title", title).put("body", body))
    }
    return true
  }

  fun cancel(context: Context, identifier: String) {
    alarmManager(context).cancel(alarmIntent(context, identifier))
    val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    val daily = prefs.getString(DAILY, null)
    if (daily != null && runCatching { JSONObject(daily).optString("id") }.getOrNull() == identifier) {
      prefs.edit().remove(DAILY).apply()
    }
    updateOneTime(context, identifier) { }
  }

  private fun updateOneTime(context: Context, removeId: String, append: (JSONArray) -> Unit) {
    val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    val existing = runCatching { JSONArray(prefs.getString(ONCE, "[]")) }.getOrDefault(JSONArray())
    val next = JSONArray()
    for (index in 0 until existing.length()) {
      val item = existing.optJSONObject(index) ?: continue
      if (item.optString("id") != removeId) next.put(item)
    }
    append(next)
    prefs.edit().putString(ONCE, next.toString()).apply()
  }

  fun removeDeliveredOneTime(context: Context, identifier: String) = updateOneTime(context, identifier) { }

  fun restore(context: Context) {
    val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    prefs.getString(DAILY, null)?.let { raw ->
      runCatching {
        val item = JSONObject(raw)
        scheduleDaily(
          context,
          item.getString("id"),
          item.getInt("hour"),
          item.getInt("minute"),
          item.getString("title"),
          item.getString("body"),
          false,
        )
      }
    }
    val existing = runCatching { JSONArray(prefs.getString(ONCE, "[]")) }.getOrDefault(JSONArray())
    val future = JSONArray()
    for (index in 0 until existing.length()) {
      val item = existing.optJSONObject(index) ?: continue
      val scheduled = scheduleOnce(
        context,
        item.optString("id"),
        item.optLong("at"),
        item.optString("title"),
        item.optString("body"),
        false,
      )
      if (scheduled) future.put(item)
    }
    prefs.edit().putString(ONCE, future.toString()).apply()
  }

  fun rescheduleDailyAfterDelivery(context: Context) {
    val raw = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(DAILY, null) ?: return
    runCatching {
      val item = JSONObject(raw)
      scheduleDaily(
        context,
        item.getString("id"),
        item.getInt("hour"),
        item.getInt("minute"),
        item.getString("title"),
        item.getString("body"),
        false,
      )
    }
  }
}

class RediReminderReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val identifier = intent.getStringExtra(EXTRA_ID) ?: return
    val title = intent.getStringExtra(EXTRA_TITLE).orEmpty()
    val body = intent.getStringExtra(EXTRA_BODY).orEmpty()
    val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      manager.createNotificationChannel(
        NotificationChannel(CHANNEL_ID, "Learning reminders", NotificationManager.IMPORTANCE_DEFAULT).apply {
          description = "Study plans and upcoming live classes"
        },
      )
    }
    val launch = context.packageManager.getLaunchIntentForPackage(context.packageName)?.apply {
      flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
    }
    val contentIntent = launch?.let {
      PendingIntent.getActivity(
        context,
        requestCodeForNotification(identifier),
        it,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
      )
    }
    val notification = NotificationCompat.Builder(context, CHANNEL_ID)
      .setSmallIcon(context.applicationInfo.icon)
      .setContentTitle(title)
      .setContentText(body)
      .setStyle(NotificationCompat.BigTextStyle().bigText(body))
      .setAutoCancel(true)
      .setPriority(NotificationCompat.PRIORITY_DEFAULT)
      .setContentIntent(contentIntent)
      .build()
    if (
      Build.VERSION.SDK_INT < 33 ||
      ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED
    ) {
      NotificationManagerCompat.from(context).notify(requestCodeForNotification(identifier), notification)
    }
    if (intent.getBooleanExtra(EXTRA_DAILY, false)) RediReminderScheduler.rescheduleDailyAfterDelivery(context)
    else RediReminderScheduler.removeDeliveredOneTime(context, identifier)
  }

  private fun requestCodeForNotification(identifier: String) = identifier.hashCode() and 0x7fffffff
}

class RediReminderRestoreReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (
      intent.action == Intent.ACTION_BOOT_COMPLETED ||
      intent.action == Intent.ACTION_TIME_CHANGED ||
      intent.action == Intent.ACTION_TIMEZONE_CHANGED
    ) {
      RediReminderScheduler.restore(context)
    }
  }
}

class RediReminderModule(context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  override fun getName() = "RediReminders"

  @ReactMethod
  fun permissionStatus(promise: Promise) {
    val enabled = NotificationManagerCompat.from(reactApplicationContext).areNotificationsEnabled()
    promise.resolve(if (enabled) "authorized" else "denied")
  }

  @ReactMethod
  fun requestPermission(promise: Promise) {
    // Android 13+ permission is requested through PermissionsAndroid in JS.
    permissionStatus(promise)
  }

  @ReactMethod
  fun scheduleDaily(identifier: String, hour: Double, minute: Double, title: String, body: String, promise: Promise) {
    try {
      promise.resolve(RediReminderScheduler.scheduleDaily(reactApplicationContext, identifier, hour.toInt(), minute.toInt(), title, body))
    } catch (error: Exception) {
      promise.reject("reminder_schedule_failed", "Could not schedule the daily reminder.", error)
    }
  }

  @ReactMethod
  fun scheduleOnce(identifier: String, timestampMs: Double, title: String, body: String, promise: Promise) {
    try {
      promise.resolve(RediReminderScheduler.scheduleOnce(reactApplicationContext, identifier, timestampMs.toLong(), title, body))
    } catch (error: Exception) {
      promise.reject("reminder_schedule_failed", "Could not schedule the class reminder.", error)
    }
  }

  @ReactMethod
  fun cancel(identifier: String, promise: Promise) {
    try {
      RediReminderScheduler.cancel(reactApplicationContext, identifier)
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("reminder_cancel_failed", "Could not cancel the reminder.", error)
    }
  }
}
