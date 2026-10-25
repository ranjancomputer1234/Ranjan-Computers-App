package com.rediapp.learner

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.firebase.installations.FirebaseInstallations
import com.google.firebase.messaging.FirebaseMessaging
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import java.lang.ref.WeakReference

private const val NOTIFICATION_PREFS = "redi_notification_preferences"
private const val ENABLED_CATEGORIES = "enabled_categories"
private const val OPEN_EVENT = "notificationOpened"
private const val TOKEN_EVENT = "pushTokenChanged"
private const val EXTRA_NOTIFICATION_ID = "redi.notification.id"
private const val EXTRA_CATEGORY = "redi.notification.category"
private const val EXTRA_TARGET_KIND = "redi.notification.targetKind"
private const val EXTRA_TARGET_ID = "redi.notification.targetId"
private const val NOTIFICATION_GROUP = "redi_updates"

private data class RediPushPayload(
  val id: String,
  val title: String,
  val body: String,
  val category: String,
  val targetKind: String?,
  val targetId: String?,
  val sentAt: Long,
)

private object RediNotificationPresenter {
  private data class ChannelSpec(val id: String, val name: String, val description: String, val importance: Int)

  private val channels = mapOf(
    "classes" to ChannelSpec("redi_classes", "Classes", "Live classes and schedule changes", NotificationManager.IMPORTANCE_HIGH),
    "tests" to ChannelSpec("redi_tests", "Tests", "Tests, quizzes, results and deadlines", NotificationManager.IMPORTANCE_DEFAULT),
    "news" to ChannelSpec("redi_news", "Learning updates", "New learning material and institute news", NotificationManager.IMPORTANCE_DEFAULT),
    "offers" to ChannelSpec("redi_offers", "Offers", "Optional course offers from REDI", NotificationManager.IMPORTANCE_LOW),
    "system" to ChannelSpec("redi_account", "Account and service", "Important account, payment and service messages", NotificationManager.IMPORTANCE_HIGH),
  )

  fun createChannels(context: Context) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    channels.values.forEach { spec ->
      manager.createNotificationChannel(
        NotificationChannel(spec.id, spec.name, spec.importance).apply {
          description = spec.description
          enableVibration(spec.importance >= NotificationManager.IMPORTANCE_DEFAULT)
        },
      )
    }
  }

  fun show(context: Context, payload: RediPushPayload) {
    if (!isAllowed(context, payload.category)) return
    if (
      Build.VERSION.SDK_INT >= 33 &&
      ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
    ) return

    createChannels(context)
    val channel = channels[payload.category] ?: channels.getValue("system")
    val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)?.apply {
      flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
      putExtra(EXTRA_NOTIFICATION_ID, payload.id)
      putExtra(EXTRA_CATEGORY, payload.category)
      payload.targetKind?.let { putExtra(EXTRA_TARGET_KIND, it) }
      payload.targetId?.let { putExtra(EXTRA_TARGET_ID, it) }
    }
    val contentIntent = launchIntent?.let {
      PendingIntent.getActivity(
        context,
        payload.id.hashCode() and 0x7fffffff,
        it,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
      )
    }
    val priority = if (channel.importance == NotificationManager.IMPORTANCE_HIGH) {
      NotificationCompat.PRIORITY_HIGH
    } else {
      NotificationCompat.PRIORITY_DEFAULT
    }
    val notification = NotificationCompat.Builder(context, channel.id)
      .setSmallIcon(R.drawable.ic_stat_redi)
      .setColor(Color.parseColor("#1976D2"))
      .setContentTitle(payload.title.take(120))
      .setContentText(payload.body.take(240))
      .setStyle(NotificationCompat.BigTextStyle().bigText(payload.body.take(1000)))
      .setCategory(NotificationCompat.CATEGORY_MESSAGE)
      .setGroup(NOTIFICATION_GROUP)
      .setAutoCancel(true)
      .setVisibility(NotificationCompat.VISIBILITY_PRIVATE)
      .setPriority(priority)
      .setWhen(payload.sentAt)
      .setShowWhen(true)
      .setContentIntent(contentIntent)
      .build()
    NotificationManagerCompat.from(context).notify(payload.id.hashCode() and 0x7fffffff, notification)
  }

  private fun isAllowed(context: Context, category: String): Boolean {
    if (category == "system") return true
    val enabled = context.getSharedPreferences(NOTIFICATION_PREFS, Context.MODE_PRIVATE)
      .getStringSet(ENABLED_CATEGORIES, null)
      ?: return true
    return enabled.contains(category)
  }
}

class RediFirebaseMessagingService : FirebaseMessagingService() {
  override fun onRegistered(fid: String) {
    RediNotificationsModule.handleNewInstallationId(fid)
  }

  override fun onMessageReceived(message: RemoteMessage) {
    val data = message.data
    val title = data["title"] ?: message.notification?.title ?: return
    val body = data["body"] ?: message.notification?.body ?: return
    val id = data["notificationId"] ?: message.messageId ?: return
    val category = data["category"]?.takeIf { it in setOf("classes", "tests", "news", "offers", "system") } ?: "system"
    val sentAt = data["sentAt"]?.toLongOrNull() ?: message.sentTime.takeIf { it > 0 } ?: System.currentTimeMillis()
    RediNotificationPresenter.show(
      this,
      RediPushPayload(id, title, body, category, data["targetKind"], data["targetId"], sentAt),
    )
  }
}

class RediNotificationsModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  init {
    activeModule = WeakReference(this)
  }

  override fun getName() = "RediNotifications"

  @ReactMethod
  fun isSupported(promise: Promise) = promise.resolve(BuildConfig.REDI_FIREBASE_ENABLED)

  @ReactMethod
  fun getInstallationId(promise: Promise) {
    if (!BuildConfig.REDI_FIREBASE_ENABLED) {
      promise.resolve(null)
      return
    }
    runCatching { FirebaseMessaging.getInstance().register() }
      .onSuccess { task ->
        task.addOnSuccessListener {
          FirebaseInstallations.getInstance().id
            .addOnSuccessListener { promise.resolve(it) }
            .addOnFailureListener { promise.reject("push_id_failed", "Could not get the Firebase installation ID.", it) }
        }
          .addOnFailureListener { promise.reject("push_token_failed", "Could not get a notification token.", it) }
      }
      .onFailure { promise.reject("push_unavailable", "Firebase is not configured for this build.", it) }
  }

  @ReactMethod
  fun unregister(promise: Promise) {
    if (!BuildConfig.REDI_FIREBASE_ENABLED) {
      promise.resolve(null)
      return
    }
    runCatching { FirebaseMessaging.getInstance().unregister() }
      .onSuccess { task ->
        task.addOnSuccessListener { promise.resolve(null) }
          .addOnFailureListener { promise.reject("push_token_delete_failed", "Could not remove the notification token.", it) }
      }
      .onFailure { promise.resolve(null) }
  }

  @ReactMethod
  fun configureCategories(categories: ReadableArray, promise: Promise) {
    val allowed = setOf("classes", "tests", "news", "offers")
    val enabled = mutableSetOf<String>()
    for (index in 0 until categories.size()) {
      categories.getString(index)?.takeIf { it in allowed }?.let(enabled::add)
    }
    context.getSharedPreferences(NOTIFICATION_PREFS, Context.MODE_PRIVATE)
      .edit().putStringSet(ENABLED_CATEGORIES, enabled).apply()
    promise.resolve(null)
  }

  @ReactMethod
  fun getInitialNotification(promise: Promise) {
    val intent = context.currentActivity?.intent
    val payload = intent?.let(::payloadFromIntent)
    if (payload != null) clearNotificationExtras(intent)
    promise.resolve(payload)
  }

  @ReactMethod fun addListener(eventName: String) = Unit
  @ReactMethod fun removeListeners(count: Double) = Unit

  private fun emit(payload: WritableMap) {
    if (!context.hasActiveReactInstance()) {
      pendingOpened = payload
      return
    }
    context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java).emit(OPEN_EVENT, payload)
  }

  companion object {
    private var activeModule: WeakReference<RediNotificationsModule>? = null
    private var pendingOpened: WritableMap? = null

    fun createChannels(context: Context) = RediNotificationPresenter.createChannels(context)

    fun handleNotificationIntent(intent: Intent) {
      val payload = payloadFromIntent(intent) ?: return
      clearNotificationExtras(intent)
      val module = activeModule?.get()
      if (module == null) pendingOpened = payload else module.emit(payload)
    }

    fun handleNewInstallationId(fid: String) {
      val module = activeModule?.get() ?: return
      if (!module.context.hasActiveReactInstance()) return
      module.context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        .emit(TOKEN_EVENT, fid)
    }

    private fun payloadFromIntent(intent: Intent): WritableMap? {
      val id = intent.getStringExtra(EXTRA_NOTIFICATION_ID) ?: return pendingOpened.also { pendingOpened = null }
      return Arguments.createMap().apply {
        putString("notificationId", id)
        putString("category", intent.getStringExtra(EXTRA_CATEGORY) ?: "system")
        intent.getStringExtra(EXTRA_TARGET_KIND)?.let { putString("targetKind", it) }
        intent.getStringExtra(EXTRA_TARGET_ID)?.let { putString("targetId", it) }
      }
    }

    private fun clearNotificationExtras(intent: Intent) {
      intent.removeExtra(EXTRA_NOTIFICATION_ID)
      intent.removeExtra(EXTRA_CATEGORY)
      intent.removeExtra(EXTRA_TARGET_KIND)
      intent.removeExtra(EXTRA_TARGET_ID)
    }
  }
}
